/**
 * EOP. — Interactions des nouvelles pages (galerie, études de cas, parcours, contact)
 * Complète main.js (révélations au défilement, header, curseur) sans le modifier.
 * 1. Barre de progression de lecture
 * 2. Rail de chapitres des études de cas (chapitre actif)
 * 3. Carte synchronisée avec le défilement
 * 4. Tracés qui se dessinent à l'apparition
 * 5. Léger déplacement des visuels au survol (ordinateur uniquement)
 * 6. Copie de l'adresse e-mail
 */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasIO = 'IntersectionObserver' in window;

  /* 1. Progression de lecture */
  const bar = document.getElementById('reading-progress');
  if (bar) {
    let ticking = false;
    const update = () => {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      const ratio = max > 0 ? Math.min(1, root.scrollTop / max) : 0;
      bar.style.transform = `scaleX(${ratio.toFixed(4)})`;
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    window.addEventListener('resize', update);
    update();
  }

  /* 2. Chapitre actif */
  const chapters = document.querySelectorAll('[data-chapter]');
  const chapterLinks = document.querySelectorAll('[data-chapter-link]');
  const rail = document.querySelector('[data-chapter-rail]');
  if (hasIO && chapters.length > 0 && chapterLinks.length > 0) {
    const setActive = (id) => {
      chapterLinks.forEach((link) => {
        if (link.getAttribute('data-chapter-link') === id) {
          link.setAttribute('aria-current', 'step');
          if (rail && rail.scrollWidth > rail.clientWidth) {
            rail.scrollTo({
              left: link.offsetLeft - rail.clientWidth / 2 + link.clientWidth / 2,
              behavior: reduce ? 'auto' : 'smooth',
            });
          }
        } else {
          link.removeAttribute('aria-current');
        }
      });
    };
    const chapterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.getAttribute('data-chapter'));
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    chapters.forEach((chapter) => chapterObserver.observe(chapter));
  }

  /* 3. Carte synchronisée avec une liste d'étapes */
  document.querySelectorAll('[data-sync-scope]').forEach((scope) => {
    const rows = scope.querySelectorAll('[data-sync-row]');
    const targets = scope.querySelectorAll('[data-sync-target]');
    if (rows.length === 0) return;

    if (reduce || !hasIO) {
      targets.forEach((target) => target.classList.add('is-on'));
      return;
    }

    const apply = (n) => {
      targets.forEach((target) => {
        target.classList.toggle('is-on', Number(target.getAttribute('data-sync-target')) <= n);
      });
      rows.forEach((row) => {
        row.classList.toggle('is-current', Number(row.getAttribute('data-sync-row')) === n);
      });
    };

    const syncObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) apply(Number(entry.target.getAttribute('data-sync-row')));
        });
      },
      { rootMargin: '-40% 0px -50% 0px' }
    );
    rows.forEach((row) => syncObserver.observe(row));
  });

  /* 4. Tracés qui se dessinent */
  const draws = document.querySelectorAll('[data-draw]');
  if (reduce || !hasIO) {
    draws.forEach((el) => el.classList.add('is-drawn'));
  } else {
    const drawObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-drawn');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    draws.forEach((el) => drawObserver.observe(el));
  }

  /* 5. Déplacement subtil des visuels de la galerie (ordinateur, souris) */
  if (finePointer && !reduce) {
    document.querySelectorAll('[data-tilt-zone]').forEach((zone) => {
      const inner = zone.querySelector('[data-tilt]');
      if (!inner) return;
      zone.addEventListener(
        'mousemove',
        (event) => {
          const rect = zone.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
          const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
          inner.style.transform = `translate3d(${(x * -8).toFixed(1)}px, ${(y * -6).toFixed(1)}px, 0) scale(1.04)`;
        },
        { passive: true }
      );
      zone.addEventListener('mouseleave', () => {
        inner.style.transform = '';
      });
    });
  }

  /* 6. Copie de l'adresse e-mail */
  document.querySelectorAll('[data-copy]').forEach((button) => {
    const label = button.querySelector('[data-copy-label]');
    const original = label ? label.textContent : '';
    button.addEventListener('click', async () => {
      let message = 'Adresse copiée';
      try {
        await navigator.clipboard.writeText(button.getAttribute('data-copy') || '');
      } catch (error) {
        message = 'Copie impossible : sélectionnez l’adresse';
      }
      if (label) label.textContent = message;
      window.setTimeout(() => {
        if (label) label.textContent = original;
      }, 2200);
    });
  });

  /* ======================================================================
     Entrée en scène, profondeur et Parcours (les pages sans ces éléments
     ne déclenchent rien : chaque bloc vérifie la présence de ses cibles)
     ====================================================================== */
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* 7. Profondeur du hero : curseur (plx-p) et défilement (plx-s) — grand écran, souris */
  const hero = document.querySelector('[data-hero]');
  if (hero && !reduce && finePointer && window.matchMedia('(min-width: 1024px)').matches) {
    let scrollTick = false;
    const updateHero = () => {
      hero.style.setProperty('--hp', clamp(window.scrollY / (hero.offsetHeight || 1)).toFixed(3));
      scrollTick = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!scrollTick) {
          scrollTick = true;
          requestAnimationFrame(updateHero);
        }
      },
      { passive: true }
    );
    updateHero();

    let moveTick = false;
    let mx = 0;
    let my = 0;
    hero.addEventListener(
      'pointermove',
      (event) => {
        const rect = hero.getBoundingClientRect();
        mx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        my = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        if (!moveTick) {
          moveTick = true;
          requestAnimationFrame(() => {
            hero.style.setProperty('--mx', mx.toFixed(3));
            hero.style.setProperty('--my', my.toFixed(3));
            moveTick = false;
          });
        }
      },
      { passive: true }
    );
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--mx', '0');
      hero.style.setProperty('--my', '0');
    });
  }

  /* 8. Titres de section : révélation mot par mot (le texte d'origine reste dans aria-label) */
  const wordTargets = document.querySelectorAll('[data-words]');
  if (!reduce && hasIO && wordTargets.length > 0) {
    const wordObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('words-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    wordTargets.forEach((el) => {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      el.setAttribute('aria-label', text);
      el.textContent = '';
      const words = text.split(' ');
      words.forEach((word, i) => {
        const outer = document.createElement('span');
        outer.className = 'wd';
        outer.setAttribute('aria-hidden', 'true');
        const inner = document.createElement('span');
        inner.textContent = word;
        inner.style.setProperty('--i', String(i));
        outer.appendChild(inner);
        el.appendChild(outer);
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      });
      el.classList.add('words-ready');
      wordObserver.observe(el);
    });
  }

  /* 9. Rideau au départ : navigation entre les pages Projets / Parcours / Contact */
  const veil = document.querySelector('[data-veil]');
  if (veil && !reduce) {
    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!link || link.target || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (!/^\/(projects|parcours|contact)(\/|$)/.test(url.pathname)) return;
      if (url.pathname === window.location.pathname) return;
      event.preventDefault();
      if (veil.classList.contains('is-leaving')) return;
      try {
        sessionStorage.setItem('eop-veil', '1');
      } catch (error) {
        /* stockage indisponible : la page d'arrivée n'aura simplement pas de rideau */
      }
      veil.classList.add('is-leaving');
      window.setTimeout(() => window.location.assign(url.href), 650);
      window.setTimeout(() => veil.classList.remove('is-leaving'), 4000);
    });
    // Retour arrière (cache de navigation) : ne jamais laisser le rideau fermé
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        veil.classList.remove('is-leaving');
        try {
          sessionStorage.removeItem('eop-veil');
        } catch (error) {
          /* ignoré */
        }
      }
    });
  }

  /* 10. Boutons : léger effet d'attraction du curseur */
  if (finePointer && !reduce) {
    document.querySelectorAll('main .eop-btn-primary, main .eop-btn-secondary').forEach((button) => {
      button.addEventListener(
        'pointermove',
        (event) => {
          const rect = button.getBoundingClientRect();
          const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
          const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
          button.style.translate = `${(dx * 10).toFixed(1)}px ${(dy * 8).toFixed(1)}px`;
        },
        { passive: true }
      );
      button.addEventListener('pointerleave', () => {
        button.style.translate = '';
      });
    });
  }

  /* 11. Finale : le portail s'ouvre à l'arrivée sur la section */
  const portal = document.querySelector('[data-portal]');
  if (portal && !reduce) {
    const panel = portal.querySelector('[data-portal-panel]');
    if (panel) {
      let portalTick = false;
      const updatePortal = () => {
        const rect = portal.getBoundingClientRect();
        const span = Math.min(window.innerHeight * 0.95, rect.height * 0.8);
        panel.style.setProperty('--q', clamp((window.innerHeight - rect.top) / span).toFixed(3));
        portalTick = false;
      };
      window.addEventListener(
        'scroll',
        () => {
          if (!portalTick) {
            portalTick = true;
            requestAnimationFrame(updatePortal);
          }
        },
        { passive: true }
      );
      window.addEventListener('resize', updatePortal);
      updatePortal();
    }
  }

  /* 12. Parcours : une scène épinglée où le carré du logo se construit (grand écran uniquement).
     Le défilement reste naturel. Sans JavaScript, sur mobile ou en mouvement réduit,
     les quatre étapes s'affichent empilées. */
  const journeyRoot = document.querySelector('[data-journey]');
  if (journeyRoot && !reduce) {
    const track = journeyRoot.querySelector('[data-journey-track]');
    const stage = journeyRoot.querySelector('[data-journey-stage]');
    const stations = Array.from(journeyRoot.querySelectorAll('[data-station]'));
    const square = journeyRoot.querySelector('[data-journey-square]');
    const dark = journeyRoot.querySelector('[data-journey-dark]');
    const band = journeyRoot.querySelector('[data-journey-band]');
    const svg = band ? band.querySelector('svg') : null;
    const base = band ? band.querySelector('[data-journey-base]') : null;
    const prog = band ? band.querySelector('[data-journey-prog]') : null;
    const marker = band ? band.querySelector('[data-journey-marker]') : null;
    const nodes = band ? Array.from(band.querySelectorAll('[data-journey-node]')) : [];

    if (track && stage && square && dark && svg && base && prog && marker && stations.length === 4 && nodes.length === 4) {
      const query = window.matchMedia('(min-width: 1024px) and (min-height: 620px)');
      // Position du carré à chaque étape : x et y en % de la scène, échelle, rotation
      const anchors = [
        { x: 76, y: 44, s: 0.9, r: 0 },
        { x: 74, y: 44, s: 1, r: 0 },
        { x: 78, y: 42, s: 0.95, r: 0 },
        { x: 85, y: 36, s: 0.68, r: 0 },
        { x: 74, y: 46, s: 1.12, r: 90 },
      ];
      let pinned = false;
      let ticking = false;
      let total = 1;
      let nodeAt = [0.12, 0.38, 0.64, 0.88];
      let bounds = [0, 0.25, 0.51, 0.76, 1];

      // Dessine l'escalier à la taille réelle de la bande (aucune déformation du trait)
      const measure = () => {
        const w = band.clientWidth;
        const h = band.clientHeight;
        if (!w || !h) return;
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        const xs = [0, 0.25, 0.5, 0.75, 1].map((f) => f * w);
        const ys = [0.9, 0.62, 0.34, 0.06].map((f) => f * h);
        const d = `M${xs[0]},${ys[0]} H${xs[1]} V${ys[1]} H${xs[2]} V${ys[2]} H${xs[3]} V${ys[3]} H${xs[4]}`;
        base.setAttribute('d', d);
        prog.setAttribute('d', d);
        total = base.getTotalLength();
        const run = xs[1] - xs[0];
        const rise = ys[0] - ys[1];
        const centers = [run / 2, run + rise + run / 2, 2 * (run + rise) + run / 2, 3 * (run + rise) + run / 2];
        nodeAt = centers.map((c) => c / total);
        bounds = [0, (nodeAt[0] + nodeAt[1]) / 2, (nodeAt[1] + nodeAt[2]) / 2, (nodeAt[2] + nodeAt[3]) / 2, 1];
        nodes.forEach((node, i) => {
          const point = base.getPointAtLength(centers[i]);
          node.style.translate = `${point.x}px ${point.y}px`;
        });
      };

      const update = () => {
        ticking = false;
        if (!pinned) return;
        const rect = track.getBoundingClientRect();
        const max = rect.height - window.innerHeight;
        const p = max > 0 ? clamp(-rect.top / max) : 0;

        // Ligne et repère
        prog.style.strokeDashoffset = String(1 - p);
        const point = base.getPointAtLength(p * total);
        marker.style.translate = `${point.x}px ${point.y}px`;
        nodes.forEach((node, i) => node.classList.toggle('is-on', p >= nodeAt[i] - 0.002));

        // Étapes : fondu enchaîné et glissement de part et d'autre de chaque frontière
        const w = 0.035;
        stations.forEach((el, i) => {
          const inT = i === 0 ? 1 : smooth(clamp((p - (bounds[i] - w)) / (2 * w)));
          const outT = i === stations.length - 1 ? 0 : smooth(clamp((p - (bounds[i + 1] - w)) / (2 * w)));
          const a = inT * (1 - outT);
          el.style.setProperty('--a', a.toFixed(3));
          el.style.setProperty('--x', ((1 - inT) * 70 - outT * 70).toFixed(1));
          const on = a > 0.5;
          if (el._on !== on) {
            el._on = on;
            el.classList.toggle('is-active', on);
            el.querySelectorAll('a, button').forEach((f) => (on ? f.removeAttribute('tabindex') : f.setAttribute('tabindex', '-1')));
          }
        });

        // Le carré du logo : le cœur, puis le carré clair, puis le cadre
        const grow = (from, to) => smooth(clamp((p - from) / (to - from)));
        square.style.setProperty('--sa', grow(0.01, bounds[1] - 0.03).toFixed(3));
        square.style.setProperty('--sb', grow(bounds[1] - 0.01, bounds[2] - 0.03).toFixed(3));
        square.style.setProperty('--sc', grow(bounds[2] - 0.01, bounds[3] - 0.03).toFixed(3));
        let k = 0;
        while (k < anchors.length - 2 && p > bounds[k + 1]) k += 1;
        const t = smooth(clamp((p - bounds[k]) / (bounds[k + 1] - bounds[k])));
        const from = anchors[k];
        const to = anchors[k + 1];
        square.style.setProperty('--sq-x', lerp(from.x, to.x, t).toFixed(2));
        square.style.setProperty('--sq-y', lerp(from.y, to.y, t).toFixed(2));
        square.style.setProperty('--sq-s', lerp(from.s, to.s, t).toFixed(3));
        square.style.setProperty('--sq-r', `${lerp(from.r, to.r, t).toFixed(1)}deg`);

        // Dernière étape : la scène bascule sur fond sombre
        const night = grow(bounds[3] - w, bounds[3] + w);
        dark.style.opacity = night.toFixed(3);
        stage.classList.toggle('is-dark', night > 0.5);
        stage.style.setProperty('--hint', String(1 - clamp(p / 0.04)));
      };

      const schedule = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      };

      const enable = () => {
        if (pinned) return;
        pinned = true;
        journeyRoot.classList.add('journey--pinned');
        measure();
        update();
      };

      const disable = () => {
        if (!pinned) return;
        pinned = false;
        journeyRoot.classList.remove('journey--pinned');
        stage.classList.remove('is-dark');
        stage.style.removeProperty('--hint');
        stations.forEach((el) => {
          el.style.removeProperty('--a');
          el.style.removeProperty('--x');
          el.classList.remove('is-active');
          el._on = undefined;
          el.querySelectorAll('a, button').forEach((f) => f.removeAttribute('tabindex'));
        });
        ['--sq-x', '--sq-y', '--sq-s', '--sq-r', '--sa', '--sb', '--sc'].forEach((name) => square.style.removeProperty(name));
        dark.style.opacity = '';
        prog.style.strokeDashoffset = '';
      };

      const sync = () => (query.matches ? enable() : disable());
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', () => {
        if (pinned) {
          measure();
          schedule();
        }
      });
      if (query.addEventListener) query.addEventListener('change', sync);
      else if (query.addListener) query.addListener(sync);
      sync();
    }
  }
})();
