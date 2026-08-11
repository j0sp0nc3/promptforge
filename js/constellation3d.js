/**
 * PROMPTOMETER — 3D Solar System Constellation Engine (Three.js WebGL)
 * 8D Spectral Resonance Solar System Visualization
 *
 * Two visual states with a cinematic transition:
 *   'empty'         → protostar + protoplanetary disk (no planets)
 *   'transitioning' → Phase 1: disk particles organize into rings
 *                     Phase 2: rings collapse into planets, sun matures
 *   'full'          → complete solar system with score-colored planets
 */

window.Constellation3D = (function() {
  let scene, camera, renderer, controls;
  let container, canvasDiv;
  let planets = [];
  let orbitRings = [];
  let sunMesh, sunCorona, starfield;
  let ambientLight, sunLight, cameraLight;
  let animationFrameId = null;
  let isInitialized = false;
  let currentTheme = 'blackhole';
  let raycaster, mouse;
  let hoveredPlanet = null;
  let tooltipEl = null;
  let currentAnalysisResult = null;
  let planetLabelEls = [];

  // ── Protoplanetary disk state ──────────────────────────────
  let systemState = 'empty';            // 'empty' | 'transitioning' | 'full'
  let protoplanetaryDisk = null;        // THREE.Points
  let diskParticleData = [];            // per-particle { basePos, ringPos, angle, ringIdx }
  let transitionStartTime = 0;
  const TRANSITION_DURATION = 3500;     // ms total (2000 phase 1 + 1500 phase 2)
  const PHASE_1_RATIO = 0.57;           // 2000/3500 ≈ 0.57
  const PROTOSTAR_COLOR = 0x88ccff;     // blue-white young star
  const PROTOSTAR_SCALE = 0.7;

  const DIMENSIONS_CONFIG = [
    { key: 'clarity',        labelES: 'Claridad',      labelEN: 'Clarity',          radius: 3.2,  speed: 0.012,  size: 0.35, shape: 'sphere',       color: 0x00e5ff },
    { key: 'specificity',    labelES: 'Especificidad', labelEN: 'Specificity',      radius: 4.4,  speed: 0.009,  size: 0.38, shape: 'icosahedron',  color: 0x7c3aed },
    { key: 'structure',      labelES: 'Estructura',    labelEN: 'Structure',        radius: 5.6,  speed: 0.007,  size: 0.42, shape: 'octahedron',   color: 0xf59e0b },
    { key: 'robustness',     labelES: 'Robustez',      labelEN: 'Robustness',       radius: 6.8,  speed: 0.0055, size: 0.40, shape: 'dodecahedron', color: 0x10b981 },
    { key: 'context',        labelES: 'Contexto',      labelEN: 'Context',          radius: 8.0,  speed: 0.0045, size: 0.36, shape: 'sphere',       color: 0xec4899 },
    { key: 'outputFormat',   labelES: 'Formato',       labelEN: 'Output Format',    radius: 9.2,  speed: 0.0035, size: 0.39, shape: 'torus',        color: 0x38bdf8 },
    { key: 'chainOfThought', labelES: 'Razonamiento',  labelEN: 'CoT Reasoning',    radius: 10.5, speed: 0.0028, size: 0.37, shape: 'tetrahedron',  color: 0xf97316 },
    { key: 'safety',         labelES: 'Seguridad',     labelEN: 'Safety Guardrails', radius: 11.8, speed: 0.0022, size: 0.34, shape: 'sphere',       color: 0xef4444 }
  ];

  function resolveScore(key, scores) {
    if (!scores) return 0;
    return scores[key] !== undefined ? scores[key] : 0;
  }

  function getScoreColor(val) {
    if (val >= 7.5) return { hex: 0x10b981, css: '#10b981' }; // Emerald
    if (val >= 5.0) return { hex: 0xf59e0b, css: '#f59e0b' }; // Amber
    return { hex: 0xef4444, css: '#ef4444' }; // Crimson
  }

  // ── Easing functions ───────────────────────────────────────
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function init(targetDivId) {
    canvasDiv = document.getElementById(targetDivId);
    if (!canvasDiv || typeof THREE === 'undefined') {
      console.warn('Constellation3D: THREE.js not available or target container missing. Falling back to 2D SVG.');
      return false;
    }

    const width = canvasDiv.clientWidth || 800;
    const height = canvasDiv.clientHeight || 450;

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 12, 18);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Clear inner container and append canvas
    canvasDiv.innerHTML = '';
    canvasDiv.appendChild(renderer.domElement);

    // Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2.1; // Don't go below ground
      controls.minDistance = 8;
      controls.maxDistance = 26;
    }

    // Lights
    ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    sunLight = new THREE.PointLight(0xfffae6, 2.5, 50);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    cameraLight = new THREE.DirectionalLight(0xffffff, 0.85);
    cameraLight.position.set(0, 15, 25);
    scene.add(cameraLight);

    // Build Central Sun Core (starts as protostar)
    buildSun();

    // Build Starfield
    buildStarfield();

    // Build 8 Orbits & Planets (planets start at scale 0 — invisible)
    buildPlanets();

    // Build protoplanetary disk (visible in 'empty' state)
    buildProtoplanetaryDisk();

    // Setup Raycaster for tooltips & permanently visible planet labels
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    setupTooltip();
    setupPlanetLabels();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onMouseClick);
    renderer.domElement.addEventListener('mouseleave', onMouseLeave);

    isInitialized = true;
    systemState = 'empty';
    animate();
    return true;
  }

  function buildSun() {
    const geom = new THREE.SphereGeometry(1.3, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: PROTOSTAR_COLOR,  // starts as protostar blue-white
      wireframe: false
    });
    sunMesh = new THREE.Mesh(geom, mat);
    sunMesh.scale.setScalar(PROTOSTAR_SCALE); // smaller protostar
    sunMesh.renderOrder = 2;
    scene.add(sunMesh);

    // Corona aura ring
    const auraGeom = new THREE.SphereGeometry(1.6, 32, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: PROTOSTAR_COLOR,
      transparent: true,
      opacity: 0.18,
      wireframe: true,
      depthWrite: false
    });
    sunCorona = new THREE.Mesh(auraGeom, auraMat);
    sunCorona.scale.setScalar(PROTOSTAR_SCALE);
    sunCorona.renderOrder = 3;
    scene.add(sunCorona);
  }

  function buildStarfield() {
    const starCount = 600;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 120;
      positions[i + 1] = (Math.random() - 0.5) * 80;
      positions[i + 2] = (Math.random() - 0.5) * 120;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      size: 0.15,
      color: 0xffffff,
      transparent: true,
      opacity: 0.6
    });

    starfield = new THREE.Points(geometry, material);
    scene.add(starfield);
  }

  function createPlanetGeometry(shape, size) {
    switch (shape) {
      case 'icosahedron': return new THREE.IcosahedronGeometry(size, 0);
      case 'octahedron': return new THREE.OctahedronGeometry(size, 0);
      case 'dodecahedron': return new THREE.DodecahedronGeometry(size, 0);
      case 'tetrahedron': return new THREE.TetrahedronGeometry(size, 0);
      case 'torus': return new THREE.TorusGeometry(size * 0.8, size * 0.3, 12, 24);
      default: return new THREE.SphereGeometry(size, 24, 24);
    }
  }

  function buildPlanets() {
    planets = [];
    orbitRings = [];

    DIMENSIONS_CONFIG.forEach((dim, idx) => {
      // Orbit Ring Line (starts invisible — opacity 0)
      const curve = new THREE.EllipseCurve(0, 0, dim.radius, dim.radius, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(64);
      const orbitGeom = new THREE.BufferGeometry().setFromPoints(
        points.map(p => new THREE.Vector3(p.x, 0, p.y))
      );
      const orbitMat = new THREE.LineBasicMaterial({
        color: dim.color,
        transparent: true,
        opacity: 0 // hidden until transition
      });
      const orbitLine = new THREE.Line(orbitGeom, orbitMat);
      scene.add(orbitLine);
      orbitRings.push(orbitLine);

      // Planet Mesh Group
      const pivot = new THREE.Group();
      scene.add(pivot);

      const pGeom = createPlanetGeometry(dim.shape, dim.size);
      const pMat = new THREE.MeshStandardMaterial({
        color: dim.color,
        roughness: 0.3,
        metalness: 0.7,
        emissive: dim.color,
        emissiveIntensity: 0.35
      });
      const mesh = new THREE.Mesh(pGeom, pMat);
      mesh.position.set(dim.radius, 0, 0);
      mesh.scale.setScalar(0); // invisible until transition
      mesh.renderOrder = 10;
      pivot.add(mesh);

      mesh.userData = {
        key: dim.key,
        color: dim.color,
        labelES: dim.labelES,
        labelEN: dim.labelEN,
        score: 7.5,
        radius: dim.radius,
        speed: dim.speed,
        pivot: pivot,
        dimIdx: idx
      };

      planets.push(mesh);
    });
  }

  // ── Protoplanetary disk: dense, realistic accretion disk ──
  function buildProtoplanetaryDisk() {
    const particleCount = 2500; // much denser for realistic nebular appearance
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    diskParticleData = [];

    const isLuna = currentTheme === 'luna' || currentTheme === 'editorial';
    const baseColor = isLuna ? new THREE.Color(0xd4a574) : new THREE.Color(0x6ab7ff);

    for (let i = 0; i < particleCount; i++) {
      // Realistic disk profile: exponential density falloff from center.
      // Inner regions (near star) are hotter/denser, outer regions diffuse.
      // Use sqrt distribution for surface density ~ 1/r
      const u = Math.random();
      const radius = 2.2 + Math.pow(u, 0.6) * 11.0; // biased towards inner/mid disk
      const angle = Math.random() * Math.PI * 2;

      // Disk thickness: thinner near center (flared disk), thicker at edges
      // Real protoplanetary disks have H/r ~ 0.05-0.1
      const diskThickness = 0.06 * radius; // flares outward
      const height = (Math.random() - 0.5) * 2 * diskThickness * (0.5 + Math.random() * 0.5);

      // Add slight Gaussian noise to radius for clumpiness
      const rNoise = radius + (Math.random() - 0.5) * 0.8;

      const x = Math.cos(angle) * rNoise;
      const z = Math.sin(angle) * rNoise;

      positions[i * 3] = x;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = z;

      // Assign each particle to a target planet — weighted by proximity to ring
      // Particles closer to a dimension's orbit radius are assigned to it
      let ringIdx = 0;
      let minDist = Infinity;
      for (let d = 0; d < DIMENSIONS_CONFIG.length; d++) {
        const dist = Math.abs(rNoise - DIMENSIONS_CONFIG[d].radius);
        if (dist < minDist) { minDist = dist; ringIdx = d; }
      }

      const dimColor = new THREE.Color(DIMENSIONS_CONFIG[ringIdx].color);
      // Blend: particles near a ring are more colored, far ones are more base
      const proximity = Math.max(0, 1 - minDist / 3.0); // 1 = on the ring, 0 = far
      const colorMix = 0.25 + proximity * 0.5; // 25-75% dim color
      colors[i * 3]     = baseColor.r * (1 - colorMix) + dimColor.r * colorMix;
      colors[i * 3 + 1] = baseColor.g * (1 - colorMix) + dimColor.g * colorMix;
      colors[i * 3 + 2] = baseColor.b * (1 - colorMix) + dimColor.b * colorMix;

      // Particle size varies: inner particles slightly larger (hotter/brighter)
      sizes[i] = 0.04 + Math.random() * 0.06 + (1.0 / (radius + 1)) * 0.03;

      // Orbital speed: Keplerian — inner particles orbit faster
      const keplerSpeed = 0.003 / Math.sqrt(radius / 3.0);
      const orbitDir = 1; // prograde

      diskParticleData.push({
        baseRadius: rNoise,
        baseAngle: angle,
        baseHeight: height,
        baseX: x,
        baseY: height,
        baseZ: z,
        targetRadius: DIMENSIONS_CONFIG[ringIdx].radius,
        ringIdx: ringIdx,
        // Unique orbital speed for each particle (Keplerian + small jitter)
        orbitSpeed: keplerSpeed * orbitDir * (0.8 + Math.random() * 0.4),
        // Random offset within the accretion point for natural clumping
        accretionOffset: 0.15 + Math.random() * 0.25,
        // Current live angle (updated in animate)
        liveAngle: angle,
        currentRadius: rNoise,
        currentHeight: height,
        // Individual opacity for fade-out as particles get absorbed
        alive: 1.0,
        // When this particle starts getting absorbed (staggered)
        absorbDelay: Math.random() * 0.6, // 0-60% of phase 1
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    protoplanetaryDisk = new THREE.Points(geometry, material);
    scene.add(protoplanetaryDisk);
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function setupPlanetLabels() {
    if (!canvasDiv) return;
    planetLabelEls.forEach(el => el.remove());
    planetLabelEls = [];

    DIMENSIONS_CONFIG.forEach((dim, idx) => {
      const el = document.createElement('div');
      el.className = 'planet-3d-always-label';
      el.dataset.dimKey = dim.key;
      el.style.cssText = `
        position: absolute;
        pointer-events: auto;
        cursor: pointer;
        font-family: var(--font-mono, 'IBM Plex Mono', monospace);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.03em;
        padding: 3px 8px;
        border-radius: 5px;
        white-space: nowrap;
        transform: translate(-50%, -100%);
        transition: opacity 0.2s ease, transform 0.15s ease, background 0.2s ease;
        z-index: 50;
        display: none;
        user-select: none;
        backdrop-filter: blur(4px);
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onPlanetClickCallback) {
          onPlanetClickCallback(dim.key);
        }
      });

      canvasDiv.appendChild(el);
      planetLabelEls.push(el);
    });
  }

  function updatePlanetLabels() {
    if (!camera || !canvasDiv || planets.length === 0) return;

    const vec = new THREE.Vector3();
    const lang = window.i18n ? window.i18n.currentLang : 'es';
    const isLuna = currentTheme === 'luna' || currentTheme === 'editorial';

    planets.forEach((planet, idx) => {
      const labelEl = planetLabelEls[idx];
      if (!labelEl) return;

      // Only show labels when planets are growing or full
      if (systemState === 'empty' || planet.scale.x < 0.25) {
        labelEl.style.display = 'none';
        return;
      }

      // Get 3D planet position
      planet.getWorldPosition(vec);

      // Project to 2D Screen Space
      vec.project(camera);

      // Don't render if behind camera
      if (vec.z > 1) {
        labelEl.style.display = 'none';
        return;
      }

      const widthHalf = canvasDiv.clientWidth / 2;
      const heightHalf = canvasDiv.clientHeight / 2;
      const x = (vec.x * widthHalf) + widthHalf;
      const y = (-(vec.y * heightHalf)) + heightHalf;

      const labelText = lang === 'en' ? planet.userData.labelEN : planet.userData.labelES;
      const dimColorHex = DIMENSIONS_CONFIG[idx].color;
      const scoreVal = planet.userData.score !== undefined ? planet.userData.score.toFixed(1) : '--';

      if (isLuna) {
        labelEl.style.background = 'rgba(247, 243, 236, 0.92)';
        labelEl.style.color = '#1a1612';
        labelEl.style.border = `1.5px solid ${dimColorHex}`;
        labelEl.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.12)';
      } else {
        labelEl.style.background = 'rgba(10, 14, 26, 0.88)';
        labelEl.style.color = '#f3f4f6';
        labelEl.style.border = `1.5px solid ${dimColorHex}cc`;
        labelEl.style.boxShadow = `0 0 10px ${dimColorHex}44`;
      }

      const badgeColor = dimColorHex;
      labelEl.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${badgeColor}; margin-right:5px;"></span>${escapeHtml(labelText)} <span style="color:${badgeColor}; font-weight:700; margin-left:3px;">${scoreVal}</span>`;

      labelEl.style.left = `${x}px`;
      labelEl.style.top = `${y - 14}px`;
      labelEl.style.display = 'block';
      labelEl.style.opacity = Math.min(1, planet.scale.x);
    });
  }

  function setupTooltip() {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'constellation-3d-tooltip';
    tooltipEl.style.cssText = `
      position: absolute;
      display: none;
      pointer-events: none;
      background: rgba(17, 20, 32, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      padding: 6px 12px;
      font-family: var(--font-sans, system-ui);
      font-size: 12px;
      color: #f3f4f6;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      z-index: 100;
      transition: opacity 0.15s ease;
    `;
    if (canvasDiv) canvasDiv.style.position = 'relative';
    if (canvasDiv) canvasDiv.appendChild(tooltipEl);
  }

  function onMouseMove(event) {
    if (!renderer || !canvasDiv) return;
    // Only show tooltips when planets are visible (full state)
    if (systemState !== 'full') {
      if (tooltipEl) tooltipEl.style.display = 'none';
      document.body.style.cursor = 'default';
      return;
    }

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);

    if (intersects.length > 0) {
      const target = intersects[0].object;
      if (hoveredPlanet !== target) {
        if (hoveredPlanet) hoveredPlanet.scale.setScalar(1);
        hoveredPlanet = target;
        hoveredPlanet.scale.setScalar(1.25);
      }
      document.body.style.cursor = 'pointer';

      const lang = window.i18n ? window.i18n.currentLang : 'es';
      const label = lang === 'en' ? target.userData.labelEN : target.userData.labelES;
      const score = target.userData.score !== undefined ? target.userData.score.toFixed(1) : '--';

      tooltipEl.innerHTML = `<strong>${label}</strong>: <span style="color:${getScoreColor(target.userData.score).css}">${score}/10</span>`;
      tooltipEl.style.left = `${event.clientX - rect.left + 15}px`;
      tooltipEl.style.top = `${event.clientY - rect.top - 15}px`;
      tooltipEl.style.display = 'block';
    } else {
      if (hoveredPlanet) {
        hoveredPlanet.scale.setScalar(1);
        hoveredPlanet = null;
      }
      document.body.style.cursor = 'default';
      if (tooltipEl) tooltipEl.style.display = 'none';
    }
  }

  function onMouseLeave() {
    if (hoveredPlanet) {
      hoveredPlanet.scale.setScalar(1);
      hoveredPlanet = null;
    }
    if (tooltipEl) tooltipEl.style.display = 'none';
    document.body.style.cursor = 'default';
  }

  let onPlanetClickCallback = null;

  function onMouseClick(event) {
    if (!renderer || systemState !== 'full') return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);

    if (intersects.length > 0) {
      const target = intersects[0].object;
      if (onPlanetClickCallback) {
        onPlanetClickCallback(target.userData.key);
      }
    }
  }

  function setOnPlanetClick(fn) {
    onPlanetClickCallback = fn;
  }

  // ── Trigger the protoplanetary → solar system transition ────
  function triggerTransition(analysisResult) {
    if (systemState !== 'empty') return;
    currentAnalysisResult = analysisResult;
    systemState = 'transitioning';
    transitionStartTime = performance.now();
  }

  // ── Reset back to protoplanetary disk state ────────────────
  function resetToDisk() {
    systemState = 'empty';

    // Restore protostar appearance
    if (sunMesh) {
      sunMesh.scale.setScalar(PROTOSTAR_SCALE);
      sunMesh.material.color.setHex(PROTOSTAR_COLOR);
    }
    if (sunCorona) {
      sunCorona.scale.setScalar(PROTOSTAR_SCALE);
      sunCorona.material.color.setHex(PROTOSTAR_COLOR);
    }

    // Hide planets and orbit rings
    planets.forEach(p => {
      p.scale.setScalar(0);
      p.userData.score = 7.5;
    });
    orbitRings.forEach(line => {
      line.material.opacity = 0;
    });

    // Restore disk particles to chaotic positions + full opacity
    if (protoplanetaryDisk) {
      const positions = protoplanetaryDisk.geometry.attributes.position.array;
      for (let i = 0; i < diskParticleData.length; i++) {
        const pd = diskParticleData[i];
        // Reset each particle to its original disk state
        pd.liveAngle = pd.baseAngle;
        pd.currentRadius = pd.baseRadius;
        pd.currentHeight = pd.baseHeight;
        pd.alive = 1.0;
        positions[i * 3]     = pd.baseX;
        positions[i * 3 + 1] = pd.baseY;
        positions[i * 3 + 2] = pd.baseZ;
      }
      protoplanetaryDisk.geometry.attributes.position.needsUpdate = true;
      protoplanetaryDisk.material.opacity = 0.7;
      protoplanetaryDisk.visible = true;
    }
  }

  // ── Transition animation step (called from animate loop) ────
  function updateTransition(now) {
    if (systemState !== 'transitioning') return;

    const elapsed = now - transitionStartTime;
    const progress = Math.min(elapsed / TRANSITION_DURATION, 1);

    const positions = protoplanetaryDisk.geometry.attributes.position.array;
    const isLuna = currentTheme === 'luna' || currentTheme === 'editorial';
    const matureSunColor = isLuna ? 0xc73e2d : 0xffb703;

    if (progress < PHASE_1_RATIO) {
      // ═══ Phase 1: Accretion — dust spirals towards forming planets ═══
      const p1Raw = progress / PHASE_1_RATIO;

      for (let i = 0; i < diskParticleData.length; i++) {
        const pd = diskParticleData[i];
        const planet = planets[pd.ringIdx];
        if (!planet) continue;

        // Each particle has a staggered start — some absorb early, some late.
        // This creates a natural cascade where the disk shrinks gradually.
        const localProgress = Math.max(0, (p1Raw - pd.absorbDelay) / (1 - pd.absorbDelay));
        const eased = easeInOutCubic(Math.min(localProgress, 1));

        if (eased <= 0) {
          // Still orbiting freely in the disk (Keplerian)
          pd.liveAngle += pd.orbitSpeed;
          const r = pd.currentRadius;
          positions[i * 3]     = Math.cos(pd.liveAngle) * r;
          positions[i * 3 + 1] = pd.currentHeight;
          positions[i * 3 + 2] = Math.sin(pd.liveAngle) * r;
        } else if (eased < 0.98) {
          // Spiraling inward towards the forming planet
          // Get the planet's LIVE position (it's orbiting in its pivot)
          const pivotAngle = planet.userData.pivot.rotation.y;
          const planetX = Math.cos(pivotAngle) * pd.targetRadius;
          const planetZ = Math.sin(pivotAngle) * pd.targetRadius;

          // Current free-orbit position
          pd.liveAngle += pd.orbitSpeed * (1 - eased); // slow down as it approaches
          const fromX = Math.cos(pd.liveAngle) * pd.currentRadius;
          const fromZ = Math.sin(pd.liveAngle) * pd.currentRadius;

          // Spiral: interpolate position + shrink radius towards planet
          positions[i * 3]     = lerp(fromX, planetX, eased);
          positions[i * 3 + 1] = lerp(pd.currentHeight, 0, eased);
          positions[i * 3 + 2] = lerp(fromZ, planetZ, eased);

          // Particle fades as it merges into the planet
          pd.alive = 1.0 - eased;
        } else {
          // Fully absorbed — hide at planet's exact position
          const pivotAngle = planet.userData.pivot.rotation.y;
          positions[i * 3]     = Math.cos(pivotAngle) * pd.targetRadius;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = Math.sin(pivotAngle) * pd.targetRadius;
          pd.alive = 0;
        }
      }
      protoplanetaryDisk.geometry.attributes.position.needsUpdate = true;
      // Overall disk opacity fades as more particles get absorbed
      const avgAlive = diskParticleData.reduce((s, pd) => s + pd.alive, 0) / diskParticleData.length;
      protoplanetaryDisk.material.opacity = avgAlive * 0.7;

      // Planets grow as their dust accumulates — staggered per dimension
      planets.forEach((p, idx) => {
        const stagger = idx * 0.05;
        const planetP = Math.max(0, Math.min(1, (p1Raw - 0.1 - stagger) / 0.55));
        const easedScale = easeOutCubic(planetP);
        p.scale.setScalar(easedScale);
      });

      // Orbit rings STAY INVISIBLE during accretion
      orbitRings.forEach(line => { line.material.opacity = 0; });

      // Sun grows and shifts to mature color
      const sunS = lerp(PROTOSTAR_SCALE, 1.2, easeInOutCubic(p1Raw));
      sunMesh.scale.setScalar(sunS);
      sunCorona.scale.setScalar(sunS);

      const protoColor = new THREE.Color(PROTOSTAR_COLOR);
      const matureColor = new THREE.Color(matureSunColor);
      const blended = protoColor.lerp(matureColor, p1Raw);
      sunMesh.material.color.copy(blended);
      sunCorona.material.color.copy(blended);

    } else {
      // ═══ Phase 2: Orbit rings ignite behind the formed planets ═══
      const p2Raw = (progress - PHASE_1_RATIO) / (1 - PHASE_1_RATIO);
      const p2 = easeOutCubic(Math.min(p2Raw, 1));

      // Dust disk fully absorbed
      protoplanetaryDisk.material.opacity = 0;
      protoplanetaryDisk.visible = false;

      // Planets fully formed
      planets.forEach(p => p.scale.setScalar(1));

      // Orbit rings ignite — each one traces out with its dimension color
      orbitRings.forEach((line, idx) => {
        const stagger = idx * 0.04;
        const ringP = Math.max(0, Math.min(1, (p2Raw - stagger) / 0.6));
        const dimColor = DIMENSIONS_CONFIG[idx].color;
        line.material.color.setHex(dimColor);
        line.material.opacity = lerp(0, isLuna ? 0.45 : 0.35, easeOutCubic(ringP));
      });

      // Sun reaches final overall score scale
      const overall = currentAnalysisResult ? (currentAnalysisResult.overallScore || 75) : 75;
      const finalSunScale = 1.0 + (overall / 100) * 0.4;
      sunMesh.scale.setScalar(finalSunScale);
      sunCorona.scale.setScalar(finalSunScale);
      sunMesh.material.color.setHex(matureSunColor);
      sunCorona.material.color.setHex(matureSunColor);
    }

    if (progress >= 1) {
      systemState = 'full';
      protoplanetaryDisk.visible = false;
      planets.forEach(p => p.scale.setScalar(1));
      orbitRings.forEach((line, idx) => {
        line.material.color.setHex(DIMENSIONS_CONFIG[idx].color);
        line.material.opacity = isLuna ? 0.45 : 0.35;
      });
    }
  }

  function update(analysisResult, themeName) {
    if (!isInitialized) return;
    currentTheme = themeName || currentTheme;

    // Theme adaptations
    const isLuna = currentTheme === 'luna' || currentTheme === 'editorial';
    if (ambientLight) ambientLight.intensity = isLuna ? 0.85 : 0.45;
    if (cameraLight) cameraLight.intensity = isLuna ? 0.95 : 0.75;

    if (starfield) {
      starfield.material.color.setHex(isLuna ? 0xc73e2d : 0xffffff);
      starfield.material.opacity = isLuna ? 0.35 : 0.6;
    }

    // Sun color depends on state
    if (systemState === 'empty') {
      // Protostar — blue-white regardless of theme
      if (sunMesh) sunMesh.material.color.setHex(PROTOSTAR_COLOR);
      if (sunCorona) sunCorona.material.color.setHex(PROTOSTAR_COLOR);
      // Disk color respects theme
      if (protoplanetaryDisk) {
        const colors = protoplanetaryDisk.geometry.attributes.color.array;
        const baseColor = isLuna ? new THREE.Color(0xc4a882) : new THREE.Color(0x88ccff);
        for (let i = 0; i < colors.length / 3; i++) {
          colors[i * 3] = baseColor.r;
          colors[i * 3 + 1] = baseColor.g;
          colors[i * 3 + 2] = baseColor.b;
        }
        protoplanetaryDisk.geometry.attributes.color.needsUpdate = true;
      }
    } else {
      // Mature sun — theme color
      if (sunMesh) sunMesh.material.color.setHex(isLuna ? 0xc73e2d : 0xffb703);
      if (sunCorona) sunCorona.material.color.setHex(isLuna ? 0xc73e2d : 0xffb703);
    }

    // Update dimensions score mapping
    if (analysisResult && analysisResult.scores) {
      const overall = analysisResult.overallScore || 0;

      // If in empty state, trigger the transition!
      if (systemState === 'empty') {
        triggerTransition(analysisResult);
      }

      // Update sun glow based on overall score (applies once full)
      if (systemState === 'full' && sunMesh) {
        const scale = 1.0 + (overall / 100) * 0.4;
        sunMesh.scale.set(scale, scale, scale);
        sunCorona.scale.set(scale, scale, scale);
      }

      // Apply scores to planets — colors ready BEFORE they grow in
      planets.forEach(p => {
        const scoreVal = resolveScore(p.userData.key, analysisResult.scores);
        p.userData.score = scoreVal;

        // Preserve signature dimension color!
        const dimColor = p.userData.color;
        p.material.color.setHex(dimColor);
        p.material.emissive.setHex(dimColor);
        p.material.emissiveIntensity = 0.2 + (scoreVal / 10) * 0.6;
      });

      if (systemState === 'full') {
        orbitRings.forEach((line, idx) => {
          // Each orbit keeps its dimension's signature color
          const dimColor = DIMENSIONS_CONFIG[idx].color;
          line.material.color.setHex(dimColor);
          line.material.opacity = isLuna ? 0.45 : 0.35;
        });
      }
    }
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    const now = performance.now();

    if (controls) controls.update();

    // ── Transition engine ──
    updateTransition(now);

    // Rotate Sun
    if (sunMesh) sunMesh.rotation.y += 0.003;
    if (sunCorona) sunCorona.rotation.y -= 0.002;

    // Orbit Planets (only meaningful once visible, pauses when hovered!)
    planets.forEach(p => {
      if (p !== hoveredPlanet) {
        p.userData.pivot.rotation.y += p.userData.speed;
        p.rotation.x += 0.01;
        p.rotation.y += 0.015;
      }
    });

    // Keplerian disk motion in empty state — each particle orbits individually
    if (protoplanetaryDisk && systemState === 'empty' && diskParticleData.length > 0) {
      const pos = protoplanetaryDisk.geometry.attributes.position.array;
      for (let i = 0; i < diskParticleData.length; i++) {
        const pd = diskParticleData[i];
        pd.liveAngle += pd.orbitSpeed;
        const r = pd.currentRadius;
        pos[i * 3]     = Math.cos(pd.liveAngle) * r;
        pos[i * 3 + 1] = pd.currentHeight;
        pos[i * 3 + 2] = Math.sin(pd.liveAngle) * r;
      }
      protoplanetaryDisk.geometry.attributes.position.needsUpdate = true;
    }

    // Gentle starfield sway
    if (starfield) starfield.rotation.y += 0.0003;

    renderer.render(scene, camera);
    updatePlanetLabels();
  }

  function onWindowResize() {
    if (!renderer || !camera || !canvasDiv) return;
    const w = canvasDiv.clientWidth || 800;
    const h = canvasDiv.clientHeight || 450;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  return {
    init: init,
    update: update,
    isInitialized: function() { return isInitialized; },
    reset: resetToDisk,
    getState: function() { return systemState; },
    onPlanetClick: setOnPlanetClick
  };
})();
