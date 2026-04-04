(function () {
  function initCustomReveal() {
    var hiddenItems = Array.prototype.filter.call(
      document.querySelectorAll("[data-w-id][style]"),
      function (element) {
        var inlineStyle = (element.getAttribute("style") || "")
          .replace(/\s+/g, "")
          .toLowerCase();
        return inlineStyle.indexOf("opacity:0") !== -1;
      },
    );

    if (!hiddenItems.length) {
      return;
    }

    hiddenItems.forEach(function (element, index) {
      element.classList.add("custom-reveal");
      element.style.opacity = "0";
      element.style.transitionDelay = Math.min(index * 40, 240) + "ms";
    });

    function reveal(element) {
      element.classList.add("is-visible");
      element.style.opacity = "1";
      element.style.transform = "none";
    }

    if (!("IntersectionObserver" in window)) {
      hiddenItems.forEach(reveal);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    hiddenItems.forEach(function (element) {
      observer.observe(element);
    });
  }

  function initDropdowns() {
    var dropdowns = Array.prototype.slice.call(
      document.querySelectorAll(".w-dropdown:not(.faq)"),
    );

    if (!dropdowns.length) {
      return;
    }

    function closeDropdown(dropdown) {
      dropdown.classList.remove("w--open");
      var toggle = dropdown.querySelector(".w-dropdown-toggle");
      var list = dropdown.querySelector(".w-dropdown-list");

      if (toggle) {
        toggle.classList.remove("w--open");
        toggle.setAttribute("aria-expanded", "false");
      }

      if (list) {
        list.classList.remove("w--open");
      }
    }

    function openDropdown(dropdown) {
      dropdowns.forEach(function (item) {
        if (item !== dropdown) {
          closeDropdown(item);
        }
      });

      dropdown.classList.add("w--open");
      var toggle = dropdown.querySelector(".w-dropdown-toggle");
      var list = dropdown.querySelector(".w-dropdown-list");

      if (toggle) {
        toggle.classList.add("w--open");
        toggle.setAttribute("aria-expanded", "true");
      }

      if (list) {
        list.classList.add("w--open");
      }
    }

    dropdowns.forEach(function (dropdown) {
      var toggle = dropdown.querySelector(".w-dropdown-toggle");
      if (!toggle) {
        return;
      }

      toggle.setAttribute("aria-expanded", "false");

      toggle.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (dropdown.classList.contains("w--open")) {
          closeDropdown(dropdown);
        } else {
          openDropdown(dropdown);
        }
      });

      dropdown.addEventListener("mouseenter", function () {
        if (window.innerWidth > 991) {
          openDropdown(dropdown);
        }
      });

      dropdown.addEventListener("mouseleave", function () {
        if (window.innerWidth > 991) {
          closeDropdown(dropdown);
        }
      });
    });

    document.addEventListener("click", function (event) {
      dropdowns.forEach(function (dropdown) {
        if (!dropdown.contains(event.target)) {
          closeDropdown(dropdown);
        }
      });
    });
  }

  function initMobileNav() {
    var button = document.querySelector(".menu-button-responsive");
    var navMenu = document.querySelector(".nav-menu-wrapper-items");

    if (!button || !navMenu) {
      return;
    }

    button.setAttribute("role", "button");
    button.setAttribute("tabindex", "0");
    button.setAttribute("aria-expanded", "false");

    function closeMenu() {
      button.classList.remove("w--open");
      navMenu.classList.remove("w--open");
      button.setAttribute("aria-expanded", "false");
      document.body.classList.remove("custom-nav-open");
    }

    function toggleMenu() {
      var willOpen = !navMenu.classList.contains("w--open");
      navMenu.classList.toggle("w--open", willOpen);
      button.classList.toggle("w--open", willOpen);
      button.setAttribute("aria-expanded", willOpen ? "true" : "false");
      document.body.classList.toggle("custom-nav-open", willOpen);
    }

    button.addEventListener("click", function (event) {
      event.preventDefault();
      toggleMenu();
    });

    button.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleMenu();
      }
    });

    navMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth <= 991) {
          closeMenu();
        }
      });
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 991) {
        closeMenu();
      }
    });

    document.addEventListener("click", function (event) {
      if (window.innerWidth > 991) {
        return;
      }

      if (!button.contains(event.target) && !navMenu.contains(event.target)) {
        closeMenu();
      }
    });
  }

  function initTabs() {
    var tabGroups = document.querySelectorAll(".w-tabs");

    tabGroups.forEach(function (tabGroup) {
      var links = Array.prototype.slice.call(
        tabGroup.querySelectorAll(".w-tab-menu .w-tab-link"),
      );
      var panes = Array.prototype.slice.call(
        tabGroup.querySelectorAll(".w-tab-content .w-tab-pane"),
      );

      if (!links.length || !panes.length) {
        return;
      }

      function activateTab(name) {
        links.forEach(function (link) {
          var isActive = link.getAttribute("data-w-tab") === name;
          link.classList.toggle("w--current", isActive);
          link.setAttribute("aria-selected", isActive ? "true" : "false");
          link.setAttribute("tabindex", isActive ? "0" : "-1");
        });

        panes.forEach(function (pane) {
          var isActive = pane.getAttribute("data-w-tab") === name;
          pane.classList.toggle("w--tab-active", isActive);
          pane.style.display = isActive ? "block" : "none";
        });
      }

      links.forEach(function (link) {
        link.setAttribute("role", "tab");
        link.addEventListener("click", function (event) {
          event.preventDefault();
          activateTab(link.getAttribute("data-w-tab"));
        });
      });

      var initialLink =
        tabGroup.querySelector(".w-tab-menu .w-tab-link.w--current") || links[0];

      activateTab(initialLink.getAttribute("data-w-tab"));
    });
  }

  function initFaqs() {
    var faqs = document.querySelectorAll(".faq.w-dropdown");

    faqs.forEach(function (faq) {
      var toggle = faq.querySelector(".faq-wrapper.w-dropdown-toggle");
      var content = faq.querySelector(".dropdown-content.w-dropdown-list");

      if (!toggle || !content) {
        return;
      }

      toggle.setAttribute("role", "button");
      toggle.setAttribute("tabindex", "0");

      function closeFaq() {
        faq.classList.remove("w--open");
        toggle.classList.remove("w--open");
        content.classList.remove("w--open");
        toggle.setAttribute("aria-expanded", "false");
        content.style.display = "none";
        faq.style.height = toggle.offsetHeight + "px";
      }

      function openFaq() {
        faqs.forEach(function (item) {
          if (item !== faq) {
            var otherToggle = item.querySelector(".faq-wrapper.w-dropdown-toggle");
            var otherContent = item.querySelector(".dropdown-content.w-dropdown-list");

            item.classList.remove("w--open");
            if (otherToggle) {
              otherToggle.classList.remove("w--open");
              otherToggle.setAttribute("aria-expanded", "false");
            }
            if (otherContent) {
              otherContent.classList.remove("w--open");
              otherContent.style.display = "none";
            }
            if (otherToggle) {
              item.style.height = otherToggle.offsetHeight + "px";
            }
          }
        });

        faq.classList.add("w--open");
        toggle.classList.add("w--open");
        content.classList.add("w--open");
        toggle.setAttribute("aria-expanded", "true");
        content.style.display = "block";
        faq.style.height = toggle.offsetHeight + content.scrollHeight + "px";
      }

      closeFaq();

      toggle.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (faq.classList.contains("w--open")) {
          closeFaq();
        } else {
          openFaq();
        }
      });

      toggle.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle.click();
        }
      });
    });
  }

  function initSliders() {
    var sliders = document.querySelectorAll(".w-slider");

    sliders.forEach(function (slider) {
      var mask = slider.querySelector(".w-slider-mask");
      var slides = Array.prototype.slice.call(slider.querySelectorAll(".w-slide"));
      var prev = slider.querySelector(".w-slider-arrow-left");
      var next = slider.querySelector(".w-slider-arrow-right");
      var nav = slider.querySelector(".w-slider-nav");
      var currentIndex = 0;
      var autoplay = slider.getAttribute("data-autoplay") === "true";
      var delay = parseInt(slider.getAttribute("data-delay") || "5000", 10);
      var timer = null;

      if (!mask || slides.length <= 1) {
        return;
      }

      if (nav && !nav.children.length) {
        slides.forEach(function (_, index) {
          var dot = document.createElement("button");
          dot.type = "button";
          dot.className = "w-slider-dot";
          dot.setAttribute("aria-label", "Go to slide " + (index + 1));
          dot.addEventListener("click", function () {
            goTo(index);
          });
          nav.appendChild(dot);
        });
      }

      var dots = nav
        ? Array.prototype.slice.call(nav.querySelectorAll(".w-slider-dot"))
        : [];

      function render() {
        slides.forEach(function (slide, index) {
          var isActive = index === currentIndex;
          slide.style.display = isActive ? "block" : "none";
          slide.setAttribute("aria-hidden", isActive ? "false" : "true");
        });

        dots.forEach(function (dot, index) {
          dot.classList.toggle("w-active", index === currentIndex);
          dot.setAttribute("aria-pressed", index === currentIndex ? "true" : "false");
        });
      }

      function goTo(index) {
        currentIndex = (index + slides.length) % slides.length;
        render();
        restartAutoplay();
      }

      function restartAutoplay() {
        if (!autoplay) {
          return;
        }

        window.clearInterval(timer);
        timer = window.setInterval(function () {
          goTo(currentIndex + 1);
        }, delay);
      }

      if (prev) {
        prev.setAttribute("role", "button");
        prev.setAttribute("tabindex", "0");
        prev.addEventListener("click", function (event) {
          event.preventDefault();
          goTo(currentIndex - 1);
        });
      }

      if (next) {
        next.setAttribute("role", "button");
        next.setAttribute("tabindex", "0");
        next.addEventListener("click", function (event) {
          event.preventDefault();
          goTo(currentIndex + 1);
        });
      }

      slider.addEventListener("mouseenter", function () {
        window.clearInterval(timer);
      });

      slider.addEventListener("mouseleave", function () {
        restartAutoplay();
      });

      render();
      restartAutoplay();
    });
  }

  function init() {
    if (typeof window.addCountries === "function") {
      window.addCountries("#country");
    }

    initCustomReveal();
    initDropdowns();
    initMobileNav();
    initTabs();
    initFaqs();
    initSliders();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
