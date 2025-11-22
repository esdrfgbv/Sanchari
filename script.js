/* ==============================
   GLOBAL VARIABLES / DOM
   ============================== */
const homeSection = document.getElementById("home-section");
const levelsSection = document.getElementById("levels-section");
const levelIntroSection = document.getElementById("level-intro-section");
const challengeSection = document.getElementById("challenge-section");
const authSection = document.getElementById("auth-section");

const levelsContainer = document.getElementById("levelsContainer");

const selectedLanguageTitle = document.getElementById("selectedLanguageTitle");
const challengeBreadcrumb = document.getElementById("challengeBreadcrumb");

const challengeTitle = document.getElementById("challengeTitle");
const challengeDescription = document.getElementById("challengeDescription");
const challengeConcept = document.getElementById("challengeConcept");
const inputFormat = document.getElementById("inputFormat");
const outputFormat = document.getElementById("outputFormat");
const examplesArea = document.getElementById("examplesArea");

const testcaseTable = document.querySelector("#testcaseTable tbody");
const challengeStatusMsg = document.getElementById("challengeStatusMsg");

const codeEditor = document.getElementById("codeEditor");
const outputArea = document.getElementById("outputArea");
const editorLangPill = document.getElementById("editorLangPill");
const testSummaryBadge = document.getElementById("testSummaryBadge");

const runCodeBtn = document.getElementById("runCodeBtn");
const testCodeBtn = document.getElementById("testCodeBtn");
const resetStarterBtn = document.getElementById("resetStarterBtn");
const clearCodeBtn = document.getElementById("clearCodeBtn");

const prevChallengeBtn = document.getElementById("prevChallenge");
const nextChallengeBtn = document.getElementById("nextChallenge");

const backToHome = document.getElementById("backToHome");
const backToLevels = document.getElementById("backToLevels");
const backToLevelsFromIntro = document.getElementById("backToLevelsFromIntro");

const levelIntroBreadcrumb = document.getElementById("levelIntroBreadcrumb");
const levelIntroTitle = document.getElementById("levelIntroTitle");
const levelIntroBody = document.getElementById("levelIntroBody");
const startPracticingBtn = document.getElementById("startPracticingBtn");

/* question list container */
const questionList = document.getElementById("questionList");

/* challenge layout containers */
const challengeLayout = document.querySelector(".challenge-layout");
const challengeRight = document.querySelector(".challenge-right");

/* NEW: MCQ container + helpers */
const mcqContainer = document.getElementById("mcqContainer");
const ioContainerEl = document.querySelector(".io-container");
const navButtonsContainer = document.querySelector(".nav-buttons");
const testTableEl = document.getElementById("testcaseTable");


/* AUTH + PROFILE DOM */
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authUsername = document.getElementById("authUsername");
const authPassword = document.getElementById("authPassword");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authToggleMode = document.getElementById("authToggleMode");

const currentUserLabel = document.getElementById("currentUserLabel");
const currentUserNameEl = document.getElementById("currentUserName");
const profileButton = document.getElementById("profileButton");
const profileInitial = document.getElementById("profileInitial");
const profileMenu = document.getElementById("profileMenu");
const profileMenuName = document.getElementById("profileMenuName");
const switchUserBtn = document.getElementById("switchUserBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Global state
let currentLanguage = null;
let challengeData = null; // { levels: [ level1Json, level2Json, . ] }
let notesCache = {}; // key: `${lang}_level${i}` -> notes json
let currentLevelIndex = 0;
let currentChallengeIndex = 0;

/* AUTH STATE */
let authMode = "login"; // "login" or "signup"
const CURRENT_USER_KEY = "eduwin_currentUser";

/* ==============================
   BACKEND CONFIG
   ============================== */
const BACKEND_URL = "https://eduwin-backend.onrender.com"; // change to your deployed URL later

/* ==============================
   JUDGE0 CONFIG
   ============================== */
const JUDGE0_URL = "https://ce.judge0.com";
const JUDGE_LANG_MAP = {
  c: 50,        // GCC C
  python: 71,   // Python 3
  java: 62,     // Java
  dsa: null,    // theory
  cpp: 54,      // C++ (G++)
  js: 63,       // JavaScript (Node)
  csharp: 51,   // C#
  dbms: null,   // theory / MCQ
  os: null,     // theory / MCQ
  cn: null,     // theory / MCQ
  systemdesign: null, // theory / MCQ
  htmlcss: null // front-end, no Judge
};

/* ==============================
   COURSE ORDER + SUMMARY CONFIG
   ============================== */
const COURSE_ORDER = [
  "c",
  "python",
  "java",
  "dsa",
  "cpp",
  "js",
  "csharp",
  "dbms",
  "os",
  "cn",
  "systemdesign",
  "htmlcss"
];

const TOTAL_LEVELS_PER_COURSE = 10; // for display

/* ==============================
   AUTH HELPERS
   ============================== */
function getCurrentUser() {
  return localStorage.getItem(CURRENT_USER_KEY);
}

function setCurrentUser(username) {
  localStorage.setItem(CURRENT_USER_KEY, username);
  updateUserUI();
  updateCourseCardsUI();
}

/** Add user prefix so each user has separate progress & code */
function getUserScopedKey(baseKey) {
  const user = getCurrentUser() || "guest";
  return `user_${user}_${baseKey}`;
}

/* UI updates for login / signup mode */
function updateAuthModeUI() {
  if (authMode === "login") {
    authTitle.textContent = "Welcome back 👋";
    authSubtitle.textContent = "Login to continue your saved progress.";
    authSubmitBtn.textContent = "Login";
    authToggleMode.textContent = "New here? Create account";
  } else {
    authTitle.textContent = "Create your EduWin profile ✨";
    authSubtitle.textContent = "Each profile will have separate progress.";
    authSubmitBtn.textContent = "Create account";
    authToggleMode.textContent = "Already have an account? Login";
  }
}

/* Show current user in top bar */
function updateUserUI() {
  const user = getCurrentUser();

  if (!user) {
    currentUserLabel.classList.add("hidden");
    profileButton.classList.add("hidden");
    profileMenu.classList.remove("open");
    return;
  }

  currentUserLabel.classList.remove("hidden");
  profileButton.classList.remove("hidden");

  currentUserNameEl.textContent = user;
  profileInitial.textContent = user.charAt(0).toUpperCase();
  profileMenuName.textContent = user;
}

/* AUTH SECTION SHOW / HIDE */
function showAuth(pushHistory = true) {
  authSection.classList.remove("hidden");
  homeSection.classList.add("hidden");
  levelsSection.classList.add("hidden");
  levelIntroSection.classList.add("hidden");
  challengeSection.classList.add("hidden");

  if (pushHistory) {
    history.pushState({ page: "auth" }, "", "");
  }
}

async function handleAuthSubmit() {
  const username = authUsername.value.trim();
  const password = authPassword.value.trim();

  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  const endpoint = authMode === "signup" ? "/api/signup" : "/api/login";

  try {
    const res = await fetch(BACKEND_URL + endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.error || "Something went wrong. Try again.");
      return;
    }

    setCurrentUser(data.username || username);
    authUsername.value = "";
    authPassword.value = "";

    showHome(true);
  } catch (err) {
    console.error(err);
    alert("Cannot connect to server. Is the backend running?");
  }
}

