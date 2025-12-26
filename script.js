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
let rounds = []; 
let currentRoundIdx = 0;
let currentQIdx = 0; 
let viewState = "ROUND_INTRO"; 
let timerInterval;

// 1. INITIALIZATION
function init() {
    loadLeaderboard();
    
    // Check if URL is still the placeholder
    if (GOOGLE_SHEET_URL.includes("YOUR_GOOGLE_SHEETS")) {
        alert("⚠️ WARNING: You haven't replaced the Google Sheet URL in script.js yet! Loading fallback questions instead.");
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
            alert("❌ Error loading Google Sheet. Check the Console.");
            console.error(err);
            loadFallbackData(); 
        }
    });
}

function loadFallbackData() {
    const fallbackQs = [
        { Question: "Fallback Q1: What color is the sky?", Option1: "Red", Option2: "Blue", Option3: "Green", Option4: "Yellow", CorrectAnswer: "Blue" },
        { Question: "Fallback Q2: What is 2+2?", Option1: "3", Option2: "4", Option3: "5", Option4: "6", CorrectAnswer: "4" },
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
        alert("❌ No questions found! Check your Google Sheet Headers.");
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

    // Reset Animations
    quizCard.classList.remove("animate__fadeIn");
    void quizCard.offsetWidth; 
    quizCard.classList.add("animate__fadeIn");

    // NOTE: Removed stopTimer() from here so it doesn't kill the timer on start!
    
    let isLightning = currentRoundIdx >= 10;
    let roundName = isLightning ? "⚡ Lightning Round ⚡" : `Round ${currentRoundIdx + 1}`;
    roundIndicator.innerText = roundName;
    
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
            if(qData.img) {
                qImage.src = qData.img;
                qImage.style.display = "block";
            } else {
                qImage.style.display = "none";
            }
            optionsContainer.style.display = "grid";
            qData.opts.forEach((txt, i) => {
                if(optBoxes[i]) {
                    optBoxes[i].innerText = txt || "-"; 
                    optBoxes[i].classList.remove("correct-highlight");
                }
            });
            answerReveal.style.display = "none";
            btnAction.innerText = "Start Timer";
            
        } else if (viewState === "TIMER_RUNNING") {
             btnAction.innerText = "Reveal Answer";
             
        } else if (viewState === "ANSWER_REVEALED") {
            const correctIndex = qData.opts.findIndex(opt => opt === qData.ans);
            if(correctIndex > -1 && optBoxes[correctIndex]) {
                optBoxes[correctIndex].classList.add("correct-highlight");
            }
            answerReveal.style.display = "block";
            correctAnswerText.innerText = qData.ans;
            btnAction.innerText = "Next Question";
        }
    }
}

// 3. ACTION BUTTON LOGIC
btnAction.addEventListener("click", () => {
    if (!rounds || rounds.length === 0) return;

    switch(viewState) {
        case "ROUND_INTRO":
            viewState = "QUESTION_HIDDEN";
            break;
        case "QUESTION_HIDDEN":
            viewState = "QUESTION_VISIBLE";
            break;
        case "QUESTION_VISIBLE":
            viewState = "TIMER_RUNNING";
            startTimer(); // Starts timer
            break;
        case "TIMER_RUNNING":
            viewState = "ANSWER_REVEALED";
            stopTimer(); // Stops timer manually
            break;
        case "ANSWER_REVEALED":
            nextQuestion();
            break;
    }
    updateDisplay();
});

// 4. NAVIGATION LOGIC
function nextQuestion() {
    stopTimer(); // Ensure timer stops if skipping
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
    stopTimer(); // Ensure timer stops if going back
    if (viewState !== "ROUND_INTRO" && currentQIdx > 0) {
        currentQIdx--;
        viewState = "QUESTION_HIDDEN"; 
    } else if (currentRoundIdx > 0) {
        currentRoundIdx--;
        currentQIdx = rounds[currentRoundIdx].length - 1; 
        viewState = "ROUND_INTRO";
    }
    updateDisplay();
});

btnNext.addEventListener("click", () => {
    nextQuestion();
});

// 5. TIMER LOGIC
function startTimer() {
    let timeLeft = parseInt(timerInput.value) || 10;
    timerDisplay.innerText = timeLeft;
    
    // Play sound safely
    try { tickSound.play().catch(e => console.log("Sound blocked or missing")); } catch(e){}
    
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
    // We do NOT reset the display text here, so you can see what time you stopped at
}

// 6. LEADERBOARD LOGIC
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
    
    document.querySelectorAll(".editable").forEach(cell => {
        cell.addEventListener("input", saveLeaderboard);
        cell.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                cell.blur();
                saveLeaderboard(); 
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
    
    data.sort((a, b) => b.score - a.score);
    localStorage.setItem("hostLeaderboard", JSON.stringify(data));
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
