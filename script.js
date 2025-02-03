const practiceModeButton = document.getElementById('practice-mode');
const testModeButton = document.getElementById('test-mode');
const testInterface = document.getElementById('test-interface');
const questionElement = document.getElementById('question');
const startRecordingButton = document.getElementById('start-recording');
const transcriptElement = document.getElementById('transcript');
const feedbackElement = document.getElementById('feedback');

let recorder;
let audioChunks = [];

// Load questions for the test
const questions = [
    "Tell me about your hometown.",
    "Describe a book you recently read.",
    "Discuss the importance of education."
];