/* ==============================
   PROGRESS SYSTEM (PER LEVEL, PER USER)
   ============================== */
function getProgress(lang) {
  const key = getUserScopedKey("progress_" + lang);
  return JSON.parse(localStorage.getItem(key)) || {
    levels: Array(10).fill(0)
  };
}

function saveProgress(lang, progress) {
  const key = getUserScopedKey("progress_" + lang);
  localStorage.setItem(key, JSON.stringify(progress));
}

/* ==============================
   COURSE SUMMARY (FOR HOME CARDS, PER USER)
   ============================== */
function getCourseSummary(lang) {
  const key = getUserScopedKey("courseSummary_" + lang);
  const raw = localStorage.getItem(key);
  if (!raw) {
    return {
      completedLevels: 0,
      totalLevels: TOTAL_LEVELS_PER_COURSE
    };
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Invalid courseSummary for", lang);
    return {
      completedLevels: 0,
      totalLevels: TOTAL_LEVELS_PER_COURSE
    };
  }
}

function saveCourseSummary(lang, summary) {
  const key = getUserScopedKey("courseSummary_" + lang);
  localStorage.setItem(key, JSON.stringify(summary));
}

/**
 * Recompute course summary for the CURRENT language
 * using challengeData + per-level progress.
 */
function updateCourseSummaryForCurrentLanguage() {
  if (!challengeData || !currentLanguage) return;

  const progress = getProgress(currentLanguage);
  let completedLevels = 0;
  const totalLevels = challengeData.levels.length;

  challengeData.levels.forEach((lvl, idx) => {
    const totalChallenges = Array.isArray(lvl.challenges)
      ? lvl.challenges.length
      : 0;

    if (
      totalChallenges > 0 &&
      (progress.levels[idx] || 0) >= totalChallenges
    ) {
      completedLevels++;
    }
  });

  saveCourseSummary(currentLanguage, {
    completedLevels,
    totalLevels
  });

  // Refresh course cards UI (home) so it reflects new progress
  updateCourseCardsUI();
}

/* ==============================
   LOADING OVERLAY (COURSE SWITCH)
   ============================== */
function showLoading() {
  let overlay = document.querySelector(".loading-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "loading-overlay";
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
  }
  overlay.classList.add("visible");

  setTimeout(() => {
    hideLoading();
  }, 450);
}

function hideLoading() {
  const overlay = document.querySelector(".loading-overlay");
  if (overlay) {
    overlay.classList.remove("visible");
  }
}

/* ==============================
   HOME COURSE CARDS UI
   ============================== */
function updateCourseCardsUI() {
  const cards = document.querySelectorAll(".course-card");

  COURSE_ORDER.forEach((lang) => {
    const card = document.querySelector(`.course-card[data-lang="${lang}"]`);
    if (!card) return;

    // Set logo background
    const icon = card.querySelector(".course-icon");
    if (icon) {
      icon.style.backgroundImage = `url(logos/${lang}.png)`;
    }

    // Ensure progress element exists
    let progressEl = card.querySelector(".course-progress");
    if (!progressEl) {
      progressEl = document.createElement("p");
      progressEl.className = "course-progress";
      card.appendChild(progressEl);
    }

    const summary = getCourseSummary(lang);
    const completedLevels = summary.completedLevels || 0;
    const totalLevels =
      summary.totalLevels || TOTAL_LEVELS_PER_COURSE;

    progressEl.textContent = `${completedLevels} / ${totalLevels} Levels Completed`;

    // per-course score
    let scoreEl = card.querySelector(".course-score");
    if (!scoreEl) {
      scoreEl = document.createElement("p");
      scoreEl.className = "course-score";
      card.appendChild(scoreEl);
    }
    const courseScore =
      totalLevels > 0
        ? Math.round((completedLevels / totalLevels) * 100)
        : 0;
    scoreEl.textContent = `Score: ${courseScore}%`;

    // Completed course -> green tick
    if (completedLevels >= totalLevels && totalLevels > 0) {
      card.classList.add("completed");
    } else {
      card.classList.remove("completed");
    }

    card.classList.remove("locked");
  });

  // Click handling (once per card)
  cards.forEach((card) => {
    if (card._eduwinHandlerAttached) return;
    card._eduwinHandlerAttached = true;

    card.addEventListener("click", () => {
      const lang = card.getAttribute("data-lang");
      showLoading();
      openLevels(lang);
    });
  });
}

/* ==============================
   HELPERS
   ============================== */
function getCourseTitle(lang) {
  switch (lang) {
    case "c": return "C Programming — 10 Levels";
    case "python": return "Python — 10 Levels";
    case "java": return "Java — 10 Levels";
    case "dsa": return "DSA — 10 Levels";
    case "cpp": return "C++ — 10 Levels";
    case "js": return "JavaScript — 10 Levels";
    case "csharp": return "C# — 10 Levels";
    case "dbms": return "DBMS + SQL — 10 Levels";
    case "os": return "Operating Systems — 10 Levels";
    case "cn": return "Computer Networks — 10 Levels";
    case "systemdesign": return "System Design — 10 Levels";
    case "htmlcss": return "HTML + CSS — 10 Levels";
    default: return "Course — 10 Levels";
  }
}

