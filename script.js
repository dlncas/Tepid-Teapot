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
const nextButton = document.getElementById("next-btn");
const timerElement = document.getElementById("timer");
const startTimerBtn = document.getElementById("start-timer-btn");

let currentQuestionIndex = 0;
let score = 0;
let timeLeft = 10;
let timerInterval;

// 3. Main Functions

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    nextButton.innerHTML = "Next";
    showQuestionPlaceholder();
}

// State 1: Show "Question X" (Big Text, Hidden Answers)
function showQuestionPlaceholder() {
    resetState();
    
    // Add the "Big Number" style class
    questionElement.classList.add("big-number");
    
    // Set text to just the number
    let questionNo = currentQuestionIndex + 1;
    questionElement.innerHTML = "Question " + questionNo;
}

// State 2: Show Actual Question & Answers (Triggered by Button)
function revealQuestion() {
    startTimerBtn.style.display = "none"; // Hide start button
    answerButtons.style.display = "block"; // Show answers
    
    // Remove the "Big Number" style so text looks normal
    questionElement.classList.remove("big-number");
    
    // Insert the actual question text
    let currentQuestion = questions[currentQuestionIndex];
    let questionNo = currentQuestionIndex + 1;
    questionElement.innerHTML = questionNo + ". " + currentQuestion.question;

    // Create the buttons
    currentQuestion.answers.forEach(answer => {
        const button = document.createElement("button");
        button.innerHTML = answer.text;
        button.classList.add("btn");
        answerButtons.appendChild(button);
        
        if(answer.correct) {
            button.dataset.correct = answer.correct;
        }
        button.addEventListener("click", selectAnswer);
    });

    startTimer(); // GO!
}

function resetState() {
    nextButton.style.display = "none";
    startTimerBtn.style.display = "block"; // Ensure start button is visible
    answerButtons.style.display = "none";
    
    clearInterval(timerInterval);
    timeLeft = 10;
    timerElement.innerHTML = `Time Left: ${timeLeft}s`;
    timerElement.style.color = "#5d6d7e";
    timerElement.style.borderColor = "#90caf9";
    
    while(answerButtons.firstChild) {
        answerButtons.removeChild(answerButtons.firstChild);
    }
}

// Button Click Event
startTimerBtn.addEventListener("click", () => {
    revealQuestion();
});

function startTimer() {
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

function handleTimeUp() {
    // Disable buttons
    Array.from(answerButtons.children).forEach(button => {
        button.disabled = true;
    });
    // Show Next button
    nextButton.style.display = "block";
}

function selectAnswer(e) {
    clearInterval(timerInterval);
    
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

function showScore() {
    resetState();
    startTimerBtn.style.display = "none";
    timerElement.style.display = "none";
    questionElement.classList.add("big-number"); // Make score look big
    
    questionElement.innerHTML = `You scored ${score} out of ${questions.length}!`;
    
    nextButton.innerHTML = "Play Again";
    nextButton.style.display = "block";
}

function handleNextButton() {
    currentQuestionIndex++;
    if(currentQuestionIndex < questions.length) {
        timerElement.style.display = "inline-block";
        showQuestionPlaceholder(); // Go back to "Question X" state
    } else {
        showScore();
    }
}

nextButton.addEventListener("click", () => {
    if(currentQuestionIndex < questions.length) {
        handleNextButton();
    } else {
        startQuiz();
    }
});

// Initialize
startQuiz();
