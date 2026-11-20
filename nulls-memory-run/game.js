(() => {
  const screen = document.getElementById("screen");
  const led = document.getElementById("led");
  const flash = document.getElementById("flash");

  const ARCHETYPES = {
    lost: {
      id: "lost",
      name: "THE LOST KID",
      color: "#5de4ff",
      lore: "Still looking for the save that vanished on Monday morning.",
    },
    night: {
      id: "night",
      name: "NIGHT SIGNAL",
      color: "#9aa7ff",
      lore: "Stayed up one more level. The CRT kept them company.",
    },
    coop: {
      id: "coop",
      name: "TWO-PLAYER HEART",
      color: "#7dffb2",
      lore: "Passed the controller. Kept the friendship in the high score.",
    },
    keeper: {
      id: "keeper",
      name: "CARTRIDGE KEEPER",
      color: "#ffd27a",
      lore: "Blew into the cart like it was life support. Sometimes it worked.",
    },
    restore: {
      id: "restore",
      name: "RESTORE POINT",
      color: "#ff9ad5",
      lore: "Refused to start over. Recovered what the static tried to eat.",
    },
  };

  const VIGNETTES = [
    {
      id: "room",
      kicker: "MEMORY 01 / ROOM",
      title: "blue light on the floor",
      body: "School clothes still on. The TV hums. One more run feels safer than tomorrow.",
      art: "room",
      a: { label: "Keep playing in the dark", tags: ["night", "lost"] },
      b: { label: "Save and go to sleep", tags: ["keeper", "restore"] },
    },
    {
      id: "friend",
      kicker: "MEMORY 02 / COUCH",
      title: "one controller, two kids",
      body: "Your friend says “just the boss.” The snack bowl is already empty.",
      art: "couch",
      a: { label: "Share the controller", tags: ["coop", "restore"] },
      b: { label: "Ask for one more solo try", tags: ["lost", "night"] },
    },
    {
      id: "cart",
      kicker: "MEMORY 03 / CARTRIDGE",
      title: "it won’t read",
      body: "The screen flickers. Someone says blow into it. Everyone pretends that is science.",
      art: "cart",
      a: { label: "Soft blow, gentle click", tags: ["keeper", "coop"] },
      b: { label: "Hard blow, full ritual", tags: ["keeper", "night"] },
    },
    {
      id: "corrupt",
      kicker: "MEMORY 04 / ERROR",
      title: "SAVE DATA CORRUPTED",
      body: "The file name is still there. The progress is static. Your chest knows this feeling.",
      art: "error",
      a: { label: "Try to recover it anyway", tags: ["restore", "lost"] },
      b: { label: "Start a new file, keep the ache", tags: ["lost", "night"] },
    },
    {
      id: "return",
      kicker: "MEMORY 05 / RETURN",
      title: "press start to remember",
      body: "Years later the glow looks the same. You are not starting fresh. You are loading an old room.",
      art: "return",
      a: { label: "Remember alone", tags: ["lost", "night"] },
      b: { label: "Remember with everyone", tags: ["coop", "restore"] },
    },
  ];

  const state = {
    tags: [],
    step: -1,
    serial: "",
    archetype: null,
  };

  function flashScreen() {
    flash.classList.add("on");
    setTimeout(() => flash.classList.remove("on"), 120);
  }

  function clearScreen() {
    screen.innerHTML = "";
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function showView(node) {
    clearScreen();
    node.classList.add("view", "active");
    screen.appendChild(node);
  }

  function drawScene(kind, canvas) {
    const ctx = canvas.getContext("2d");
    const s = 8;
    canvas.width = 22 * s;
    canvas.height = 18 * s;
    ctx.imageSmoothingEnabled = false;

    const px = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x * s, y * s, w * s, h * s);
    };

    // backdrop
    px(0, 0, 22, 18, "#070b12");
    for (let i = 0; i < 18; i++) {
      px(0, i, 22, 1, i % 2 ? "#081018" : "#070b12");
    }

    if (kind === "boot" || kind === "return") {
      // tiny character silhouette
      px(8, 5, 6, 1, "#5de4ff");
      px(7, 6, 8, 5, "#d7e6f2");
      px(8, 7, 2, 2, "#0b1018");
      px(12, 7, 2, 2, "#0b1018");
      px(9, 10, 4, 1, "#8b97a8");
      px(7, 11, 8, 4, "#5de4ff");
      px(6, 15, 3, 2, "#d7e6f2");
      px(13, 15, 3, 2, "#d7e6f2");
      px(4, 3, 1, 1, "#5de4ff");
      px(16, 4, 1, 1, "#5de4ff");
      px(3, 8, 1, 1, "#2bb8d4");
      px(18, 9, 1, 1, "#2bb8d4");
    }

    if (kind === "room") {
      px(2, 12, 18, 6, "#121820");
      px(5, 4, 12, 8, "#0d1520");
      px(6, 5, 10, 6, "#5de4ff");
      px(7, 6, 8, 4, "#9af0ff");
      px(9, 14, 4, 3, "#d7e6f2");
      px(10, 13, 2, 1, "#8b97a8");
      px(8, 16, 2, 1, "#5de4ff");
      px(12, 16, 2, 1, "#5de4ff");
    }

    if (kind === "couch") {
      px(2, 11, 18, 5, "#1a2430");
      px(3, 9, 7, 4, "#d7e6f2");
      px(12, 9, 7, 4, "#5de4ff");
      px(5, 8, 2, 1, "#0b1018");
      px(14, 8, 2, 1, "#0b1018");
      px(8, 13, 6, 2, "#2a3340");
      px(9, 7, 1, 1, "#ffd27a");
      px(15, 7, 1, 1, "#ffd27a");
    }

    if (kind === "cart") {
      px(7, 4, 8, 11, "#5de4ff");
      px(8, 5, 6, 2, "#0b1018");
      px(8, 8, 6, 5, "#1494ad");
      px(9, 9, 4, 1, "#dff8ff");
      px(9, 11, 4, 1, "#dff8ff");
      px(6, 3, 10, 1, "#8b97a8");
      px(10, 15, 2, 2, "#d7e6f2");
    }

    if (kind === "error") {
      px(3, 5, 16, 8, "#1a1016");
      px(4, 6, 14, 1, "#ff7aa2");
      px(4, 8, 10, 1, "#8b97a8");
      px(4, 10, 12, 1, "#8b97a8");
      px(4, 12, 8, 1, "#ff7aa2");
      px(15, 3, 2, 2, "#5de4ff");
      px(2, 14, 1, 1, "#5de4ff");
    }

    if (kind === "power") {
      px(9, 4, 4, 10, "#5de4ff");
      px(10, 5, 2, 8, "#070b12");
      px(8, 8, 6, 2, "#5de4ff");
      px(6, 14, 10, 2, "#2bb8d4");
    }
  }

  function artCanvas(kind) {
    const c = document.createElement("canvas");
    drawScene(kind, c);
    return c;
  }

  function makeProgress(index) {
    const row = el("div", "progress");
    for (let i = 0; i < VIGNETTES.length; i++) {
      const pip = el("i");
      if (i <= index) pip.classList.add("on");
      row.appendChild(pip);
    }
    return row;
  }

  function scoreArchetype() {
    const counts = {};
    for (const t of state.tags) counts[t] = (counts[t] || 0) + 1;
    let best = "lost";
    let bestN = -1;
    for (const [k, n] of Object.entries(counts)) {
      if (n > bestN) {
        best = k;
        bestN = n;
      }
    }
    return ARCHETYPES[best] || ARCHETYPES.lost;
  }

  function serialFor(archetype) {
    const n = Math.floor(1000 + Math.random() * 9000);
    return `NF-${archetype.id.toUpperCase().slice(0, 3)}-${n}`;
  }

  function paintCard(canvas, archetype, serial) {
    const w = 560;
    const h = 760;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#0b1520");
    g.addColorStop(0.55, "#071018");
    g.addColorStop(1, "#101018");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // grain-ish dots
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    for (let i = 0; i < 180; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }

    ctx.strokeStyle = archetype.color;
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, w - 56, h - 56);

    ctx.fillStyle = archetype.color;
    ctx.font = "20px 'Press Start 2P', monospace";
    ctx.fillText("MEMORY FRAGMENT", 56, 90);

    ctx.fillStyle = "#8b97a8";
    ctx.font = "16px 'Press Start 2P', monospace";
    ctx.fillText(serial, 56, 130);

    // character block
    const sprite = document.createElement("canvas");
    drawScene("return", sprite);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, 150, 180, 260, 210);

    ctx.fillStyle = "#eef3f8";
    ctx.font = "22px 'Press Start 2P', monospace";
    wrapText(ctx, archetype.name, 56, 440, w - 112, 34);

    ctx.fillStyle = "#c4cfdb";
    ctx.font = "28px 'Space Grotesk', sans-serif";
    wrapText(ctx, archetype.lore, 56, 530, w - 112, 36);

    ctx.fillStyle = archetype.color;
    ctx.font = "14px 'Press Start 2P', monospace";
    ctx.fillText("UNOFFICIAL FAN CARD", 56, 680);
    ctx.fillStyle = "#8b97a8";
    ctx.fillText("@nullsxyz · press start", 56, 710);
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let yy = y;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, yy);
        line = word;
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, yy);
  }

  function shareText(archetype, serial) {
    return [
      `booted a corrupted save.`,
      `recovered: ${archetype.name}`,
      `fragment ${serial}`,
      ``,
      `unofficial fan memory for @nullsxyz`,
      `press start to remember.`,
    ].join("\n");
  }

  function bootSequence() {
    led.classList.remove("on");
    state.tags = [];
    state.step = -1;
    state.serial = "";
    state.archetype = null;

    const view = el("div");
    const logo = el("div", "boot-logo");
    logo.appendChild(el("div", "big", "")).innerHTML = `BOOT · <span>SAVE</span>`;
    logo.appendChild(el("p", "sub", "fan console warming up…"));
    view.appendChild(logo);
    showView(view);

    setTimeout(() => {
      led.classList.add("on");
      flashScreen();
      titleScreen();
    }, 900);
  }

  function titleScreen() {
    const view = el("div");
    view.appendChild(el("p", "kicker", "NULL·FAN CONSOLE"));
    view.appendChild(el("h1", "title", "corrupted save detected"));
    view.appendChild(
      el(
        "p",
        "copy",
        "An old file is flickering. Walk five memories. Leave with a fragment that is only yours."
      )
    );

    const art = el("div", "art-slot");
    art.appendChild(artCanvas("power"));
    view.appendChild(art);

    const choices = el("div", "choices");
    const start = el("button", "btn primary", "▶ PRESS START");
    start.type = "button";
    start.addEventListener("click", () => {
      flashScreen();
      insertCart();
    });
    choices.appendChild(start);
    view.appendChild(choices);
    showView(view);
  }

  function insertCart() {
    const view = el("div");
    view.appendChild(el("p", "kicker", "LOAD · CARTRIDGE"));
    view.appendChild(el("h1", "title", "click. static. hope."));
    view.appendChild(
      el("p", "copy", "The label is half-peeled. Whatever is inside still remembers you.")
    );
    const art = el("div", "art-slot");
    art.appendChild(artCanvas("cart"));
    view.appendChild(art);
    const err = el("p", "glitch-line", "WARNING // SAVE HEADER MISMATCH");
    view.appendChild(err);

    const choices = el("div", "choices");
    const go = el("button", "btn primary", "ATTEMPT RECOVERY");
    go.type = "button";
    go.addEventListener("click", () => {
      flashScreen();
      state.step = 0;
      showVignette(0);
    });
    choices.appendChild(go);
    view.appendChild(choices);
    showView(view);
  }

  function showVignette(index) {
    const v = VIGNETTES[index];
    const view = el("div");
    view.appendChild(makeProgress(index));
    view.appendChild(el("p", "kicker", v.kicker));
    view.appendChild(el("h1", "title", v.title));
    view.appendChild(el("p", "copy", v.body));

    const art = el("div", "art-slot");
    art.appendChild(artCanvas(v.art));
    view.appendChild(art);

    const choices = el("div", "choices");
    const a = el("button", "btn", v.a.label);
    const b = el("button", "btn", v.b.label);
    a.type = "button";
    b.type = "button";
    a.addEventListener("click", () => choose(v.a.tags));
    b.addEventListener("click", () => choose(v.b.tags));
    choices.appendChild(a);
    choices.appendChild(b);
    view.appendChild(choices);
    showView(view);
  }

  function choose(tags) {
    state.tags.push(...tags);
    flashScreen();
    const next = state.step + 1;
    if (next >= VIGNETTES.length) {
      ending();
      return;
    }
    state.step = next;
    showVignette(next);
  }

  function ending() {
    const archetype = scoreArchetype();
    const serial = serialFor(archetype);
    state.archetype = archetype;
    state.serial = serial;

    const view = el("div");
    view.classList.add("ending");
    view.appendChild(el("p", "kicker", "RECOVERY COMPLETE"));
    view.appendChild(el("h1", "title", "memory fragment saved"));
    view.appendChild(
      el(
        "p",
        "copy",
        `Signal named: ${archetype.name}.`
      )
    );

    const wrap = el("div", "card-wrap");
    const card = document.createElement("canvas");
    card.id = "memory-card";
    paintCard(card, archetype, serial);
    wrap.appendChild(card);
    view.appendChild(wrap);

    const text = shareText(archetype, serial);
    const box = el("textarea", "share-box");
    box.readOnly = true;
    box.value = text;
    view.appendChild(box);

    const row = el("div", "row");
    const copyBtn = el("button", "btn ghost", "COPY TEXT");
    const dlBtn = el("button", "btn ghost", "SAVE CARD");
    copyBtn.type = "button";
    dlBtn.type = "button";
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "COPIED";
        setTimeout(() => (copyBtn.textContent = "COPY TEXT"), 1200);
      } catch {
        box.select();
      }
    });
    dlBtn.addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = card.toDataURL("image/png");
      a.download = `${serial}.png`;
      a.click();
    });
    row.appendChild(copyBtn);
    row.appendChild(dlBtn);
    view.appendChild(row);

    const choices = el("div", "choices");
    const tweet = el("a", "btn primary");
    tweet.textContent = "OPEN X DRAFT";
    tweet.href = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
    tweet.target = "_blank";
    tweet.rel = "noopener noreferrer";
    tweet.style.textDecoration = "none";
    tweet.style.display = "block";

    const again = el("button", "btn", "▶ Boot again");
    again.type = "button";
    again.style.textAlign = "center";
    again.addEventListener("click", () => bootSequence());

    choices.appendChild(tweet);
    choices.appendChild(again);
    view.appendChild(choices);
    showView(view);
  }

  bootSequence();
})();
