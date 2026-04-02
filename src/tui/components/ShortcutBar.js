// ShortcutBar.js — Dim text shortcut bar with bold keys

import React from 'react';
import { Text } from 'ink';

const e = React.createElement;

export function ShortcutBar({ actions }) {
  const parts = [];
  for (let i = 0; i < actions.length; i++) {
    if (i > 0) parts.push(e(Text, { key: `sp-${i}`, dimColor: true }, '  '));
    parts.push(e(Text, { key: `k-${i}`, bold: true }, actions[i].key));
    parts.push(e(Text, { key: `l-${i}`, dimColor: true }, ` ${actions[i].label}`));
  }
  return e(Text, null, ...parts);
}
