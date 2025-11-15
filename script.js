/* ==============================
   GLOBAL VARIABLES / DOM
   ============================== */
const homeSection = document.getElementById("home-section");
const levelsSection = document.getElementById("levels-section");
const levelIntroSection = document.getElementById("level-intro-section");
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
const backToLevelsFromIntro = document.getElementById("backToLevelsFromIntro");

const levelIntroBreadcrumb = document.getElementById("levelIntroBreadcrumb");
const levelIntroTitle = document.getElementById("levelIntroTitle");
const levelIntroBody = document.getElementById("levelIntroBody");
const startPracticingBtn = document.getElementById("startPracticingBtn");

// Global state
let currentLanguage = null;
// from data/<lang>/levelX.json
let challengeData = null; // { levels: [ level1Json, level2Json, ... ] }
// from notes/<lang>/levelX.json
let notesCache = {}; // key: `${lang}_level${index+1}` -> notes json

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
    levels: Array(10).fill(0), // each index: solved questions count (0–10)
  };
}

function saveProgress(lang, progress) {
  localStorage.setItem("progress_" + lang, JSON.stringify(progress));
}

/* ==============================
   NAVIGATION FUNCTIONS
   ============================== */
function showHome(pushHistory = true) {
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

  selectedLanguageTitle.textContent =
    lang === "c"
      ? "C Programming — 10 Levels"
      : lang === "python"
      ? "Python — 10 Levels"
      : lang === "java"
      ? "Java — 10 Levels"
      : "DSA — 10 Levels";

  const levelsPromise = loadLevelsUI(); // fetch all question JSONs

  homeSection.classList.add("hidden");
  levelsSection.classList.remove("hidden");
  levelIntroSection.classList.add("hidden");
  challengeSection.classList.add("hidden");

  if (pushHistory) {
    history.pushState({ page: "levels", lang }, "", "");
  }

  return levelsPromise;
}

/**
 * Render notes into Level Intro section
 * notesJson from: notes/<lang>/levelX.json
 */
function renderLevelIntro(notesJson, levelIdx) {
  const level = challengeData.levels[levelIdx];

  const notesTitle =
    notesJson.title || level.title || `Level ${levelIdx + 1}`;
  const notesIntro =
    notesJson.intro ||
    notesJson.description ||
    "In this level, you will practice 10 problems on this topic.";
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

/**
 * Open Level Intro page
 * Fetch notes from notes/<lang>/levelX.json
 */
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

    if (pushHistory) {
      history.pushState(
        { page: "level-intro", lang: currentLanguage, levelIdx },
        "",
        ""
      );
    }
  };

  // if already fetched once, use cache
  if (notesCache[key]) {
    showIntro(notesCache[key]);
  } else {
    fetch(notesPath)
      .then((r) => {
        if (!r.ok) {
          throw new Error("Notes JSON not found: " + notesPath);
        }
        return r.json();
      })
      .then((json) => {
        notesCache[key] = json;
        showIntro(json);
      })
      .catch((err) => {
        console.error(err);
        // fallback default notes
        const fallback = {
          title: challengeData.levels[levelIdx].title || `Level ${levelIdx + 1}`,
          intro: "Notes for this level are coming soon.",
          points: [],
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
   LOAD LEVELS FROM data/<lang>/*.json
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
          // fallback if file missing
          return {
            title: `Level ${i}`,
            concept: "Coming soon",
            challenges: [],
          };
        })
    );
  }

  return Promise.all(levelPromises).then((levels) => {
    challengeData = { levels };

    levels.forEach((lvl, idx) => {
      const card = document.createElement("div");
      card.className = "level-card";

      const completedChallenges = progress.levels[idx];

      if (idx > 0 && progress.levels[idx - 1] !== 10) {
        card.classList.add("locked");
      }

      card.innerHTML = `
        <h3>${lvl.title || `Level ${idx + 1}`}</h3>
        <p class="level-progress">${completedChallenges}/10 challenges completed</p>
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
  challengeConcept.textContent = level.concept || "";

  inputFormat.textContent = challenge.inputDescription;
  outputFormat.textContent = challenge.outputDescription;
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

  codeEditor.value = challenge.starterCode || "";
  editorLangPill.textContent =
    currentLanguage === "c"
      ? "C"
      : currentLanguage === "python"
      ? "Python"
      : currentLanguage === "java"
      ? "Java"
      : "DSA";

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
  outputArea.textContent = "⏳ Running...";

  const langId = JUDGE_LANG_MAP[currentLanguage];
  if (!langId) {
    outputArea.textContent =
      "⚠ DSA mode is only for logic; code execution disabled.";
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
   RUN TESTS + UNLOCK PROGRESS
   ============================== */
async function testCode() {
  const level = challengeData.levels[currentLevelIndex];
  const challenge = level.challenges[currentChallengeIndex];

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

    const statusCell = rows[i].querySelector(".status");
    statusCell.textContent = "Running...";
    statusCell.className = "status status-running";

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

  if (passed === challenge.tests.length) {
    challengeStatusMsg.textContent = "🎉 Challenge Passed!";
    unlockNext();
  } else {
    challengeStatusMsg.textContent = "❌ One or more test cases failed.";
  }
}

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
  const level = challengeData.levels[currentLevelIndex];
  const challenge = level.challenges[currentChallengeIndex];
  codeEditor.value = challenge.starterCode || "";
});

clearCodeBtn.addEventListener("click", () => {
  codeEditor.value = "";
});

prevChallengeBtn.addEventListener("click", () => {
  if (currentChallengeIndex > 0) {
    openChallenge(currentLevelIndex, currentChallengeIndex - 1);
  }
});

/**
 * NEXT button behaviour:
 * - Inside a level: goes to next challenge
 * - On 10th question:
 *     - if all 10 are solved, go to NEXT LEVEL notes screen
 *     - else, show message to complete all
 */
nextChallengeBtn.addEventListener("click", () => {
  const progress = getProgress(currentLanguage);

  if (progress.levels[currentLevelIndex] >= currentChallengeIndex + 1) {
    if (currentChallengeIndex < 9) {
      openChallenge(currentLevelIndex, currentChallengeIndex + 1);
    } else {
      const isLastLevel =
        currentLevelIndex === challengeData.levels.length - 1;

      if (isLastLevel) {
        challengeStatusMsg.textContent =
          "✅ You finished all levels in this course!";
        nextChallengeBtn.disabled = true;
      } else {
        if (progress.levels[currentLevelIndex] === 10) {
          const nextLevelIndex = currentLevelIndex + 1;
          openLevelIntro(nextLevelIndex);
        } else {
          challengeStatusMsg.textContent =
            "Complete all 10 questions in this level to unlock the next level.";
        }
      }
    }
  }
});

// From Level Intro → start practicing Q1 of that level
startPracticingBtn.addEventListener("click", () => {
  openChallenge(currentLevelIndex, 0);
});

/* Back buttons (use browser history) */
backToHome.addEventListener("click", () => {
  history.back();
});

backToLevels.addEventListener("click", () => {
  history.back();
});

backToLevelsFromIntro.addEventListener("click", () => {
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

/* ==============================
   COURSE CARD CLICKS (HOME)
   ============================== */
document.querySelectorAll(".course-card").forEach((card) => {
  card.addEventListener("click", () => {
    const lang = card.getAttribute("data-lang");
    openLevels(lang);
  });
});

/* ==============================
   INITIAL STATE
   ============================== */
if (!history.state) {
  history.replaceState({ page: "home" }, "", "");
}
showHome(false);
