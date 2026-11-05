'use strict';
/* 入口 */
(function () {
  const q = new URLSearchParams(location.search);
  if (q.get('fast')) SPEED = 0;
  loadMeta();
  window.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault());
  showTitle();
})();
