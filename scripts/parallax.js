/**
 * parallax.js
 * Everything that moves with scroll or pointer outside the 3D scene:
 *  - [data-depth]  hero copy layers: drift with scroll + lean toward the pointer
 *  - [data-band]   giant type rows that slide sideways with scroll
 *  - [data-speed]  images that shift inside their frames
 *  - --veil        darkens the meadow while reading the middle sections
 *  - pollen        firefly/pollen canvas in the brand palette
 *  - fallback      layered SVG meadow when WebGPU/WebGL2 is unavailable
 *
 * Uses the individual `translate` property so CSS transforms (reveals,
 * rotations, tilt) keep working on the same elements.
 */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var PALETTE = ['#fcad22', '#fcc247', '#ec2e7c', '#ffafa9', '#6776ff', '#6ed6a8'];

  var depthEls = [].slice.call(document.querySelectorAll('[data-depth]'));
  var bandEls  = [].slice.call(document.querySelectorAll('[data-band]'));
  var speedEls = [].slice.call(document.querySelectorAll('[data-speed]'));
  var vignette = document.querySelector('.meadow__vignette');
  var contact  = document.getElementById('contact');

  var vh = window.innerHeight;
  var vw = window.innerWidth;
  var pointer = { x: 0, y: 0 };  // -1..1, smoothed below
  var target  = { x: 0, y: 0 };

  window.addEventListener('pointermove', function (e) {
    target.x = (e.clientX / vw) * 2 - 1;
    target.y = (e.clientY / vh) * 2 - 1;
  }, { passive: true });

  window.addEventListener('resize', function () {
    vh = window.innerHeight;
    vw = window.innerWidth;
    sizePollen();
  }, { passive: true });

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ── Fallback meadow ──────────────────────────────────────────────────
  var fallbackLayers = [];

  function buildFallback() {
    var host = document.querySelector('[data-meadow-fallback]');
    if (!host || host.childElementCount) return;

    var sun = document.createElement('div');
    sun.className = 'meadow__sun';
    host.appendChild(sun);
    fallbackLayers.push({ el: sun, speed: 0.08 });

    // Far → near: shorter, darker, denser → taller, brighter, sparser
    var specs = [
      { h: 38, count: 160, base: '#1a0f24', tip: 0.25, speed: 0.12, opacity: 0.7 },
      { h: 30, count: 120, base: '#10161a', tip: 0.35, speed: 0.22, opacity: 0.9 },
      { h: 24, count: 80,  base: '#0a0710', tip: 0.5,  speed: 0.38, opacity: 1 }
    ];

    specs.forEach(function (spec, li) {
      var layer = document.createElement('div');
      layer.className = 'meadow__layer';
      layer.style.height = spec.h + 'vh';
      layer.style.opacity = spec.opacity;
      var ns = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 1000 300');
      svg.setAttribute('preserveAspectRatio', 'none');

      var ground = document.createElementNS(ns, 'rect');
      ground.setAttribute('x', 0);
      ground.setAttribute('y', 285);
      ground.setAttribute('width', 1000);
      ground.setAttribute('height', 15);
      ground.setAttribute('fill', spec.base);
      svg.appendChild(ground);

      var defs = document.createElementNS(ns, 'defs');
      svg.appendChild(defs);

      for (var i = 0; i < spec.count; i++) {
        var x = (i / spec.count) * 1000 + Math.random() * 12;
        var h = 120 + Math.random() * 170;
        var w = 3 + Math.random() * 5;
        var bend = (Math.random() - 0.5) * 60;
        var colored = Math.random() < spec.tip;
        var tipColor = colored ? PALETTE[(Math.random() * PALETTE.length) | 0] : '#4b9b21';
        var gid = 'g' + li + '-' + i;
        var grad = document.createElementNS(ns, 'linearGradient');
        grad.setAttribute('id', gid);
        grad.setAttribute('x1', 0); grad.setAttribute('y1', 1);
        grad.setAttribute('x2', 0); grad.setAttribute('y2', 0);
        grad.innerHTML =
          '<stop offset="0" stop-color="' + spec.base + '"/>' +
          '<stop offset="0.55" stop-color="#244a12"/>' +
          '<stop offset="1" stop-color="' + tipColor + '"/>';
        defs.appendChild(grad);

        var p = document.createElementNS(ns, 'path');
        p.setAttribute('d',
          'M' + (x - w) + ' 300 Q' + (x + bend * 0.4) + ' ' + (300 - h * 0.6) + ' ' +
          (x + bend) + ' ' + (300 - h) + ' Q' + (x + bend * 0.4 + w * 0.5) + ' ' +
          (300 - h * 0.6) + ' ' + (x + w) + ' 300Z');
        p.setAttribute('fill', 'url(#' + gid + ')');
        p.style.setProperty('--sway', (3 + Math.random() * 3).toFixed(2) + 's');
        p.style.setProperty('--delay', (-Math.random() * 5).toFixed(2) + 's');
        svg.appendChild(p);
      }

      layer.appendChild(svg);
      host.appendChild(layer);
      fallbackLayers.push({ el: layer, speed: spec.speed });
    });
  }

  window.addEventListener('meadow:fallback', buildFallback);
  if (document.documentElement.classList.contains('no-webgl')) buildFallback();

  // ── Pollen / fireflies ───────────────────────────────────────────────
  var pollen = document.querySelector('[data-pollen]');
  var ctx = pollen && pollen.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var motes = [];
  var MAX_MOTES = coarse ? 40 : 110;

  function sizePollen() {
    if (!pollen) return;
    pollen.width = Math.round(vw * dpr);
    pollen.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizePollen();

  function spawn(x, y, burst) {
    if (motes.length >= MAX_MOTES) return;
    motes.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * (burst ? 1.2 : 0.25),
      vy: -(0.15 + Math.random() * (burst ? 0.9 : 0.35)),
      r: 0.8 + Math.random() * 2.2,
      life: 0,
      max: 240 + Math.random() * 360,
      c: PALETTE[(Math.random() * PALETTE.length) | 0],
      ph: Math.random() * Math.PI * 2
    });
  }

  var lastSpawn = 0;
  window.addEventListener('pointermove', function (e) {
    var now = performance.now();
    if (now - lastSpawn < 28) return;
    lastSpawn = now;
    spawn(e.clientX + (Math.random() - 0.5) * 16, e.clientY + (Math.random() - 0.5) * 16, true);
  }, { passive: true });

  function drawPollen() {
    if (!ctx) return;
    // Ambient drift up from the lower half of the screen
    if (!reduce && Math.random() < 0.35) spawn(Math.random() * vw, vh * (0.55 + Math.random() * 0.5), false);

    ctx.clearRect(0, 0, vw, vh);
    ctx.globalCompositeOperation = 'lighter';
    for (var i = motes.length - 1; i >= 0; i--) {
      var m = motes[i];
      m.life++;
      m.ph += 0.03;
      m.x += m.vx + Math.sin(m.ph) * 0.25;
      m.y += m.vy;
      var t = m.life / m.max;
      if (t >= 1) { motes.splice(i, 1); continue; }
      var a = Math.sin(t * Math.PI) * (0.55 + 0.45 * Math.sin(m.ph * 3));
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = m.c;
      ctx.shadowColor = m.c;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  // ── Frame loop ───────────────────────────────────────────────────────
  function frame() {
    var y = window.scrollY;

    pointer.x += (target.x - pointer.x) * 0.06;
    pointer.y += (target.y - pointer.y) * 0.06;

    if (!reduce) {
      // Hero layers: only while the hero is on screen
      if (y < vh * 1.3) {
        for (var i = 0; i < depthEls.length; i++) {
          var el = depthEls[i];
          var d = parseFloat(el.dataset.depth);
          var tx = pointer.x * d * 18;
          var ty = -y * d * 0.55 + pointer.y * d * 10;
          el.style.translate = tx.toFixed(1) + 'px ' + ty.toFixed(1) + 'px';
        }
      }

      for (var b = 0; b < bandEls.length; b++) {
        var band = bandEls[b];
        var rect = band.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) continue;
        var speed = parseFloat(band.dataset.band);
        var offset = (rect.top + rect.height / 2 - vh / 2);
        var base = speed < 0 ? 0 : -band.scrollWidth * 0.25;
        band.style.translate = (base + offset * speed * 0.7).toFixed(1) + 'px 0';
      }

      for (var s = 0; s < speedEls.length; s++) {
        var img = speedEls[s];
        var frameRect = img.parentElement.getBoundingClientRect();
        if (frameRect.bottom < 0 || frameRect.top > vh) continue;
        var center = frameRect.top + frameRect.height / 2 - vh / 2;
        img.style.translate = '0 ' + (center * -parseFloat(img.dataset.speed)).toFixed(1) + 'px';
      }

      for (var f = 0; f < fallbackLayers.length; f++) {
        var L = fallbackLayers[f];
        L.el.style.translate = (pointer.x * -L.speed * 40).toFixed(1) + 'px ' + (y * L.speed * 0.25).toFixed(1) + 'px';
      }
    }

    // Veil: deepen the meadow behind the dense middle sections, lift it
    // again as the camera sinks into the grass at the contact section.
    if (vignette) {
      var into = clamp((y - vh * 0.5) / vh, 0, 1);
      var out = contact ? clamp((y - (contact.offsetTop - vh * 1.2)) / vh, 0, 1) : 0;
      vignette.style.setProperty('--veil', (0.5 * into * (1 - out)).toFixed(3));
    }

    drawPollen();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
