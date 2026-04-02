/* ==========================
   0. CONSTANTES & SÉLECTEURS
========================== */

// Boutons / éléments UI
const themeSwitch   = document.getElementById("themeSwitch");
const homeScreen    = document.getElementById("home-screen");
const quizScreen    = document.getElementById("quiz-screen");
const startBtn      = document.getElementById("startBtn");
const returnHomeBtn = document.getElementById("returnHome");
const levelButtons  = document.querySelectorAll(".level-btn");
const skipBtn = document.getElementById("skip");


// Zones de texte / quiz
const selectedInfo  = document.getElementById("selectedInfo");
const remainingBox  = document.getElementById("remaining");
const qText         = document.getElementById("question-text");
const answersDiv    = document.getElementById("answers");
const validateBtn   = document.getElementById("validate");
const nextBtn       = document.getElementById("next");
const feedback      = document.getElementById("feedback");
const definition    = document.getElementById("definition");
const scoreBox      = document.getElementById("score");

// URLs Google Sheets
const SHEET_URL_FACILE =
  "https://docs.google.com/spreadsheets/d/ID/export?format=csv&gid=0";
const SHEET_URL_INTER =
  "https://docs.google.com/spreadsheets/d/ID/export?format=csv&gid=1";
const SHEET_URL_EXPERT =
  "https://docs.google.com/spreadsheets/d/ID/export?format=csv&gid=2";
const SHEET_URL_DEFAULT =
  "https://docs.google.com/spreadsheets/d/1bGH03k1db7Lazdzo6ufimxjNyKEsm2_M5QJpgQZafvo/export?format=csv";

/* ==========================
   1. ÉTAT DU JEU
========================== */

let difficulty = null;
let questions  = [];
let index      = 0;
let score      = 0;
let answered   = 0;

/* ==========================
   2. THÈME (CLAIR / SOMBRE)
========================== */

function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeSwitch.setAttribute("aria-pressed", "true");
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  themeSwitch.setAttribute("aria-pressed", isDark ? "true" : "false");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

themeSwitch.addEventListener("click", toggleTheme);
initTheme();

/* ==========================
   3. DIFFICULTÉ
========================== */

function updateDifficultyText() {
  if (!difficulty) {
    selectedInfo.textContent =
      "Vous pouvez choisir un niveau ou cliquer directement sur Commencer.";
  } else {
    selectedInfo.textContent = "Niveau sélectionné : " + difficulty;
  }
}
/*NIVEAUX 
levelButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const level = btn.dataset.level;

    if (difficulty === level) {
      difficulty = null;
      btn.classList.remove("selected");
    } else {
      difficulty = level;
      levelButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    }

    updateDifficultyText();
  });
});
*/
levelButtons.forEach(btn => {
  btn.addEventListener("click", () => {

    // 👉 Message temporaire
     selectedInfo.textContent = "Les niveaux arrivent bientôt 😉";
      //  Couleur différente selon le thème
    if (document.body.classList.contains("dark")) {
      selectedInfo.style.color = "#EDB307";   // thème sombre
    } else {
      selectedInfo.style.color = "";  // thème clair
    }
    // 👉 On empêche toute sélection
    difficulty = null;

    // 👉 On retire l’effet visuel “selected”
    levelButtons.forEach(b => b.classList.remove("selected"));
  });
});

/* ==========================
   4. NAVIGATION ÉCRANS
========================== */

function showHomeScreen() {
  quizScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
  document.querySelector(".header").style.display = "flex";

  returnHomeBtn.classList.add("hidden");
  qText.textContent = "";
  definition.textContent = "";
  feedback.textContent = "";
  answersDiv.innerHTML = "";
  validateBtn.style.display = "block";
  nextBtn.style.display = "none";
   skipBtn.style.display = "none";
}

function showQuizScreen() {
  document.querySelector(".header").style.display = "none";
  homeScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  qText.textContent = "Bonne chance ! Chargement des questions...";
  answersDiv.innerHTML = "";
  validateBtn.disabled = true;
}

