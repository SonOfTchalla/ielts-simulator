const practiceModeButton = document.getElementById('practice-mode');
const testModeButton = document.getElementById('test-mode');
const testInterface = document.getElementById('test-interface');
const questionElement = document.getElementById('question');
const startRecordingButton = document.getElementById('start-recording');
const transcriptElement = document.getElementById('transcript');
const feedbackElement = document.getElementById('feedback');
const timerElement = document.getElementById('timer');

let recorder;
let audioChunks = [];
let timer;
let timeLeft = 120; // 2 minutes for Part 2 of the test

const part1Questions = [
    "Can you tell me about your hometown?",
    "What do you like most about your job or studies?",
    "Do you prefer reading books or watching movies? Why?",
    "How do you usually spend your weekends?",
    "What kind of weather do you enjoy the most?"
];

const part2Questions = [
    "Describe a memorable trip you have taken. You should say: where you went, who you went with, what you did, and why it was memorable.",
    "Talk about a book that you recently read. You should say: what the book is about, why you chose it, and what you learned from it.",
    "Describe a person who has influenced you. You should say: who the person is, how you know them, and why they have influenced you.",
    "Describe a skill you would like to learn. You should say: what the skill is, why you want to learn it, and how you plan to learn it.",
    "Talk about a piece of art (e.g., painting, sculpture) that you admire. You should say: what it is, where you saw it, and why you admire it."
];

const part3Questions = [
    "How do you think travel can broaden a person's perspective?",
    "Do you think reading books is more beneficial than watching movies? Why or why not?",
    "What qualities do you think make someone a good role model?",
    "How important is it for people to learn new skills throughout their lives?",
    "What role do you think art plays in society?"
];

// Current question index
let currentPart = 1;
let currentQuestionIndex = 0;

// Reset the interface
function resetInterface() {
    transcriptElement.textContent = '';
    feedbackElement.textContent = '';
    timerElement.textContent = 'Time Left: 120s';
    timerElement.classList.add('hidden'); // Hide the timer
    clearInterval(timer); // Clear any active timer
    currentPart = 1; // Reset to Part 1
    currentQuestionIndex = 0; // Reset question index
}

// Initialize the test interface
practiceModeButton.addEventListener('click', () => {
    testInterface.classList.remove('hidden');
    resetInterface(); // Reset fields and hide timer
    startPracticeSession();
});

testModeButton.addEventListener('click', () => {
    testInterface.classList.remove('hidden');
    resetInterface(); // Reset fields
    timerElement.classList.remove('hidden'); // Show the timer
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
    questionElement.textContent = part1Questions[currentQuestionIndex];
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
    if (currentPart === 1) {
        questionElement.textContent = part1Questions[currentQuestionIndex];
    } else if (currentPart === 2) {
        questionElement.textContent = part2Questions[currentQuestionIndex];
        startTimer();
    } else if (currentPart === 3) {
        questionElement.textContent = part3Questions[currentQuestionIndex];
    }
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