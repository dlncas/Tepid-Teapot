// CONFIGURATION
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQkB-VFvdDRm-bWJDxliTPUE3QnOMuCIM9BR7i4ypvX-sp5fwnW3TPFA4KLNBK44qDVfkdvkEdqzQI9/pub?output=csv"; // <--- PASTE LINK HERE
const TEAMS_DEFAULT = ["The Teapots", "Earl Grey's Anatomy", "Brew Crew", "Chai Hards"];

// DOM Elements
const roundIndicator = document.getElementById("round-indicator");
const qCounter = document.getElementById("q-counter");
const timerDisplay = document.getElementById("timer");
const mainText = document.getElementById("main-text");
const qImage = document.getElementById("q-image");
const optionsContainer = document.getElementById("options-container");
const optBoxes = [document.getElementById("opt-1"), document.getElementById("opt-2"), document.getElementById("opt-3"), document.getElementById("opt-4")];
const answerReveal = document.getElementById("answer-reveal");
const correctAnswerText = document.getElementById("correct-answer-text");
const quizCard = document.getElementById("quiz-card");

// Buttons & Inputs
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const btnAction = document.getElementById("btn-action");
const timerInput = document.getElementById("timer-setting");
const addTeamBtn = document.getElementById("add-team-btn");
const resetLbBtn = document.getElementById("reset-lb-btn");
const lbBody = document.getElementById("lb-body");

// Audio
const tickSound = document.getElementById("tick-sound");
const alarmSound = document.getElementById("alarm-sound");

// State
let allQuestions = [];
let rounds = []; // Array of arrays [[10 qs], [10 qs]...]
let currentRoundIdx = 0;
let currentQIdx = 0; // 0 to 9 within a round
let viewState = "ROUND_INTRO"; // States: ROUND_INTRO, QUESTION_HIDDEN, QUESTION_VISIBLE, ANSWER_REVEALED
let timerInterval;

// 1. INITIALIZATION
function init() {
    loadLeaderboard();
    btnAction.innerText = "Loading...";
    btnAction.disabled = true;

    Papa.parse(GOOGLE_SHEET_URL, {
        download: true,
        header: true,
        complete: function(results) {
            processData(results.data);
            btnAction.disabled = false;
            updateDisplay();
        }
    });
}

function processData(data) {
    // 1. Clean Data
    const cleanQs = data.filter(r => r.Question).map(r => ({
        q: r.Question,
        img: r.ImageURL,
        opts: [r.Option1, r.Option2, r.Option3, r.Option4],
        ans: r.CorrectAnswer
    }));

    // 2. Create Rounds (10 Rounds of 10) + Lightning Round
    rounds = [];
    let qCount = 0;
    
    // Create 10 standard rounds
    for (let i = 0; i < 10; i++) {
        if (qCount + 10 <= cleanQs.length) {
            rounds.push(cleanQs.slice(qCount, qCount + 10));
            qCount += 10;
        }
    }
    
    // Put remaining questions in Lightning Round
    if (qCount < cleanQs.length) {
        rounds.push(cleanQs.slice(qCount));
    }
}

// 2. CORE DISPLAY LOGIC
function updateDisplay() {
    // Reset Animations
    quizCard.classList.remove("animate__fadeIn");
    void quizCard.offsetWidth; // Trigger reflow
    quizCard.classList.add("animate__fadeIn");

    stopTimer();
    
    // Round Info
    let isLightning = currentRoundIdx >= 10;
    let roundName = isLightning ? "⚡ Lightning Round ⚡" : `Round ${currentRoundIdx + 1}`;
    roundIndicator.innerText = roundName;
    qCounter.innerText = viewState === "ROUND_INTRO" ? "-" : `Q ${currentQIdx + 1}/${rounds[currentRoundIdx].length}`;

    // View State Logic
    if (viewState === "ROUND_INTRO") {
        mainText.innerText = roundName;
        mainText.style.fontSize = "60px";
        qImage.style.display = "none";
        optionsContainer.style.display = "none";
        answerReveal.style.display = "none";
        btnAction.innerText = "Start Round";
        btnPrev.disabled = currentRoundIdx === 0;
        
    } else {
        const qData = rounds[currentRoundIdx][currentQIdx];
        
        mainText.style.fontSize = "32px";
        
        if (viewState === "QUESTION_HIDDEN") {
            mainText.innerText = `Question ${currentQIdx + 1}`;
            qImage.style.display = "none";
            optionsContainer.style.display = "none";
            answerReveal.style.display = "none";
            btnAction.innerText = "Reveal Question";
            
        } else if (viewState === "QUESTION_VISIBLE") {
            mainText.innerText = qData.q;
            
            // Image
            if(qData.img) {
                qImage.src = qData.img;
                qImage.style.display = "block";
            } else {
                qImage.style.display = "none";
            }
            
            // Options
            optionsContainer.style.display = "grid";
            qData.opts.forEach((txt, i) => {
                optBoxes[i].innerText = txt;
                optBoxes[i].classList.remove("correct-highlight");
            });
            
            answerReveal.style.display = "none";
            btnAction.innerText = "Start Timer";
            
        } else if (viewState === "TIMER_RUNNING") {
             // UI stays same as visible, but timer counts
             btnAction.innerText = "Reveal Answer";
             
        } else if (viewState === "ANSWER_REVEALED") {
            // Highlight Correct
            const correctIndex = qData.opts.findIndex(opt => opt === qData.ans);
            if(correctIndex > -1) optBoxes[correctIndex].classList.add("correct-highlight");
            
            answerReveal.style.display = "block";
            correctAnswerText.innerText = qData.ans;
            btnAction.innerText = "Next Question";
        }
    }
}

