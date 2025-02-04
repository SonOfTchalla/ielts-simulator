const practiceModeButton = document.getElementById('practice-mode');
const testModeButton = document.getElementById('test-mode');
const testInterface = document.getElementById('test-interface');
const questionElement = document.getElementById('question');
const startRecordingButton = document.getElementById('start-recording');
const transcriptElement = document.getElementById('transcript');
const feedbackElement = document.getElementById('feedback');

let recorder;
let audioChunks = [];
let timer;
let timeLeft = 120; // 2 minutes for Part 2 of the test

// Load questions for the test
const questions = [
    "Tell me about your hometown.",
    "Describe a book you recently read.",
    "Discuss the importance of education."
];

// Initialize the test interface
practiceModeButton.addEventListener('click', () => {
    testInterface.classList.remove('hidden');
    startPracticeSession();
});

testModeButton.addEventListener('click', () => {
    testInterface.classList.remove('hidden');
    startTestSession();
});

// Start recording
startRecordingButton.addEventListener('click', async () => {
    if (recorder && recorder.state === 'recording') {
        recorder.stop();
        startRecordingButton.textContent = 'Start Recording';
    } else {
        audioChunks = [];
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => audioChunks.push(e.data);
        recorder.onstop = processAudio;
        recorder.start();
        startRecordingButton.textContent = 'Stop Recording';
    }
});

// Process recorded audio
async function processAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');

    // Send audio to the backend for transcription and analysis
    const response = await fetch('/analyze', {
        method: 'POST',
        body: formData
    });
    const result = await response.json();
    transcriptElement.textContent = `Transcript: ${result.transcript}`;
    feedbackElement.textContent = `Feedback: ${result.feedback}`;
}

// Start a practice session
function startPracticeSession() {
    questionElement.textContent = questions[0];
}

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = `Time Left: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            alert('Time is up!');
        }
    }, 1000);
}

// Start a full test session
function startTestSession() {
    testInterface.classList.remove('hidden');
    questionElement.textContent = questions[1]; // Part 2: Long Turn
    startTimer();
}

function generatePDFReport(transcript, feedback) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text('IELTS Speaking Test Report', 10, 10);
    doc.text(`Transcript: ${transcript}`, 10, 20);
    doc.text(`Feedback: ${feedback}`, 10, 30);

    doc.save('ielts_report.pdf');
}

// Call this function after receiving feedback
generatePDFReport(transcriptElement.textContent, feedbackElement.textContent);