function getEditorPill(lang) {
  switch (lang) {
    case "c": return "C";
    case "python": return "Python";
    case "java": return "Java";
    case "cpp": return "C++";
    case "js": return "JavaScript";
    case "csharp": return "C#";
    case "htmlcss": return "HTML/CSS";
    case "dbms": return "SQL/Theory";
    case "os": return "OS Theory";
    case "cn": return "CN Theory";
    case "systemdesign": return "System Design";
    case "dsa": return "DSA";
    default: return "Code";
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* Default type based on course if level JSON doesn't specify */
function getDefaultLevelTypeForLang(lang) {
  if (lang === "dbms" || lang === "os" || lang === "systemdesign") {
    return "MCQ";
  }
  return "Compiler";
}

/* ==============================
   NAVIGATION
   ============================== */
function showHome(pushHistory = true) {
  authSection.classList.add("hidden");
  homeSection.classList.remove("hidden");
  levelsSection.classList.add("hidden");
  levelIntroSection.classList.add("hidden");
  challengeSection.classList.add("hidden");

  if (pushHistory) {
    history.pushState({ page: "home" }, "", "");
  }
}

function openLevels(lang, pushHistory = true) {
  currentLanguage = lang;
  selectedLanguageTitle.textContent = getCourseTitle(lang);

  const levelsPromise = loadLevelsUI(); // fetch data JSONs

  homeSection.classList.add("hidden");
  levelsSection.classList.remove("hidden");
  levelIntroSection.classList.add("hidden");
  challengeSection.classList.add("hidden");
  authSection.classList.add("hidden");

  if (pushHistory) {
    history.pushState({ page: "levels", lang }, "", "");
  }

  return levelsPromise;
}

/* ---------- Level intro ---------- */

function renderLevelIntro(notesJson, levelIdx) {
  const level = challengeData.levels[levelIdx];

  const notesTitle =
    notesJson.title || level.title || `Level ${levelIdx + 1}`;
  const notesIntro =
    notesJson.intro ||
    notesJson.description ||
    level.concept ||
    "In this level, you will practice problems related to this topic.";
  const points = Array.isArray(notesJson.points) ? notesJson.points : [];

  levelIntroTitle.textContent = notesTitle;
  levelIntroBreadcrumb.textContent = notesTitle;

  levelIntroBody.innerHTML = "";

  const p = document.createElement("p");
  p.textContent = notesIntro;
  p.className = "level-intro-text";
  levelIntroBody.appendChild(p);

  if (points.length > 0) {
    const ul = document.createElement("ul");
    ul.className = "level-notes-list";
    points.forEach((pt) => {
      const li = document.createElement("li");
      li.textContent = pt;
      ul.appendChild(li);
    });
    levelIntroBody.appendChild(ul);
  }
}

function openLevelIntro(levelIdx, pushHistory = true) {
  currentLevelIndex = levelIdx;

  const key = `${currentLanguage}_level${levelIdx + 1}`;
  const notesPath = `./notes/${currentLanguage}/level${levelIdx + 1}.json`;

  const showIntro = (notesJson) => {
    renderLevelIntro(notesJson, levelIdx);

    homeSection.classList.add("hidden");
    levelsSection.classList.add("hidden");
    challengeSection.classList.add("hidden");
    levelIntroSection.classList.remove("hidden");
    authSection.classList.add("hidden");

    if (pushHistory) {
      history.pushState(
        { page: "level-intro", lang: currentLanguage, levelIdx },
        "",
        ""
      );
    }
  };

  if (notesCache[key]) {
    showIntro(notesCache[key]);
  } else {
    fetch(notesPath)
      .then((r) => {
        if (!r.ok) throw new Error("Notes JSON not found: " + notesPath);
        return r.json();
      })
      .then((json) => {
        notesCache[key] = json;
        showIntro(json);
      })
      .catch((err) => {
        console.error(err);
        const fallback = {
          title: challengeData.levels[levelIdx].title || `Level ${levelIdx + 1}`,
          intro: "Notes for this level are coming soon.",
          points: []
        };
        notesCache[key] = fallback;
        showIntro(fallback);
      });
  }
}

function openChallenge(levelIdx, challengeIdx, pushHistory = true) {
  currentLevelIndex = levelIdx;
  currentChallengeIndex = challengeIdx;
  loadChallengeScreen();

  levelsSection.classList.add("hidden");
  levelIntroSection.classList.add("hidden");
  challengeSection.classList.remove("hidden");
  homeSection.classList.add("hidden");
  authSection.classList.add("hidden");

  if (pushHistory) {
    history.pushState(
      {
        page: "challenge",
        lang: currentLanguage,
        levelIdx,
        challengeIdx
      },
      "",
      ""
    );
  }
}

/* ==============================
   NORMALIZERS (support both styles)
   ============================== */

// Handle level JSON that may use "questions" instead of "challenges"
// and a per-level "type" field ("Compiler" / "MCQ").
function normalizeLevelJson(lvl, levelIndex, lang) {
  const normalized = { ...lvl };

  // Determine type from JSON or fallback to course default
  const rawType =
    (normalized.type || getDefaultLevelTypeForLang(lang || currentLanguage || "")).toString();
  const lower = rawType.toLowerCase();
  normalized.type = lower === "mcq" ? "MCQ" : "Compiler";

  // If it's using "questions" instead of "challenges" (DBMS/OS/SD style)
  if (!Array.isArray(normalized.challenges) && Array.isArray(normalized.questions)) {
    normalized.challenges = normalized.questions;
  }

  // Always make sure challenges is at least an empty array
  if (!Array.isArray(normalized.challenges)) {
    normalized.challenges = [];
  }

  return normalized;
}

// Convert each challenge to a common shape (MCQ / theory vs coding)
function normalizeChallengeObject(raw, challengeIndex, levelType) {
  if (!raw) {
    return {
      title: `Challenge ${challengeIndex + 1}`,
      description: "",
      inputDescription: "",
      outputDescription: "",
      examples: [],
      tests: [],
      starterCode: ""
    };
  }

  const levelTypeLower = (levelType || "").toString().toLowerCase();
  const levelIsMcq = levelTypeLower === "mcq";

  const hasQuestionField = typeof raw.question === "string";
  const hasOptions = raw.options && typeof raw.options === "object";
  const looksLikeMcq = levelIsMcq || (hasQuestionField && hasOptions && !raw.starterCode && !raw.tests);

  // MCQ / theory style (DBMS, OS, SD, etc.)
  if (looksLikeMcq) {
    const optionsText = Object.entries(raw.options || {})
      .map(([key, val]) => `${key}. ${val}`)
      .join("\n");

    const exampleBlocks = [];
    if (optionsText) {
      exampleBlocks.push("Options:\n" + optionsText);
    }
    if (raw.answer) {
      exampleBlocks.push("\nCorrect Answer: " + raw.answer);
    }
    if (raw.explanation) {
      exampleBlocks.push("\nExplanation: " + raw.explanation);
    }

    return {
      ...raw,
      title: raw.title || `Question ${challengeIndex + 1}`,
      description: raw.question,
      inputDescription: "Read the question carefully and choose the correct option.",
      outputDescription: "Correct option (A/B/C/D).",
      examples: exampleBlocks,
      tests: [], // theory only
      starterCode: ""
    };
  }

  // Coding style (already mostly in correct shape)
  return {
    ...raw,
    title: raw.title || `Challenge ${challengeIndex + 1}`,
    description: raw.description || "",
    inputDescription: raw.inputDescription || "",
    outputDescription: raw.outputDescription || "",
    examples: raw.examples || [],
    tests: raw.tests || [],
    starterCode: raw.starterCode || ""
  };
}

/* ==============================
   LOAD LEVELS UI FROM data/<lang>/levelX.json
   ============================== */
function loadLevelsUI() {
  levelsContainer.innerHTML = "";

  const progress = getProgress(currentLanguage);
  challengeData = null;

  const LEVEL_COUNT = 10;
  const levelPromises = [];

  for (let i = 1; i <= LEVEL_COUNT; i++) {
    levelPromises.push(
      fetch(`./data/${currentLanguage}/level${i}.json`)
        .then((r) => {
          if (!r.ok) {
            throw new Error(
              `Missing JSON: data/${currentLanguage}/level${i}.json`
            );
          }
          return r.json();
        })
        .then((json) => normalizeLevelJson(json, i - 1, currentLanguage))
        .catch((err) => {
          console.error(err);
          return {
            title: `Level ${i}`,
            concept: "Coming soon",
            type: getDefaultLevelTypeForLang(currentLanguage),
            challenges: []
          };
        })
    );
  }

  return Promise.all(levelPromises).then((levels) => {
    challengeData = { levels };

    levels.forEach((lvl, idx) => {
      const card = document.createElement("div");
      card.className = "level-card";

      const solvedCount = progress.levels[idx] || 0;
      const totalChallenges = Array.isArray(lvl.challenges)
        ? lvl.challenges.length
        : 0;

      // mark fully completed levels (for green tick)
      if (totalChallenges > 0 && solvedCount >= totalChallenges) {
        card.classList.add("completed");
      } else {
        card.classList.remove("completed");
      }

      // lock if previous level not fully completed
      if (idx > 0) {
        const prevTotal = Array.isArray(levels[idx - 1].challenges)
          ? levels[idx - 1].challenges.length
          : 0;
        if (progress.levels[idx - 1] < prevTotal || prevTotal === 0) {
          card.classList.add("locked");
        }
      }

      const levelScore =
        totalChallenges > 0
          ? Math.round((solvedCount / totalChallenges) * 100)
          : 0;

      card.innerHTML = `
        <h3>${lvl.title || `Level ${idx + 1}`}</h3>
        <p class="level-progress">${solvedCount}/${totalChallenges || 0} challenges completed</p>
        <p class="level-score">Score: ${levelScore}%</p>
      `;

      if (
        !card.classList.contains("locked") &&
        Array.isArray(lvl.challenges) &&
        lvl.challenges.length > 0
      ) {
        card.addEventListener("click", () => {
          openLevelIntro(idx);
        });
      }

      levelsContainer.appendChild(card);
    });

    // After building levels for this course, recompute its summary
    updateCourseSummaryForCurrentLanguage();
  });
}

/* ==============================
   RENDER MCQ LEVEL (type = MCQ)
   ============================== */
function renderMcqLevel(level) {
  if (!mcqContainer) return;

  const questions = Array.isArray(level.challenges) ? level.challenges : [];

  // Mark layout as MCQ and hide compiler side
  if (challengeLayout) {
    challengeLayout.classList.add("mcq-mode");
  }
  if (challengeRight) {
    challengeRight.classList.add("hidden");
  }

  // Hide single-question UI parts
  if (questionList) questionList.classList.add("hidden");
  if (ioContainerEl) ioContainerEl.classList.add("hidden");
  if (testTableEl) testTableEl.classList.add("hidden");
  if (navButtonsContainer) navButtonsContainer.classList.add("hidden");

  // Clear MCQ container and show it
  mcqContainer.innerHTML = "";
  mcqContainer.classList.remove("hidden");

  // Heading / info
  challengeTitle.textContent =
    level.title || `Level ${currentLevelIndex + 1} — MCQs`;
  challengeDescription.textContent =
    "Answer all questions below. Each has exactly one correct option.";
  challengeConcept.textContent = level.concept || "";

  challengeBreadcrumb.textContent = `${level.title} — MCQ Level (${questions.length} questions)`;

  // Build each question card
  questions.forEach((q, idx) => {
    const card = document.createElement("div");
    card.className = "mcq-question-card";

    const qTitle = document.createElement("h3");
    qTitle.className = "mcq-question-title";

    const qText =
      q.question || q.description || q.title || `Question ${idx + 1}`;
    qTitle.textContent = `Q${idx + 1}. ${qText}`;

    const optsDiv = document.createElement("div");
    optsDiv.className = "mcq-options";

    const options = q.options || {};
    const optionKeys = Object.keys(options);

    optionKeys.forEach((key) => {
      const optId = `mcq_${currentLevelIndex}_${idx}_${key}`;

      const label = document.createElement("label");
      label.className = "mcq-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `mcq_${currentLevelIndex}_${idx}`;
      input.id = optId;
      input.value = key;

      const keySpan = document.createElement("span");
      keySpan.className = "mcq-option-key";
      keySpan.textContent = key + ")";

      const textSpan = document.createElement("span");
      textSpan.className = "mcq-option-text";
      textSpan.textContent = options[key];

      label.appendChild(input);
      label.appendChild(keySpan);
      label.appendChild(textSpan);
      optsDiv.appendChild(label);
    });

    card.appendChild(qTitle);
    card.appendChild(optsDiv);
    mcqContainer.appendChild(card);
  });

  // Submit button + result line
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit Answers";
  submitBtn.className = "btn primary mcq-submit-btn";

  const resultEl = document.createElement("p");
  resultEl.className = "challenge-status";

  submitBtn.addEventListener("click", () => {
    let correctCount = 0;

    questions.forEach((q, idx) => {
      const correct = (q.answer || "").toString().trim().toUpperCase();
      const selector = `input[name="mcq_${currentLevelIndex}_${idx}"]:checked`;
      const chosen = document.querySelector(selector);
      const cardEl = mcqContainer.children[idx];

      cardEl.classList.remove("correct", "incorrect", "unanswered");

      if (!chosen) {
        cardEl.classList.add("unanswered");
        return;
      }

      if (chosen.value.toUpperCase() === correct) {
        correctCount++;
        cardEl.classList.add("correct");
      } else {
        cardEl.classList.add("incorrect");
      }
    });

    resultEl.textContent = `You got ${correctCount} / ${questions.length} correct.`;

    if (correctCount === questions.length && questions.length > 0) {
      challengeStatusMsg.textContent =
        "✅ All answers correct! Level completed.";

      // Mark this whole level as completed (all 'challenges' solved)
      const progress = getProgress(currentLanguage);
      progress.levels[currentLevelIndex] = questions.length;
      saveProgress(currentLanguage, progress);
      updateCourseSummaryForCurrentLanguage();
    } else {
      challengeStatusMsg.textContent =
        "Some answers are incorrect or unanswered. Correct questions are highlighted in green.";
    }
  });

  mcqContainer.appendChild(submitBtn);
  mcqContainer.appendChild(resultEl);
}

/* ==============================
   LOAD CHALLENGE SCREEN
   ============================== */
function loadChallengeScreen() {
  const level = challengeData.levels[currentLevelIndex];
  const totalChallenges = Array.isArray(level.challenges)
    ? level.challenges.length
    : 0;

  const levelType = (level.type || getDefaultLevelTypeForLang(currentLanguage))
    .toString()
    .toLowerCase();
  const isMcqLevel = levelType === "mcq";

  // ----- MCQ LEVEL: show all questions with radios, no compiler -----
  if (isMcqLevel) {
    renderMcqLevel(level);

    // Disable prev/next for MCQ mode
    prevChallengeBtn.disabled = true;
    nextChallengeBtn.disabled = true;

    // Clear compiler output badges
    if (outputArea) outputArea.textContent = "";
    if (testSummaryBadge) {
      testSummaryBadge.textContent = "–";
      testSummaryBadge.classList.remove("all-pass");
    }

    // Status text
    challengeStatusMsg.textContent =
      "MCQ level — read all questions and select the correct options, then press Submit.";

    return; // IMPORTANT: don't run the compiler-style code below
  }

  // ----- COMPILER LEVEL: normal behaviour (one challenge at a time) -----

  // Make sure MCQ UI is hidden and normal UI is visible
  if (mcqContainer) {
    mcqContainer.innerHTML = "";
    mcqContainer.classList.add("hidden");
  }
  if (questionList) questionList.classList.remove("hidden");
  if (ioContainerEl) ioContainerEl.classList.remove("hidden");
  if (testTableEl) testTableEl.classList.remove("hidden");
  if (navButtonsContainer) navButtonsContainer.classList.remove("hidden");

  if (challengeLayout) challengeLayout.classList.remove("mcq-mode");
  if (challengeRight) challengeRight.classList.remove("hidden");

  const rawChallenge = level.challenges[currentChallengeIndex];
  const challenge = normalizeChallengeObject(
    rawChallenge,
    currentChallengeIndex,
    level.type
  );

  challengeBreadcrumb.textContent = `${level.title} — Challenge ${
    currentChallengeIndex + 1
  } / ${totalChallenges}`;

  /* Build question list pills */
  if (questionList) {
    questionList.innerHTML = "";

    const progress = getProgress(currentLanguage);
    const unlockedCount = progress.levels[currentLevelIndex] || 0;

    for (let i = 0; i < totalChallenges; i++) {
      const btn = document.createElement("button");
      btn.className = "question-item";
      btn.textContent = `Q${i + 1}`;

      if (i === currentChallengeIndex) {
        btn.classList.add("active");
      }

      if (i > unlockedCount) {
        btn.classList.add("locked");
      } else {
        btn.addEventListener("click", () => {
          if (i !== currentChallengeIndex) {
            openChallenge(currentLevelIndex, i, false);
          }
        });
      }

      questionList.appendChild(btn);
    }
  }

  // Left panel (description + IO)
  challengeTitle.textContent = challenge.title;
  challengeDescription.textContent = challenge.description || "";
  challengeConcept.textContent = level.concept || "";

  inputFormat.textContent = challenge.inputDescription || "";
  outputFormat.textContent = challenge.outputDescription || "";
  examplesArea.textContent = (challenge.examples || []).join("\n\n");

  // Test table
  testcaseTable.innerHTML = "";
  (challenge.tests || []).forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${(t.input || "").replace(/\n/g, "\\n")}</td>
      <td>${(t.expected || "").replace(/\n/g, "\\n")}</td>
      <td class="status status-notrun">Not Run</td>
    `;
    tr.title = "Click to run only this test case";
    tr.addEventListener("click", () => {
      runSingleTest(i);
    });
    testcaseTable.appendChild(tr);
  });

  // Compiler panel
  const savedKey = getUserScopedKey(
    `code_${currentLanguage}_${currentLevelIndex}_${currentChallengeIndex}`
  );
  const saved = localStorage.getItem(savedKey);

  if (saved && saved.trim() !== "") {
    codeEditor.value = saved;
  } else {
    codeEditor.value = challenge.starterCode || "";
  }

  editorLangPill.textContent = getEditorPill(currentLanguage);

  const progress = getProgress(currentLanguage);
  prevChallengeBtn.disabled = currentChallengeIndex === 0;
  nextChallengeBtn.disabled =
    progress.levels[currentLevelIndex] <= currentChallengeIndex;

  // Reset status / output
  challengeStatusMsg.textContent = "";
  if (outputArea) {
    outputArea.textContent = "";
  }
  if (testSummaryBadge) {
    testSummaryBadge.textContent = "–";
    testSummaryBadge.classList.remove("all-pass");
  }
}


  // Left panel
  challengeTitle.textContent = challenge.title;
  challengeDescription.textContent = challenge.description || "";
  challengeConcept.textContent = level.concept || "";

  inputFormat.textContent = challenge.inputDescription || "";
  outputFormat.textContent = challenge.outputDescription || "";
  examplesArea.textContent = (challenge.examples || []).join("\n\n");

  // Test table (Compiler only – for MCQ it's empty anyway)
  testcaseTable.innerHTML = "";
  (challenge.tests || []).forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${(t.input || "").replace(/\n/g, "\\n")}</td>
      <td>${(t.expected || "").replace(/\n/g, "\\n")}</td>
      <td class="status status-notrun">Not Run</td>
    `;
    tr.title = "Click to run only this test case";
    tr.addEventListener("click", () => {
      runSingleTest(i);
    });
    testcaseTable.appendChild(tr);
  });

  // Compiler panel only makes sense for "Compiler" levels
  if (!isMcqLevel) {
    // Load saved code if exists (per user)
    const savedKey = getUserScopedKey(
      `code_${currentLanguage}_${currentLevelIndex}_${currentChallengeIndex}`
    );
    const saved = localStorage.getItem(savedKey);

    if (saved && saved.trim() !== "") {
      codeEditor.value = saved;
    } else {
      codeEditor.value = challenge.starterCode || "";
    }

    editorLangPill.textContent = getEditorPill(currentLanguage);
  }

  const progress = getProgress(currentLanguage);
  prevChallengeBtn.disabled = currentChallengeIndex === 0;
  nextChallengeBtn.disabled =
    progress.levels[currentLevelIndex] <= currentChallengeIndex;

  if (isMcqLevel) {
    // For MCQ levels, status can guide the student instead of tests
    challengeStatusMsg.textContent =
      "MCQ level — read the question and select the correct option from the given choices.";
    if (outputArea) {
      outputArea.textContent = "";
    }
    if (testSummaryBadge) {
      testSummaryBadge.textContent = "–";
      testSummaryBadge.classList.remove("all-pass");
    }
  } else {
    // Compiler levels: reset status as usual
    challengeStatusMsg.textContent = "";
    if (outputArea) {
      outputArea.textContent = "";
    }
    if (testSummaryBadge) {
      testSummaryBadge.textContent = "–";
      testSummaryBadge.classList.remove("all-pass");
    }
  }


/* ==============================
   RUN CODE (NO TESTS)
   ============================== */
async function runCode() {
  const langId = JUDGE_LANG_MAP[currentLanguage];

  if (!langId) {
    if (outputArea) {
      outputArea.textContent =
        "⚠ Code execution is disabled for this course. Focus on logic/theory here.";
    }
    return;
  }

  if (outputArea) {
    outputArea.textContent = "⏳ Running.";
  }
  if (testSummaryBadge) {
    testSummaryBadge.textContent = "Running.";
    testSummaryBadge.classList.remove("all-pass");
  }

  const payload = {
    language_id: langId,
    source_code: codeEditor.value,
    stdin: ""
  };

  const job = await fetch(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  ).then((r) => r.json());

  let result;
  while (true) {
    await new Promise((res) => setTimeout(res, 1200));
    result = await fetch(
      `${JUDGE0_URL}/submissions/${job.token}?base64_encoded=false`
    ).then((r) => r.json());
    if (result.status.id >= 3) break;
  }

  let out = result.stdout || "";
  if (result.stderr) out += "\n[stderr]\n" + result.stderr;
  if (result.compile_output) out += "\n[compile]\n" + result.compile_output;

  if (outputArea) {
    outputArea.textContent = out.trim();
  }
  if (testSummaryBadge) {
    testSummaryBadge.textContent = "Manual Run";
  }
}

/* ==============================
   JUDGE HELPER FOR TESTS
   ============================== */
async function runJudgeForInput(langId, stdinValue) {
  const payload = {
    language_id: langId,
    source_code: codeEditor.value,
    stdin: stdinValue
  };

  const job = await fetch(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  ).then((r) => r.json());

  let result;
  while (true) {
    await new Promise((res) => setTimeout(res, 900));
    result = await fetch(
      `${JUDGE0_URL}/submissions/${job.token}?base64_encoded=false`
    ).then((r) => r.json());
    if (result.status.id >= 3) break;
  }
  return result;
}

/* ==============================
   RENDER TEST RESULTS
   ============================== */
function renderTestResults(results, summary) {
  // summary: { totalTests, passedCount, failedFirst, singleMode }
  const { totalTests, passedCount, singleMode } = summary;

  if (!outputArea) return;

  outputArea.innerHTML = "";

  // summary badge
  if (testSummaryBadge) {
    if (passedCount === totalTests) {
      testSummaryBadge.textContent = "All Pass ✅";
      testSummaryBadge.classList.add("all-pass");
    } else {
      testSummaryBadge.textContent = `${passedCount}/${totalTests} Passed`;
      testSummaryBadge.classList.remove("all-pass");
    }
  }

  const list = document.createElement("div");
  list.className = "test-result-list";

  results.forEach((res) => {
    const card = document.createElement("div");
    card.className =
      "test-result-card " + (res.isPass ? "pass" : "fail");

    const header = document.createElement("div");
    header.className = "test-result-header";

    const left = document.createElement("div");
    left.className = "test-header-left";
    const title = document.createElement("span");
    title.className = "test-title";
    title.textContent = `Test #${res.index + 1}`;
    left.appendChild(title);

    const status = document.createElement("span");
    status.className =
      "test-status " + (res.isPass ? "status-pass" : "status-fail");
    status.textContent = res.isPass ? "Pass" : "Fail";
    left.appendChild(status);

    header.appendChild(left);

    const right = document.createElement("div");
    right.className = "test-header-right";

    if (typeof res.timeMs === "number") {
      const chipTime = document.createElement("span");
      chipTime.className = "test-chip time";
      chipTime.textContent = `${res.timeMs} ms`;
      right.appendChild(chipTime);
    }

    if (typeof res.memoryKb === "number") {
      const chipMem = document.createElement("span");
      chipMem.className = "test-chip memory";
      chipMem.textContent = `${res.memoryKb} KB`;
      right.appendChild(chipMem);
    }

    const chev = document.createElement("span");
    chev.className = "test-chevron";
    chev.textContent = "⌄";
    right.appendChild(chev);

    header.appendChild(right);
    card.appendChild(header);

    const body = document.createElement("div");
    body.className = "test-result-body";

    body.innerHTML = `
      <div class="test-block">
        <h4>Input</h4>
        <pre>${escapeHtml(res.input)}</pre>
      </div>
      <div class="test-block">
        <h4>Expected Output</h4>
        <pre>${escapeHtml(res.expected)}</pre>
      </div>
      <div class="test-block">
        <h4>Your Output</h4>
        <pre>${escapeHtml(res.displayOutput)}</pre>
      </div>
    `;
    card.appendChild(body);

    // default open: all fails, and singleMode card
    if (!res.isPass || singleMode) {
      card.classList.add("open");
    }

    header.addEventListener("click", () => {
      card.classList.toggle("open");
    });

    list.appendChild(card);
  });

  outputArea.appendChild(list);
}

/* ==============================
   RUN TESTS + UNLOCK PROGRESS
   ============================== */
async function testCode() {
  const langId = JUDGE_LANG_MAP[currentLanguage];
  if (!langId) {
    challengeStatusMsg.textContent =
      "⚠ Automatic test checking is disabled for this course.";
    return;
  }

  const level = challengeData.levels[currentLevelIndex];
  const challenge = level.challenges[currentChallengeIndex];
  const rows = testcaseTable.querySelectorAll("tr");
  const tests = challenge.tests || [];

  if (!tests.length) {
    challengeStatusMsg.textContent = "No tests configured for this challenge.";
    if (outputArea) {
      outputArea.textContent = "No tests configured.";
    }
    return;
  }

  let passed = 0;
  challengeStatusMsg.textContent = "Running all tests.";
  if (outputArea) {
    outputArea.textContent = "Running tests on all cases.";
  }
  if (testSummaryBadge) {
    testSummaryBadge.textContent = "Running.";
    testSummaryBadge.classList.remove("all-pass");
  }

  const results = [];

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];

    const statusCell = rows[i].querySelector(".status");
    statusCell.textContent = "Running.";
    statusCell.className = "status status-running";

    const judge = await runJudgeForInput(langId, t.input || "");

    const rawStdout = judge.stdout || "";
    const stderr = judge.stderr || "";
    const compileOutput = judge.compile_output || "";

    const actual = rawStdout.trim();
    const expected = (t.expected || "").trim();

    let displayOutput = "";
    if (rawStdout) displayOutput += rawStdout;
    if (stderr) displayOutput += (displayOutput ? "\n" : "") + "[stderr]\n" + stderr;
    if (compileOutput) displayOutput += (displayOutput ? "\n" : "") + "[compile]\n" + compileOutput;
    if (!displayOutput) displayOutput = "(no output)";

    const isPass = actual === expected;
    if (isPass) passed++;

    statusCell.textContent = isPass ? "Pass" : "Fail";
    statusCell.className =
      "status " + (isPass ? "status-pass" : "status-fail");

    const timeMs =
      judge.time != null ? Math.round(parseFloat(judge.time) * 1000) : undefined;
    const memoryKb = judge.memory != null ? judge.memory : undefined;

    results.push({
      index: i,
      input: t.input || "",
      expected,
      displayOutput,
      isPass,
      timeMs,
      memoryKb
    });
  }

  challengeStatusMsg.textContent =
    passed === tests.length
      ? "✅ All test cases passed!"
      : `Some tests failed. Passed ${passed} / ${tests.length}.`;

  renderTestResults(results, {
    totalTests: tests.length,
    passedCount: passed,
    failedFirst: passed !== tests.length,
    singleMode: false
  });

  if (passed === tests.length) {
    unlockNext();
  }
}

