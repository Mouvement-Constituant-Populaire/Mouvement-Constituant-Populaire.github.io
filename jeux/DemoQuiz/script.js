/* ==========================
   0. CONSTANTES & SÉLECTEURS
========================== */

// Thème
const themeSwitch = document.getElementById("themeSwitch");

// Écrans
const levelScreen  = document.getElementById("level-screen");
const quizScreen   = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

// Boutons
const startQuizBtn = document.getElementById("startQuiz");
const validateBtn  = document.getElementById("validate");
//const skipBtn      = document.getElementById("skip");
const nextBtn      = document.getElementById("next");
const retryBtn     = document.getElementById("retry");
const backHomeBtn  = document.getElementById("backHome");
const arrowPrev = document.getElementById("arrowPrev");
const arrowNext = document.getElementById("arrowNext");


// Zones de texte
const questionCounter = document.getElementById("question-counter");
const qText           = document.getElementById("question-text");
const answersDiv      = document.getElementById("answers");
const feedback        = document.getElementById("feedback");
const definition      = document.getElementById("definition");

// Résultats
const resultTitle   = document.getElementById("result-title");
const resultStars   = document.getElementById("result-stars");
const resultSummary = document.getElementById("result-summary");
const reviewList    = document.getElementById("review-list");

// Google Sheet
const SHEET_URL_DEFAULT =
  "https://docs.google.com/spreadsheets/d/1bGH03k1db7Lazdzo6ufimxjNyKEsm2_M5QJpgQZafvo/export?format=csv";

/* ==========================
   1. ÉTAT DU JEU
========================== */

let questions = [];
let currentIndex = 0;
let score = 0;
let wrongAnswers = [];

/* ==========================
   2. THÈME
========================== */

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.body.classList.add("dark");
    themeSwitch.setAttribute("aria-pressed", "true");
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  themeSwitch.setAttribute("aria-pressed", isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

themeSwitch.addEventListener("click", toggleTheme);
initTheme();

/* ==========================
   3. NAVIGATION
========================== */

function showScreen(screen) {
  levelScreen.classList.add("hidden");
  quizScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  screen.classList.remove("hidden");
}

backHomeBtn.addEventListener("click", () => {
  showScreen(levelScreen);
});

retryBtn.addEventListener("click", () => {
  startQuiz();
});

/* ==========================
   4. OUTILS : CSV + SHUFFLE
========================== */

function parseCSV(text) {
  text = text.replace(/\r/g, "");

  const rows = [];
  let row = [], cell = "", inside = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];

    if (c === '"' && next === '"') { cell += '"'; i++; }
    else if (c === '"') inside = !inside;
    else if (c === "," && !inside) { row.push(cell); cell = ""; }
    else if (c === "\n" && !inside) { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }

  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/* ==========================
   5. CHARGEMENT DES QUESTIONS
========================== */

async function loadSheet() {
  const response = await fetch(SHEET_URL_DEFAULT);
  const csv = await response.text();
  const rows = parseCSV(csv);

  rows.shift(); // En-tête

  let all = rows
    .filter(r => Array.isArray(r) && r[0])
    .map(r => {
      const opts = [r[1], r[2], r[3], r[4]];
      let correctIndex = opts.findIndex(o => o.trim() === r[5].trim());
      if (correctIndex === -1) correctIndex = 0;

      return {
        question: r[0],
        answers: opts,
        correct: correctIndex,
        definition: r[6] || ""
      };
    });

  shuffle(all);
  questions = all.slice(0, 20);
}

/* ==========================
   6. DÉMARRAGE DU QUIZ
========================== */

startQuizBtn.addEventListener("click", () => {
  startQuiz();
});

async function startQuiz() {
  await loadSheet();
  currentIndex = 0;
  score = 0;
  wrongAnswers = [];
  showScreen(quizScreen);
  loadQuestion();
}

/* ==========================
   7. AFFICHAGE QUESTION
========================== */

function resetQuestionUI() {
  feedback.textContent = "";
  definition.textContent = "";
  answersDiv.innerHTML = "";
  validateBtn.disabled = true;
  validateBtn.style.display = "none"
  nextBtn.style.display = "none";
  //skipBtn.style.display = "block";
}

function animateQuestion() {
  qText.classList.remove("fade-in");
  void qText.offsetWidth;
  qText.classList.add("fade-in");
}

function loadQuestion() {
  if (currentIndex >= questions.length) {
    endQuiz();
    return;
  }

  resetQuestionUI();

  const q = questions[currentIndex];
  questionCounter.textContent = `Question ${currentIndex + 1} / ${questions.length}`;
  qText.textContent = q.question;
  animateQuestion();

  q.answers.forEach((text, i) => {
    const div = document.createElement("div");
    div.className = "answer";
    div.textContent = text;
    div.dataset.index = i;

    div.onclick = () => {
      document.querySelectorAll(".answer").forEach(a => a.classList.remove("selected"));
      div.classList.add("selected");
      validateBtn.disabled = false;
      validateBtn.style.display = "block";
    };

    answersDiv.appendChild(div);
  });

  /*  gestion des questions déjà répondues */
  if (q.answered) {
    const answers = document.querySelectorAll(".answer");

    answers.forEach((a, i) => {
      a.style.pointerEvents = "none"; // on bloque les clics

      if (i === q.correct) a.classList.add("correct");
      if (i === q.selected && i !== q.correct) a.classList.add("wrong");
      if (i === q.selected) a.classList.add("selected");
    });

    // Feedback
    feedback.textContent =
      q.selected === q.correct ? "Bonne réponse !" : "Dommage";

    // Définition
    definition.textContent =
      q.definition && q.definition.trim() !== ""
        ? "Complément : " + q.definition
        : "";

    // Boutons
    validateBtn.style.display = "none";
    nextBtn.style.display = "block";
    nextBtn.disabled = false;

    // Cacher les flèches si tu veux
    document.querySelector(".nav-arrows").classList.add("hidden");

    return; // on arrête ici
  }

  // Affichage flèches (uniquement si pas répondu)
  if (currentIndex === 0) {
    arrowPrev.classList.add("hidden");
  } else {
    arrowPrev.classList.remove("hidden");
  }

  arrowNext.classList.remove("hidden");
  document.querySelector(".nav-arrows").classList.remove("hidden");
}

/* ==========================
   8. VALIDATION
========================== */

validateBtn.addEventListener("click", () => {
  const q = questions[currentIndex];
  const answers = [...document.querySelectorAll(".answer")];
  const selected = answers.find(a => a.classList.contains("selected"));
  if (!selected) return;

  const selectedIndex = Number(selected.dataset.index);

  // 👉 ICI : on enregistre que la question a été répondue
  q.answered = true;
  q.selected = selectedIndex;

  answers.forEach((a, i) => {
    a.style.pointerEvents = "none";
    if (i === q.correct) a.classList.add("correct");
    if (i === selectedIndex && i !== q.correct) a.classList.add("wrong");
  });

  if (selectedIndex === q.correct) {
    score++;
    feedback.textContent = "Bonne réponse !";
  } else {
    feedback.textContent = "Dommage";
    wrongAnswers.push({
      question: q.question,
      yourAnswer: q.answers[selectedIndex],
      correctAnswer: q.answers[q.correct]
    });
  }

  definition.textContent =
    q.definition && q.definition.trim() !== ""
      ? "Complément : " + q.definition
      : "";

  validateBtn.style.display = "none";
  nextBtn.style.display = "block";
  nextBtn.disabled = false;


  //  ICI : cacher les flèches après validation
document.querySelector(".nav-arrows").classList.add("hidden");
  
});

/*==============
skipBtn.addEventListener("click", () => {
  currentIndex++;
  validateBtn.style.display = "block";
  validateBtn.disabled = true;
  loadQuestion();
});
===============*/
arrowPrev.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    validateBtn.style.display = "block";
    validateBtn.disabled = true;
    loadQuestion();
  }
});
arrowNext.addEventListener("click", () => {
  currentIndex++;
  validateBtn.style.display = "block";
  validateBtn.disabled = true;
  loadQuestion();
});

