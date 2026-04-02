// tui-select-preview.test.js — Tests for SelectWithPreview component
// AC #11(c): highlight indicator, onHighlight callback, onChange callback

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import { SelectWithPreview } from '../src/tui/components/SelectWithPreview.js';

const e = React.createElement;

const OPTIONS = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
  { label: 'Option C', value: 'c' },
];

const delay = (ms) => new Promise(r => setTimeout(r, ms));

describe('SelectWithPreview', () => {
  test('renders options with > on default highlighted item (first)', () => {
    const { lastFrame } = render(e(SelectWithPreview, {
      options: OPTIONS,
      onChange: () => {},
      isActive: true,
    }));
    const frame = lastFrame();
    assert.ok(frame.includes('> Option A'), 'first option should have > indicator');
    assert.ok(frame.includes('  Option B'), 'second option should not have > indicator');
    assert.ok(frame.includes('  Option C'), 'third option should not have > indicator');
  });

  test('renders with defaultValue highlighted', () => {
    const { lastFrame } = render(e(SelectWithPreview, {
      options: OPTIONS,
      defaultValue: 'b',
      onChange: () => {},
      isActive: true,
    }));
    const frame = lastFrame();
    assert.ok(frame.includes('  Option A'));
    assert.ok(frame.includes('> Option B'));
  });

  test('arrow down moves highlight indicator', async () => {
    const { lastFrame, stdin } = render(e(SelectWithPreview, {
      options: OPTIONS,
      onChange: () => {},
      isActive: true,
    }));
    await delay(50);
    stdin.write('\x1B[B'); // down arrow
    await delay(50);
    const frame = lastFrame();
    assert.ok(frame.includes('  Option A'));
    assert.ok(frame.includes('> Option B'));
  });

  test('calls onHighlight with option value on arrow key', async () => {
    const highlights = [];
    const { stdin } = render(e(SelectWithPreview, {
      options: OPTIONS,
      onHighlight: (val) => highlights.push(val),
      onChange: () => {},
      isActive: true,
    }));
    await delay(50);
    stdin.write('\x1B[B'); // down arrow
    await delay(50);
    assert.deepStrictEqual(highlights, ['b']);
  });

  test('calls onChange with option value on Enter', async () => {
    let selected = null;
    const { stdin } = render(e(SelectWithPreview, {
      options: OPTIONS,
      onChange: (val) => { selected = val; },
      isActive: true,
    }));
    await delay(50);
    stdin.write('\r'); // Enter
    await delay(50);
    assert.strictEqual(selected, 'a');
  });

  test('does not move past first option on up arrow', async () => {
    const highlights = [];
    const { lastFrame, stdin } = render(e(SelectWithPreview, {
      options: OPTIONS,
      onHighlight: (val) => highlights.push(val),
      onChange: () => {},
      isActive: true,
    }));
    await delay(50);
    stdin.write('\x1B[A'); // up arrow
    await delay(50);
    const frame = lastFrame();
    assert.ok(frame.includes('> Option A'));
    assert.strictEqual(highlights.length, 0);
  });

  test('does not move past last option on down arrow', async () => {
    const { lastFrame, stdin } = render(e(SelectWithPreview, {
      options: OPTIONS,
      defaultValue: 'c',
      onChange: () => {},
      isActive: true,
    }));
    await delay(50);
    stdin.write('\x1B[B'); // down arrow
    await delay(50);
    const frame = lastFrame();
    assert.ok(frame.includes('> Option C'));
  });

  test('ignores input when isActive is false', async () => {
    let selected = null;
    const { stdin } = render(e(SelectWithPreview, {
      options: OPTIONS,
      onChange: (val) => { selected = val; },
      isActive: false,
    }));
    await delay(50);
    stdin.write('\r');
    await delay(50);
    assert.strictEqual(selected, null);
  });
});