startBtn.addEventListener("click", () => {
  showQuizScreen();
  loadSheet();
});

returnHomeBtn.addEventListener("click", showHomeScreen);

/* ==========================
   5. OUTILS : CSV + SHUFFLE
========================== */

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

/* ==========================
   6. CHARGEMENT DES QUESTIONS
========================== */

async function loadSheet() {
  let url =
    difficulty === "facile"
      ? SHEET_URL_FACILE
      : difficulty === "intermediaire"
      ? SHEET_URL_INTER
      : difficulty === "expert"
      ? SHEET_URL_EXPERT
      : SHEET_URL_DEFAULT;

  try {
    const response = await fetch(url);
    const csv = await response.text();
    const rows = parseCSV(csv);

    // Enlever l’en-tête
    rows.shift();

    questions = rows.map(row => {
      const opts = [row[1], row[2], row[3], row[4]];
      const correctIndex = opts.findIndex(
        opt => opt.trim() === row[5].trim()
      );

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
  } catch (e) {
    qText.textContent = "Erreur de chargement des questions.";
    console.error(e);
  }
}

/* ==========================
   7. ANIMATION QUESTION
========================== */

function animateQuestion() {
  qText.classList.remove("fade-in");
  void qText.offsetWidth; // reset
  qText.classList.add("fade-in");
}

/* ==========================
   8. AFFICHAGE QUESTION
========================== */

function loadQuestion() {
  const q = questions[index];

  qText.textContent = q.question;
  answersDiv.innerHTML = "";
  feedback.textContent = "";
  definition.textContent = "";
  validateBtn.disabled = true;
  validateBtn.style.display = "block";
  nextBtn.style.display = "none";
  validateBtn.disabled = true;
  validateBtn.style.display = "block";   // réaffiche Valider
  nextBtn.style.display = "none";        //  cache Question suivante
  skipBtn.style.display = "block";   // passer

  animateQuestion();

  q.answers.forEach((text, i) => {
    const div = document.createElement("div");
    div.classList.add("answer");
    div.textContent = text;
    div.dataset.index = i;

    div.onclick = () => {
      document.querySelectorAll(".answer").forEach(a =>
        a.classList.remove("selected")
      );
      div.classList.add("selected");
      validateBtn.disabled = false;
    };

    answersDiv.appendChild(div);
  });
}

/* ==========================
   9. VALIDATION RÉPONSE
========================== */

validateBtn.onclick = () => {
  const q = questions[index];
  const answers = document.querySelectorAll(".answer");
  const selected = [...answers].find(a =>
    a.classList.contains("selected")
  );

  if (!selected) return;

  const selectedIndex = parseInt(selected.dataset.index, 10);

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
   validateBtn.style.display = "none";
  skipBtn.style.display = "none";
  nextBtn.style.display = "block";
};
skipBtn.onclick = () => {
  answered++;      // ✔ compte la question comme utilisée
  index++;         // ✔ passe à la suivante

  if (answered < questions.length) {
    remainingBox.textContent =
      `Questions restantes : ${questions.length - answered}`;
    loadQuestion();
  } else {
    showFinalScore();
  }
};
/* ==========================
   10. QUESTION SUIVANTE
========================== */

nextBtn.onclick = () => {
  index++;

  if (answered < questions.length) {
    remainingBox.textContent =
      `Questions restantes : ${questions.length - answered}`;
    loadQuestion();
  } else {
    showFinalScore();
  }
};

/* ==========================
   11. SCORE & FIN
========================== */

function updateScore() {
  scoreBox.textContent = `Score : ${score} / ${questions.length}`;
}

function showFinalScore() {
  qText.textContent = "Quiz terminé !";
  answersDiv.innerHTML = "";
  validateBtn.style.display = "none";
  nextBtn.style.display = "none";
  skipBtn.style.display = "none";
  feedback.textContent = "";
  definition.textContent = `Ton score final : ${score} / ${questions.length}`;
  returnHomeBtn.classList.remove("hidden");
}
