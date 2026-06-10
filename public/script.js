const codeInput = document.getElementById('code');
const runBtn = document.getElementById('runBtn');
const clearCodeBtn = document.getElementById('clearCodeBtn');
const saveSnippetBtn = document.getElementById('saveSnippetBtn');
const insertTemplateBtn = document.getElementById('insertTemplateBtn');
const templateSelect = document.getElementById('templateSelect');
const copyOutputBtn = document.getElementById('copyOutputBtn');
const themeBtn = document.getElementById('themeBtn');
const runCountEl = document.getElementById('runCount');
const lastRunEl = document.getElementById('lastRun');
const outputCountEl = document.getElementById('outputCount');
const historySelect = document.getElementById('historySelect');
const outputEl = document.getElementById('output');
const errorBadge = document.getElementById('errorBadge');

let editor = null;
let errorLineHandle = null;

const templates = {
  hello: "console.log('Hello, world!');",
  loop: "for (let i = 1; i <= 5; i++) {\n  console.log(`Line ${i}`);\n}\n",
  calculator: "const add = (a, b) => a + b;\nconsole.log('5 + 7 =', add(5, 7));",
  error: "throw new Error('This is a sandboxed error');",
};

const storageKeys = {
  theme: 'compiler-theme',
  code: 'compiler-last-code',
  history: 'compiler-history',
  stats: 'compiler-stats',
};

function getCodeValue() {
  return editor ? editor.getValue() : codeInput.value;
}

function setCodeValue(value) {
  if (editor) {
    editor.setValue(value);
  } else {
    codeInput.value = value;
  }
}

function appendOutput(message, type = 'log') {
  const line = document.createElement('div');
  line.className = `output-line ${type}`;
  const label = document.createElement('span');
  label.textContent = type.toUpperCase();
  line.appendChild(label);
  line.appendChild(document.createTextNode(message));
  outputEl.appendChild(line);
  outputEl.scrollTop = outputEl.scrollHeight;
}

function clearErrorHighlight() {
  if (editor && errorLineHandle !== null) {
    editor.removeLineClass(errorLineHandle, 'background', 'error-line');
    errorLineHandle = null;
  }
  if (errorBadge) {
    errorBadge.classList.add('hidden');
    errorBadge.textContent = '';
  }
}

function showErrorBadge(lineNumber, message = 'Runtime error occurred') {
  if (!errorBadge) {
    return;
  }

  let badgeText = message;
  if (typeof lineNumber === 'number' && Number.isFinite(lineNumber)) {
    badgeText = `Error on line ${lineNumber}: ${message}`;
  }

  errorBadge.textContent = badgeText;
  errorBadge.classList.remove('hidden');
}

function highlightErrorLine(lineNumber) {
  clearErrorHighlight();
  if (!editor || typeof lineNumber !== 'number' || lineNumber < 1) {
    return;
  }

  errorLineHandle = editor.addLineClass(lineNumber - 1, 'background', 'error-line');
  editor.scrollIntoView({ from: { line: lineNumber - 1, ch: 0 }, to: { line: lineNumber - 1, ch: 0 } }, 100);
}

function setTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
  themeBtn.textContent = theme === 'light' ? 'Dark theme' : 'Light theme';
  localStorage.setItem(storageKeys.theme, theme);
}

function getStoredTheme() {
  return localStorage.getItem(storageKeys.theme) || 'dark';
}

function saveLastCode() {
  localStorage.setItem(storageKeys.code, getCodeValue());
}

function getHistory() {
  const raw = localStorage.getItem(storageKeys.history);
  return raw ? JSON.parse(raw) : [];
}

function saveHistoryItem(code) {
  if (!code.trim()) {
    return;
  }
  const history = getHistory();
  const item = { code, createdAt: new Date().toISOString() };
  history.unshift(item);
  localStorage.setItem(storageKeys.history, JSON.stringify(history.slice(0, 8)));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  historySelect.innerHTML = history.length
    ? history.map((item, index) => `<option value="${index}">${new Date(item.createdAt).toLocaleString()}</option>`).join('')
    : '<option disabled>No saved runs yet</option>';
}

