#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CACHE_DIR = process.env.BMAD_CACHE_DIR || path.join(os.homedir(), '.cache', 'bmad-status');
const CONFIG_DIR = process.env.BMAD_CONFIG_DIR || path.join(os.homedir(), '.config', 'bmad-statusline');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const ALIVE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const FRESH_THRESHOLD_MS = 60 * 1000;   // 60 seconds
const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// --- Color maps ---

const WORKFLOW_COLORS = {
  // Dev (cyan)
  'dev-story': '\x1b[36m',
  'quick-dev': '\x1b[36m',
  // Review (brightRed)
  'code-review': '\x1b[91m',
  // Planning (green)
  'sprint-planning': '\x1b[32m',
  'sprint-status': '\x1b[32m',
  'create-story': '\x1b[32m',
  'create-epics': '\x1b[32m',
  // Product (yellow)
  'create-prd': '\x1b[33m',
  'edit-prd': '\x1b[33m',
  'validate-prd': '\x1b[33m',
  // Architecture (magenta)
  'create-architecture': '\x1b[35m',
  'create-ux-design': '\x1b[35m',
  // Research (blue)
  'domain-research': '\x1b[34m',
  'technical-research': '\x1b[34m',
  'market-research': '\x1b[34m',
  // Creative (brightYellow)
  'brainstorming': '\x1b[93m',
  'party-mode': '\x1b[93m',
  'retrospective': '\x1b[93m',
  // Documentation (brightGreen)
  'document-project': '\x1b[92m',
  'generate-project-context': '\x1b[92m',
};

const WORKFLOW_PREFIX_COLORS = [
  { prefix: 'testarch-', color: '\x1b[31m' },       // Quality (red)
  { prefix: 'qa-generate-', color: '\x1b[31m' },     // Quality (red)
  { prefix: 'wds-', color: '\x1b[94m' },             // WDS (brightBlue)
];

// --- Helpers ---

const RESET = '\x1b[0m';

function colorize(text, ansiCode) {
  if (!text || !ansiCode) return text || '';
  return `${ansiCode}${text}${RESET}`;
}

function getWorkflowColor(workflow) {
  if (!workflow) return null;
  // Strip bmad- prefix for lookup (agents write "bmad-dev-story", map has "dev-story")
  const normalized = workflow.startsWith('bmad-') ? workflow.slice(5) : workflow;
  if (WORKFLOW_COLORS[normalized]) return WORKFLOW_COLORS[normalized];
  if (WORKFLOW_COLORS[workflow]) return WORKFLOW_COLORS[workflow];
  for (const { prefix, color } of WORKFLOW_PREFIX_COLORS) {
    if (normalized.startsWith(prefix) || workflow.startsWith(prefix)) return color;
  }
  return null;
}

