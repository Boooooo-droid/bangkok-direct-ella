(() => {
  "use strict";

  const W = 420;
  const H = 740;
  const GROUND_Y = 580;
  const GRAVITY = 2400;
  const JUMP_V = -820;
  const SLIDE_MS = 480;
  const BASE_SPEED = 320;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const boot = document.getElementById("boot");
  const bootFill = document.getElementById("boot-fill");
  const shell = document.getElementById("shell");
  const hud = document.getElementById("hud");
  const hudName = document.getElementById("hud-name");
  const hudScore = document.getElementById("hud-score");
  const hudDist = document.getElementById("hud-dist");
  const touch = document.getElementById("touch");
  const btnJump = document.getElementById("btn-jump");
  const btnSlide = document.getElementById("btn-slide");

  const ASSET_LIST = {
    wordmark: "assets/official/nulls-wordmark.png",
    bomb: "assets/official/bomb-logo.webp",
    console: "assets/official/console-red-v2.webp",
    cartridge: "assets/official/cartridge.webp",
    memory: "assets/official/memory-card.webp",
    artBomb: "assets/official/art-01.webp",
    signWhite: "assets/sign-nulls-white.jpg",
    signNeon: "assets/sign-neon-red.jpg",
    signCart: "assets/sign-cartridge.jpg",
    platBlue: "assets/official/plat-blue.webp",
    platRed: "assets/official/plat-red.webp",
    platGreen: "assets/official/plat-green.webp",
    platCrumble: "assets/official/plat-crumble.webp",
    platSpring: "assets/official/plat-spring.webp",
    cardCyan: "assets/official/cyan.webp",
    cardOrange: "assets/official/orange.webp",
    cardRed: "assets/official/red.webp",
    cardGreen: "assets/official/green.webp",
    feather: "assets/official/pu-feather.webp",
    silSpike: "assets/official/spike.png",
    silShadow: "assets/official/shadow.png",
    silAstro: "assets/official/astro.png",
    silCrown: "assets/official/crown.png",
    silDemon: "assets/official/demon.png",
  };

  const CREW = [
    { id: "spike", name: "SPIKE", sil: "silSpike", accent: "#5de4ff", jumpMul: 1.08, scoreMul: 1.0, slideMul: 1.0 },
    { id: "shadow", name: "SHADOW", sil: "silShadow", accent: "#9aa7ff", jumpMul: 1.0, scoreMul: 1.15, slideMul: 1.05 },
    { id: "astro", name: "ASTRO", sil: "silAstro", accent: "#7dffb2", jumpMul: 1.0, scoreMul: 1.0, slideMul: 1.12 },
    { id: "crown", name: "CROWN", sil: "silCrown", accent: "#ffd27a", jumpMul: 1.04, scoreMul: 1.08, slideMul: 1.0 },
    { id: "demon", name: "DEMON", sil: "silDemon", accent: "#ff7aa2", jumpMul: 1.12, scoreMul: 1.05, slideMul: 0.95 },
  ];

  const imgs = {};
  let state = "menu"; // menu | play | over
  let selected = 0;
  let player, world, particles, camX, score, best, distance, speed, time, shake, staticX;
  let keys = Object.create(null);
  let lastTs = 0;
  let menuPulse = 0;
  let shareText = "";

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(src));
      img.src = src;
    });
  }

  async function preload() {
    const entries = Object.entries(ASSET_LIST);
    let done = 0;
    for (const [key, src] of entries) {
      try {
        imgs[key] = await loadImage(src);
      } catch {
        imgs[key] = null;
      }
      done += 1;
      bootFill.style.width = `${Math.round((done / entries.length) * 100)}%`;
    }
  }

  function resetRun() {
    const c = CREW[selected];
    player = {
      x: 120,
      y: GROUND_Y - 70,
      w: 42,
      h: 70,
      vx: 0,
      vy: 0,
      onGround: true,
      sliding: false,
      slideT: 0,
      dead: false,
      runPhase: 0,
      crew: c,
    };
    world = {
      platforms: [],
      hazards: [],
      pickups: [],
      signs: [],
      props: [],
      spawnX: 500,
    };
    particles = [];
    camX = 0;
    score = 0;
    distance = 0;
    speed = BASE_SPEED;
    time = 0;
    shake = 0;
    staticX = -180;
    seedStartChunk();
  }

  function seedStartChunk() {
    world.platforms.push({ x: -40, y: GROUND_Y, w: 900, h: 180, kind: "ground" });
    world.signs.push({ x: 280, y: 170, w: 160, h: 70, kind: "wordmark" });
    world.signs.push({ x: 520, y: 140, w: 150, h: 90, kind: "neon" });
    world.props.push({ x: 700, y: GROUND_Y - 110, w: 90, h: 110, kind: "console" });
    world.spawnX = 900;
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function spawnAhead() {
    while (world.spawnX < camX + W * 3.2) {
      const gap = rand(70, 150);
      const kindRoll = Math.random();
      const baseX = world.spawnX + gap;

      if (kindRoll < 0.14) {
        // pit gap
        const pit = rand(70, 120);
        world.platforms.push({
          x: baseX + pit,
          y: GROUND_Y,
          w: rand(280, 460),
          h: 180,
          kind: "ground",
        });
        world.hazards.push({ x: baseX, y: GROUND_Y + 20, w: pit, h: 40, kind: "pit" });
        world.spawnX = baseX + pit + 320;
      } else if (kindRoll < 0.34) {
        // raised platform + maybe crumble
        const w = rand(140, 220);
        world.platforms.push({ x: baseX, y: GROUND_Y, w: w + 260, h: 180, kind: "ground" });
        world.platforms.push({
          x: baseX + 80,
          y: GROUND_Y - rand(70, 110),
          w,
          h: 28,
          kind: Math.random() < 0.4 ? "crumble" : "plat",
          life: 1,
        });
        if (Math.random() < 0.55) {
          world.pickups.push({
            x: baseX + 110,
            y: GROUND_Y - rand(140, 190),
            w: 36,
            h: 48,
            kind: "memory",
            color: pick(["cardCyan", "cardOrange", "cardRed", "cardGreen"]),
            got: false,
          });
        }
        world.spawnX = baseX + w + 280;
      } else if (kindRoll < 0.5) {
        // bomb hazard low or high
        world.platforms.push({ x: baseX, y: GROUND_Y, w: rand(360, 520), h: 180, kind: "ground" });
        const high = Math.random() < 0.45;
        world.hazards.push({
          x: baseX + rand(100, 200),
          y: high ? GROUND_Y - 120 : GROUND_Y - 52,
          w: 44,
          h: 44,
          kind: "bomb",
        });
        world.spawnX = baseX + 420;
      } else if (kindRoll < 0.64) {
        // CRT beam
        world.platforms.push({ x: baseX, y: GROUND_Y, w: rand(400, 560), h: 180, kind: "ground" });
        world.hazards.push({
          x: baseX + 160,
          y: GROUND_Y - 160,
          w: 18,
          h: 160,
          kind: "beam",
          phase: Math.random() * Math.PI * 2,
        });
        world.spawnX = baseX + 480;
      } else if (kindRoll < 0.78) {
        // press start gate
        world.platforms.push({ x: baseX, y: GROUND_Y, w: rand(380, 500), h: 180, kind: "ground" });
        world.hazards.push({
          x: baseX + 140,
          y: GROUND_Y - 130,
          w: 70,
          h: 130,
          kind: "gate",
          phase: Math.random() * Math.PI * 2,
        });
        world.spawnX = baseX + 450;
      } else {
        // spring pad + sign
        world.platforms.push({ x: baseX, y: GROUND_Y, w: rand(420, 580), h: 180, kind: "ground" });
        world.platforms.push({
          x: baseX + 120,
          y: GROUND_Y - 20,
          w: 70,
          h: 20,
          kind: "spring",
        });
        world.signs.push({
          x: baseX + 220,
          y: 150 + rand(-20, 40),
          w: 150,
          h: 85,
          kind: pick(["neon", "white", "cart", "wordmark"]),
        });
        if (Math.random() < 0.6) {
          world.pickups.push({
            x: baseX + 140,
            y: GROUND_Y - 160,
            w: 36,
            h: 48,
            kind: "memory",
            color: pick(["cardCyan", "cardOrange", "cardRed", "cardGreen"]),
            got: false,
          });
        }
        world.props.push({
          x: baseX + rand(260, 360),
          y: GROUND_Y - 95,
          w: 78,
          h: 95,
          kind: Math.random() < 0.5 ? "cartridge" : "console",
        });
        world.spawnX = baseX + 500;
      }

      // ambient sign every chunk chance
      if (Math.random() < 0.35) {
        world.signs.push({
          x: world.spawnX - rand(80, 200),
          y: 120 + rand(0, 80),
          w: 140,
          h: 78,
          kind: pick(["neon", "white", "cart"]),
        });
      }
    }
  }

  function playerBox() {
    if (player.sliding) {
      return { x: player.x, y: player.y + player.h * 0.45, w: player.w + 10, h: player.h * 0.55 };
    }
    return { x: player.x, y: player.y, w: player.w, h: player.h };
  }

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function jump() {
    if (state !== "play" || player.dead) return;
    if (player.onGround && !player.sliding) {
      player.vy = JUMP_V * player.crew.jumpMul;
      player.onGround = false;
      burst(player.x + 20, player.y + player.h, player.crew.accent, 8);
    }
  }

  function slide() {
    if (state !== "play" || player.dead) return;
    if (player.onGround && !player.sliding) {
      player.sliding = true;
      player.slideT = SLIDE_MS * player.crew.slideMul;
      burst(player.x, player.y + player.h - 8, "#ffffff", 6);
    }
  }

  function die(reason) {
    if (player.dead) return;
    player.dead = true;
    shake = 14;
    burst(player.x + 20, player.y + 30, player.crew.accent, 24);
    burst(player.x + 20, player.y + 30, "#ff3b4a", 16);
    best = Math.max(best || 0, Math.floor(score));
    try {
      localStorage.setItem("nullrun_best", String(best));
    } catch {}
    shareText = [
      `NULL RUN · ${player.crew.name}`,
      `score ${Math.floor(score)} · ${Math.floor(distance)}m`,
      reason === "static" ? `caught by STATIC` : `run ended`,
      ``,
      `unofficial fan parkour for @nullsxyz`,
      `press start to remember.`,
    ].join("\n");
    setTimeout(() => {
      state = "over";
      hud.classList.add("hidden");
      touch.classList.add("hidden");
    }, 450);
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x,
        y,
        vx: rand(-180, 180),
        vy: rand(-260, 40),
        life: rand(0.3, 0.8),
        color,
        size: rand(2, 5),
      });
    }
  }

  function update(dt) {
    menuPulse += dt;
    if (state === "menu" || state === "over") return;
    if (player.dead) {
      player.vy += GRAVITY * dt;
      player.y += player.vy * dt;
      updateParticles(dt);
      return;
    }

    time += dt;
    speed = BASE_SPEED + Math.min(220, distance * 0.35);
    player.x += speed * dt;
    distance = Math.max(0, (player.x - 120) / 18);
    score += (speed * 0.045 + 8) * dt * player.crew.scoreMul;

    // jump hold not needed; gravity
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;
    player.onGround = false;

    if (player.sliding) {
      player.slideT -= dt * 1000;
      if (player.slideT <= 0) player.sliding = false;
    }

    player.runPhase += dt * (speed / 60);

    // platforms
    const box = playerBox();
    for (const p of world.platforms) {
      if (p.kind === "crumble" && p.life <= 0) continue;
      const plat = { x: p.x, y: p.y, w: p.w, h: p.h };
      if (player.vy >= 0 && aabb(box, plat) && box.y + box.h - player.vy * dt <= p.y + 12) {
        player.y = p.y - (player.sliding ? player.h * 0.55 : player.h);
        player.vy = 0;
        player.onGround = true;
        if (p.kind === "spring") {
          player.vy = JUMP_V * 1.25 * player.crew.jumpMul;
          player.onGround = false;
          player.sliding = false;
          burst(player.x + 20, p.y, "#7dffb2", 10);
        }
        if (p.kind === "crumble") {
          p.life -= dt * 1.6;
          if (p.life <= 0) burst(p.x + p.w / 2, p.y, "#c4a574", 12);
        }
      }
    }

    // fall death
    if (player.y > H + 40) die("pit");

    // hazards
    const pbox = playerBox();
    for (const h of world.hazards) {
      if (h.kind === "pit") continue;
      let hb = { x: h.x, y: h.y, w: h.w, h: h.h };
      if (h.kind === "beam") {
        const on = Math.sin(time * 3.2 + h.phase) > 0.15;
        h._on = on;
        if (!on) continue;
      }
      if (h.kind === "gate") {
        const closed = Math.sin(time * 2.1 + h.phase) > 0;
        h._closed = closed;
        if (!closed) {
          hb = { x: h.x, y: h.y, w: h.w, h: 28 };
        } else if (player.sliding) {
          continue;
        }
      }
      if (h.kind === "bomb" && player.sliding && h.y > GROUND_Y - 70) continue;
      if (aabb(pbox, hb)) die(h.kind);
    }

    // pickups
    for (const u of world.pickups) {
      if (u.got) continue;
      if (aabb(pbox, u)) {
        u.got = true;
        score += 120 * player.crew.scoreMul;
        staticX -= 55;
        burst(u.x + 18, u.y + 20, "#5de4ff", 14);
      }
    }

    // STATIC chase — closes slowly, pickups push back
    const target = player.x - 240 + Math.min(70, time * 2.2);
    staticX += (target - staticX) * Math.min(1, dt * 0.95);
    if (staticX + 78 > player.x) die("static");

    camX = player.x - 110;
    spawnAhead();
    pruneWorld();
    updateParticles(dt);
    if (shake > 0) shake = Math.max(0, shake - dt * 40);

    hudScore.textContent = String(Math.floor(score));
    hudDist.textContent = `${Math.floor(distance)}m`;
  }

  function pruneWorld() {
    const minX = camX - 400;
    world.platforms = world.platforms.filter((p) => p.x + p.w > minX && (p.kind !== "crumble" || p.life > 0));
    world.hazards = world.hazards.filter((h) => h.x + h.w > minX);
    world.pickups = world.pickups.filter((u) => u.x + u.w > minX && !u.got);
    world.signs = world.signs.filter((s) => s.x + s.w > minX);
    world.props = world.props.filter((p) => p.x + p.w > minX);
  }

  function updateParticles(dt) {
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 600 * dt;
    }
    particles = particles.filter((p) => p.life > 0);
  }

  function drawImageCover(img, x, y, w, h) {
    if (!img) return;
    ctx.drawImage(img, x, y, w, h);
  }

  const silCache = new Map();
  function drawSilhouette(img, x, y, w, h, color) {
    if (!img) {
      ctx.fillStyle = color || "#fff";
      ctx.fillRect(x + w * 0.25, y + h * 0.15, w * 0.5, h * 0.7);
      return;
    }
    const key = `${img.src}|${w | 0}x${h | 0}|${color || "#e8eef6"}`;
    let off = silCache.get(key);
    if (!off) {
      off = document.createElement("canvas");
      off.width = Math.max(1, w | 0);
      off.height = Math.max(1, h | 0);
      const o = off.getContext("2d");
      o.drawImage(img, 0, 0, off.width, off.height);
      o.globalCompositeOperation = "source-in";
      o.fillStyle = color || "#e8eef6";
      o.fillRect(0, 0, off.width, off.height);
      silCache.set(key, off);
    }
    ctx.drawImage(off, x, y);
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0b1220");
    g.addColorStop(0.55, "#090d16");
    g.addColorStop(1, "#05060a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // parallax buildings
    const parallax = camX * 0.25;
    ctx.fillStyle = "#101826";
    for (let i = 0; i < 12; i++) {
      const bx = ((i * 160 - (parallax % 160)) | 0);
      const bh = 120 + ((i * 47) % 160);
      ctx.fillRect(bx, GROUND_Y - bh - 40, 120, bh);
      ctx.fillStyle = i % 2 ? "#152033" : "#101826";
    }

    // scanline soft
    ctx.fillStyle = "rgba(93,228,255,0.03)";
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  }

  function drawSign(s, sx) {
    const x = s.x - sx;
    const y = s.y;
    ctx.save();
    roundRect(x - 6, y - 6, s.w + 12, s.h + 12, 10);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fill();
    let img = null;
    if (s.kind === "wordmark") img = imgs.wordmark;
    if (s.kind === "neon") img = imgs.signNeon;
    if (s.kind === "white") img = imgs.signWhite;
    if (s.kind === "cart") img = imgs.signCart;
    if (img) {
      ctx.save();
      roundRect(x, y, s.w, s.h, 8);
      ctx.clip();
      drawImageCover(img, x, y, s.w, s.h);
      ctx.restore();
      if (s.kind === "neon") {
        ctx.strokeStyle = "rgba(255,59,74,0.55)";
        ctx.lineWidth = 2;
        roundRect(x, y, s.w, s.h, 8);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = "#111";
      roundRect(x, y, s.w, s.h, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "14px Space Grotesk";
      ctx.fillText("nulls", x + 16, y + s.h / 2 + 5);
    }
    // pole
    ctx.fillStyle = "#2a3340";
    ctx.fillRect(x + s.w / 2 - 4, y + s.h, 8, GROUND_Y - (y + s.h) - 8);
    ctx.restore();
  }

  function drawWorld(sx) {
    for (const s of world.signs) drawSign(s, sx);

    for (const p of world.props) {
      const img = p.kind === "console" ? imgs.console : imgs.cartridge;
      if (img) drawImageCover(img, p.x - sx, p.y, p.w, p.h);
    }

    for (const p of world.platforms) {
      if (p.kind === "ground") {
        ctx.fillStyle = "#141b28";
        ctx.fillRect(p.x - sx, p.y, p.w, p.h);
        ctx.fillStyle = "#1e2a3d";
        ctx.fillRect(p.x - sx, p.y, p.w, 10);
        ctx.fillStyle = "rgba(93,228,255,0.15)";
        ctx.fillRect(p.x - sx, p.y, p.w, 2);
      } else {
        let img = imgs.platBlue;
        if (p.kind === "crumble") img = imgs.platCrumble;
        if (p.kind === "spring") img = imgs.platSpring;
        if (p.kind === "plat" && Math.floor(p.x) % 2 === 0) img = imgs.platGreen;
        if (p.kind === "plat" && Math.floor(p.x) % 3 === 0) img = imgs.platRed;
        if (img) {
          const alpha = p.kind === "crumble" ? Math.max(0.25, p.life) : 1;
          ctx.globalAlpha = alpha;
          drawImageCover(img, p.x - sx, p.y - 8, p.w, 40);
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = "#3a7ca5";
          ctx.fillRect(p.x - sx, p.y, p.w, 20);
        }
      }
    }

    for (const h of world.hazards) {
      if (h.kind === "pit") {
        ctx.fillStyle = "#03040a";
        ctx.fillRect(h.x - sx, GROUND_Y, h.w, 100);
        ctx.fillStyle = "rgba(255,59,74,0.35)";
        ctx.font = "10px Press Start 2P";
        ctx.fillText("404", h.x - sx + h.w / 2 - 16, GROUND_Y + 40);
      } else if (h.kind === "bomb") {
        if (imgs.bomb) drawImageCover(imgs.bomb, h.x - sx, h.y, h.w, h.h);
        else {
          ctx.fillStyle = "#222";
          ctx.beginPath();
          ctx.arc(h.x - sx + 22, h.y + 22, 18, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (h.kind === "beam") {
        if (h._on !== false) {
          const grd = ctx.createLinearGradient(0, h.y, 0, h.y + h.h);
          grd.addColorStop(0, "rgba(93,228,255,0)");
          grd.addColorStop(0.5, "rgba(93,228,255,0.85)");
          grd.addColorStop(1, "rgba(93,228,255,0)");
          ctx.fillStyle = grd;
          ctx.fillRect(h.x - sx, h.y, h.w, h.h);
        }
      } else if (h.kind === "gate") {
        ctx.fillStyle = h._closed === false ? "rgba(125,255,178,0.35)" : "rgba(255,59,74,0.75)";
        roundRect(h.x - sx, h.y, h.w, h._closed === false ? 28 : h.h, 8);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "7px Press Start 2P";
        ctx.fillText("START", h.x - sx + 8, h.y + 18);
      }
    }

    for (const u of world.pickups) {
      if (u.got) continue;
      const img = imgs[u.color] || imgs.cardCyan || imgs.memory;
      const bob = Math.sin(time * 5 + u.x * 0.01) * 5;
      if (img) drawImageCover(img, u.x - sx, u.y + bob, u.w, u.h);
    }
  }

  function drawPlayer(sx) {
    const c = player.crew;
    const x = player.x - sx;
    const y = player.y;
    const sil = imgs[c.sil];

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(x + 22, GROUND_Y + 6, player.sliding ? 28 : 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    if (player.sliding) {
      ctx.translate(x + 10, y + 38);
      ctx.rotate(-0.55);
      drawSilhouette(sil, -10, -40, 56, 56, "#f4f7fb");
    } else {
      const bob = player.onGround ? Math.sin(player.runPhase) * 2 : 0;
      drawSilhouette(sil, x - 4, y - 8 + bob, 56, 56, "#f4f7fb");
      if (player.onGround) {
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.lineWidth = 2;
        const swing = Math.sin(player.runPhase) * 10;
        ctx.beginPath();
        ctx.moveTo(x + 20, y + 52);
        ctx.lineTo(x + 20 - swing, y + 70);
        ctx.moveTo(x + 28, y + 52);
        ctx.lineTo(x + 28 + swing, y + 70);
        ctx.stroke();
      }
    }
    ctx.restore();

    // accent glow
    ctx.fillStyle = c.accent;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.arc(x + 22, y + 24, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawStatic(sx) {
    const x = staticX - sx;
    const g = ctx.createRadialGradient(x + 40, GROUND_Y - 40, 10, x + 40, GROUND_Y - 40, 120);
    g.addColorStop(0, "rgba(255,59,74,0.55)");
    g.addColorStop(1, "rgba(255,59,74,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - 40, 0, 220, H);

    ctx.fillStyle = "#12060a";
    roundRect(x, GROUND_Y - 110, 90, 110, 16);
    ctx.fill();
    // glitch bars
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.25)" : "rgba(93,228,255,0.2)";
      ctx.fillRect(x + rand(5, 60), GROUND_Y - 100 + i * 12, rand(20, 50), 4);
    }
    if (imgs.artBomb) {
      ctx.globalAlpha = 0.85;
      drawImageCover(imgs.artBomb, x + 18, GROUND_Y - 100, 54, 54);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "#ff3b4a";
    ctx.font = "8px Press Start 2P";
    ctx.fillText("STATIC", x + 12, GROUND_Y - 118);
  }

  function drawParticles(sx) {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - sx, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawMenu() {
    drawBackground();
    // floating signs
    if (imgs.signNeon) drawImageCover(imgs.signNeon, 30, 70, 150, 70);
    if (imgs.signWhite) drawImageCover(imgs.signWhite, 240, 90, 150, 60);
    if (imgs.wordmark) {
      drawImageCover(imgs.wordmark, W / 2 - 90, 30, 180, 40);
    } else {
      ctx.fillStyle = "#fff";
      ctx.font = "20px Press Start 2P";
      ctx.fillText("NULL RUN", 110, 55);
    }

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    roundRect(24, 160, W - 48, 420, 18);
    ctx.fill();
    ctx.strokeStyle = "rgba(93,228,255,0.25)";
    ctx.stroke();

    ctx.fillStyle = "#5de4ff";
    ctx.font = "10px Press Start 2P";
    ctx.fillText("SELECT CREW", 120, 195);

    const cardW = 60;
    const gap = 12;
    const total = CREW.length * cardW + (CREW.length - 1) * gap;
    let x0 = (W - total) / 2;
    CREW.forEach((c, i) => {
      const x = x0 + i * (cardW + gap);
      const y = 220;
      const sel = i === selected;
      ctx.fillStyle = sel ? "rgba(93,228,255,0.15)" : "rgba(255,255,255,0.04)";
      roundRect(x, y, cardW, 90, 12);
      ctx.fill();
      ctx.strokeStyle = sel ? c.accent : "rgba(255,255,255,0.1)";
      ctx.lineWidth = sel ? 2 : 1;
      ctx.stroke();
      drawSilhouette(imgs[c.sil], x + 6, y + 8, 48, 48, sel ? "#f4f7fb" : "#9aa7b8");
      ctx.fillStyle = sel ? c.accent : "#9aa7b8";
      ctx.font = "6px Press Start 2P";
      ctx.fillText(c.name.slice(0, 6), x + 6, y + 78);
    });

    const c = CREW[selected];
    ctx.fillStyle = "#c4cfdb";
    ctx.font = "12px Space Grotesk";
    ctx.textAlign = "center";
    ctx.fillText(`${c.name} · jump ${c.jumpMul.toFixed(2)}x · score ${c.scoreMul.toFixed(2)}x`, W / 2, 340);
    ctx.fillText("Auto-run parkour · dodge STATIC · grab memory cards", W / 2, 362);
    ctx.textAlign = "left";

    const bob = Math.sin(menuPulse * 2) * 6;
    drawSilhouette(imgs[c.sil], W / 2 - 70, 380 + bob, 140, 140, "#f4f7fb");

    // play button
    const pulse = 1 + Math.sin(menuPulse * 4) * 0.02;
    ctx.save();
    ctx.translate(W / 2, 560);
    ctx.scale(pulse, pulse);
    roundRect(-110, -24, 220, 48, 16);
    const pg = ctx.createLinearGradient(-110, -24, 110, 24);
    pg.addColorStop(0, "#7aefff");
    pg.addColorStop(1, "#2bb8d4");
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.fillStyle = "#041018";
    ctx.font = "12px Press Start 2P";
    ctx.textAlign = "center";
    ctx.fillText("▶ PLAY", 0, 8);
    ctx.textAlign = "left";
    ctx.restore();

    ctx.fillStyle = "#8b97a8";
    ctx.font = "11px Space Grotesk";
    ctx.textAlign = "center";
    ctx.fillText("← → change crew · Enter / tap PLAY", W / 2, 610);
    ctx.fillText(`best ${best || 0}`, W / 2, 632);
    ctx.textAlign = "left";

    if (imgs.cartridge) drawImageCover(imgs.cartridge, 20, 640, 50, 60);
    if (imgs.memory) drawImageCover(imgs.memory, W - 70, 645, 42, 55);
  }

  function drawOver() {
    drawBackground();
    // freeze last vibe
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(0, 0, W, H);

    roundRect(28, 120, W - 56, 460, 18);
    ctx.fillStyle = "rgba(8,10,16,0.95)";
    ctx.fill();
    ctx.strokeStyle = "rgba(93,228,255,0.3)";
    ctx.stroke();

    ctx.fillStyle = "#ff3b4a";
    ctx.font = "10px Press Start 2P";
    ctx.textAlign = "center";
    ctx.fillText("SAVE CORRUPTED", W / 2, 165);
    ctx.fillStyle = "#fff";
    ctx.font = "16px Press Start 2P";
    ctx.fillText("RUN OVER", W / 2, 205);

    const c = CREW[selected];
    drawSilhouette(imgs[c.sil], W / 2 - 50, 220, 100, 100, "#f4f7fb");

    ctx.fillStyle = c.accent;
    ctx.font = "10px Press Start 2P";
    ctx.fillText(c.name, W / 2, 340);
    ctx.fillStyle = "#5de4ff";
    ctx.font = "14px Press Start 2P";
    ctx.fillText(String(Math.floor(score)), W / 2, 375);
    ctx.fillStyle = "#8b97a8";
    ctx.font = "12px Space Grotesk";
    ctx.fillText(`${Math.floor(distance)}m · best ${best || 0}`, W / 2, 400);

    // buttons
    roundRect(60, 430, W - 120, 44, 14);
    ctx.fillStyle = "#7aefff";
    ctx.fill();
    ctx.fillStyle = "#041018";
    ctx.font = "10px Press Start 2P";
    ctx.fillText("SHARE ON X", W / 2, 458);

    roundRect(60, 490, W - 120, 44, 14);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.fillText("▶ AGAIN", W / 2, 518);

    ctx.fillStyle = "#8b97a8";
    ctx.font = "11px Space Grotesk";
    ctx.fillText("unofficial fan game · @nullsxyz", W / 2, 560);
    ctx.textAlign = "left";
  }

  function render() {
    const sx = camX;
    const ox = shake ? rand(-shake, shake) : 0;
    const oy = shake ? rand(-shake, shake) : 0;
    ctx.save();
    ctx.translate(ox, oy);

    if (state === "menu") {
      drawMenu();
    } else if (state === "over") {
      drawOver();
    } else {
      drawBackground();
      drawWorld(sx);
      drawStatic(sx);
      drawPlayer(sx);
      drawParticles(sx);
      // vignette
      const vg = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 420);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    dt = Math.min(0.033, Math.max(0, dt));
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function startPlay() {
    resetRun();
    state = "play";
    hud.classList.remove("hidden");
    touch.classList.remove("hidden");
    hudName.textContent = CREW[selected].name;
    hudName.style.color = CREW[selected].accent;
  }

  function hitTestMenu(mx, my) {
    // crew cards
    const cardW = 60;
    const gap = 12;
    const total = CREW.length * cardW + (CREW.length - 1) * gap;
    let x0 = (W - total) / 2;
    for (let i = 0; i < CREW.length; i++) {
      const x = x0 + i * (cardW + gap);
      const y = 220;
      if (mx >= x && mx <= x + cardW && my >= y && my <= y + 90) {
        selected = i;
        return "crew";
      }
    }
    // play (generous hitbox)
    if (mx >= W / 2 - 130 && mx <= W / 2 + 130 && my >= 520 && my <= 600) return "play";
    return null;
  }

  function hitTestOver(mx, my) {
    if (mx >= 50 && mx <= W - 50 && my >= 420 && my <= 480) return "share";
    if (mx >= 50 && mx <= W - 50 && my >= 480 && my <= 545) return "again";
    return null;
  }

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  }

  function openShare() {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText || "NULL RUN")}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function onPointer(e) {
    e.preventDefault();
    const p = canvasPos(e);
    if (state === "menu") {
      const hit = hitTestMenu(p.x, p.y);
      if (hit === "play") startPlay();
      return;
    }
    if (state === "over") {
      const hit = hitTestOver(p.x, p.y);
      if (hit === "share") openShare();
      if (hit === "again") {
        state = "menu";
      }
      return;
    }
    if (state === "play") {
      if (p.y > H * 0.62) slide();
      else jump();
    }
  }

  canvas.addEventListener("pointerdown", onPointer, { passive: false });
  btnJump.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    jump();
  });
  btnSlide.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    slide();
  });

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      if (state === "menu") selected = (selected + CREW.length - 1) % CREW.length;
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
      if (state === "menu") selected = (selected + 1) % CREW.length;
    }
    if (e.code === "Enter" || e.code === "Space") {
      if (state === "menu") startPlay();
      else if (state === "play") {
        e.preventDefault();
        jump();
      } else if (state === "over") state = "menu";
    }
    if ((e.code === "ArrowDown" || e.code === "KeyS") && state === "play") {
      e.preventDefault();
      slide();
    }
    if (e.code === "KeyX" && state === "over") openShare();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  // prevent scroll bounce on iOS while playing
  document.body.addEventListener(
    "touchmove",
    (e) => {
      if (state === "play") e.preventDefault();
    },
    { passive: false }
  );

  try {
    best = Number(localStorage.getItem("nullrun_best") || 0) || 0;
  } catch {
    best = 0;
  }

  preload()
    .then(() => {
      boot.style.display = "none";
      shell.hidden = false;
      requestAnimationFrame(loop);
    })
    .catch(() => {
      boot.querySelector("p").textContent = "loaded with fallbacks";
      boot.style.display = "none";
      shell.hidden = false;
      requestAnimationFrame(loop);
    });
})();
