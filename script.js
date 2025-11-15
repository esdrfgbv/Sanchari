/* ==============================
   GLOBAL VARIABLES / DOM
   ============================== */
const homeSection = document.getElementById("home-section");
const levelsSection = document.getElementById("levels-section");
const challengeSection = document.getElementById("challenge-section");

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

// Global state
let currentLanguage = null;
let challengeData = null; // full JSON of a language
let currentLevelIndex = 0;
let currentChallengeIndex = 0;

// Judge0 config
const JUDGE0_URL = "https://ce.judge0.com";
const JUDGE_LANG_MAP = { c: 50, python: 71, java: 62, dsa: null };

/* ==============================
   PROGRESS SYSTEM
   ============================== */
function getProgress(lang) {
  return JSON.parse(localStorage.getItem("progress_" + lang)) || {
    levels: Array(10).fill(0), // 0 to 10 challenges completed
  };
}

function saveProgress(lang, progress) {
  localStorage.setItem("progress_" + lang, JSON.stringify(progress));
}

/* ==============================
   NAVIGATION + HISTORY
   ============================== */
// Home
function showHome(pushHistory = true) {
  homeSection.classList.remove("hidden");
  levelsSection.classList.add("hidden");
  challengeSection.classList.add("hidden");

  if (pushHistory) {
    history.pushState({ page: "home" }, "", "");
  }
}

// Levels list
function openLevels(lang, pushHistory = true) {
  currentLanguage = lang;
  selectedLanguageTitle.textContent =
    lang === "c"
      ? "C Programming — 10 Levels"
      : lang === "python"
      ? "Python — 10 Levels"
      : lang === "java"
      ? "Java — 10 Levels"
      : "DSA — 10 Levels";

  const levelsPromise = loadLevelsUI(); // returns a Promise

  homeSection.classList.add("hidden");
  levelsSection.classList.remove("hidden");
  challengeSection.classList.add("hidden");

  if (pushHistory) {
    history.pushState({ page: "levels", lang }, "", "");
  }

  return levelsPromise;
}

// Challenge screen
function openChallenge(levelIdx, challengeIdx, pushHistory = true) {
  currentLevelIndex = levelIdx;
  currentChallengeIndex = challengeIdx;
  loadChallengeScreen();

  levelsSection.classList.add("hidden");
  challengeSection.classList.remove("hidden");
  homeSection.classList.add("hidden");

  if (pushHistory) {
    history.pushState(
      {
        page: "challenge",
        lang: currentLanguage,
        levelIdx,
        challengeIdx,
      },
      "",
      ""
    );
  }
}

/* ==============================
   LOAD LEVELS UI
   ============================== */
function loadLevelsUI() {
  levelsContainer.innerHTML = "";

  const progress = getProgress(currentLanguage);
  challengeData = null;

  const LEVEL_COUNT = 10;
  const levelPromises = [];

  // 👇 load: data/c/level1.json ... data/c/level10.json
  // (or data/python/..., data/java/..., data/dsa/...)
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

          // Fallback empty level so UI does not break
          return {
            title: `Level ${i}`,
            concept: "Coming soon",
            challenges: [],
          };
        })
    );
  }

  // 🔁 return Promise so we can await when needed (for back navigation)
  return Promise.all(levelPromises).then((levels) => {
    challengeData = { levels };

    levels.forEach((lvl, idx) => {
      const card = document.createElement("div");
      card.className = "level-card";

      const completedChallenges = progress.levels[idx];

      // lock this level if previous level not fully completed
      if (idx > 0 && progress.levels[idx - 1] !== 10) {
        card.classList.add("locked");
      }

      card.innerHTML = `
        <h3>${lvl.title || `Level ${idx + 1}`}</h3>
        <p class="level-progress">${completedChallenges}/10 challenges completed</p>
      `;

      // only allow opening if challenges actually exist
      if (
        !card.classList.contains("locked") &&
        Array.isArray(lvl.challenges) &&
        lvl.challenges.length > 0
      ) {
        card.addEventListener("click", () => {
          openChallenge(idx, 0);
        });
      }

      levelsContainer.appendChild(card);
    });
  });
}

/* ==============================
   LOAD CHALLENGE SCREEN
   ============================== */
