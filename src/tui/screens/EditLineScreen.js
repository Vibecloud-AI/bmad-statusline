// EditLineScreen.js — Per-line widget list with h/g/←→/s/l shortcuts (widgetOrder, inline grab, color cycle)

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ScreenLayout } from '../components/ScreenLayout.js';
import { getIndividualWidgets } from '../widget-registry.js';
import { toInkColor } from '../preview-utils.js';

const e = React.createElement;

const ANSI_COLORS = [
  'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
  'brightRed', 'brightGreen', 'brightYellow', 'brightBlue',
  'brightMagenta', 'brightCyan', 'brightWhite', 'brightBlack',
];

const NAVIGATE_SHORTCUTS = [
  { key: '\u2191\u2193', label: 'Navigate' },
  { key: 'h', label: 'Hide/Show' },
  { key: 'g', label: 'Grab' },
  { key: '\u2190\u2192', label: 'Color' },
  { key: 's', label: 'Save preset' },
  { key: 'l', label: 'Load preset' },
  { key: 'Esc', label: 'Back' },
];

const GRAB_SHORTCUTS = [
  { key: '\u2191\u2193', label: 'Move' },
  { key: 'g', label: 'Drop' },
  { key: 'Esc', label: 'Cancel' },
];

const STEP_WIDGETS = new Set(['bmad-step', 'bmad-nextstep', 'bmad-progress', 'bmad-progressbar', 'bmad-progressstep']);

function getColorOptions(widgetId) {
  if (widgetId === 'bmad-workflow') return ['dynamic', ...ANSI_COLORS];
  return ANSI_COLORS;
}

function getCurrentColorValue(colorModes, widget) {
  const mode = colorModes[widget.id];
  if (mode?.mode === 'dynamic') return 'dynamic';
  return mode?.fixedColor || widget.defaultColor || 'white';
}

