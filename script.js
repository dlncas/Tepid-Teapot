// CONFIGURATION
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQkB-VFvdDRm-bWJDxliTPUE3QnOMuCIM9BR7i4ypvX-sp5fwnW3TPFA4KLNBK44qDVfkdvkEdqzQI9/pub?output=csv"; 

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

// Buttons
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const btnAction = document.getElementById("btn-action"); // Main (Space)
const btnReveal = document.getElementById("btn-reveal"); // Separate Answer Button
const timerInput = document.getElementById("timer-setting");
const addTeamBtn = document.getElementById("add-team-btn");
const resetLbBtn = document.getElementById("reset-lb-btn");
const lbBody = document.getElementById("lb-body");

// Audio
const tickSound = document.getElementById("tick-sound");
const alarmSound = document.getElementById("alarm-sound");

// State
let rounds = []; 
let currentRoundIdx = 0;
let currentQIdx = 0; 
let viewState = "ROUND_INTRO"; 
let timerInterval;

// 1. INITIALIZATION
function init() {
    timerInput.value = 20; 
    loadLeaderboard();
    
    if (GOOGLE_SHEET_URL.includes("YOUR_GOOGLE_SHEETS")) {
        loadFallbackData(); 
        return;
    }

    btnAction.innerText = "Loading...";
    btnAction.disabled = true;

    Papa.parse(GOOGLE_SHEET_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            processData(results.data);
            btnAction.disabled = false;
            btnAction.innerText = "Start Round";
            updateDisplay();
        },
        error: function(err) {
            console.error(err);
            loadFallbackData(); 
        }
    });
}

function loadFallbackData() {
    const fallbackQs = [
        { Question: "Fallback Q1: What color is the sky?", Option1: "Red", Option2: "Blue", Option3: "Green", Option4: "Yellow", CorrectAnswer: "Blue" },
        ...Array(8).fill({ Question: "Placeholder Question", Option1: "A", Option2: "B", Option3: "C", Option4: "D", CorrectAnswer: "A" })
    ];
    processData(fallbackQs);
    btnAction.disabled = false;
    btnAction.innerText = "Start Round";
    updateDisplay();
}

function processData(data) {
    let cleanQs = [];
    if (data.length > 0 && !data[0].hasOwnProperty("Question")) {
        cleanQs = data.filter(r => r.question).map(r => ({
            q: r.question,
            img: r.imageurl || r.ImageURL,
            opts: [r.option1, r.option2, r.option3, r.option4],
            ans: r.correctanswer
        }));
    } else {
        cleanQs = data.filter(r => r.Question).map(r => ({
            q: r.Question,
            img: r.ImageURL,
            opts: [r.Option1, r.Option2, r.Option3, r.Option4],
            ans: r.CorrectAnswer
        }));
    }
    
    if (cleanQs.length === 0) {
        alert("❌ No questions found!");
        return;
    }

    rounds = [];
    let qCount = 0;
    for (let i = 0; i < 10; i++) {
        if (qCount + 10 <= cleanQs.length) {
            rounds.push(cleanQs.slice(qCount, qCount + 10));
            qCount += 10;
        } else if (qCount < cleanQs.length) {
            rounds.push(cleanQs.slice(qCount));
            qCount = cleanQs.length;
        }
    }
    if (qCount < cleanQs.length) {
        rounds.push(cleanQs.slice(qCount));
    }
}

