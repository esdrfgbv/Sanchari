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
let challengeData = null; // { levels: [ level1Json, level2Json, ... ] }
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
  dbms: null,   // theory
  os: null,     // theory
  cn: null,     // theory
  systemdesign: null, // theory
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
        .catch((err) => {
          console.error(err);
          return {
            title: `Level ${i}`,
            concept: "Coming soon",
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

      card.innerHTML = `
        <h3>${lvl.title || `Level ${idx + 1}`}</h3>
        <p class="level-progress">${solvedCount}/${totalChallenges || 0} challenges completed</p>
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
   LOAD CHALLENGE SCREEN
   ============================== */
function loadChallengeScreen() {
  const level = challengeData.levels[currentLevelIndex];
  const challenge = level.challenges[currentChallengeIndex];
  const totalChallenges = level.challenges.length;

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

  challengeTitle.textContent = challenge.title;
  challengeDescription.textContent = challenge.description || "";
  challengeConcept.textContent = level.concept || "";

  inputFormat.textContent = challenge.inputDescription || "";
  outputFormat.textContent = challenge.outputDescription || "";
  examplesArea.textContent = (challenge.examples || []).join("\n\n");

  testcaseTable.innerHTML = "";
  (challenge.tests || []).forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${(t.input || "").replace(/\n/g, "\\n")}</td>
      <td>${(t.expected || "").replace(/\n/g, "\\n")}</td>
      <td class="status">Not Run</td>
    `;
    testcaseTable.appendChild(tr);
  });

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

  const progress = getProgress(currentLanguage);
  prevChallengeBtn.disabled = currentChallengeIndex === 0;
  nextChallengeBtn.disabled =
    progress.levels[currentLevelIndex] <= currentChallengeIndex;

  challengeStatusMsg.textContent = "";
  outputArea.textContent = "";
}

/* ==============================
   RUN CODE (NO TESTS)
   ============================== */
async function runCode() {
  const langId = JUDGE_LANG_MAP[currentLanguage];

  if (!langId) {
    outputArea.textContent =
      "⚠ Code execution is disabled for this course. Focus on logic/theory here.";
    return;
  }

  outputArea.textContent = "⏳ Running...";

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

  outputArea.textContent = out.trim();
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

  let passed = 0;
  challengeStatusMsg.textContent = "Running tests...";

  for (let i = 0; i < (challenge.tests || []).length; i++) {
    const t = challenge.tests[i];

    const payload = {
      language_id: langId,
      source_code: codeEditor.value,
      stdin: t.input || ""
    };

    const statusCell = rows[i].querySelector(".status");
    statusCell.textContent = "Running...";
    statusCell.className = "status status-running";

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

    const actual = (result.stdout || "").trim();
    const expected = (t.expected || "").trim();

    if (actual === expected) {
      passed++;
      statusCell.textContent = "Pass";
      statusCell.className = "status status-pass";
    } else {
      statusCell.textContent = "Fail";
      statusCell.className = "status status-fail";
    }
  }

  if (passed === (challenge.tests || []).length) {
    challengeStatusMsg.textContent = "🎉 Challenge Passed!";
    unlockNext();
  } else {
    challengeStatusMsg.textContent = "❌ One or more test cases failed.";
  }
}

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

  loadChallengeScreen();
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
