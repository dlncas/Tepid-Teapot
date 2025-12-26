// 1. Data
const questions = [
    {
        question: "What does HTML stand for?",
        answers: [
            { text: "Hyper Text Preprocessor", correct: false },
            { text: "Hyper Text Markup Language", correct: true },
            { text: "Hyper Text Multiple Language", correct: false },
            { text: "Hyper Tool Multi Language", correct: false },
        ]
    },
    {
        question: "Which language runs in a web browser?",
        answers: [
            { text: "Java", correct: false },
            { text: "C", correct: false },
            { text: "Python", correct: false },
            { text: "JavaScript", correct: true },
        ]
    },
    {
        question: "What does CSS stand for?",
        answers: [
            { text: "Central Style Sheets", correct: false },
            { text: "Cascading Style Sheets", correct: true },
            { text: "Cascading Simple Sheets", correct: false },
            { text: "Cars SUVs Sailboats", correct: false },
        ]
    }
];

// 2. DOM Elements
const questionElement = document.getElementById("question");
const answerButtons = document.getElementById("answer-buttons");
const coverScreen = document.getElementById("cover-screen");
const qNumberDisplay = document.getElementById("q-number-display");
const timerElement = document.getElementById("timer");

// Buttons
const nextBtn = document.getElementById("next-btn");
const backBtn = document.getElementById("back-btn");
const revealBtn = document.getElementById("reveal-btn");

// Scores
const score1El = document.getElementById("score-1");
const score2El = document.getElementById("score-2");

// 3. State Variables
let currentQuestionIndex = 0;
let team1Score = 0;
let team2Score = 0;
let timer;
let timeLeft = 30; // 30 seconds per question
let state = "HIDDEN"; // Can be: HIDDEN, QUESTION, ANSWER

// 4. Initialization
function startQuiz() {
    currentQuestionIndex = 0;
    loadQuestion();
}

// Loads the question but keeps it hidden initially
function loadQuestion() {
    resetState();
    let currentQuestion = questions[currentQuestionIndex];
    qNumberDisplay.innerText = currentQuestionIndex + 1;
    
    // Set Question Text
    questionElement.innerHTML = `${currentQuestionIndex + 1}. ${currentQuestion.question}`;

    // Create Answer Buttons (A, B, C, D)
    const labels = ['A', 'B', 'C', 'D'];
    currentQuestion.answers.forEach((answer, index) => {
        const button = document.createElement("button");
        // Add label (A, B...) + text
        button.innerHTML = `<b>${labels[index]}</b> ${answer.text}`;
        button.classList.add("btn");
        
        if(answer.correct) {
            button.dataset.correct = answer.correct;
        }
        answerButtons.appendChild(button);
    });

    // Reset UI to "HIDDEN" state
    state = "HIDDEN";
    coverScreen.style.display = "flex"; // Show cover
    revealBtn.innerText = "Reveal Question (Space)";
    revealBtn.disabled = false;
    
    // Reset Timer
    clearInterval(timer);
    timeLeft = 30;
    timerElement.innerText = timeLeft;
    timerElement.style.color = "#d83a3a";
}

function resetState() {
    while(answerButtons.firstChild) {
        answerButtons.removeChild(answerButtons.firstChild);
    }
}

// 5. Core Logic Functions
function handleMainAction() {
    if (state === "HIDDEN") {
        revealQuestion();
    } else if (state === "QUESTION") {
        revealAnswer();
    } else if (state === "ANSWER") {
        navigate(1); // Go to next
    }
}

function revealQuestion() {
    state = "QUESTION";
    coverScreen.style.display = "none"; // Hide cover
    revealBtn.innerText = "Reveal Answer (Space)";
    
    // Start Timer
    startTimer();
}

function revealAnswer() {
    state = "ANSWER";
    clearInterval(timer); // Stop timer
    revealBtn.innerText = "Next Question (Space)";

    // Highlight Correct Answer
    Array.from(answerButtons.children).forEach(button => {
        if(button.dataset.correct === "true") {
            button.classList.add("correct");
        }
    });
}

function navigate(direction) {
    const newIndex = currentQuestionIndex + direction;
    if(newIndex >= 0 && newIndex < questions.length) {
        currentQuestionIndex = newIndex;
        loadQuestion();
    } else {
        alert("End of Quiz!");
    }
}

// Timer Logic
function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        timerElement.innerText = timeLeft;
        if(timeLeft <= 10) {
            timerElement.style.color = "red"; // Warn when low
        }
        if(timeLeft <= 0) {
            clearInterval(timer);
            revealAnswer(); // Auto reveal if time runs out? Or just stop?
        }
    }, 1000);
}

// Score Logic
window.updateScore = function(team, change) {
    if(team === 1) {
        team1Score += change;
        score1El.innerText = team1Score;
    } else {
        team2Score += change;
        score2El.innerText = team2Score;
    }
}

// 6. Event Listeners

// Click Listeners
revealBtn.addEventListener("click", handleMainAction);
nextBtn.addEventListener("click", () => navigate(1));
backBtn.addEventListener("click", () => navigate(-1));

// Keyboard Listeners
document.addEventListener('keydown', (e) => {
    if(e.code === "Space") {
        e.preventDefault(); // Stop page scrolling
        handleMainAction();
    } else if(e.code === "ArrowRight") {
        navigate(1);
    } else if(e.code === "ArrowLeft") {
        navigate(-1);
    }
});

// Start
startQuiz();
