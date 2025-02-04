require('dotenv').config(); // Load environment variables
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');  //For handling file paths
const app = express();
const upload = multer({ dest: 'uploads/' });

// Serve static files from the "frontend" directory
app.use(express.static(path.join(__dirname, 'frontend')));

//API Keys
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;


// Endpoint to analyze audio
app.post('/analyze', upload.single('file'), async (req, res) => {
    const filePath = req.file.path;

    // Step 1: Transcribe audio using Google Speech-to-Text API
    const transcript = await transcribeAudio(filePath);

    // Step 2: Analyze transcript using LLM API
    const feedback = await analyzeTranscript(transcript);

    res.json({ transcript, feedback });
});

// Transcribe audio using Google Speech-to-Text API
async function transcribeAudio(filePath) {
    const speech = require('@google-cloud/speech');
    const client = new speech.SpeechClient();

    const audio = {
        content: require('fs').readFileSync(filePath).toString('base64'),
    };
    const config = {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'en-US',
    };
    const request = { audio, config };

    const [response] = await client.recognize(request);
    return response.results.map(result => result.alternatives[0].transcript).join('\n');
}

// Analyze transcript using HUgging Face API
async function analyzeTranscript(transcript) {
    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct',
            {
                inputs: `You are an IELTS examiner. Provide feedback on fluency, vocabulary, grammar, and pronunciation. User: ${transcript}`,
                parameters: {
                    max_length: 100,
                    temperature: 0.7,
                }
            },
            { headers: { 'Authorization': `Bearer ${HUGGING_FACE_API_KEY}` } }
        );

        // If the model is loading, retry after the estimated time
        if (response.data.error && response.data.error.includes('currently loading')) {
            const estimatedTime = response.data.estimated_time * 1000; // Convert to milliseconds
            console.log(`Model is loading. Retrying in ${estimatedTime / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, estimatedTime));
            return analyzeTranscript(transcript); // Retry the request
        }

        return response.data[0].generated_text;
    } catch (error) {
        console.error('Error calling Hugging Face API:', error.response ? error.response.data : error.message);
        return 'Error: Unable to generate feedback. Please try again.';
    }
}

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});