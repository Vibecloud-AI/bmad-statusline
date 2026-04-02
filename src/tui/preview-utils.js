// preview-utils.js — Shared preview logic for TUI components

import { getIndividualWidgets } from './widget-registry.js';

export const WORKFLOW_SAMPLE_COLOR = 'green';

export const SAMPLE_VALUES = {
  'bmad-project': 'myproject',
  'bmad-workflow': 'dev-story',
  'bmad-step': 'Step 2 Discover',
  'bmad-nextstep': 'Next: Step 3',
  'bmad-progress': '40%',
  'bmad-progressbar': '\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591',
  'bmad-progressstep': 'Tasks 2/5',
  'bmad-story': '4-2 Auth Login',
  'bmad-timer': '12:34',
};

export const SEPARATOR_MAP = {
  serre: '\u2503',
  modere: ' \u2503 ',
  large: '  \u2503  ',
};

export function toInkColor(name) {
  if (!name || !name.startsWith('bright')) return name;
  if (name === 'brightBlack') return 'gray';
  // brightRed → redBright, brightCyan → cyanBright, etc.
  const base = name.slice(6); // 'Red'
  return base.charAt(0).toLowerCase() + base.slice(1) + 'Bright';
}

export function resolvePreviewColor(widgetId, colorModes) {
  const mode = colorModes[widgetId];
  if (!mode) {
    const widgets = getIndividualWidgets();
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return 'white';
    if (widget.defaultColor != null) return widget.defaultColor;
    if (widget.defaultMode === 'dynamic') return WORKFLOW_SAMPLE_COLOR;
    return 'white';
  }
  if (mode.mode === 'dynamic') return WORKFLOW_SAMPLE_COLOR;
  return mode.fixedColor || 'white';
}
