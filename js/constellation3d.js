/**
 * PROMPTOMETER — 3D Solar System Constellation Engine (Three.js WebGL)
 * 8D Spectral Resonance Solar System Visualization
 */

window.Constellation3D = (function() {
  let scene, camera, renderer, controls;
  let container, canvasDiv;
  let planets = [];
  let orbitRings = [];
  let sunMesh, sunCorona, starfield;
  let animationFrameId = null;
  let isInitialized = false;
  let currentTheme = 'blackhole';
  let raycaster, mouse;
  let hoveredPlanet = null;
  let tooltipEl = null;

  const DIMENSIONS_CONFIG = [
    { key: 'clarity', labelES: 'Claridad', labelEN: 'Clarity', radius: 3.2, speed: 0.012, size: 0.35, shape: 'sphere' },
    { key: 'specificity', labelES: 'Especificidad', labelEN: 'Specificity', radius: 4.4, speed: 0.009, size: 0.38, shape: 'icosahedron' },
    { key: 'structure', labelES: 'Estructura', labelEN: 'Structure', radius: 5.6, speed: 0.007, size: 0.42, shape: 'octahedron' },
    { key: 'robustness', labelES: 'Robustez', labelEN: 'Robustness', radius: 6.8, speed: 0.0055, size: 0.40, shape: 'dodecahedron' },
    { key: 'context', labelES: 'Contexto', labelEN: 'Context', radius: 8.0, speed: 0.0045, size: 0.36, shape: 'sphere' },
    { key: 'output_format', labelES: 'Formato', labelEN: 'Format', radius: 9.2, speed: 0.0035, size: 0.39, shape: 'torus' },
    { key: 'chain_of_thought', labelES: 'Razonamiento', labelEN: 'CoT Reasoning', radius: 10.5, speed: 0.0028, size: 0.37, shape: 'tetrahedron' },
    { key: 'safety_guardrails', labelES: 'Seguridad', labelEN: 'Safety Guardrails', radius: 11.8, speed: 0.0022, size: 0.34, shape: 'sphere' }
  ];

  function getScoreColor(val) {
    if (val >= 7.5) return { hex: 0x10b981, css: '#10b981' }; // Emerald
    if (val >= 5.0) return { hex: 0xf59e0b, css: '#f59e0b' }; // Amber
    return { hex: 0xef4444, css: '#ef4444' }; // Crimson
  }

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xfffae6, 2.5, 50);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Build Central Sun Core
    buildSun();

    // Build Starfield
    buildStarfield();

    // Build 8 Orbits & Planets
    buildPlanets();

    // Setup Raycaster for tooltips
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    setupTooltip();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    isInitialized = true;
    animate();
    return true;
  }

  function buildSun() {
    const geom = new THREE.SphereGeometry(1.6, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffb703,
      wireframe: false
    });
    sunMesh = new THREE.Mesh(geom, mat);
    scene.add(sunMesh);

    // Corona aura ring
    const auraGeom = new THREE.SphereGeometry(2.0, 32, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xffb703,
      transparent: true,
      opacity: 0.18,
      wireframe: true
    });
    sunCorona = new THREE.Mesh(auraGeom, auraMat);
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
      // Orbit Ring Line
      const curve = new THREE.EllipseCurve(0, 0, dim.radius, dim.radius, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(64);
      const orbitGeom = new THREE.BufferGeometry().setFromPoints(
        points.map(p => new THREE.Vector3(p.x, 0, p.y))
      );
      const orbitMat = new THREE.LineBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.25
      });
      const orbitLine = new THREE.Line(orbitGeom, orbitMat);
      scene.add(orbitLine);
      orbitRings.push(orbitLine);

      // Planet Mesh Group
      const pivot = new THREE.Group();
      scene.add(pivot);

      const pGeom = createPlanetGeometry(dim.shape, dim.size);
      const pMat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        roughness: 0.3,
        metalness: 0.7,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.4
      });
      const mesh = new THREE.Mesh(pGeom, pMat);
      mesh.position.set(dim.radius, 0, 0);
      pivot.add(mesh);

      mesh.userData = {
        key: dim.key,
        labelES: dim.labelES,
        labelEN: dim.labelEN,
        score: 7.5,
        radius: dim.radius,
        speed: dim.speed,
        pivot: pivot
      };

      planets.push(mesh);
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
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);

    if (intersects.length > 0) {
      const target = intersects[0].object;
      hoveredPlanet = target;
      document.body.style.cursor = 'pointer';

      const lang = window.i18n ? window.i18n.currentLang : 'es';
      const label = lang === 'en' ? target.userData.labelEN : target.userData.labelES;
      const score = target.userData.score !== undefined ? target.userData.score.toFixed(1) : '--';
      
      tooltipEl.innerHTML = `<strong>${label}</strong>: <span style="color:${getScoreColor(target.userData.score).css}">${score}/10</span>`;
      tooltipEl.style.left = `${event.clientX - rect.left + 15}px`;
      tooltipEl.style.top = `${event.clientY - rect.top - 15}px`;
      tooltipEl.style.display = 'block';
    } else {
      hoveredPlanet = null;
      document.body.style.cursor = 'default';
      if (tooltipEl) tooltipEl.style.display = 'none';
    }
  }

  function update(analysisResult, themeName) {
    if (!isInitialized) return;
    currentTheme = themeName || currentTheme;

    // Theme adaptations
    const isLuna = currentTheme === 'luna' || currentTheme === 'editorial';
    if (starfield) {
      starfield.material.color.setHex(isLuna ? 0xc73e2d : 0xffffff);
      starfield.material.opacity = isLuna ? 0.35 : 0.6;
    }
    if (sunMesh) {
      sunMesh.material.color.setHex(isLuna ? 0xc73e2d : 0xffb703);
    }
    if (sunCorona) {
      sunCorona.material.color.setHex(isLuna ? 0xc73e2d : 0xffb703);
    }

    // Update dimensions score mapping
    if (analysisResult && analysisResult.scores) {
      const overall = analysisResult.overallScore || 0;
      
      // Update sun glow based on overall score
      if (sunMesh) {
        const scale = 1.2 + (overall / 100) * 0.6;
        sunMesh.scale.set(scale, scale, scale);
      }

      planets.forEach(p => {
        const key = p.userData.key;
        const scoreVal = analysisResult.scores[key] || 0;
        p.userData.score = scoreVal;

        const colorObj = getScoreColor(scoreVal);
        p.material.color.setHex(colorObj.hex);
        p.material.emissive.setHex(colorObj.hex);
        p.material.emissiveIntensity = 0.3 + (scoreVal / 10) * 0.5;
      });

      orbitRings.forEach(line => {
        line.material.color.setHex(isLuna ? 0x1a1612 : 0x00e5ff);
        line.material.opacity = isLuna ? 0.4 : 0.3;
      });
    }
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);

    if (controls) controls.update();

    // Rotate Sun
    if (sunMesh) sunMesh.rotation.y += 0.003;
    if (sunCorona) sunCorona.rotation.y -= 0.002;

    // Orbit Planets
    planets.forEach(p => {
      p.userData.pivot.rotation.y += p.userData.speed;
      p.rotation.x += 0.01;
      p.rotation.y += 0.015;
    });

    // Gentle starfield sway
    if (starfield) starfield.rotation.y += 0.0003;

    renderer.render(scene, camera);
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
    isInitialized: function() { return isInitialized; }
  };
})();
