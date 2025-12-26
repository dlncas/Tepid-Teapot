// 1. CONFIGURATION
// PASTE YOUR GOOGLE SHEET CSV LINK HERE!
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQkB-VFvdDRm-bWJDxliTPUE3QnOMuCIM9BR7i4ypvX-sp5fwnW3TPFA4KLNBK44qDVfkdvkEdqzQI9/pub?output=csv";

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

let questions = []; // Will be filled from Google Sheets
let currentQuestionIndex = 0;
let score = 0;
let timeLeft = 10;
let timerInterval;

// 3. FETCH DATA & INIT
function initGame() {
    startTimerBtn.innerHTML = "Loading Questions...";
    startTimerBtn.disabled = true;

    Papa.parse(GOOGLE_SHEET_URL, {
        download: true,
        header: true,
        complete: function(results) {
            // Process the CSV data into our format
            questions = results.data
                .filter(row => row.Question) // Remove empty rows
                .map(row => ({
                    question: row.Question,
                    image: row.ImageURL || null,
                    answers: [
                        { text: row.Option1, correct: row.Option1 === row.CorrectAnswer },
                        { text: row.Option2, correct: row.Option2 === row.CorrectAnswer },
                        { text: row.Option3, correct: row.Option3 === row.CorrectAnswer },
                        { text: row.Option4, correct: row.Option4 === row.CorrectAnswer }
                    ]
                }));

            // Shuffle questions (Optional - removes predictability)
            questions.sort(() => Math.random() - 0.5);

            // Ready to start
            startTimerBtn.innerHTML = "Start Quiz";
            startTimerBtn.disabled = false;
            
            // Add click listener now that data is ready
            startTimerBtn.addEventListener("click", startQuiz);
        }
    });
}

// 4. MAIN GAME LOGIC
function startQuiz() {
    // If coming from "Reveal Question" button, handle differently
    if (questions.length === 0) return; 

    // Reset game state
    currentQuestionIndex = 0;
    score = 0;
    leaderboardSection.style.display = "none";
    nextButton.innerHTML = "Next";
    
    // Change button purpose
    startTimerBtn.removeEventListener("click", startQuiz);
    startTimerBtn.addEventListener("click", revealQuestion);
    
    showQuestionPlaceholder();
}

function showQuestionPlaceholder() {
    resetState();
    updateProgressBar();
    
    questionNumberText.style.display = "block";
    questionNumberText.innerHTML = "Question " + (currentQuestionIndex + 1);
    
    startTimerBtn.innerHTML = "Reveal Question";
    startTimerBtn.style.display = "block";
}

function revealQuestion() {
    startTimerBtn.style.display = "none";
    questionNumberText.style.display = "none";
    
    questionText.style.display = "block";
    answerButtons.style.display = "block";

    let currentQuestion = questions[currentQuestionIndex];
    questionText.innerHTML = (currentQuestionIndex + 1) + ". " + currentQuestion.question;

    // Handle Image
    if (currentQuestion.image && currentQuestion.image.trim() !== "") {
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
        if(answer.correct) button.dataset.correct = "true";
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

// 5. Timer & Sounds
function startTimer() {
    try { tickSound.play().catch(e => {}); } catch(e){}
    
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
    if(tickSound) { tickSound.pause(); tickSound.currentTime = 0; }
    if(alarmSound) { alarmSound.pause(); alarmSound.currentTime = 0; }
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

function updateProgressBar() {
    const progress = ((currentQuestionIndex) / questions.length) * 100;
    progressBar.style.width = `${progress}%`;
}

// 6. Navigation & Leaderboard
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

const highScores = JSON.parse(localStorage.getItem("tepidTeapotHighScores")) || [];

function showHighScores() {
    highScoresList.innerHTML = highScores
        .map(score => `<li><span>${score.name}</span> <span>${score.score}</span></li>`)
        .join("");
        
    usernameInput.addEventListener('keyup', () => {
        saveScoreBtn.disabled = !usernameInput.value;
    });
}

saveScoreBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const scoreData = { score: score, name: usernameInput.value };
    highScores.push(scoreData);
    highScores.sort((a, b) => b.score - a.score);
    highScores.splice(5);
    localStorage.setItem("tepidTeapotHighScores", JSON.stringify(highScores));
    
    showHighScores();
    usernameInput.value = "";
    saveScoreBtn.disabled = true;
});

restartBtn.addEventListener("click", () => {
    // Re-fetch questions to get updates or re-shuffle
    initGame();
});

nextButton.addEventListener("click", () => {
    if(currentQuestionIndex < questions.length) {
        handleNextButton();
    } else {
        // Restarting requires re-init to reset listeners correctly
        initGame();
    }
});

// START
initGame();