/* ==============================
   RUN A SINGLE TEST
   ============================== */
async function runSingleTest(testIndex) {
  const langId = JUDGE_LANG_MAP[currentLanguage];
  if (!langId) {
    challengeStatusMsg.textContent =
      "⚠ Automatic test checking is disabled for this course.";
    return;
  }

  const level = challengeData.levels[currentLevelIndex];
  const challenge = level.challenges[currentChallengeIndex];
  const tests = challenge.tests || [];
  const rows = testcaseTable.querySelectorAll("tr");

  if (testIndex < 0 || testIndex >= tests.length) return;

  const t = tests[testIndex];
  const row = rows[testIndex];
  const statusCell = row.querySelector(".status");

  challengeStatusMsg.textContent = `Running only Test ${testIndex + 1}.`;
  if (outputArea) {
    outputArea.textContent = `Running Test ${testIndex + 1}.`;
  }
  if (testSummaryBadge) {
    testSummaryBadge.textContent = `Test ${testIndex + 1}`;
    testSummaryBadge.classList.remove("all-pass");
  }

  statusCell.textContent = "Running.";
  statusCell.className = "status status-running";

  const judge = await runJudgeForInput(langId, t.input || "");

  const rawStdout = judge.stdout || "";
  const stderr = judge.stderr || "";
  const compileOutput = judge.compile_output || "";

  const actual = rawStdout.trim();
  const expected = (t.expected || "").trim();

  let displayOutput = "";
  if (rawStdout) displayOutput += rawStdout;
  if (stderr) displayOutput += (displayOutput ? "\n" : "") + "[stderr]\n" + stderr;
  if (compileOutput) displayOutput += (displayOutput ? "\n" : "") + "[compile]\n" + compileOutput;
  if (!displayOutput) displayOutput = "(no output)";

  const isPass = actual === expected;

  if (isPass) {
    statusCell.textContent = "Pass";
    statusCell.className = "status status-pass";
    challengeStatusMsg.textContent = `✅ Test ${testIndex + 1} passed.`;
  } else {
    statusCell.textContent = "Fail";
    statusCell.className = "status status-fail";
    challengeStatusMsg.textContent = `❌ Test ${testIndex + 1} failed.`;
  }

  const timeMs =
    judge.time != null ? Math.round(parseFloat(judge.time) * 1000) : undefined;
  const memoryKb = judge.memory != null ? judge.memory : undefined;

  renderTestResults(
    [
      {
        index: testIndex,
        input: t.input || "",
        expected,
        displayOutput,
        isPass,
        timeMs,
        memoryKb
      }
    ],
    {
      totalTests: 1,
      passedCount: isPass ? 1 : 0,
      failedFirst: false,
      singleMode: true
    }
  );
}

