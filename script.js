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

/* THEME TOGGLE DOM */
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeToggleLabel = document.getElementById("themeToggleLabel");


/* Detect which page we are on */
const isAuthPage = !!authSection && !homeSection;   // login.html
const isMainAppPage = !!homeSection;               // index.html

// Global state
let currentLanguage = null;
let challengeData = null; // { levels: [ level1Json, level2Json, ... ] }
let notesCache = {};      // key: `${lang}_level${i}` -> notes json
let currentLevelIndex = 0;
let currentChallengeIndex = 0;

/* AUTH STATE */
let authMode = "login"; // "login" or "signup"
const CURRENT_USER_KEY = "eduwin_currentUser";

/* ==============================
   BACKEND CONFIG
   ============================== */
const BACKEND_URL = "https://eduwin-backend.onrender.com"; // backend URL

/* ==============================
   JUDGE0 CONFIG
   ============================== */
const JUDGE0_URL = "https://ce.judge0.com";
const JUDGE_LANG_MAP = {
  c: 50,        // GCC C
  python: 71,   // Python 3
  java: 62,     // Java
  // Allow DSA challenges to run on a default language (Python 3) so
  // coding problems under the `dsa` course can be executed.
  // If you prefer a different default set this to another Judge0 id.
  dsa: 50,
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

/* ==============================
   THEME (LIGHT / DARK)
   ============================== */

function getStoredTheme() {
  // Per-user theme; falls back to light
  const key = getUserScopedKey("theme");
  return localStorage.getItem(key) || "light";
}

function applyTheme(theme) {
  const body = document.body;
  if (!body) return;

  const normalized = theme === "dark" ? "dark" : "light";

  body.classList.toggle("theme-dark", normalized === "dark");
  body.classList.toggle("theme-light", normalized === "light");

  const key = getUserScopedKey("theme");
  localStorage.setItem(key, normalized);

  if (themeToggleLabel) {
    themeToggleLabel.textContent =
      normalized === "dark" ? "Dark" : "Light";
  }
  if (themeToggleBtn) {
    themeToggleBtn.setAttribute("data-theme", normalized);
  }
}

/* UI updates for login / signup mode */
function updateAuthModeUI() {
  if (!authTitle || !authSubtitle || !authSubmitBtn || !authToggleMode) return;

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

  if (!currentUserLabel || !profileButton || !profileMenu) return;

  if (!user) {
    currentUserLabel.classList.add("hidden");
    profileButton.classList.add("hidden");
    profileMenu.classList.remove("open");
    return;
  }

  currentUserLabel.classList.remove("hidden");
  profileButton.classList.remove("hidden");

  if (currentUserNameEl) currentUserNameEl.textContent = user;
  if (profileInitial) profileInitial.textContent = user.charAt(0).toUpperCase();
  if (profileMenuName) profileMenuName.textContent = user;
}

/* AUTH SECTION SHOW / HIDE */
function showAuth(pushHistory = true) {
  // If auth section is not on this page, go to login.html
  if (!authSection) {
    window.location.href = "login.html";
    return;
  }

  authSection.classList.remove("hidden");
  if (homeSection) homeSection.classList.add("hidden");
  if (levelsSection) levelsSection.classList.add("hidden");
  if (levelIntroSection) levelIntroSection.classList.add("hidden");
  if (challengeSection) challengeSection.classList.add("hidden");

  if (pushHistory && typeof history !== "undefined") {
    history.pushState({ page: "auth" }, "", "");
  }
}

async function handleAuthSubmit() {
  if (!authUsername || !authPassword) return;

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

    // After successful login, go to main app page
    window.location.href = "index.html";
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
  if (!isMainAppPage) return;

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
   NAVIGATION (MAIN APP)
   ============================== */
function showHome(pushHistory = true) {
  // If we are somehow on login page, go to index
  if (!homeSection) {
    window.location.href = "index.html";
    return;
  }

  if (authSection) authSection.classList.add("hidden");
  homeSection.classList.remove("hidden");
  if (levelsSection) levelsSection.classList.add("hidden");
  if (levelIntroSection) levelIntroSection.classList.add("hidden");
  if (challengeSection) challengeSection.classList.add("hidden");

  if (pushHistory && typeof history !== "undefined") {
    history.pushState({ page: "home" }, "", "");
  }
}

function openLevels(lang, pushHistory = true) {
  if (!isMainAppPage) return;

  currentLanguage = lang;
  if (selectedLanguageTitle) {
    selectedLanguageTitle.textContent = getCourseTitle(lang);
  }

  const levelsPromise = loadLevelsUI(); // fetch data JSONs

  if (homeSection) homeSection.classList.add("hidden");
  if (levelsSection) levelsSection.classList.remove("hidden");
  if (levelIntroSection) levelIntroSection.classList.add("hidden");
  if (challengeSection) challengeSection.classList.add("hidden");
  if (authSection) authSection.classList.add("hidden");

  if (pushHistory && typeof history !== "undefined") {
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

  if (levelIntroTitle) levelIntroTitle.textContent = notesTitle;
  if (levelIntroBreadcrumb) levelIntroBreadcrumb.textContent = notesTitle;

  if (!levelIntroBody) return;
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
  if (!isMainAppPage) return;

  currentLevelIndex = levelIdx;

  const key = `${currentLanguage}_level${levelIdx + 1}`;
  const notesPath = `./notes/${currentLanguage}/level${levelIdx + 1}.json`;

  const showIntro = (notesJson) => {
    renderLevelIntro(notesJson, levelIdx);

    if (homeSection) homeSection.classList.add("hidden");
    if (levelsSection) levelsSection.classList.add("hidden");
    if (challengeSection) challengeSection.classList.add("hidden");
    if (levelIntroSection) levelIntroSection.classList.remove("hidden");
    if (authSection) authSection.classList.add("hidden");

    if (pushHistory && typeof history !== "undefined") {
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
  if (!isMainAppPage) return;

  currentLevelIndex = levelIdx;
  currentChallengeIndex = challengeIdx;
  loadChallengeScreen();

  if (levelsSection) levelsSection.classList.add("hidden");
  if (levelIntroSection) levelIntroSection.classList.add("hidden");
  if (challengeSection) challengeSection.classList.remove("hidden");
  if (homeSection) homeSection.classList.add("hidden");
  if (authSection) authSection.classList.add("hidden");

  if (pushHistory && typeof history !== "undefined") {
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
      tests: [],
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
  if (!levelsContainer) return Promise.resolve();

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
  if (challengeTitle) {
    challengeTitle.textContent =
      level.title || `Level ${currentLevelIndex + 1} — MCQs`;
  }
  if (challengeDescription) {
    challengeDescription.textContent =
      "Answer all questions below. Each has exactly one correct option.";
  }
  if (challengeConcept) {
    challengeConcept.textContent = level.concept || "";
  }

  if (challengeBreadcrumb) {
    challengeBreadcrumb.textContent = `${level.title} — MCQ Level (${questions.length} questions)`;
  }

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

    // Explanation / feedback area (initially hidden)
    const explanationDiv = document.createElement("div");
    explanationDiv.className = "mcq-explanation hidden";

    card.appendChild(qTitle);
    card.appendChild(optsDiv);
    card.appendChild(explanationDiv);
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

      const explanationEl = cardEl.querySelector(".mcq-explanation");

      const options = q.options || {};
      const correctOptionText = options[correct] || "";
      const userChoice = chosen ? chosen.value.toUpperCase() : null;

      let statusLine = "";

      if (!chosen) {
        cardEl.classList.add("unanswered");
        statusLine = "You did not select any option.";
      } else if (userChoice === correct) {
        correctCount++;
        cardEl.classList.add("correct");
        statusLine = "Your answer is correct ✅";
      } else {
        cardEl.classList.add("incorrect");
        statusLine = `Your answer (${userChoice}) is incorrect ❌`;
      }

      // Always show correct answer + explanation
      if (explanationEl) {
        explanationEl.classList.remove("hidden");
        const safeCorrectText = escapeHtml(correctOptionText);
        const safeExplanation = escapeHtml(
          q.explanation || "Explanation coming soon."
        );

        explanationEl.innerHTML = `
          <p><strong>Correct answer:</strong> ${correct}) ${safeCorrectText}</p>
          <p>${safeExplanation}</p>
          <p class="mcq-status-line">${statusLine}</p>
        `;
      }
    });

    resultEl.textContent = `You got ${correctCount} / ${questions.length} correct.`;

    if (correctCount === questions.length && questions.length > 0) {
      if (challengeStatusMsg) {
        challengeStatusMsg.textContent =
          "✅ All answers correct! Level completed.";
      }

      // Mark this whole level as completed (all 'challenges' solved)
      const progress = getProgress(currentLanguage);
      progress.levels[currentLevelIndex] = questions.length;
      saveProgress(currentLanguage, progress);
      updateCourseSummaryForCurrentLanguage();
    } else {
      if (challengeStatusMsg) {
        challengeStatusMsg.textContent =
          "Some answers are incorrect or unanswered. Correct answers and explanations are shown below each question.";
      }
    }
  });

  mcqContainer.appendChild(submitBtn);
  mcqContainer.appendChild(resultEl);
}


/* ==============================
   LOAD CHALLENGE SCREEN
   ============================== */
function loadChallengeScreen() {
  if (!isMainAppPage || !challengeData) return;

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
    if (prevChallengeBtn) prevChallengeBtn.disabled = true;
    if (nextChallengeBtn) nextChallengeBtn.disabled = true;

    // Clear compiler output badges
    if (outputArea) outputArea.textContent = "";
    if (testSummaryBadge) {
      testSummaryBadge.textContent = "–";
      testSummaryBadge.classList.remove("all-pass");
    }

    if (challengeStatusMsg) {
      challengeStatusMsg.textContent =
        "MCQ level — read all questions and select the correct options, then press Submit.";
    }

    return; // don't run compiler-style code below
  }

  // ----- COMPILER LEVEL: normal behaviour (one challenge at a time) -----
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

  if (challengeBreadcrumb) {
    challengeBreadcrumb.textContent = `${level.title} — Challenge ${
      currentChallengeIndex + 1
    } / ${totalChallenges}`;
  }

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
  if (challengeTitle) challengeTitle.textContent = challenge.title;
  if (challengeDescription) {
    challengeDescription.textContent = challenge.description || "";
  }
  if (challengeConcept) {
    challengeConcept.textContent = level.concept || "";
  }

  if (inputFormat) {
    inputFormat.textContent = challenge.inputDescription || "";
  }
  if (outputFormat) {
    outputFormat.textContent = challenge.outputDescription || "";
  }
  if (examplesArea) {
    examplesArea.textContent = (challenge.examples || []).join("\n\n");
  }

  // Test table
  if (testcaseTable) {
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
  }

  // Compiler panel
  if (codeEditor) {
    const savedKey = getUserScopedKey(
      `code_${currentLanguage}_${currentLevelIndex}_${currentChallengeIndex}`
    );
    const saved = localStorage.getItem(savedKey);

    if (saved && saved.trim() !== "") {
      codeEditor.value = saved;
    } else {
      codeEditor.value = challenge.starterCode || "";
    }
  }

  if (editorLangPill) {
    editorLangPill.textContent = getEditorPill(currentLanguage);
  }

  const progress = getProgress(currentLanguage);
  if (prevChallengeBtn) {
    prevChallengeBtn.disabled = currentChallengeIndex === 0;
  }
  if (nextChallengeBtn) {
    nextChallengeBtn.disabled =
      progress.levels[currentLevelIndex] <= currentChallengeIndex;
  }

  // Reset status / output
  if (challengeStatusMsg) challengeStatusMsg.textContent = "";
  if (outputArea) outputArea.textContent = "";
  if (testSummaryBadge) {
    testSummaryBadge.textContent = "–";
    testSummaryBadge.classList.remove("all-pass");
  }
}

/* ==============================
   RUN CODE (NO TESTS)
   ============================== */
async function runCode() {
  // SPECIAL CASE: HTML + CSS → open live preview instead of Judge0
  if (currentLanguage === "htmlcss") {
    if (!codeEditor) return;

    const htmlContent = codeEditor.value || "";

    // Try to open a new window/tab for preview
    const previewWindow = window.open("", "_blank", "width=900,height=600");

    if (!previewWindow) {
      if (outputArea) {
        outputArea.textContent =
          "⚠ Unable to open preview window. Please allow popups for this site.";
      }
      return;
    }

    previewWindow.document.open();
    previewWindow.document.write(htmlContent);
    previewWindow.document.close();

    if (outputArea) {
      outputArea.textContent =
        "✅ HTML preview opened in a new tab/window.";
    }
    if (testSummaryBadge) {
      testSummaryBadge.textContent = "Preview Opened";
      testSummaryBadge.classList.remove("all-pass");
    }

    return; // ⬅ DO NOT go to Judge0 for htmlcss
  }

  // Normal Judge0 flow for code languages
  const langId = JUDGE_LANG_MAP[currentLanguage];

  if (!langId || !codeEditor) {
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
  if (!codeEditor) return null;

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
  const { totalTests, passedCount } = summary;

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

    const header = document.createElement("button");
    header.className = "test-result-header";

    const titleSpan = document.createElement("span");
    titleSpan.className = "test-result-header-title";
    titleSpan.textContent = `Test #${res.index + 1}`;

    const right = document.createElement("div");
    right.className = "test-result-header-right";

    const statusChip = document.createElement("span");
    statusChip.className =
      "test-chip " + (res.isPass ? "status-pass" : "status-fail");
    statusChip.textContent = res.isPass ? "Pass" : "Fail";

    const timeChip = document.createElement("span");
    timeChip.className = "test-chip time";
    timeChip.textContent = (res.time || "–") + " ms";

    const memChip = document.createElement("span");
    memChip.className = "test-chip memory";
    memChip.textContent = (res.memory || "–") + " KB";

    const chevron = document.createElement("span");
    chevron.className = "test-chevron";
    chevron.textContent = "▼";

    right.appendChild(statusChip);
    right.appendChild(timeChip);
    right.appendChild(memChip);
    right.appendChild(chevron);

    header.appendChild(titleSpan);
    header.appendChild(right);

    const body = document.createElement("div");
    body.className = "test-result-body";

    const blkInput = document.createElement("div");
    blkInput.className = "test-block";
    blkInput.innerHTML = `<h4>Input</h4><pre>${escapeHtml(
      res.input || ""
    )}</pre>`;

    const blkExp = document.createElement("div");
    blkExp.className = "test-block";
    blkExp.innerHTML = `<h4>Expected Output</h4><pre>${escapeHtml(
      res.expected || ""
    )}</pre>`;

    const blkOut = document.createElement("div");
    blkOut.className = "test-block";
    blkOut.innerHTML = `<h4>Your Output</h4><pre>${escapeHtml(
      res.stdout || ""
    )}</pre>`;

    body.appendChild(blkInput);
    body.appendChild(blkExp);
    body.appendChild(blkOut);

    header.addEventListener("click", () => {
      card.classList.toggle("open");
    });

    card.appendChild(header);
    card.appendChild(body);
    list.appendChild(card);
  });

  outputArea.appendChild(list);
}

