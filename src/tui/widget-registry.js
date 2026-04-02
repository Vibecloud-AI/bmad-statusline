// widget-registry.js — Widget metadata and config builder

import { WORKFLOW_COLORS } from '../defaults.js';

const INDIVIDUAL_WIDGETS = [
  { id: 'bmad-project',      command: 'project',      name: 'Project',       defaultEnabled: true,  defaultColor: 'yellow',     defaultMode: 'fixed' },
  { id: 'bmad-workflow',     command: 'workflow',     name: 'Workflow',      defaultEnabled: true,  defaultColor: null,         defaultMode: 'dynamic' },
  { id: 'bmad-step',         command: 'step',         name: 'Step',          defaultEnabled: false, defaultColor: 'yellow',     defaultMode: 'fixed' },
  { id: 'bmad-nextstep',     command: 'nextstep',     name: 'Next Step',     defaultEnabled: false, defaultColor: 'yellow',     defaultMode: 'fixed' },
  { id: 'bmad-progress',     command: 'progress',     name: 'Progress',      defaultEnabled: false, defaultColor: 'green',      defaultMode: 'fixed' },
  { id: 'bmad-progressbar',  command: 'progressbar',  name: 'Progress Bar',  defaultEnabled: false, defaultColor: 'green',      defaultMode: 'fixed' },
  { id: 'bmad-progressstep', command: 'progressstep', name: 'Progress+Step', defaultEnabled: true,  defaultColor: 'brightCyan', defaultMode: 'fixed' },
  { id: 'bmad-story',        command: 'story',        name: 'Story',         defaultEnabled: true,  defaultColor: 'magenta',    defaultMode: 'fixed' },
  { id: 'bmad-timer',        command: 'timer',        name: 'Timer',         defaultEnabled: true,  defaultColor: 'brightBlack', defaultMode: 'fixed' },
];

export const CCSTATUSLINE_COLORS = [
  'white', 'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan',
  'gray', 'brightRed', 'brightGreen', 'brightYellow', 'brightBlue',
  'brightMagenta', 'brightCyan', 'brightWhite',
];

export function getIndividualWidgets() {
  return INDIVIDUAL_WIDGETS.map(w => ({ ...w }));
}

export function getWorkflowColors() {
  return WORKFLOW_COLORS;
}

export function createDefaultConfig() {
  const allIds = INDIVIDUAL_WIDGETS.map(w => w.id);
  const widgets = INDIVIDUAL_WIDGETS.filter(w => w.defaultEnabled);
  const colorModes = {};
  for (const w of widgets) {
    colorModes[w.id] = w.defaultMode === 'dynamic'
      ? { mode: 'dynamic' }
      : { mode: 'fixed', fixedColor: w.defaultColor };
  }
  return {
    separator: 'modere',
    customSeparator: null,
    lines: [
      { widgets: widgets.map(w => w.id), widgetOrder: [...allIds], colorModes },
      { widgets: [], widgetOrder: [...allIds], colorModes: {} },
      { widgets: [], widgetOrder: [...allIds], colorModes: {} },
    ],
    presets: [null, null, null],
  };
}