function loadHistorySelection() {
  const history = getHistory();
  if (!history.length) {
    return;
  }
  const index = Number(historySelect.value);
  if (Number.isFinite(index) && history[index]) {
    setCodeValue(history[index].code);
    saveLastCode();
  }
}

function loadInitialState() {
  const storedCode = localStorage.getItem(storageKeys.code);
  if (storedCode) {
    setCodeValue(storedCode);
  }

  renderHistory();
  setTheme(getStoredTheme());

  const stats = JSON.parse(localStorage.getItem(storageKeys.stats) || '{"runs":0,"lastRun":null}');
  runCountEl.textContent = `Runs: ${stats.runs}`;
  lastRunEl.textContent = stats.lastRun ? `Last run: ${new Date(stats.lastRun).toLocaleTimeString()}` : 'Last run: never';
}

function updateStats() {
  const stats = JSON.parse(localStorage.getItem(storageKeys.stats) || '{"runs":0,"lastRun":null}');
  stats.runs += 1;
  stats.lastRun = new Date().toISOString();
  localStorage.setItem(storageKeys.stats, JSON.stringify(stats));
  runCountEl.textContent = `Runs: ${stats.runs}`;
  lastRunEl.textContent = `Last run: ${new Date(stats.lastRun).toLocaleTimeString()}`;
}

function updateOutputCount() {
  const count = outputEl.querySelectorAll('.output-line').length;
  outputCountEl.textContent = `${count} entries`;
}

async function runCode() {
  outputEl.innerHTML = '';
  clearErrorHighlight();
  const code = getCodeValue();

  try {
    const response = await fetch('/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Server error');
    }

    result.output.forEach(entry => {
      appendOutput(entry.text, entry.type);
    });

    const errorEntry = result.output.find(entry => entry.type === 'error');
    if (errorEntry) {
      showErrorBadge(errorEntry.line, errorEntry.text);
      if (Number.isFinite(errorEntry.line)) {
        highlightErrorLine(errorEntry.line);
      }
    }

    updateStats();
    updateOutputCount();
    saveLastCode();
    saveHistoryItem(code);
  } catch (error) {
    appendOutput(error.message, 'error');
    showErrorBadge(null, error.message);
    updateOutputCount();
  }
}

function insertTemplate() {
  const selected = templateSelect.value;
  setCodeValue(templates[selected] || getCodeValue());
  saveLastCode();
}

function clearCode() {
  setCodeValue('');
  saveLastCode();
}

async function copyOutput() {
  try {
    await navigator.clipboard.writeText(outputEl.innerText.trim());
    appendOutput('Output copied to clipboard.', 'info');
    updateOutputCount();
  } catch (error) {
    appendOutput('Clipboard copy failed.', 'error');
    updateOutputCount();
  }
}

function initializeEditor() {
  if (window.CodeMirror) {
    editor = CodeMirror.fromTextArea(codeInput, {
      mode: 'javascript',
      theme: 'material-darker',
      lineNumbers: true,
      indentUnit: 2,
      tabSize: 2,
      viewportMargin: Infinity,
      lineWrapping: true,
    });

    editor.on('change', saveLastCode);
  }
}

runBtn.addEventListener('click', runCode);
insertTemplateBtn.addEventListener('click', insertTemplate);
saveSnippetBtn.addEventListener('click', () => saveHistoryItem(getCodeValue()));
clearCodeBtn.addEventListener('click', clearCode);
copyOutputBtn.addEventListener('click', copyOutput);
themeBtn.addEventListener('click', () => setTheme(document.body.classList.contains('light') ? 'dark' : 'light'));
historySelect.addEventListener('change', loadHistorySelection);

initializeEditor();
loadInitialState();
