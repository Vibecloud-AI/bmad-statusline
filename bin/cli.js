#!/usr/bin/env node

const USAGE = `bmad-statusline — BMAD workflow status line for ccstatusline

Usage: bmad-statusline [command]

Commands:
  (no command) Launch TUI configurator
  install      Install status line widgets and reader
  uninstall    Remove status line widgets and reader
  clean        Clean cache files

Options:
  -h, --help   Show this help text`;

const command = process.argv[2];

if (!command) {
  const { default: launchTui } = await import('../src/tui/app.js');
  await launchTui();
} else if (command === '--help' || command === '-h') {
  console.log(USAGE);
} else {
  switch (command) {
    case 'install':
    case 'uninstall':
    case 'clean': {
      const mod = await import(`../src/${command}.js`);
      await mod.default();
      break;
    }
    default:
      console.log(USAGE);
      process.exit(1);
  }
}