/* ==============================
   HTML+CSS HEURISTIC TESTS
   ============================== */
function runHtmlCssAutoTests(level, challenge) {
  if (!codeEditor || !outputArea) return;

  const html = codeEditor.value || "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const text =
    (challenge.title || "") +
    " " +
    (challenge.description || "") +
    " " +
    (challenge.outputDescription || "");
  const lowerText = text.toLowerCase();

  const results = [];
  let testIndex = 0;

  function addCheck(desc, expected, pass, actualDetail) {
    results.push({
      index: testIndex++,
      input: desc,
      expected,
      stdout: actualDetail,
      isPass: pass,
      time: "-",
      memory: "-"
    });
  }

  // 1) Basic HTML skeleton
  const hasHtml = !!doc.querySelector("html");
  const hasHead = !!doc.querySelector("head");
  const hasBody = !!doc.querySelector("body");
  addCheck(
    "Basic HTML skeleton",
    "<!DOCTYPE html>, <html>, <head>, <body> structure",
    hasHtml && hasHead && hasBody && html.toLowerCase().includes("<!doctype"),
    `html:${hasHtml}, head:${hasHead}, body:${hasBody}, doctype:${html
      .toLowerCase()
      .includes("<!doctype")}`
  );

  // 2) Heading / H1 checks
  if (lowerText.includes("heading") || lowerText.includes("h1")) {
    const h1Els = Array.from(doc.querySelectorAll("h1"));
    addCheck(
      "Heading presence",
      "At least one <h1> element",
      h1Els.length > 0,
      `h1 count: ${h1Els.length}`
    );
  }

  // 3) Paragraph checks
  if (lowerText.includes("paragraphs") || lowerText.includes("paragraph")) {
    const pEls = Array.from(doc.querySelectorAll("p"));
    let minNeeded = 1;
    if (lowerText.includes("two") || lowerText.includes("2")) {
      minNeeded = 2;
    }
    addCheck(
      "Paragraph presence",
      `At least ${minNeeded} <p> element(s)`,
      pEls.length >= minNeeded,
      `p count: ${pEls.length}`
    );
  }

  // 4) Unordered list / hobbies / lists
  if (
    lowerText.includes("unordered list") ||
    lowerText.includes("bulleted") ||
    lowerText.includes("list of") ||
    lowerText.includes("<ul")
  ) {
    const ul = doc.querySelector("ul");
    const liCount = ul ? ul.querySelectorAll("li").length : 0;
    let minLi = 1;
    if (lowerText.includes("3 hobbies") || lowerText.includes("three")) {
      minLi = 3;
    }
    addCheck(
      "Unordered list structure",
      `A <ul> with at least ${minLi} <li> item(s)`,
      !!ul && liCount >= minLi,
      `ul present: ${!!ul}, li count: ${liCount}`
    );
  }

  // 5) Links
  if (
    lowerText.includes("links") ||
    lowerText.includes("link") ||
    lowerText.includes("clickable")
  ) {
    const aEls = Array.from(doc.querySelectorAll("a[href]"));
    addCheck(
      "Links presence",
      "At least one <a href=\"...\"> link",
      aEls.length > 0,
      `link count: ${aEls.length}`
    );
  }

  // 6) Images
  if (
    lowerText.includes("image") ||
    lowerText.includes("avatar") ||
    lowerText.includes("photo") ||
    lowerText.includes("banner")
  ) {
    const imgEls = Array.from(doc.querySelectorAll("img"));
    addCheck(
      "Image presence",
      "At least one <img> element",
      imgEls.length > 0,
      `img count: ${imgEls.length}`
    );
  }

  // 7) Forms
  if (
    lowerText.includes("form") ||
    lowerText.includes("login") ||
    lowerText.includes("signup") ||
    lowerText.includes("contact")
  ) {
    const formEl = doc.querySelector("form");
    addCheck(
      "Form presence",
      "A <form> element",
      !!formEl,
      `form present: ${!!formEl}`
    );
  }

  // 8) Inputs: email / password / textarea / checkbox / radio
  if (lowerText.includes("email")) {
    const emailInput =
      doc.querySelector('input[type="email"]') ||
      Array.from(doc.querySelectorAll("input")).find((inp) =>
        (inp.getAttribute("name") || "").toLowerCase().includes("email")
      );
    addCheck(
      "Email input",
      'An email field (e.g., <input type="email">)',
      !!emailInput,
      `email input present: ${!!emailInput}`
    );
  }

  if (lowerText.includes("password")) {
    const pwdInput = doc.querySelector('input[type="password"]');
    addCheck(
      "Password input",
      '<input type="password">',
      !!pwdInput,
      `password input present: ${!!pwdInput}`
    );
  }

  if (lowerText.includes("textarea") || lowerText.includes("message")) {
    const ta = doc.querySelector("textarea");
    addCheck(
      "Textarea / message field",
      "<textarea> for message",
      !!ta,
      `textarea present: ${!!ta}`
    );
  }

  if (lowerText.includes("checkbox")) {
    const cb = doc.querySelector('input[type="checkbox"]');
    addCheck(
      "Checkbox inputs",
      'At least one <input type="checkbox">',
      !!cb,
      `checkbox present: ${!!cb}`
    );
  }

  if (lowerText.includes("radio")) {
    const rb = doc.querySelector('input[type="radio"]');
    addCheck(
      "Radio inputs",
      'At least one <input type="radio">',
      !!rb,
      `radio present: ${!!rb}`
    );
  }

  // 9) Flexbox / Grid / layout hints (based on CSS text)
  const styleTextMatches = html.toLowerCase();

  if (lowerText.includes("flexbox") || lowerText.includes("flex")) {
    const hasFlex =
      styleTextMatches.includes("display:flex") ||
      styleTextMatches.includes("display: flex");
    addCheck(
      "Flexbox usage",
      "CSS contains display:flex for layout",
      hasFlex,
      `display:flex found: ${hasFlex}`
    );
  }

  if (lowerText.includes("grid")) {
    const hasGrid =
      styleTextMatches.includes("display:grid") ||
      styleTextMatches.includes("display: grid") ||
      styleTextMatches.includes("grid-template");
    addCheck(
      "CSS Grid usage",
      "CSS uses grid (display:grid or grid-template-... )",
      hasGrid,
      `grid usage found: ${hasGrid}`
    );
  }

  // 10) Media queries / responsive
  if (
    lowerText.includes("responsive") ||
    lowerText.includes("media query") ||
    lowerText.includes("@media")
  ) {
    const hasMedia = styleTextMatches.includes("@media");
    addCheck(
      "Media query usage",
      "CSS contains at least one @media rule",
      hasMedia,
      `@media found: ${hasMedia}`
    );
  }

  // 11) Transitions / hover effects
  if (
    lowerText.includes("hover") ||
    lowerText.includes("transition") ||
    lowerText.includes("effect")
  ) {
    const hasHover = styleTextMatches.includes(":hover");
    const hasTransition = styleTextMatches.includes("transition");
    addCheck(
      "Hover / transition usage",
      "Use :hover and/or transition in CSS",
      hasHover || hasTransition,
      `:hover: ${hasHover}, transition: ${hasTransition}`
    );
  }

  const totalTests = results.length || 1;
  const passedCount = results.filter((r) => r.isPass).length;

  // Render results using existing UI
  renderTestResults(results, {
    totalTests,
    passedCount,
    singleMode: false
  });

  // Update challenge status + progress (similar to code tests)
  if (passedCount === totalTests && totalTests > 0) {
    const progress = getProgress(currentLanguage);
    if (progress.levels[currentLevelIndex] < currentChallengeIndex + 1) {
      progress.levels[currentLevelIndex] = currentChallengeIndex + 1;
      saveProgress(currentLanguage, progress);
      updateCourseSummaryForCurrentLanguage();
    }

    if (challengeStatusMsg) {
      challengeStatusMsg.textContent =
        "✅ Page structure looks good! You can move to the next challenge.";
    }

    if (nextChallengeBtn) {
      nextChallengeBtn.disabled = false;
    }

    if (testSummaryBadge) {
      testSummaryBadge.textContent = "All Pass ✅";
      testSummaryBadge.classList.add("all-pass");
    }
  } else {
    if (challengeStatusMsg) {
      challengeStatusMsg.textContent =
        "Some checks failed. Compare the instructions and your HTML/CSS and try again.";
    }
  }
}

