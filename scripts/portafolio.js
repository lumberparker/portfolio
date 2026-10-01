/**
 * portafolio.js
 * - [data-mix]: splits a headline into letters and tints each one with the
 *   Visual Mixology palette (berriesandmango.com signature).
 * - [data-preview]: on desktop, hovering a project row shows its screenshot
 *   in a floating card that eases after the cursor and tilts with its speed.
 */
(function () {
  'use strict';

  var PALETTE = ['#6776ff', '#ffafa9', '#fcad22', '#e26248', '#7bb8f0', '#6ed6a8', '#fce5d6', '#ec2e7c', '#fcc247'];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Visual Mixology letters ──────────────────────────────────────────
  document.querySelectorAll('[data-mix]').forEach(function (el) {
    var text = el.textContent;
    el.setAttribute('aria-label', text.trim());
    el.textContent = '';
    var i = 0;
    text.split('').forEach(function (ch) {
      if (ch === ' ') { el.appendChild(document.createTextNode(' ')); return; }
      var span = document.createElement('span');
      span.className = 'mix__char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = ch;
      span.style.setProperty('--mix', PALETTE[i % PALETTE.length]);
      span.style.setProperty('--i', i);
      el.appendChild(span);
      i++;
    });
  });

  // ── Cursor-following preview ─────────────────────────────────────────
  var rows = document.querySelectorAll('[data-preview]');
  var canHover = window.matchMedia('(hover: hover) and (min-width: 901px)');
  if (!rows.length) return;

  var card = document.createElement('div');
  card.className = 'carta-preview';
  card.setAttribute('aria-hidden', 'true');
  var imgs = {};
  rows.forEach(function (row) {
    var src = row.getAttribute('data-preview');
    if (imgs[src]) return;
    var img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    card.appendChild(img);
    imgs[src] = img;
  });
  document.body.appendChild(card);

  var target = { x: 0, y: 0 };
  var pos = { x: 0, y: 0 };
  var active = false;
  var running = false;

  function loop() {
    var k = reduce ? 1 : 0.14;
    var dx = target.x - pos.x;
    pos.x += dx * k;
    pos.y += (target.y - pos.y) * k;
    var tilt = Math.max(-10, Math.min(10, dx * 0.05));
    var w = card.offsetWidth, h = card.offsetHeight;
    card.style.transform =
      'translate3d(' + (pos.x - w / 2).toFixed(1) + 'px,' + (pos.y - h - 24).toFixed(1) + 'px,0) rotate(' + tilt.toFixed(2) + 'deg)';
    if (active || Math.abs(dx) > 0.5) {
      requestAnimationFrame(loop);
    } else {
      running = false;
    }
  }

  function start() {
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  window.addEventListener('pointermove', function (e) {
    target.x = e.clientX;
    target.y = e.clientY;
  }, { passive: true });

  rows.forEach(function (row) {
    row.addEventListener('pointerenter', function (e) {
      if (!canHover.matches) return;
      var src = row.getAttribute('data-preview');
      Object.keys(imgs).forEach(function (k) { imgs[k].classList.toggle('is-active', k === src); });
      if (!active) { pos.x = target.x = e.clientX; pos.y = target.y = e.clientY; }
      active = true;
      card.classList.add('is-visible');
      start();
    });
    row.addEventListener('pointerleave', function () {
      active = false;
      card.classList.remove('is-visible');
    });
  });
})();