nextBtn.addEventListener("click", () => {
  currentIndex++;
  validateBtn.style.display = "block";
  validateBtn.disabled = true;
  loadQuestion();
});

/* ==========================
   9. FIN DE QUIZ
========================== */

function getMessage(score, total) {
  const ratio = score / total;

  if (ratio >= 0.9) 
    return "Excellent ! Tu maîtrises vraiment le sujet 👏";

  if (ratio >= 0.75) 
    return "Très bon résultat ! Tu es sur la bonne voie 💪";

  if (ratio >= 0.5) 
    return "Bravo ! Tu as plusieurs bonnes réponses, persévère et tu vas t'améliorer 😊";

  return "Courage ! Continue d’apprendre et tu progresseras vite 🌱";
}


function endQuiz() {
  showScreen(resultScreen);

  const total = questions.length;
  const answered = score + wrongAnswers.length;
  const message = getMessage(score, total);

  resultTitle.textContent = "Bravo ! Quiz Terminé !";

  // On n'affiche plus les étoiles
  resultStars.textContent = "";

  // On n'affiche plus le score
  resultSummary.innerHTML =
    `Questions répondues : ${answered} / ${total}<br>` +
    `${message}`;

  if (wrongAnswers.length === 0) {
    reviewList.innerHTML = "<p>Aucune erreur, félicitations ! 🎉</p>";
  } else {
    reviewList.innerHTML = wrongAnswers.map(w => `
      <div class="review-item">
        <p><strong>${w.question}</strong></p>
        <p>Votre réponse : ${w.yourAnswer}</p>
        <p>Réponse correcte : ${w.correctAnswer}</p>
      </div>
    `).join("");
  }
}