/* ==============================
   RUN TESTS
   ============================== */
async function runTests() {
  const level = challengeData.levels[currentLevelIndex];
  const rawChallenge = level.challenges[currentChallengeIndex];
  const challenge = normalizeChallengeObject(
    rawChallenge,
    currentChallengeIndex,
    level.type
  );

  const tests = challenge.tests || [];
  const totalTests = tests.length;

  // SPECIAL CASE: HTML+CSS → use DOM-based heuristic tests, no Judge0
  if (currentLanguage === "htmlcss") {
    runHtmlCssAutoTests(level, challenge);
    return;
  }

  const langId = JUDGE_LANG_MAP[currentLanguage];

  if (!langId || !totalTests) {
    if (outputArea) {
      outputArea.textContent =
        "No auto tests available for this challenge.";
    }
    return;
  }

  if (testcaseTable) {
    const rows = testcaseTable.querySelectorAll("tr");
    rows.forEach((row) => {
      const tdStatus = row.querySelector(".status");
      if (tdStatus) {
        tdStatus.textContent = "Running";
        tdStatus.className = "status status-running";
      }
    });
  }

  if (outputArea) {
    outputArea.textContent = "⏳ Running all tests.";
  }
  if (testSummaryBadge) {
    testSummaryBadge.textContent = "Running.";
    testSummaryBadge.classList.remove("all-pass");
  }

  const results = [];
  let passedCount = 0;

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    const result = await runJudgeForInput(langId, t.input || "");
    if (!result) continue;

    const stdout = (result.stdout || "").trim();
    const expected = (t.expected || "").trim();
    const isPass = stdout === expected;

    if (isPass) passedCount++;

    const row = testcaseTable ? testcaseTable.querySelectorAll("tr")[i] : null;
    if (row) {
      const tdStatus = row.querySelector(".status");
      if (tdStatus) {
        tdStatus.textContent = isPass ? "Pass" : "Fail";
        tdStatus.className = "status " + (isPass ? "status-pass" : "status-fail");
      }
    }

    results.push({
      index: i,
      input: t.input,
      expected,
      stdout,
      isPass,
      time: result.time,
      memory: result.memory
    });
  }

  renderTestResults(results, {
    totalTests,
    passedCount,
    singleMode: false
  });

  // Progress unlock
  if (passedCount === totalTests && totalTests > 0) {
    const progress = getProgress(currentLanguage);
    if (progress.levels[currentLevelIndex] < currentChallengeIndex + 1) {
      progress.levels[currentLevelIndex] = currentChallengeIndex + 1;
      saveProgress(currentLanguage, progress);
      updateCourseSummaryForCurrentLanguage();
    }

    if (challengeStatusMsg) {
      challengeStatusMsg.textContent =
        "✅ All tests passed! You can move to the next challenge.";
    }

    if (nextChallengeBtn) {
      nextChallengeBtn.disabled = false;
    }
  } else {
    if (challengeStatusMsg) {
      challengeStatusMsg.textContent =
        "Some tests failed. Check the difference and try again.";
    }
  }
}

