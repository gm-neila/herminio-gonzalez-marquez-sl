(async () => {
  const stage = document.querySelector("[data-spain-map]");
  const canvas = document.querySelector("[data-spain-map-canvas]");
  if (!stage || !canvas) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let THREE;
  try {
    THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
  } catch (error) {
    stage.classList.add("is-fallback");
    return;
  }

  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 80);
  const root = new THREE.Group();
  scene.add(root);

  const fillMaterial = new THREE.MeshStandardMaterial({
    color: 0x1b2a21,
    emissive: 0x07130d,
    metalness: 0.18,
    roughness: 0.62
  });

  const islandMaterial = new THREE.MeshStandardMaterial({
    color: 0x24372a,
    emissive: 0x0b1710,
    metalness: 0.16,
    roughness: 0.58
  });

  const routeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffbf00,
    transparent: true,
    opacity: 0.78
  });

  const dimRouteMaterial = new THREE.MeshBasicMaterial({
    color: 0x6d8f4e,
    transparent: true,
    opacity: 0.36
  });

  const pointMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8faf3,
    emissive: 0x234456,
    emissiveIntensity: 0.4,
    roughness: 0.32,
    metalness: 0.18
  });

  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0xffbf00,
    emissive: 0xffbf00,
    emissiveIntensity: 1.1,
    roughness: 0.22,
    metalness: 0.08
  });

  const packetMaterial = new THREE.MeshStandardMaterial({
    color: 0xffc400,
    emissive: 0xffa600,
    emissiveIntensity: 1.4,
    roughness: 0.18,
    metalness: 0.12
  });

  const centerLon = -3.45;
  const centerLat = 40.15;
  const scale = 0.62;
  const toPoint = (lon, lat, z = 0) => new THREE.Vector3((lon - centerLon) * scale, (lat - centerLat) * scale, z);

  const mainland = [
    [-9.32, 43.1],
    [-8.7, 42.25],
    [-8.86, 41.35],
    [-7.55, 39.2],
    [-7.28, 37.2],
    [-6.05, 36.15],
    [-4.95, 36.02],
    [-2.2, 36.72],
    [-0.42, 38.18],
    [0.75, 40.48],
    [3.15, 41.86],
    [2.98, 42.42],
    [1.55, 42.75],
    [-0.16, 42.72],
    [-1.78, 43.28],
    [-3.72, 43.5],
    [-5.56, 43.58],
    [-7.08, 43.62],
    [-8.42, 43.42]
  ];

  const shape = new THREE.Shape();
  mainland.forEach(([lon, lat], index) => {
    const p = toPoint(lon, lat);
    if (index === 0) shape.moveTo(p.x, p.y);
    else shape.lineTo(p.x, p.y);
  });
  shape.closePath();

  const mapGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.035,
    bevelSegments: 2
  });
  mapGeometry.computeVertexNormals();

  const mapMesh = new THREE.Mesh(mapGeometry, fillMaterial);
  mapMesh.position.z = -0.11;
  root.add(mapMesh);

  const outlinePoints = mainland.map(([lon, lat]) => toPoint(lon, lat, 0.075));
  outlinePoints.push(outlinePoints[0].clone());
  const outline = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(outlinePoints),
    new THREE.LineBasicMaterial({ color: 0xffbf00, transparent: true, opacity: 0.72 })
  );
  root.add(outline);

  const grid = new THREE.GridHelper(9.8, 24, 0x31423a, 0x25332c);
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -0.18;
  grid.material.transparent = true;
  grid.material.opacity = 0.38;
  root.add(grid);

  const makeIsland = (lon, lat, radius, xScale = 1.4) => {
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 34), islandMaterial);
    mesh.position.copy(toPoint(lon, lat, 0.025));
    mesh.scale.set(xScale, 0.78, 1);
    root.add(mesh);
    return mesh;
  };

  makeIsland(2.95, 39.55, 0.12, 1.65);
  makeIsland(1.42, 38.96, 0.062, 1.3);
  makeIsland(-15.6, 28.35, 0.06, 1.4);
  makeIsland(-16.3, 28.05, 0.05, 1.2);
  makeIsland(-13.55, 28.96, 0.048, 1.25);

  const hubs = {
    Salamanca: [-5.66, 40.97],
    Madrid: [-3.7, 40.42],
    Barcelona: [2.17, 41.38],
    Valencia: [-0.38, 39.47],
    Sevilla: [-5.99, 37.39],
    Zaragoza: [-0.89, 41.65],
    Bilbao: [-2.93, 43.26],
    "A Coruna": [-8.41, 43.36]
  };

  const sphereGeometry = new THREE.SphereGeometry(0.075, 24, 16);
  const baseGeometry = new THREE.SphereGeometry(0.11, 28, 18);
  const ringGeometry = new THREE.TorusGeometry(0.16, 0.012, 8, 48);
  const routeGroup = new THREE.Group();
  const packetGroup = new THREE.Group();
  root.add(routeGroup, packetGroup);

  Object.entries(hubs).forEach(([name, [lon, lat]]) => {
    const isBase = name === "Salamanca";
    const point = toPoint(lon, lat, 0.2);
    const sphere = new THREE.Mesh(isBase ? baseGeometry : sphereGeometry, isBase ? baseMaterial : pointMaterial);
    sphere.position.copy(point);
    root.add(sphere);

    const ring = new THREE.Mesh(
      ringGeometry,
      new THREE.MeshBasicMaterial({
        color: isBase ? 0xffbf00 : 0x88c7dd,
        transparent: true,
        opacity: isBase ? 0.72 : 0.34
      })
    );
    ring.position.copy(point);
    root.add(ring);
  });

  const routes = [
    ["Salamanca", "Madrid", 0.03],
    ["Salamanca", "Barcelona", 0.08],
    ["Salamanca", "Valencia", -0.04],
    ["Salamanca", "Sevilla", -0.08],
    ["Salamanca", "Zaragoza", 0.11],
    ["Salamanca", "Bilbao", 0.06],
    ["Salamanca", "A Coruna", -0.05],
    ["Madrid", "Barcelona", 0.02],
    ["Madrid", "Valencia", -0.03]
  ];

  const packets = [];
  const packetGeometry = new THREE.SphereGeometry(0.055, 20, 14);

  const makeRoute = ([from, to, bend], index) => {
    const a = toPoint(...hubs[from], 0.22);
    const b = toPoint(...hubs[to], 0.22);
    const distance = a.distanceTo(b);
    const mid = a.clone().lerp(b, 0.5);
    mid.z += 0.36 + distance * 0.12;
    mid.x += bend * distance;
    mid.y += Math.sin(index * 1.7) * 0.08;

    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const routeMesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, index < 7 ? 0.012 : 0.008, 8, false),
      index < 7 ? routeMaterial : dimRouteMaterial
    );
    routeGroup.add(routeMesh);

    const packet = new THREE.Mesh(packetGeometry, packetMaterial);
    packetGroup.add(packet);
    packets.push({
      curve,
      mesh: packet,
      offset: index / routes.length,
      speed: index < 7 ? 0.00013 + index * 0.000008 : 0.00009
    });
  };

  routes.forEach(makeRoute);

  scene.add(new THREE.AmbientLight(0xffffff, 0.78));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(-3.5, -4.5, 6.8);
  scene.add(keyLight);

  const amberLight = new THREE.PointLight(0xffbf00, 3.2, 8);
  amberLight.position.copy(toPoint(-5.66, 40.97, 2.2));
  scene.add(amberLight);

  const blueLight = new THREE.PointLight(0x4d87a5, 1.8, 9);
  blueLight.position.set(3.2, 1.4, 2.8);
  scene.add(blueLight);

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;

    if (width < 620) {
      camera.position.set(0.15, -8.2, 6.7);
      root.position.set(0.0, -0.1, 0);
      root.scale.setScalar(0.82);
    } else {
      camera.position.set(0.25, -7.45, 5.8);
      root.position.set(0.55, -0.06, 0);
      root.scale.setScalar(1);
    }

    camera.lookAt(0.35, 0.08, 0.05);
    camera.updateProjectionMatrix();
  };

  resize();
  window.addEventListener("resize", resize, { passive: true });
  stage.classList.add("is-ready");

  let lastFrame = 0;
  const render = (time) => {
    if (time - lastFrame > 30) {
      const t = prefersReducedMotion ? 0 : time;
      root.rotation.z = Math.sin(t * 0.00022) * 0.035;
      routeGroup.rotation.z = Math.sin(t * 0.00028) * 0.01;

      packets.forEach(({ curve, mesh, offset, speed }, index) => {
        const phase = prefersReducedMotion ? offset : (time * speed + offset) % 1;
        const point = curve.getPoint(phase);
        mesh.position.copy(point);
        const scalePulse = 1 + Math.sin(time * 0.004 + index) * 0.14;
        mesh.scale.setScalar(prefersReducedMotion ? 1 : scalePulse);
      });

      renderer.render(scene, camera);
      lastFrame = time;
    }

    if (!prefersReducedMotion) requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
})();
