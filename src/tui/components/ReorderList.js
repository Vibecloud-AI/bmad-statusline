// ReorderList.js — Dual-mode reorder list: navigate (cursor) and moving (grab/swap/drop)

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

const e = React.createElement;

export function ReorderList({ items, isActive, onMove, onDrop, onCancel, onBack, onModeChange, initialMode = 'navigate', initialIndex = 0 }) {
  const [mode, setMode] = useState(initialMode);
  const [cursorIndex, setCursorIndex] = useState(initialIndex);
  const [localItems, setLocalItems] = useState(items);
  const [grabSnapshot, setGrabSnapshot] = useState(() => initialMode === 'moving' ? [...items] : null);

  const changeMode = (newMode) => {
    setMode(newMode);
    if (onModeChange) onModeChange(newMode);
  };

  useInput((input, key) => {
    if (mode === 'navigate') {
      if (key.upArrow) {
        setCursorIndex(prev => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setCursorIndex(prev => Math.min(localItems.length - 1, prev + 1));
      } else if (key.return) {
        // Grab
        setGrabSnapshot([...localItems]);
        changeMode('moving');
      } else if (key.escape) {
        onBack();
      }
    } else if (mode === 'moving') {
      if (key.upArrow && cursorIndex > 0) {
        const newItems = [...localItems];
        const temp = newItems[cursorIndex - 1];
        newItems[cursorIndex - 1] = newItems[cursorIndex];
        newItems[cursorIndex] = temp;
        setLocalItems(newItems);
        setCursorIndex(cursorIndex - 1);
        onMove(newItems.map(it => it.id));
      } else if (key.downArrow && cursorIndex < localItems.length - 1) {
        const newItems = [...localItems];
        const temp = newItems[cursorIndex + 1];
        newItems[cursorIndex + 1] = newItems[cursorIndex];
        newItems[cursorIndex] = temp;
        setLocalItems(newItems);
        setCursorIndex(cursorIndex + 1);
        onMove(newItems.map(it => it.id));
      } else if (key.return) {
        // Drop
        changeMode('navigate');
        onDrop(localItems.map(it => it.id));
        setGrabSnapshot(null);
      } else if (key.escape) {
        // Cancel — revert to snapshot
        setLocalItems(grabSnapshot);
        changeMode('navigate');
        onCancel();
        setGrabSnapshot(null);
      }
    }
  }, { isActive });

  return e(Box, { flexDirection: 'column' },
    ...localItems.map((item, i) => {
      const isCursor = i === cursorIndex;
      const prefix = isCursor ? '> ' : '  ';
      const suffix = (mode === 'moving' && isCursor) ? '  \u2190 moving' : '';
      const num = `${i + 1}. `;
      return e(Text, {
        key: item.id,
        bold: mode === 'moving' && isCursor,
      }, `${prefix}${num}${item.label}${suffix}`);
    }),
  );
}