/* ==============================
   RUN SINGLE TEST
   ============================== */
async function runSingleTest(testIndex) {
  const level = challengeData.levels[currentLevelIndex];
  const rawChallenge = level.challenges[currentChallengeIndex];
  const challenge = normalizeChallengeObject(
    rawChallenge,
    currentChallengeIndex,
    level.type
  );

  const tests = challenge.tests || [];
  if (!tests[testIndex]) return;

  const langId = JUDGE_LANG_MAP[currentLanguage];
  if (!langId) {
    if (outputArea) {
      outputArea.textContent =
        "No judge available for this course.";
    }
    return;
  }

  const t = tests[testIndex];

  if (outputArea) {
    outputArea.textContent = `⏳ Running Test #${testIndex + 1}...`;
  }
  if (testSummaryBadge) {
    testSummaryBadge.textContent = `Running Test #${testIndex + 1}`;
    testSummaryBadge.classList.remove("all-pass");
  }

  const result = await runJudgeForInput(langId, t.input || "");
  if (!result) return;

  const stdout = (result.stdout || "").trim();
  const expected = (t.expected || "").trim();
  const isPass = stdout === expected;

  const row = testcaseTable ? testcaseTable.querySelectorAll("tr")[testIndex] : null;
  if (row) {
    const tdStatus = row.querySelector(".status");
    if (tdStatus) {
      tdStatus.textContent = isPass ? "Pass" : "Fail";
      tdStatus.className = "status " + (isPass ? "status-pass" : "status-fail");
    }
  }

  renderTestResults(
    [
      {
        index: testIndex,
        input: t.input,
        expected,
        stdout,
        isPass,
        time: result.time,
        memory: result.memory
      }
    ],
    {
      totalTests: 1,
      passedCount: isPass ? 1 : 0,
      singleMode: true
    }
  );
}

