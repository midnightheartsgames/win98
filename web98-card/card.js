(() => {
  const card = document.getElementById('card');
  const reopen = document.getElementById('reopen');
  const maxButton = card.querySelector('[data-act="max"]');
  const maxIcon = maxButton.querySelector('img');

  const setMaximized = on => {
    card.classList.toggle('is-max', on);
    maxButton.setAttribute('aria-pressed', String(on));
    maxButton.setAttribute('aria-label', on ? 'Восстановить' : 'Развернуть');
    maxIcon.src = on ? 'img/cap-restore.svg' : 'img/cap-max.svg';
    maxIcon.width = on ? 8 : 9;
  };

  const hide = () => {
    card.hidden = true;
    reopen.hidden = false;
    reopen.focus();
  };

  const show = () => {
    reopen.hidden = true;
    card.hidden = false;
    card.querySelector('[data-act="close"]').focus();
  };

  card.querySelector('.title-buttons').addEventListener('click', event => {
    const button = event.target.closest('[data-act]');
    if (!button) return;
    if (button.dataset.act === 'max') setMaximized(!card.classList.contains('is-max'));
    else hide();
  });

  card.querySelector('.title-bar').addEventListener('dblclick', event => {
    if (event.target.closest('.title-buttons') || getComputedStyle(maxButton).display === 'none') return;
    setMaximized(!card.classList.contains('is-max'));
  });

  reopen.addEventListener('click', show);

  const sizeText = bytes => bytes >= 1e9
    ? (bytes / 1e9).toFixed(1).replace('.', ',') + '\u00a0ГБ'
    : Math.round(bytes / 1e6) + '\u00a0МБ';

  document.querySelectorAll('[data-size]').forEach(node => {
    fetch('update/' + node.dataset.size + '/stable.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(pointer => {
        const bytes = pointer && pointer[node.dataset.part] && pointer[node.dataset.part].bytes;
        if (bytes) node.textContent = node.dataset.kind + ', ' + sizeText(bytes);
      })
      .catch(() => {});
  });
})();
