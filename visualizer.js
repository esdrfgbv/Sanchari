// visualizer.js
// Language-agnostic (C / C++ / Java / JS / Python-ish) code visualizer
// Features:
// - Step-by-step execution
// - for-loops with multiple iterations (Style B, Detail 1)
// - Variables panel
// - Input box for scanf / cin / Scanner / input() / prompt()
// - Output box for printf / System.out.* / console.log / print() / cout

(function () {
  // DOM references
  const codeEl = document.getElementById("visualizerCode");
  const titleEl = document.getElementById("visualizerTitle");
  const metaEl = document.getElementById("visualizerMeta");
  const lineInfoEl = document.getElementById("lineInfo");

  const stepForwardBtn = document.getElementById("stepForwardBtn");
  const stepBackBtn = document.getElementById("stepBackBtn");
  const resetStepsBtn = document.getElementById("resetStepsBtn");

  const varsTable = document.getElementById("variablesTable");
  const varsEmpty = document.getElementById("variablesEmpty");
  const execLogEl = document.getElementById("execLog");

  const inputBlock = document.getElementById("visualizerInputBlock");
  const inputPromptEl = document.getElementById("inputPrompt");
  const inputValueEl = document.getElementById("inputValue");
  const submitInputBtn = document.getElementById("submitInputBtn");

  // Runtime state
  let lines = [];
  let currentIndex = -1;
  let executionFinished = false;

  let variables = {};
  let execLog = [];
  let outputLines = [];

  let forMetaMap = {};
  let loopStack = [];

  let history = [];

  let waitingForInput = false;
  let pendingInput = null; // { varNames, lineNumber, idx, description }

  /* =========================================
     Utility: cloning, snapshots, history
     ========================================= */

  function cloneVariables(src) {
    const out = {};
    for (const k in src) {
      if (Object.prototype.hasOwnProperty.call(src, k)) {
        out[k] = src[k];
      }
    }
    return out;
  }

  function cloneLoopStack(stack) {
    return stack.map((f) => ({ ...f }));
  }

  function pushSnapshot() {
    history.push({
      pc: currentIndex,
      variables: cloneVariables(variables),
      execLog: execLog.slice(),
      loopStack: cloneLoopStack(loopStack),
      finished: executionFinished,
      outputLines: outputLines.slice(),
      waitingForInput,
      pendingInput: pendingInput ? { ...pendingInput } : null
    });
  }

  function restoreSnapshot(snap) {
    currentIndex = snap.pc;
    variables = cloneVariables(snap.variables);
    execLog = snap.execLog.slice();
    loopStack = cloneLoopStack(snap.loopStack);
    executionFinished = snap.finished;
    outputLines = snap.outputLines.slice();
    waitingForInput = snap.waitingForInput;
    pendingInput = snap.pendingInput;

    renderVariables();
    renderLog();
    renderOutput();
    if (waitingForInput && pendingInput) {
      setWaitingForInput(true, pendingInput);
    } else {
      setWaitingForInput(false, null);
    }

    highlightLine(currentIndex);
    updateLineInfo(currentIndex);
  }

  /* =========================================
     Variables, Log & Output rendering
     ========================================= */

  function resetState() {
    variables = {};
    execLog = [];
    loopStack = [];
    executionFinished = false;
    waitingForInput = false;
    pendingInput = null;
    outputLines = [];
    if (inputBlock) inputBlock.classList.remove("waiting");
    renderVariables();
    renderLog();
    renderOutput();
  }

  function renderVariables() {
    if (!varsTable) return;
    const tbody = varsTable.querySelector("tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const names = Object.keys(variables);
    if (names.length === 0) {
      if (varsEmpty) varsEmpty.style.display = "block";
      varsTable.style.display = "none";
      return;
    }

    if (varsEmpty) varsEmpty.style.display = "none";
    varsTable.style.display = "table";

    names.forEach((name) => {
      const tr = document.createElement("tr");
      const tdName = document.createElement("td");
      const tdValue = document.createElement("td");

      tdName.textContent = name;
      tdValue.textContent = String(variables[name]);

      tr.appendChild(tdName);
      tr.appendChild(tdValue);
      tbody.appendChild(tr);
    });
  }

  function renderLog() {
    if (!execLogEl) return;
    execLogEl.innerHTML = "";

    if (execLog.length === 0) {
      const p = document.createElement("div");
      p.className = "visualizer-log-entry";
      p.textContent = "No executed lines yet.";
      execLogEl.appendChild(p);
      return;
    }

    execLog.forEach((item) => {
      const row = document.createElement("div");
      row.className = "visualizer-log-entry";

      const spanLine = document.createElement("span");
      spanLine.className = "visualizer-log-entry-line";
      spanLine.textContent = `L${item.line}:`;

      const spanMsg = document.createElement("span");
      spanMsg.textContent = item.message;

      row.appendChild(spanLine);
      row.appendChild(spanMsg);
      execLogEl.appendChild(row);
    });

    execLogEl.scrollTop = execLogEl.scrollHeight;
  }

  function addLog(lineNumber, message) {
    execLog.push({ line: lineNumber, message });
  }

  // ------ Output box helpers ------

  function ensureOutputBox() {
    if (document.getElementById("programOutputBody")) return;
    if (!execLogEl) return;

    const logSection = execLogEl.parentElement; // .visualizer-log
    if (!logSection || !logSection.parentElement) return;

    const wrapper = document.createElement("div");
    wrapper.className = "visualizer-output";

    const title = document.createElement("h4");
    title.textContent = "Program Output";

    const body = document.createElement("div");
    body.id = "programOutputBody";
    body.className = "visualizer-log-body";

    wrapper.appendChild(title);
    wrapper.appendChild(body);
    logSection.parentElement.insertBefore(wrapper, logSection.nextSibling);
  }

  function renderOutput() {
    ensureOutputBox();
    const body = document.getElementById("programOutputBody");
    if (!body) return;
    body.textContent = outputLines.join("");
  }

  function addOutput(text, lineNumber) {
    const s = String(text);
    outputLines.push(s);
    if (lineNumber != null) {
      addLog(lineNumber, `Output: ${s.replace(/\n/g, "\\n")}`);
    }
    renderOutput();
  }

  /* =========================================
     Input handling
     ========================================= */

  function setWaitingForInput(flag, config) {
    waitingForInput = flag;
    pendingInput = flag ? config : null;

    if (flag) {
      if (inputBlock) inputBlock.classList.add("waiting");
      if (inputPromptEl) {
        inputPromptEl.textContent =
          config.description ||
          `Waiting for input for ${config.varNames.join(", ")}`;
      }
      if (inputValueEl) inputValueEl.value = "";
      if (stepForwardBtn) stepForwardBtn.disabled = true;
      if (stepBackBtn) stepBackBtn.disabled = true;
    } else {
      if (inputBlock) inputBlock.classList.remove("waiting");
      if (stepForwardBtn) stepForwardBtn.disabled = false;
      if (stepBackBtn) stepBackBtn.disabled = false;
    }
  }

  function handleSubmitInput() {
    if (!waitingForInput || !pendingInput) return;
    if (!inputValueEl) return;

    const str = inputValueEl.value.trim() || "0";
    const parts = str.split(/\s+/);
    const vars = pendingInput.varNames;
    const lineNumber = pendingInput.lineNumber;
    const idx = pendingInput.idx;

    const assignedPairs = [];

    for (let i = 0; i < vars.length; i++) {
      const vName = vars[i];
      const token = parts[i] ?? parts[parts.length - 1] ?? "0";
      const asNumber = Number(token);
      const value = Number.isFinite(asNumber) ? asNumber : token;
      variables[vName] = value;
      assignedPairs.push(`${vName}=${value}`);
    }

    addLog(lineNumber, `User input: ${assignedPairs.join(", ")}`);
    renderVariables();
    renderLog();
    setWaitingForInput(false, null);

    const frame = currentLoopFrame();

    if (frame && idx >= frame.bodyStart && idx <= frame.bodyEnd) {
      // inside loop body
      if (idx < frame.bodyEnd) {
        currentIndex = idx + 1;
      } else {
        handleForEndOfBody(frame);
      }
    } else {
      // normal case
      currentIndex = idx + 1;
      if (currentIndex >= lines.length && loopStack.length === 0) {
        executionFinished = true;
      }
    }

    highlightLine(currentIndex);
    updateLineInfo(currentIndex);
    pushSnapshot();
  }

  /* =========================================
     Expression evaluation helpers
     ========================================= */

  function substituteVariables(expr) {
    return expr.replace(/\b[A-Za-z_]\w*\b/g, (name) => {
      if (Object.prototype.hasOwnProperty.call(variables, name)) {
        return String(variables[name]);
      }
      return name; // keep unknown names to detect later
    });
  }

  function safeEvalExpression(expr) {
    const cleaned = (expr || "").trim().replace(/;+\s*$/, "");
    const substituted = substituteVariables(cleaned);

    // If still contains letters, it's not purely numeric
    if (/[A-Za-z_]/.test(substituted)) {
      return null;
    }

    if (!/^[0-9+\-*/%()<>=!&|.\s]+$/.test(substituted)) return null;

    try {
      const fn = new Function(`return (${substituted});`);
      return fn();
    } catch {
      return null;
    }
  }

  function evalAsNumber(expr) {
    const cleaned = (expr || "").trim().replace(/;+\s*$/, "");

    const result = safeEvalExpression(cleaned);
    if (typeof result === "number" && Number.isFinite(result)) return result;
    if (typeof result === "boolean") return result ? 1 : 0;

    // Single variable name → numeric value if possible
    const varMatch = cleaned.match(/^([A-Za-z_]\w*)$/);
    if (varMatch) {
      const vName = varMatch[1];
      if (Object.prototype.hasOwnProperty.call(variables, vName)) {
        const v = variables[vName];
        const num = Number(v);
        if (Number.isFinite(num)) return num;
      }
    }

    return null;
  }

  function evalAsBoolean(expr) {
    const result = safeEvalExpression(expr);
    if (result == null) {
      // Unknown condition → treat as TRUE so loops don't auto-skip
      return true;
    }
    return Boolean(result);
  }

  function evalToString(expr) {
    if (expr == null) return "";

    const cleaned = (expr || "").trim().replace(/;+\s*$/, "");

    const numeric = evalAsNumber(cleaned);
    if (numeric !== null) return String(numeric);

    const t = cleaned;

    // String literal: "..."
    const strMatch = t.match(/^["']([\s\S]*)["']$/);
    if (strMatch) return strMatch[1];

    // Single variable
    const varMatch = t.match(/^([A-Za-z_]\w*)$/);
    if (varMatch) {
      const name = varMatch[1];
      if (Object.prototype.hasOwnProperty.call(variables, name)) {
        return String(variables[name]);
      }
    }

    // Fallback
    return t;
  }

  /* =========================================
     Print / Output handling
     ========================================= */

  // Split arguments inside parentheses respecting quotes and nested parens
  function splitArgs(inner) {
    const args = [];
    let current = "";
    let inString = false;
    let quoteChar = null;
    let escape = false;
    let depth = 0;

    for (let i = 0; i < inner.length; i++) {
      const ch = inner[i];

      if (escape) {
        current += ch;
        escape = false;
        continue;
      }

      if (ch === "\\") {
        current += ch;
        escape = true;
        continue;
      }

      if (inString) {
        current += ch;
        if (ch === quoteChar) {
          inString = false;
          quoteChar = null;
        }
        continue;
      }

      if (ch === '"' || ch === "'") {
        inString = true;
        quoteChar = ch;
        current += ch;
        continue;
      }

      if (ch === "(") {
        depth++;
        current += ch;
        continue;
      }

      if (ch === ")") {
        depth--;
        current += ch;
        continue;
      }

      if (ch === "," && depth === 0) {
        if (current.trim() !== "") args.push(current.trim());
        current = "";
        continue;
      }

      current += ch;
    }

    if (current.trim() !== "") args.push(current.trim());
    return args;
  }

  function formatPrintfLike(args, lineNumber) {
    if (args.length === 0) return false;

    const fmtRaw = args[0];
    const fmtMatch = fmtRaw.match(/^["']([\s\S]*)["']$/);
    const fmt = fmtMatch ? fmtMatch[1] : evalToString(fmtRaw);

    let argIndex = 1;
    const outParts = [];

    for (let i = 0; i < fmt.length; i++) {
      const ch = fmt[i];

      // Escapes: \n, \t, etc.
      if (ch === "\\" && i + 1 < fmt.length) {
        const next = fmt[++i];
        if (next === "n") outParts.push("\n");
        else if (next === "t") outParts.push("\t");
        else outParts.push(next);
        continue;
      }

      // Format specifier: %d %f %s ...
      if (ch === "%" && i + 1 < fmt.length) {
        let j = i + 1;
        let spec = "";

        for (; j < fmt.length; j++) {
          const c2 = fmt[j];
          spec += c2;
          if ("diufFeEgGxXosc".includes(c2)) break;
        }

        const typeChar = spec[spec.length - 1];
        i = j;

        const argExpr = args[argIndex++] ?? null;
        let valStr = "";

        if (argExpr != null) {
          const numVal = evalAsNumber(argExpr);
          const asString = evalToString(argExpr);

          if ("diu".includes(typeChar)) {
            const n = numVal !== null ? numVal : Number(asString);
            valStr = Number.isFinite(n) ? String(Math.trunc(n)) : asString;
          } else if ("fFeEgG".includes(typeChar)) {
            const n = numVal !== null ? numVal : Number(asString);
            valStr = Number.isFinite(n) ? String(n) : asString;
          } else if (typeChar === "c") {
            const s = asString;
            valStr = s.length ? s[0] : "";
          } else if (typeChar === "s") {
            valStr = asString;
          } else {
            valStr = asString;
          }
        }

        outParts.push(valStr);
        continue;
      }

      // Normal char
      outParts.push(ch);
    }

    const finalOut = outParts.join("");
    addOutput(finalOut, lineNumber);
    return true;
  }

  // C: printf(...)
  function handlePrintf(trimmed, lineNumber) {
    const m = trimmed.match(/^printf\s*\((.*)\)\s*;?$/);
    if (!m) return false;
    const inner = m[1].trim();
    if (!inner) return false;
    const args = splitArgs(inner);
    return formatPrintfLike(args, lineNumber);
  }

  // Java: System.out.printf(...)
  function handleSystemOutPrintf(trimmed, lineNumber) {
    const m = trimmed.match(/^System\.out\.printf\s*\((.*)\)\s*;?$/);
    if (!m) return false;
    const inner = m[1].trim();
    if (!inner) return false;
    const args = splitArgs(inner);
    return formatPrintfLike(args, lineNumber);
  }

  // Java: System.out.println/print(...)
  function handleSystemOutPrint(trimmed, lineNumber) {
    const m = trimmed.match(/^System\.out\.(println|print)\s*\((.*)\)\s*;?$/);
    if (!m) return false;
    const isLn = m[1] === "println";
    const inner = m[2].trim();
    const s = evalToString(inner);
    addOutput(isLn ? s + "\n" : s, lineNumber);
    return true;
  }

  // JS: console.log(...)
  function handleConsoleLog(trimmed, lineNumber) {
    const m = trimmed.match(/^console\.log\s*\((.*)\)\s*;?$/);
    if (!m) return false;
    const inner = m[1].trim();
    const args = splitArgs(inner);
    if (args.length === 0) return true;
    const parts = args.map((a) => evalToString(a));
    addOutput(parts.join(" ") + "\n", lineNumber);
    return true;
  }

  // Python: print(...)
  function handlePythonPrint(trimmed, lineNumber) {
    let m = trimmed.match(/^print\s*\((.*)\)\s*$/);
    if (!m) {
      m = trimmed.match(/^print\s+(.*)$/);
      if (!m) return false;
    }
    const inner = m[1].trim();
    const args = splitArgs(inner);
    if (args.length === 0) {
      addOutput("\n", lineNumber);
      return true;
    }
    const parts = args.map((a) => evalToString(a));
    addOutput(parts.join(" ") + "\n", lineNumber);
    return true;
  }

  // C++: cout << ...
  function handleCout(trimmed, lineNumber) {
    if (!/^cout\s*<</.test(trimmed)) return false;
    let rest = trimmed.replace(/^cout\s*<</, "");
    const parts = rest.split("<<").map((p) => p.trim());
    let out = "";
    let addNewline = false;

    parts.forEach((part) => {
      if (!part) return;
      if (part === "endl" || part === "std::endl") {
        addNewline = true;
      } else {
        out += evalToString(part);
      }
    });

    if (addNewline) out += "\n";
    addOutput(out, lineNumber);
    return true;
  }

  /* =========================================
     Interpreter core (per-line)
     ========================================= */

  // contextLabel: "for-init", "for-update", or null
  // opts: { allowInput: boolean, idx: number }
  function interpretTextStatement(text, pseudoLineNum, contextLabel, opts = {}) {
    const allowInput = !!opts.allowInput;
    const idx = opts.idx ?? -1;

    const strippedComment = text
      .replace(/\/\/.*$/, "")
      .replace(/#.*$/, "");
    const trimmed = strippedComment.trim();

    if (!trimmed) {
      if (contextLabel === "for-init") {
        addLog(pseudoLineNum, "for-init: (blank)");
      } else if (contextLabel === "for-update") {
        addLog(pseudoLineNum, "for-update: (blank)");
      }
      return;
    }

    // ===== INPUT DETECTION (top-level only) =====
    if (allowInput && !contextLabel) {
      // C: scanf("%d", &n);
      if (/scanf\s*\(/.test(trimmed)) {
        const insideMatch = trimmed.match(/scanf\s*\((.*)\)/);
        const inside = insideMatch ? insideMatch[1] : "";
        const varNames = [];
        const ampMatches = inside.match(/&\s*([A-Za-z_]\w*)/g) || [];
        ampMatches.forEach((m) => {
          const mm = m.match(/&\s*([A-Za-z_]\w*)/);
          if (mm) varNames.push(mm[1]);
        });

        if (varNames.length > 0) {
          const fmtMatch = inside.match(/"([^"]*)"/);
          let desc = `scanf → ${varNames.join(", ")}`;
          if (fmtMatch) desc = `scanf("${fmtMatch[1]}") → ${varNames.join(", ")}`;
          setWaitingForInput(true, {
            varNames,
            lineNumber: pseudoLineNum,
            idx,
            description: desc
          });
          addLog(pseudoLineNum, "Waiting for scanf input.");
          return "WAITING_FOR_INPUT";
        }
      }

      // C++: cin >> a >> b;
      if (/^cin\s*>>/.test(trimmed)) {
        const afterCin = trimmed.split("cin")[1] || "";
        const parts = afterCin.split(">>").slice(1);
        const varNames = [];
        parts.forEach((p) => {
          const mm = p.match(/([A-Za-z_]\w*)/);
          if (mm) varNames.push(mm[1]);
        });

        if (varNames.length > 0) {
          const desc = `cin >> ${varNames.join(" >> ")}`;
          setWaitingForInput(true, {
            varNames,
            lineNumber: pseudoLineNum,
            idx,
            description: desc
          });
          addLog(pseudoLineNum, "Waiting for cin input.");
          return "WAITING_FOR_INPUT";
        }
      }

      // Python: x = input("...")
      if (/input\s*\(/.test(trimmed)) {
        const assignMatch = trimmed.match(
          /^([A-Za-z_]\w*)\s*=\s*input\s*\((.*)\)\s*;?$/
        );
        if (assignMatch) {
          const varName = assignMatch[1];
          const promptRaw = assignMatch[2] || "";
          let promptText = promptRaw.replace(/^["']|["']$/g, "");
          if (!promptText) promptText = `input() for ${varName}`;
          setWaitingForInput(true, {
            varNames: [varName],
            lineNumber: pseudoLineNum,
            idx,
            description: `input(): ${promptText}`
          });
          addLog(pseudoLineNum, "Waiting for input() value.");
          return "WAITING_FOR_INPUT";
        }
      }

      // Java: int n = sc.nextInt();
      const javaScanMatch = trimmed.match(
        /^([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\.next(Int|Long|Double|Float|Line)?\s*\(\)\s*;?$/
      );
      if (javaScanMatch) {
        const varName = javaScanMatch[1];
        const desc = `Scanner input for ${varName}`;
        setWaitingForInput(true, {
          varNames: [varName],
          lineNumber: pseudoLineNum,
          idx,
          description: desc
        });
        addLog(pseudoLineNum, "Waiting for Scanner input.");
        return "WAITING_FOR_INPUT";
      }

      // JavaScript: x = prompt("...");
      const jsPromptMatch = trimmed.match(
        /^([A-Za-z_]\w*)\s*=\s*prompt\s*\((.*)\)\s*;?$/
      );
      if (jsPromptMatch) {
        const varName = jsPromptMatch[1];
        const promptRaw = jsPromptMatch[2] || "";
        let promptText = promptRaw.replace(/^["']|["']$/g, "");
        if (!promptText) promptText = `prompt() for ${varName}`;
        setWaitingForInput(true, {
          varNames: [varName],
          lineNumber: pseudoLineNum,
          idx,
          description: `prompt(): ${promptText}`
        });
        addLog(pseudoLineNum, "Waiting for prompt() value.");
        return "WAITING_FOR_INPUT";
      }
    }

    // ===== OUTPUT HANDLERS (all languages) =====
    if (!contextLabel) {
      if (handlePrintf(trimmed, pseudoLineNum)) return;
      if (handleSystemOutPrintf(trimmed, pseudoLineNum)) return;
      if (handleSystemOutPrint(trimmed, pseudoLineNum)) return;
      if (handleConsoleLog(trimmed, pseudoLineNum)) return;
      if (handlePythonPrint(trimmed, pseudoLineNum)) return;
      if (handleCout(trimmed, pseudoLineNum)) return;
    }

    // ===== Declarations, assignments & updates =====
    // Type keywords for C/C++/Java/JS
    const typePattern =
      "(int|long|short|float|double|char|bool|boolean|String|let|const|var)";

    // Declaration with assignment
    let match = trimmed.match(
      new RegExp("^" + typePattern + "\\s+([A-Za-z_]\\w*)\\s*=\\s*(.+);?$")
    );
    if (match) {
      const name = match[2];
      const expr = match[3];
      const numeric = evalAsNumber(expr);
      const value = numeric !== null ? numeric : expr.trim();
      variables[name] = value;
      addLog(
        pseudoLineNum,
        contextLabel
          ? `${contextLabel}: declare ${name} = ${value}`
          : `Declare ${name} = ${value}`
      );
      return;
    }

    // Declaration only
    match = trimmed.match(
      new RegExp("^" + typePattern + "\\s+([A-Za-z_]\\w*)\\s*;?$")
    );
    if (match) {
      const name = match[2];
      if (!Object.prototype.hasOwnProperty.call(variables, name)) {
        variables[name] = 0;
      }
      addLog(
        pseudoLineNum,
        contextLabel
          ? `${contextLabel}: declare ${name} (visualizer initializes as 0).`
          : `Declare ${name} (visualizer initializes as 0).`
      );
      return;
    }

    // Increment / decrement: i++; i--;
    match = trimmed.match(/^([A-Za-z_]\w*)(\+\+|--);?$/);
    if (match) {
      const name = match[1];
      const op = match[2];
      const current = Number(variables[name] ?? 0);
      const next = op === "++" ? current + 1 : current - 1;
      variables[name] = next;
      addLog(
        pseudoLineNum,
        contextLabel
          ? `${contextLabel}: ${name} ${op === "++" ? "++" : "--"} → ${next}`
          : `${name} ${op === "++" ? "incremented" : "decremented"} to ${next}`
      );
      return;
    }

    // Assignment: index = i;  sum = sum + i;
    match = trimmed.match(/^([A-Za-z_]\w*)\s*=\s*(.+);?$/);
    if (match) {
      const name = match[1];
      const expr = match[2];
      const numeric = evalAsNumber(expr);
      const value = numeric !== null ? numeric : expr.trim();
      const before = variables[name];
      variables[name] = value;

      if (before === undefined) {
        addLog(
          pseudoLineNum,
          contextLabel
            ? `${contextLabel}: set ${name} = ${value}`
            : `Set ${name} = ${value}`
        );
      } else {
        addLog(
          pseudoLineNum,
          contextLabel
            ? `${contextLabel}: ${name} ${before} → ${value}`
            : `Update ${name}: ${before} → ${value}`
        );
      }
      return;
    }

    // Fallback
    addLog(
      pseudoLineNum,
      contextLabel
        ? `${contextLabel}: no variable change.`
        : "No variable change (not a simple assignment/declaration)."
    );
  }

  function interpretLine(idx) {
    const rawLine = lines[idx] || "";
    const noComment = rawLine
      .replace(/\/\/.*$/, "")
      .replace(/#.*$/, "");
    const trimmed = noComment.trim();
    const lineNumber = idx + 1;

    if (!trimmed) {
      addLog(lineNumber, "Blank or comment line.");
      return;
    }

    if (trimmed === "{" || trimmed === "}") {
      addLog(lineNumber, "Block delimiter.");
      return;
    }

    return interpretTextStatement(trimmed, lineNumber, null, {
      allowInput: true,
      idx
    });
  }

  /* =========================================
     for-loop analysis & simulation
     ========================================= */

  function analyzeForLoops() {
    forMetaMap = {};

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const stripped = rawLine.replace(/\/\/.*$/, "").trim();
      if (!stripped.startsWith("for")) continue;

      const m = stripped.match(/for\s*\(([^)]*)\)/);
      if (!m) continue;

      const inside = m[1];
      const parts = inside.split(";");
      if (parts.length < 2) continue;

      const initPart = (parts[0] || "").trim();
      const condPart = (parts[1] || "").trim();
      const updatePart = (parts.slice(2).join(";") || "").trim();

      // Find line with '{'
      let braceLine = -1;
      const closingParenIndex = rawLine.indexOf(")");
      if (closingParenIndex !== -1) {
        const afterParen = rawLine.slice(closingParenIndex + 1);
        if (afterParen.includes("{")) braceLine = i;
      }
      if (braceLine === -1) {
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].includes("{")) {
            braceLine = j;
            break;
          }
        }
      }
      if (braceLine === -1) continue;

      // Find matching '}'
      let depth = 0;
      let closingLine = braceLine;
      for (let j = braceLine; j < lines.length; j++) {
        const t = lines[j];
        for (const ch of t) {
          if (ch === "{") depth++;
          else if (ch === "}") depth--;
        }
        if (depth === 0) {
          closingLine = j;
          break;
        }
      }

      const bodyStart = braceLine + 1;
      const bodyEnd = closingLine - 1;

      forMetaMap[i] = {
        headerIndex: i,
        bodyStart,
        bodyEnd,
        closingLine,
        initPart,
        condPart,
        updatePart
      };
    }
  }

  function highlightLine(idx) {
    if (!codeEl) return;
    const allLines = codeEl.querySelectorAll(".visualizer-line");
    allLines.forEach((el) => el.classList.remove("active"));

    if (idx < 0 || idx >= allLines.length) return;

    const active = allLines[idx];
    active.classList.add("active");

    const parent = codeEl.parentElement;
    if (parent && parent.scrollTo) {
      const rect = active.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      const offset = rect.top - parentRect.top;
      parent.scrollTo({
        top: parent.scrollTop + offset - 80,
        behavior: "smooth"
      });
    }
  }

  function updateLineInfo(idx) {
    if (!lineInfoEl) return;
    if (idx < 0 || idx >= lines.length) {
      lineInfoEl.textContent = "Program finished.";
      return;
    }
    const raw = lines[idx] || "";
    lineInfoEl.textContent = `Line ${idx + 1}: ${raw.trim() || "(blank)"}`;
  }

  function currentLoopFrame() {
    return loopStack.length > 0 ? loopStack[loopStack.length - 1] : null;
  }

  function executeForHeader(meta) {
    const headerLineNum = meta.headerIndex + 1;

    if (meta.initPart && meta.initPart.trim() !== "") {
      interpretTextStatement(meta.initPart, headerLineNum, "for-init");
    }

    let condTrue = true;
    if (meta.condPart && meta.condPart.trim() !== "") {
      condTrue = evalAsBoolean(meta.condPart);
    }

    if (!condTrue) {
      addLog(headerLineNum, "for condition false at start → loop skipped.");
      currentIndex = meta.closingLine + 1;
      return;
    }

    loopStack.push({
      headerIndex: meta.headerIndex,
      bodyStart: meta.bodyStart,
      bodyEnd: meta.bodyEnd,
      closingLine: meta.closingLine,
      condPart: meta.condPart,
      updatePart: meta.updatePart,
      iteration: 1
    });

    addLog(headerLineNum, "Enter for-loop (iteration 1).");

    if (meta.bodyStart >= 0 && meta.bodyStart < lines.length) {
      currentIndex = meta.bodyStart;
    } else {
      handleForEndOfBody(loopStack[loopStack.length - 1]);
    }
  }

  function handleForEndOfBody(frame) {
    const bodyEndLineNum = frame.bodyEnd + 1;

    if (frame.updatePart && frame.updatePart.trim() !== "") {
      interpretTextStatement(frame.updatePart, bodyEndLineNum, "for-update");
    }

    let condTrue = true;
    if (frame.condPart && frame.condPart.trim() !== "") {
      condTrue = evalAsBoolean(frame.condPart);
    }

    if (!condTrue) {
      addLog(bodyEndLineNum, "Loop ends: condition is false.");
      loopStack.pop();
      currentIndex = frame.closingLine + 1;
      return;
    }

    frame.iteration += 1;
    addLog(
      bodyEndLineNum,
      `Condition still true → next iteration (${frame.iteration}).`
    );

    currentIndex = frame.bodyStart;
  }

  function executeStep() {
    if (executionFinished) return;
    if (waitingForInput) return;
    if (currentIndex < 0 || currentIndex >= lines.length) {
      executionFinished = true;
      updateLineInfo(-1);
      highlightLine(-1);
      return;
    }

    const idx = currentIndex;
    highlightLine(idx);
    updateLineInfo(idx);

    const meta = forMetaMap[idx];
    const frame = currentLoopFrame();

    // for-header
    if (meta) {
      executeForHeader(meta);
      return;
    }

    // inside loop body
    if (frame && idx >= frame.bodyStart && idx <= frame.bodyEnd) {
      const res = interpretLine(idx);
      if (res === "WAITING_FOR_INPUT") return;
      if (idx < frame.bodyEnd) {
        currentIndex = idx + 1;
      } else {
        handleForEndOfBody(frame);
      }
      return;
    }

    // normal line
    const result = interpretLine(idx);
    if (result === "WAITING_FOR_INPUT") return;

    currentIndex = idx + 1;
    if (currentIndex >= lines.length && loopStack.length === 0) {
      executionFinished = true;
    }
  }

  /* =========================================
     Controls: next / back / reset
     ========================================= */

  function stepForward() {
    if (lines.length === 0) return;
    if (waitingForInput) return;

    if (currentIndex === -1) {
      currentIndex = 0;
      pushSnapshot();
    }

    if (executionFinished) {
      updateLineInfo(-1);
      return;
    }

    executeStep();
    renderVariables();
    renderLog();
    renderOutput();
    pushSnapshot();
  }

  function stepBack() {
    if (waitingForInput) return;
    if (history.length <= 1) return;

    history.pop();
    const prev = history[history.length - 1];
    restoreSnapshot(prev);
  }

  function resetSteps() {
    resetState();
    currentIndex = lines.length > 0 ? 0 : -1;
    history = [];
    if (currentIndex !== -1) {
      pushSnapshot();
      highlightLine(currentIndex);
      updateLineInfo(currentIndex);
    } else {
      updateLineInfo(-1);
    }
  }

  /* =========================================
     Render code lines
     ========================================= */

  function renderLines() {
    if (!codeEl) return;
    codeEl.innerHTML = "";

    lines.forEach((text, idx) => {
      const line = document.createElement("span");
      line.className = "visualizer-line";
      line.dataset.index = idx.toString();

      const num = document.createElement("span");
      num.className = "visualizer-line-number";
      num.textContent = (idx + 1).toString().padStart(2, " ");

      const content = document.createElement("span");
      content.className = "visualizer-line-text";
      content.textContent = text === "" ? " " : text;

      line.appendChild(num);
      line.appendChild(content);

      // Click: fast-forward from start to that line
      line.addEventListener("click", () => {
        resetSteps();
        while (
          !executionFinished &&
          currentIndex < idx &&
          !waitingForInput
        ) {
          executeStep();
          renderVariables();
          renderLog();
          renderOutput();
          pushSnapshot();
        }
        highlightLine(currentIndex);
        updateLineInfo(currentIndex);
      });

      codeEl.appendChild(line);
      codeEl.appendChild(document.createTextNode("\n"));
    });
  }

  /* =========================================
     Load payload from localStorage
     ========================================= */

  function loadPayload() {
    const raw = localStorage.getItem("sanchari_visualizer_payload");
    if (!raw) {
      if (lineInfoEl) {
        lineInfoEl.textContent =
          "No code loaded. Go back to the challenge, type some code, then click 'Visualize Code'.";
      }
      return;
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      console.error("Invalid visualizer payload", e);
      if (lineInfoEl) {
        lineInfoEl.textContent =
          "Error reading visualizer data. Try again from the challenge page.";
      }
      return;
    }

    const code = (payload.code || "").replace(/\t/g, "    ");
    lines = code.split("\n");

    if (titleEl) {
      titleEl.textContent = payload.title || "Code Visualizer";
    }
    if (metaEl) {
      const lang = payload.language || "unknown";
      const lvl = (payload.levelIndex ?? 0) + 1;
      const ch = (payload.challengeIndex ?? 0) + 1;
      metaEl.textContent = `lang: ${lang} · Level ${lvl} · Q${ch}`;
    }

    renderLines();
    analyzeForLoops();
    resetState();

    if (lines.length > 0) {
      currentIndex = 0;
      history = [];
      pushSnapshot();
      highlightLine(currentIndex);
      updateLineInfo(currentIndex);
    } else if (lineInfoEl) {
      lineInfoEl.textContent =
        "Your code is empty. Go back, add some code, then visualize again.";
    }
  }

  /* =========================================
     Wire buttons + init
     ========================================= */

  if (stepForwardBtn) stepForwardBtn.addEventListener("click", stepForward);
  if (stepBackBtn) stepBackBtn.addEventListener("click", stepBack);
  if (resetStepsBtn) resetStepsBtn.addEventListener("click", resetSteps);
  if (submitInputBtn) submitInputBtn.addEventListener("click", handleSubmitInput);

  loadPayload();
})();
