(() => {
  const customizeStart = document.getElementById('customizeStart');
  if (!customizeStart) return;

  // The original wizard integration opens the start-screen customizer in edit mode.
  // Intercept that click before the old listener runs so applying a wizard continues
  // directly into gameplay.
  customizeStart.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (typeof window.openMageCreator === 'function') window.openMageCreator(true);
  }, true);

  // Extra safety for hosted previews: if the creator successfully applies a wizard
  // while the game is still on its start screen, start the game even if an older
  // wizard-player.js was cached by the preview host.
  window.addEventListener('message', event => {
    const frame = document.getElementById('wizardFrame');
    if (!frame || event.source !== frame.contentWindow) return;
    if (event.data?.type !== 'wild-mage:apply') return;

    setTimeout(() => {
      if (typeof game !== 'undefined' && game?.state === 'start') game.start();
    }, 120);
  });
})();