function ensureCacheDir() {
  try { fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch {}
}

function readStdin() {
  try {
    const data = fs.readFileSync(0, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function readStatusFile(sessionId) {
  try {
    const filePath = path.join(CACHE_DIR, `status-${sessionId}.json`);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

// --- Piggybacking cleanup ---

function touchAlive(sessionId) {
  try {
    const alivePath = path.join(CACHE_DIR, `.alive-${sessionId}`);
    const now = new Date();
    fs.writeFileSync(alivePath, '', { flag: 'w' });
    fs.utimesSync(alivePath, now, now);
  } catch {}
}

function purgeStale() {
  try {
    const entries = fs.readdirSync(CACHE_DIR);
    const now = Date.now();
    for (const entry of entries) {
      if (!entry.startsWith('.alive-')) continue;
      const filePath = path.join(CACHE_DIR, entry);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > ALIVE_MAX_AGE_MS) {
        const staleId = entry.slice('.alive-'.length);
        try { fs.unlinkSync(filePath); } catch {}
        try { fs.unlinkSync(path.join(CACHE_DIR, `status-${staleId}.json`)); } catch {}
      }
    }
  } catch {}
}

// --- Internal config support ---

const READER_SEPARATORS = {
  serre: '\u2503',
  modere: ' \u2503 ',
  large: '  \u2503  ',
};

const COLOR_CODES = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  brightBlack: '\x1b[90m',
};

function stripAnsi(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

function readLineConfig(lineIndex) {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    if (!config.lines || !config.lines[lineIndex]) return null;
    return {
      widgets: config.lines[lineIndex].widgets || [],
      colorModes: config.lines[lineIndex].colorModes || {},
      separator: config.separator || 'serre',
      customSeparator: config.customSeparator || null
    };
  } catch {
    return null;
  }
}

function resolveSeparator(style, custom) {
  if (style === 'custom' && custom) return custom;
  return READER_SEPARATORS[style] || READER_SEPARATORS.serre;
}

function handleLineCommand(lineIndex) {
  ensureCacheDir();
  const stdin = readStdin();
  if (!stdin || !stdin.session_id) { process.stdout.write(''); return; }
  const sessionId = stdin.session_id;
  touchAlive(sessionId);
  purgeStale();
  const status = readStatusFile(sessionId);
  if (!status) { process.stdout.write(''); return; }

  const lineConfig = readLineConfig(lineIndex);
  if (!lineConfig || lineConfig.widgets.length === 0) {
    process.stdout.write('');
    return;
  }

  const separator = resolveSeparator(lineConfig.separator, lineConfig.customSeparator);

  const segments = [];
  for (const widgetId of lineConfig.widgets) {
    const cmd = widgetId.replace(/^bmad-/, '');
    const extractor = COMMANDS[cmd];
    if (!extractor) continue;
    try {
      let value = extractor(status);
      if (!value) continue;
      const colorMode = lineConfig.colorModes[widgetId];
      if (colorMode) {
        if (colorMode.mode === 'fixed' && colorMode.fixedColor) {
          value = colorize(stripAnsi(value), COLOR_CODES[colorMode.fixedColor]);
        }
      }
      if (value) segments.push(value);
    } catch {
      // silent — skip this widget
    }
  }

  process.stdout.write(segments.join(separator));
}

// --- Story formatting ---

function formatStoryName(slug) {
  if (!slug) return '';
  const match = slug.match(/^(\d+-\d+)-(.+)$/);
  if (!match) return slug;
  const title = match[2].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return `${match[1]} ${title}`;
}

// --- Field extractors ---

function formatTimer(startedAt) {
  if (!startedAt) return '';
  const diffMs = Date.now() - new Date(startedAt).getTime();
  if (isNaN(diffMs) || diffMs < 0) return '';
  const totalSec = Math.floor(diffMs / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const totalMin = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (totalMin < 60) return `${totalMin}m${s.toString().padStart(2, '0')}s`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h${m.toString().padStart(2, '0')}m`;
}

function formatProgressBar(step) {
  if (!step || !step.total || step.total <= 0) return '';
  const current = Math.max(0, step.current || 0);
  const filled = Math.min(current, step.total);
  return '▰'.repeat(filled) + '▱'.repeat(step.total - filled);
}

function formatProgressStep(step) {
  if (!step || !step.total) return '';
  const current = step.current || 0;
  const progress = `${current}/${step.total}`;
  const name = step.current_name;
  if (name) return `Steps ${progress} ${name}`;
  return `Tasks ${progress}`;
}

const COMMANDS = {
  project:      (s) => s.project || '',
  workflow:     (s) => colorize(s.workflow || '', getWorkflowColor(s.workflow)),
  step:         (s) => (s.step && s.step.current_name) || '',
  nextstep:     (s) => (s.step && s.step.next_name) || '',
  progress:     (s) => {
    if (!s.step || !s.step.total) return '';
    return `${s.step.current || 0}/${s.step.total}`;
  },
  progressbar:  (s) => formatProgressBar(s.step),
  progressstep: (s) => formatProgressStep(s.step),
  story:        (s) => formatStoryName(s.story || ''),
  timer:        (s) => formatTimer(s.started_at),
  health:       (s) => {
    const updatedAt = s.updated_at;
    if (!updatedAt) return colorize('\u25CB', '\x1b[90m');
    const ageMs = Date.now() - new Date(updatedAt).getTime();
    if (isNaN(ageMs) || ageMs < 0) return colorize('\u25CB', '\x1b[90m');
    if (ageMs < FRESH_THRESHOLD_MS) return colorize('\u25CF', '\x1b[32m');
    if (ageMs < STALE_THRESHOLD_MS) return colorize('\u25CF', '\x1b[33m');
    return colorize('\u25CB', '\x1b[90m');
  },
};

// --- Main ---

function main() {
  const command = process.argv[2];

  if (command === 'line') {
    const lineIndex = parseInt(process.argv[3], 10);
    if (isNaN(lineIndex) || lineIndex < 0 || lineIndex > 2) {
      process.stdout.write('');
      return;
    }
    handleLineCommand(lineIndex);
    return;
  }

  if (!command || !Object.hasOwn(COMMANDS, command)) {
    process.stdout.write('');
    return;
  }

  ensureCacheDir();

  const stdin = readStdin();
  if (!stdin || !stdin.session_id) {
    process.stdout.write('');
    return;
  }

  const sessionId = stdin.session_id;

  // Piggybacking: touch alive + purge stale
  touchAlive(sessionId);
  purgeStale();

  const status = readStatusFile(sessionId);
  if (!status) {
    process.stdout.write('');
    return;
  }

  try {
    const result = COMMANDS[command](status);
    process.stdout.write(result || '');
  } catch {
    process.stdout.write('');
  }
}

main();
