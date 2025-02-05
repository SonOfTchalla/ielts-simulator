const practiceModeButton = document.getElementById('practice-mode');
const testModeButton = document.getElementById('test-mode');
const testInterface = document.getElementById('test-interface');
const questionElement = document.getElementById('question');
const startRecordingButton = document.getElementById('start-recording');
const transcriptElement = document.getElementById('transcript');
const feedbackElement = document.getElementById('feedback');
const timerElement = document.getElementById('timer');
const scoresElement = document.getElementById('scores');
const partElement = document.getElementById('part');

let recorder;
let audioChunks = [];
let timer;
let timeLeft = 120; // 2 minutes for Part 2 of the test

// State variables
let currentMode = null; // 'practice' or 'test'
let practiceState = {
    currentQuestionIndex: 0,
    audioBlobs: []
};
let testState = {
    part1: [],
    part2: [],
    part3: [],
    audioBlobs: [],
    currentPart: 1,
    currentQuestionIndex: 0
};

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

// Event listeners
practiceModeButton.addEventListener('click', startPracticeSession);
testModeButton.addEventListener('click', startTestSession);

// Start recording
startRecordingButton.addEventListener('click', async () => {
    if (currentMode === 'practice') {
        await handlePracticeRecording();
    } else if (currentMode === 'test') {
        await handleTestRecording();
    }
});

// Handles recording in practice mode
async function handlePracticeRecording() {
    if (recorder && recorder.state === 'recording') {
        await new Promise(resolve => {
            recorder.onstop = resolve;
            recorder.stop();
        });
        
        startRecordingButton.textContent = 'Start Recording';
        await processPracticeAudio();
    } else {
        audioChunks = [];
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => audioChunks.push(e.data);
        recorder.start();
        startRecordingButton.textContent = 'Stop Recording';
    }
}

// Handles recording in practice mode
async function handleTestRecording() {
    if (recorder && recorder.state === 'recording') {
        // Stop recording
        await new Promise(resolve => {
            recorder.onstop = resolve;
            recorder.stop();
        });
        
        startRecordingButton.textContent = 'Start Recording';

        // Process the recorded audio
        await processTestAudio();

        // Move to the next question automatically (except in Part 2)
        if (testState.currentPart !== 2) {
            showNextTestQuestion();
        }
    } else {
        // Start recording
        audioChunks = [];
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => audioChunks.push(e.data);
        recorder.onstop = () => {}; // No immediate processing for test mode
        recorder.start();
        startRecordingButton.textContent = 'Stop Recording';
    }
}

// Add a "Download Report" button
const downloadReportButton = document.createElement('button');
downloadReportButton.textContent = 'Download Report';
downloadReportButton.id = 'download-report';
downloadReportButton.disabled = true; // Disabled by default
document.querySelector('#test-interface').appendChild(downloadReportButton);

async function processPracticeAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    if (audioBlob.size === 0) {
        console.error("Audio blob is empty!");
        return;
    }

    practiceState.audioBlobs = [audioBlob]; // Only keep last recording
    
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    
    // Get immediate feedback
    const response = await fetch('/analyze-practice', {
        method: 'POST',
        body: formData
    });
    
    const result = await response.json();
    showPracticeFeedback(result);
}

// Add a restart button for practice mode
let restartButton = document.createElement("button");
restartButton.id = "restart";
restartButton.textContent = "Restart";

// Shows feedback in practice mode
function showPracticeFeedback(result) {
    transcriptElement.textContent = `Transcript: ${result.transcript}`;
    feedbackElement.textContent = `Feedback: ${result.feedback}`;
    
    // Auto-advance or manual advance
    if (practiceState.currentQuestionIndex < part1Questions.length - 1) {
        setTimeout(() => {
            practiceState.currentQuestionIndex++;
            showNextPracticeQuestion();
        }, 30000); // Auto-advance after 30 seconds
    }else{
        restartButton.classList.remove('hidden');
        testInterface.appendChild(restartButton);
        restartButton.addEventListener('click', startPracticeSession)
    }
}

function showNextPracticeQuestion() {
    questionElement.textContent = part1Questions[practiceState.currentQuestionIndex];
    transcriptElement.textContent = '';
    feedbackElement.textContent = '';
    scoresElement.textContent = '';
}

// Process recorded audio in test mode
async function processTestAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    if (audioBlob.size === 0) {
        console.error("Audio blob is empty!");
        return;
    }

    testState.audioBlobs.push(audioBlob);
    
    // Store transcript temporarily without feedback
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    
    const response = await fetch('/transcribe', {
        method: 'POST',
        body: formData
    });
    const result = await response.json();
    
    // Store transcript based on current part
    switch(testState.currentPart) {
        case 1: testState.part1.push(result.transcript); break;
        case 2: testState.part2.push(result.transcript); break;
        case 3: testState.part3.push(result.transcript); break;
    }
}

// Submit full test session
async function submitFullTest() {
    const response = await fetch('/analyze-full-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            part1: testState.part1,
            part2: testState.part2,
            part3: testState.part3
        })
    });
    
    const result = await response.json();
    showFinalFeedback(result);
}

// Show final feedback
function showFinalFeedback(result) {
    transcriptElement.textContent = `Full Session Transcript:\n${result.fullTranscript}`;
    feedbackElement.textContent = `Final Feedback:\n${result.feedback}`;
    displayScores(result.scores);
    downloadReportButton.disabled = false;
    downloadReportButton.classList.remove('hidden');
    downloadReportButton.addEventListener('click', () => {
        generatePDFReport(result.fullTranscript, result.feedback ,result.scores);
    })
}