// 2. CORE DISPLAY LOGIC
function updateDisplay() {
    if (!rounds || rounds.length === 0) return;

    // Animation reset
    quizCard.classList.remove("animate__fadeIn");
    void quizCard.offsetWidth; 
    quizCard.classList.add("animate__fadeIn");

    let isLightning = currentRoundIdx >= 10;
    let roundName = isLightning ? "⚡ Lightning Round ⚡" : `Round ${currentRoundIdx + 1}`;
    roundIndicator.innerText = roundName;
    
    // Determine Labels A, B, C, D
    const optionLabels = ['A', 'B', 'C', 'D'];

    if (!rounds[currentRoundIdx]) {
        mainText.innerText = "End of Quiz!";
        btnAction.disabled = true;
        return;
    }

    qCounter.innerText = viewState === "ROUND_INTRO" ? "-" : `Q ${currentQIdx + 1}/${rounds[currentRoundIdx].length}`;

    if (viewState === "ROUND_INTRO") {
        mainText.innerText = roundName;
        mainText.style.fontSize = "60px";
        qImage.style.display = "none";
        optionsContainer.style.display = "none";
        answerReveal.style.display = "none";
        
        btnAction.innerText = "Start Round";
        btnReveal.style.display = "none"; // Hide Reveal button in intro
        timerDisplay.innerText = timerInput.value;
        
    } else {
        const qData = rounds[currentRoundIdx][currentQIdx];
        mainText.style.fontSize = "32px";
        
        if (viewState === "QUESTION_HIDDEN") {
            mainText.innerText = `Question ${currentQIdx + 1}`;
            qImage.style.display = "none";
            optionsContainer.style.display = "none";
            answerReveal.style.display = "none";
            
            btnAction.innerText = "Reveal Question";
            btnReveal.style.display = "none"; // Hide Reveal
            timerDisplay.innerText = timerInput.value;
            
        } else if (viewState === "QUESTION_VISIBLE") {
            mainText.innerText = qData.q;
            if(qData.img) {
                qImage.src = qData.img;
                qImage.style.display = "block";
            } else {
                qImage.style.display = "none";
            }
            optionsContainer.style.display = "grid";
            
            // Render Options with A, B, C, D
            qData.opts.forEach((txt, i) => {
                if(optBoxes[i]) {
                    optBoxes[i].innerHTML = `<span class="opt-label">${optionLabels[i]}</span> ${txt || "-"}`;
                    optBoxes[i].classList.remove("correct-highlight");
                }
            });
            
            answerReveal.style.display = "none";
            
            // Buttons State
            btnAction.innerText = "Next Question"; // Main button now moves to next
            btnReveal.style.display = "block";     // Reveal button appears
            
        } else if (viewState === "ANSWER_REVEALED") {
            // Keep question visible
            const correctIndex = qData.opts.findIndex(opt => opt === qData.ans);
            if(correctIndex > -1 && optBoxes[correctIndex]) {
                optBoxes[correctIndex].classList.add("correct-highlight");
            }
            answerReveal.style.display = "block";
            correctAnswerText.innerText = qData.ans;
            
            btnAction.innerText = "Next Question";
            btnReveal.style.display = "none"; // Hide Reveal, answer is already up
        }
    }
}

// 3. ACTION BUTTON LOGIC
// SPACEBAR / Main Button Logic
btnAction.addEventListener("click", () => {
    if (!rounds || rounds.length === 0) return;

    switch(viewState) {
        case "ROUND_INTRO":
            viewState = "QUESTION_HIDDEN";
            updateDisplay();
            break;
            
        case "QUESTION_HIDDEN":
            viewState = "QUESTION_VISIBLE";
            updateDisplay();
            startTimer(); // AUTO START TIMER
            break;
            
        case "QUESTION_VISIBLE":
            nextQuestion(); // Skips reveal if clicked, goes to next
            break;
            
        case "ANSWER_REVEALED":
            nextQuestion();
            break;
    }
});

// SEPARATE REVEAL BUTTON LOGIC
btnReveal.addEventListener("click", () => {
    if(viewState === "QUESTION_VISIBLE") {
        viewState = "ANSWER_REVEALED";
        stopTimer();
        updateDisplay();
    }
});

// KEYBOARD SHORTCUTS
document.addEventListener("keydown", (e) => {
    // Prevent spacebar scrolling
    if(e.code === "Space") e.preventDefault();

    if(e.code === "Space") {
        // Space acts as Main Button
        btnAction.click(); 
    } else if(e.code === "ArrowRight") {
        // Right Arrow = Next
        btnNext.click();
    } else if(e.code === "ArrowLeft") {
        // Left Arrow = Back
        btnPrev.click();
    }
});