export function EditLineScreen({ config, updateConfig, previewOverride, setPreviewOverride, navigate, goBack, editingLine, isActive }) {
  const [cursorIndex, setCursorIndex] = useState(0);
  const [grabMode, setGrabMode] = useState(false);
  const [grabOrder, setGrabOrder] = useState(null);

  const allWidgets = getIndividualWidgets();
  const line = config.lines[editingLine];
  const widgetOrder = grabOrder || line.widgetOrder;
  const widgetList = widgetOrder.map(id => allWidgets.find(w => w.id === id)).filter(Boolean);

  function getColorName(widget) {
    const colorMode = line.colorModes[widget.id];
    if (colorMode?.mode === 'dynamic') return 'dynamic';
    return colorMode?.fixedColor || widget.defaultColor || 'white';
  }

  function deriveVisibleWidgets(order) {
    return order.filter(id => line.widgets.includes(id));
  }

  useInput((input, key) => {
    if (!isActive) return;

    // --- Grab mode ---
    if (grabMode) {
      if (key.upArrow && cursorIndex > 0) {
        const newOrder = [...grabOrder];
        [newOrder[cursorIndex - 1], newOrder[cursorIndex]] = [newOrder[cursorIndex], newOrder[cursorIndex - 1]];
        setGrabOrder(newOrder);
        setCursorIndex(cursorIndex - 1);
        const preview = structuredClone(config);
        preview.lines[editingLine].widgetOrder = newOrder;
        preview.lines[editingLine].widgets = deriveVisibleWidgets(newOrder);
        setPreviewOverride(preview);
      } else if (key.downArrow && cursorIndex < widgetList.length - 1) {
        const newOrder = [...grabOrder];
        [newOrder[cursorIndex], newOrder[cursorIndex + 1]] = [newOrder[cursorIndex + 1], newOrder[cursorIndex]];
        setGrabOrder(newOrder);
        setCursorIndex(cursorIndex + 1);
        const preview = structuredClone(config);
        preview.lines[editingLine].widgetOrder = newOrder;
        preview.lines[editingLine].widgets = deriveVisibleWidgets(newOrder);
        setPreviewOverride(preview);
      } else if (key.return || input === 'g') {
        const finalOrder = grabOrder;
        const finalWidgets = deriveVisibleWidgets(finalOrder);
        updateConfig(cfg => {
          cfg.lines[editingLine].widgetOrder = finalOrder;
          cfg.lines[editingLine].widgets = finalWidgets;
        });
        setPreviewOverride(null);
        setGrabMode(false);
        setGrabOrder(null);
      } else if (key.escape) {
        setPreviewOverride(null);
        setGrabMode(false);
        setGrabOrder(null);
      }
      return;
    }

    // --- Normal mode ---
    if (key.upArrow) {
      setCursorIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setCursorIndex(prev => Math.min(widgetList.length - 1, prev + 1));
    } else if (key.escape) {
      goBack();
    } else if (input === 'h') {
      const widget = widgetList[cursorIndex];
      if (!widget) return;
      updateConfig(cfg => {
        const ln = cfg.lines[editingLine];
        const idx = ln.widgets.indexOf(widget.id);
        if (idx >= 0) {
          ln.widgets.splice(idx, 1);
        } else {
          // Insert at position respecting widgetOrder
          const order = ln.widgetOrder;
          const orderIdx = order.indexOf(widget.id);
          let insertAt = 0;
          for (let i = 0; i < orderIdx; i++) {
            const wIdx = ln.widgets.indexOf(order[i]);
            if (wIdx >= 0) insertAt = wIdx + 1;
          }
          ln.widgets.splice(insertAt, 0, widget.id);
          if (!ln.colorModes[widget.id]) {
            ln.colorModes[widget.id] = widget.defaultMode === 'dynamic'
              ? { mode: 'dynamic' }
              : { mode: 'fixed', fixedColor: widget.defaultColor };
          }
        }
      });
    } else if (input === 'g') {
      setGrabOrder([...line.widgetOrder]);
      setGrabMode(true);
    } else if (key.leftArrow || key.rightArrow) {
      const widget = widgetList[cursorIndex];
      if (!widget || !line.widgets.includes(widget.id)) return;
      const options = getColorOptions(widget.id);
      const current = getCurrentColorValue(line.colorModes, widget);
      const idx = options.indexOf(current);
      const nextIdx = key.rightArrow
        ? (idx + 1) % options.length
        : (idx - 1 + options.length) % options.length;
      const nextColor = options[nextIdx];
      updateConfig(cfg => {
        cfg.lines[editingLine].colorModes[widget.id] = nextColor === 'dynamic'
          ? { mode: 'dynamic' }
          : { mode: 'fixed', fixedColor: nextColor };
      });
    } else if (input === 's') {
      navigate('presetSave');
    } else if (input === 'l') {
      navigate('presetLoad');
    }
  }, { isActive });

  return e(ScreenLayout, {
    breadcrumb: ['Home', `Edit Line ${editingLine + 1}`],
    config,
    previewOverride,
    shortcuts: grabMode ? GRAB_SHORTCUTS : NAVIGATE_SHORTCUTS,
  },
    e(Box, { flexDirection: 'column' },
      ...widgetList.map((widget, i) => {
        const isVisible = line.widgets.includes(widget.id);
        const colorName = getColorName(widget);
        const prefix = i === cursorIndex ? '> ' : '  ';
        const statusIcon = isVisible ? '\u25A0' : '\u25A1';
        const statusLabel = isVisible ? 'visible' : 'hidden';
        const statusColor = isVisible ? colorName : 'brightBlack';
        const isGrabbed = grabMode && i === cursorIndex;

        return e(Text, { key: widget.id, bold: isGrabbed },
          prefix,
          e(Text, null, widget.name.padEnd(16)),
          e(Text, { color: toInkColor(statusColor) }, `${statusIcon} ${statusLabel}`),
          isVisible ? e(Text, { dimColor: true }, `  ${colorName}`) : null,
          isGrabbed ? e(Text, { dimColor: true }, '  \u2195') : null,
        );
      }),
      e(Text, null, ' '),
      e(Text, { dimColor: true }, '\u26A0 Step, Next Step, Progress, Progress Bar, Progress+Step only work with multi-step workflows'),
    ),
  );
}
