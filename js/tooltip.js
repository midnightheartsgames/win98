(() => {
  const SHOW_DELAY = 500;
  const HIDE_AFTER = 5000;
  const tip = document.createElement('div');
  tip.id = 'win-tooltip';
  tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);

  let owner = null;
  let showTimer = null;
  let hideTimer = null;
  let pointer = { x: 0, y: 0 };

  const release = () => {
    if (owner && owner.dataset.winTip !== undefined) {
      if (!owner.hasAttribute('title')) owner.setAttribute('title', owner.dataset.winTip);
      delete owner.dataset.winTip;
    }
    owner = null;
  };

  const hide = () => {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    tip.classList.remove('visible');
    release();
  };

  const show = () => {
    if (!owner || !owner.isConnected || !owner.dataset.winTip) return;
    tip.textContent = owner.dataset.winTip;
    tip.classList.add('visible');
    const width = tip.offsetWidth;
    const height = tip.offsetHeight;
    let left = pointer.x;
    let top = pointer.y + 20;
    if (left + width > window.innerWidth - 2) left = window.innerWidth - width - 2;
    if (top + height > window.innerHeight - 2) top = pointer.y - height - 4;
    tip.style.left = `${Math.max(2, left)}px`;
    tip.style.top = `${Math.max(2, top)}px`;
    hideTimer = setTimeout(hide, HIDE_AFTER);
  };

  document.addEventListener('mouseover', (e) => {
    const el = e.target instanceof Element ? e.target.closest('[title]') : null;
    if (el === owner) return;
    hide();
    const text = el ? el.getAttribute('title') : '';
    if (!el || !text) return;
    owner = el;
    owner.dataset.winTip = text;
    owner.removeAttribute('title');
    pointer = { x: e.clientX, y: e.clientY };
    showTimer = setTimeout(show, SHOW_DELAY);
  });

  document.addEventListener('mousemove', (e) => {
    if (!tip.classList.contains('visible')) pointer = { x: e.clientX, y: e.clientY };
  });

  document.addEventListener('mouseout', (e) => {
    if (owner && (!e.relatedTarget || !owner.contains(e.relatedTarget))) hide();
  });

  ['mousedown', 'keydown', 'wheel'].forEach(type => document.addEventListener(type, hide, true));
  window.addEventListener('blur', hide);
})();
