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
const LLM_API_KEY = process.env.OPENAI_API_KEY;


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

// Analyze transcript using OpenAI API
async function analyzeTranscript(transcript) {
    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are an IELTS examiner. Provide feedback on fluency, vocabulary, grammar, and pronunciation.' },
                { role: 'user', content: transcript }
            ]
        },
        { headers: { 'Authorization': `Bearer ${LLM_API_KEY}` } }
    );
    return response.data.choices[0].message.content;
}

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});