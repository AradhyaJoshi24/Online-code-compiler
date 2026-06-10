# Online Code Compiler

A simple browser-based online code compiler that lets you write and execute JavaScript code instantly.

## Files

- `index.html` - the application UI
- `styles.css` - styling for the editor and output panels
- `script.js` - runtime logic for executing JavaScript code safely in the browser

## Run locally

1. Make sure Node.js 18 or later is installed.
2. Open a terminal in this folder.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000` in your browser.

## Notes

This project now includes a Node.js backend server that evaluates JavaScript in a sandboxed VM context and returns console output to the browser.

### Unique features

- Syntax-highlighted editor with CodeMirror
- Theme toggle (light / dark)
- Code template insertion
- Saved run history in the browser
- Copyable output pane
- Run statistics and last-run timestamp
