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

## Design Choices

### 1. LLM Integration
- **Model**: Falcon-7B-Instruct (via Hugging Face Inference API).
- **Purpose**: Evaluate user responses based on IELTS band descriptors.
- **Prompt Design**:
  - The model is prompted to evaluate responses and provide scores in a specific format:
    ```
    fluency: [score]
    lexical: [score]
    grammar: [score]
    pronunciation: [score]
    ```
  - The response is parsed to extract scores and feedback.

### 2. Scoring System
- **Criteria**:
  - Fluency & Coherence
  - Lexical Resource
  - Grammatical Range & Accuracy
  - Pronunciation
- **Scoring Logic**:
  - Scores are provided by the LLM based on the transcript.
  - The overall band score is calculated as the average of the four scores.

### 3. APIs Used
- **Google Speech-to-Text API**:
  - Converts user audio into text for analysis.
- **Hugging Face Inference API**:
  - Hosts the Falcon-7B-Instruct model for evaluating responses.
- **jsPDF**:
  - Generates a downloadable PDF report.

---
## Setup
1. Clone the repository.
2. Install dependencies: `npm install express multer axios @google-cloud/speech`.
3. Add your API keys in `server.js`.
4. Run the server: `node server.js`.
5. Open `index.html` in your browser.


## Challenges and Solutions

### 1. Model Response Format
- **Challenge**: The Falcon-7B-Instruct model sometimes returns responses in an unexpected format (e.g., numbered lists or additional text).
- **Solution**:
  - Normalize the response by removing numbering and irrelevant text.
  - Use a key-mapping system to extract scores from the response.

### 2. Text Overlapping in PDF
- **Challenge**: Long text in the PDF report caused overlapping and poor readability.
- **Solution**:
  - Use `doc.splitTextToSize()` to wrap text within the page width.
  - Dynamically calculate the Y-position for each line and add page breaks when necessary.

### 3. Real-Time Transcription Delay
- **Challenge**: Delays in transcription affected the user experience.
- **Solution**:
  - Optimize the audio format (e.g., use `audio/webm` instead of `audio/wav`).
  - Streamline the backend processing to minimize latency.

### 4. Mode Separation
- **Challenge**: Practice Mode and Test Mode had overlapping functionality, causing bugs.
- **Solution**:
  - Separate state management for each mode using dedicated objects (`practiceState` and `testState`).
  - Implement distinct logic for processing and feedback in each mode.

---