import test from 'node:test';
import assert from 'node:assert/strict';
import { setupBrandAnimation } from '../dist/brand-animation.js';

function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
    dispatch(type, event = {}) {
      for (const listener of listeners.get(type) || []) listener(event);
    },
  };
}

function element() {
  const classes = new Set();
  return {
    ...eventTarget(),
    attributes: new Map(),
    children: [],
    starts: 0,
    classList: { add: name => classes.add(name), contains: name => classes.has(name) },
    setAttribute(name, value) {
      this.attributes.set(name, value);
      if (name === 'data-playing') this.starts++;
    },
    removeAttribute(name) { this.attributes.delete(name); },
    hasAttribute(name) { return this.attributes.has(name); },
    append(...children) { this.children.push(...children); },
    attachShadow() { return this.shadowRoot = element(); },
    getBoundingClientRect() { return {}; },
  };
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function fixture({ hidden = false, reduced = false, load = async () => element() } = {}) {
  let now = 0, nextTimer = 0;
  const timers = new Map();
  const preference = { ...eventTarget(), matches: reduced };
  const view = {
    matchMedia: () => preference,
    setTimeout(callback, delay) {
      const id = ++nextTimer;
      timers.set(id, { at: now + delay, callback });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame(callback) { queueMicrotask(callback); },
  };
  const doc = {
    ...eventTarget(), hidden, defaultView: view,
    createElement: () => element(), importNode: () => element(),
  };
  const icon = element(), button = element();
  button.ownerDocument = doc;
  button.querySelector = selector => selector === '.brand-mark' ? icon : null;
  button.focusVisible = false;
  button.matches = selector => selector === ':focus-visible' && button.focusVisible;
  const controller = setupBrandAnimation(button, { load });
  return {
    icon, button, doc, preference, ready: controller.ready,
    get layer() { return icon.children.find(child => child.className === 'brand-motion'); },
    get pendingTimers() { return timers.size; },
    advance(milliseconds) {
      now += milliseconds;
      for (const [id, timer] of [...timers]) {
        if (timer.at <= now) { timers.delete(id); timer.callback(); }
      }
    },
    visibility(hidden) { doc.hidden = hidden; doc.dispatch('visibilitychange'); },
    reduceMotion(matches) { preference.matches = matches; preference.dispatch('change'); },
  };
}

test('the prepared logo plays once on arrival and settles after four seconds', async () => {
  const source = deferred(), f = fixture({ load: () => source.promise });
  assert.equal(f.icon.classList.contains('is-ready'), false, 'keep the static icon while loading');
  assert.equal(f.layer, undefined);
  f.button.dispatch('pointerenter', { pointerType: 'mouse' });
  f.button.dispatch('click');
  source.resolve(element());
  await f.ready;
  assert.equal(f.icon.classList.contains('is-ready'), true);
  assert.equal(f.layer.starts, 1, 'early interactions must not queue additional initial plays');
  assert.equal(f.layer.hasAttribute('data-playing'), true);
  f.advance(3999);
  assert.equal(f.layer.hasAttribute('data-playing'), true);
  f.advance(1);
  assert.equal(f.layer.hasAttribute('data-playing'), false);
  assert.equal(f.pendingTimers, 0);
  f.advance(12000);
  f.visibility(false);
  assert.equal(f.layer.starts, 1, 'the animation must not loop or repeat on a visibility event');
});

test('hover and button activation replay, while overlapping requests do not restart the sequence', async () => {
  const f = fixture();
  await f.ready;
  f.advance(3000);
  f.button.dispatch('pointerenter', { pointerType: 'mouse' });
  f.button.dispatch('click');
  assert.equal(f.layer.starts, 1);
  assert.equal(f.pendingTimers, 1);
  f.advance(1000);
  assert.equal(f.layer.hasAttribute('data-playing'), false, 'overlap must not postpone settling');
  f.button.dispatch('pointerenter', { pointerType: 'touch' });
  assert.equal(f.layer.starts, 1, 'touch hover should wait for deliberate button activation');
  f.button.dispatch('pointerenter', { pointerType: 'mouse' });
  assert.equal(f.layer.starts, 2);
  f.advance(4000);
  f.button.dispatch('click', { pointerType: 'touch' });
  assert.equal(f.layer.starts, 3, 'a mobile tap replays through native button activation');
  f.advance(4000);
  f.button.dispatch('click', { detail: 0 });
  assert.equal(f.layer.starts, 4, 'keyboard button activation also replays');
});

test('only visible keyboard focus starts a focus-triggered replay', async () => {
  const f = fixture();
  await f.ready;
  f.advance(4000);
  f.button.dispatch('focusin');
  assert.equal(f.layer.starts, 1);
  f.button.focusVisible = true;
  f.button.dispatch('focusin');
  assert.equal(f.layer.starts, 2);
});

test('a hidden page waits for its first view, cancels active motion, and does not automatically repeat', async () => {
  const f = fixture({ hidden: true });
  await f.ready;
  f.button.dispatch('click');
  f.button.dispatch('pointerenter', { pointerType: 'mouse' });
  assert.equal(f.layer.starts, 0);
  assert.equal(f.pendingTimers, 0);
  f.visibility(false);
  assert.equal(f.layer.starts, 1);
  f.advance(800);
  f.visibility(true);
  assert.equal(f.layer.hasAttribute('data-playing'), false);
  assert.equal(f.pendingTimers, 0);
  f.visibility(false);
  assert.equal(f.layer.starts, 1, 'returning to the page must not repeat an initial play already started');
  f.button.dispatch('click');
  assert.equal(f.layer.starts, 2, 'explicit replay remains available after returning');
});

test('reduced motion suppresses and cancels playback while allowing a pending first play when disabled', async () => {
  const f = fixture({ reduced: true });
  await f.ready;
  f.button.dispatch('click');
  f.button.dispatch('pointerenter', { pointerType: 'mouse' });
  f.visibility(false);
  assert.equal(f.layer.starts, 0);
  assert.equal(f.pendingTimers, 0);
  f.reduceMotion(false);
  assert.equal(f.layer.starts, 1);
  f.reduceMotion(true);
  assert.equal(f.layer.hasAttribute('data-playing'), false);
  assert.equal(f.pendingTimers, 0);
  f.reduceMotion(false);
  assert.equal(f.layer.starts, 1, 'a preference change must not repeat an initial play already started');
  f.button.dispatch('click');
  assert.equal(f.layer.starts, 2);
});

test('a failed animation load leaves the static fallback and all controls usable', async () => {
  const f = fixture({ load: async () => { throw new Error('Asset unavailable'); } });
  await f.ready;
  assert.equal(f.icon.classList.contains('is-ready'), false);
  assert.equal(f.layer, undefined);
  f.button.dispatch('click');
  f.button.dispatch('pointerenter', { pointerType: 'mouse' });
  f.visibility(true);
  f.visibility(false);
  f.reduceMotion(true);
  f.reduceMotion(false);
  assert.equal(f.pendingTimers, 0);
  assert.equal(f.icon.classList.contains('is-ready'), false);
});
