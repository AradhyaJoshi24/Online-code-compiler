const express = require('express');
const path = require('path');
const { Script, createContext } = require('vm');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/run', (req, res) => {
  const { code } = req.body;
  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'Code must be a string.' });
  }

  if (/^\s*(?:import\s.+|export\s+(?:default|const|let|var|function|class|\{))/m.test(code)) {
    return res.json({
      output: [
        {
          type: 'error',
          text: 'ES module syntax is not supported in this sandbox. Remove import/export statements and use plain script code.',
        },
      ],
    });
  }

  const sandbox = {
    console: {
      output: [],
      log: (...args) => sandbox.console.output.push({ type: 'log', text: args.join(' ') }),
      error: (...args) => sandbox.console.output.push({ type: 'error', text: args.join(' ') }),
      warn: (...args) => sandbox.console.output.push({ type: 'warn', text: args.join(' ') }),
      info: (...args) => sandbox.console.output.push({ type: 'info', text: args.join(' ') }),
    },
  };

  const context = createContext(sandbox);

  const getErrorDetails = (error) => {
    const message = error && error.message ? error.message : String(error);
    const stack = error && error.stack ? error.stack : '';
    const match = /user-code\.js:(\d+):(\d+)/.exec(stack);
    const line = match ? Math.max(1, Number(match[1]) - 1) : null;
    const column = match ? Number(match[2]) : null;
    return { message, line, column };
  };

  const formatErrorOutput = (error, sourceCode) => {
    const { message, line, column } = getErrorDetails(error);
    const parts = [message];

    if (line !== null) {
      parts.push(`Line ${line}${column ? `, column ${column}` : ''}`);
      const codeLines = sourceCode.split(/\r?\n/);
      const errorLine = codeLines[line - 1] || '';
      if (errorLine !== undefined) {
        parts.push(`> ${line} | ${errorLine}`);
      }
    }

    return { text: parts.join(' '), line };
  };

  try {
    const wrappedCode = `(function() {\n${code}\n})();`;
    const script = new Script(wrappedCode, { filename: 'user-code.js', timeout: 1000 });
    script.runInContext(context, { timeout: 1000 });
    res.json({ output: sandbox.console.output });
  } catch (error) {
    const errorInfo = formatErrorOutput(error, code);
    res.json({ output: [{ type: 'error', text: errorInfo.text, line: errorInfo.line }] });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
