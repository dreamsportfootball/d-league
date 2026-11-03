import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Test the actual TypeScript utility without importing a browser or a DOM shim.
const source = await readFile(new URL('../../utils/modalScrollLock.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { acquireModalScrollLock } = await import(
  'data:text/javascript;base64,' + Buffer.from(javascript).toString('base64')
);

const makeDom = ({ clientWidth = 1284, innerWidth = 1300, scrollY = 500 } = {}) => {
  const body = { style: { overflow: 'auto', position: '', top: '', width: '' } };
  const html = { clientWidth, style: { overflow: '', scrollbarGutter: '' } };
  const scrollEvents = [];
  globalThis.document = { body, documentElement: html };
  globalThis.window = {
    innerWidth,
    scrollY,
    scrollTo: ({ top }) => {
      scrollEvents.push(top);
      globalThis.window.scrollY = top;
    },
  };
  return { body, html, scrollEvents };
};

test('classic scrollbar gutter persists while two overlays overlap', () => {
  const { body, html } = makeDom();
  const first = acquireModalScrollLock();
  const second = acquireModalScrollLock();
  assert.equal(html.style.scrollbarGutter, 'stable');
  assert.equal(body.style.overflow, 'hidden');
  first();
  assert.equal(body.style.overflow, 'hidden');
  second();
  assert.equal(body.style.overflow, 'auto');
  assert.equal(html.style.overflow, '');
  assert.equal(html.style.scrollbarGutter, '');
  first(); // double release cannot unlock another overlay
  assert.equal(body.style.overflow, 'auto');
});

test('overlay-scrollbar devices do not gain a phantom gutter', () => {
  const { html } = makeDom({ clientWidth: 390, innerWidth: 390 });
  const release = acquireModalScrollLock();
  assert.equal(html.style.scrollbarGutter, '');
  release();
  assert.equal(html.style.scrollbarGutter, '');
});

test('native album fixed-body lock restores scroll and survives nested drawer', () => {
  const { body, html, scrollEvents } = makeDom({ scrollY: 820 });
  const album = acquireModalScrollLock('fixed');
  assert.equal(body.style.position, 'fixed');
  assert.equal(body.style.top, '-820px');
  const drawer = acquireModalScrollLock();
  album();
  assert.equal(body.style.position, '');
  assert.equal(body.style.overflow, 'hidden');
  assert.equal(html.style.overflow, 'hidden');
  assert.deepEqual(scrollEvents, [820]);
  drawer();
  assert.equal(body.style.overflow, 'auto');
  assert.equal(html.style.overflow, '');
  assert.equal(html.style.scrollbarGutter, '');
});

test('fixed-body release last restores original layout and scroll', () => {
  const { body, scrollEvents } = makeDom({ scrollY: 210 });
  const filter = acquireModalScrollLock();
  const album = acquireModalScrollLock('fixed');
  filter();
  assert.equal(body.style.position, 'fixed');
  album();
  assert.equal(body.style.position, '');
  assert.equal(body.style.width, '');
  assert.equal(body.style.overflow, 'auto');
  assert.deepEqual(scrollEvents, [210]);
});
