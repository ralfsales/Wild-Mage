(() => {
  const FOREST_OBSTACLES = [
    // Trees — all are solid blockers.
    { kind: 'tree', x: 34, y: 78, w: 46, h: 62 },
    { kind: 'tree', x: 108, y: 70, w: 48, h: 64 },
    { kind: 'tree', x: 198, y: 88, w: 44, h: 60 },
    { kind: 'tree', x: 306, y: 72, w: 48, h: 66 },
    { kind: 'tree', x: 604, y: 76, w: 48, h: 64 },
    { kind: 'tree', x: 708, y: 84, w: 46, h: 62 },
    { kind: 'tree', x: 812, y: 70, w: 48, h: 66 },
    { kind: 'tree', x: 886, y: 96, w: 42, h: 58 },
    { kind: 'tree', x: 34, y: 420, w: 48, h: 66 },
    { kind: 'tree', x: 102, y: 520, w: 46, h: 62 },
    { kind: 'tree', x: 218, y: 500, w: 48, h: 64 },
    { kind: 'tree', x: 730, y: 520, w: 48, h: 64 },
    { kind: 'tree', x: 826, y: 500, w: 46, h: 62 },
    { kind: 'tree', x: 892, y: 422, w: 42, h: 60 },

    // Lodges / cabins — also solid blockers.
    { kind: 'lodge', x: 118, y: 214, w: 118, h: 82 },
    { kind: 'cabin', x: 694, y: 202, w: 122, h: 84 },
    { kind: 'lodge', x: 674, y: 408, w: 126, h: 84 },

    // Medium rocks — solid blockers.
    { kind: 'rock', x: 312, y: 186, w: 52, h: 36 },
    { kind: 'rock', x: 456, y: 132, w: 48, h: 34 },
    { kind: 'rock', x: 548, y: 224, w: 56, h: 38 },
    { kind: 'rock', x: 286, y: 358, w: 54, h: 36 },
    { kind: 'rock', x: 456, y: 432, w: 52, h: 36 },
    { kind: 'rock', x: 554, y: 352, w: 58, h: 38 },
    { kind: 'rock', x: 364, y: 514, w: 50, h: 34 },
    { kind: 'rock', x: 570, y: 518, w: 50, h: 34 },
  ];

  window.setupLevel3Forest = function(currentGame) {
    currentGame.obstacles = FOREST_OBSTACLES.map(o => ({ ...o }));
    currentGame.decor = [];
    currentGame.bushes = [
      { x: 90, y: 330 }, { x: 246, y: 166 }, { x: 404, y: 214 },
      { x: 486, y: 330 }, { x: 628, y: 156 }, { x: 850, y: 328 },
      { x: 190, y: 390 }, { x: 404, y: 560 }, { x: 620, y: 456 },
    ];

    // Keep earlier friends and still make the five-grass-allies objective achievable.
    currentGame.maxTameSlots = Math.max(currentGame.maxTameSlots || 5, 8);
    currentGame.tameSlots = Math.max(currentGame.tameSlots || 5, 8);

    const p = currentGame.freeSpot(WIDTH / 2 - currentGame.player.w / 2, HEIGHT / 2 - currentGame.player.h / 2, currentGame.player.w, currentGame.player.h);
    currentGame.player.x = p.x;
    currentGame.player.y = p.y;
  };

  function drawForestFloor() {
    ctx.fillStyle = '#173f29';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (let y = 0; y < HEIGHT; y += TILE) {
      for (let x = 0; x < WIDTH; x += TILE) {
        ctx.fillStyle = ((x / TILE + y / TILE) % 2 === 0) ? '#1d4b2e' : '#204f31';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = 'rgba(180,220,150,0.055)';
        ctx.fillRect(x + 6, y + 8, 3, 2);
        ctx.fillRect(x + 22, y + 20, 4, 2);
      }
    }

    // Narrow forest trails for visual structure only.
    ctx.fillStyle = '#6b5638';
    ctx.fillRect(0, 306, WIDTH, 30);
    ctx.fillRect(452, 58, 30, HEIGHT - 58);
    ctx.fillStyle = '#806847';
    for (let x = 0; x < WIDTH; x += 36) ctx.fillRect(x + 5, 316 + Math.sin(x / 58) * 3, 18, 4);
    for (let y = 72; y < HEIGHT; y += 34) ctx.fillRect(462 + Math.cos(y / 50) * 3, y, 4, 17);
  }

  function drawTree(o) {
    const x = Math.round(o.x), y = Math.round(o.y);
    ctx.fillStyle = '#2d1e16';
    ctx.fillRect(x + o.w * 0.39, y + o.h * 0.53, o.w * 0.22, o.h * 0.42);
    ctx.fillStyle = '#69462a';
    ctx.fillRect(x + o.w * 0.45, y + o.h * 0.55, o.w * 0.08, o.h * 0.36);

    ctx.fillStyle = '#0f2d1d';
    ctx.beginPath();
    ctx.arc(x + o.w * 0.28, y + o.h * 0.36, o.w * 0.28, 0, Math.PI * 2);
    ctx.arc(x + o.w * 0.58, y + o.h * 0.27, o.w * 0.31, 0, Math.PI * 2);
    ctx.arc(x + o.w * 0.72, y + o.h * 0.44, o.w * 0.27, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#215b32';
    ctx.beginPath();
    ctx.arc(x + o.w * 0.31, y + o.h * 0.33, o.w * 0.20, 0, Math.PI * 2);
    ctx.arc(x + o.w * 0.57, y + o.h * 0.25, o.w * 0.22, 0, Math.PI * 2);
    ctx.arc(x + o.w * 0.69, y + o.h * 0.43, o.w * 0.19, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4e8b45';
    ctx.fillRect(x + 10, y + 12, 8, 5);
    ctx.fillRect(x + o.w - 18, y + 19, 7, 4);
  }

  function drawLodge(o, cabin = false) {
    const x = Math.round(o.x), y = Math.round(o.y);
    ctx.fillStyle = '#2d211b';
    ctx.fillRect(x + 4, y + 26, o.w - 8, o.h - 30);
    ctx.fillStyle = cabin ? '#725039' : '#815a3b';
    ctx.fillRect(x + 10, y + 31, o.w - 20, o.h - 40);

    ctx.fillStyle = '#3b2a23';
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 31);
    ctx.lineTo(x + o.w / 2, y);
    ctx.lineTo(x + o.w + 4, y + 31);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9a744b';
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 29);
    ctx.lineTo(x + o.w / 2, y + 7);
    ctx.lineTo(x + o.w - 8, y + 29);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#271b18';
    ctx.fillRect(x + o.w / 2 - 10, y + o.h - 34, 20, 30);
    ctx.fillStyle = '#e5bc68';
    ctx.fillRect(x + 21, y + 43, 16, 14);
    ctx.fillRect(x + o.w - 37, y + 43, 16, 14);
    ctx.fillStyle = '#6ea1a2';
    ctx.fillRect(x + 24, y + 46, 10, 8);
    ctx.fillRect(x + o.w - 34, y + 46, 10, 8);
  }

  function drawRock(o) {
    const x = Math.round(o.x), y = Math.round(o.y);
    pixelShape(x, y, [[0,10],[10,1],[o.w-11,0],[o.w,10],[o.w-5,o.h],[8,o.h]], '#566258');
    pixelShape(x + 5, y + 4, [[0,7],[8,0],[o.w-22,1],[o.w-12,8],[o.w-17,o.h-12],[6,o.h-11]], '#7b8978');
    ctx.fillStyle = '#a0aa91';
    ctx.fillRect(x + 12, y + 7, 12, 4);
  }

  function drawForestObstacle(o) {
    if (o.kind === 'tree') drawTree(o);
    else if (o.kind === 'lodge') drawLodge(o, false);
    else if (o.kind === 'cabin') drawLodge(o, true);
    else drawRock(o);
  }

  function drawLevelThree(currentGame) {
    drawForestFloor();
    for (const bush of currentGame.bushes) drawBush(bush.x, bush.y);
    for (const o of currentGame.obstacles) drawForestObstacle(o);

    for (const p of currentGame.pickups) p.draw();
    for (const treasure of currentGame.treasures) treasure.draw();
    for (const item of currentGame.tameSlotItems) item.draw();
    for (const coin of currentGame.coins) coin.draw();
    for (const orb of currentGame.energyDrops) orb.draw();
    for (const spell of currentGame.spells) spell.draw();
    for (const ally of currentGame.allies) ally.draw();
    for (const monster of currentGame.monsters) monster.draw();
    currentGame.player.draw();
    for (const attack of currentGame.areaAttacks) attack.draw();
    currentGame.particles.draw();
    for (const floater of currentGame.floaters) floater.draw();

    for (const hold of attackHolds.values()) {
      if (hold.triggered) continue;
      const p = center(currentGame.player);
      ctx.strokeStyle = currentGame.energy >= ENERGY_PER_CHARGE ? ELEMENT_COLORS[SKILLS[hold.index].element] : '#85768f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, hold.elapsed / CHARGE_HOLD_SECONDS));
      ctx.stroke();
    }

    drawUI(currentGame);
  }

  const originalDraw = Game.prototype.draw;
  Game.prototype.draw = function() {
    if (this.level === 3) {
      drawLevelThree(this);
      return;
    }
    originalDraw.call(this);
  };
})();