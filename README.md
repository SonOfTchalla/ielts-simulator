# IELTS Speaking Test Simulator

## Overview
The IELTS Speaking Test Simulator is a tool designed to help users practice and simulate the IELTS Speaking Test. It provides real-time transcription, feedbackk, and scoring based on IELTS band descriptors. The tool supports two modes:
1. **Practice Mode**: Instant feedback for each response.
2. **Test Mode**: Comprehensive feedback at the end of a full test session.

---

## Key Features
1. **Real-Time Transcription**:
   - Uses Google Speech-to-Text API for accurate transcription of user responses.
2. **Feedback and Scoring**:
   - Provides feedback on fluency, lexical resource, grammar, and pronunciation.
   - Uses Falcon-7B-Instruct (via Hugging Face) for evaluating responses.
3. **PDF Report**:
   - Generates a downloadable PDF report with the transcript, feedback, and scores.
4. **Two Modes**:
   - **Practice Mode**: Instant feedback after each response.
   - **Test Mode**: Full IELTS Speaking Test simulation with feedback at the end.

---

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