const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Mock localStorage
const storage = new Map();
global.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

// Event listener helper
function createMockElement(tag, id = '') {
  const listeners = {};
  const classes = new Set();
  const children = [];
  const dataset = {};
  const style = {};

  const el = {
    tagName: tag.toUpperCase(),
    id,
    dataset,
    style,
    get className() { return Array.from(classes).join(' '); },
    set className(val) {
      classes.clear();
      (val || '').split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
    },
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
      toggle: (c) => (classes.has(c) ? (classes.delete(c), false) : (classes.add(c), true))
    },
    children,
    childNodes: children,
    innerHTML: '',
    clientWidth: 800,
    clientHeight: 600,
    offsetWidth: 74,
    offsetHeight: 72,
    getBoundingClientRect() {
      const left = parseFloat(style.left) || 0;
      const top = parseFloat(style.top) || 0;
      return {
        left,
        top,
        right: left + (this.offsetWidth || 74),
        bottom: top + (this.offsetHeight || 72),
        width: this.offsetWidth || 74,
        height: this.offsetHeight || 72
      };
    },
    appendChild(child) {
      children.push(child);
      child.parentNode = el;
      return child;
    },
    removeChild(child) {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
      child.parentNode = null;
      return child;
    },
    querySelectorAll(selector) {
      const results = [];
      function walk(node) {
        if (selector === '.desktop-icon' && node.classList && node.classList.contains('desktop-icon')) {
          results.push(node);
        }
        (node.children || []).forEach(walk);
      }
      walk(el);
      return results;
    },
    querySelector(selector) {
      return el.querySelectorAll(selector)[0] || null;
    },
    addEventListener(event, handler) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    removeEventListener(event, handler) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(h => h !== handler);
    },
    dispatchEvent(event) {
      if (!event.target) event.target = el;
      const handlers = listeners[event.type] || [];
      handlers.forEach(h => h(event));
    }
  };

  return el;
}

const windowListeners = {};
global.window = {
  innerWidth: 800,
  innerHeight: 600,
  addEventListener(event, handler) {
    if (!windowListeners[event]) windowListeners[event] = [];
    windowListeners[event].push(handler);
  },
  removeEventListener(event, handler) {
    if (!windowListeners[event]) return;
    windowListeners[event] = windowListeners[event].filter(h => h !== handler);
  },
  dispatchEvent(event) {
    const handlers = windowListeners[event.type] || [];
    handlers.forEach(h => h(event));
  }
};

const desktopEl = createMockElement('main', 'desktop');
desktopEl.clientWidth = 800;
desktopEl.clientHeight = 572; // minus 28px taskbar

const desktopIconsEl = createMockElement('div', 'desktop-icons');
const selectionBoxEl = createMockElement('div', 'selection-box');
const contextMenuEl = createMockElement('div', 'context-menu');

desktopEl.appendChild(desktopIconsEl);
desktopEl.appendChild(selectionBoxEl);

const mockElements = {
  'desktop': desktopEl,
  'desktop-icons': desktopIconsEl,
  'selection-box': selectionBoxEl,
  'context-menu': contextMenuEl
};

global.document = {
  getElementById: (id) => mockElements[id] || null,
  createElement: (tag) => createMockElement(tag),
  addEventListener: () => {},
  removeEventListener: () => {}
};

// Mock Icons
global.Icons = new Proxy({}, {
  get: () => '<svg></svg>'
});

// Load desktop.js
const desktopCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'desktop.js'), 'utf8');
eval(desktopCode);

console.log('--- Testing Draggable Desktop Icons ---');

// Test 1: Desktop initialization and icon grid layout
const desktop = window.desktop;
assert.ok(desktop.icons.length > 0, 'Icons list should be populated');

const iconEls = desktopIconsEl.querySelectorAll('.desktop-icon');
assert.equal(iconEls.length, desktop.icons.length, 'All icons rendered in DOM');

iconEls.forEach(el => {
  assert.ok(el.style.left && el.style.left.endsWith('px'), `Icon ${el.dataset.id} must have left position in px`);
  assert.ok(el.style.top && el.style.top.endsWith('px'), `Icon ${el.dataset.id} must have top position in px`);
  const left = parseFloat(el.style.left);
  const top = parseFloat(el.style.top);
  assert.ok(!isNaN(left) && left >= 0, `Icon ${el.dataset.id} left position must be valid non-negative number`);
  assert.ok(!isNaN(top) && top >= 0, `Icon ${el.dataset.id} top position must be valid non-negative number`);
});
console.log('PASS 1. Initial desktop icon positioning and grid layout computed properly');

