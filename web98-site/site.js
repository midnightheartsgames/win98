(() => {
  const dialog = document.getElementById('game-window');
  const dataNode = document.getElementById('games-data');
  if (!dialog || typeof dialog.showModal !== 'function' || !dataNode) return;

  const games = new Map(JSON.parse(dataNode.textContent).map(game => [game.id, game]));
  const title = dialog.querySelector('.window-title');
  const sub = dialog.querySelector('.window-sub');
  const cd = dialog.querySelector('.window-cd');
  const shots = [...dialog.querySelectorAll('.window-shots figure')];
  const level = dialog.querySelector('.window-level');
  const genre = dialog.querySelector('.window-genre');
  const tags = dialog.querySelector('.window-tags');
  const desc = dialog.querySelector('.window-desc');
  let opener = null;
  const preloaded = new Set();

  const shotSrc = (id, index) => `img/games/${id}-${index + 1}.jpg`;

  const preload = id => {
    if (!games.has(id) || preloaded.has(id)) return;
    preloaded.add(id);
    shots.forEach((figure, index) => { new Image().src = shotSrc(id, index); });
  };

  shots.forEach(figure => {
    const img = figure.querySelector('img');
    img.addEventListener('load', () => img.classList.remove('is-loading'));
    img.addEventListener('error', () => img.classList.remove('is-loading'));
  });

  const fill = game => {
    title.textContent = game.title;
    sub.textContent = game.subtitle;
    cd.textContent = game.cd ? `Демоверсия есть на компакт-диске журнала «Игромания»: ${game.cd}` : '';
    cd.hidden = !game.cd;
    shots.forEach((figure, index) => {
      const img = figure.querySelector('img');
      const src = shotSrc(game.id, index);
      if (img.getAttribute('src') !== src) {
        img.classList.add('is-loading');
        img.src = src;
        if (img.complete && img.naturalWidth) img.classList.remove('is-loading');
      }
      img.alt = game.shots[index] || '';
      figure.querySelector('figcaption').textContent = game.shots[index] || '';
    });
    level.className = `window-level game-level${game.level ? ` is-${game.level}` : ''}`;
    level.textContent = game.levelText;
    level.hidden = !game.level;
    genre.textContent = game.genre;
    tags.replaceChildren(...game.tags.map(tag => {
      const li = document.createElement('li');
      li.textContent = tag;
      return li;
    }));
    desc.textContent = game.desc;
    desc.hidden = !game.desc;
  };

  const preloadFrom = event => {
    const link = event.target.closest('.game');
    if (link) preload(link.dataset.id);
  };
  document.getElementById('games').addEventListener('pointerover', preloadFrom);
  document.getElementById('games').addEventListener('focusin', preloadFrom);

  document.getElementById('games').addEventListener('click', event => {
    const link = event.target.closest('.game');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
    const game = games.get(link.dataset.id);
    if (!game) return;
    event.preventDefault();
    opener = link;
    fill(game);
    dialog.showModal();
    dialog.querySelector('.window-body').scrollTop = 0;
  });

  dialog.querySelector('.window-close').addEventListener('click', () => dialog.close());

  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', () => {
    if (opener) opener.focus();
    opener = null;
  });
})();
