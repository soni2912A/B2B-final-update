/* =========================================================
   B2B Corporate Bakery Platform — interactions
   ========================================================= */
(function () {
  'use strict';

  const root = document.documentElement;
  const STORAGE_KEY = 'crustcore-theme';

  /* ---------- Theme toggle ---------- */
  const themeToggle = document.getElementById('themeToggle');
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') {
    root.setAttribute('data-theme', saved);
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    root.setAttribute('data-theme', 'light');
  }
  updateTogglePressed();

  themeToggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEY, next);
    updateTogglePressed();
  });
  function updateTogglePressed() {
    themeToggle.setAttribute(
      'aria-pressed',
      root.getAttribute('data-theme') === 'light' ? 'true' : 'false'
    );
  }

  /* ---------- Nav: mobile menu + scroll state ---------- */
  const nav = document.getElementById('nav');
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.querySelector('.nav__links');

  menuBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('is-open');
    menuBtn.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navLinks.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      navLinks.classList.remove('is-open');
      menuBtn.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 10);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Module filter ---------- */
  const chips = document.querySelectorAll('.chip[data-filter]');
  const mods = document.querySelectorAll('.mod');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => {
        c.classList.remove('is-active');
        c.setAttribute('aria-selected', 'false');
      });
      chip.classList.add('is-active');
      chip.setAttribute('aria-selected', 'true');
      const f = chip.dataset.filter;
      mods.forEach(m => {
        m.classList.toggle('is-hidden', f !== 'all' && m.dataset.cat !== f);
      });
    });
  });

  /* ---------- Admin tile/list demo toggle ---------- */
  const paneBtns = document.querySelectorAll('.pane-switch__btn');
  paneBtns.forEach(b => b.addEventListener('click', () => {
    paneBtns.forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active');
  }));

  /* ---------- Reveal-on-scroll ---------- */
  const revealTargets = document.querySelectorAll(
    '.sec-head, .pill, .mod, .step-card, .sub-card, .mock, .cp-card, .cta, .device'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('in'));
  }

  /* ---------- 3D parallax on hero scene ---------- */
  const scene = document.querySelector('.scene');
  const parallaxEls = document.querySelectorAll('[data-depth]');
  if (scene && window.matchMedia('(hover: hover)').matches) {
    const hero = document.querySelector('.hero');
    let rect = hero.getBoundingClientRect();
    window.addEventListener('resize', () => rect = hero.getBoundingClientRect());

    hero.addEventListener('mousemove', (e) => {
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      scene.style.transform = `rotateX(${8 - y * 10}deg) rotateY(${-8 + x * 14}deg)`;
      parallaxEls.forEach(el => {
        const d = parseFloat(el.dataset.depth || 0.1);
        el.style.transform = `translate3d(${-x * 40 * d * 10}px, ${-y * 30 * d * 10}px, 0)`;
      });
    });
    hero.addEventListener('mouseleave', () => {
      scene.style.transform = '';
      parallaxEls.forEach(el => el.style.transform = '');
    });
  }

  /* ---------- Smooth anchor offset (for fixed nav) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