// Test 2: Dragging a single icon updates its position and persists to localStorage
const firstIcon = iconEls[0];
const initialLeft = parseFloat(firstIcon.style.left);
const initialTop = parseFloat(firstIcon.style.top);

// Simulate mouse down on first icon
firstIcon.dispatchEvent({
  type: 'mousedown',
  button: 0,
  clientX: initialLeft + 20,
  clientY: initialTop + 20,
  target: firstIcon,
  ctrlKey: false,
  shiftKey: false
});

assert.ok(firstIcon.classList.contains('selected'), 'Icon should be selected on mousedown');

// Simulate mouse move beyond threshold
window.dispatchEvent({
  type: 'mousemove',
  clientX: initialLeft + 20 + 80,
  clientY: initialTop + 20 + 120
});

assert.equal(parseFloat(firstIcon.style.left), initialLeft + 80, 'Icon left should update by +80px');
assert.equal(parseFloat(firstIcon.style.top), initialTop + 120, 'Icon top should update by +120px');

// Simulate mouseup
window.dispatchEvent({
  type: 'mouseup',
  clientX: initialLeft + 20 + 80,
  clientY: initialTop + 20 + 120
});

// Check localStorage persistence
const savedPositions = JSON.parse(localStorage.getItem('win98_desktop_icon_positions'));
assert.ok(savedPositions, 'Positions must be saved in localStorage');
assert.equal(savedPositions[firstIcon.dataset.id].x, Math.round(initialLeft + 80), 'Saved X matches dropped position');
assert.equal(savedPositions[firstIcon.dataset.id].y, Math.round(initialTop + 120), 'Saved Y matches dropped position');
console.log('PASS 2. Single icon drag updates live coordinates and persists to localStorage');

// Test 3: Clamping within desktop bounds
firstIcon.dispatchEvent({
  type: 'mousedown',
  button: 0,
  clientX: 100,
  clientY: 100,
  target: firstIcon,
  ctrlKey: false,
  shiftKey: false
});

// Drag way off screen (negative and very large)
window.dispatchEvent({
  type: 'mousemove',
  clientX: -1000,
  clientY: -1000
});

assert.ok(parseFloat(firstIcon.style.left) >= 0, 'Left position must not be negative');
assert.ok(parseFloat(firstIcon.style.top) >= 0, 'Top position must not be negative');

window.dispatchEvent({
  type: 'mousemove',
  clientX: 5000,
  clientY: 5000
});

const maxAllowedX = 800 - 74;
const maxAllowedY = 572 - 72;
assert.ok(parseFloat(firstIcon.style.left) <= maxAllowedX, 'Left position must clamp to desktop width');
assert.ok(parseFloat(firstIcon.style.top) <= maxAllowedY, 'Top position must clamp to desktop height');

window.dispatchEvent({ type: 'mouseup' });
console.log('PASS 3. Boundary clamping restricts icons inside desktop bounds');

// Test 4: Multi-selection Dragging
const icon1 = iconEls[1];
const icon2 = iconEls[2];
desktop.clearSelection();
desktop.selectIcon(icon1);
desktop.selectIcon(icon2, true); // multi-select

assert.equal(desktop.selectedIcons.size, 2, 'Both icons selected');

const icon1StartLeft = parseFloat(icon1.style.left);
const icon1StartTop = parseFloat(icon1.style.top);
const icon2StartLeft = parseFloat(icon2.style.left);
const icon2StartTop = parseFloat(icon2.style.top);

// Mousedown on icon1 to drag group
icon1.dispatchEvent({
  type: 'mousedown',
  button: 0,
  clientX: 200,
  clientY: 200,
  target: icon1,
  ctrlKey: false,
  shiftKey: false
});

window.dispatchEvent({
  type: 'mousemove',
  clientX: 250,
  clientY: 240
});