// Start a practice session
function startPracticeSession() {
    partElement.textContent = '';
    practiceModeButton.classList.add('selected');
    testModeButton.classList.remove('selected');
    currentMode = 'practice';
    practiceState = {
        currentQuestionIndex: 0,
        audioBlobs: []
    };
    testInterface.classList.remove('hidden');
    timerElement.style.display = 'none';
    downloadReportButton.classList.add('hidden');
    nextQuestionButton.classList.add('hidden');
    restartButton.classList.add('hidden');
    showNextPracticeQuestion();
}

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `Time Left: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            alert('Time is up!');
            showNextTestQuestion(); // Move to the next question automatically
        }
    }, 1000);
}

// Start a full test session
function startTestSession() {
    testModeButton.classList.add('selected');
    practiceModeButton.classList.remove('selected');
    currentMode = 'test';
    testState = {
        part1: [],
        part2: [],
        part3: [],
        audioBlobs: [],
        currentPart: 1,
        currentQuestionIndex: 0
    };
    testInterface.classList.remove('hidden');
    nextQuestionButton.classList.add('hidden');
    downloadReportButton.classList.add('hidden');
    showNextTestQuestion();
}

// Move to the next question
function showNextTestQuestion() {
    partElement.textContent =  `Part ${testState.currentPart}`;
    if (testState.currentPart === 1 && testState.currentQuestionIndex < part1Questions.length) {
        // Part 1: Show next question
        questionElement.textContent = part1Questions[testState.currentQuestionIndex];
        testState.currentQuestionIndex++;
    } else if (testState.currentPart === 2 && testState.currentQuestionIndex < part2Questions.length) {
        // Part 2: Show the long turn question and start the timer
        questionElement.textContent = part2Questions[testState.currentQuestionIndex];
        timerElement.style.display = 'block'; // Show the timer
        startTimer(); // Start the timer
        nextQuestionButton.classList.remove('hidden');
    } else if (testState.currentPart === 3 && testState.currentQuestionIndex < part3Questions.length) {
        // Part 3: Show next question
        questionElement.textContent = part3Questions[testState.currentQuestionIndex];
        testState.currentQuestionIndex++;
        timerElement.style.display = 'none';
        nextQuestionButton.classList.add("hidden");
    } else {
        // Move to the next part or end the test
        if (testState.currentPart < 3) {
            testState.currentPart++;
            testState.currentQuestionIndex = 0;
            showNextTestQuestion(); // Show the first question of the next part
        } else {
            // End of test: Submit all responses for feedback
            submitFullTest();
        }
    }
}

// Add a "Next Question" button
const nextQuestionButton = document.createElement('button');
nextQuestionButton.textContent = 'Next Question';
nextQuestionButton.id = 'next-question';
nextQuestionButton.addEventListener('click', () => {
    if (testState.currentPart === 2 && timer) {
        clearInterval(timer); // Stop the timer if moving from Part 2
        testState.currentQuestionIndex++;
    }
    showNextTestQuestion();
});
document.querySelector('#test-interface').appendChild(nextQuestionButton);


function generatePDFReport(transcript, feedback, scores) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Constants for layout
    const margin = 10;
    const lineHeight = 7;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Add title
    doc.setFontSize(18);
    doc.text('IELTS Speaking Test Report', margin, yPosition);
    yPosition += lineHeight * 2; // Add extra space after title

    // Add transcript section
    doc.setFontSize(14);
    doc.text('Transcript:', margin, yPosition);
    yPosition += lineHeight;

    doc.setFontSize(12);
    const transcriptLines = doc.splitTextToSize(transcript, maxLineWidth);
    transcriptLines.forEach(line => {
        if (yPosition > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage(); // Add new page if content exceeds page height
            yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
    });
    yPosition += lineHeight; // Add extra space after transcript

    // Add feedback section
    doc.setFontSize(14);
    doc.text('Feedback:', margin, yPosition);
    yPosition += lineHeight;

    doc.setFontSize(12);
    const feedbackLines = doc.splitTextToSize(feedback, maxLineWidth);
    feedbackLines.forEach(line => {
        if (yPosition > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
    });
    yPosition += lineHeight; // Add extra space after feedback

    // Add scores section
    doc.setFontSize(14);
    doc.text('Scores:', margin, yPosition);
    yPosition += lineHeight;

    doc.setFontSize(12);
    const scoresText = [
        `Fluency & Coherence: ${scores.fluency}`,
        `Lexical Resource: ${scores.lexical}`,
        `Grammatical Range & Accuracy: ${scores.grammar}`,
        `Pronunciation: ${scores.pronunciation}`,
        `Overall Band Score: ${((scores.fluency + scores.lexical + scores.grammar + scores.pronunciation) / 4).toFixed(1)}`
    ];
    scoresText.forEach(line => {
        if (yPosition > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
    });

    // Save the PDF
    doc.save('ielts_speaking_report.pdf');
}


function displayScores(scores) {
    const overallScore = ((scores.fluency + scores.lexical + scores.grammar + scores.pronunciation) / 4).toFixed(1);
    scoresElement.textContent = `Scores: Fluency (${scores.fluency}), Lexical (${scores.lexical}), Grammar (${scores.grammar}), Pronunciation (${scores.pronunciation}), Overall (${overallScore})`;
    if(scoresElement.classList.contains('hidden')){
    scoresElement.classList.remove('hidden');
    }
}