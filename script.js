function qs(sel, parent) {
  return (parent || document).querySelector(sel);
}

function qsa(sel, parent) {
  return Array.prototype.slice.call((parent || document).querySelectorAll(sel));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getHeaderOffset() {
  var header = qs(".header");
  if (!header) return 0;
  return header.getBoundingClientRect().height;
}

function setActiveNav(id) {
  var links = qsa(".nav__link, .sideNav__link");
  for (var i = 0; i < links.length; i++) {
    var a = links[i];
    var href = a.getAttribute("href") || "";
    var isActive = href === "#" + id;
    a.classList.toggle("is-active", isActive);
    if (isActive) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
}

function initYear() {
  var el = qs("#year");
  if (!el) return;
  el.textContent = String(new Date().getFullYear());
}

function initThemeToggle() {
  var btn = qs("#themeToggle");
  if (!btn) return;

  var root = document.documentElement;

  function getPreferredTheme() {
    var stored = "";
    try {
      stored = String(localStorage.getItem("theme") || "");
    } catch (e) {}

    if (stored === "light" || stored === "dark") return stored;
    return "dark";
  }

  function applyTheme(theme) {
    var t = theme === "light" ? "light" : "dark";
    root.setAttribute("data-theme", t);
    btn.setAttribute("aria-pressed", t === "light" ? "true" : "false");
    btn.setAttribute("aria-label", t === "light" ? "Aktifkan mode gelap" : "Aktifkan mode terang");

    var icon = qs("i", btn);
    if (icon) icon.className = t === "light" ? "ri-moon-line" : "ri-sun-line";
  }

  applyTheme(getPreferredTheme());

  btn.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
  });
}

function initMobileMenu() {
  var toggle = qs(".nav__toggle");
  var menu = qs("#navMenu");
  if (!toggle || !menu) return;

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    menu.classList.toggle("is-open", open);
    document.documentElement.classList.toggle("nav-open", open);
  }

  function isOpen() {
    return toggle.getAttribute("aria-expanded") === "true";
  }

  toggle.addEventListener("click", function () {
    setOpen(!isOpen());
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });

  qsa(".nav__link", menu).forEach(function (a) {
    a.addEventListener("click", function () {
      setOpen(false);
    });
  });
}

function initScrollReveal() {
  var items = qsa("[data-reveal]");
  if (!items.length) return;

  function reveal() {
    var viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      if (el.classList.contains("is-revealed")) continue;
      var rect = el.getBoundingClientRect();
      if (rect.top <= viewportH - 90) el.classList.add("is-revealed");
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      reveal();
    });
  }

  window.addEventListener("scroll", onScroll);
  window.addEventListener("resize", onScroll);
  reveal();
}

function initScrollSpy() {
  var sections = qsa("main section[id]");
  if (!sections.length) return;

  function getCurrentSectionId() {
    var offset = clamp(getHeaderOffset(), 56, 96) + 22;
    var probe = offset;
    var current = sections[0].id || "home";

    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      var rect = s.getBoundingClientRect();
      if (rect.top <= probe && rect.bottom > probe) {
        current = s.id;
        break;
      }
      if (rect.top <= probe) current = s.id;
    }
    return current;
  }

  function update() {
    setActiveNav(getCurrentSectionId());
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      update();
    });
  }

  window.addEventListener("scroll", onScroll);
  window.addEventListener("resize", onScroll);
  update();
}

function initBackToTop() {
  var btn = qs("#toTop");
  if (!btn) return;

  function update() {
    var show = window.scrollY > 700;
    btn.classList.toggle("is-visible", show);
  }

  window.addEventListener("scroll", update);
  update();
}

