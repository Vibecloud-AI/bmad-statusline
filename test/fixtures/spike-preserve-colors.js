#!/usr/bin/env node
// Spike test: outputs ANSI escape codes to verify preserveColors passthrough
// Configure a ccstatusline widget with preserveColors: true pointing to this script
// Expected: colored text renders in terminal
'use strict';

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

// Read stdin (ccstatusline sends JSON via stdin)
let input = '';
try {
  const fs = require('fs');
  input = fs.readFileSync(0, 'utf8');
} catch {}

process.stdout.write(`${CYAN}BMAD${RESET} ${GREEN}spike-ok${RESET}`);
