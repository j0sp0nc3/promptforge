/**
 * Promptometer Design System — Icon Registry
 * Custom 24px stroke grid · 1.5px stroke · currentColor — NO EMOJIS.
 * Usage: PMIcons.svg(name) → markup string; PMIcons.mount(root) upgrades
 *        all <span data-icon="name"></span> placeholders inside root.
 */
(function (global) {
  'use strict';

  const S = 'stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"';

  const ICONS = {
    /* navigation / product */
    gauge: `<circle cx="12" cy="13" r="8"/><path d="M12 13l3.5-3.5"/><path d="M12 5V3M4 13H2m20 0h-2"/>`,
    flask: `<path d="M9 3h6M10 3v5l-5.2 8.2A2 2 0 0 0 6.5 19.5h11a2 2 0 0 0 1.7-3.3L14 8V3"/><path d="M7.5 14h9"/>`,
    clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>`,
    book: `<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M19 3v16"/>`,
    radar: `<circle cx="12" cy="12" r="2"/><path d="M12 12 6 6"/><path d="M5 12a7 7 0 0 1 7-7M12 5a7 7 0 0 1 7 7M3 12a9 9 0 0 1 9-9M12 3a9 9 0 0 1 9 9"/>`,
    trophy: `<path d="M8 4h8v6a4 4 0 0 1-8 0z"/><path d="M8 6H5a1 1 0 0 0-1 1c0 2 2 3 4 3M16 6h3a1 1 0 0 1 1 1c0 2-2 3-4 3"/><path d="M12 14v3M9 20h6M10 17h4"/>`,
    orbit: `<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="9" ry="4.5" transform="rotate(-30 12 12)"/>`,
    /* actions */
    bolt: `<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>`,
    sparkle: `<path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>`,
    scan: `<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M4 12h16"/>`,
    paste: `<rect x="6" y="4" width="12" height="16" rx="1"/><path d="M9 4h6M12 4v6l-1.5-1.5M12 10l1.5-1.5" transform="rotate(90 12 7)"/>`,
    trash: `<path d="M4 7h16M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/><path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12"/><path d="M10 11v5M14 11v5"/>`,
    download: `<path d="M12 4v12M7 11l5 5 5-5"/><path d="M5 20h14"/>`,
    copy: `<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 4H6a2 2 0 0 0-2 2v10"/>`,
    check: `<path d="M5 13l4 4L19 7"/>`,
    x: `<path d="M6 6l12 12M18 6L6 18"/>`,
    /* feedback */
    info: `<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>`,
    warn: `<path d="M12 3 2.5 19.5a1 1 0 0 0 .9 1.5h17.2a1 1 0 0 0 .9-1.5z" transform="scale(.9) translate(1.3 1.3)"/><path d="M12 9v4M12 16h.01"/>`,
    shield: `<path d="M12 3l7 2.5v5C19 15 16 19 12 21c-4-2-7-6-7-10.5v-5z"/><path d="M9 12l2 2 4-4"/>`,
    target: `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>`,
    /* misc */
    globe: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9S14.5 18.3 12 21c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>`,
    moon: `<path d="M20 14A8.5 8.5 0 0 1 10 4a8.5 8.5 0 1 0 10 10z"/>`,
    sun: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`,
    layers: `<path d="M12 3 3 8l9 5 9-5z"/><path d="M3 13l9 5 9-5"/>`,
    grid: `<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>`,
    play: `<path d="M7 5v14l12-7z"/>`,
    pause: `<path d="M8 5v14M16 5v14"/>`,
    chevL: `<path d="M15 6l-6 6 6 6"/>`,
    chevR: `<path d="M9 6l6 6-6 6"/>`,
    search: `<circle cx="11" cy="11" r="7"/><path d="M20 20l-4.5-4.5"/>`,
    code: `<path d="M8 6 3 12l5 6M16 6l5 6-5 6"/>`,
    terminal: `<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M12.5 15h4"/>`,
    token: `<circle cx="12" cy="12" r="8"/><path d="M12 6v12M9 8.5h4.5a2 2 0 0 1 0 5H9a2 2 0 0 0 0 5h4.5" transform="translate(-1.5 0)"/>`
  };

  function svg(name, cls) {
    const body = ICONS[name];
    if (!body) return '';
    return `<svg class="icon ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true" ${S}>${body}</svg>`;
  }

  function mount(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(el => {
      const name = el.getAttribute('data-icon');
      const size = el.getAttribute('data-icon-size') || '';
      const markup = svg(size === 'xl' ? name : name, size === 's' ? 'icon--s' : size === 'l' ? 'icon--l' : size === 'xl' ? 'icon--xl' : '');
      if (markup) { el.innerHTML = markup; el.removeAttribute('data-icon-skip'); }
    });
  }

  const PMIcons = { svg, mount, names: Object.freeze(Object.keys(ICONS)) };
  global.PMIcons = PMIcons;
})(typeof window !== 'undefined' ? window : globalThis);
