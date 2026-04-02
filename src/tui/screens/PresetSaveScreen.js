// PresetSaveScreen.js — Save current line config to one of 3 preset slots

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput } from '@inkjs/ui';
import { ScreenLayout } from '../components/ScreenLayout.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { getIndividualWidgets } from '../widget-registry.js';
import { resolvePreviewColor, toInkColor } from '../preview-utils.js';

const e = React.createElement;

const SHORTCUTS = [
  { key: '\u2191\u2193', label: 'Navigate' },
  { key: 'Enter', label: 'Save here' },
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

export function PresetSaveScreen({ config, updateConfig, previewOverride, goBack, editingLine, isActive }) {
  const [cursorIndex, setCursorIndex] = useState(0);
  const [phase, setPhase] = useState('list'); // 'list' | 'naming' | 'confirm' | 'renaming'

  const presets = config.presets || [null, null, null];

  useInput((input, key) => {
    if (phase !== 'list') return;
    if (key.upArrow) setCursorIndex(prev => Math.max(0, prev - 1));
    if (key.downArrow) setCursorIndex(prev => Math.min(2, prev + 1));
    if (key.return) {
      if (presets[cursorIndex]) {
        setPhase('confirm');
      } else {
        setPhase('naming');
      }
    }
    if (key.escape) goBack();
  }, { isActive });

  // Handle naming/renaming escape — TextInput doesn't have onCancel, so we use a separate useInput
  useInput((input, key) => {
    if (phase !== 'naming' && phase !== 'renaming') return;
    if (key.escape) setPhase('list');
  }, { isActive });

  function handleNameSubmit(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateConfig(cfg => {
      cfg.presets[cursorIndex] = {
        name: trimmed,
        widgets: [...cfg.lines[editingLine].widgets],
        colorModes: { ...cfg.lines[editingLine].colorModes },
      };
    });
    goBack();
  }

  function handleConfirm() {
    // Overwrite confirmed — show TextInput for optional rename
    setPhase('renaming');
  }

  function handleRenameSubmit(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateConfig(cfg => {
      cfg.presets[cursorIndex] = {
        name: trimmed,
        widgets: [...cfg.lines[editingLine].widgets],
        colorModes: { ...cfg.lines[editingLine].colorModes },
      };
    });
    goBack();
  }

  function handleCancelConfirm() {
    setPhase('list');
  }

  const slots = [0, 1, 2].map(i => getPresetSlotData(presets[i], i));

  const children = [];

  // Slot list
  for (let i = 0; i < 3; i++) {
    children.push(renderSlot(i, slots[i], i === cursorIndex));
  }

  // TextInput for naming
  if (phase === 'naming') {
    children.push(
      e(Box, { key: 'naming', marginTop: 1 },
        e(Text, null, 'Preset name: '),
        e(TextInput, { placeholder: 'Enter name', onSubmit: handleNameSubmit, isDisabled: !isActive }),
      )
    );
  }

  // ConfirmDialog for overwrite
  if (phase === 'confirm') {
    const slotName = presets[cursorIndex]?.name || '';
    children.push(
      e(Box, { key: 'confirm', marginTop: 1 },
        e(ConfirmDialog, {
          message: `Overwrite slot ${cursorIndex + 1} (${slotName})?`,
          onConfirm: handleConfirm,
          onCancel: handleCancelConfirm,
          isActive,
        })
      )
    );
  }

  // TextInput for rename after overwrite confirm
  if (phase === 'renaming') {
    const existingName = presets[cursorIndex]?.name || '';
    children.push(
      e(Box, { key: 'renaming', marginTop: 1 },
        e(Text, null, 'Preset name: '),
        e(TextInput, { defaultValue: existingName, placeholder: 'Enter name', onSubmit: handleRenameSubmit, isDisabled: !isActive }),
      )
    );
  }

  return e(ScreenLayout, {
    breadcrumb: ['Home', `Edit Line ${editingLine + 1}`, 'Save Preset'],
    config,
    previewOverride,
    shortcuts: SHORTCUTS,
  }, ...children);
}
