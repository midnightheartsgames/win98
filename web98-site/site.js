(() => {
  const dialog = document.getElementById('game-window');
  const dataNode = document.getElementById('games-data');
  if (!dialog || typeof dialog.showModal !== 'function' || !dataNode) return;

  const games = new Map(JSON.parse(dataNode.textContent).map(game => [game.id, game]));
  const title = dialog.querySelector('.window-title');
  const sub = dialog.querySelector('.window-sub');
  const shots = [...dialog.querySelectorAll('.window-shots figure')];
  const level = dialog.querySelector('.window-level');
  const genre = dialog.querySelector('.window-genre');
  const tags = dialog.querySelector('.window-tags');
  const desc = dialog.querySelector('.window-desc');
  let opener = null;

  const fill = game => {
    title.textContent = game.title;
    sub.textContent = game.subtitle;
    shots.forEach((figure, index) => {
      const img = figure.querySelector('img');
      img.src = `img/games/${game.id}-${index + 1}.jpg`;
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
