# ielts-simulator

## Overview
This tool simulates a real-time IELTS Speaking Test. It allows users to practice speaking English and provides performance assessments based on IELTS criteria.

## Features
- Real-time transcription using Google Speech-to-Text API.
- Feedback on fluency, vocabulary, grammar, and pronunciation using OpenAI's GPT-4.
- Practice and Test modes.

## Setup
1. Clone the repository.
2. Install dependencies: `npm install express multer axios @google-cloud/speech`.
3. Add your API keys in `server.js`.
4. Run the server: `node server.js`.
5. Open `index.html` in your browser.