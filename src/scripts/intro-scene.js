/**
 * Fichier : src/scripts/intro-scene.js
 * Scène d'introduction animée :
 * - Rendu 3D Three.js (Carnet ouvert en perspective 3/4 + Crayon posé naturellement sur les pages)
 * - Animation d'écriture manuscrite (« Tout commence par une idée ») avec suivi de pointe
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const PHRASE_EXACTE = 'Tout commence par une idée';

function initIntroScene() {
  const section = document.getElementById('intro-scene');
  if (!section || section.dataset.initialized === 'true') return;
  section.dataset.initialized = 'true';

  const canvasContainer = document.getElementById('intro-canvas-container');
  const canvas = document.getElementById('intro-3d-canvas');
  const phaseIndicator = document.getElementById('intro-phase-indicator');
  const skipBtn = document.getElementById('skip-intro-btn');
  const skipLabel = document.getElementById('skip-intro-label');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let isSkippedOrDone = false;
  let writingRafId = null;
  let threeController = null;

  const setPhaseText = (text) => {
    if (phaseIndicator) phaseIndicator.textContent = text;
  };

  // 1. Initialisation du rendu 3D (Phase 1)
  if (canvas && canvasContainer) {
    threeController = createThreeNotebookScene({
      section,
      container: canvasContainer,
      canvas,
      prefersReducedMotion,
    });
  }

  // 2. Si l'utilisateur préfère réduire les animations : état final immédiat
  if (prefersReducedMotion) {
    completeIntroImmediately({ scrollToHero: false });
    if (skipBtn) {
      skipBtn.addEventListener('click', () => scrollToNextSection(section));
    }
    return;
  }

  // 3. Lancement séquencé : Phase 1 (Carnet 3D) -> Phase 2 (Écriture manuscrite) -> Phase 3 & 4
  setPhaseText('PHASE 01 — OUVERTURE DU CARNET');

  const handwritingController = createHandwritingAnimator({
    section,
    onStartWriting: () => {
      if (!isSkippedOrDone) {
        setPhaseText('PHASE 02 — NAISSANCE DE L’IDÉE');
      }
    },
    onFinishWriting: () => {
      if (isSkippedOrDone) return;
      isSkippedOrDone = true;
      section.classList.add('writing-complete', 'pen-finished');
      section.classList.remove('pen-visible');
      setPhaseText('PHASE 03 — PRÊT À EXPLORER');
      if (skipLabel) skipLabel.textContent = 'Découvrir le portfolio';
    },
  });

  // Démarrage de l'écriture après l'émergence initiale du carnet (Phase 1 -> Phase 2)
  const startTimer = window.setTimeout(() => {
    if (!isSkippedOrDone) {
      handwritingController.start();
    }
  }, 950);

  function completeIntroImmediately({ scrollToHero = false } = {}) {
    isSkippedOrDone = true;
    window.clearTimeout(startTimer);
    if (writingRafId) window.cancelAnimationFrame(writingRafId);
    if (handwritingController) handwritingController.completeInstantly();
    if (threeController) threeController.settleInstantly();

    section.classList.remove('js-writing-active', 'pen-visible');
    section.classList.add('writing-complete', 'pen-finished');
    setPhaseText('INTRODUCTION TERMINÉE');
    if (skipLabel) skipLabel.textContent = 'Découvrir le portfolio';

    if (scrollToHero) {
      scrollToNextSection(section);
    }
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (!isSkippedOrDone) {
        completeIntroImmediately({ scrollToHero: true });
      } else {
        scrollToNextSection(section);
      }
    });
  }

  // Nettoyage propre lors d'un changement de page Astro
  document.addEventListener(
    'astro:before-swap',
    () => {
      window.clearTimeout(startTimer);
      if (handwritingController) handwritingController.destroy();
      if (threeController) threeController.destroy();
    },
    { once: true }
  );
}

/**
 * Défilement fluide vers la section suivant l'introduction (Hero)
 */
