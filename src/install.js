import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStatusLineConfig, getWidgetDefinitions, getHookConfig } from './defaults.js';
import { createDefaultConfig } from './tui/widget-registry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readerSource = path.join(__dirname, 'reader', 'bmad-sl-reader.js');
const hookSource = path.join(__dirname, 'hook', 'bmad-hook.js');

const home = os.homedir();
const defaultPaths = {
  claudeSettings: path.join(home, '.claude', 'settings.json'),
  claudeDir: path.join(home, '.claude'),
  ccstatuslineSettings: path.join(home, '.config', 'ccstatusline', 'settings.json'),
  ccstatuslineDir: path.join(home, '.config', 'ccstatusline'),
  readerDest: path.join(home, '.config', 'bmad-statusline', 'bmad-sl-reader.js'),
  readerDir: path.join(home, '.config', 'bmad-statusline'),
  hookDest: path.join(home, '.config', 'bmad-statusline', 'bmad-hook.js'),
  cacheDir: path.join(home, '.cache', 'bmad-status'),
};

// --- Logging helpers ---

function logSuccess(target, message) { console.log(`  \u2713 ${target} \u2014 ${message}`); }
function logSkipped(target, message) { console.log(`  \u25CB ${target} \u2014 ${message}`); }
function logError(target, message)   { console.log(`  \u2717 ${target} \u2014 ${message}`); }

// --- JSON mutation helpers ---

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function backupFile(filePath) {
  fs.copyFileSync(filePath, filePath + '.bak');
}

function writeJsonSafe(filePath, obj) {
  const json = JSON.stringify(obj, null, 2);
  fs.writeFileSync(filePath, json + '\n', 'utf8');
  // Validate post-write by rereading and parsing
  const reread = fs.readFileSync(filePath, 'utf8');
  JSON.parse(reread);
}

// --- Install targets ---

function installTarget1(paths) {
  const target = '~/.claude/settings.json';
  try {
    fs.mkdirSync(paths.claudeDir, { recursive: true });

    if (fs.existsSync(paths.claudeSettings)) {
      const config = readJsonFile(paths.claudeSettings);
      if ('statusLine' in config) {
        logSkipped(target, 'statusLine already configured');
        return;
      }
      backupFile(paths.claudeSettings);
      config.statusLine = getStatusLineConfig();
      writeJsonSafe(paths.claudeSettings, config);
    } else {
      const config = { statusLine: getStatusLineConfig() };
      writeJsonSafe(paths.claudeSettings, config);
    }
    logSuccess(target, 'statusLine configured');
  } catch (err) {
    try {
      const bakPath = paths.claudeSettings + '.bak';
      if (fs.existsSync(bakPath)) fs.copyFileSync(bakPath, paths.claudeSettings);
    } catch {}
    logError(target, err.message);
    return false;
  }
}

function installTarget2(paths) {
  const target = '~/.config/ccstatusline/settings.json';
  try {
    fs.mkdirSync(paths.ccstatuslineDir, { recursive: true });

    let config;
    if (fs.existsSync(paths.ccstatuslineSettings)) {
      config = readJsonFile(paths.ccstatuslineSettings);
    } else {
      config = { version: 3, lines: [[], [], []] };
    }

    // Ensure lines array exists
    if (!Array.isArray(config.lines)) {
      config.lines = [[], [], []];
    }

    const allWidgets = config.lines.flat();

    // v2 detection: bmad-line-* composites already present — skip (idempotent)
    const hasV2 = allWidgets.some(w => w.id?.startsWith('bmad-line-'));
    if (hasV2) {
      logSkipped(target, 'bmad-line-* already present');
      return;
    }

    if (fs.existsSync(paths.ccstatuslineSettings)) {
      backupFile(paths.ccstatuslineSettings);
    }

    // v1 detection: individual bmad-* widgets (not bmad-line-*) — upgrade to v2
    const hasV1 = allWidgets.some(w => w.id?.startsWith('bmad-') && w.type === 'custom-command' && !w.id.startsWith('bmad-line-'));
    if (hasV1) {
      // Remove all old bmad-* and sep-bmad-* widgets from all lines
      config.lines = config.lines.map(line =>
        line.filter(w => !w.id?.startsWith('bmad-') && !w.id?.startsWith('sep-bmad-'))
      );
      // Inject v2 composite on line 0
      const widgets = getWidgetDefinitions(paths.readerDest);
      config.lines[0] = [...config.lines[0], ...widgets];
      writeJsonSafe(paths.ccstatuslineSettings, config);
      logSuccess(target, 'upgraded v1 widgets to v2 composite');
      return;
    }

    // Fresh install: inject v2 composite on line 0
    const targetLine = 0;
    while (config.lines.length <= targetLine) {
      config.lines.push([]);
    }
    const widgets = getWidgetDefinitions(paths.readerDest);
    config.lines[targetLine] = [...config.lines[targetLine], ...widgets];

    writeJsonSafe(paths.ccstatuslineSettings, config);
    logSuccess(target, 'BMAD widgets injected');
  } catch (err) {
    try {
      const bakPath = paths.ccstatuslineSettings + '.bak';
      if (fs.existsSync(bakPath)) fs.copyFileSync(bakPath, paths.ccstatuslineSettings);
    } catch {}
    logError(target, err.message);
    return false;
  }
}

