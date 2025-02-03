const express = require('express');
const multer = require('multer');
const axios = require('axios');
const app = express();
const upload = multer({ dest: 'uploads/' });

require('dotenv').config();

//API Keys
const SPEECH_TO_TEXT_API_KEY = process.env.OPENAI_API_KEY;
const LLM_API_KEY = process.env.STT_API_KEY;

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
    const client = new speech.SpeechClient({ keyFilename: SPEECH_TO_TEXT_API_KEY });

    const audio = {
        content: require('fs').readFileSync(filePath).toString('base64'),
    };
    const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
    };
    const request = { audio, config };

    const [response] = await client.recognize(request);
    return response.results.map(result => result.alternatives[0].transcript).join('\n');
}