function scrollToNextSection(introSection) {
  const nextSection =
    introSection.nextElementSibling ||
    document.querySelector('#hero, main > section:nth-of-type(2)');
  if (nextSection && typeof nextSection.scrollIntoView === 'function') {
    nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * ============================================================================
 * MOTEUR 3D THREE.JS : CARNET OUVERT EN PERSPECTIVE 3/4 & CRAYON POSÉ SUR LA PAGE
 * ============================================================================
 */
function createThreeNotebookScene({ section, container, canvas, prefersReducedMotion }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    // WebGL non disponible : le fallback SVG statique reste affiché proprement
    section.classList.remove('webgl-ready');
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();

  // Caméra en perspective trois-quarts plongeante pour révéler pages, reliure et tranche
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(0.38, 2.55, 3.55);
  camera.lookAt(0, 0.08, 0);

  // Éclairage de studio éditorial
  const ambientLight = new THREE.AmbientLight(0xfffaff, 1.45);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
  keyLight.position.set(3.2, 5.6, 3.8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 14;
  const d = 2.4;
  keyLight.shadow.camera.left = -d;
  keyLight.shadow.camera.right = d;
  keyLight.shadow.camera.top = d;
  keyLight.shadow.camera.bottom = -d;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  // Contre-jour doux #f5dbf7 (rose clair du portfolio)
  const rimLight = new THREE.DirectionalLight(0xf5dbf7, 0.95);
  rimLight.position.set(-3.4, 2.4, -2.2);
  scene.add(rimLight);

  // Plan récepteur d'ombre douce sous le carnet
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),
    new THREE.ShadowMaterial({ opacity: 0.13 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -0.28;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  // Groupe racine de la composition 3D
  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  // Position de repos trois-quarts élégante du carnet
  const targetNotebookPos = new THREE.Vector3(0.05, 0.0, 0.0);
  const targetNotebookRot = new THREE.Euler(0.16, -0.32, 0.04);

  // Position et orientation du crayon alignées naturellement sur l'axe du carnet
  const basePencilPos = new THREE.Vector3(0.08, 0.155, 0.10);
  // Rotation alignée sur l'angle du carnet (targetNotebookRot.y) pour qu'il soit bien droit par rapport à la page
  const basePencilRot = new THREE.Euler(0.04, targetNotebookRot.y - 0.05, Math.PI / 2 + 0.02);
  const basePencilShadowY = 0.073;
  const basePencilShadowOpacity = 0.58;

  // Construction du carnet ouvert 3D, du crayon et de son ombre de contact sur les pages
  const notebookGroup = buildEditorialOpenNotebook();
  const pencilGroup = buildFloatingPencil();
  const pencilShadow = buildPencilPageShadow({
    pencilOffsetX: basePencilPos.x - targetNotebookPos.x,
    pencilOffsetZ: basePencilPos.z - targetNotebookPos.z,
    localYaw: basePencilRot.y - targetNotebookRot.y,
    opacity: basePencilShadowOpacity,
  });

  rootGroup.add(notebookGroup);
  rootGroup.add(pencilShadow);
  rootGroup.add(pencilGroup);

  // État initial pour l'animation d'entrée (Phase 1)
  let entranceProgress = prefersReducedMotion ? 1 : 0;
  notebookGroup.position.set(
    targetNotebookPos.x,
    prefersReducedMotion ? targetNotebookPos.y : targetNotebookPos.y - 0.38,
    targetNotebookPos.z
  );
  notebookGroup.rotation.set(
    prefersReducedMotion ? targetNotebookRot.x : targetNotebookRot.x + 0.18,
    prefersReducedMotion ? targetNotebookRot.y : targetNotebookRot.y - 0.24,
    targetNotebookRot.z
  );

  pencilShadow.position.set(
    notebookGroup.position.x,
    notebookGroup.position.y + basePencilShadowY,
    notebookGroup.position.z
  );
  pencilShadow.rotation.copy(notebookGroup.rotation);

  pencilGroup.position.set(
    basePencilPos.x,
    notebookGroup.position.y + basePencilPos.y,
    basePencilPos.z
  );
  pencilGroup.rotation.copy(basePencilRot);

  // Option : chargement de modèles GLB externes si activé sur le conteneur
  if (container.dataset.enableExternalGlb === 'true') {
    loadOptionalExternalGlbModels({
      container,
      notebookGroup,
      pencilGroup,
    });
  }

  // Gestion du redimensionnement fluide
  const updateSize = () => {
    const rect = container.getBoundingClientRect();
    const width = Math.max(rect.width, 260);
    const height = Math.max(rect.height, 220);
    camera.aspect = width / height;

    const isCompact = width < 420;
    camera.position.z = isCompact ? 4.15 : 3.55;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height, false);
  };

  updateSize();
  section.classList.add('webgl-ready');

  const resizeObserver = new ResizeObserver(() => {
    updateSize();
    if (prefersReducedMotion) renderer.render(scene, camera);
  });
  resizeObserver.observe(container);

  // Parallaxe très subtile au survol sur ordinateur
  let pointerX = 0;
  let pointerY = 0;
  const onPointerMove = (e) => {
    if (prefersReducedMotion) return;
    const rect = container.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    pointerX = Math.max(-1, Math.min(1, nx)) * 0.06;
    pointerY = Math.max(-1, Math.min(1, ny)) * 0.04;
  };
  container.addEventListener('pointermove', onPointerMove, { passive: true });

  // Boucle d'animation optimisée avec mise en pause automatique hors écran
  let isVisible = true;
  let rafId = null;
  const clock = new THREE.Clock();

  const renderFrame = () => {
    if (!isVisible) return;
    const elapsed = clock.getElapsedTime();

    if (!prefersReducedMotion) {
      // Phase 1 : Émergence fluide du carnet (translation verticale + rotation + stabilisation)
      if (entranceProgress < 1) {
        entranceProgress = Math.min(1, entranceProgress + 0.022);
      }
      const easeOut = 1 - Math.pow(1 - entranceProgress, 3);

      // Respiration très discrète du carnet ouvert
      const floatNotebookY = Math.sin(elapsed * 1.15) * 0.018;
      notebookGroup.position.y =
        THREE.MathUtils.lerp(-0.38, targetNotebookPos.y, easeOut) + floatNotebookY;

      notebookGroup.rotation.x =
        THREE.MathUtils.lerp(targetNotebookRot.x + 0.18, targetNotebookRot.x, easeOut) +
        pointerY * 0.6;
      notebookGroup.rotation.y =
        THREE.MathUtils.lerp(targetNotebookRot.y - 0.24, targetNotebookRot.y, easeOut) +
        pointerX +
        Math.cos(elapsed * 0.8) * 0.012;

      // Le crayon reste parfaitement solidaire de la page du livre lors des mouvements
      const pageTiltOffsetY = -basePencilPos.z * (pointerY * 0.6);
      pencilGroup.position.y = notebookGroup.position.y + basePencilPos.y + pageTiltOffsetY;
      pencilGroup.position.x = basePencilPos.x + pointerX * 0.12;
      pencilGroup.rotation.copy(basePencilRot);

      // Synchronisation de l'ombre de contact sur les pages directement sous le crayon
      pencilShadow.position.set(
        notebookGroup.position.x + pointerX * 0.12,
        notebookGroup.position.y + basePencilShadowY,
        notebookGroup.position.z
      );
      pencilShadow.rotation.copy(notebookGroup.rotation);
      if (pencilShadow.material) {
        pencilShadow.material.opacity = THREE.MathUtils.lerp(
          0.3,
          basePencilShadowOpacity,
          easeOut
        );
      }
    }

    renderer.render(scene, camera);
    if (!prefersReducedMotion) {
      rafId = window.requestAnimationFrame(renderFrame);
    }
  };

  renderFrame();

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !prefersReducedMotion) {
          clock.getDelta();
          if (!rafId) rafId = window.requestAnimationFrame(renderFrame);
        } else if (!isVisible && rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
      });
    },
    { threshold: 0.05 }
  );
  intersectionObserver.observe(section);

  return {
    settleInstantly() {
      entranceProgress = 1;
      notebookGroup.position.copy(targetNotebookPos);
      notebookGroup.rotation.copy(targetNotebookRot);
      pencilGroup.position.set(
        basePencilPos.x,
        targetNotebookPos.y + basePencilPos.y,
        basePencilPos.z
      );
      pencilGroup.rotation.copy(basePencilRot);
      pencilShadow.position.set(
        targetNotebookPos.x,
        targetNotebookPos.y + basePencilShadowY,
        targetNotebookPos.z
      );
      pencilShadow.rotation.copy(targetNotebookRot);
      if (pencilShadow.material) {
        pencilShadow.material.opacity = basePencilShadowOpacity;
      }
      renderer.render(scene, camera);
    },
    destroy() {
      if (rafId) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.removeEventListener('pointermove', onPointerMove);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          } else {
            if (obj.material.map) obj.material.map.dispose();
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
    },
  };
}

