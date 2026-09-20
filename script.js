// Navigation remains usable without JavaScript; only the mobile toggle is enhanced.
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const navLinks = [...nav.querySelectorAll('a')];
const mobileMenu = window.matchMedia('(max-width: 760px)');

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  menuButton.querySelector('span').textContent = open ? '−' : '+';
  nav.classList.toggle('open', open);
}

document.documentElement.classList.add('js-nav');
menuButton.hidden = false;
setMenu(false);
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
navLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) setMenu(false);
});
mobileMenu.addEventListener('change', () => setMenu(false));
document.getElementById('year').textContent = new Date().getFullYear();

if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-15% 0px -65% 0px' });
  document.querySelectorAll('main section[id]').forEach(section => navObserver.observe(section));
}

// A small, self-contained WebGL renderer. No models, textures, or 3D dependencies.
(() => {
  const canvas = document.getElementById('sculpture');
  const visual = document.getElementById('hero-visual');
  const toggle = document.getElementById('motion-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const frameInterval = 1000 / (coarsePointer.matches ? 24 : 30);
  let gl;
  let program;
  let buffers = [];
  let shaders = [];
  let uniforms;
  let indexCount = 0;
  let frame = 0;
  let lastFrame = 0;
  let elapsed = 0;
  let visible = false;
  let paused = false;
  let ready = false;
  let lost = false;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;

  const vertexSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform vec2 uRotation;
    uniform float uAspect;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      float cx = cos(uRotation.x), sx = sin(uRotation.x);
      float cy = cos(uRotation.y), sy = sin(uRotation.y);
      mat3 rx = mat3(1.,0.,0., 0.,cx,sx, 0.,-sx,cx);
      mat3 ry = mat3(cy,0.,-sy, 0.,1.,0., sy,0.,cy);
      float cz = cos(-0.35), sz = sin(-0.35);
      mat3 rz = mat3(cz,sz,0., -sz,cz,0., 0.,0.,1.);
      mat3 rotation = rz * rx * ry;
      vPosition = rotation * aPosition;
      vNormal = rotation * aNormal;
      float scale = 2.05 / min(uAspect, 1.0);
      gl_Position = vec4(vPosition.x / (scale * uAspect), vPosition.y / scale, -vPosition.z / 8.0, 1.0);
    }
  `;
  const fragmentSource = `
    precision mediump float;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec3 n = normalize(vNormal);
      vec3 light = normalize(vec3(-0.6, 0.9, 1.4));
      vec3 view = vec3(0.0, 0.0, 1.0);
      float diffuse = max(dot(n, light), 0.0);
      float specular = pow(max(dot(n, normalize(light + view)), 0.0), 48.0);
      float rim = pow(1.0 - max(dot(n, view), 0.0), 3.0);
      vec3 base = mix(vec3(0.40, 0.29, 0.65), vec3(0.67, 0.56, 0.84), smoothstep(-1.5, 1.5, vPosition.y));
      vec3 color = base * (0.57 + 0.53 * diffuse) + vec3(0.30, 0.25, 0.35) * specular + vec3(0.11, 0.08, 0.17) * rim;
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const normalize = v => {
    const length = Math.hypot(...v) || 1;
    return v.map(value => value / length);
  };
  const subtract = (a, b) => a.map((value, i) => value - b[i]);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const curve = t => {
    const radius = 2 + 0.7 * Math.cos(3 * t);
    return [radius * Math.cos(2 * t), radius * Math.sin(2 * t), 0.7 * Math.sin(3 * t)];
  };
  function surface(t, u) {
    const center = curve(t);
    const tangent = normalize(subtract(curve(t + 0.0001), curve(t - 0.0001)));
    const normal = normalize(cross(tangent, [0, 0, 1]));
    const binormal = cross(tangent, normal);
    const radius = 0.37 + 0.025 * Math.cos(64 * t);
    return center.map((value, i) => 0.56 * (value + radius * (normal[i] * Math.cos(u) + binormal[i] * Math.sin(u))));
  }

  function buildMesh() {
    const rings = 512;
    const sides = 24;
    const vertices = new Float32Array((rings + 1) * (sides + 1) * 6);
    const indices = new Uint16Array(rings * sides * 6);
    let offset = 0;
    for (let i = 0; i <= rings; i++) {
      const t = i / rings * Math.PI * 2;
      for (let j = 0; j <= sides; j++) {
        const u = j / sides * Math.PI * 2;
        const position = surface(t, u);
        const dt = subtract(surface(t + 0.0001, u), surface(t - 0.0001, u));
        const du = subtract(surface(t, u + 0.0001), surface(t, u - 0.0001));
        const normal = normalize(cross(du, dt));
        vertices.set([...position, ...normal], offset);
        offset += 6;
      }
    }
    offset = 0;
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < sides; j++) {
        const a = i * (sides + 1) + j;
        const b = a + sides + 1;
        indices.set([a, b, a + 1, b, b + 1, a + 1], offset);
        offset += 6;
      }
    }
    return { vertices, indices };
  }

  // Geometry is generated only when WebGL is available and the hero is visible.
  let mesh;
  function compile(type, source) {
    const shader = gl.createShader(type);
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Sculpture shader unavailable.');
    return shader;
  }
  function cleanup() {
    buffers.forEach(buffer => gl.deleteBuffer(buffer));
    shaders.forEach(shader => gl.deleteShader(shader));
    if (program) gl.deleteProgram(program);
    buffers = [];
    shaders = [];
    program = null;
  }
  function initialize() {
    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: true, depth: true, stencil: false, powerPreference: 'low-power' });
      if (!gl) return false;
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Sculpture program unavailable.');
      gl.useProgram(program);
      if (!mesh) mesh = buildMesh();
      const vertexBuffer = gl.createBuffer();
      buffers.push(vertexBuffer);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
      ['aPosition', 'aNormal'].forEach((name, i) => {
        const location = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 24, i * 12);
      });
      const indexBuffer = gl.createBuffer();
      buffers.push(indexBuffer);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
      indexCount = mesh.indices.length;
      uniforms = { rotation: gl.getUniformLocation(program, 'uRotation'), aspect: gl.getUniformLocation(program, 'uAspect') };
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 0);
      ready = true;
      resize();
      visual.classList.add('webgl-ready');
      toggle.hidden = reducedMotion.matches;
      return true;
    } catch (error) {
      if (gl) cleanup();
      ready = false;
      visual.classList.remove('webgl-ready');
      toggle.hidden = true;
      return false;
    }
  }

  function draw() {
    if (!ready || lost) return;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform2f(uniforms.rotation, 0.45 + pointerY, -0.35 + elapsed * 0.10 + pointerX);
    gl.uniform1f(uniforms.aspect, canvas.width / canvas.height);
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
  }
  function resize() {
    if (!ready || lost) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(800000 / (rect.width * rect.height)));
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height);
    draw();
  }
  function shouldAnimate() {
    return ready && !lost && visible && !document.hidden && !paused && !reducedMotion.matches;
  }
  function animate(now) {
    frame = 0;
    if (!shouldAnimate()) return;
    if (!lastFrame || now - lastFrame >= frameInterval) {
      elapsed += lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 0;
      lastFrame = now;
      pointerX += (targetX - pointerX) * 0.06;
      pointerY += (targetY - pointerY) * 0.06;
      draw();
    }
    frame = requestAnimationFrame(animate);
  }
  function syncAnimation() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
    if (shouldAnimate()) frame = requestAnimationFrame(animate);
  }
  function activate() {
    if (visible && !ready && !lost && !reducedMotion.matches && !document.hidden) initialize();
    syncAnimation();
  }

  toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Resume sculpture animation' : 'Pause sculpture animation');
    toggle.innerHTML = paused ? 'Play <span aria-hidden="true">▷</span>' : 'Pause <span aria-hidden="true">Ⅱ</span>';
    syncAnimation();
  });
  visual.addEventListener('pointermove', event => {
    if (coarsePointer.matches || reducedMotion.matches || paused) return;
    const rect = visual.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.4;
    targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.3;
  }, { passive: true });
  visual.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; });
  document.addEventListener('visibilitychange', activate);
  reducedMotion.addEventListener('change', () => {
    toggle.hidden = reducedMotion.matches || !ready;
    activate();
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    ready = false;
    visual.classList.remove('webgl-ready');
    toggle.hidden = true;
    syncAnimation();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    buffers = [];
    shaders = [];
    program = null;
    activate();
  });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      activate();
    }, { threshold: 0 }).observe(visual);
  } else {
    visible = true;
    activate();
  }
})();
