// Breadcrumb.js — Dim grey breadcrumb path display

import React from 'react';
import { Text } from 'ink';

const e = React.createElement;

export function Breadcrumb({ path }) {
  return e(Text, { dimColor: true }, path.join(' > '));
}