/**
 * Construit le modèle 3D d'un carnet ouvert éditorial (couverture #232836, tranche,
 * pages galbées avec grille et croquis, et signet #f5dbf7)
 */
function buildEditorialOpenNotebook() {
  const group = new THREE.Group();

  const coverMat = new THREE.MeshStandardMaterial({
    color: 0x232836,
    roughness: 0.62,
    metalness: 0.08,
  });

  const pageBlockMat = new THREE.MeshStandardMaterial({
    color: 0xf3eee8,
    roughness: 0.78,
    metalness: 0.02,
  });

  const ribbonMat = new THREE.MeshStandardMaterial({
    color: 0xf5dbf7,
    roughness: 0.5,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  // 1. Demi-couvertures rigides gauche et droite (#232836)
  const coverGeo = new THREE.BoxGeometry(1.18, 0.045, 1.62);

  const leftCover = new THREE.Mesh(coverGeo, coverMat);
  leftCover.position.set(-0.6, -0.04, 0);
  leftCover.rotation.z = 0.075;
  leftCover.castShadow = true;
  leftCover.receiveShadow = true;
  group.add(leftCover);

  const rightCover = new THREE.Mesh(coverGeo, coverMat);
  rightCover.position.set(0.6, -0.04, 0);
  rightCover.rotation.z = -0.075;
  rightCover.castShadow = true;
  rightCover.receiveShadow = true;
  group.add(rightCover);

  // 2. Dos / Reliure centrale
  const spineGeo = new THREE.CylinderGeometry(0.065, 0.065, 1.63, 20, 1, false, 0, Math.PI);
  const spine = new THREE.Mesh(spineGeo, coverMat);
  spine.rotation.x = Math.PI / 2;
  spine.rotation.y = Math.PI;
  spine.position.set(0, -0.065, 0);
  spine.castShadow = true;
  group.add(spine);

  // 3. Épaisseur des pages (bloc papier gauche et droite)
  const blockGeo = new THREE.BoxGeometry(1.1, 0.095, 1.54);

  const leftBlock = new THREE.Mesh(blockGeo, pageBlockMat);
  leftBlock.position.set(-0.56, 0.02, 0);
  leftBlock.rotation.z = 0.075;
  leftBlock.castShadow = true;
  leftBlock.receiveShadow = true;
  group.add(leftBlock);

  const rightBlock = new THREE.Mesh(blockGeo, pageBlockMat);
  rightBlock.position.set(0.56, 0.02, 0);
  rightBlock.rotation.z = -0.075;
  rightBlock.castShadow = true;
  rightBlock.receiveShadow = true;
  group.add(rightBlock);

  // 4. Pages supérieures galbées avec textures éditoriales distinctes
  const leftPageTexture = createEditorialPageTexture('left');
  const rightPageTexture = createEditorialPageTexture('right');

  const leftPageGeo = createCurvedPageGeometry(1.1, 1.54, 'left');
  const leftPageMat = new THREE.MeshStandardMaterial({
    map: leftPageTexture,
    roughness: 0.72,
    metalness: 0.02,
  });
  const leftPage = new THREE.Mesh(leftPageGeo, leftPageMat);
  leftPage.position.set(0, 0.07, 0);
  leftPage.receiveShadow = true;
  leftPage.castShadow = true;
  group.add(leftPage);

  const rightPageGeo = createCurvedPageGeometry(1.1, 1.54, 'right');
  const rightPageMat = new THREE.MeshStandardMaterial({
    map: rightPageTexture,
    roughness: 0.72,
    metalness: 0.02,
  });
  const rightPage = new THREE.Mesh(rightPageGeo, rightPageMat);
  rightPage.position.set(0, 0.07, 0);
  rightPage.receiveShadow = true;
  rightPage.castShadow = true;
  group.add(rightPage);

  // 5. Signet en ruban rose pâle (#f5dbf7) sortant de la reliure
  const ribbonGeo = new THREE.PlaneGeometry(0.07, 0.42, 4, 12);
  const posAttr = ribbonGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const v = posAttr.getY(i);
    const wave = Math.sin(v * 9) * 0.015;
    posAttr.setZ(i, wave);
  }
  ribbonGeo.computeVertexNormals();

  const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbon.rotation.x = -Math.PI / 2 + 0.12;
  ribbon.rotation.z = -0.18;
  ribbon.position.set(-0.04, 0.02, 0.88);
  group.add(ribbon);

  return group;
}

/**
 * Génère une géométrie de page galbée réaliste partant du pli central de la reliure
 */
function createCurvedPageGeometry(width, height, side) {
  const geo = new THREE.PlaneGeometry(width, height, 28, 12);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const sign = side === 'left' ? -1 : 1;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const t = (x + width / 2) / width;
    const distFromSpine = side === 'left' ? 1 - t : t;

    const worldX = sign * (distFromSpine * width);
    const archY =
      Math.sin(distFromSpine * Math.PI) * 0.085 - distFromSpine * 0.042;

    pos.setX(i, worldX);
    pos.setY(i, archY);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Crée une texture Canvas haute définition pour les pages du carnet
 */
function createEditorialPageTexture(side) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fffaff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gutterGrad = ctx.createLinearGradient(
    side === 'left' ? canvas.width - 70 : 0,
    0,
    side === 'left' ? canvas.width : 70,
    0
  );
  if (side === 'left') {
    gutterGrad.addColorStop(0, 'rgba(35, 40, 54, 0)');
    gutterGrad.addColorStop(1, 'rgba(35, 40, 54, 0.14)');
    ctx.fillStyle = gutterGrad;
    ctx.fillRect(canvas.width - 70, 0, 70, canvas.height);
  } else {
    gutterGrad.addColorStop(0, 'rgba(35, 40, 54, 0.14)');
    gutterGrad.addColorStop(1, 'rgba(35, 40, 54, 0)');
    ctx.fillStyle = gutterGrad;
    ctx.fillRect(0, 0, 70, canvas.height);
  }

  ctx.strokeStyle = 'rgba(35, 40, 54, 0.11)';
  ctx.lineWidth = 1.5;
  for (let y = 76; y < canvas.height - 60; y += 34) {
    ctx.beginPath();
    ctx.moveTo(46, y);
    ctx.lineTo(canvas.width - 46, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(232, 188, 233, 0.85)';
  ctx.lineWidth = 2;
  const marginX = side === 'left' ? 76 : 76;
  ctx.beginPath();
  ctx.moveTo(marginX, 46);
  ctx.lineTo(marginX, canvas.height - 46);
  ctx.stroke();

  if (side === 'left') {
    ctx.strokeStyle = 'rgba(35, 40, 54, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(104, 106, 170, 108);

    ctx.fillStyle = 'rgba(245, 219, 247, 0.65)';
    ctx.fillRect(114, 118, 70, 18);

    ctx.beginPath();
    ctx.moveTo(104, 106);
    ctx.lineTo(274, 214);
    ctx.moveTo(274, 106);
    ctx.lineTo(104, 214);
    ctx.strokeStyle = 'rgba(35, 40, 54, 0.18)';
    ctx.stroke();

    ctx.strokeStyle = 'rgba(35, 40, 54, 0.42)';
    ctx.lineWidth = 2.4;
    const widths = [280, 240, 300, 190];
    widths.forEach((w, idx) => {
      const y = 278 + idx * 34;
      ctx.beginPath();
      ctx.moveTo(104, y);
      ctx.bezierCurveTo(104 + w * 0.3, y - 4, 104 + w * 0.7, y + 4, 104 + w, y - 1);
      ctx.stroke();
    });
  } else {
    ctx.fillStyle = 'rgba(245, 219, 247, 0.55)';
    ctx.fillRect(106, 110, 310, 62);

    ctx.strokeStyle = 'rgba(35, 40, 54, 0.32)';
    ctx.lineWidth = 2;
    ctx.strokeRect(106, 206, 145, 136);
    ctx.strokeRect(270, 206, 145, 136);

    ctx.strokeStyle = 'rgba(35, 40, 54, 0.55)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(108, 412);
    ctx.quadraticCurveTo(190, 388, 265, 410);
    ctx.quadraticCurveTo(335, 430, 395, 402);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

/**
 * Construit le modèle 3D d'un crayon de création hexagonal (#232836 & gomme #f5dbf7)
 */
function buildFloatingPencil() {
  const pencil = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(0.036, 0.036, 1.32, 6);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x232836,
    roughness: 0.48,
    metalness: 0.12,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = false;
  pencil.add(body);

  const ferruleGeo = new THREE.CylinderGeometry(0.037, 0.037, 0.12, 20);
  const ferruleMat = new THREE.MeshStandardMaterial({
    color: 0xd8d2c9,
    roughness: 0.28,
    metalness: 0.78,
  });
  const ferrule = new THREE.Mesh(ferruleGeo, ferruleMat);
  ferrule.position.y = 0.72;
  ferrule.castShadow = false;
  pencil.add(ferrule);

  const eraserGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.11, 20);
  const eraserMat = new THREE.MeshStandardMaterial({
    color: 0xf5dbf7,
    roughness: 0.65,
    metalness: 0.02,
  });
  const eraser = new THREE.Mesh(eraserGeo, eraserMat);
  eraser.position.y = 0.835;
  eraser.castShadow = false;
  pencil.add(eraser);

  const woodGeo = new THREE.ConeGeometry(0.036, 0.21, 20);
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xdfb995,
    roughness: 0.68,
    metalness: 0.02,
  });
  const wood = new THREE.Mesh(woodGeo, woodMat);
  wood.rotation.x = Math.PI;
  wood.position.y = -0.765;
  wood.castShadow = false;
  pencil.add(wood);

  const tipGeo = new THREE.ConeGeometry(0.013, 0.075, 16);
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0x1a1e29,
    roughness: 0.3,
    metalness: 0.35,
  });
  const tip = new THREE.Mesh(tipGeo, tipMat);
  tip.rotation.x = Math.PI;
  tip.position.y = -0.84;
  pencil.add(tip);

  return pencil;
}

