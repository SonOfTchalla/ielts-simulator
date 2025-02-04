# IELTS Speaking Test Simulator

## Overview
This tool simulates a real-time IELTS Speaking Test. It allows users to practice speaking English and provides performance assessments based on IELTS criteria.

## Features
- Real-time transcription using Google Speech-to-Text API.
- Feedback on fluency, vocabulary, grammar, and pronunciation using Falcon-7B-Instruct.
- Practice and Test modes.
- Downloadable PDF report.

## Setup
1. Clone the repository.
2. Install dependencies: `npm install express multer axios @google-cloud/speech`.
3. Add your API keys in `server.js`.
4. Run the server: `node server.js`.
5. Open `index.html` in your browser.

## APIs Used
- Google Speech-to-Text API for transcription.
- Falcon-7B-Instruct via Hugging Face for feedback generation.

## Deployment
- Frontend: Host on Vercel.
- Backend: Deploy using Docker on Fly.io.

## Challenges and Solutions
1. **Real-Time Transcription Delay**: Use streaming transcription and optimize audio format.
2. **Pronunciation Feedback**: Use OpenAI Whisper or Praat for advanced feedback.
3. **API Costs**: Use free-tier APIs or open-source alternatives.
4. **User Experience**: Add a timer and progress tracker.
5. **Deployment**: Use Docker for containerization and deploy on Fly.io.