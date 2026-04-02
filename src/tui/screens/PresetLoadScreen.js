// PresetLoadScreen.js — Load a preset into the current line with try-before-you-buy preview

import React, { useState } from 'react';
import { Text, useInput } from 'ink';
import { ScreenLayout } from '../components/ScreenLayout.js';
import { getIndividualWidgets } from '../widget-registry.js';
import { resolvePreviewColor, toInkColor } from '../preview-utils.js';

const e = React.createElement;

const SHORTCUTS = [
  { key: '\u2191\u2193', label: 'Navigate' },
  { key: 'Enter', label: 'Load' },
  { key: 'Esc', label: 'Back' },
];

function getPresetSlotData(preset, slotIndex) {
  if (!preset) return { isEmpty: true, name: null, widgets: [] };
  const allWidgets = getIndividualWidgets();
  const widgetEntries = (preset.widgets || []).map(id => {
    const w = allWidgets.find(wd => wd.id === id);
    return { id, name: w ? w.name : id, color: resolvePreviewColor(id, preset.colorModes || {}) };
  });
  return { isEmpty: false, name: preset.name, widgets: widgetEntries };
}

function renderSlot(slotIndex, slotData, isCursor) {
  const prefix = isCursor ? '> ' : '  ';
  if (slotData.isEmpty) {
    return e(Text, { key: `slot-${slotIndex}`, dimColor: true }, `${prefix}${slotIndex + 1}. (empty)`);
  }
  const children = [`${prefix}${slotIndex + 1}. ${slotData.name}    `];
  slotData.widgets.forEach((w, j) => {
    if (j > 0) children.push(' \u00b7 ');
    children.push(e(Text, { key: `w-${slotIndex}-${j}`, color: toInkColor(w.color) }, w.name));
  });
  return e(Text, { key: `slot-${slotIndex}` }, ...children);
}

export function PresetLoadScreen({ config, updateConfig, previewOverride, setPreviewOverride, goBack, editingLine, isActive }) {
  const [cursorIndex, setCursorIndex] = useState(0);
  const presets = config.presets || [null, null, null];

  function applyPreviewForSlot(index) {
    const preset = presets[index];
    if (!preset) {
      setPreviewOverride(null);
      return;
    }
    const preview = structuredClone(config);
    preview.lines[editingLine].widgets = [...preset.widgets];
    preview.lines[editingLine].colorModes = { ...preset.colorModes };
    setPreviewOverride(preview);
  }

  useInput((input, key) => {
    if (key.upArrow) {
      const next = Math.max(0, cursorIndex - 1);
      if (next !== cursorIndex) {
        setCursorIndex(next);
        applyPreviewForSlot(next);
      }
    }
    if (key.downArrow) {
      const next = Math.min(2, cursorIndex + 1);
      if (next !== cursorIndex) {
        setCursorIndex(next);
        applyPreviewForSlot(next);
      }
    }
    if (key.return) {
      const preset = presets[cursorIndex];
      if (!preset) return; // empty slot — no-op
      updateConfig(cfg => {
        cfg.lines[editingLine].widgets = [...preset.widgets];
        cfg.lines[editingLine].colorModes = { ...preset.colorModes };
      });
      setPreviewOverride(null);
      goBack();
    }
    if (key.escape) goBack();
  }, { isActive });

  const slots = [0, 1, 2].map(i => getPresetSlotData(presets[i], i));

  return e(ScreenLayout, {
    breadcrumb: ['Home', `Edit Line ${editingLine + 1}`, 'Load Preset'],
    config,
    previewOverride,
    shortcuts: SHORTCUTS,
  },
    ...slots.map((slot, i) => renderSlot(i, slot, i === cursorIndex))
  );
}