/**
 * Construit une ombre de contact douce épousant le galbe des pages directement sous le crayon
 */
function buildPencilPageShadow({ pencilOffsetX, pencilOffsetZ, localYaw, opacity }) {
  const shadowGeo = new THREE.PlaneGeometry(1.76, 0.14, 36, 4);
  shadowGeo.rotateX(-Math.PI / 2);

  const cosNotebook = Math.cos(0.32);
  const sinNotebook = Math.sin(0.32);
  const centerX = pencilOffsetX * cosNotebook - pencilOffsetZ * sinNotebook;
  const centerZ = pencilOffsetX * sinNotebook + pencilOffsetZ * cosNotebook;

  const cosYaw = Math.cos(localYaw);
  const sinYaw = Math.sin(localYaw);
  const pageWidth = 1.1;

  const pos = shadowGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i);
    const v = pos.getZ(i);

    const lx = centerX + u * cosYaw + v * sinYaw;
    const lz = centerZ - u * sinYaw + v * cosYaw;

    const distFromSpine = Math.min(1, Math.abs(lx) / pageWidth);
    const archY =
      Math.sin(distFromSpine * Math.PI) * 0.085 - distFromSpine * 0.042;

    pos.setX(i, lx);
    pos.setY(i, archY);
    pos.setZ(i, lz);
  }
  shadowGeo.computeVertexNormals();

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(3.7, 0.55);
  const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, 32);
  grad.addColorStop(0, 'rgba(35, 40, 54, 0.36)');
  grad.addColorStop(0.38, 'rgba(35, 40, 54, 0.19)');
  grad.addColorStop(0.75, 'rgba(35, 40, 54, 0.05)');
  grad.addColorStop(1, 'rgba(35, 40, 54, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const shadowTexture = new THREE.CanvasTexture(canvas);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity,
    depthWrite: false,
  });

  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.renderOrder = 1;
  return shadowMesh;
}

