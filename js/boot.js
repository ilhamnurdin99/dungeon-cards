// Dungeon Cards — boot. Wires the UI, then either shows the title
// screen or jumps straight into a deterministic ?shot= scene.
window.DC = window.DC || {};

window.addEventListener("DOMContentLoaded", function () {
  DC.ui.init();
  var params = new URLSearchParams(window.location.search || "");
  var shot = params.get("shot");
  if (shot) DC.game.setupShot(shot);
  // Signal for automated screenshots / tests that the scene is rendered.
  window.__shotReady = true;
});