/* ==============================
   UNLOCK NEXT (PROGRESS)
   ============================== */
function unlockNext() {
  const progress = getProgress(currentLanguage);
  const level = challengeData.levels[currentLevelIndex];
  const totalChallenges = level.challenges.length;

  if (progress.levels[currentLevelIndex] < currentChallengeIndex + 1) {
    progress.levels[currentLevelIndex] = currentChallengeIndex + 1;
    saveProgress(currentLanguage, progress);
  }

  nextChallengeBtn.disabled =
    progress.levels[currentLevelIndex] <= currentChallengeIndex;

  if (progress.levels[currentLevelIndex] === totalChallenges) {
    updateCourseSummaryForCurrentLanguage();
  }

  // Do NOT reload the challenge screen here,
  // so the user still sees the latest test statuses & outputs.
}

/* ==============================
   BUTTON EVENTS
   ============================== */
// AUTO SAVE code on typing (per user)
codeEditor.addEventListener("input", () => {
  if (currentLanguage !== null) {
    const key = getUserScopedKey(
      `code_${currentLanguage}_${currentLevelIndex}_${currentChallengeIndex}`
    );
    localStorage.setItem(key, codeEditor.value);
  }
});

runCodeBtn.addEventListener("click", runCode);
testCodeBtn.addEventListener("click", testCode);