function initContactForm() {
  var form = qs("#contactForm");
  var hint = qs("#formHint");
  if (!form) return;

  function setHint(text) {
    if (!hint) return;
    hint.textContent = text || "";
  }

  function isFormspreeConfigured(action) {
    var a = String(action || "").trim();
    if (!a) return false;
    if (a.indexOf("formspree.io") === -1) return false;
    if (a.indexOf("PASTE_ID_DISINI") !== -1) return false;
    return a.indexOf("http://") === 0 || a.indexOf("https://") === 0;
  }

  function setSubmitting(submitting) {
    var btn = qs('button[type="submit"]', form);
    if (btn) btn.disabled = !!submitting;
  }

  function upsertFormData(fd, key, value) {
    if (!fd) return;
    if (typeof fd.set === "function") fd.set(key, value);
    else fd.append(key, value);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var name = String(form.elements.name && form.elements.name.value ? form.elements.name.value : "").trim();
    var email = String(form.elements.email && form.elements.email.value ? form.elements.email.value : "").trim();
    var subject = String(form.elements.subject && form.elements.subject.value ? form.elements.subject.value : "").trim();
    var message = String(form.elements.message && form.elements.message.value ? form.elements.message.value : "").trim();

    if (!name || !email || !subject || !message) {
      setHint("Lengkapi semua field agar pesan bisa dikirim.");
      return;
    }

    var fullSubject = subject + " — dari " + name;
    var action = String(form.getAttribute("action") || "").trim();

    if (isFormspreeConfigured(action) && window.fetch && window.FormData) {
      var fd = new FormData(form);
      upsertFormData(fd, "subject", fullSubject);
      if (form.elements._subject) upsertFormData(fd, "_subject", fullSubject);

      setHint("Mengirim...");
      setSubmitting(true);

      window
        .fetch(action, {
          method: "POST",
          body: fd,
          headers: { Accept: "application/json" },
        })
        .then(function (res) {
          if (res && res.ok) return { ok: true };
          return res && res.json
            ? res.json().then(function (data) {
                return { ok: false, data: data };
              })
            : { ok: false };
        })
        .then(function (result) {
          if (result && result.ok) {
            setHint("Terkirim. Terima kasih!");
            form.reset();
            return;
          }

          var msg = "Gagal mengirim. Coba lagi atau hubungi lewat email/telepon.";
          if (result && result.data && result.data.errors && result.data.errors.length) {
            msg = String(result.data.errors[0].message || msg);
          }
          setHint(msg);
        })
        .catch(function () {
          setHint("Gagal mengirim. Periksa koneksi internet lalu coba lagi.");
        })
        .then(function () {
          setSubmitting(false);
        });
      return;
    }

    var to = "erikafiqrizha@gmail.com";
    var body =
      "Nama: " +
      name +
      "\nEmail: " +
      email +
      "\n\n" +
      message +
      "\n\n" +
      "Dikirim dari website CV/portofolio.";

    var url =
      "mailto:" +
      encodeURIComponent(to) +
      "?subject=" +
      encodeURIComponent(fullSubject) +
      "&body=" +
      encodeURIComponent(body);

    if (!isFormspreeConfigured(action)) setHint("Form belum terhubung ke layanan email. Membuka draft email...");
    else setHint("Membuka draft email...");
    window.location.href = url;
  });
}

function initProfileFallback() {
  var img = qs(".profileCard__img");
  var fallback = qs(".profileCard__fallback");
  if (!img || !fallback) return;

  function showFallback() {
    fallback.style.display = "grid";
  }

  function hideFallback() {
    fallback.style.display = "none";
  }

  if (img.complete && img.naturalWidth > 0) {
    hideFallback();
  } else {
    showFallback();
  }

  img.addEventListener("load", hideFallback);
  img.addEventListener("error", showFallback);
}

function initExpSwitch() {
  var roots = qsa("[data-exp-switch]");
  if (!roots.length) return;

  roots.forEach(function (root) {
    var tabs = qsa('[role="tab"]', root);
    var panels = qsa('[role="tabpanel"]', root);
    if (!tabs.length || !panels.length) return;

    function setActive(nextIndex) {
      var idx = clamp(nextIndex, 0, tabs.length - 1);
      for (var i = 0; i < tabs.length; i++) {
        var isActive = i === idx;
        var tab = tabs[i];
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
        tab.tabIndex = isActive ? 0 : -1;

        var panelId = tab.getAttribute("aria-controls") || "";
        var panel = panelId ? qs("#" + panelId) : null;
        if (!panel) panel = panels[i] || null;
        if (!panel) continue;
        panel.classList.toggle("is-active", isActive);
        if (isActive) panel.removeAttribute("hidden");
        else panel.setAttribute("hidden", "");
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        setActive(i);
      });

      tab.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setActive(i + 1);
          tabs[clamp(i + 1, 0, tabs.length - 1)].focus();
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setActive(i - 1);
          tabs[clamp(i - 1, 0, tabs.length - 1)].focus();
        }
      });
    });

    var initial = 0;
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].classList.contains("is-active")) initial = i;
    }
    setActive(initial);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.body.classList.add("is-loaded");
  initYear();
  initThemeToggle();
  initMobileMenu();
  initScrollReveal();
  initScrollSpy();
  initBackToTop();
  initContactForm();
  initProfileFallback();
  initExpSwitch();
});