/* ==============================
   EVENT LISTENERS
   ============================== */

// Editor buttons
if (runCodeBtn) {
  runCodeBtn.addEventListener("click", runCode);
}
if (testCodeBtn) {
  testCodeBtn.addEventListener("click", () => {
    runTests();
  });
}
if (resetStarterBtn) {
  resetStarterBtn.addEventListener("click", () => {
    const level = challengeData.levels[currentLevelIndex];
    const rawChallenge = level.challenges[currentChallengeIndex];
    const challenge = normalizeChallengeObject(
      rawChallenge,
      currentChallengeIndex,
      level.type
    );

    if (!codeEditor) return;

    codeEditor.value = challenge.starterCode || "";
    const savedKey = getUserScopedKey(
      `code_${currentLanguage}_${currentLevelIndex}_${currentChallengeIndex}`
    );
    localStorage.removeItem(savedKey);

    if (outputArea) outputArea.textContent = "";
    if (testSummaryBadge) {
      testSummaryBadge.textContent = "–";
      testSummaryBadge.classList.remove("all-pass");
    }
  });
}

// Auto-save editor
if (codeEditor) {
  codeEditor.addEventListener("input", () => {
    const savedKey = getUserScopedKey(
      `code_${currentLanguage}_${currentLevelIndex}_${currentChallengeIndex}`
    );
    localStorage.setItem(savedKey, codeEditor.value);
  });
}