resetStarterBtn.addEventListener("click", () => {
  const level = challengeData.levels[currentLevelIndex];
  const challenge = level.challenges[currentChallengeIndex];

  const key = getUserScopedKey(
    `code_${currentLanguage}_${currentLevelIndex}_${currentChallengeIndex}`
  );
  localStorage.removeItem(key);

  codeEditor.value = challenge.starterCode || "";
});

clearCodeBtn.addEventListener("click", () => {
  codeEditor.value = "";
  if (currentLanguage !== null) {
    const key = getUserScopedKey(
      `code_${currentLanguage}_${currentLevelIndex}_${currentChallengeIndex}`
    );
    localStorage.setItem(key, "");
  }
});

prevChallengeBtn.addEventListener("click", () => {
  if (currentChallengeIndex > 0) {
    openChallenge(currentLevelIndex, currentChallengeIndex - 1, false);
  }
});

nextChallengeBtn.addEventListener("click", () => {
  const level = challengeData.levels[currentLevelIndex];
  const totalChallenges = level.challenges.length;
  const progress = getProgress(currentLanguage);

  if (progress.levels[currentLevelIndex] >= currentChallengeIndex + 1) {
    if (currentChallengeIndex < totalChallenges - 1) {
      openChallenge(currentLevelIndex, currentChallengeIndex + 1, false);
    } else {
      const isLastLevel =
        currentLevelIndex === challengeData.levels.length - 1;

      if (isLastLevel) {
        challengeStatusMsg.textContent =
          "✅ You finished all challenges in this course!";
        nextChallengeBtn.disabled = true;
      } else {
        if (progress.levels[currentLevelIndex] === totalChallenges) {
          const nextLevelIndex = currentLevelIndex + 1;
          openLevelIntro(nextLevelIndex);
        } else {
          challengeStatusMsg.textContent =
            "Complete all challenges in this level to unlock the next level.";
        }
      }
    }
  }
});

