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
app.post('/analyze-full-test', express.json(), async (req, res) => {
    try {
        const { part1, part2, part3 } = req.body;
        const fullTranscript = [
            "Part 1 Responses:",
            ...part1,
            "\nPart 2 Response:",
            ...part2,
            "\nPart 3 Discussion:",
            ...part3
        ].join('\n');

        // Get comprehensive feedback
        const feedback = await analyzeTranscript(fullTranscript);
        const scores = await calculateScores(fullTranscript);

        res.json({
            fullTranscript,
            feedback,
            scores
        });
    } catch (error) {
        console.error('Error processing full test:', error);
        res.status(500).json({ error: 'Test processing failed' });
    }
});

// Separate transcription endpoint
app.post('/transcribe', upload.single('file'), async (req, res) => {
    try {
        const transcript = await transcribeAudio(req.file.path);
        res.json({ transcript });
    } catch (error) {
        console.error('Transcription error:', error);
        res.status(500).json({ error: 'Transcription failed' });
    }
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
        const inputPrompt = `You are an IELTS examiner. Provide feedback on fluency, vocabulary, grammar, and pronunciation. User: ${transcript}`;

        const response = await axios.post(
            'https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct',
            {
                inputs: inputPrompt,
                parameters: {
                    max_length: 100,
                    temperature: 0.7,
                    return_full_text: false
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

        // Extract just the generated feedback without input text
        const fullResponse = response.data[0].generated_text;
        
        // Remove the input prompt from the response if it appears
        const cleanedResponse = fullResponse.replace(inputPrompt, '').trim();
        
        return cleanedResponse || "Could not generate feedback. Please try again.";
        
    } catch (error) {
        console.error('Error calling Hugging Face API:', error.response ? error.response.data : error.message);
        return 'Error: Unable to generate feedback. Please try again.';
    }
}

// Calculates scores based on the transcript
async function calculateScores(transcript) {
    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct',
            {
                inputs: `Evaluate the following IELTS Speaking Test transcript based on the four IELTS criteria: 
                1. Fluency and Coherence 
                2. Lexical Resource 
                3. Grammatical Range and Accuracy 
                4. Pronunciation 

                Strictly provide scores in the following format, with the scores being from 0-9:
                fluency: [score]
                lexical: [score]
                grammar: [score]
                pronunciation: [score]
                Do not include any additional text or explanations. The scores MUST be numerical.
                Transcript: ${transcript}`,
                parameters: {
                    max_new_tokens: 100, // Limit the response length
                    return_full_text: false, // Only return the generated text
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Extract the generated text from the response
        const generatedText = response.data[0].generated_text;
        console.log('Model Response:', generatedText); // Log the model's response

        // Parse the plain text response into a JSON object
        const scores = {};
        const lines = generatedText.split('\n');
        lines.forEach(line => {
            // Remove numbering (e.g., "1. Fluency: 8" -> "Fluency: 8")
            const normalizedLine = line.replace(/^\d+\.\s*/, '').trim();
            const [key, value] = normalizedLine.split(':').map(item => item.trim());

            // Map the normalized key to the required key
            const keyMapping = {
                'Fluency and Coherence': 'fluency',
                'Lexical Resource': 'lexical',
                'Grammatical Range and Accuracy': 'grammar',
                'Pronunciation': 'pronunciation'
            };

            if (key && value && keyMapping[key]) {
                scores[keyMapping[key]] = parseInt(value, 10); // Convert score to integer
            }
        });

        // Log the parsed scores
        console.log('Parsed Scores:', scores);

        // Ensure all scores are present
        const requiredScores = ['fluency', 'lexical', 'grammar', 'pronunciation'];
        requiredScores.forEach(score => {
            if (!scores[score]) {
                scores[score] = 0; // Fallback score
            }
        });

        return scores;
    } catch (error) {
        console.error('Error calculating scores:', error);
        return { fluency: 0, lexical: 0, grammar: 0, pronunciation: 0 }; // Fallback scores
    }
}

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});