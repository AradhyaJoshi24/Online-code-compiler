const codeInput = document.getElementById('code');
const outputEl = document.getElementById('output');
const runButton = document.getElementById('runButton');
const clearButton = document.getElementById('clearButton');
const templateSelect = document.getElementById('templateSelect');
const themeToggle = document.getElementById('themeToggle');
const copyButton = document.getElementById('copyButton');
const runCountEl = document.getElementById('runCount');
const historyList = document.getElementById('historyList');

const templates = {
  hello: "console.log('Hello, Canvas Code Playground!');",
  fibonacci: `const fib = [0, 1];
for (let i = 2; i < 10; i += 1) {
  fib[i] = fib[i - 1] + fib[i - 2];
}
console.log('Fibonacci sequence:', fib.join(', '));`,
  dom: `const title = document.createElement('h2');
title.textContent = 'DOM example rendered by your code';
title.style.color = '#2563eb';
document.body.appendChild(title);
console.log('DOM node added successfully');`,
  event: `let clicks = 0;
const button = document.createElement('button');
button.textContent = 'Click me!';
button.style.padding = '0.75rem 1rem';
button.style.borderRadius = '0.75rem';
button.style.cursor = 'pointer';
button.addEventListener('click', () => {
  clicks += 1;
  console.log('Clicks:', clicks);
});
document.body.appendChild(button);
console.log('Event button initialized');`,
};

const STORAGE_KEY = 'canvas-code-playground';
const THEME_KEY = 'canvas-code-playground-theme';
const HISTORY_KEY = 'canvas-code-playground-history';

function saveCode() {
  localStorage.setItem(STORAGE_KEY, codeInput.value);
}

function loadCode() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    codeInput.value = saved;
  } else {
    codeInput.value = templates.hello;
  }
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

function loadTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  return stored || 'light';
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-5)));
}

function loadHistory() {
  const stored = localStorage.getItem(HISTORY_KEY);
  return stored ? JSON.parse(stored) : [];
}

function updateHistory(runResult) {
  const history = loadHistory();
  history.unshift(`${new Date().toLocaleTimeString()}: ${runResult}`);
  saveHistory(history);
  renderHistory(history);
}

function renderHistory(history) {
  historyList.innerHTML = history
    .slice(0, 5)
    .map((item) => `<li>${item}</li>`)
    .join('');
}

function applyTheme(theme) {
  document.documentElement.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
  themeToggle.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
}

function appendOutput(text) {
  outputEl.textContent += `${text}\n`;
}

function runCode() {
  const code = codeInput.value;
  outputEl.textContent = '';

  try {
    const logs = [];
    const originalLog = console.log;

    console.log = (...args) => {
      logs.push(args.map((item) => String(item)).join(' '));
      originalLog.apply(console, args);
    };

    const result = new Function(code)();
    if (result !== undefined) {
      logs.push(String(result));
    }

    console.log = originalLog;
    logs.forEach(appendOutput);

    const summary = logs.length ? logs[logs.length - 1] : 'No output';
    incrementRunCount();
    updateHistory(summary);
  } catch (error) {
    appendOutput(error.message);
    updateHistory('Error: ' + error.message);
  }
}

function incrementRunCount() {
  const current = Number(runCountEl.textContent) || 0;
  runCountEl.textContent = current + 1;
}

templateSelect.addEventListener('change', () => {
  const chosen = templateSelect.value;
  codeInput.value = templates[chosen];
  saveCode();
});

runButton.addEventListener('click', runCode);
clearButton.addEventListener('click', () => {
  outputEl.textContent = '';
});

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  saveTheme(next);
});

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(codeInput.value);
    copyButton.textContent = 'Copied!';
    setTimeout(() => {
      copyButton.textContent = 'Copy Code';
    }, 1200);
  } catch (err) {
    copyButton.textContent = 'Copy Failed';
    setTimeout(() => {
      copyButton.textContent = 'Copy Code';
    }, 1200);
  }
});

codeInput.addEventListener('input', saveCode);

window.addEventListener('DOMContentLoaded', () => {
  loadCode();
  renderHistory(loadHistory());

  const theme = loadTheme();
  applyTheme(theme);

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    codeInput.value = templates.hello;
  }
});
