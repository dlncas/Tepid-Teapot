// 1. DATA: Add your real Tepid Teapot questions here!
const questions = [
    {
        question: "In the 2024 Teapot contest, which shape won 'Most Aerodynamic'?",
        image: "images/teapot.jpg", // Optional: Delete this line if you have no image
        answers: [
            { text: "The Sphere", correct: false },
            { text: "The Flat Spout", correct: true },
            { text: "The Cube", correct: false },
            { text: "The Pyramid", correct: false },
        ]
    },
    {
        question: "What is the optimal water temperature for Earl Grey?",
        // No image property here, so it will just show text
        answers: [
            { text: "100°C (Boiling)", correct: false },
            { text: "90-95°C", correct: true },
            { text: "80°C", correct: false },
            { text: "Ice Cold", correct: false },
        ]
    },
    {
        question: "Which country consumes the most tea per capita?",
        answers: [
            { text: "United Kingdom", correct: false },
            { text: "China", correct: false },
            { text: "Turkey", correct: true },
            { text: "India", correct: false },
        ]
    }
];

// 2. DOM Elements
const questionNumberText = document.getElementById("question-number");
const questionText = document.getElementById("question-text");
const questionImage = document.getElementById("question-image");
const answerButtons = document.getElementById("answer-buttons");
const nextButton = document.getElementById("next-btn");
const timerElement = document.getElementById("timer");
const startTimerBtn = document.getElementById("start-timer-btn");
const progressBar = document.getElementById("progress-bar");
const tickSound = document.getElementById("tick-sound");
const alarmSound = document.getElementById("alarm-sound");

// Leaderboard Elements
const leaderboardSection = document.getElementById("leaderboard-section");
const highScoresList = document.getElementById("high-scores-list");
const usernameInput = document.getElementById("username");
const saveScoreBtn = document.getElementById("save-score-btn");
const restartBtn = document.getElementById("restart-btn");

let currentQuestionIndex = 0;
let score = 0;
let timeLeft = 10;
let timerInterval;
const MAX_HIGH_SCORES = 5;

// 3. Main Functions

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    leaderboardSection.style.display = "none";
    nextButton.innerHTML = "Next";
    showQuestionPlaceholder();
}

function showQuestionPlaceholder() {
    resetState();
    updateProgressBar();
    
    // Show Big Number
    questionNumberText.style.display = "block";
    questionNumberText.innerHTML = "Question " + (currentQuestionIndex + 1);
    
    // Ensure button is ready
    startTimerBtn.innerHTML = "Reveal Question";
    startTimerBtn.style.display = "block";
}

function revealQuestion() {
    startTimerBtn.style.display = "none";
    questionNumberText.style.display = "none"; // Hide big number
    
    questionText.style.display = "block";
    answerButtons.style.display = "block";

    let currentQuestion = questions[currentQuestionIndex];
    questionText.innerHTML = (currentQuestionIndex + 1) + ". " + currentQuestion.question;

    // Handle Image
    if (currentQuestion.image) {
        questionImage.src = currentQuestion.image;
        questionImage.style.display = "block";
    } else {
        questionImage.style.display = "none";
    }

    // Create Buttons
    currentQuestion.answers.forEach(answer => {
        const button = document.createElement("button");
        button.innerHTML = answer.text;
        button.classList.add("btn");
        answerButtons.appendChild(button);
        if(answer.correct) button.dataset.correct = answer.correct;
        button.addEventListener("click", selectAnswer);
    });

    startTimer();
}

function resetState() {
    nextButton.style.display = "none";
    startTimerBtn.style.display = "block";
    answerButtons.style.display = "none";
    questionText.style.display = "none";
    questionImage.style.display = "none";
    
    clearInterval(timerInterval);
    stopSounds();
    timeLeft = 10;
    timerElement.innerHTML = `Time Left: ${timeLeft}s`;
    timerElement.style.color = "#5d6d7e";
    timerElement.style.borderColor = "#90caf9";
    
    while(answerButtons.firstChild) {
        answerButtons.removeChild(answerButtons.firstChild);
    }
}

// 4. Timer & Sound Logic
startTimerBtn.addEventListener("click", revealQuestion);

function startTimer() {
    try { tickSound.play().catch(e => console.log("Audio play failed (no interaction yet)")); } catch(e){}
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.innerHTML = `Time Left: ${timeLeft}s`;
        
        if (timeLeft < 4) {
             timerElement.style.color = "#c0392b";
             timerElement.style.borderColor = "#c0392b";
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeUp();
        }
    }, 1000);
}

function stopSounds() {
    tickSound.pause();
    tickSound.currentTime = 0;
    alarmSound.pause();
    alarmSound.currentTime = 0;
}

function handleTimeUp() {
    stopSounds();
    try { alarmSound.play(); } catch(e){}

    Array.from(answerButtons.children).forEach(button => {
        button.disabled = true;
    });
    nextButton.style.display = "block";
}

function selectAnswer(e) {
    clearInterval(timerInterval);
    stopSounds();
    
    const selectedBtn = e.target;
    const isCorrect = selectedBtn.dataset.correct === "true";
    if(isCorrect) {
        selectedBtn.classList.add("correct");
        score++;
    } else {
        selectedBtn.classList.add("incorrect");
    }

    Array.from(answerButtons.children).forEach(button => {
        button.disabled = true;
    });
    nextButton.style.display = "block";
}

// 5. Progress Bar
function updateProgressBar() {
    const progress = ((currentQuestionIndex) / questions.length) * 100;
    progressBar.style.width = `${progress}%`;
}

// 6. Ending & Leaderboard
function handleNextButton() {
    currentQuestionIndex++;
    if(currentQuestionIndex < questions.length) {
        timerElement.style.display = "inline-block";
        showQuestionPlaceholder();
    } else {
        showScore();
    }
}

function showScore() {
    resetState();
    startTimerBtn.style.display = "none";
    timerElement.style.display = "none";
    questionNumberText.style.display = "none";
    
    leaderboardSection.style.display = "block";
    showHighScores();
}

// 7. Local Storage Leaderboard Logic
const highScores = JSON.parse(localStorage.getItem("tepidTeapotHighScores")) || [];

function showHighScores() {
    highScoresList.innerHTML = highScores
        .map(score => `<li><span>${score.name}</span> <span>${score.score}</span></li>`)
        .join("");
        
    // Enable save button only if they type a name
    usernameInput.addEventListener('keyup', () => {
        saveScoreBtn.disabled = !usernameInput.value;
    });
}

saveScoreBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const scoreData = {
        score: score,
        name: usernameInput.value
    };

    highScores.push(scoreData);
    highScores.sort((a, b) => b.score - a.score); // Sort highest first
    highScores.splice(5); // Keep only top 5

    localStorage.setItem("tepidTeapotHighScores", JSON.stringify(highScores));
    
    showHighScores(); // Refresh list
    usernameInput.value = ""; // Clear input
    saveScoreBtn.disabled = true; // Disable button again
});

restartBtn.addEventListener("click", () => {
    startQuiz();
});

nextButton.addEventListener("click", () => {
    if(currentQuestionIndex < questions.length) {
        handleNextButton();
    } else {
        startQuiz();
    }
});

// Start
startQuiz();
