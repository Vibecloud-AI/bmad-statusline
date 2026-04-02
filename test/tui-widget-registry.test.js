import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getIndividualWidgets,
  createDefaultConfig,
  CCSTATUSLINE_COLORS,
} from '../src/tui/widget-registry.js';

describe('widget-registry', () => {
  it('getIndividualWidgets returns all 9 individual widgets', () => {
    const widgets = getIndividualWidgets();
    assert.equal(widgets.length, 9);
    for (const w of widgets) {
      assert.ok(w.id.startsWith('bmad-'), `widget id ${w.id} should start with bmad-`);
      assert.ok(w.command, `widget ${w.id} should have a command`);
      assert.ok(w.name, `widget ${w.id} should have a name`);
      assert.equal(typeof w.defaultEnabled, 'boolean');
    }
  });

  it('getIndividualWidgets returns copies (not references)', () => {
    const a = getIndividualWidgets();
    const b = getIndividualWidgets();
    a[0].name = 'MUTATED';
    assert.notEqual(b[0].name, 'MUTATED');
  });

  it('CCSTATUSLINE_COLORS export exists and contains expected colors', () => {
    assert.ok(Array.isArray(CCSTATUSLINE_COLORS));
    assert.ok(CCSTATUSLINE_COLORS.length >= 16);
    assert.ok(CCSTATUSLINE_COLORS.includes('white'));
    assert.ok(CCSTATUSLINE_COLORS.includes('red'));
    assert.ok(CCSTATUSLINE_COLORS.includes('cyan'));
    assert.ok(CCSTATUSLINE_COLORS.includes('brightRed'));
    assert.ok(CCSTATUSLINE_COLORS.includes('brightWhite'));
    assert.ok(CCSTATUSLINE_COLORS.includes('gray'));
  });

  it('each widget has defaultColor and defaultMode fields', () => {
    const widgets = getIndividualWidgets();
    for (const w of widgets) {
      assert.ok('defaultColor' in w, `widget ${w.id} should have defaultColor`);
      assert.ok('defaultMode' in w, `widget ${w.id} should have defaultMode`);
      assert.ok(w.defaultMode === 'fixed' || w.defaultMode === 'dynamic',
        `widget ${w.id} defaultMode should be fixed or dynamic`);
    }
  });

  it('widget defaultColor values match specification', () => {
    const widgets = getIndividualWidgets();
    const expected = {
      'bmad-project': 'yellow',
      'bmad-workflow': null,
      'bmad-step': 'yellow',
      'bmad-nextstep': 'yellow',
      'bmad-progress': 'green',
      'bmad-progressbar': 'green',
      'bmad-progressstep': 'brightCyan',
      'bmad-story': 'magenta',
      'bmad-timer': 'brightBlack',
    };
    for (const w of widgets) {
      assert.equal(w.defaultColor, expected[w.id], `${w.id} defaultColor`);
    }
  });

  it('widget defaultMode values match specification', () => {
    const widgets = getIndividualWidgets();
    for (const w of widgets) {
      if (w.id === 'bmad-workflow') {
        assert.equal(w.defaultMode, 'dynamic', 'workflow is dynamic');
      } else {
        assert.equal(w.defaultMode, 'fixed', `${w.id} is fixed`);
      }
    }
  });

  it('only bmad-workflow has dynamic defaultMode', () => {
    const widgets = getIndividualWidgets();
    const dynamicWidgets = widgets.filter(w => w.defaultMode === 'dynamic');
    assert.equal(dynamicWidgets.length, 1);
    assert.equal(dynamicWidgets[0].id, 'bmad-workflow');
  });
});

describe('createDefaultConfig', () => {
  it('returns valid default config shape', () => {
    const config = createDefaultConfig();
    assert.equal(config.separator, 'modere');
    assert.equal(config.customSeparator, null);
    assert.ok(Array.isArray(config.lines));
    assert.equal(config.lines.length, 3);
    assert.ok(Array.isArray(config.presets));
    assert.equal(config.presets.length, 3);
    assert.deepStrictEqual(config.presets, [null, null, null]);
  });

  it('line 0 contains default-enabled widgets in correct order', () => {
    const config = createDefaultConfig();
    const expectedWidgets = ['bmad-project', 'bmad-workflow', 'bmad-progressstep', 'bmad-story', 'bmad-timer'];
    assert.deepStrictEqual(config.lines[0].widgets, expectedWidgets);
  });

  it('line 0 colorModes match widget defaults', () => {
    const config = createDefaultConfig();
    const cm = config.lines[0].colorModes;
    assert.deepStrictEqual(cm['bmad-project'], { mode: 'fixed', fixedColor: 'yellow' });
    assert.deepStrictEqual(cm['bmad-workflow'], { mode: 'dynamic' });
    assert.deepStrictEqual(cm['bmad-progressstep'], { mode: 'fixed', fixedColor: 'brightCyan' });
    assert.deepStrictEqual(cm['bmad-story'], { mode: 'fixed', fixedColor: 'magenta' });
    assert.deepStrictEqual(cm['bmad-timer'], { mode: 'fixed', fixedColor: 'brightBlack' });
  });

  it('lines 1 and 2 have no visible widgets but have widgetOrder', () => {
    const config = createDefaultConfig();
    assert.deepStrictEqual(config.lines[1].widgets, []);
    assert.deepStrictEqual(config.lines[2].widgets, []);
    assert.equal(config.lines[1].widgetOrder.length, 9);
    assert.equal(config.lines[2].widgetOrder.length, 9);
  });

  it('returns a new object on each call (not shared reference)', () => {
    const a = createDefaultConfig();
    const b = createDefaultConfig();
    a.separator = 'changed';
    assert.equal(b.separator, 'modere');
  });
});