// 3. ACTION BUTTON LOGIC (The Main Controller)
btnAction.addEventListener("click", () => {
    switch(viewState) {
        case "ROUND_INTRO":
            viewState = "QUESTION_HIDDEN";
            break;
        case "QUESTION_HIDDEN":
            viewState = "QUESTION_VISIBLE";
            break;
        case "QUESTION_VISIBLE":
            viewState = "TIMER_RUNNING";
            startTimer();
            break;
        case "TIMER_RUNNING":
            viewState = "ANSWER_REVEALED";
            stopTimer();
            break;
        case "ANSWER_REVEALED":
            nextQuestion();
            break;
    }
    updateDisplay();
});

// 4. NAVIGATION LOGIC
function nextQuestion() {
    const currentRoundQs = rounds[currentRoundIdx];
    
    if (currentQIdx < currentRoundQs.length - 1) {
        currentQIdx++;
        viewState = "QUESTION_HIDDEN";
    } else {
        // End of round
        if (currentRoundIdx < rounds.length - 1) {
            currentRoundIdx++;
            currentQIdx = 0;
            viewState = "ROUND_INTRO";
        } else {
            alert("End of Quiz!");
        }
    }
    updateDisplay();
}

btnPrev.addEventListener("click", () => {
    if (viewState !== "ROUND_INTRO" && currentQIdx > 0) {
        currentQIdx--;
        viewState = "QUESTION_HIDDEN"; // Reset to hidden state of prev question
    } else if (currentRoundIdx > 0) {
        currentRoundIdx--;
        currentQIdx = rounds[currentRoundIdx].length - 1; // Go to last q of prev round
        viewState = "ROUND_INTRO";
    }
    updateDisplay();
});

btnNext.addEventListener("click", () => {
    // Force skip forward
    nextQuestion();
});

// 5. TIMER LOGIC
function startTimer() {
    let timeLeft = parseInt(timerInput.value) || 10;
    timerDisplay.innerText = timeLeft;
    try { tickSound.play(); } catch(e){}
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            try { alarmSound.play(); } catch(e){}
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    tickSound.pause();
    tickSound.currentTime = 0;
    // Reset display
    timerDisplay.innerText = timerInput.value;
}

// 6. LEADERBOARD LOGIC (Editable)
function loadLeaderboard() {
    const saved = JSON.parse(localStorage.getItem("hostLeaderboard"));
    if (saved && saved.length > 0) {
        renderLeaderboard(saved);
    } else {
        renderLeaderboard(TEAMS_DEFAULT.map(name => ({ name, score: 0 })));
    }
}

function renderLeaderboard(teams) {
    lbBody.innerHTML = "";
    teams.forEach((team, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td contenteditable="true" class="editable name-cell">${team.name}</td>
            <td contenteditable="true" class="editable score-cell">${team.score}</td>
        `;
        lbBody.appendChild(tr);
    });
    
    // Add Listeners to save on edit
    document.querySelectorAll(".editable").forEach(cell => {
        cell.addEventListener("input", saveLeaderboard);
        // Sort on Enter key in score
        cell.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                cell.blur();
                saveLeaderboard(); // Trigger sort
            }
        });
    });
}

function saveLeaderboard() {
    const rows = Array.from(lbBody.querySelectorAll("tr"));
    let data = rows.map(row => ({
        name: row.querySelector(".name-cell").innerText,
        score: parseInt(row.querySelector(".score-cell").innerText) || 0
    }));
    
    // Sort by Score Descending
    data.sort((a, b) => b.score - a.score);
    
    localStorage.setItem("hostLeaderboard", JSON.stringify(data));
    
    // Only re-render if order changed (avoid losing focus while typing)
    // For simplicity, we only re-render on page load or explicit sort button, 
    // but here we allow loose typing.
}

addTeamBtn.addEventListener("click", () => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>-</td>
        <td contenteditable="true" class="editable name-cell">New Team</td>
        <td contenteditable="true" class="editable score-cell">0</td>
    `;
    lbBody.appendChild(tr);
    saveLeaderboard();
    // Re-render to add listeners
    loadLeaderboard(); 
});

resetLbBtn.addEventListener("click", () => {
    if(confirm("Reset all scores to 0?")) {
        localStorage.removeItem("hostLeaderboard");
        loadLeaderboard();
    }
});

// START
init();