// Navigation within challenges
if (prevChallengeBtn) {
  prevChallengeBtn.addEventListener("click", () => {
    if (currentChallengeIndex > 0) {
      openChallenge(currentLevelIndex, currentChallengeIndex - 1, false);
    }
  });
}

if (nextChallengeBtn) {
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
          if (challengeStatusMsg) {
            challengeStatusMsg.textContent =
              "✅ You finished all challenges in this course!";
          }
          nextChallengeBtn.disabled = true;
        } else {
          if (progress.levels[currentLevelIndex] === totalChallenges) {
            const nextLevelIndex = currentLevelIndex + 1;
            openLevelIntro(nextLevelIndex);
          } else {
            if (challengeStatusMsg) {
              challengeStatusMsg.textContent =
                "Complete all challenges in this level to unlock the next level.";
            }
          }
        }
      }
    }
  });
}

// From Level Intro → first challenge
if (startPracticingBtn) {
  startPracticingBtn.addEventListener("click", () => {
    openChallenge(currentLevelIndex, 0);
  });
}

/* Back buttons (use browser history) */
if (backToHome) {
  backToHome.addEventListener("click", () => history.back());
}
if (backToLevels) {
  backToLevels.addEventListener("click", () => history.back());
}
if (backToLevelsFromIntro) {
  backToLevelsFromIntro.addEventListener("click", () => history.back());
}

