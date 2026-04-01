/* ------------------------------
   0. Thème + Accueil + Difficulté
------------------------------ */

const themeSwitch = document.getElementById("themeSwitch");
themeSwitch.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  themeSwitch.setAttribute("aria-pressed", isDark ? "true" : "false");
});

let difficulty = null;

document.querySelectorAll(".level-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const level = btn.dataset.level;

    if (difficulty === level) {
      difficulty = null;
      btn.classList.remove("selected");
      document.getElementById("selectedInfo").textContent =
        "Vous pouvez choisir un niveau ou cliquer directement sur Commencer.";
    } else {
      difficulty = level;
      document.querySelectorAll(".level-btn").forEach(b =>
        b.classList.remove("selected")
      );
      btn.classList.add("selected");
      document.getElementById("selectedInfo").textContent =
        "Niveau sélectionné : " + level;
    }
  });
});

const homeScreen = document.getElementById("home-screen");
const quizScreen = document.getElementById("quiz-screen");

document.getElementById("startBtn").addEventListener("click", () => {
  document.querySelector(".header").style.display = "none";
  homeScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  qText.textContent = "Bonne chance ! Chargement des questions...";
  answersDiv.innerHTML = "";
  validateBtn.disabled = true;
document.getElementById("returnHome").addEventListener("click", () => {
  // Cacher l'écran du quiz
  quizScreen.classList.add("hidden");

  // Réafficher l'écran d'accueil
  homeScreen.classList.remove("hidden");

  // Réafficher le header (bouton Thème)
  document.querySelector(".header").style.display = "flex";

  // Cacher le bouton retour
  document.getElementById("returnHome").classList.add("hidden");

  // Réinitialiser les textes du quiz
  document.getElementById("question-text").textContent = "";
  document.getElementById("definition").textContent = "";
  document.getElementById("feedback").textContent = "";
});


  loadSheet();
});

/* ------------------------------
   1. URLs Google Sheets
------------------------------ */

const SHEET_URL_FACILE =
  "https://docs.google.com/spreadsheets/d/ID/export?format=csv&gid=0";
const SHEET_URL_INTER =
  "https://docs.google.com/spreadsheets/d/ID/export?format=csv&gid=1";
const SHEET_URL_EXPERT =
  "https://docs.google.com/spreadsheets/d/ID/export?format=csv&gid=2";
const SHEET_URL_DEFAULT =
  "https://docs.google.com/spreadsheets/d/1bGH03k1db7Lazdzo6ufimxjNyKEsm2_M5QJpgQZafvo/export?format=csv";

/* ------------------------------
   2. Quiz (inchangé)
------------------------------ */

let questions = [];
let index = 0;
let score = 0;
let answered = 0;

const remainingBox = document.getElementById("remaining");
const qText = document.getElementById("question-text");
const answersDiv = document.getElementById("answers");
const validateBtn = document.getElementById("validate");
const nextBtn = document.getElementById("next");
const feedback = document.getElementById("feedback");
const definition = document.getElementById("definition");
const scoreBox = document.getElementById("score");

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" && !insideQuotes) {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function loadSheet() {
  let url =
    difficulty === "facile"
      ? SHEET_URL_FACILE
      : difficulty === "intermediaire"
      ? SHEET_URL_INTER
      : difficulty === "expert"
      ? SHEET_URL_EXPERT
      : SHEET_URL_DEFAULT;

  const response = await fetch(url);
  const csv = await response.text();
  const rows = parseCSV(csv);

  rows.shift();

  questions = rows.map(row => {
    const opts = [row[1], row[2], row[3], row[4]];
    const correctIndex = opts.findIndex(opt => opt.trim() === row[5].trim());

    return {
      question: row[0],
      answers: opts,
      correct: correctIndex,
      definition: row[6]
    };
  });

  shuffle(questions);
  questions = questions.slice(0, 20);

  score = 0;
  index = 0;
  answered = 0;

  updateScore();
  remainingBox.textContent = `Questions restantes : ${questions.length}`;
  loadQuestion();
}

function loadQuestion() {
  const q = questions[index];

  qText.textContent = q.question;
  answersDiv.innerHTML = "";
  feedback.textContent = "";
  definition.textContent = "";
  validateBtn.disabled = true;
  nextBtn.style.display = "none";

  q.answers.forEach((text, i) => {
    const div = document.createElement("div");
    div.classList.add("answer");
    div.textContent = text;

    div.onclick = () => {
      document.querySelectorAll(".answer").forEach(a =>
        a.classList.remove("selected")
      );
      div.classList.add("selected");
      validateBtn.disabled = false;
      div.dataset.index = i;
    };

    answersDiv.appendChild(div);
  });
}

validateBtn.onclick = () => {
  const q = questions[index];
  const answers = document.querySelectorAll(".answer");

  let selected = [...answers].find(a => a.classList.contains("selected"));
  if (!selected) return;

  let selectedIndex = parseInt(selected.dataset.index);

  answers.forEach((a, i) => {
    a.style.pointerEvents = "none";

    if (i === q.correct) a.classList.add("correct");
    if (i === selectedIndex && i !== q.correct) a.classList.add("wrong");
  });

  if (selectedIndex === q.correct) {
    score++;
    updateScore();
    feedback.textContent = "Bonne réponse !";
    feedback.className = "feedback ok";
  } else {
    feedback.textContent = "Mauvaise réponse.";
    feedback.className = "feedback ko";
  }

  definition.textContent = "Définition : " + q.definition;

  answered++;
  nextBtn.style.display = "block";
  
};

nextBtn.onclick = () => {
  index++;

  if (answered < questions.length) {
    remainingBox.textContent = `Questions restantes : ${questions.length - answered}`;
    loadQuestion();
  } else {
    showFinalScore();
  }
};

function updateScore() {
  scoreBox.textContent = `Score : ${score} / ${questions.length}`;
}

function showFinalScore() {
  qText.textContent = "Quiz terminé !";
  answersDiv.innerHTML = "";
  validateBtn.style.display = "none";
  nextBtn.style.display = "none";
  definition.textContent = `Ton score final : ${score} / ${questions.length}`;
  document.getElementById("returnHome").classList.remove("hidden");
}
