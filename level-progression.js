(() => {
  const LEVEL_TWO_DEFEAT_TARGET = 20;
  const LEVEL_THREE_DEFEAT_TARGET = 30;
  const LEVEL_THREE_GRASS_ALLIES = 5;

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

  function grassAllies(currentGame) {
    return currentGame.allies.filter(
      ally => !ally.dead && ally.summonLife === undefined && ally.type === 'grass'
    ).length;
  }

  function setCompletionCopy(levelFinished) {
    const ui = levelCompletePanel();
    if (!ui.screen) return;

    if (levelFinished === 3) {
      if (ui.eyebrow) ui.eyebrow.textContent = 'FOREST TRIAL CLEARED';
      if (ui.title) ui.title.innerHTML = 'Thirty foes.<br>Five grass allies.';
      if (ui.body) ui.body.textContent = 'You cleared the forest trial with five grass allies at your side.';
      if (ui.button) ui.button.textContent = 'Continue →';
      return;
    }

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
    const levelAtDefeat = game?.level;
    const countForObjective =
      !this.dead &&
      game?.state === 'playing' &&
      (levelAtDefeat === 2 || levelAtDefeat === 3);

    originalDefeat.call(this);

    if (countForObjective) {
      const cap = levelAtDefeat === 2 ? LEVEL_TWO_DEFEAT_TARGET : LEVEL_THREE_DEFEAT_TARGET;
      game.levelDefeats = Math.min(cap, (game.levelDefeats || 0) + 1);
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
    } else if (this.level === 3) {
      const defeated = Math.min(LEVEL_THREE_DEFEAT_TARGET, this.levelDefeats || 0);
      const grass = Math.min(LEVEL_THREE_GRASS_ALLIES, grassAllies(this));
      progress.textContent = `LEVEL 3 · Defeat ${defeated} / ${LEVEL_THREE_DEFEAT_TARGET} foes · Grass allies ${grass} / ${LEVEL_THREE_GRASS_ALLIES}`;
    } else if (this.level > 3) {
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
      return;
    }

    if (
      this.state === 'playing' &&
      this.level === 3 &&
      (this.levelDefeats || 0) >= LEVEL_THREE_DEFEAT_TARGET &&
      grassAllies(this) >= LEVEL_THREE_GRASS_ALLIES
    ) {
      this.state = 'levelcomplete';
      clearInput();
      pauseButton.disabled = true;
      setCompletionCopy(3);
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

    if (this.level === 3 && typeof window.setupLevel3Forest === 'function') {
      window.setupLevel3Forest(this);
    }

    document.getElementById('levelCompleteScreen')?.classList.add('hidden');
    pauseButton.disabled = false;
    pauseButton.innerHTML = 'Pause <kbd>Esc</kbd>';

    const initialSpawns = this.level === 3 ? 6 : 4;
    for (let i = 0; i < initialSpawns; i++) this.spawnMonster();
    this.updateLesson();
    canvas.focus({ preventScroll: true });

    if (finishedLevel === 1) setCompletionCopy(1);
  };
})();