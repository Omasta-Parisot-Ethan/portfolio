/**
 * EOP. — Script applicatif principal centralisé
 * Gère :
 * 1. L'animation d'introduction courte et non-bloquante
 * 2. Le header compact et l'indicateur de section active fiable
 * 3. Le menu mobile accessible (clavier, Escape, aria-expanded)
 * 4. Les révélations au défilement via IntersectionObserver
 * 5. Le module interactif des 6 valeurs EOP. (section À propos)
 * 6. Les volets extensibles de compétences (section Savoir-faire)
 * 7. Les panneaux de détails de projets accessibles (modales avec focus trap)
 * 8. La mise en évidence progressive des étapes de la Méthode
 * 9. La parallaxe légère et le curseur carré personnalisé sur desktop
 */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ==========================================================================
     1. ANIMATION D'INTRODUCTION (600 - 1000ms, jouée une seule fois)
     ========================================================================== */
  requestAnimationFrame(() => {
    document.documentElement.classList.add('intro-ready');
  });

  /* ==========================================================================
     2. HEADER COMPACT & INDICATEUR DE SECTION ACTIVE
     ========================================================================== */
  const header = document.getElementById('site-header');
  const headerInner = document.getElementById('header-inner');
  const navLinks = document.querySelectorAll('[data-nav-link]');
  const sections = document.querySelectorAll('section[data-section]');

  let isScrollingTick = false;
  const updateHeaderState = () => {
    if (!header || !headerInner) return;
    if (window.scrollY > 36) {
      header.classList.add('shadow-xs', 'border-eop-dark/30');
      headerInner.classList.remove('h-20');
      headerInner.classList.add('h-16');
    } else {
      header.classList.remove('shadow-xs', 'border-eop-dark/30');
      headerInner.classList.add('h-20');
      headerInner.classList.remove('h-16');
    }
    isScrollingTick = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!isScrollingTick) {
        window.requestAnimationFrame(updateHeaderState);
        isScrollingTick = true;
      }
    },
    { passive: true }
  );
  updateHeaderState();

  if ('IntersectionObserver' in window && sections.length > 0) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const activeId = entry.target.getAttribute('data-section');
            navLinks.forEach((link) => {
              const targetId = link.getAttribute('data-nav-link');
              if (targetId === activeId) {
                link.setAttribute('aria-current', 'true');
                link.classList.add('font-bold', 'text-eop-dark');
              } else {
                link.removeAttribute('aria-current');
                link.classList.remove('font-bold');
              }
            });
          }
        });
      },
      {
        rootMargin: '-35% 0px -55% 0px',
        threshold: 0,
      }
    );

    sections.forEach((sec) => sectionObserver.observe(sec));
  }

  /* ==========================================================================
     3. MENU MOBILE ACCESSIBLE
     ========================================================================== */
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobilePanel = document.getElementById('mobile-menu-panel');
  const burgerLine1 = document.getElementById('burger-line-1');
  const burgerLine2 = document.getElementById('burger-line-2');
  const burgerLine3 = document.getElementById('burger-line-3');
  const mobileLinks = document.querySelectorAll('[data-mobile-link]');

  const setMobileMenuOpen = (isOpen) => {
    if (!mobileToggle || !mobilePanel) return;
    mobileToggle.setAttribute('aria-expanded', String(isOpen));
    mobileToggle.setAttribute(
      'aria-label',
      isOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'
    );

    if (isOpen) {
      mobilePanel.classList.remove('hidden');
      burgerLine1?.classList.add('translate-y-[7px]', 'rotate-45');
      burgerLine2?.classList.add('opacity-0');
      burgerLine3?.classList.add('-translate-y-[7px]', '-rotate-45');
    } else {
      mobilePanel.classList.add('hidden');
      burgerLine1?.classList.remove('translate-y-[7px]', 'rotate-45');
      burgerLine2?.classList.remove('opacity-0');
      burgerLine3?.classList.remove('-translate-y-[7px]', '-rotate-45');
    }
  };

  if (mobileToggle && mobilePanel) {
    mobileToggle.addEventListener('click', () => {
      const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      setMobileMenuOpen(!expanded);
    });

    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => setMobileMenuOpen(false));
    });
  }

  /* ==========================================================================
     4. RÉVÉLATIONS AU DÉFILEMENT & PROGRESSION DE LA MÉTHODE
     ========================================================================== */
  const revealItems = document.querySelectorAll('[data-reveal]');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealItems.forEach((el) => revealObserver.observe(el));
  }

  // Mise en évidence des étapes de la section Méthode
  const methodSteps = document.querySelectorAll('[data-method-step]');
  if ('IntersectionObserver' in window && methodSteps.length > 0) {
    const methodObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const stepNum = entry.target.getAttribute('data-method-step');
          const indicator = document.querySelector(`[data-method-indicator="${stepNum}"]`);
          const bar = document.querySelector(`[data-method-bar="${stepNum}"]`);

          if (entry.isIntersecting) {
            entry.target.classList.add('border-eop-rose', 'shadow-[5px_5px_0px_#e8bce9]');
            indicator?.classList.add('bg-eop-rose', 'scale-110');
            bar?.classList.remove('scale-x-0');
            bar?.classList.add('scale-x-100');
          }
        });
      },
      {
        threshold: 0.35,
      }
    );

    methodSteps.forEach((step) => methodObserver.observe(step));
  }

  /* ==========================================================================
     5. MODULE INTERACTIF DES 6 VALEURS EOP. (SECTION À PROPOS)
     ========================================================================== */
  const valueTabs = document.querySelectorAll('[data-value-tab]');
  const valuePanels = document.querySelectorAll('[data-value-panel]');

  valueTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetValue = tab.getAttribute('data-value-tab');

      valueTabs.forEach((btn) => {
        const isCurrent = btn.getAttribute('data-value-tab') === targetValue;
        btn.setAttribute('aria-selected', String(isCurrent));
        if (isCurrent) {
          btn.classList.add('bg-eop-dark', 'text-eop-offwhite', 'shadow-[3px_3px_0px_#e8bce9]');
          btn.classList.remove('bg-eop-offwhite', 'text-eop-dark', 'hover:bg-eop-rose/60');
        } else {
          btn.classList.remove('bg-eop-dark', 'text-eop-offwhite', 'shadow-[3px_3px_0px_#e8bce9]');
          btn.classList.add('bg-eop-offwhite', 'text-eop-dark', 'hover:bg-eop-rose/60');
        }
      });

      valuePanels.forEach((panel) => {
        if (panel.getAttribute('data-value-panel') === targetValue) {
          panel.classList.remove('hidden');
          panel.classList.add('block');
        } else {
          panel.classList.add('hidden');
          panel.classList.remove('block');
        }
      });
    });
  });

  /* ==========================================================================
     6. MODULES EXTENSIBLES DE COMPÉTENCES
     ========================================================================== */
  const skillToggles = document.querySelectorAll('[data-skill-toggle]');
  skillToggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const targetId = toggle.getAttribute('data-skill-toggle');
      const targetPanel = targetId ? document.getElementById(targetId) : null;
      const icon = toggle.querySelector('[data-skill-icon]');
      if (!targetPanel) return;

      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isExpanded));
      targetPanel.classList.toggle('hidden', isExpanded);
      if (icon) {
        icon.textContent = isExpanded ? '+' : '−';
        icon.classList.toggle('bg-eop-rose', !isExpanded);
      }
    });
  });

  /* ==========================================================================
     7. PANNEAUX DE DÉTAILS DE PROJETS ACCESSIBLES (MODALES & CLAVIER)
     ========================================================================== */
  const projectOpenButtons = document.querySelectorAll('[data-project-open]');
  let activeModal = null;
  let lastFocusedTrigger = null;

  const closeProjectModal = () => {
    if (!activeModal) return;
    activeModal.classList.add('hidden');
    activeModal.classList.remove('flex');
    activeModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocusedTrigger) {
      lastFocusedTrigger.focus();
    }
    activeModal = null;
  };

  projectOpenButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const projectId = button.getAttribute('data-project-open');
      const modal = document.querySelector(`[data-project-modal="${projectId}"]`);
      if (!modal) return;

      lastFocusedTrigger = button;
      activeModal = modal;
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      const closeBtn = modal.querySelector('[data-project-close]');
      closeBtn?.focus();
    });
  });

  document.querySelectorAll('[data-project-modal]').forEach((modal) => {
    // Fermeture via boutons dédiés
    modal.querySelectorAll('[data-project-close]').forEach((btn) => {
      btn.addEventListener('click', closeProjectModal);
    });

    // Fermeture au clic sur l'arrière-plan
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeProjectModal();
      }
    });
  });

  // Gestion globale de la touche Escape et du piégeage de focus dans la modale
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (activeModal) {
        closeProjectModal();
      } else if (mobileToggle?.getAttribute('aria-expanded') === 'true') {
        setMobileMenuOpen(false);
        mobileToggle.focus();
      }
    }

    if (event.key === 'Tab' && activeModal) {
      const focusable = activeModal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  /* ==========================================================================
     8. PARALLAXE LÉGÈRE SUR LES MODULES DU HERO (DESKTOP UNIQUEMENT)
     ========================================================================== */
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  if (!prefersReducedMotion && isFinePointer && window.innerWidth >= 1024 && parallaxElements.length > 0) {
    const heroSection = document.getElementById('accueil');
    heroSection?.addEventListener(
      'mousemove',
      (event) => {
        const rect = heroSection.getBoundingClientRect();
        const relX = event.clientX - rect.left - rect.width / 2;
        const relY = event.clientY - rect.top - rect.height / 2;

        parallaxElements.forEach((el) => {
          const factor = parseFloat(el.getAttribute('data-parallax') || '0.02');
          const moveX = (relX * factor).toFixed(1);
          const moveY = (relY * factor).toFixed(1);
          el.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
        });
      },
      { passive: true }
    );

    heroSection?.addEventListener('mouseleave', () => {
      parallaxElements.forEach((el) => {
        el.style.transform = 'translate3d(0, 0, 0)';
      });
    });
  }

  /* ==========================================================================
     9. CURSEUR CARRÉ PERSONNALISÉ DISCRET (DESKTOP POINTEUR FIN)
     ========================================================================== */
  const cursor = document.getElementById('eop-cursor');
  if (cursor && !prefersReducedMotion && isFinePointer) {
    let cursorX = -100;
    let cursorY = -100;
    let rafPending = false;

    const renderCursor = () => {
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
      rafPending = false;
    };

    window.addEventListener(
      'mousemove',
      (event) => {
        cursorX = event.clientX;
        cursorY = event.clientY;
        cursor.classList.add('is-active');
        if (!rafPending) {
          requestAnimationFrame(renderCursor);
          rafPending = true;
        }
      },
      { passive: true }
    );

    document.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-active');
    });

    const interactiveSelectors = 'a, button, [role="tab"]';
    document.querySelectorAll(interactiveSelectors).forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
    });
  }
});
