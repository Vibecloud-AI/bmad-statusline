// tui-widget-order.test.js — Tests for ReorderList component
// (WidgetOrderScreen tests removed — deleted in story 6.1)

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import { ReorderList } from '../src/tui/components/ReorderList.js';

const e = React.createElement;

const delay = (ms) => new Promise(r => setTimeout(r, ms));

const MOCK_ITEMS = [
  { id: 'bmad-project', label: 'project' },
  { id: 'bmad-workflow', label: 'workflow' },
  { id: 'bmad-progressstep', label: 'progressstep' },
  { id: 'bmad-story', label: 'story' },
  { id: 'bmad-timer', label: 'timer' },
];

describe('ReorderList', () => {
  test('(a) renders visible widgets in numbered list', () => {
    const { lastFrame } = render(e(ReorderList, {
      items: MOCK_ITEMS,
      isActive: true,
      onMove: () => {},
      onDrop: () => {},
      onCancel: () => {},
      onBack: () => {},
    }));
    const frame = lastFrame();
    assert.ok(frame.includes('1. project'), 'first widget numbered');
    assert.ok(frame.includes('2. workflow'), 'second widget numbered');
    assert.ok(frame.includes('3. progressstep'), 'third widget numbered');
    assert.ok(frame.includes('4. story'), 'fourth widget numbered');
    assert.ok(frame.includes('5. timer'), 'fifth widget numbered');
    // Cursor on first item
    assert.ok(frame.includes('> 1. project'), 'cursor on first item');
  });

  test('(b) Enter grabs widget and switches to moving state', async () => {
    let modeChanged = null;
    const { lastFrame, stdin } = render(e(ReorderList, {
      items: MOCK_ITEMS,
      isActive: true,
      onMove: () => {},
      onDrop: () => {},
      onCancel: () => {},
      onBack: () => {},
      onModeChange: (m) => { modeChanged = m; },
    }));
    await delay(50);
    stdin.write('\r'); // Enter to grab
    await delay(50);
    const frame = lastFrame();
    assert.equal(modeChanged, 'moving', 'mode changed to moving');
    assert.ok(frame.includes('\u2190 moving'), 'moving marker visible');
  });

  test('(c) up/down moves widget and fires onMove', async () => {
    let movedOrder = null;
    const { lastFrame, stdin } = render(e(ReorderList, {
      items: MOCK_ITEMS,
      isActive: true,
      onMove: (order) => { movedOrder = order; },
      onDrop: () => {},
      onCancel: () => {},
      onBack: () => {},
    }));
    await delay(50);
    // Move cursor to second item
    stdin.write('\x1B[B'); // down arrow
    await delay(50);
    // Grab it
    stdin.write('\r');
    await delay(50);
    // Move it up (swap with first)
    stdin.write('\x1B[A'); // up arrow
    await delay(50);
    assert.ok(movedOrder, 'onMove called');
    assert.equal(movedOrder[0], 'bmad-workflow', 'workflow moved to first position');
    assert.equal(movedOrder[1], 'bmad-project', 'project moved to second position');
    const frame = lastFrame();
    assert.ok(frame.includes('1. workflow'), 'workflow now at position 1');
  });

  test('(d) Enter drops and fires onDrop with final order', async () => {
    let droppedOrder = null;
    let modeAfterDrop = null;
    const { stdin } = render(e(ReorderList, {
      items: MOCK_ITEMS,
      isActive: true,
      onMove: () => {},
      onDrop: (order) => { droppedOrder = order; },
      onCancel: () => {},
      onBack: () => {},
      onModeChange: (m) => { modeAfterDrop = m; },
    }));
    await delay(50);
    // Move cursor to second item, grab, move up, drop
    stdin.write('\x1B[B');
    await delay(50);
    stdin.write('\r'); // grab
    await delay(50);
    stdin.write('\x1B[A'); // move up
    await delay(50);
    stdin.write('\r'); // drop
    await delay(50);
    assert.ok(droppedOrder, 'onDrop called');
    assert.equal(droppedOrder[0], 'bmad-workflow', 'workflow at first position after drop');
    assert.equal(modeAfterDrop, 'navigate', 'mode back to navigate after drop');
  });

  test('(e) Escape cancels and reverts position', async () => {
    let cancelCalled = false;
    const { lastFrame, stdin } = render(e(ReorderList, {
      items: MOCK_ITEMS,
      isActive: true,
      onMove: () => {},
      onDrop: () => {},
      onCancel: () => { cancelCalled = true; },
      onBack: () => {},
    }));
    await delay(50);
    // Move cursor to second item, grab, move up, cancel
    stdin.write('\x1B[B');
    await delay(50);
    stdin.write('\r'); // grab
    await delay(50);
    stdin.write('\x1B[A'); // move up
    await delay(50);
    stdin.write('\x1B'); // escape to cancel
    await delay(50);
    assert.ok(cancelCalled, 'onCancel called');
    const frame = lastFrame();
    // Items should be reverted to original order
    assert.ok(frame.includes('1. project'), 'project back at position 1');
    assert.ok(frame.includes('2. workflow'), 'workflow back at position 2');
  });

  test('Escape in navigate state calls onBack', async () => {
    let backCalled = false;
    const { stdin } = render(e(ReorderList, {
      items: MOCK_ITEMS,
      isActive: true,
      onMove: () => {},
      onDrop: () => {},
      onCancel: () => {},
      onBack: () => { backCalled = true; },
    }));
    await delay(50);
    stdin.write('\x1B');
    await delay(50);
    assert.ok(backCalled, 'onBack called on Escape in navigate mode');
  });

  test('boundary: up at top does nothing', async () => {
    let moveCalled = false;
    const { stdin } = render(e(ReorderList, {
      items: MOCK_ITEMS,
      isActive: true,
      onMove: () => { moveCalled = true; },
      onDrop: () => {},
      onCancel: () => {},
      onBack: () => {},
    }));
    await delay(50);
    stdin.write('\r'); // grab at position 0
    await delay(50);
    stdin.write('\x1B[A'); // up at top
    await delay(50);
    assert.ok(!moveCalled, 'onMove not called at boundary');
  });

  test('boundary: down at bottom does nothing', async () => {
    let moveCalled = false;
    const { stdin } = render(e(ReorderList, {
      items: MOCK_ITEMS,
      isActive: true,
      onMove: () => { moveCalled = true; },
      onDrop: () => {},
      onCancel: () => {},
      onBack: () => {},
    }));
    await delay(50);
    // Navigate to last item
    for (let i = 0; i < 4; i++) {
      stdin.write('\x1B[B');
      await delay(20);
    }
    stdin.write('\r'); // grab at last position
    await delay(50);
    stdin.write('\x1B[B'); // down at bottom
    await delay(50);
    assert.ok(!moveCalled, 'onMove not called at bottom boundary');
  });
});
