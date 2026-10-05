(() => {
  const LEVEL_TWO_DEFEAT_TARGET = 20;

  function levelCompletePanel() {
    const screen = document.getElementById('levelCompleteScreen');
    return {
      screen,
      eyebrow: screen?.querySelector('.eyebrow'),
      title: screen?.querySelector('h2'),
      body: screen?.querySelector('.panel > p:not(.eyebrow)'),
      button: document.getElementById('nextLevelButton'),
    };
  }

  function setCompletionCopy(levelFinished) {
    const ui = levelCompletePanel();
    if (!ui.screen) return;

    if (levelFinished === 2) {
      if (ui.eyebrow) ui.eyebrow.textContent = 'WILDWOOD CLEARED';
      if (ui.title) ui.title.innerHTML = 'Twenty foes.<br>Path cleared.';
      if (ui.body) ui.body.textContent = 'You defeated 20 foes in the deeper Wildwood. Your health is restored as you move into level three.';
      if (ui.button) ui.button.textContent = 'Enter level three →';
      return;
    }

    if (ui.eyebrow) ui.eyebrow.textContent = 'CLEARING COMPLETE';
    if (ui.title) ui.title.innerHTML = 'Three elements.<br>One team.';
    if (ui.body) ui.body.textContent = 'You survived a minute and befriended fire, water, and grass. Your health is restored when you enter the next area.';
    if (ui.button) ui.button.textContent = 'Enter level two →';
  }

  const originalReset = Game.prototype.reset;
  Game.prototype.reset = function() {
    originalReset.call(this);
    this.levelDefeats = 0;
  };

  const originalDefeat = Monster.prototype.defeat;
  Monster.prototype.defeat = function() {
    const countForLevelTwo = !this.dead && game?.state === 'playing' && game?.level === 2;
    originalDefeat.call(this);

    if (countForLevelTwo) {
      game.levelDefeats = Math.min(LEVEL_TWO_DEFEAT_TARGET, (game.levelDefeats || 0) + 1);
    }
  };

  const originalUpdateLesson = Game.prototype.updateLesson;
  Game.prototype.updateLesson = function() {
    originalUpdateLesson.call(this);

    const progress = document.getElementById('lessonProgress');
    if (!progress) return;

    if (this.level === 2) {
      const defeated = Math.min(LEVEL_TWO_DEFEAT_TARGET, this.levelDefeats || 0);
      progress.textContent = `LEVEL 2 · Defeat ${defeated} / ${LEVEL_TWO_DEFEAT_TARGET} foes to unlock level 3`;
    } else if (this.level >= 3) {
      progress.textContent = `LEVEL ${this.level} · The Wildwood deepens`;
    }
  };

  const originalUpdate = Game.prototype.update;
  Game.prototype.update = function(dt) {
    originalUpdate.call(this, dt);

    if (
      this.state === 'playing' &&
      this.level === 2 &&
      (this.levelDefeats || 0) >= LEVEL_TWO_DEFEAT_TARGET
    ) {
      this.state = 'levelcomplete';
      clearInput();
      pauseButton.disabled = true;
      setCompletionCopy(2);
      const screen = document.getElementById('levelCompleteScreen');
      screen?.classList.remove('hidden');
      document.getElementById('nextLevelButton')?.focus({ preventScroll: true });
    }
  };

  Game.prototype.nextLevel = function() {
    if (this.state !== 'levelcomplete') return;

    const finishedLevel = this.level;
    this.level += 1;
    this.elapsed = 0;
    this.levelDefeats = 0;
    this.state = 'playing';
    this.monsters = [];
    this.spells = [];
    this.areaAttacks = [];
    this.spawnTimer = 4;
    this.player.health = this.player.maxHealth;
    clearInput();

    document.getElementById('levelCompleteScreen')?.classList.add('hidden');
    pauseButton.disabled = false;
    pauseButton.innerHTML = 'Pause <kbd>Esc</kbd>';

    for (let i = 0; i < 4; i++) this.spawnMonster();
    this.updateLesson();
    canvas.focus({ preventScroll: true });

    // Restore the level-one completion copy in case a new run reaches it later.
    if (finishedLevel === 1) setCompletionCopy(1);
  };
})();