function installTarget3(paths) {
  const target = '~/.config/bmad-statusline/bmad-sl-reader.js';
  try {
    fs.mkdirSync(paths.readerDir, { recursive: true });
    const existed = fs.existsSync(paths.readerDest);
    fs.copyFileSync(readerSource, paths.readerDest);
    logSuccess(target, existed ? 'updated' : 'installed');
  } catch (err) {
    logError(target, err.message);
    return false;
  }
}

function installTarget4(paths) {
  const target = '~/.cache/bmad-status/';
  try {
    if (fs.existsSync(paths.cacheDir)) {
      logSkipped(target, 'already exists');
      return;
    }
    fs.mkdirSync(paths.cacheDir, { recursive: true });
    logSuccess(target, 'created');
  } catch (err) {
    logError(target, err.message);
    return false;
  }
}

function installTarget5(paths) {
  const target = '~/.claude/settings.json hooks';
  try {
    if (!fs.existsSync(paths.claudeSettings)) {
      logSkipped(target, 'settings.json not found');
      return;
    }

    const config = readJsonFile(paths.claudeSettings);

    // Create structure if missing (coerce non-object/non-array — follows Target 2 precedent)
    if (!config.hooks || typeof config.hooks !== 'object' || Array.isArray(config.hooks)) config.hooks = {};

    const desired = getHookConfig(paths.hookDest);
    let changed = false;

    // Phase 2 upgrade: detect and remove stale Skill matcher from PostToolUse
    if (Array.isArray(config.hooks.PostToolUse)) {
      const before = config.hooks.PostToolUse.length;
      config.hooks.PostToolUse = config.hooks.PostToolUse.filter(entry => {
        const isBmadSkill = entry.matcher === 'Skill' &&
          Array.isArray(entry.hooks) &&
          entry.hooks.some(h => h.command && h.command.includes('bmad-hook.js'));
        return !isBmadSkill;
      });
      if (config.hooks.PostToolUse.length < before) changed = true;
    }

    // Per-event-type granular merge: add only missing bmad matchers
    for (const [event, desiredEntries] of Object.entries(desired.hooks)) {
      if (!Array.isArray(config.hooks[event])) config.hooks[event] = [];
      for (const entry of desiredEntries) {
        const alreadyExists = config.hooks[event].some(existing =>
          existing.matcher === entry.matcher &&
          Array.isArray(existing.hooks) &&
          existing.hooks.some(h => h.command && h.command.includes('bmad-hook.js'))
        );
        if (!alreadyExists) {
          config.hooks[event].push(entry);
          changed = true;
        }
      }
    }

    if (!changed) {
      logSkipped(target, 'hook config already present');
      return;
    }

    backupFile(paths.claudeSettings);
    writeJsonSafe(paths.claudeSettings, config);
    logSuccess(target, 'hook config injected');
  } catch (err) {
    try {
      const bakPath = paths.claudeSettings + '.bak';
      if (fs.existsSync(bakPath)) fs.copyFileSync(bakPath, paths.claudeSettings);
    } catch {}
    logError(target, err.message);
    return false;
  }
}

function installTarget6(paths) {
  const target = '~/.config/bmad-statusline/bmad-hook.js';
  try {
    fs.mkdirSync(paths.readerDir, { recursive: true });
    const existed = fs.existsSync(paths.hookDest);
    fs.copyFileSync(hookSource, paths.hookDest);
    logSuccess(target, existed ? 'updated' : 'installed');
  } catch (err) {
    logError(target, err.message);
    return false;
  }
}

function installTarget7(paths) {
  const target = '~/.config/bmad-statusline/config.json';
  try {
    const configPath = path.join(paths.readerDir, 'config.json');
    if (fs.existsSync(configPath)) {
      logSkipped(target, 'already exists');
      return;
    }
    fs.mkdirSync(paths.readerDir, { recursive: true });
    const config = createDefaultConfig();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    logSuccess(target, 'created default configuration');
  } catch (err) {
    logError(target, err.message);
    return false;
  }
}

// --- Main ---

export default function install(paths = defaultPaths) {
  const results = [
    installTarget1(paths),
    installTarget2(paths),
    installTarget3(paths),
    installTarget4(paths),
    installTarget5(paths),
    installTarget6(paths),
    installTarget7(paths),
  ];
  if (results.some(r => r === false)) {
    process.exit(1);
  }
}