/**
 * Charge optionnellement des modèles .glb externes s'ils sont présents dans public/models/
 */
function loadOptionalExternalGlbModels({ container, notebookGroup, pencilGroup }) {
  const loader = new GLTFLoader();
  const notebookUrl = container.dataset.notebookModel;
  const pencilUrl = container.dataset.pencilModel;

  if (notebookUrl) {
    loader.load(
      notebookUrl,
      (gltf) => {
        notebookGroup.clear();
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        notebookGroup.add(gltf.scene);
      },
      undefined,
      () => {}
    );
  }

  if (pencilUrl) {
    loader.load(
      pencilUrl,
      (gltf) => {
        pencilGroup.clear();
        gltf.scene.traverse((child) => {
          if (child.isMesh) child.castShadow = false;
        });
        pencilGroup.add(gltf.scene);
      },
      undefined,
      () => {}
    );
  }
}

/**
 * ============================================================================
 * MOTEUR D'ÉCRITURE MANUSCRITE SVG (PHASE 2 & PHASE 3)
 * ============================================================================
 */
function createHandwritingAnimator({ section, onStartWriting, onFinishWriting }) {
  const svg = document.getElementById('intro-handwriting-svg');
  const textEl = document.getElementById('intro-handwriting-text');
  const maskGroup = document.getElementById('intro-mask-strokes');
  const penActor = document.getElementById('intro-pen-actor');
  const liveInkTrail = document.getElementById('intro-live-ink-trail');

  if (!svg || !textEl || !maskGroup || !penActor) {
    return {
      start() {
        if (onFinishWriting) onFinishWriting();
      },
      completeInstantly() {},
      destroy() {},
    };
  }

  let rafId = null;
  let isDestroyed = false;
  let segments = [];

  function buildCalligraphySegments() {
    maskGroup.innerHTML = '';
    segments = [];

    const chars = Array.from(PHRASE_EXACTE);
    const boxes = measureCharacterBoxes(textEl, chars.length);

    chars.forEach((char, index) => {
      const box = boxes[index];
      if (char === ' ') {
        segments.push({
          type: 'space',
          duration: 75,
          startX: box.x,
          startY: box.y + box.height * 0.55,
          endX: box.x + box.width,
          endY: box.y + box.height * 0.55,
        });
        return;
      }

      const dMain = createLetterDuctusPath(char, box);
      const maskPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      maskPath.setAttribute('d', dMain);
      maskPath.setAttribute('fill', 'none');
      maskPath.setAttribute('stroke', 'white');
      maskPath.setAttribute('stroke-width', String(Math.max(box.height * 0.92, 46)));
      maskPath.setAttribute('stroke-linecap', 'round');
      maskPath.setAttribute('stroke-linejoin', 'round');
      maskGroup.appendChild(maskPath);

      const length = Math.max(maskPath.getTotalLength(), 1);
      maskPath.style.strokeDasharray = `${length}`;
      maskPath.style.strokeDashoffset = `${length}`;

      segments.push({
        type: 'stroke',
        char,
        pathEl: maskPath,
        length,
        duration: Math.max(75, Math.min(155, length * 1.15)),
        isAccent: false,
      });

      if (char === 'é' || char === 'i' || char === 't' || char === 'T') {
        const dSecondary = createSecondaryStrokePath(char, box);
        const secPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        secPath.setAttribute('d', dSecondary);
        secPath.setAttribute('fill', 'none');
        secPath.setAttribute('stroke', 'white');
        secPath.setAttribute('stroke-width', '26');
        secPath.setAttribute('stroke-linecap', 'round');
        maskGroup.appendChild(secPath);

        const secLen = Math.max(secPath.getTotalLength(), 1);
        secPath.style.strokeDasharray = `${secLen}`;
        secPath.style.strokeDashoffset = `${secLen}`;

        segments.push({
          type: 'stroke',
          char,
          pathEl: secPath,
          length: secLen,
          duration: 55,
          isAccent: true,
        });
      }
    });
  }

  function start() {
    if (isDestroyed) return;

    const launch = () => {
      if (isDestroyed) return;
      buildCalligraphySegments();
      section.classList.add('js-writing-active', 'pen-visible');
      if (onStartWriting) onStartWriting();

      const totalDuration = segments.reduce((acc, s) => acc + s.duration, 0);
      const startTime = performance.now();
      const trailPoints = [];

      const step = (now) => {
        if (isDestroyed) return;
        const elapsed = now - startTime;

        let accumulated = 0;
        let activeSegment = segments[segments.length - 1];
        let localProgress = 1;

        for (let i = 0; i < segments.length; i++) {
          const seg = segments[i];
          if (elapsed < accumulated + seg.duration) {
            activeSegment = seg;
            localProgress = Math.max(0, Math.min(1, (elapsed - accumulated) / seg.duration));
            break;
          } else {
            if (seg.type === 'stroke') {
              seg.pathEl.style.strokeDashoffset = '0';
            }
            accumulated += seg.duration;
          }
        }

        if (activeSegment.type === 'stroke') {
          const drawLen = activeSegment.length * localProgress;
          activeSegment.pathEl.style.strokeDashoffset = `${activeSegment.length - drawLen}`;

          const pt = activeSegment.pathEl.getPointAtLength(drawLen);
          const ptAhead = activeSegment.pathEl.getPointAtLength(
            Math.min(activeSegment.length, drawLen + 2)
          );
          const angleDeg =
            Math.atan2(ptAhead.y - pt.y, ptAhead.x - pt.x) * (180 / Math.PI);
          const nibAngle = -28 + Math.max(-10, Math.min(10, angleDeg * 0.14));

          penActor.setAttribute(
            'transform',
            `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}) rotate(${nibAngle.toFixed(1)})`
          );

          trailPoints.push(`${pt.x.toFixed(1)},${pt.y.toFixed(1)}`);
          if (trailPoints.length > 10) trailPoints.shift();
          if (liveInkTrail && trailPoints.length > 1) {
            liveInkTrail.setAttribute('d', `M ${trailPoints.join(' L ')}`);
          }
        } else if (activeSegment.type === 'space') {
          const x =
            activeSegment.startX +
            (activeSegment.endX - activeSegment.startX) * localProgress;
          const liftY =
            activeSegment.startY - Math.sin(localProgress * Math.PI) * 9;
          penActor.setAttribute(
            'transform',
            `translate(${x.toFixed(1)}, ${liftY.toFixed(1)}) rotate(-33)`
          );
          trailPoints.length = 0;
          if (liveInkTrail) liveInkTrail.setAttribute('d', '');
        }

        if (elapsed < totalDuration) {
          rafId = window.requestAnimationFrame(step);
        } else {
          segments.forEach((s) => {
            if (s.type === 'stroke') s.pathEl.style.strokeDashoffset = '0';
          });
          if (liveInkTrail) liveInkTrail.setAttribute('d', '');

          window.setTimeout(() => {
            if (isDestroyed) return;
            const lastSeg = segments[segments.length - 1];
            if (lastSeg && lastSeg.pathEl) {
              const endPt = lastSeg.pathEl.getPointAtLength(lastSeg.length);
              penActor.setAttribute(
                'transform',
                `translate(${(endPt.x + 28).toFixed(1)}, ${(endPt.y - 18).toFixed(1)}) rotate(-18)`
              );
            }
            if (onFinishWriting) onFinishWriting();
          }, 280);
        }
      };

      rafId = window.requestAnimationFrame(step);
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(launch).catch(launch);
    } else {
      launch();
    }
  }

  function completeInstantly() {
    if (rafId) window.cancelAnimationFrame(rafId);
    segments.forEach((s) => {
      if (s.type === 'stroke') s.pathEl.style.strokeDashoffset = '0';
    });
    if (liveInkTrail) liveInkTrail.setAttribute('d', '');
  }

  function destroy() {
    isDestroyed = true;
    if (rafId) window.cancelAnimationFrame(rafId);
  }

  return { start, completeInstantly, destroy };
}

