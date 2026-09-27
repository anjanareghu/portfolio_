// A glass companion rendered with analytic ellipsoids, not a downloaded 3D model.
// One transparent quad / one draw call; only transforms and uniforms change per frame.
(() => {
  'use strict';
  const canvas = document.getElementById('sculpture');
  const stage = document.getElementById('character-stage');
  const hero = document.getElementById('hero-visual');
  const toggle = document.getElementById('motion-toggle');
  if (!canvas || !stage || !hero || !toggle) return;
  const stageNext = stage.nextSibling;
  const toggleHome = toggle.parentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = matchMedia('(pointer: coarse)');
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = value => value * value * (3 - 2 * value);
  let gl, program, buffer, uniforms;
  let shaders = [];
  let ready = false, failed = false, lost = false, paused = !!window.PortfolioMotion?.disabled;
  let frame = 0, lastFrame = 0, elapsed = 0;
  let scrollPosition = window.scrollY;
  let pointer = null;
  let lookX = 0, lookY = 0;
  let ctaLookTarget = null, gazeX = 0, gazeY = 0;
  let metrics, anchors = [], obstacles = [], intro = null, opening = null;

  const vertexSource = `
    attribute vec2 aPosition;
    varying vec2 vUv;
    void main() {
      vUv = aPosition;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;
  const fragmentSource = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    varying vec2 vUv;
    uniform vec2 uLook;
    uniform float uTime;
    uniform float uBlink;

    // Returns the nearest ray hit and its edge coverage; a negative hit is empty.
    vec2 ellipsoid(vec3 ro, vec3 rd, vec3 center, vec3 radius) {
      vec3 o = (ro - center) / radius;
      vec3 d = rd / radius;
      float a = dot(d, d);
      float b = dot(o, d);
      float c = dot(o, o) - 1.0;
      float discriminant = b * b - a * c;
      if (discriminant < 0.0) return vec2(-1.0, 0.0);
      float root = sqrt(discriminant);
      return vec2((-b - root) / a, smoothstep(0.0, 0.085, root));
    }
    float eye(vec2 point, vec2 center) {
      vec2 p = point - center;
      p.y /= uBlink;
      p.y -= clamp(p.y, -0.105, 0.105);
      return length(p) - 0.057;
    }
    void main() {
      float cx = cos(uLook.y), sx = sin(uLook.y);
      float cy = cos(uLook.x), sy = sin(uLook.x);
      mat3 rx = mat3(1.,0.,0., 0.,cx,sx, 0.,-sx,cx);
      mat3 ry = mat3(cy,0.,-sy, 0.,1.,0., sy,0.,cy);
      mat3 inverseRotation = rx * ry;
      vec3 ro = inverseRotation * vec3(0.0, 0.0, 4.5);
      vec3 rd = inverseRotation * normalize(vec3(vUv * 1.47, -4.5));
      vec3 center = vec3(0.0, 0.13, 0.0);
      vec3 radius = vec3(0.86, 0.90, 0.69);
      vec2 hit = ellipsoid(ro, rd, center, radius);
      float material = 0.0;
      float handLift = sin(uTime * 1.15) * 0.025;
      vec3 left = vec3(-0.73, -0.48 + handLift, 0.35);
      vec3 right = vec3(0.73, -0.48 - handLift, 0.35);
      vec3 handRadius = vec3(0.25, 0.18, 0.24);
      vec2 leftHit = ellipsoid(ro, rd, left, handRadius);
      if (leftHit.x > 0.0 && (hit.x < 0.0 || leftHit.x < hit.x)) {
        hit = leftHit; center = left; radius = handRadius; material = 1.0;
      }
      vec2 rightHit = ellipsoid(ro, rd, right, handRadius);
      if (rightHit.x > 0.0 && (hit.x < 0.0 || rightHit.x < hit.x)) {
        hit = rightHit; center = right; radius = handRadius; material = 1.0;
      }
      if (hit.x < 0.0) { gl_FragColor = vec4(0.0); return; }
      vec3 p = ro + rd * hit.x;
      vec3 n = normalize((p - center) / (radius * radius));
      vec3 view = -rd;
      vec3 reflection = reflect(rd, n);
      float facing = clamp(dot(n, view), 0.0, 1.0);
      float fresnel = pow(1.0 - facing, 2.7);
      vec3 lavender = mix(vec3(0.51, 0.49, 0.94), vec3(0.76, 0.71, 0.99), smoothstep(-0.8, 1.0, p.y));
      float diffuse = max(dot(n, normalize(vec3(-0.6, 0.85, 1.3))), 0.0);
      vec3 color = lavender * (0.84 + diffuse * 0.16);
      // Broad reflected light bands give the shell its pearlescent glass finish.
      float band = exp(-pow((reflection.y - 0.58) * 5.0, 2.0));
      float pink = exp(-pow((reflection.y + reflection.x * 0.35 + 0.52) * 4.5, 2.0));
      color = mix(color, vec3(0.82, 0.88, 1.0), band * 0.43);
      color = mix(color, vec3(1.0, 0.73, 0.86), pink * (0.24 + fresnel * 0.40));
      vec3 pearl = mix(vec3(0.86, 0.91, 1.0), vec3(1.0, 0.86, 0.82), smoothstep(-0.2, 0.7, -n.x));
      color = mix(color, pearl, fresnel * 0.92);
      float highlight = pow(max(dot(reflection, normalize(vec3(-0.55, 0.85, 1.0))), 0.0), 38.0);
      color += vec3(1.0, 0.96, 0.94) * highlight * 0.75;
      color += vec3(0.18, 0.15, 0.24) * pow(1.0 - facing, 14.0);
      if (material < 0.5 && p.z > 0.25) {
        float distanceToEyes = min(eye(p.xy, vec2(-0.245, 0.22)), eye(p.xy, vec2(0.245, 0.22)));
        float glow = exp(-max(distanceToEyes, 0.0) * 24.0);
        color += vec3(0.18, 0.12, 0.18) * glow;
        color = mix(color, vec3(1.0, 0.99, 0.96), 1.0 - smoothstep(-0.004, 0.006, distanceToEyes));
      }
      float alpha = (0.88 + fresnel * 0.12) * hit.y;
      gl_FragColor = vec4(min(color, vec3(1.0)) * alpha, alpha);
    }
  `;

  function measure() {
    const rect = hero.getBoundingClientRect();
    const scene = hero.closest('.hero-scene');
    const home = document.getElementById('home');
    // A sticky child's rect moves relative to the document; use its local offset.
    const sceneOffset = scene ? rect.top - scene.getBoundingClientRect().top : 0;
    const documentTop = scene ? home.getBoundingClientRect().top + window.scrollY + sceneOffset : rect.top + window.scrollY;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const mobile = width <= 760;
    // Leave room for the rotated static canvas on narrow screens.
    const size = Math.min(mobile ? rect.width * 0.88 : rect.width + 24, rect.height, 540) * .6;
    metrics = {
      width, height, size,
      x: rect.left + rect.width / 2,
      y: documentTop + rect.height * 0.47,
      heroBottom: documentTop + rect.height,
    };
    metrics.header = width > 1000 ? document.querySelector('.site-header')?.offsetHeight || 0 : 0;
    anchors = [...document.querySelectorAll('.character-anchor')].map(anchor => {
      const bounds = anchor.getBoundingClientRect();
      const host = anchor.parentElement.getBoundingClientRect();
      const section = anchor.closest('section');
      const sectionBounds = section.getBoundingClientRect();
      return { id: section.id, x: bounds.left + bounds.width / 2,
        y: bounds.top + scrollY + bounds.height / 2, size: bounds.width,
        top: sectionBounds.top + scrollY, bottom: sectionBounds.bottom + scrollY,
        gutter: Math.max(12, (document.documentElement.clientWidth || width) - host.right) };
    });
    // Cache actual text/image/control bounds only on layout changes. Empty heading
    // space is available for the character; content and controls are protected.
    obstacles = [];
    document.querySelectorAll('main h2, main h3, main p:not([hidden]), main a, main button, .project-card, .recognition-media, .profile-evidence').forEach(element => {
      if (element.closest('[hidden], dialog') || !element.getClientRects().length) return;
      let bounds;
      if (/^H[23]$|^P$/.test(element.tagName)) {
        const range = document.createRange(); range.selectNodeContents(element);
        bounds = range.getBoundingClientRect();
      } else bounds = element.getBoundingClientRect();
      if (bounds.width && bounds.height) obstacles.push({ left: bounds.left - 8, right: bounds.right + 8,
        top: bounds.top + scrollY - 12, bottom: bounds.bottom + scrollY + 12 });
    });
    stage.style.width = `${size}px`;
    stage.style.height = `${size}px`;
    if (ready) resizeCanvas();
    updateControl();
    activate();
  }
  function overlaps(pose, scroll) {
    const radius = pose.size * .52;
    return obstacles.some(box => pose.x + radius > box.left && pose.x - radius < box.right &&
      pose.y + scroll + radius > box.top && pose.y + scroll - radius < box.bottom);
  }
  function sectionPose(scroll) {
    const touch = coarsePointer.matches || metrics.width <= 760;
    let anchor = anchors[0];
    for (const item of anchors) if (item.top <= scroll + metrics.height * .65) anchor = item;
    if (!anchor) return { x: metrics.x, y: metrics.y - scroll, size: metrics.size, roll: -8, opacity: 1 };
    const y = anchor.y - scroll;
    const enter = smooth(clamp((metrics.height * .98 - y) / (metrics.height * .22), 0, 1));
    const leave = smooth(clamp((y - metrics.header - anchor.size * .4) / (metrics.height * .20), 0, 1));
    let weight = enter * leave;
    const viewportWidth = document.documentElement.clientWidth || metrics.width;
    const railSize = Math.min(36, Math.max(12, anchor.gutter - 10));
    const sectionProgress = clamp((scroll + metrics.height * .5 - anchor.top) / Math.max(1, anchor.bottom - anchor.top), 0, 1);
    const rail = { x: viewportWidth - anchor.gutter / 2, y: metrics.height * (.32 + .22 * sectionProgress), size: railSize, roll: -3, opacity: .78 };
    if (touch) {
      const pose = { x: anchor.x, y, size: Math.min(48, anchor.size), roll: -3 + 4 * sectionProgress, opacity: weight };
      if (overlaps(pose, scroll)) pose.opacity = 0;
      return pose;
    }
    let pose;
    for (let attempt = 0; attempt < 5; attempt++) {
      pose = { x: mix(rail.x, anchor.x, weight), y: mix(rail.y, y, weight),
        size: mix(rail.size, Math.min(180, anchor.size), weight),
        roll: mix(-3, 3, sectionProgress), opacity: mix(.78, 1, weight) };
      if (!overlaps(pose, scroll) && pose.y - pose.size * .52 > metrics.header + 8) return pose;
      weight *= .45;
    }
    return rail;
  }
  function poseAt(scroll) {
    const natural = { x: metrics.x, y: metrics.y - scroll, size: metrics.size, roll: -8, opacity: 1 };
    if (opening?.enabled && scroll >= opening.start && scroll <= opening.start + opening.range) {
      return openingPose(clamp((scroll - opening.start) / opening.range, 0, 1));
    }
    const end = opening?.enabled ? opening.start + opening.range : metrics.heroBottom - metrics.height * .12;
    return scroll < end ? natural : sectionPose(scroll);
  }
  function openingPose(t) {
    const reframe = smooth(clamp((t - .25) / .65, 0, 1));
    const scroll = opening.start + t * opening.range;
    const destination = sectionPose(scroll);
    return {
      x: mix(metrics.x, destination.x, reframe),
      y: mix(metrics.y - opening.start, destination.y, reframe),
      size: mix(metrics.size, destination.size, reframe),
      roll: mix(-8, destination.roll, reframe), opacity: 1,
    };
  }
  function onScreen() {
    if (intro) return true;
    const pose = poseAt(window.scrollY);
    return pose.opacity > .01 && pose.y + pose.size / 2 > 0 && pose.y - pose.size / 2 < metrics.height;
  }
  function presenceAt(scroll) { return poseAt(scroll).opacity; }
  function updateControl() {
    const docked = !reducedMotion.matches && window.scrollY > metrics.heroBottom - metrics.height * .30;
    toggle.classList.toggle('is-docked', docked);
    // Fixed elements must escape the sticky scene's stacking context.
    if (docked && toggle.parentElement !== document.body) document.body.append(toggle);
    else if (!docked && toggle.parentElement !== toggleHome) toggleHome.append(toggle);
    toggle.hidden = false;
  }
  function compile(type, source) {
    const shader = gl.createShader(type);
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Character shader unavailable.');
    return shader;
  }
  function initialize() {
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
      if (!gl) { failed = true; return; }
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Character program unavailable.');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'aPosition');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      uniforms = { look: gl.getUniformLocation(program, 'uLook'), time: gl.getUniformLocation(program, 'uTime'), blink: gl.getUniformLocation(program, 'uBlink') };
      gl.clearColor(0, 0, 0, 0);
      ready = true;
      resizeCanvas();
      hero.classList.add('webgl-ready');
      stage.classList.add('webgl-ready');
      updateControl();
    } catch (error) {
      if (buffer) gl.deleteBuffer(buffer);
      shaders.forEach(shader => gl.deleteShader(shader));
      if (program) gl.deleteProgram(program);
      ready = false;
      failed = true;
      updateControl();
    }
  }
  function resizeCanvas() {
    if (!ready || lost) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(500000) / metrics.size);
    const pixels = Math.max(1, Math.floor(metrics.size * ratio));
    if (canvas.width !== pixels || canvas.height !== pixels) {
      canvas.width = canvas.height = pixels;
      gl.viewport(0, 0, pixels, pixels);
    }
    render(shouldAnimate());
  }
  function render(moving) {
    stage.style.opacity = intro ? (intro.landing === 0 ? '0' : '1') : String(moving ? presenceAt(window.scrollY) : 1);
    if (moving) {
      // One existing canvas, moved to the page overlay while travelling.
      if (stage.parentElement !== document.body) document.body.append(stage);
      const pose = poseAt(scrollPosition);
      if (intro) {
        pose.x -= 24 * (1 - intro.landing);
        pose.y += 36 * (1 - intro.landing);
        pose.size *= mix(.8, 1, intro.landing);
        pose.roll += 2 * (1 - intro.landing);
      }
      const targetX = pointer ? clamp((pointer.x - pose.x) / (metrics.width * 0.40), -1, 1) : 0;
      const targetY = pointer ? clamp((pointer.y - pose.y) / (metrics.height * 0.40), -1, 1) : 0;
      lookX = mix(lookX, targetX, 0.12);
      lookY = mix(lookY, targetY, 0.12);
      let gazeTargetX = targetX, gazeTargetY = targetY;
      if (ctaLookTarget && !coarsePointer.matches) {
        const rect = ctaLookTarget.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < metrics.height) {
          gazeTargetX = clamp((rect.left + rect.width / 2 - pose.x) / (metrics.width * 0.4), -0.8, 0.8);
          gazeTargetY = clamp((rect.top + rect.height / 2 - pose.y) / (metrics.height * 0.4), -0.8, 0.8);
        } else ctaLookTarget = null;
      }
      gazeX = mix(gazeX, gazeTargetX, 0.14);
      gazeY = mix(gazeY, gazeTargetY, 0.14);
      const scrubbed = (opening?.enabled && scrollPosition >= opening.start) || scrollPosition > metrics.heroBottom - metrics.height * .5;
      const bob = intro || scrubbed ? 0 : Math.sin(elapsed * 1.2) * 2.5 * pose.size / metrics.size;
      // The viewport crops the shot; do not force the complete subject onscreen.
      const x = pose.x - metrics.size / 2;
      const y = pose.y + bob - metrics.size / 2;
      const roll = pose.roll;
      stage.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${(pose.size / metrics.size).toFixed(4)}) rotate(${roll.toFixed(2)}deg)`;
      stage.classList.add('character-travelling');
    } else {
      if (stage.parentElement !== hero) hero.insertBefore(stage, stageNext);
      stage.classList.remove('character-travelling');
      stage.style.transform = '';
      lookX = lookY = 0;
      gazeX = gazeY = 0;
    }
    stage.style.setProperty('--look-x', `${(gazeX * 10).toFixed(2)}px`);
    stage.style.setProperty('--look-y', `${(gazeY * 7).toFixed(2)}px`);
    // CSS fallback follows the same route even when WebGL is unavailable or lost.
    if (!ready || lost) return;
    // A quick, occasional blink; the face always remains open in the static state.
    const scrubbed = (opening?.enabled && scrollPosition >= opening.start) || scrollPosition > metrics.heroBottom - metrics.height * .5;
    const sceneTime = scrubbed ? scrollPosition / Math.max(1, metrics.height) : elapsed;
    const blinkPhase = sceneTime % 6.4;
    const blink = moving && !scrubbed ? 1 - 0.88 * Math.exp(-Math.pow((blinkPhase - 5.7) / 0.075, 2)) : 1;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uniforms.look, -gazeX * 0.46, -gazeY * 0.32);
    gl.uniform1f(uniforms.time, moving ? sceneTime : 0);
    gl.uniform1f(uniforms.blink, blink);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function shouldAnimate() {
    return !paused && !reducedMotion.matches && !document.hidden && !document.querySelector('dialog[open]') && onScreen();
  }
  function animate(now) {
    frame = 0;
    if (!shouldAnimate()) {
      // Apply the static pose immediately if media preferences change mid-frame.
      updateControl();
      if (paused || reducedMotion.matches) render(false);
      return;
    }
    const interval = 1000 / (coarsePointer.matches ? 30 : 60);
    if (!lastFrame || now - lastFrame >= interval) {
      const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 1 / 30;
      lastFrame = now;
      elapsed += dt;
      scrollPosition = window.scrollY;
      render(true);
    }
    frame = requestAnimationFrame(animate);
  }
  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
  }
  function activate() {
    if (!metrics) return;
    if (!ready && !failed && !lost && !reducedMotion.matches && !document.hidden && onScreen()) initialize();
    if (shouldAnimate()) {
      if (!frame) frame = requestAnimationFrame(animate);
    } else {
      stop();
      if (paused || reducedMotion.matches) render(false);
      else if (!intro && !onScreen()) stage.style.opacity = '0';
    }
  }
  document.addEventListener('portfolio:motion', event => {
    paused = event.detail.disabled;
    scrollPosition = window.scrollY;
    updateControl();
    activate();
  });
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || reducedMotion.matches || paused) return;
    pointer = { x: event.clientX, y: event.clientY };
  }, { passive: true });
  document.addEventListener('portfolio:character-look', event => {
    const target = event.detail?.target;
    if (!target) { ctaLookTarget = null; return; }
    if (!(target instanceof Element) || reducedMotion.matches || coarsePointer.matches || paused) return;
    const bounds = stage.getBoundingClientRect();
    if (bounds.bottom <= 0 || bounds.top >= innerHeight || bounds.right <= 0 || bounds.left >= innerWidth) return;
    ctaLookTarget = target;
  });
  document.documentElement.addEventListener('pointerleave', () => { pointer = null; });
  window.addEventListener('blur', () => { pointer = null; ctaLookTarget = null; });
  window.addEventListener('scroll', () => { updateControl(); activate(); }, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scrollPosition = window.scrollY;
    activate();
  });
  reducedMotion.addEventListener('change', () => { scrollPosition = window.scrollY; updateControl(); activate(); });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    ready = false;
    hero.classList.remove('webgl-ready');
    stage.classList.remove('webgl-ready');
    updateControl();
    activate();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = failed = false;
    program = buffer = null;
    shaders = [];
    scrollPosition = window.scrollY;
    activate();
  });
  // Layout is measured on resize/content changes, never on every pointer or scroll event.
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  document.addEventListener('toggle', measure, true);
  document.addEventListener('portfolio:layout', measure);
  // Native dialog state changes do not always resize the document.
  document.querySelectorAll('dialog').forEach(dialog => {
    new MutationObserver(activate).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  });
  if (document.fonts) document.fonts.ready.then(measure);
  window.portfolioCharacter = {
    setOpening(value) {
      opening = value;
      measure();
    },
    setIntro(progress, landing) {
      if (reducedMotion.matches) return;
      intro = { progress, landing };
      scrollPosition = window.scrollY;
      render(true);
    },
    endIntro() {
      intro = null;
      stage.style.clipPath = '';
      scrollPosition = window.scrollY;
      render(!paused && !reducedMotion.matches);
      activate();
    },
  };
  measure();
})();