// 4. TIMER LOGIC
function startTimer() {
    clearInterval(timerInterval);
    
    let timeLeft = parseInt(timerInput.value) || 20;
    timerDisplay.innerText = timeLeft;
    
    try { tickSound.play().catch(e => {}); } catch(e){}
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            try { alarmSound.play().catch(e => {}); } catch(e){}
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    if(tickSound) { tickSound.pause(); tickSound.currentTime = 0; }
}

// 5. NAVIGATION LOGIC
function nextQuestion() {
    stopTimer(); 
    const currentRoundQs = rounds[currentRoundIdx];
    
    if (currentQIdx < currentRoundQs.length - 1) {
        currentQIdx++;
        viewState = "QUESTION_HIDDEN";
    } else {
        if (currentRoundIdx < rounds.length - 1) {
            currentRoundIdx++;
            currentQIdx = 0;
            viewState = "ROUND_INTRO";
        } else {
            alert("End of Quiz!");
            btnAction.disabled = true;
        }
    }
    updateDisplay();
}

btnPrev.addEventListener("click", () => {
    stopTimer();
    if (currentQIdx > 0) {
        currentQIdx--;
        viewState = "QUESTION_HIDDEN";
    } else if (currentQIdx === 0 && viewState !== "ROUND_INTRO") {
        viewState = "ROUND_INTRO";
    } else if (viewState === "ROUND_INTRO" && currentRoundIdx > 0) {
        currentRoundIdx--;
        currentQIdx = rounds[currentRoundIdx].length - 1;
        viewState = "QUESTION_HIDDEN";
    }
    updateDisplay();
});

btnNext.addEventListener("click", () => {
    nextQuestion();
});

// 6. LEADERBOARD LOGIC (Updated with Arrows)
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
            <td>
                <div class="score-flex">
                    <button class="score-btn" onclick="adjustScore(${index}, -1)">◀</button>
                    <span class="score-val">${team.score}</span>
                    <button class="score-btn" onclick="adjustScore(${index}, 1)">▶</button>
                </div>
            </td>
        `;
        lbBody.appendChild(tr);
    });
    
    // Add Listeners for Name Edits
    document.querySelectorAll(".name-cell").forEach(cell => {
        cell.addEventListener("input", saveLeaderboard);
    });
}

// Global function for buttons to call
window.adjustScore = function(index, delta) {
    const teams = getLeaderboardData();
    if(teams[index]) {
        teams[index].score += delta;
        // Save and Re-render (keeps order for now, or you can sort if you want)
        // Note: Re-rendering makes it lose focus if editing name, but buttons are fine.
        renderLeaderboard(teams);
        saveLeaderboardFromData(teams);
    }
}

function getLeaderboardData() {
    const rows = Array.from(lbBody.querySelectorAll("tr"));
    return rows.map(row => ({
        name: row.querySelector(".name-cell").innerText,
        score: parseInt(row.querySelector(".score-val").innerText) || 0
    }));
}

function saveLeaderboard() {
    const data = getLeaderboardData();
    saveLeaderboardFromData(data);
}

function saveLeaderboardFromData(data) {
    // Optional: Sort by score automatically?
    // data.sort((a, b) => b.score - a.score);
    localStorage.setItem("hostLeaderboard", JSON.stringify(data));
}

addTeamBtn.addEventListener("click", () => {
    const teams = getLeaderboardData();
    teams.push({ name: "New Team", score: 0 });
    renderLeaderboard(teams);
    saveLeaderboardFromData(teams);
});

resetLbBtn.addEventListener("click", () => {
    if(confirm("Reset all scores to 0?")) {
        localStorage.removeItem("hostLeaderboard");
        loadLeaderboard();
    }
});

// START
init();