function measureCharacterBoxes(textEl, count) {
  const boxes = [];
  for (let i = 0; i < count; i++) {
    try {
      const ext = textEl.getExtentOfChar(i);
      if (ext && ext.width > 0) {
        boxes.push({ x: ext.x, y: ext.y, width: ext.width, height: ext.height });
        continue;
      }
    } catch (e) {}
    const fallbackStartX = 34 + i * 26.8;
    boxes.push({ x: fallbackStartX, y: 48, width: 25, height: 54 });
  }
  return boxes;
}

function createLetterDuctusPath(char, box) {
  const x0 = box.x + 2;
  const xMid = box.x + box.width * 0.52;
  const x1 = box.x + box.width - 2;
  const yTop = box.y + box.height * 0.25;
  const yMid = box.y + box.height * 0.58;
  const yBase = box.y + box.height * 0.84;

  if ('oceéad'.includes(char)) {
    return `M ${x1} ${yMid} C ${xMid} ${yTop}, ${x0} ${yMid}, ${x0} ${yBase} C ${xMid} ${yBase + 4}, ${x1} ${yMid}, ${x1} ${yBase}`;
  }
  if ('mnupr'.includes(char)) {
    return `M ${x0} ${yTop} L ${x0} ${yBase} C ${x0} ${yMid}, ${xMid} ${yTop}, ${xMid} ${yBase} C ${xMid} ${yMid}, ${x1} ${yTop}, ${x1} ${yBase}`;
  }
  return `M ${xMid} ${box.y + 8} L ${xMid} ${yBase} Q ${x1} ${yBase}, ${x1} ${yMid}`;
}

function createSecondaryStrokePath(char, box) {
  const xMid = box.x + box.width * 0.5;
  if (char === 'é') {
    const ax0 = box.x + box.width * 0.42;
    const ay0 = box.y + box.height * 0.22;
    const ax1 = box.x + box.width * 0.78;
    const ay1 = box.y + 4;
    return `M ${ax0} ${ay0} L ${ax1} ${ay1}`;
  }
  if (char === 'i') {
    const iy = box.y + box.height * 0.16;
    return `M ${xMid - 1} ${iy} L ${xMid + 2} ${iy - 2}`;
  }
  const barY = char === 'T' ? box.y + 12 : box.y + box.height * 0.34;
  return `M ${box.x + 2} ${barY} L ${box.x + box.width - 2} ${barY - 2}`;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIntroScene);
} else {
  initIntroScene();
}
document.addEventListener('astro:page-load', initIntroScene);