assert.equal(parseFloat(icon1.style.left), icon1StartLeft + 50, 'Icon 1 moves by +50px');
assert.equal(parseFloat(icon1.style.top), icon1StartTop + 40, 'Icon 1 moves by +40px');
assert.equal(parseFloat(icon2.style.left), icon2StartLeft + 50, 'Icon 2 moves by +50px');
assert.equal(parseFloat(icon2.style.top), icon2StartTop + 40, 'Icon 2 moves by +40px');

window.dispatchEvent({ type: 'mouseup' });

const multiSaved = JSON.parse(localStorage.getItem('win98_desktop_icon_positions'));
assert.equal(multiSaved[icon1.dataset.id].x, Math.round(icon1StartLeft + 50));
assert.equal(multiSaved[icon2.dataset.id].x, Math.round(icon2StartLeft + 50));
console.log('PASS 4. Multi-selection dragging moves all selected icons together');

// Test 5: "Line Up Icons" snaps to grid without overlaps
desktop.lineUpIcons();
const linedUpPositions = JSON.parse(localStorage.getItem('win98_desktop_icon_positions'));
const seenSlots = new Set();
Object.values(linedUpPositions).forEach(pos => {
  // Check grid alignment: (x - 10) % 78 == 0, (y - 10) % 76 == 0
  assert.equal((pos.x - 10) % 78, 0, `X coordinate ${pos.x} snapped to 78px grid`);
  assert.equal((pos.y - 10) % 76, 0, `Y coordinate ${pos.y} snapped to 76px grid`);
  const slotKey = `${pos.x},${pos.y}`;
  assert.ok(!seenSlots.has(slotKey), `Grid slot ${slotKey} must not be duplicated`);
  seenSlots.add(slotKey);
});
console.log('PASS 5. Line Up Icons snaps positions to grid without collisions');

// Test 6: "Arrange Icons" resets icons to standard columns
desktop.arrangeIcons();
const arrangedPositions = JSON.parse(localStorage.getItem('win98_desktop_icon_positions'));
assert.equal(arrangedPositions[desktop.icons[0].id].x, 10, 'First icon at column 0 x=10');
assert.equal(arrangedPositions[desktop.icons[0].id].y, 10, 'First icon at row 0 y=10');
assert.equal(arrangedPositions[desktop.icons[1].id].x, 10, 'Second icon at column 0 x=10');
assert.equal(arrangedPositions[desktop.icons[1].id].y, 10 + 76, 'Second icon at row 1 y=86');
console.log('PASS 6. Arrange Icons resets all desktop icons into orderly columns');

// Test 7: Double-click launch is preserved
desktop.justDragged = false;
let launched = false;
desktop.icons[0].action = () => { launched = true; };
const clickTarget = desktopIconsEl.querySelectorAll('.desktop-icon')[0];
clickTarget.dispatchEvent({
  type: 'dblclick',
  stopPropagation: () => {}
});
assert.ok(launched, 'Double click successfully triggered application launch');
console.log('PASS 7. Double click launching functions reliably without drag interference');

// Test 8: Marquee area selection and subsequent multi-drag
desktop.arrangeIcons();
desktop.clearSelection();
assert.equal(desktop.selectedIcons.size, 0, 'Selection cleared before marquee test');

// Start marquee at (0, 0)
desktopEl.dispatchEvent({
  type: 'mousedown',
  button: 0,
  clientX: 0,
  clientY: 0,
  target: desktopIconsEl,
  ctrlKey: false,
  shiftKey: false
});

// Drag across first two icons (col 0 row 0 is (10..84, 10..82), row 1 is (10..84, 86..158))
window.dispatchEvent({
  type: 'mousemove',
  clientX: 85,
  clientY: 160
});

// Icon 0 and Icon 1 should be enclosed in (0, 0) -> (85, 160)
assert.ok(iconEls[0].classList.contains('selected'), 'Icon 0 selected by marquee');
assert.ok(iconEls[1].classList.contains('selected'), 'Icon 1 selected by marquee');
assert.equal(desktop.selectedIcons.size, 2, '2 icons selected in desktop.selectedIcons');

// Release mouseup
window.dispatchEvent({
  type: 'mouseup',
  clientX: 85,
  clientY: 160
});

// Simulate the click event dispatched on desktop after mouseup
desktopEl.dispatchEvent({
  type: 'click',
  clientX: 85,
  clientY: 160,
  target: desktopIconsEl
});

