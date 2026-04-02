// ScreenLayout.js — Vertical layout wrapper for all screens (v2: ThreeLinePreview replaces title)

import React from 'react';
import { Box, Text } from 'ink';
import { Breadcrumb } from './Breadcrumb.js';
import { ShortcutBar } from './ShortcutBar.js';
import { ThreeLinePreview } from './ThreeLinePreview.js';

const e = React.createElement;

export function ScreenLayout({ breadcrumb, config, previewOverride, shortcuts, hidePreview, children }) {
  const effectiveConfig = previewOverride || config;
  return e(Box, { flexDirection: 'column' },
    breadcrumb ? e(Breadcrumb, { path: breadcrumb }) : null,
    breadcrumb ? e(Text, null, ' ') : null,
    hidePreview ? null : e(ThreeLinePreview, { config: effectiveConfig }),
    hidePreview ? null : e(Text, null, ' '),
    children,
    e(Text, null, ' '),
    e(ShortcutBar, { actions: shortcuts }),
  );
}
