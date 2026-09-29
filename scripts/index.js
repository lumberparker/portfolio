/**
 * index.js
 * Page UI: loader, header states, mobile menu, scroll reveals, the
 * word-by-word manifesto, counters, tilt cards and magnetic buttons.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Always open on the hero so the intro plays from the top
  if ('scrollRestoration' in history && !location.hash) {
    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }

  // ── Loader: wait for the meadow (or give up gracefully) ──────────────
  var loader = document.querySelector('[data-loader]');
  var started = performance.now();
  var loaded = false;

  function reveal() {
    if (loaded) return;
    loaded = true;
    var wait = Math.max(0, 700 - (performance.now() - started));
    setTimeout(function () {
      if (loader) loader.classList.add('is-done');
      root.classList.add('is-loaded');
    }, wait);
  }

  window.addEventListener('meadow:ready', reveal);
  window.addEventListener('meadow:fallback', reveal);
  if (root.classList.contains('meadow-ready') || root.classList.contains('no-webgl')) reveal();
  setTimeout(reveal, 2500);

  // Stagger index for hero words
  document.querySelectorAll('.hero__word').forEach(function (w, i) {
    w.style.setProperty('--i', i);
  });

  // ── Header ──────────────────────────────────────────────────────────
  var header = document.querySelector('[data-header]');
  var toggle = document.getElementById('headerToggle');
  var lastY = window.scrollY;

  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('header--scrolled', y > 40);
    var open = header.classList.contains('header--open');
    header.classList.toggle('header--hidden', !open && y > lastY && y > window.innerHeight * 0.8);
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    header.classList.toggle('header--open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  toggle.addEventListener('click', function () {
    setMenu(!header.classList.contains('header--open'));
  });

  document.querySelectorAll('.header__link').forEach(function (link) {
    link.addEventListener('click', function () { setMenu(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  // Active nav link
  var links = {};
  document.querySelectorAll('.header__link').forEach(function (a) {
    links[a.getAttribute('href').slice(1)] = a;
  });
  var navObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      Object.keys(links).forEach(function (id) {
        links[id].classList.toggle('is-active', id === entry.target.id);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(links).forEach(function (id) {
    var sec = document.getElementById(id);
    if (sec) navObserver.observe(sec);
  });

  // ── Scroll reveals ──────────────────────────────────────────────────
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.classList.add('is-in');
      revealObserver.unobserve(el);
      // After the entrance, tilt needs a snappy transform transition
      if (el.hasAttribute('data-tilt')) {
        setTimeout(function () {
          el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.5s';
        }, 1600);
      }
      el.querySelectorAll('[data-count]').forEach(countUp);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    revealObserver.observe(el);
  });

  function countUp(el) {
    var end = parseInt(el.dataset.count, 10);
    if (reduce) { el.textContent = end; return; }
    var t0 = performance.now();
    (function tick(now) {
      var t = Math.min(1, (now - t0) / 1600);
      el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    })(t0);
  }

  // ── Manifesto: words light up as it scrolls through ─────────────────
  var manifesto = document.querySelector('[data-words]');
  if (manifesto) {
    (function wrap(node) {
      [].slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var span = document.createElement('span');
            span.className = 'w';
            span.textContent = part;
            frag.appendChild(span);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          wrap(child);
        }
      });
    })(manifesto);

    var words = manifesto.querySelectorAll('.w');
    var lightWords = function () {
      var r = manifesto.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = reduce ? 1 : (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      var lit = p * words.length;
      for (var i = 0; i < words.length; i++) {
        words[i].style.setProperty('--lit', Math.max(0, Math.min(1, lit - i)).toFixed(2));
      }
    };
    window.addEventListener('scroll', lightWords, { passive: true });
    lightWords();
  }

  // ── Tilt cards ──────────────────────────────────────────────────────
  if (finePointer && !reduce) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--gx', (x * 100) + '%');
        card.style.setProperty('--gy', (y * 100) + '%');
        card.style.transform =
          'perspective(900px) rotateX(' + ((0.5 - y) * 8).toFixed(2) + 'deg) rotateY(' +
          ((x - 0.5) * 10).toFixed(2) + 'deg) translateY(-4px)';
      });
      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });

    // ── Magnetic buttons ──────────────────────────────────────────────
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (dx * 0.25).toFixed(1) + 'px,' + (dy * 0.35).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }
})();
