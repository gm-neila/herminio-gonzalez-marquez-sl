(() => {
  const header = document.querySelector("[data-header]");
  const meter = document.querySelector(".scroll-meter");
  const nav = document.querySelector("[data-nav]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const revealItems = document.querySelectorAll(".reveal");
  const navLinks = Array.from(document.querySelectorAll(".main-nav a[href^='#']"));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setHeaderState = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
    meter.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  };

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  menuToggle?.addEventListener("click", () => {
    document.body.classList.toggle("menu-open");
    const isOpen = document.body.classList.contains("menu-open");
    menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  });

  nav?.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (link) document.body.classList.remove("menu-open");
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  const navObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
      });
    },
    { rootMargin: "-36% 0px -52% 0px", threshold: [0.08, 0.2, 0.36] }
  );

  sections.forEach((section) => navObserver.observe(section));

  const setupCanvas = (canvas) => {
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return null;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      return { width: rect.width, height: rect.height, ratio };
    };

    return { canvas, context, resize, size: resize() };
  };

  const ambient = setupCanvas(document.getElementById("ambientCanvas"));
  const hero = setupCanvas(document.getElementById("routeCanvas"));
  const network = setupCanvas(document.getElementById("networkCanvas"));

  window.addEventListener("resize", () => {
    if (ambient) ambient.size = ambient.resize();
    if (hero) hero.size = hero.resize();
    if (network) network.size = network.resize();
  });

  const drawAmbient = (time) => {
    if (!ambient) return;
    const { context: ctx } = ambient;
    const { width, height } = ambient.size;
    const mobile = width < 620;
    const lanes = mobile ? 7 : 13;
    const packets = mobile ? 9 : 18;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.lineCap = "round";

    for (let i = 0; i < lanes; i += 1) {
      const y = (height * 0.12 + i * (height / lanes) + (time * 0.012)) % (height + 120) - 60;
      const alpha = 0.05 + (i % 4) * 0.015;
      ctx.strokeStyle = `rgba(18, 20, 18, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-80, y);
      ctx.bezierCurveTo(width * 0.26, y - 90, width * 0.68, y + 120, width + 80, y + 20);
      ctx.stroke();
    }

    for (let i = 0; i < packets; i += 1) {
      const phase = (time * 0.00008 + i / packets) % 1;
      const x = width * (0.05 + phase * 0.9);
      const y = height * (0.18 + ((i * 0.137) % 0.66)) + Math.sin(phase * Math.PI * 2) * 16;
      const size = mobile ? 3 : 4;
      const color = i % 3 === 0 ? "rgba(77, 135, 165, 0.28)" : "rgba(241, 165, 31, 0.22)";

      ctx.fillStyle = color;
      ctx.fillRect(x, y, size * 3.4, size);
    }

    ctx.restore();
  };

  const drawHeroRoutes = (time) => {
    if (!hero) return;
    const { context: ctx } = hero;
    const { width, height } = hero.size;
    ctx.clearRect(0, 0, width, height);

    const vanishingX = width * 0.45;
    const vanishingY = height * 0.42;
    ctx.save();
    ctx.globalAlpha = 0.44;
    ctx.lineWidth = 1;

    for (let i = 0; i < 11; i += 1) {
      const offset = i * 78;
      const leftX = -120 + offset;
      const rightX = width * 0.98 - offset * 0.2;
      ctx.strokeStyle = `rgba(241, 165, 31, ${0.08 + i * 0.012})`;
      ctx.beginPath();
      ctx.moveTo(leftX, height + 40);
      ctx.quadraticCurveTo(vanishingX - i * 4, vanishingY + i * 12, rightX, height * 0.9);
      ctx.stroke();
    }

    for (let i = 0; i < 7; i += 1) {
      const y = height * (0.18 + i * 0.095);
      const alpha = 0.05 + i * 0.012;
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(width * 0.02, y);
      ctx.lineTo(width * 0.96, y + Math.sin(time * 0.0008 + i) * 18);
      ctx.stroke();
    }

    const packets = 16;
    for (let i = 0; i < packets; i += 1) {
      const phase = ((time * 0.00014 + i / packets) % 1);
      const x = width * (0.06 + phase * 0.74);
      const y = height * (0.78 - Math.sin(phase * Math.PI) * 0.25);
      const scale = 0.35 + phase * 1.4;

      ctx.fillStyle = i % 3 === 0 ? "rgba(109, 143, 78, 0.85)" : "rgba(241, 165, 31, 0.86)";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(x, y, 2.2 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  const project = (point, width, height) => {
    const depth = point.z;
    const scale = 1 / (1 + depth * 0.0018);
    return {
      x: width * 0.5 + (point.x - width * 0.5) * scale,
      y: height * 0.52 + (point.y - height * 0.52) * scale - depth * 0.16,
      scale
    };
  };

  const networkNodes = [
    { x: 110, y: 430, z: 0, label: "SA" },
    { x: 270, y: 220, z: 80, label: "CL" },
    { x: 430, y: 330, z: 40, label: "IB" },
    { x: 585, y: 245, z: 130, label: "BT" },
    { x: 520, y: 455, z: 20, label: "EN" }
  ];

  const networkLines = [
    [0, 1],
    [1, 2],
    [2, 3],
    [2, 4],
    [0, 4]
  ];

  const drawNetwork = (time) => {
    if (!network) return;
    const { context: ctx } = network;
    const { width, height } = network.size;
    ctx.clearRect(0, 0, width, height);

    const scaleX = width / 720;
    const scaleY = height / 560;
    const scaled = networkNodes.map((node) => ({
      ...node,
      x: node.x * scaleX,
      y: node.y * scaleY,
      z: node.z
    }));

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.08)";

    for (let row = 0; row < 12; row += 1) {
      const y = height * 0.18 + row * (height * 0.065);
      ctx.beginPath();
      ctx.moveTo(width * 0.08, y);
      ctx.lineTo(width * 0.92, y + row * 4);
      ctx.stroke();
    }

    for (let col = 0; col < 12; col += 1) {
      const x = width * 0.1 + col * (width * 0.075);
      ctx.beginPath();
      ctx.moveTo(x, height * 0.14);
      ctx.lineTo(x - width * 0.2 + col * 6, height * 0.92);
      ctx.stroke();
    }

    networkLines.forEach(([from, to], index) => {
      const a = project(scaled[from], width, height);
      const b = project(scaled[to], width, height);
      const glow = index % 2 === 0 ? "rgba(241, 165, 31, 0.82)" : "rgba(109, 143, 78, 0.78)";

      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.bezierCurveTo((a.x + b.x) / 2, a.y - 72 * a.scale, (a.x + b.x) / 2, b.y - 72 * b.scale, b.x, b.y);
      ctx.stroke();

      const phase = (time * 0.00022 + index * 0.19) % 1;
      const x = a.x + (b.x - a.x) * phase;
      const y = a.y + (b.y - a.y) * phase - Math.sin(phase * Math.PI) * 42;

      ctx.fillStyle = glow;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    scaled.forEach((node) => {
      const p = project(node, width, height);
      const radius = 16 * p.scale + 9;

      ctx.fillStyle = "rgba(18, 20, 18, 0.82)";
      ctx.strokeStyle = "rgba(241, 165, 31, 0.72)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "800 12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.label, p.x, p.y);
    });

    ctx.restore();
  };

  let lastDraw = 0;

  const animate = (time) => {
    if (time - lastDraw < 32) {
      requestAnimationFrame(animate);
      return;
    }

    lastDraw = time;
    drawAmbient(time);
    drawHeroRoutes(time);
    drawNetwork(time);
    if (!prefersReducedMotion) requestAnimationFrame(animate);
  };

  requestAnimationFrame((time) => {
    drawAmbient(time);
    drawHeroRoutes(time);
    drawNetwork(time);
    if (!prefersReducedMotion) requestAnimationFrame(animate);
  });

  const form = document.querySelector("[data-quote-form]");
  const result = document.querySelector("[data-quote-result] strong");

  const recommendation = ({ cargo, volume }) => {
    if (volume === "completa") return "Carga completa con planificación dedicada y confirmación previa de ventanas.";
    if (cargo === "granel" || cargo === "cisterna") return "Servicio especializado sujeto a disponibilidad de equipo, autorizaciones y requisitos de carga.";
    if (volume === "media") return "Ruta programada con coordinación documental y control de horarios.";
    return "Servicio ligero o parcial, ideal para validar disponibilidad y consolidación.";
  };

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const origin = data.origin?.trim() || "origen indicado";
    const destination = data.destination?.trim() || "destino indicado";
    const message = recommendation(data);
    result.textContent = `${origin} -> ${destination}: ${message}`;
  });
})();
