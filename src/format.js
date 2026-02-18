'use strict';

const supportsColor = process.stdout.isTTY && !process.env.NO_COLOR;

function colorize(code, text) {
  if (!supportsColor) return String(text);
  return `\x1b[${code}m${text}\x1b[0m`;
}

const fmt = {
  error: (text) => colorize('31', text),       // red
  warn: (text) => colorize('33', text),         // yellow
  success: (text) => colorize('32', text),      // green
  dim: (text) => colorize('2', text),           // dim
  key: (text) => colorize('1', text),           // bold
  heading: (text) => `\n${colorize('1;36', text)}\n`,  // bold cyan

  die(message) {
    console.error(fmt.error(`Error: ${message}`));
    process.exit(1);
  },
};

module.exports = { fmt };