// Verify selection was NOT destroyed by click
assert.ok(iconEls[0].classList.contains('selected'), 'Icon 0 remains selected after mouseup + click');
assert.ok(iconEls[1].classList.contains('selected'), 'Icon 1 remains selected after mouseup + click');
assert.equal(desktop.selectedIcons.size, 2, 'Selection preserved after marquee mouseup');

// Now drag the group by dragging icon 0
const preDrag0X = parseFloat(iconEls[0].style.left);
const preDrag0Y = parseFloat(iconEls[0].style.top);
const preDrag1X = parseFloat(iconEls[1].style.left);
const preDrag1Y = parseFloat(iconEls[1].style.top);

iconEls[0].dispatchEvent({
  type: 'mousedown',
  button: 0,
  clientX: preDrag0X + 20,
  clientY: preDrag0Y + 20,
  target: iconEls[0],
  ctrlKey: false,
  shiftKey: false
});

// Both icons must still be selected
assert.equal(desktop.selectedIcons.size, 2, 'Both icons remain selected upon starting group drag');

window.dispatchEvent({
  type: 'mousemove',
  clientX: preDrag0X + 20 + 100,
  clientY: preDrag0Y + 20 + 50
});

assert.equal(parseFloat(iconEls[0].style.left), preDrag0X + 100, 'Icon 0 moved +100px');
assert.equal(parseFloat(iconEls[0].style.top), preDrag0Y + 50, 'Icon 0 moved +50px');
assert.equal(parseFloat(iconEls[1].style.left), preDrag1X + 100, 'Icon 1 moved +100px');
assert.equal(parseFloat(iconEls[1].style.top), preDrag1Y + 50, 'Icon 1 moved +50px');

window.dispatchEvent({ type: 'mouseup' });

const postMarqueeDragPositions = JSON.parse(localStorage.getItem('win98_desktop_icon_positions'));
assert.equal(postMarqueeDragPositions[iconEls[0].dataset.id].x, Math.round(preDrag0X + 100));
assert.equal(postMarqueeDragPositions[iconEls[1].dataset.id].x, Math.round(preDrag1X + 100));

console.log('PASS 8. Marquee area selection preserves selection and allows moving multiple icons');

desktop.arrangeIcons();
const beforeNarrow = localStorage.getItem('win98_desktop_icon_positions');
assert.ok(new Set(Object.values(JSON.parse(beforeNarrow)).map(p => p.x)).size > 1, 'Arranged layout spans several columns');
desktopEl.clientWidth = 60;
window.innerWidth = 60;
window.dispatchEvent({ type: 'resize' });
desktopIconsEl.querySelectorAll('.desktop-icon').forEach(el => {
  assert.equal(parseFloat(el.style.left), 0, `Icon ${el.dataset.id} is kept inside a narrow desktop`);
});
desktop.renderIcons();
assert.equal(localStorage.getItem('win98_desktop_icon_positions'), beforeNarrow, 'Narrow viewport does not overwrite saved icon positions');
desktopEl.clientWidth = 800;
window.innerWidth = 800;
window.dispatchEvent({ type: 'resize' });
const restoredSaved = JSON.parse(beforeNarrow);
desktopIconsEl.querySelectorAll('.desktop-icon').forEach(el => {
  assert.equal(parseFloat(el.style.left), restoredSaved[el.dataset.id].x, `Icon ${el.dataset.id} returns to its column after the viewport widens`);
});
console.log('PASS 9. Temporary narrow viewport does not collapse the saved icon layout');

const stacked = JSON.parse(beforeNarrow);
desktop.icons.forEach(item => { stacked[item.id] = { x: 0, y: stacked[item.id].y }; });
localStorage.setItem('win98_desktop_icon_positions', JSON.stringify(stacked));
desktop.iconPositions = desktop.loadIconPositions();
desktop.renderIcons();
const unstacked = desktop.icons.map(item => desktop.iconPositions[item.id]);
assert.equal(new Set(unstacked.map(p => `${p.x},${p.y}`)).size, desktop.icons.length, 'Icons stacked on one spot are moved to free cells');
assert.deepEqual(desktop.iconPositions[desktop.icons[0].id], { x: 0, y: 10 }, 'First icon of a stack keeps its spot');
console.log('PASS 10. Icons stacked on the same spot are spread to free grid cells');

console.log('\n========================================');
console.log('ALL DESKTOP ICONS DRAG TESTS PASSED!');
console.log('========================================');