/* AUTH UI EVENTS */
if (authToggleMode) {
  authToggleMode.addEventListener("click", () => {
    authMode = authMode === "login" ? "signup" : "login";
    updateAuthModeUI();
  });
}

if (authSubmitBtn) {
  authSubmitBtn.addEventListener("click", handleAuthSubmit);
}

if (authPassword) {
  authPassword.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleAuthSubmit();
    }
  });
}

/* PROFILE MENU EVENTS */
if (profileButton && profileMenu) {
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
}

if (switchUserBtn) {
  switchUserBtn.addEventListener("click", () => {
    profileMenu && profileMenu.classList.remove("open");
    localStorage.removeItem(CURRENT_USER_KEY);
    updateUserUI();
    showAuth(true);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    profileMenu && profileMenu.classList.remove("open");
    localStorage.removeItem(CURRENT_USER_KEY);
    updateUserUI();
    showAuth(true);
  });
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const current =
      themeToggleBtn.getAttribute("data-theme") || getStoredTheme();
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
  });
}


/* Handle browser / Android back (only meaningful on main app page) */
if (typeof window !== "undefined") {
  window.addEventListener("popstate", (event) => {
    if (!isMainAppPage) return; // login page: browser handles navigation itself

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
}

/* ==============================
   INITIAL STATE
   ============================== */
updateAuthModeUI();
updateUserUI();

// Apply stored theme (default light)
applyTheme(getStoredTheme());

const existingState = history.state;
const user = getCurrentUser();

if (isMainAppPage) {
  // On main app page (index.html)
  if (!existingState) {
    if (user) {
      history.replaceState({ page: "home" }, "", "");
      showHome(false);
    } else {
      // Not logged in → previously redirected to login
      // window.location.href = "login.html";   // ⛔️ COMMENTED to stop auto redirect
      history.replaceState({ page: "home" }, "", "");
      showHome(false);  // ⬅ now home screen opens even without login
    }
  }

  // Initialize course cards for current user
  updateCourseCardsUI();
} else if (isAuthPage) {
  // On login.html page
  if (user) {
    window.location.href = "index.html";
  } else {
    if (!existingState) {
      history.replaceState({ page: "auth" }, "", "");
    }
    showAuth(false);
  }
}