function loadChallengeScreen() {
  const level = challengeData.levels[currentLevelIndex];
  const challenge = level.challenges[currentChallengeIndex];

  challengeBreadcrumb.textContent = `${level.title} — Challenge ${
    currentChallengeIndex + 1
  } / 10`;

  challengeTitle.textContent = challenge.title;
  challengeDescription.textContent = challenge.description;

  challengeConcept.textContent = level.concept;
  inputFormat.textContent = challenge.inputDescription;
  outputFormat.textContent = challenge.outputDescription;

  examplesArea.textContent = challenge.examples.join("\n\n");

  testcaseTable.innerHTML = "";
  challenge.tests.forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${t.input.replace(/\n/g, "\\n")}</td>
      <td>${t.expected.replace(/\n/g, "\\n")}</td>
      <td class="status">Not Run</td>
    `;
    testcaseTable.appendChild(tr);
  });

  codeEditor.value = challenge.starterCode;
  editorLangPill.textContent =
    currentLanguage === "c"
      ? "C"
      : currentLanguage === "python"
      ? "Python"
      : currentLanguage === "java"
      ? "Java"
      : "DSA";

  // Buttons
  prevChallengeBtn.disabled = currentChallengeIndex === 0;
  nextChallengeBtn.disabled = currentChallengeIndex === 9; // locked until solved
  challengeStatusMsg.textContent = "";
  outputArea.textContent = "";
}

/* ==============================
   RUN CODE (NO TESTS)
   ============================== */
async function runCode() {
  outputArea.textContent = "⏳ Running...";

  const langId = JUDGE_LANG_MAP[currentLanguage];
  if (!langId) {
    outputArea.textContent =
      "⚠ DSA mode not executable. Use logic explanation.";
    return;
  }

  const payload = {
    language_id: langId,
    source_code: codeEditor.value,
    stdin: "",
  };

  const job = await fetch(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
   RUN TESTS (UNLOCK PROGRESS)
   ============================== */
async function testCode() {
  const challenge =
    challengeData.levels[currentLevelIndex].challenges[currentChallengeIndex];
  const langId = JUDGE_LANG_MAP[currentLanguage];
  if (!langId) return;

  const rows = testcaseTable.querySelectorAll("tr");
  let passed = 0;
  challengeStatusMsg.textContent = "Running tests...";

  for (let i = 0; i < challenge.tests.length; i++) {
    const t = challenge.tests[i];
    const payload = {
      language_id: langId,
      source_code: codeEditor.value,
      stdin: t.input,
    };

    rows[i].querySelector(".status").textContent = "Running...";
    rows[i].querySelector(".status").className = "status status-running";

    const job = await fetch(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    const expected = t.expected.trim();

    if (actual === expected) {
      passed++;
      rows[i].querySelector(".status").textContent = "Pass";
      rows[i].querySelector(".status").className = "status status-pass";
    } else {
      rows[i].querySelector(".status").textContent = "Fail";
      rows[i].querySelector(".status").className = "status status-fail";
    }
  }

  if (passed === challenge.tests.length) {
    challengeStatusMsg.textContent = "🎉 Challenge Passed!";
    unlockNext();
  } else {
    challengeStatusMsg.textContent = "❌ One or more test cases failed.";
  }
}

/* ==============================
   PROGRESSION UNLOCK
   ============================== */
function unlockNext() {
  const progress = getProgress(currentLanguage);

  if (progress.levels[currentLevelIndex] < currentChallengeIndex + 1) {
    progress.levels[currentLevelIndex] = currentChallengeIndex + 1;
    saveProgress(currentLanguage, progress);
  }

  nextChallengeBtn.disabled =
    progress.levels[currentLevelIndex] <= currentChallengeIndex;
}

/* ==============================
   BUTTON EVENTS
   ============================== */
runCodeBtn.addEventListener("click", runCode);
testCodeBtn.addEventListener("click", testCode);

resetStarterBtn.addEventListener("click", () => {
  const challenge =
    challengeData.levels[currentLevelIndex].challenges[currentChallengeIndex];
  codeEditor.value = challenge.starterCode;
});

clearCodeBtn.addEventListener("click", () => {
  codeEditor.value = "";
});

prevChallengeBtn.addEventListener("click", () => {
  if (currentChallengeIndex > 0) {
    openChallenge(currentLevelIndex, currentChallengeIndex - 1);
  }
});

nextChallengeBtn.addEventListener("click", () => {
  const progress = getProgress(currentLanguage);
  if (progress.levels[currentLevelIndex] >= currentChallengeIndex + 1) {
    if (currentChallengeIndex < 9) {
      openChallenge(currentLevelIndex, currentChallengeIndex + 1);
    }
  }
});

/* 🔙 Top in-app back buttons use browser history */
backToHome.addEventListener("click", () => {
  // behaves like Android back (one step)
  history.back();
});

backToLevels.addEventListener("click", () => {
  history.back();
});

/* ==============================
   HANDLE ANDROID / BROWSER BACK
   ============================== */
window.addEventListener("popstate", (event) => {
  const state = event.state;

  if (!state || state.page === "home") {
    showHome(false);
  } else if (state.page === "levels") {
    currentLanguage = state.lang;
    openLevels(state.lang, false);
  } else if (state.page === "challenge") {
    currentLanguage = state.lang;
    // ensure levels & data are loaded, then open challenge
    openLevels(state.lang, false).then(() => {
      openChallenge(state.levelIdx, state.challengeIdx, false);
    });
  }
});

/* ==============================
   COURSE CARD CLICKS — HOME
   ============================== */
document.querySelectorAll(".course-card").forEach((card) => {
  card.addEventListener("click", () => {
    const lang = card.getAttribute("data-lang");
    openLevels(lang);
  });
});

/* ==============================
   INITIAL
   ============================== */
// Set initial state as "home" once
if (!history.state) {
  history.replaceState({ page: "home" }, "", "");
}
showHome(false);
