/* ============================================================
   SPRINKLE DATA — Component Loader
   Fetches header.html and footer.html and injects them into
   [data-component="header"] and [data-component="footer"] slots.
   ============================================================ */

(function () {
  'use strict';

  function loadComponent(selector, url, callback) {
    var el = document.querySelector(selector);
    if (!el) return;
    fetch(url)
      .then(function (res) { return res.text(); })
      .then(function (html) {
        el.innerHTML = html;
        if (typeof callback === 'function') callback();
      })
      .catch(function (err) {
        console.warn('Component load failed:', url, err);
      });
  }

  function initNavbar() {
    /* ── Mobile nav toggle ── */
    var hamburger = document.querySelector('.navbar__hamburger');
    var navLinks  = document.querySelector('.navbar__links');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', function () {
        var open = navLinks.classList.toggle('navbar__links--open');
        hamburger.setAttribute('aria-expanded', open);
      });
      document.addEventListener('click', function (e) {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
          navLinks.classList.remove('navbar__links--open');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    /* ── Navbar shadow on scroll ── */
    var navbar = document.querySelector('.navbar');
    if (navbar) {
      window.addEventListener('scroll', function () {
        navbar.classList.toggle('navbar--scrolled', window.scrollY > 10);
      }, { passive: true });
    }

    /* ── Mark active nav link ── */
    var currentPath = window.location.pathname;
    document.querySelectorAll('.navbar__links a').forEach(function (a) {
      if (a.getAttribute('href') === currentPath) {
        a.classList.add('active');
      }
    });
  }

  var headerLoaded = false;
  var footerLoaded = false;

  loadComponent('[data-component="header"]', '/components/header.html', function () {
    headerLoaded = true;
    initNavbar();
  });

  loadComponent('[data-component="footer"]', '/components/footer.html', function () {
    footerLoaded = true;
  });

})();
