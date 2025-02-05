const practiceModeButton = document.getElementById('practice-mode');
const testModeButton = document.getElementById('test-mode');
const testInterface = document.getElementById('test-interface');
const questionElement = document.getElementById('question');
const startRecordingButton = document.getElementById('start-recording');
const transcriptElement = document.getElementById('transcript');
const feedbackElement = document.getElementById('feedback');
const timerElement = document.getElementById('timer');
const scoresElement = document.getElementById('scores');

let recorder;
let audioChunks = [];
let timer;
let timeLeft = 120; // 2 minutes for Part 2 of the test

const part1Questions = [
    "Can you tell me about your hometown?"/*,
    "What do you like most about your job or studies?",
    "Do you prefer reading books or watching movies? Why?",
    "How do you usually spend your weekends?",
    "What kind of weather do you enjoy the most?"*/
];

const part2Questions = [
    "Describe a memorable trip you have taken. You should say: where you went, who you went with, what you did, and why it was memorable."/*,
    "Talk about a book that you recently read. You should say: what the book is about, why you chose it, and what you learned from it.",
    "Describe a person who has influenced you. You should say: who the person is, how you know them, and why they have influenced you.",
    "Describe a skill you would like to learn. You should say: what the skill is, why you want to learn it, and how you plan to learn it.",
    "Talk about a piece of art (e.g., painting, sculpture) that you admire. You should say: what it is, where you saw it, and why you admire it."*/
];

const part3Questions = [
    "How do you think travel can broaden a person's perspective?"/*,
    "Do you think reading books is more beneficial than watching movies? Why or why not?",
    "What qualities do you think make someone a good role model?",
    "How important is it for people to learn new skills throughout their lives?",
    "What role do you think art plays in society?"*/
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
    practiceModeButton.classList.add('selected');
    testModeButton.classList.remove('selected');
});

testModeButton.addEventListener('click', () => {
    testInterface.classList.remove('hidden');
    resetInterface(); // Reset fields
    timerElement.classList.remove('hidden'); // Show the timer
    startTestSession();
    testModeButton.classList.add('selected');
    practiceModeButton.classList.remove('selected');
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

// Add a "Download Report" button
const downloadReportButton = document.createElement('button');
downloadReportButton.textContent = 'Download Report';
downloadReportButton.id = 'download-report';
downloadReportButton.disabled = true; // Disabled by default
document.querySelector('#test-interface').appendChild(downloadReportButton);

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

    // Display transcript and feedback
    transcriptElement.textContent = `Transcript: ${result.transcript}`;
    feedbackElement.textContent = `Feedback: ${result.feedback}`;

    // Enable the "Download Report" button only in Test Mode and after completing all parts
    if (testModeButton.classList.contains('selected') && currentPart === 3 && currentQuestionIndex === part3Questions.length - 1) {
        // Calculate scores
        const scores = result.scores;

        // Enable the "Download Report" button and update its event listener
        downloadReportButton.disabled = false;
        downloadReportButton.onclick = () => {
            generatePDFReport(result.transcript, result.feedback, scores);
        };

        // Display scores in the UI
        displayScores(scores);
    }
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


// Test session state
let testSessionData = {
    part1: [],
    part2: [],
    part3: [],
    audioBlobs: []
};

// Start a full test session
function startTestSession() {
    testSessionData = { part1: [], part2: [], part3: [], audioBlobs: [] };
    currentPart = 1;
    currentQuestionIndex = 0;
    showNextTestQuestion();
}

// Move to the next question
function nextQuestion() {
    if (currentPart === 1) {
        if (currentQuestionIndex < part1Questions.length - 1) {
            currentQuestionIndex++;
            questionElement.textContent = part1Questions[currentQuestionIndex];
        } else {
            currentPart = 2;
            currentQuestionIndex = 0;
            questionElement.textContent = part2Questions[currentQuestionIndex];
            timerElement.style.display = 'block'; // Show timer for Part 2
            startTimer();
        }
    } else if (currentPart === 2) {
        if (currentQuestionIndex < part2Questions.length - 1) {
            currentQuestionIndex++;
            questionElement.textContent = part2Questions[currentQuestionIndex];
        } else {
            currentPart = 3;
            currentQuestionIndex = 0;
            questionElement.textContent = part3Questions[currentQuestionIndex];
            timerElement.style.display = 'none'; // Hide timer for Part 3
            clearInterval(timer); // Stop the timer
        }
    } else if (currentPart === 3) {
        if (currentQuestionIndex < part3Questions.length - 1) {
            currentQuestionIndex++;
            questionElement.textContent = part3Questions[currentQuestionIndex];
        } else {
            alert('Test completed!');
            resetInterface();
        }
    }
}

// Add a "Next Question" button
const nextQuestionButton = document.createElement('button');
nextQuestionButton.textContent = 'Next Question';
nextQuestionButton.id = 'next-question';
nextQuestionButton.addEventListener('click', nextQuestion);
document.querySelector('#test-interface').appendChild(nextQuestionButton);


function generatePDFReport(transcript, feedback ,scores) {
    console.log('Generating PDF...');
    console.log('Transcript:', transcript);
    console.log('Feedback:', feedback);
    console.log('Scores:', scores);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text('IELTS Speaking Test Report', 10, 10);

    // Add transcript
    doc.setFontSize(12);
    doc.text('Transcript:', 10, 20);
    doc.text(transcript, 10, 30, { maxWidth: 180 });

    // Add feedback
    doc.text('Feedback:', 10, 80);
    doc.text(feedback, 10, 90, { maxWidth: 180 });

    // Add scores
    doc.text('Scores:', 10, 140);
    doc.text(`Fluency & Coherence: ${scores.fluency}`, 10, 150);
    doc.text(`Lexical Resource: ${scores.lexical}`, 10, 160);
    doc.text(`Grammatical Range & Accuracy: ${scores.grammar}`, 10, 170);
    doc.text(`Pronunciation: ${scores.pronunciation}`, 10, 180);

    // Calculate overall band score
    const overallScore = ((scores.fluency + scores.lexical + scores.grammar + scores.pronunciation) / 4).toFixed(1);
    doc.text(`Overall Band Score: ${overallScore}`, 10, 190);

    // Save the PDF
    doc.save('ielts_speaking_report.pdf');
}


function displayScores(scores) {
    const overallScore = ((scores.fluency + scores.lexical + scores.grammar + scores.pronunciation) / 4).toFixed(1);
    scoresElement.textContent = `Scores: Fluency (${scores.fluency}), Lexical (${scores.lexical}), Grammar (${scores.grammar}), Pronunciation (${scores.pronunciation}), Overall (${overallScore})`;
}