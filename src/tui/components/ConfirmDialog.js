// ConfirmDialog.js — Reusable confirmation overlay with Enter/Esc handling

import React from 'react';
import { Text, Box, useInput } from 'ink';

const e = React.createElement;

export function ConfirmDialog({ message, onConfirm, onCancel, isActive }) {
  useInput((input, key) => {
    if (key.return) onConfirm();
    if (key.escape) onCancel();
  }, { isActive });

  return e(Box, { flexDirection: 'column' },
    e(Text, null, `${message}  Enter / Esc`),
  );
}