// From Level Intro → first challenge
startPracticingBtn.addEventListener("click", () => {
  openChallenge(currentLevelIndex, 0);
});

/* Back buttons (use browser history) */
backToHome.addEventListener("click", () => history.back());
backToLevels.addEventListener("click", () => history.back());
backToLevelsFromIntro.addEventListener("click", () => history.back());

/* AUTH UI EVENTS */
authToggleMode.addEventListener("click", () => {
  authMode = authMode === "login" ? "signup" : "login";
  updateAuthModeUI();
});

authSubmitBtn.addEventListener("click", handleAuthSubmit);

authPassword.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleAuthSubmit();
  }
});

/* PROFILE MENU EVENTS */
profileButton.addEventListener("click", () => {
  profileMenu.classList.toggle("open");
});

document.addEventListener("click", (e) => {
  if (
    !profileMenu.contains(e.target) &&
    !profileButton.contains(e.target)
  ) {
    profileMenu.classList.remove("open");
  }
});

switchUserBtn.addEventListener("click", () => {
  profileMenu.classList.remove("open");
  localStorage.removeItem(CURRENT_USER_KEY);
  updateUserUI();
  showAuth(true);
});

logoutBtn.addEventListener("click", () => {
  profileMenu.classList.remove("open");
  localStorage.removeItem(CURRENT_USER_KEY);
  updateUserUI();
  showAuth(true);
});

/* Handle browser / Android back */
window.addEventListener("popstate", (event) => {
  const state = event.state;

  if (!state) {
    const user = getCurrentUser();
    if (user) {
      showHome(false);
    } else {
      showAuth(false);
    }
  } else if (state.page === "auth") {
    showAuth(false);
  } else if (state.page === "home") {
    showHome(false);
  } else if (state.page === "levels") {
    currentLanguage = state.lang;
    openLevels(state.lang, false);
  } else if (state.page === "level-intro") {
    currentLanguage = state.lang;
    openLevels(state.lang, false).then(() => {
      openLevelIntro(state.levelIdx, false);
    });
  } else if (state.page === "challenge") {
    currentLanguage = state.lang;
    openLevels(state.lang, false).then(() => {
      openChallenge(state.levelIdx, state.challengeIdx, false);
    });
  }
});

/* Initial state */
updateAuthModeUI();
updateUserUI();

if (!history.state) {
  const user = getCurrentUser();
  if (user) {
    history.replaceState({ page: "home" }, "", "");
    showHome(false);
  } else {
    history.replaceState({ page: "auth" }, "", "");
    showAuth(false);
  }
}

// Initialize home course cards (logos, progress) for current user
updateCourseCardsUI();
