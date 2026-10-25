"use strict";

/**
 * ============================================================================
 * MOUNTAIN RUN - MODULE 2: TRAIN & MOUNTAIN PASS
 * Bulkheads, Front/Rear Spawns, Treehouses & Ground-Clamped Enemies
 * ============================================================================
 */

let carriageSpawnQueue = [];
let carriageSpawnTimer = 0.0;
let carriageMidWaveTriggered = false;
let carriageEndWaveTriggered = false;
let carriageLateWaveTriggered = false;
let carriageFinalDoorWaveTriggered = false;
let engineLastStandTriggered = false;

function createWoodPlankTexture() {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#4a2c18";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "#2b1709";
    ctx.lineWidth = 3;
    for (let y = 0; y < 256; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
    }
    ctx.fillStyle = "rgba(255, 200, 150, 0.05)";
    for (let i = 0; i < 75; i++) {
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 52, 2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 24);
    return tex;
}

function createOrnateCarpetTexture() {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 128;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#681414";
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = "#4a0c0c";
    ctx.fillRect(14, 0, 100, 128);
    ctx.fillStyle = "#c59b27";
    ctx.fillRect(6, 0, 6, 128);
    ctx.fillRect(116, 0, 6, 128);
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(64, 14); ctx.lineTo(100, 64); ctx.lineTo(64, 114); ctx.lineTo(28, 64);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "#e3b341";
    ctx.beginPath();
    ctx.arc(64, 64, 10, 0, Math.PI * 2);
    ctx.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 35);
    return tex;
}

function createVictorianWallpaperTexture() {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const ctx = c.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#3b1d16");
    grad.addColorStop(0.5, "#4d261c");
    grad.addColorStop(1, "#2d140f");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Recessed wainscot wood panels & gold damask motifs
    ctx.strokeStyle = "#8a6621";
    ctx.lineWidth = 3;
    for (let x = 12; x < 256; x += 64) {
        ctx.strokeRect(x, 18, 44, 220);
        ctx.fillStyle = "rgba(212, 175, 55, 0.14)";
        ctx.beginPath();
        ctx.moveTo(x + 22, 60);
        ctx.lineTo(x + 36, 128);
        ctx.lineTo(x + 22, 196);
        ctx.lineTo(x + 8, 128);
        ctx.closePath();
        ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 1);
    return tex;
}

function createCeilingCofferTexture() {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#2b1810";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "#b89028";
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 236, 236);
    ctx.strokeStyle = "#6e4726";
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, 208, 208);
    ctx.fillStyle = "rgba(212, 175, 55, 0.12)";
    ctx.beginPath();
    ctx.arc(128, 128, 42, 0, Math.PI * 2);
    ctx.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 24);
    return tex;
}

function createStainedGlassTexture() {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 64;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#1a0f0a";
    ctx.fillRect(0, 0, 256, 64);
    const colors = ["#ff9f1c", "#e71d36", "#2ec4b6", "#ffd166"];
    for (let x = 8; x < 256; x += 32) {
        ctx.fillStyle = colors[(x / 32) % colors.length];
        ctx.beginPath();
        ctx.arc(x + 12, 32, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, 8, 24, 48);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 1);
    return tex;
}

function createStoneWallTexture() {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#2d2833";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "#16131c";
    ctx.lineWidth = 5;
    for (let y = 0; y <= 256; y += 42) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
    }
    for (let y = 0; y < 42; y++) {
        const offset = ((y / 42) % 2 === 0) ? 0 : 32;
        for (let x = offset; x <= 256; x += 64) {
            ctx.beginPath(); ctx.moveTo(x, y * 42); ctx.lineTo(x, (y + 1) * 42); ctx.stroke();
        }
    }
    ctx.fillStyle = "rgba(35, 52, 42, 0.32)";
    for (let i = 0; i < 25; i++) {
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 40, 20);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function createFlagstoneFloorTexture() {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#1b1821";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "#0d0a12";
    ctx.lineWidth = 4;
    for (let y = 0; y <= 256; y += 64) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(y, 0); ctx.lineTo(y, 256); ctx.stroke();
    }
    ctx.fillStyle = "rgba(100, 110, 125, 0.08)";
    for (let i = 0; i < 40; i++) {
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 22, 22);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    return tex;
}

const trainWoodTex = createWoodPlankTexture();
const trainCarpetTex = createOrnateCarpetTexture();
const trainWallpaperTex = createVictorianWallpaperTexture();
const trainCeilingTex = createCeilingCofferTexture();
const stainedGlassTex = createStainedGlassTexture();
const stoneWallTex = createStoneWallTexture();
const flagstoneFloorTex = createFlagstoneFloorTexture();
function createDiamondPlateTexture() {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 128;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#1c2128";
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = "#3b434f";
    ctx.lineWidth = 3;
    for (let y = 16; y < 128; y += 32) {
        for (let x = 16; x < 128; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y);
            ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10);
            ctx.stroke();
        }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 45);
    return tex;
}

function createRivetedIronTexture() {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const ctx = c.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, "#1d1918");
    grad.addColorStop(0.5, "#2b2422");
    grad.addColorStop(1, "#141110");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = "#0d0a0a";
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 248, 248);

    for (let i = 16; i < 256; i += 28) {
        [14, 242].forEach(pos => {
            ctx.fillStyle = "#483c38";
            ctx.beginPath(); ctx.arc(i, pos, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(pos, i, 4, 0, Math.PI * 2); ctx.fill();
        });
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 8);
    return tex;
}

function createPressureGaugeTexture() {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 128;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#f4f1de";
    ctx.beginPath(); ctx.arc(64, 64, 60, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#b91c1c";
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(64, 64, 50, -0.3 * Math.PI, 0.25 * Math.PI); ctx.stroke();
    ctx.strokeStyle = "#1f242d";
    ctx.lineWidth = 3;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        ctx.beginPath();
        ctx.moveTo(64 + Math.cos(a) * 42, 64 + Math.sin(a) * 42);
        ctx.lineTo(64 + Math.cos(a) * 54, 64 + Math.sin(a) * 54);
        ctx.stroke();
    }
    ctx.strokeStyle = "#d90429";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(64, 64); ctx.lineTo(102, 42); ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.beginPath(); ctx.arc(64, 64, 6, 0, Math.PI * 2); ctx.fill();
    return new THREE.CanvasTexture(c);
}

const diamondPlateTex = createDiamondPlateTexture();
const rivetedIronTex = createRivetedIronTexture();
const gaugeDialTex = createPressureGaugeTexture();


let narrativeTimeout = null;
function showNarrativeBanner(text, duration = 5500) {
    const banner = document.getElementById("narrative-banner");
    if (!banner) return;
    banner.textContent = text;
    banner.style.display = "block";
    sound.speakNarrative(text);
    if (narrativeTimeout) clearTimeout(narrativeTimeout);
    narrativeTimeout = setTimeout(() => {
        banner.style.display = "none";
    }, duration);
}

function clearWorldGroups() {
    while (carriageGroup.children.length > 0) {
        carriageGroup.remove(carriageGroup.children[0]);
    }
    hazards = [];
    projectiles = [];
    npcs = [];
    particles = [];
    pickups = [];
    climbableTrees = [];
    mazeWallBoxes = [];
    openMazeCells = [];
    steamClouds = [];
    arcaneRings = [];
    engineHitboxes = [];
    carriageSpawnQueue = [];
    carriageSpawnTimer = 0.0;
    carriageMidWaveTriggered = false;
    carriageEndWaveTriggered = false;
    carriageLateWaveTriggered = false;
    carriageFinalDoorWaveTriggered = false;
    engineLastStandTriggered = false;
    state.redDoorPos = null;
    state.manorDoorPos = null;
}

function buildExteriorScenery() {
    while (exteriorGroup.children.length > 0) {
        exteriorGroup.remove(exteriorGroup.children[0]);
    }
    steamClouds = [];

    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x354656, roughness: 0.9, flatShading: true });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x4a5866, roughness: 0.85, flatShading: true });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf0f6fc, roughness: 0.4, flatShading: true });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x422d1d, roughness: 0.9 });
    const pineDarkMat = new THREE.MeshStandardMaterial({ color: 0x173823, roughness: 0.8, flatShading: true });
    const pineLightMat = new THREE.MeshStandardMaterial({ color: 0x234f32, roughness: 0.8, flatShading: true });
    const ballastMat = new THREE.MeshStandardMaterial({ color: 0x3d4247, roughness: 0.95 });
    const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x2e1d12, roughness: 0.9 });
    const railSteelMat = new THREE.MeshStandardMaterial({ color: 0x9aa4ec, metalness: 0.85, roughness: 0.25 });

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(360, 480),
        new THREE.MeshStandardMaterial({ color: 0x1f2e23, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -2.5, -120);
    exteriorGroup.add(ground);

    const ballastBed = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.5, 420), ballastMat);
    ballastBed.position.set(0, -0.45, -110);
    exteriorGroup.add(ballastBed);

    [-1.1, 1.1].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 420), railSteelMat);
        rail.position.set(rx, -0.15, -110);
        exteriorGroup.add(rail);
    });

    for (let z = 40; z >= -260; z -= 10) {
        const sleeper = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 0.45), sleeperMat);
        sleeper.position.set(0, -0.2, z);
        sleeper.userData.scrollable = true;
        exteriorGroup.add(sleeper);

        if (Math.abs(z) % 30 === 0) {
            const poleGroup = new THREE.Group();
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8), trunkMat);
            pole.position.y = 2.0;
            const crossbar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.12), trunkMat);
            crossbar.position.y = 5.2;
            poleGroup.add(pole, crossbar);
            poleGroup.position.set(5.2, -1.8, z);
            poleGroup.userData.scrollable = true;
            exteriorGroup.add(poleGroup);
        }

        [-1, 1].forEach(side => {
            const treeGroup = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 3.2, 7), trunkMat);
            trunk.position.y = 1.6;
            const tier1 = new THREE.Mesh(new THREE.ConeGeometry(2.4, 3.6, 7), pineDarkMat);
            tier1.position.y = 3.8;
            const tier2 = new THREE.Mesh(new THREE.ConeGeometry(1.9, 3.2, 7), pineLightMat);
            tier2.position.y = 5.6;
            const tier3 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.5, 7), snowMat);
            tier3.position.y = 7.2;

            treeGroup.add(trunk, tier1, tier2, tier3);
            const scale = 0.85 + Math.random() * 0.45;
            treeGroup.scale.setScalar(scale);
            treeGroup.position.set(side * (8.5 + Math.random() * 9), -2.4, z + (Math.random() * 4 - 2));
            treeGroup.userData.scrollable = true;
            exteriorGroup.add(treeGroup);

            if (Math.random() < 0.45) {
                const boulder = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(0.9 + Math.random() * 1.3, 0),
                    rockMat
                );
                boulder.position.set(side * (6.2 + Math.random() * 6), -2.0, z + Math.random() * 5);
                boulder.rotation.set(Math.random(), Math.random(), Math.random());
                boulder.userData.scrollable = true;
                exteriorGroup.add(boulder);
            }

            if (Math.abs(z) % 20 === 0) {
                const mtnGroup = new THREE.Group();
                const height = 34 + Math.random() * 26;
                const radius = 16 + Math.random() * 10;
                const mtn = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 7), mountainMat);
                mtn.position.y = height / 2 - 3;

                const capHeight = height * 0.38;
                const cap = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.38, capHeight, 7), snowMat);
                cap.position.y = height - capHeight / 2 - 2.85;

                const subH = height * 0.65;
                const subR = radius * 0.7;
                const subPeak = new THREE.Mesh(new THREE.ConeGeometry(subR, subH, 6), rockMat);
                subPeak.position.set(side * -6, subH / 2 - 3, 5);

                mtnGroup.add(mtn, cap, subPeak);
                mtnGroup.rotation.y = Math.random() * Math.PI;
                mtnGroup.position.set(side * (38 + Math.random() * 18), 0, z);
                mtnGroup.userData.scrollable = true;
                exteriorGroup.add(mtnGroup);
            }
        });
    }

    const steamMat = new THREE.MeshLambertMaterial({ color: 0xdbe6f0, transparent: true, opacity: 0.38 });
    for (let i = 0; i < 26; i++) {
        const puff = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.9 + Math.random() * 1.4, 1),
            steamMat
        );
        const side = Math.random() < 0.5 ? -1 : 1;
        puff.position.set(
            side * (3.2 + Math.random() * 2.5),
            1.2 + Math.random() * 2.8,
            -Math.random() * 260
        );
        puff.userData.scrollable = true;
        puff.userData.bobSpeed = 1.2 + Math.random() * 1.5;
        puff.userData.bobOffset = Math.random() * Math.PI * 2;
        exteriorGroup.add(puff);
        steamClouds.push(puff);
    }
}

function buildCarriage() {
    clearWorldGroups();
    carriageSpawnQueue = [];
    carriageSpawnTimer = 0.0;

    state.environmentMode = "TRAIN";
    exteriorGroup.visible = true;
    scene.background = new THREE.Color(0x526578);
    scene.fog = new THREE.FogExp2(0x526578, 0.0075);
    ambientLight.color.setHex(0xffeedd);
    ambientLight.intensity = 0.58;
    dirLight.color.setHex(0xffffff);
    dirLight.intensity = 0.72;
    sound.setMountainWind(false);

    engineHitboxes = [];
    state.redDoorPos = null;

    const len = state.carriageLength;
    const halfW = state.corridorHalfWidth;
    const isEngineRoom = (state.carriageLevel === state.maxCarriages);

    if (!isEngineRoom) {
        // --- LUXURY VICTORIAN PASSENGER INTERIORS (PULLMAN EXPRESS EDITION) ---
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(halfW * 2, len),
            new THREE.MeshStandardMaterial({ map: trainWoodTex, roughness: 0.58, metalness: 0.1 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0, -len / 2);
        carriageGroup.add(floor);

        const runner = new THREE.Mesh(
            new THREE.PlaneGeometry(1.42, len),
            new THREE.MeshStandardMaterial({ map: trainCarpetTex, roughness: 0.82 })
        );
        runner.rotation.x = -Math.PI / 2;
        runner.position.set(0, 0.012, -len / 2);
        carriageGroup.add(runner);

        // Brass carpet trim rails along the runner edges
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.18 });
        [-0.72, 0.72].forEach(rx => {
            const carpetStrip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.016, len), brassMat);
            carpetStrip.position.set(rx, 0.014, -len / 2);
            carriageGroup.add(carpetStrip);
        });

        const ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(halfW * 2, len),
            new THREE.MeshStandardMaterial({ map: trainCeilingTex, roughness: 0.55, metalness: 0.12 })
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, 3.25, -len / 2);
        carriageGroup.add(ceiling);

        const wallMat = new THREE.MeshStandardMaterial({ map: trainWallpaperTex, roughness: 0.58, metalness: 0.08 });
        const mahoganyMat = new THREE.MeshStandardMaterial({ color: 0x4e1b0f, roughness: 0.34, metalness: 0.16 });
        const velvetSeatMat = new THREE.MeshStandardMaterial({ color: 0x8a181e, roughness: 0.78 });
        const velvetPillowMat = new THREE.MeshStandardMaterial({ color: 0xc59b27, roughness: 0.65 });
        const curtainMat = new THREE.MeshStandardMaterial({ color: 0x5e0f18, roughness: 0.85 });
        const tableclothMat = new THREE.MeshStandardMaterial({ color: 0xf6f2e6, roughness: 0.75 });
        const lampShadeMat = new THREE.MeshBasicMaterial({ color: 0xffebb3 });
        const stainedMat = new THREE.MeshBasicMaterial({ map: stainedGlassTex });
        const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xb8dfff, transparent: true, opacity: 0.24, roughness: 0.08 });
        const leatherCaseMat = new THREE.MeshStandardMaterial({ color: 0x6b3e23, roughness: 0.65, metalness: 0.1 });

        // --- REAR BULKHEAD WALL (Completely seals off tracks behind) ---
        const rearWall = new THREE.Mesh(new THREE.BoxGeometry(halfW * 2, 3.25, 0.25), wallMat);
        rearWall.position.set(0, 1.625, -0.12);
        const rearDoorMat = new THREE.MeshStandardMaterial({ color: 0x162332, metalness: 0.5, roughness: 0.4 });
        const rearDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 0.3), rearDoorMat);
        rearDoor.position.set(0, 1.3, -0.16);
        const rearDoorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.85, 2.75, 0.28), brassMat);
        rearDoorFrame.position.set(0, 1.375, -0.14);
        carriageGroup.add(rearWall, rearDoor, rearDoorFrame);

        // --- CORRIDOR BOOTHS, CLERESTORY STAINED GLASS & MULTI-ARM CHANDELIERS ---
        for (let z = -5; z >= -len + 5; z -= 10) {
            // Archway wooden beam & brass filigree rib
            const ceilingRib = new THREE.Mesh(new THREE.BoxGeometry(halfW * 2, 0.16, 0.3), mahoganyMat);
            ceilingRib.position.set(0, 3.16, z);
            const ribBrassTrim = new THREE.Mesh(new THREE.BoxGeometry(halfW * 2 - 0.1, 0.04, 0.32), brassMat);
            ribBrassTrim.position.set(0, 3.07, z);

            // Ornate Multi-Branch Brass Chandelier
            const chandelierStem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 10), brassMat);
            chandelierStem.position.set(0, 2.98, z);
            const chandelierRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.038, 10, 20), brassMat);
            chandelierRing.rotation.x = Math.PI / 2;
            chandelierRing.position.set(0, 2.78, z);
            const chandelierGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), lampShadeMat);
            chandelierGlobe.position.set(0, 2.74, z);
            carriageGroup.add(ceilingRib, ribBrassTrim, chandelierStem, chandelierRing, chandelierGlobe);

            // 4 Side crystal globes around chandelier ring
            for (let ca = 0; ca < Math.PI * 2; ca += Math.PI / 2) {
                const miniGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), lampShadeMat);
                miniGlobe.position.set(Math.cos(ca) * 0.34, 2.72, z + Math.sin(ca) * 0.34);
                carriageGroup.add(miniGlobe);
            }

            if (Math.abs(z) % 20 === 5) {
                const warmLight = new THREE.PointLight(0xffb86c, 1.25, 17, 1.5);
                warmLight.position.set(0, 2.55, z);
                carriageGroup.add(warmLight);
            }

            [-1, 1].forEach(side => {
                const lowerWall = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.1, 10), wallMat);
                lowerWall.position.set(side * halfW, 0.55, z);
                const wainscotTrim = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 10), brassMat);
                wainscotTrim.position.set(side * halfW, 1.1, z);
                const upperWall = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.72, 10), wallMat);
                upperWall.position.set(side * halfW, 2.88, z);

                // Illuminated Stained-Glass Clerestory Strip along the upper wall
                const clerestoryStrip = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 0.28), stainedMat);
                clerestoryStrip.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
                clerestoryStrip.position.set(side * (halfW - 0.09), 2.9, z);

                const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.26, 3.25, 1.25), mahoganyMat);
                pillar.position.set(side * halfW, 1.625, z - 4.4);

                // Brass Wall Sconce on Pillar
                const sconceBack = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.14), brassMat);
                sconceBack.position.set(side * (halfW - 0.14), 1.92, z - 4.4);
                const sconceBulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), lampShadeMat);
                sconceBulb.position.set(side * (halfW - 0.19), 1.98, z - 4.4);

                // Panoramic Window with Mullions
                const pane = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 1.4), glassMat);
                pane.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
                pane.position.set(side * (halfW - 0.02), 1.8, z);
                const windowArchBar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 8.8), brassMat);
                windowArchBar.position.set(side * (halfW - 0.04), 2.48, z);

                [-3.6, 3.6].forEach(cz => {
                    const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 1.44, 10), curtainMat);
                    drape.position.set(side * (halfW - 0.12), 1.8, z + cz);
                    const tieback = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 6, 12), brassMat);
                    tieback.rotation.x = Math.PI / 2;
                    tieback.position.set(side * (halfW - 0.12), 1.65, z + cz);
                    carriageGroup.add(drape, tieback);
                });

                // Overhead Brass Luggage Rack & Vintage Leather Suitcases
                const rackRail = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 8.6, 8), brassMat);
                rackRail.rotation.x = Math.PI / 2;
                rackRail.position.set(side * (halfW - 0.38), 2.55, z);
                const rackShelf = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 8.6), brassMat);
                rackShelf.position.set(side * (halfW - 0.24), 2.52, z);

                if ((Math.abs(z) + (side > 0 ? 5 : 0)) % 20 === 5) {
                    const suitcase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.56), leatherCaseMat);
                    suitcase.position.set(side * (halfW - 0.24), 2.65, z - 1.2);
                    suitcase.rotation.y = side * 0.08;
                    const strap1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.04), brassMat);
                    strap1.position.set(side * (halfW - 0.24), 2.65, z - 1.05);
                    const strap2 = strap1.clone();
                    strap2.position.z = z - 1.35;
                    carriageGroup.add(suitcase, strap1, strap2);
                }

                carriageGroup.add(
                    lowerWall, wainscotTrim, upperWall, clerestoryStrip,
                    pillar, sconceBack, sconceBulb, pane, windowArchBar,
                    rackRail, rackShelf
                );

                // Plush Tufted Pullman Booths with Carved Mahogany Legs, Brass Feet, Armrests & Table Settings
                const boothX = side * (halfW - 0.34);
                const aisleEdgeX = boothX - side * 0.24;

                [-1.35, 1.35].forEach((seatZOffset, sIdx) => {
                    const sz = z + seatZOffset;
                    const backDir = sIdx === 0 ? -1 : 1;

                    // Upholstered Velvet Cushion, Tufted Backrest & Gold Bolster Pillow
                    const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.16, 0.56), velvetSeatMat);
                    seatCushion.position.set(boothX, 0.47, sz);
                    const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.68, 0.14), velvetSeatMat);
                    seatBack.position.set(boothX, 0.84, sz + backDir * 0.27);
                    const headrest = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.48, 8), velvetPillowMat);
                    headrest.rotation.z = Math.PI / 2;
                    headrest.position.set(boothX, 1.15, sz + backDir * 0.21);

                    // Carved Mahogany Under-Seat Frame Apron & Back Timber Uprights
                    const seatFrame = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.07, 0.58), mahoganyMat);
                    seatFrame.position.set(boothX, 0.36, sz);
                    const backFrame = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.72, 0.05), mahoganyMat);
                    backFrame.position.set(boothX, 0.83, sz + backDir * 0.34);

                    // Aisle-Side Carved Mahogany Armrest & Brass Support Post
                    const armrest = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.52), mahoganyMat);
                    armrest.position.set(aisleEdgeX, 0.66, sz);
                    const armPost = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.26, 8), brassMat);
                    armPost.position.set(aisleEdgeX, 0.52, sz - backDir * 0.20);

                    carriageGroup.add(seatCushion, seatBack, headrest, seatFrame, backFrame, armrest, armPost);

                    // 4 Turned Mahogany Chair Legs with Polished Brass Foot Ferrules & Cross-Stretchers
                    [-0.22, 0.22].forEach(lx => {
                        [-0.22, 0.22].forEach(lz => {
                            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.024, 0.35, 8), mahoganyMat);
                            leg.position.set(boothX + lx, 0.175, sz + lz);
                            const brassFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.06, 8), brassMat);
                            brassFoot.position.set(boothX + lx, 0.03, sz + lz);
                            carriageGroup.add(leg, brassFoot);
                        });
                        // Side wooden stretcher bar connecting front and rear legs
                        const stretcher = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.44), mahoganyMat);
                        stretcher.position.set(boothX + lx, 0.12, sz);
                        carriageGroup.add(stretcher);
                    });
                });

                const tableTop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.8), mahoganyMat);
                tableTop.position.set(boothX, 0.74, z);
                const tableCloth = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.065, 0.68), tableclothMat);
                tableCloth.position.set(boothX, 0.745, z);
                const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.74, 8), brassMat);
                tableLeg.position.set(boothX, 0.37, z);
                const tableFootBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.04, 10), brassMat);
                tableFootBase.position.set(boothX, 0.02, z);
                const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.065, 0.22, 8), brassMat);
                lampBase.position.set(boothX, 0.88, z);
                const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.17, 12), lampShadeMat);
                lampShade.position.set(boothX, 1.03, z);

                carriageGroup.add(
                    tableTop, tableCloth, tableLeg, tableFootBase, lampBase, lampShade
                );
            });
        }

        // --- FRONT BULKHEAD WALL & ILLUMINATED EXIT ARCHWAY ---
        const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry((halfW - 0.8), 3.25, 0.25), wallMat);
        frontWallLeft.position.set(-(halfW + 0.8) / 2, 1.625, -len + 0.5);
        const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry((halfW - 0.8), 3.25, 0.25), wallMat);
        frontWallRight.position.set((halfW + 0.8) / 2, 1.625, -len + 0.5);
        const frontWallTop = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.65, 0.25), wallMat);
        frontWallTop.position.set(0, 2.925, -len + 0.5);
        carriageGroup.add(frontWallLeft, frontWallRight, frontWallTop);

        const endDoorMat = new THREE.MeshStandardMaterial({ color: 0x0e5a6f, emissive: 0x052c38, metalness: 0.55, roughness: 0.32 });
        const endDoorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.88, 2.78, 0.3), brassMat);
        endDoorFrame.position.set(0, 1.39, -len + 0.52);
        const endDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 0.34), endDoorMat);
        endDoor.position.set(0, 1.3, -len + 0.5);
        const doorPorchWindow = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.38, 16), lampShadeMat);
        doorPorchWindow.rotation.x = Math.PI / 2;
        doorPorchWindow.position.set(0, 1.85, -len + 0.5);
        const doorExitLight = new THREE.PointLight(0x58a6ff, 1.4, 8);
        doorExitLight.position.set(0, 2.4, -len + 1.5);
        carriageGroup.add(endDoorFrame, endDoor, doorPorchWindow, doorExitLight);

        // --- DYNAMIC FRONT & REAR SPAWN QUEUES (IMMEDIATE & STEADY SUCCESSION) ---
        const lvl = state.carriageLevel;
        if (lvl === 1) {
            // Carriage 1: 6 zombies from the FRONT - first 2 spawn with generous shooting distance!
            spawnNPC(-0.55, -24.0, "CYAN", false);
            spawnNPC(0.55, -38.0, "GREEN", false);
            for (let i = 0; i < 4; i++) {
                carriageSpawnQueue.push({
                    spawnDelay: 1.5 + i * 2.0,
                    isAhead: true,
                    get zPos() {
                        return Math.max(-state.carriageLength + 10.0, state.playerZ - 22.0 - Math.random() * 8.0);
                    },
                    xPos: (Math.random() - 0.5) * 1.3,
                    type: (i % 2 === 0) ? "CYAN" : "GREEN",
                    isChokeSwarm: false
                });
            }
            showNarrativeBanner("Carriage 1: 6 Zombies ahead! Match Water Gun (Blue) & Fart Gun (Green) [Q]!");
        } else if (lvl === 2) {
            // Carriage 2: 8 zombies, immediate front wave + alternating FRONT and BEHIND
            spawnNPC(-0.6, -24.0, "GREEN", false);
            spawnNPC(0.6, -37.0, "CYAN", false);
            for (let i = 0; i < 6; i++) {
                const ahead = (i % 2 === 0);
                carriageSpawnQueue.push({
                    spawnDelay: 1.4 + i * 1.8,
                    isAhead: ahead,
                    get zPos() {
                        if (this.isAhead || state.playerZ > -20.0) {
                            return Math.max(-state.carriageLength + 10.0, state.playerZ - 22.0 - Math.random() * 8.0);
                        } else {
                            return Math.min(-3.0, state.playerZ + 18.0 + Math.random() * 5.0);
                        }
                    },
                    xPos: (Math.random() - 0.5) * 1.4,
                    type: (i % 2 === 0) ? "CYAN" : "GREEN",
                    isChokeSwarm: false
                });
            }
            showNarrativeBanner("Carriage 2: Enemies closing in from FRONT and BEHIND! Press [SPACE] for 180 Turn!");
        } else if (lvl === 3) {
            // Carriage 3: 10 enemies, adds GHOSTS (use Special Torch!)
            const pool = ["CYAN", "GREEN", "GHOST"];
            spawnNPC(0.0, -23.0, "GHOST", false);
            spawnNPC(-0.65, -36.0, "CYAN", false);
            for (let i = 0; i < 8; i++) {
                const ahead = (i % 2 === 0);
                carriageSpawnQueue.push({
                    spawnDelay: 1.3 + i * 1.6,
                    isAhead: ahead,
                    get zPos() {
                        if (this.isAhead || state.playerZ > -20.0) {
                            return Math.max(-state.carriageLength + 10.0, state.playerZ - 22.0 - Math.random() * 8.0);
                        } else {
                            return Math.min(-3.0, state.playerZ + 18.0 + Math.random() * 5.0);
                        }
                    },
                    xPos: (Math.random() - 0.5) * 1.4,
                    type: pool[i % pool.length],
                    isChokeSwarm: false
                });
            }
            showNarrativeBanner("Carriage 3: Ghosts detected! Switch to your Special Torch [Q] to purify them!");
        } else if (lvl === 4) {
            // Carriage 4: 12 enemies, adds VAMPIRES (use Garlic Slingshot!)
            const pool = ["CYAN", "GREEN", "GHOST", "VAMPIRE"];
            spawnNPC(0.0, -23.0, "VAMPIRE", false);
            spawnNPC(0.65, -35.0, "GHOST", false);
            for (let i = 0; i < 10; i++) {
                const ahead = (i % 2 === 0);
                carriageSpawnQueue.push({
                    spawnDelay: 1.2 + i * 1.4,
                    isAhead: ahead,
                    get zPos() {
                        if (this.isAhead || state.playerZ > -20.0) {
                            return Math.max(-state.carriageLength + 10.0, state.playerZ - 22.0 - Math.random() * 8.0);
                        } else {
                            return Math.min(-3.0, state.playerZ + 18.0 + Math.random() * 5.0);
                        }
                    },
                    xPos: (Math.random() - 0.5) * 1.5,
                    type: pool[i % pool.length],
                    isChokeSwarm: false
                });
            }
            showNarrativeBanner("Carriage 4: Vampires & Ghosts! Use Garlic Slingshot [Q] on Vampires!");
        }

        safeSetText("carriage-value", `CARRIAGE 0${state.carriageLevel} / 0${state.maxCarriages}`);
        safeSetText("objective-label", "Distance To Next Carriage");

    } else {
        // --- CARRIAGE 5: OVERHAULED REALISTIC STEAM LOCOMOTIVE ENGINE ROOM ---
        exteriorGroup.visible = true;
        scene.background = new THREE.Color(0x140d09);
        scene.fog = new THREE.FogExp2(0x1c120c, 0.015);
        ambientLight.color.setHex(0xff9955);
        ambientLight.intensity = 0.55;
        dirLight.color.setHex(0xffbb77);
        dirLight.intensity = 0.65;

        const ironFloorMat = new THREE.MeshStandardMaterial({
            map: diamondPlateTex,
            color: 0x88929e,
            metalness: 0.78,
            roughness: 0.36
        });
        const rivetedWallMat = new THREE.MeshStandardMaterial({
            map: rivetedIronTex,
            color: 0x7a6a64,
            metalness: 0.82,
            roughness: 0.42
        });
        const darkSteelMat = new THREE.MeshStandardMaterial({
            color: 0x262b33,
            metalness: 0.88,
            roughness: 0.32
        });
        const boilerMat = new THREE.MeshStandardMaterial({
            map: rivetedIronTex,
            color: 0x3b322e,
            metalness: 0.85,
            roughness: 0.34
        });
        const chromePistonMat = new THREE.MeshStandardMaterial({
            color: 0xd8e2ec,
            metalness: 0.95,
            roughness: 0.14
        });
        const brassBandMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            metalness: 0.9,
            roughness: 0.2
        });
        const copperPipeMat = new THREE.MeshStandardMaterial({
            color: 0xc86428,
            metalness: 0.85,
            roughness: 0.25
        });
        const fireboxMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
        const emberMat = new THREE.MeshStandardMaterial({
            color: 0x2b1108,
            emissive: 0xff3300,
            emissiveIntensity: 0.9,
            roughness: 0.85
        });
        const coalMat = new THREE.MeshStandardMaterial({
            color: 0x111317,
            roughness: 0.9,
            metalness: 0.15,
            flatShading: true
        });
        const gaugeFaceMat = new THREE.MeshBasicMaterial({ map: gaugeDialTex });
        const shieldPlateMat = new THREE.MeshStandardMaterial({
            map: diamondPlateTex,
            color: 0x56606b,
            metalness: 0.82,
            roughness: 0.35
        });
        const valveRedMat = new THREE.MeshStandardMaterial({ color: 0xd91c1c, roughness: 0.3, metalness: 0.3 });
        const cabGlassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffcfa3,
            transparent: true,
            opacity: 0.28,
            roughness: 0.15
        });

        // 1. Heavy Diamond-Plate Floor & Grated Walkways
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2, len), ironFloorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0, -len / 2);
        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2, len), rivetedWallMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, 3.7, -len / 2);
        carriageGroup.add(floor, ceiling);

        // Raised Steel Catwalk Strips with glowing under-channel
        const underGlowMat = new THREE.MeshBasicMaterial({ color: 0xff4500, transparent: true, opacity: 0.35 });
        const centerGrateGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.6, len - 6), underGlowMat);
        centerGrateGlow.rotation.x = -Math.PI / 2;
        centerGrateGlow.position.set(0, 0.01, -len / 2);
        carriageGroup.add(centerGrateGlow);

        [-1.08, 1.08].forEach(sideX => {
            const sideWalkway = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.08, len), ironFloorMat);
            sideWalkway.position.set(sideX, 0.04, -len / 2);
            const curb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, len), brassBandMat);
            curb.position.set(sideX > 0 ? sideX - 0.45 : sideX + 0.45, 0.07, -len / 2);
            carriageGroup.add(sideWalkway, curb);
        });

        // 2. SOLID RIVETED IRON BULKHEAD WALLS (Left, Right, Rear, and Front)
        // Encloses the Engine Room with realistic armored walls and slit observation portholes
        for (let z = -5; z >= -len + 5; z -= 10) {
            [-1, 1].forEach(side => {
                // Lower armored hull wall
                const lowerHullWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.55, 10.0), rivetedWallMat);
                lowerHullWall.position.set(side * halfW, 0.775, z);
                // Upper armored hull wall
                const upperHullWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.15, 10.0), rivetedWallMat);
                upperHullWall.position.set(side * halfW, 3.125, z);
                // Solid panels flanking the armored cab window
                const midPanelA = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.0, 3.2), rivetedWallMat);
                midPanelA.position.set(side * halfW, 2.05, z - 3.4);
                const midPanelB = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.0, 3.2), rivetedWallMat);
                midPanelB.position.set(side * halfW, 2.05, z + 3.4);

                // Brass-framed Locomotive Cab Porthole Window in center of segment
                const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.06, 3.6), brassBandMat);
                windowFrame.position.set(side * halfW, 2.05, z);
                const windowPane = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.9), cabGlassMat);
                windowPane.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
                windowPane.position.set(side * (halfW - 0.02), 2.05, z);

                // Heavy Wainscot Steel Beam & Riveted Plate Trim
                const waistBeam = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 10.0), darkSteelMat);
                waistBeam.position.set(side * halfW, 1.52, z);
                const topBeam = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 10.0), darkSteelMat);
                topBeam.position.set(side * halfW, 2.58, z);

                // Vertical Copper Conduit Pipes & Valve Wheels along walls
                const vertPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 3.6, 8), copperPipeMat);
                vertPipe.position.set(side * (halfW - 0.16), 1.8, z - 2.2);
                const wallValve = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 8, 14), valveRedMat);
                wallValve.rotation.y = Math.PI / 2;
                wallValve.position.set(side * (halfW - 0.22), 1.45, z - 2.2);

                carriageGroup.add(
                    lowerHullWall, upperHullWall, midPanelA, midPanelB,
                    windowFrame, windowPane, waistBeam, topBeam,
                    vertPipe, wallValve
                );
            });

            // Overhead Arched Steel Rib Trusses
            const archRibTop = new THREE.Mesh(new THREE.BoxGeometry(halfW * 2, 0.24, 0.32), darkSteelMat);
            archRibTop.position.set(0, 3.55, z);
            const archKneeL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.65, 0.3), darkSteelMat);
            archKneeL.position.set(-halfW + 0.22, 3.25, z);
            archKneeL.rotation.z = -0.35;
            const archKneeR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.65, 0.3), darkSteelMat);
            archKneeR.position.set(halfW - 0.22, 3.25, z);
            archKneeR.rotation.z = 0.35;
            carriageGroup.add(archRibTop, archKneeL, archKneeR);
        }

        // Rear Iron Bulkhead Wall & Heavy Crew Door
        const rearIronWall = new THREE.Mesh(new THREE.BoxGeometry(halfW * 2, 3.7, 0.32), rivetedWallMat);
        rearIronWall.position.set(0, 1.85, -0.15);
        const rearBulkheadDoor = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.38), darkSteelMat);
        rearBulkheadDoor.position.set(0, 1.25, -0.18);
        const rearWheelHandle = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 16), brassBandMat);
        rearWheelHandle.position.set(0, 1.3, -0.4);
        carriageGroup.add(rearIronWall, rearBulkheadDoor, rearWheelHandle);

        // Structural Stanchions, Overhead Lantern Cages & Warm Industrial Lighting
        for (let z = -6; z >= -len + 6; z -= 8) {
            [-1, 1].forEach(side => {
                const steelStanchion = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.7, 0.38), darkSteelMat);
                steelStanchion.position.set(side * (halfW - 0.08), 1.85, z);
                const pipeJoint = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 8, 12), brassBandMat);
                pipeJoint.position.set(side * (halfW - 0.26), 2.95, z);
                carriageGroup.add(steelStanchion, pipeJoint);
            });

            // Glowing Industrial Cage Lamp on Ceiling
            const lampCage = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.26, 8), brassBandMat);
            lampCage.position.set(0, 3.38, z);
            const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), fireboxMat);
            lampBulb.position.set(0, 3.28, z);
            carriageGroup.add(lampCage, lampBulb);

            if (Math.abs(z) % 16 === 6) {
                const hazardLight = new THREE.PointLight(0xff7722, 1.65, 16, 1.6);
                hazardLight.position.set(0, 3.15, z);
                carriageGroup.add(hazardLight);
            }
        }

        // Dual Longitudinal Copper & Brass Steam Manifolds along both upper walls
        [-1, 1].forEach(side => {
            const longCopperPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, len, 12), copperPipeMat);
            longCopperPipe.rotation.x = Math.PI / 2;
            longCopperPipe.position.set(side * (halfW - 0.26), 2.95, -len / 2);

            const lowerSteamPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, len, 10), brassBandMat);
            lowerSteamPipe.rotation.x = Math.PI / 2;
            lowerSteamPipe.position.set(side * (halfW - 0.22), 0.32, -len / 2);
            carriageGroup.add(longCopperPipe, lowerSteamPipe);
        });

        // 3. COAL TENDER BUNKERS & GLOWING EMBER TROUGHS (Z = -12 to -30)
        [-1, 1].forEach(side => {
            const coalBunker = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.25, 10.0), darkSteelMat);
            coalBunker.position.set(side * (halfW - 0.38), 0.625, -18);
            carriageGroup.add(coalBunker);

            // Heaped jagged coal mounds inside the bunkers
            for (let cz = -14; cz >= -22; cz -= 1.6) {
                const coalChunk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32 + Math.random() * 0.18, 0), coalMat);
                coalChunk.position.set(side * (halfW - 0.36), 1.32, cz);
                coalChunk.rotation.set(Math.random(), Math.random(), Math.random());
                carriageGroup.add(coalChunk);
            }
        });

        // 4. MASSIVE CENTRAL HIGH-PRESSURE LOCOMOTIVE BOILER & FURNACE (Z = -36 to -68)
        const boilerRadius = 0.88;
        const boilerLength = 30;
        const boilerZ = -53;

        const boilerCradle = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.65, boilerLength - 2), darkSteelMat);
        boilerCradle.position.set(0, 0.325, boilerZ);
        const boiler = new THREE.Mesh(new THREE.CylinderGeometry(boilerRadius, boilerRadius, boilerLength, 24), boilerMat);
        boiler.rotation.x = Math.PI / 2;
        boiler.position.set(0, 1.48, boilerZ);
        carriageGroup.add(boilerCradle, boiler);

        // Polished Brass Boiler Retaining Bands & Rivet Collars
        for (let bz = boilerZ + 14; bz >= boilerZ - 14; bz -= 3.5) {
            const brassStrap = new THREE.Mesh(new THREE.CylinderGeometry(boilerRadius + 0.025, boilerRadius + 0.025, 0.24, 24), brassBandMat);
            brassStrap.rotation.x = Math.PI / 2;
            brassStrap.position.set(0, 1.48, bz);
            carriageGroup.add(brassStrap);
        }

        // Overhead Catwalk Splash Shield
        const splashShield = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.1, boilerLength + 2), shieldPlateMat);
        splashShield.position.set(0, 2.52, boilerZ);
        carriageGroup.add(splashShield);

        // Elaborate Cast-Iron Firebox & Roaring Furnace Grate (Facing Player at Z = -37)
        const firebox = new THREE.Mesh(new THREE.BoxGeometry(1.68, 1.55, 2.6), darkSteelMat);
        firebox.position.set(0, 0.78, boilerZ + 15.2);
        const fireboxArch = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.09, 10, 20), brassBandMat);
        fireboxArch.position.set(0, 0.78, boilerZ + 16.52);
        const fireGlow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16), fireboxMat);
        fireGlow.position.set(0, 0.78, boilerZ + 16.51);
        fireGlow.userData.isFireCore = true;

        // Iron grate bars across the furnace mouth
        for (let gx = -0.36; gx <= 0.36; gx += 0.18) {
            const grateBar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), darkSteelMat);
            grateBar.position.set(gx, 0.78, boilerZ + 16.54);
            carriageGroup.add(grateBar);
        }

        // Glowing coal bed spill tray in front of firebox
        const emberHearth = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.14, 1.1), emberMat);
        emberHearth.position.set(0, 0.07, boilerZ + 16.9);
        carriageGroup.add(firebox, fireboxArch, fireGlow, emberHearth);

        const fireLight = new THREE.PointLight(0xff4400, 4.2, 20);
        fireLight.position.set(0, 1.1, boilerZ + 17.5);
        fireLight.userData.isFireLight = true;
        carriageGroup.add(fireLight);

        // 5. ANIMATED RECIPROCATING STEAM PISTONS & SPINNING FLYWHEELS
        [-1, 1].forEach((side, idx) => {
            // Steam Cylinder Housing on sides of boiler
            const steamChest = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 2.4, 14), copperPipeMat);
            steamChest.rotation.x = Math.PI / 2;
            steamChest.position.set(side * 0.92, 0.75, boilerZ + 6.0);
            carriageGroup.add(steamChest);

            // Reciprocating Chrome Piston Rod (animated in loop)
            const pistonGroup = new THREE.Group();
            const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 12), chromePistonMat);
            rod.rotation.x = Math.PI / 2;
            const crosshead = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.45), brassBandMat);
            crosshead.position.set(0, 0, -1.2);
            pistonGroup.add(rod, crosshead);
            pistonGroup.position.set(side * 0.92, 0.75, boilerZ + 3.2);
            pistonGroup.userData.isEnginePiston = true;
            pistonGroup.userData.baseZ = boilerZ + 3.2;
            pistonGroup.userData.sidePhase = idx * Math.PI;
            carriageGroup.add(pistonGroup);

            // Spinning Brass Flywheel & Governor Dynamo
            const flywheelGroup = new THREE.Group();
            const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 10, 24), brassBandMat);
            wheelRim.rotation.y = Math.PI / 2;
            const spoke1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.06, 0.08), darkSteelMat);
            const spoke2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 1.06), darkSteelMat);
            flywheelGroup.add(wheelRim, spoke1, spoke2);
            flywheelGroup.position.set(side * 0.92, 1.15, boilerZ - 5.5);
            flywheelGroup.userData.isEngineFlywheel = true;
            flywheelGroup.userData.spinSpeed = 6.5 * side;
            carriageGroup.add(flywheelGroup);

            // Auxiliary Valve Wheels on Boiler Flanks
            for (let vz = boilerZ + 10; vz >= boilerZ - 12; vz -= 7) {
                const valveWheel = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 8, 16), valveRedMat);
                valveWheel.position.set(side * 0.94, 1.65, vz);
                valveWheel.rotation.y = Math.PI / 2;
                carriageGroup.add(valveWheel);
            }
        });

        // Brass Steam Domes & Whistles on Top of Boiler
        [-43, -53, -63].forEach(dz => {
            const steamDome = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.85, 16), brassBandMat);
            steamDome.position.set(0, 2.55, dz);
            const domeCap = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 10), brassBandMat);
            domeCap.position.set(0, 2.95, dz);
            carriageGroup.add(steamDome, domeCap);
        });

        // Illuminated Pressure Gauges on Control Bulkhead
        [-0.65, -0.25, 0.25, 0.65].forEach(gx => {
            const gaugeRim = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.07, 16), brassBandMat);
            gaugeRim.rotation.x = Math.PI / 2;
            gaugeRim.position.set(gx, 1.95, boilerZ + 16.45);
            const gaugeFace = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16), gaugeFaceMat);
            gaugeFace.rotation.x = Math.PI / 2;
            gaugeFace.position.set(gx, 1.95, boilerZ + 16.46);
            carriageGroup.add(gaugeRim, gaugeFace);
        });

        // 6. VOLUMETRIC BILLOWING STEAM CLOUDS & HISSING WALL VENTS
        const engineSteamMat = new THREE.MeshLambertMaterial({
            color: 0xe6f0fa,
            transparent: true,
            opacity: 0.48
        });
        for (let s = 0; s < 42; s++) {
            const steamPuff = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.28 + Math.random() * 0.52, 1),
                engineSteamMat
            );
            const side = Math.random() < 0.5 ? -1 : 1;
            const zSpread = -8 - Math.random() * (len - 14);
            const xSpread = (Math.random() < 0.6)
                ? side * (halfW - 0.35 - Math.random() * 0.45)
                : side * (0.45 + Math.random() * 0.75);
            steamPuff.position.set(
                xSpread,
                0.35 + Math.random() * 2.6,
                zSpread
            );
            steamPuff.userData.isEngineSteam = true;
            steamPuff.userData.bobSpeed = 2.0 + Math.random() * 2.6;
            steamPuff.userData.bobOffset = Math.random() * Math.PI * 2;
            steamPuff.userData.baseY = steamPuff.position.y;
            steamPuff.userData.baseX = steamPuff.position.x;
            steamPuff.userData.driftDir = -side;
            carriageGroup.add(steamPuff);
        }

        engineHitboxes.push(new THREE.Box3(
            new THREE.Vector3(-0.92, 0.5, boilerZ - 14),
            new THREE.Vector3(0.92, 2.35, boilerZ + 14)
        ));

        // 7. Front Locomotive Nose Bulkhead Wall & Armored Exit Hatch Door
        const frontIronWall = new THREE.Mesh(new THREE.BoxGeometry(halfW * 2, 3.7, 0.32), rivetedWallMat);
        frontIronWall.position.set(0, 1.85, -len + 0.4);
        carriageGroup.add(frontIronWall);

        const frontDoorArch = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.05, 0.36), brassBandMat);
        frontDoorArch.position.set(0, 1.52, -len + 0.52);
        const frontExitDoorMat = new THREE.MeshStandardMaterial({
            color: 0xd9480f,
            emissive: 0x5c1900,
            metalness: 0.75,
            roughness: 0.25
        });
        const frontDoor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.8, 0.4), frontExitDoorMat);
        frontDoor.position.set(0, 1.4, -len + 0.6);
        const hatchWheel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.045, 8, 16), brassBandMat);
        hatchWheel.position.set(0, 1.4, -len + 0.85);
        const exitBeaconLight = new THREE.PointLight(0xffaa00, 2.5, 12);
        exitBeaconLight.position.set(0, 2.85, -len + 1.5);
        carriageGroup.add(frontDoorArch, frontDoor, hatchWheel, exitBeaconLight);
        state.redDoorPos = new THREE.Vector3(0, 1.4, -len + 1.2);

        // Engine Room Dynamic Queue: Spawn 2 immediate guards on the walkways + 10 staggered with generous shooting distance
        const enginePool = ["CYAN", "GREEN", "GHOST", "VAMPIRE"];
        spawnNPC(-1.12, -24.0, "CYAN", true);
        spawnNPC(1.12, -37.0, "VAMPIRE", true);
        for (let i = 0; i < 10; i++) {
            const ahead = (i < 7);
            carriageSpawnQueue.push({
                spawnDelay: 2.0 + i * 1.8,
                isAhead: ahead,
                get zPos() {
                    if (this.isAhead || state.playerZ > -20.0) {
                        return Math.max(-state.carriageLength + 10.0, state.playerZ - 22.0 - Math.random() * 8.0);
                    } else {
                        return Math.min(-3.0, state.playerZ + 18.0 + Math.random() * 6.0);
                    }
                },
                xPos: (i % 2 === 0 ? -1 : 1) * 1.12,
                type: enginePool[i % enginePool.length],
                isChokeSwarm: true
            });
        }

        safeSetText("carriage-value", "CARRIAGE 05 / 05 (ENGINE ROOM)");
        safeSetText("objective-label", "Distance To Train Nose Door");
        showNarrativeBanner("ENGINE ROOM: Mind the steam & boiler! Follow the walkways to the Nose Door!");
    }

    safeSetText("chapter-pill", `ACT I: CURSED EXPRESS (COACH 0${state.carriageLevel})`);
    safeSetDisplay("seal-tracker-hud", "none");
    safeSetDisplay("boss-hud", "none");

    state.playerX = 0;
    state.playerZ = -4.0;
    state.playerY = 1.6;
}

// --- BALANCED MOUNTAIN PASS (FLAT TRAIL ZONE PREVENTS ENEMIES FLOATING) ---
function getMountainPassHeight(x, z) {
    const absX = Math.abs(x);
    const trailUndulation = Math.sin(z * 0.05) * 0.35 + Math.cos(x * 0.22 + z * 0.035) * 0.16;
    // Trail width extended to 5.5m so walking path and tree areas are strictly flat ground
    if (absX <= 5.5) {
        return trailUndulation * (absX / 5.5);
    }
    const shoulderDist = absX - 5.5;
    const cragNoise = Math.sin(x * 0.32 + z * 0.1) * Math.cos(z * 0.15 - x * 0.12) * 2.4;
    const ridgeRise = Math.pow(shoulderDist, 1.4) * 0.62;
    return trailUndulation + Math.max(0, ridgeRise + cragNoise);
}

let snowSystem = null;
const SNOW_PARTICLE_COUNT = 2400;

function initSnowSystem(targetGroup) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(SNOW_PARTICLE_COUNT * 3);
    const velocities = new Float32Array(SNOW_PARTICLE_COUNT * 3);

    for (let i = 0; i < SNOW_PARTICLE_COUNT; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 120;
        positions[i * 3 + 1] = Math.random() * 38;
        positions[i * 3 + 2] = 20 - Math.random() * 280;

        velocities[i * 3]     = (Math.random() - 0.5) * 2.4 - 1.4;
        velocities[i * 3 + 1] = -(3.8 + Math.random() * 3.2);
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 2.0;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.userData.velocities = velocities;

    const mat = new THREE.PointsMaterial({
        color: 0xe6f2ff,
        size: 0.24,
        transparent: true,
        opacity: 0.8,
        depthWrite: false
    });

    snowSystem = new THREE.Points(geo, mat);
    targetGroup.add(snowSystem);
}

function updateSnowSystem(dt, playerZ) {
    if (!snowSystem || state.environmentMode !== "MOUNTAIN_PASS") return;
    const posAttr = snowSystem.geometry.attributes.position;
    const positions = posAttr.array;
    const velocities = snowSystem.geometry.userData.velocities;

    for (let i = 0; i < SNOW_PARTICLE_COUNT; i++) {
        const idx = i * 3;
        positions[idx]     += velocities[idx] * dt;
        positions[idx + 1] += velocities[idx + 1] * dt;
        positions[idx + 2] += velocities[idx + 2] * dt;

        if (positions[idx + 1] < -1.0) {
            positions[idx + 1] = 32 + Math.random() * 8;
            positions[idx]     = (Math.random() - 0.5) * 110;
            positions[idx + 2] = playerZ + (Math.random() - 0.5) * 120;
        }
        if (positions[idx] < -60) positions[idx] = 60;
        if (positions[idx] > 60) positions[idx] = -60;
    }
    posAttr.needsUpdate = true;
}

function buildMountainPassTerrain(targetGroup) {
    scene.background = new THREE.Color(0x0d1522);
    // Low fog density (0.0045) so enemy swarms are crystal-clear from tree perches
    scene.fog = new THREE.FogExp2(0x0d1522, 0.0045);
    ambientLight.color.setHex(0x9cb8d8);
    ambientLight.intensity = 0.56;
    dirLight.color.setHex(0xbad4f5);
    dirLight.intensity = 0.72;

    const planeGeo = new THREE.PlaneGeometry(160, 290, 80, 140);
    planeGeo.rotateX(-Math.PI / 2);

    const posAttr = planeGeo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);

    const trailColor = new THREE.Color(0x252d26);
    const rockColor  = new THREE.Color(0x333e4d);
    const snowColor  = new THREE.Color(0xe2ecf7);
    const tempColor  = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i) - 110;
        posAttr.setZ(i, vz);

        const vy = getMountainPassHeight(vx, vz);
        posAttr.setY(i, vy);

        const absX = Math.abs(vx);
        if (absX < 4.2) {
            tempColor.copy(trailColor).lerp(rockColor, (absX / 4.2) * 0.35);
        } else if (vy > 6.2) {
            tempColor.copy(rockColor).lerp(snowColor, Math.min(1, (vy - 6.2) / 8.0));
        } else {
            tempColor.copy(rockColor);
        }
        colors[i * 3]     = tempColor.r;
        colors[i * 3 + 1] = tempColor.g;
        colors[i * 3 + 2] = tempColor.b;
    }

    planeGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    planeGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.9,
        metalness: 0.05,
        flatShading: true
    });

    const terrainMesh = new THREE.Mesh(planeGeo, terrainMat);
    targetGroup.add(terrainMesh);

    const cliffRockMat = new THREE.MeshStandardMaterial({ color: 0x26303d, roughness: 0.88, flatShading: true });
    const snowCapMat = new THREE.MeshStandardMaterial({ color: 0xe0ebf5, roughness: 0.5, flatShading: true });

    for (let z = 16; z >= -250; z -= 6.5) {
        [-1, 1].forEach(side => {
            const cliffHeight = 20 + (Math.abs(Math.sin(z * 0.12 + side)) * 18);
            const cliffRadius = 6.0 + (Math.abs(Math.cos(z * 0.18)) * 3.8);
            const cliffMesh = new THREE.Mesh(new THREE.ConeGeometry(cliffRadius, cliffHeight, 6), cliffRockMat);
            const cliffX = side * (13.5 + Math.abs(Math.sin(z * 0.08)) * 5.0);
            const baseH = getMountainPassHeight(cliffX, z);
            cliffMesh.position.set(cliffX, baseH + cliffHeight * 0.42, z);
            cliffMesh.rotation.y = (z * 0.4) % Math.PI;
            targetGroup.add(cliffMesh);

            const capMesh = new THREE.Mesh(new THREE.ConeGeometry(cliffRadius * 0.55, cliffHeight * 0.36, 6), snowCapMat);
            capMesh.position.set(cliffX, baseH + cliffHeight * 0.76, z);
            capMesh.rotation.y = cliffMesh.rotation.y;
            targetGroup.add(capMesh);

            if (Math.abs(z) % 13 < 6) {
                const boulderScale = 1.2 + (Math.abs(Math.sin(z * 0.28)) * 1.8);
                const outcrop = new THREE.Mesh(new THREE.DodecahedronGeometry(boulderScale, 0), cliffRockMat);
                const bx = side * (6.0 + (Math.abs(Math.cos(z * 0.24)) * 2.2));
                const by = getMountainPassHeight(bx, z);
                outcrop.position.set(bx, by + boulderScale * 0.35, z);
                outcrop.rotation.set(z * 0.2, z * 0.5, 0);
                targetGroup.add(outcrop);
            }
        });
    }

    initSnowSystem(targetGroup);
}

let passLanternLights = [];
let chokeWavesTriggered = [false, false, false, false, false];
let activePerchedTree = null;

// Balanced horde waves (4 to 8 enemies) spawning well ahead of each tree perch with plenty of lead time for the player to climb & shoot
const CHOKE_POINT_CONFIGS = [
    { treeX: -2.3, treeZ: -20.0,  hordeZ: -44.0,  count: 4, pool: ["CYAN", "GREEN", "GHOST"] },
    { treeX:  2.3, treeZ: -64.0,  hordeZ: -90.0,  count: 5, pool: ["CYAN", "GREEN", "GHOST"] },
    { treeX: -2.3, treeZ: -112.0, hordeZ: -138.0, count: 6, pool: ["CYAN", "GREEN", "GHOST"] },
    { treeX:  2.3, treeZ: -160.0, hordeZ: -186.0, count: 7, pool: ["CYAN", "GREEN", "GHOST", "VAMPIRE"] },
    { treeX: -2.3, treeZ: -202.0, hordeZ: -224.0, count: 8, pool: ["CYAN", "GREEN", "GHOST", "VAMPIRE"] }
];

// --- TREEHOUSE PERCH (Clear 360° sniper balcony to shoot swarms below) ---
function buildClimbablePerchTree(x, z, idx, targetGroup) {
    const treeGroup = new THREE.Group();
    const baseY = getMountainPassHeight(x, z);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3b2414, roughness: 0.9 });
    const plankMat = new THREE.MeshStandardMaterial({ map: trainWoodTex, color: 0x7c5032, roughness: 0.8 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.85 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x163622, roughness: 0.85, flatShading: true });
    const snowFoliageMat = new THREE.MeshStandardMaterial({ color: 0xdbe7f2, roughness: 0.5, flatShading: true });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xc29b61, roughness: 0.7 });
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x56d364 });
    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffdd77 });

    // Main Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, 10.5, 8), trunkMat);
    trunk.position.y = 5.25;
    treeGroup.add(trunk);

    // Compact Treehouse Deck (Radius 1.55m) with Open Trail-Side Sniper Balcony so view downwards is 100% unobstructed
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.45, 0.22, 12), plankMat);
    platform.position.y = 2.2;
    treeGroup.add(platform);

    const trailDir = x < 0 ? 1 : -1;
    const sniperLedge = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.18, 1.6), plankMat);
    sniperLedge.position.set(trailDir * 1.15, 2.2, -0.35);
    treeGroup.add(sniperLedge);

    // Back Safety Railing (leaves the front & trail-facing sides open for unobstructed shooting)
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        const px = Math.cos(a);
        const pz = Math.sin(a);
        // Leave trail side and forward (-Z) open for downward aiming
        if ((x < 0 && px > 0.2) || (x > 0 && px < -0.2) || pz < -0.3) continue;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 6), railMat);
        post.position.set(px * 1.42, 2.6, pz * 1.42);
        treeGroup.add(post);
    }

    // Rope Ladder Rungs
    for (let ry = 0.45; ry <= 2.1; ry += 0.4) {
        const rung = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.07, 0.09), ropeMat);
        rung.position.set(trailDir * 0.48, ry, 0.25);
        rung.rotation.y = trailDir * 0.45;
        treeGroup.add(rung);
    }

    // Hanging Floodlight Lantern under the platform to brightly illuminate enemies below!
    const floodBulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), lanternMat);
    floodBulb.position.set(trailDir * 1.4, 1.98, -0.5);
    const perchFloodLight = new THREE.PointLight(0xffdd88, 2.6, 26, 1.4);
    perchFloodLight.position.set(trailDir * 1.7, 2.0, -1.5);
    treeGroup.add(floodBulb, perchFloodLight);

    // Pine Canopy placed HIGH ABOVE (Y >= 8.8m) leaving eye level completely clear
    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(3.2, 4.0, 8), foliageMat);
    cone1.position.y = 8.8;
    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(2.4, 3.4, 8), foliageMat);
    cone2.position.y = 11.1;
    const snowTop = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.4, 8), snowFoliageMat);
    snowTop.position.y = 13.1;
    treeGroup.add(cone1, cone2, snowTop);

    // Glowing Entry Beacon Ring (Wide 1.6m radius so players easily see where to climb)
    const beaconRing = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.065, 8, 28), beaconMat);
    beaconRing.rotation.x = Math.PI / 2;
    beaconRing.position.y = 0.25;
    treeGroup.add(beaconRing);

    // --- PROTECTIVE PERIMETER FENCE AROUND TREE PERCH ---
    // Keeps swarming enemies trapped outside the fence while the player can freely pass through!
    const fenceRadius = 2.85;
    const numPosts = 16;
    const fencePostMat = new THREE.MeshStandardMaterial({ map: trainWoodTex, color: 0x5a3a22, roughness: 0.88 });
    const fenceRailMat = new THREE.MeshStandardMaterial({ map: trainWoodTex, color: 0x734b2c, roughness: 0.82 });
    const ironSpikeMat = new THREE.MeshStandardMaterial({ color: 0x22272e, metalness: 0.8, roughness: 0.35 });
    const snowCapMat = new THREE.MeshStandardMaterial({ color: 0xe6eff7, roughness: 0.55 });

    for (let i = 0; i < numPosts; i++) {
        const angle = (i / numPosts) * Math.PI * 2;
        const nextAngle = ((i + 1) / numPosts) * Math.PI * 2;
        const px = Math.cos(angle) * fenceRadius;
        const pz = Math.sin(angle) * fenceRadius;
        const nx = Math.cos(nextAngle) * fenceRadius;
        const nz = Math.sin(nextAngle) * fenceRadius;

        // Match terrain elevation difference relative to the tree base
        const groundOffset = getMountainPassHeight(x + px, z + pz) - baseY;

        // Sturdy Timber Fence Post
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.35, 6), fencePostMat);
        post.position.set(px, groundOffset + 0.675, pz);
        treeGroup.add(post);

        // Snow Cap & Iron Finial on each Fence Post
        const postCap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 6), snowCapMat);
        postCap.position.set(px, groundOffset + 1.36, pz);
        const finial = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.18, 6), ironSpikeMat);
        finial.position.set(px, groundOffset + 1.46, pz);
        treeGroup.add(postCap, finial);

        // Horizontal Cross-Rails & Picket Slats between posts
        const midX = (px + nx) * 0.5;
        const midZ = (pz + nz) * 0.5;
        const nextGroundOffset = getMountainPassHeight(x + nx, z + nz) - baseY;
        const midGround = (groundOffset + nextGroundOffset) * 0.5;
        const segLen = Math.hypot(nx - px, nz - pz);
        const segYaw = Math.atan2(nx - px, nz - pz);

        const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.10, segLen + 0.06), fenceRailMat);
        topRail.position.set(midX, midGround + 1.05, midZ);
        topRail.rotation.y = segYaw;

        const botRail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.10, segLen + 0.06), fenceRailMat);
        botRail.position.set(midX, midGround + 0.45, botRail.position.z = midZ);
        botRail.rotation.y = segYaw;
        treeGroup.add(topRail, botRail);

        // Intermediate vertical iron/wood pickets so the fence looks solid against the horde
        for (const t of [0.33, 0.67]) {
            const sx = px + (nx - px) * t;
            const sz = pz + (nz - pz) * t;
            const sGround = groundOffset + (nextGroundOffset - groundOffset) * t;
            const picket = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.18, 0.08), fenceRailMat);
            picket.position.set(sx, sGround + 0.60, sz);
            picket.rotation.y = segYaw;
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 4), ironSpikeMat);
            spike.position.set(sx, sGround + 1.25, sz);
            treeGroup.add(picket, spike);
        }
    }

    // Outer glowing sanctuary ring along the fence perimeter
    const fenceGlowRing = new THREE.Mesh(
        new THREE.TorusGeometry(fenceRadius + 0.08, 0.045, 8, 36),
        new THREE.MeshBasicMaterial({ color: 0x38b6ff })
    );
    fenceGlowRing.rotation.x = Math.PI / 2;
    fenceGlowRing.position.y = 0.18;
    treeGroup.add(fenceGlowRing);

    treeGroup.position.set(x, baseY, z);
    targetGroup.add(treeGroup);

    // Position the player on the trail-side sniper ledge so they never clip inside the tree trunk
    // and have a comfortable, natural downward angle to the trail and approaching horde!
    climbableTrees.push({
        x: x,
        y: baseY,
        z: z,
        fenceRadius: fenceRadius,
        perchX: x + trailDir * 1.25,
        perchY: baseY + 3.45,
        perchZ: z - 0.45,
        index: idx,
        beaconRing: beaconRing
    });
}

function buildTrailDebrisAndLanterns(targetGroup) {
    passLanternLights = [];
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1f242b, metalness: 0.7, roughness: 0.4 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x47311d, roughness: 0.88 });

    for (let z = -8; z >= -230; z -= 16) {
        const side = (Math.abs(z / 16) % 2 === 0) ? -1 : 1;
        const lx = side * 3.4;
        const ly = getMountainPassHeight(lx, z);

        const postGroup = new THREE.Group();
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.5, 6), ironMat);
        post.position.y = 1.25;
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.07, 0.07), ironMat);
        arm.position.set(side * -0.28, 2.42, 0);
        const cage = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), flameMat);
        cage.position.set(side * -0.52, 2.18, 0);

        postGroup.add(post, arm, cage);
        postGroup.position.set(lx, ly, z);
        targetGroup.add(postGroup);

        const pointLight = new THREE.PointLight(0xff9922, 1.35, 15, 1.8);
        pointLight.position.set(lx + side * -0.52, ly + 2.15, z);
        targetGroup.add(pointLight);
        passLanternLights.push({ light: pointLight, baseIntensity: 1.35, phase: z * 0.3 });

        const crate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 0.85), crateMat);
        const cx = -side * (2.8 + Math.random() * 1.1);
        const cy = getMountainPassHeight(cx, z - 4);
        crate.position.set(cx, cy + 0.35, z - 4);
        crate.rotation.set(0.18, z * 0.4, -0.12);
        targetGroup.add(crate);
    }
}

function spawnMountainPassHordeWave(chokeIdx) {
    const cfg = CHOKE_POINT_CONFIGS[chokeIdx];
    if (!cfg) return;

    // Split the wave so enemies charge from both IN FRONT of the tree perch and from BEHIND the player!
    const rearCount = Math.max(2, Math.floor(cfg.count * 0.45));
    const frontCount = cfg.count - rearCount;

    // Front Swarm (charging up the mountain pass from well ahead of the tree, kept clear of the Manor door)
    for (let i = 0; i < frontCount; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const spawnX = -2.2 + col * 2.2 + (Math.random() * 0.4 - 0.2);
        const spawnZ = Math.max(-228.5, cfg.hordeZ - row * 2.8 - Math.random() * 1.5);
        const type = cfg.pool[i % cfg.pool.length];
        spawnNPC(spawnX, spawnZ, type, true);
    }

    // Rear Pursuers (charging down the mountain pass from 24m+ behind the player & tree)
    const rearBaseZ = Math.min(-1.0, Math.max(state.playerZ + 24.0, cfg.treeZ + 24.0));
    for (let r = 0; r < rearCount; r++) {
        const spawnX = (r % 2 === 0 ? -1.6 : 1.6) + (Math.random() * 0.5 - 0.25);
        const spawnZ = Math.min(-0.8, rearBaseZ + r * 3.2);
        const type = cfg.pool[(frontCount + r) % cfg.pool.length];
        spawnNPC(spawnX, spawnZ, type, true);
    }
}

function buildManorFacadePlaceholder(manorY, manorZ) {
    const manorGroup = new THREE.Group();

    const stoneMat = new THREE.MeshStandardMaterial({ map: stoneWallTex, color: 0x3b424d, roughness: 0.9, metalness: 0.08 });
    const darkStoneMat = new THREE.MeshStandardMaterial({ map: stoneWallTex, color: 0x222730, roughness: 0.92 });
    const darkSlateMat = new THREE.MeshStandardMaterial({ color: 0x11151c, roughness: 0.6, metalness: 0.2 });
    const copperTrimMat = new THREE.MeshStandardMaterial({ color: 0x2d5246, metalness: 0.65, roughness: 0.35 });
    const wroughtIronMat = new THREE.MeshStandardMaterial({ color: 0x16191e, metalness: 0.85, roughness: 0.3 });
    const timberDoorMat = new THREE.MeshStandardMaterial({ map: trainWoodTex, color: 0x241208, roughness: 0.78 });
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xd8d0c1, roughness: 0.55 });
    const bloodRedGlowMat = new THREE.MeshBasicMaterial({ color: 0xff1e00 });
    const eerieAmberGlowMat = new THREE.MeshBasicMaterial({ color: 0xff6a00 });
    const spectralMistMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4, transparent: true, opacity: 0.52 });
    const deadTreeMat = new THREE.MeshStandardMaterial({ color: 0x1c1613, roughness: 0.95, flatShading: true });

    // 1. Massive 3-Story Victorian Haunted Mansion Main Façade (Solid barrier across the end of the pass)
    const mainHall = new THREE.Mesh(new THREE.BoxGeometry(32, 24, 16), stoneMat);
    mainHall.position.set(0, 12, -8);
    manorGroup.add(mainHall);

    // Steep Mansard Roof & Central Second-Empire Clock/Bell Tower (inspired by title.png!)
    const mansardRoof = new THREE.Mesh(new THREE.ConeGeometry(22, 10, 4), darkSlateMat);
    mansardRoof.rotation.y = Math.PI / 4;
    mansardRoof.position.set(0, 29, -8);

    const centralTower = new THREE.Mesh(new THREE.BoxGeometry(7.5, 32, 7.5), darkStoneMat);
    centralTower.position.set(0, 16, -4.5);
    const centralSpire = new THREE.Mesh(new THREE.ConeGeometry(5.8, 12, 4), darkSlateMat);
    centralSpire.rotation.y = Math.PI / 4;
    centralSpire.position.set(0, 38, -4.5);
    manorGroup.add(mansardRoof, centralTower, centralSpire);

    // Glowing Haunted Rose Window in Central Tower
    const roseRim = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.22, 10, 24), wroughtIronMat);
    roseRim.position.set(0, 24.5, -0.65);
    const roseGlass = new THREE.Mesh(new THREE.CircleGeometry(1.55, 24), bloodRedGlowMat);
    roseGlass.position.set(0, 24.5, -0.62);
    manorGroup.add(roseRim, roseGlass);

    // Twin Flanking Gothic Turrets with Wrought-Iron Widow's Walk Cresting & Horned Gargoyles
    [-13.5, 13.5].forEach(sx => {
        const sideTower = new THREE.Mesh(new THREE.BoxGeometry(6.5, 29, 6.5), darkStoneMat);
        sideTower.position.set(sx, 14.5, -6);
        const spireRoof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 13, 4), copperTrimMat);
        spireRoof.rotation.y = Math.PI / 4;
        spireRoof.position.set(sx, 35.5, -6);
        manorGroup.add(sideTower, spireRoof);

        // Winged Gargoyle Perched Overlooking the Entrance
        const gargBody = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 0), darkStoneMat);
        gargBody.position.set(sx * 0.78, 19.5, -1.2);
        const gargEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), bloodRedGlowMat);
        gargEyeL.position.set(sx * 0.78 - 0.2, 19.65, -0.55);
        const gargEyeR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), bloodRedGlowMat);
        gargEyeR.position.set(sx * 0.78 + 0.2, 19.65, -0.55);
        manorGroup.add(gargBody, gargEyeL, gargEyeR);
    });

    // Haunted Mullioned Windows with Boarded Planks & Flickering Blood-Orange Interiors
    for (let wy = 7.5; wy <= 19.5; wy += 5.5) {
        for (let wx = -12; wx <= 12; wx += 6) {
            if (Math.abs(wx) < 3.5 && wy < 14) continue;
            const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.4, 0.45), wroughtIronMat);
            winFrame.position.set(wx, wy, 0.1);
            const winArch = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.45, 12), wroughtIronMat);
            winArch.rotation.x = Math.PI / 2;
            winArch.position.set(wx, wy + 1.7, 0.1);

            const isBloodLit = ((Math.abs(wx) + Math.round(wy)) % 2 === 0);
            const winGlow = new THREE.Mesh(
                new THREE.PlaneGeometry(1.4, 3.1),
                isBloodLit ? bloodRedGlowMat : eerieAmberGlowMat
            );
            winGlow.position.set(wx, wy, 0.34);

            // Crossed wooden boarding planks on haunted windows
            const plank1 = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.22, 0.08), timberDoorMat);
            plank1.position.set(wx, wy - 0.3, 0.38);
            plank1.rotation.z = 0.24;
            const plank2 = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.22, 0.08), timberDoorMat);
            plank2.position.set(wx, wy + 0.45, 0.38);
            plank2.rotation.z = -0.18;

            manorGroup.add(winFrame, winArch, winGlow, plank1, plank2);
        }
    }

    // 2. TERRIFYING GOTHIC CATHEDRAL ENTRANCE PORCH & SKULL ARCHWAY
    // Stepped Stone Stairway leading up to the Grand Porch
    for (let s = 0; s < 4; s++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(9.0 - s * 0.6, 0.28, 3.8 - s * 0.5), darkStoneMat);
        step.position.set(0, 0.14 + s * 0.18, 2.4 - s * 0.45);
        manorGroup.add(step);
    }

    // Fluted Gothic Stone Porch Pillars & Pointed Pediment Gables
    [-3.4, 3.4].forEach(px => {
        const pillarBase = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 1.1), darkStoneMat);
        pillarBase.position.set(px, 0.6, 2.6);
        const pillarShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 5.4, 12), stoneMat);
        pillarShaft.position.set(px, 3.5, 2.6);
        manorGroup.add(pillarBase, pillarShaft);

        // Flaming Hellfire Braziers Flanking the Steps
        const brazierStand = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 1.45, 8), wroughtIronMat);
        brazierStand.position.set(px * 1.18, 0.72, 4.2);
        const brazierFlame = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.95, 8), bloodRedGlowMat);
        brazierFlame.position.set(px * 1.18, 1.75, 4.2);
        const brazierLight = new THREE.PointLight(0xff2a00, 2.6, 16);
        brazierLight.position.set(px * 1.18, 2.2, 4.2);
        manorGroup.add(brazierStand, brazierFlame, brazierLight);
    });

    const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.9, 4.2), darkSlateMat);
    porchRoof.position.set(0, 6.4, 1.6);
    const porchGable = new THREE.Mesh(new THREE.ConeGeometry(5.2, 3.2, 4), copperTrimMat);
    porchGable.rotation.y = Math.PI / 4;
    porchGable.position.set(0, 8.4, 1.6);
    manorGroup.add(porchRoof, porchGable);

    // Massive Recessed Stone Portal Archway
    const outerArch = new THREE.Mesh(new THREE.TorusGeometry(2.65, 0.42, 10, 28, Math.PI), darkStoneMat);
    outerArch.position.set(0, 3.6, 0.55);
    const innerIronArch = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.18, 8, 24, Math.PI), wroughtIronMat);
    innerIronArch.position.set(0, 3.6, 0.72);
    manorGroup.add(outerArch, innerIronArch);

    // Giant Carved Bone Skull Keystone & Crossed Scythes Above the Doorway
    const keystoneSkull = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 12), boneMat);
    keystoneSkull.scale.set(0.9, 1.12, 0.95);
    keystoneSkull.position.set(0, 6.25, 1.15);
    const skullJaw = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.36, 0.45), boneMat);
    skullJaw.position.set(0, 5.75, 1.2);
    [-0.2, 0.2].forEach(ex => {
        const eyeSocket = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), bloodRedGlowMat);
        eyeSocket.position.set(ex, 6.3, 1.62);
        manorGroup.add(eyeSocket);
    });
    manorGroup.add(keystoneSkull, skullJaw);

    // Skull Columns Flanking the Doorway
    [-2.55, 2.55].forEach(sx => {
        for (let sy = 1.0; sy <= 4.6; sy += 0.9) {
            const wallSkull = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), boneMat);
            wallSkull.position.set(sx, sy, 0.85);
            manorGroup.add(wallSkull);
        }
    });

    // Heavy Iron-Studded Double Oak Doors Half-Swung Open Into the Haunted Foyer!
    [-1, 1].forEach(side => {
        const doorPivot = new THREE.Group();
        doorPivot.position.set(side * 2.05, 0, 0.55);
        // Angle doors inward so the player sees the eerie glowing interior beckoning them inside
        doorPivot.rotation.y = side * 0.58;

        const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(2.0, 5.4, 0.28), timberDoorMat);
        doorLeaf.position.set(-side * 1.0, 2.7, 0);
        doorPivot.add(doorLeaf);

        // Iron hinge straps & demon-knocker ring
        for (let hy = 0.8; hy <= 4.6; hy += 1.2) {
            const ironStrap = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.14, 0.32), wroughtIronMat);
            ironStrap.position.set(-side * 1.0, hy, 0);
            doorPivot.add(ironStrap);
        }
        const knockerRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.045, 8, 16), copperTrimMat);
        knockerRing.position.set(-side * 1.55, 2.4, 0.18);
        doorPivot.add(knockerRing);

        manorGroup.add(doorPivot);
    });

    // Swirling Supernatural Vortex & Iron Portcullis Fangs Inside the Open Doorway
    const portalMist = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 5.5), spectralMistMat);
    portalMist.position.set(0, 2.75, 0.35);
    manorGroup.add(portalMist);

    for (let fx = -1.6; fx <= 1.6; fx += 0.4) {
        const ironFang = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.85, 6), wroughtIronMat);
        ironFang.rotation.x = Math.PI;
        ironFang.position.set(fx, 5.1, 0.65);
        manorGroup.add(ironFang);
    }

    const portalLight = new THREE.PointLight(0x00f5d4, 3.2, 22);
    portalLight.position.set(0, 3.4, 2.2);
    manorGroup.add(portalLight);

    // 3. WROUGHT-IRON CEMETERY PERIMETER FENCE, GNARLED DEAD TREES & TOMBSTONES
    [-1, 1].forEach(side => {
        // Wrought-iron spiked fence extending from the mansion walls out to the mountain cliffs
        for (let fz = 1.5; fz <= 5.5; fz += 2.0) {
            for (let fx = 4.6; fx <= 11.6; fx += 0.55) {
                const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.6, 6), wroughtIronMat);
                bar.position.set(side * fx, 1.3, fz);
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.25, 4), wroughtIronMat);
                spike.position.set(side * fx, 2.7, fz);
                manorGroup.add(bar, spike);
            }
        }

        // Gnarled Haunted Dead Tree Framing the Entrance
        const treeGroup = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.55, 5.5, 7), deadTreeMat);
        trunk.position.y = 2.75;
        trunk.rotation.z = side * -0.14;
        treeGroup.add(trunk);
        for (let b = 0; b < 4; b++) {
            const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.2, 3.4, 6), deadTreeMat);
            branch.position.set((b % 2 === 0 ? -1 : 1) * 0.9, 4.2 + b * 0.55, (b - 1.5) * 0.5);
            branch.rotation.z = (b % 2 === 0 ? 0.65 : -0.65);
            branch.rotation.x = (b - 1.5) * 0.35;
            treeGroup.add(branch);
        }
        treeGroup.position.set(side * 6.2, 0, 4.8);
        manorGroup.add(treeGroup);

        // Crooked Stone Tombstones in the Courtyard
        const tomb = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.45, 0.22), stoneMat);
        tomb.position.set(side * 4.8, 0.72, 6.2);
        tomb.rotation.set(0.08, side * -0.25, side * 0.12);
        manorGroup.add(tomb);
    });

    manorGroup.position.set(0, manorY, manorZ);
    carriageGroup.add(manorGroup);
}

function buildMountainPassScene() {
    clearWorldGroups();
    exteriorGroup.visible = false;
    state.environmentMode = "MOUNTAIN_PASS";
    state.playerX = 0.0;
    state.playerZ = -2.0;
    state.basePlayerY = 1.6;
    state.playerY = getMountainPassHeight(0, -2.0) + state.basePlayerY;
    state.isPerched = false;
    state.perchTimer = 0;
    state.perchCooldown = 0;
    activePerchedTree = null;
    chokeWavesTriggered = [false, false, false, false, false];

    // Transition Health Bonus: Restore +2 lives when entering the pass
    if (typeof rewardTransitionLife === "function") {
        rewardTransitionLife(2);
    }

    buildMountainPassTerrain(carriageGroup);
    buildTrailDebrisAndLanterns(carriageGroup);

    CHOKE_POINT_CONFIGS.forEach((cfg, idx) => {
        buildClimbablePerchTree(cfg.treeX, cfg.treeZ, idx, carriageGroup);
    });

    const coatY = getMountainPassHeight(2.2, -65.0);
    const coatMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.48, 1),
        new THREE.MeshStandardMaterial({ color: 0xe3b341, emissive: 0x6e4f0a, roughness: 0.25 })
    );
    coatMesh.position.set(2.2, coatY + 1.1, -65.0);
    carriageGroup.add(coatMesh);
    pickups.push({ mesh: coatMesh, type: "RAINCOAT", collected: false });

    const manorZ = -238.0;
    const manorY = getMountainPassHeight(0, manorZ);
    state.manorDoorPos = new THREE.Vector3(0, manorY, manorZ);
    buildManorFacadePlaceholder(manorY, manorZ);

    safeSetText("carriage-value", "MOUNTAIN PASS");
    safeSetText("chapter-pill", "ACT II: BLIZZARD MOUNTAIN PASS");
    safeSetText("objective-label", "Distance To Manor");
    safeSetDisplay("minimap-container", "none");
    safeSetDisplay("seal-tracker-hud", "none");
    safeSetDisplay("boss-hud", "none");

    showNarrativeBanner("+2 LIVES RESTORED! Cross the Mountain Pass & use the Pine Tree Perches [E] to survive the swarms!");
    sound.setMountainWind(true, 0);

    // Trigger Big Countdown ("3, 2, 1, GO!") before first wave charges
    if (typeof triggerSectionCountdown === "function") {
        triggerSectionCountdown(() => {
            chokeWavesTriggered[0] = true;
            spawnMountainPassHordeWave(0);
        });
    } else {
        chokeWavesTriggered[0] = true;
        spawnMountainPassHordeWave(0);
    }
}

// --- ARTICULATED HORROR ENEMY INSTANTIATION ---
function spawnNPC(x, z, forceType = null, isChokeSwarm = false) {
    const npcGroup = new THREE.Group();
    let zombieType = forceType;
    if (!zombieType) {
        zombieType = Math.random() < 0.5 ? "CYAN" : "GREEN";
    }

    let faceTex = cyanZombieFaceTex;
    let torsoColor = 0x00a8c0;
    let secondaryColor = 0x0a3d46;
    let emissiveColor = 0x004a58;
    let ringColor = 0x38b6ff;
    let eyeGlowHex = 0xff2a2a;
    let robeOpacity = 1.0;

    if (zombieType === "GREEN") {
        faceTex = greenZombieFaceTex;
        torsoColor = 0x2ea043;
        secondaryColor = 0x123819;
        emissiveColor = 0x0f461a;
        ringColor = 0x56d364;
        eyeGlowHex = 0xff3b1e;
    } else if (zombieType === "GHOST") {
        faceTex = ghostFaceTex;
        torsoColor = 0x99d6ea;
        secondaryColor = 0x00f5d4;
        emissiveColor = 0x1d5b6b;
        ringColor = 0xffd166;
        eyeGlowHex = 0x00f5d4;
        robeOpacity = 0.76;
    } else if (zombieType === "VAMPIRE") {
        faceTex = vampireFaceTex;
        torsoColor = 0x1d102b;
        secondaryColor = 0xa80024;
        emissiveColor = 0x3d000e;
        ringColor = 0xf4e285;
        eyeGlowHex = 0xff002b;
    }

    const torsoMat = new THREE.MeshStandardMaterial({
        color: torsoColor,
        emissive: emissiveColor,
        emissiveIntensity: 0.48,
        roughness: 0.52,
        transparent: robeOpacity < 1.0,
        opacity: robeOpacity
    });
    const accentMat = new THREE.MeshStandardMaterial({
        color: secondaryColor,
        emissive: emissiveColor,
        emissiveIntensity: 0.35,
        roughness: 0.6,
        transparent: robeOpacity < 1.0,
        opacity: robeOpacity
    });
    const darkBootMat = new THREE.MeshStandardMaterial({ color: 0x12151a, roughness: 0.82, metalness: 0.2 });
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xdfd8c8, roughness: 0.45 });
    const eyeGlowMat = new THREE.MeshBasicMaterial({ color: eyeGlowHex });

    // Glowing Color-Coded Target Ring at enemy feet (makes enemies easy to spot from Tree Perches & dark corridors!)
    const targetRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.56, 0.04, 8, 28),
        new THREE.MeshBasicMaterial({ color: ringColor })
    );
    targetRing.rotation.x = Math.PI / 2;
    targetRing.position.y = 0.08;
    npcGroup.add(targetRing);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.96, 0.42), torsoMat);
    torso.position.y = 1.02;
    npcGroup.add(torso);

    let leftLeg = null;
    let rightLeg = null;
    let capeMesh = null;
    let ghostTail = null;
    let soulCore = null;

    if (zombieType === "GHOST") {
        // Tattered Wraith Lower Shroud & Floating Ectoplasmic Ribbons
        ghostTail = new THREE.Group();
        const mainShroud = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.98, 10), torsoMat);
        mainShroud.rotation.x = Math.PI;
        mainShroud.position.y = 0.48;
        ghostTail.add(mainShroud);

        for (let r = 0; r < 5; r++) {
            const rAng = (r / 5) * Math.PI * 2;
            const ribbon = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.65, 5), accentMat);
            ribbon.rotation.x = Math.PI;
            ribbon.position.set(Math.cos(rAng) * 0.34, 0.36, Math.sin(rAng) * 0.34);
            ghostTail.add(ribbon);
        }
        npcGroup.add(ghostTail);

        // Glowing Inner Spectral Ribcage & Rotating Soul-Lantern Core
        soulCore = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.26, 1),
            new THREE.MeshBasicMaterial({ color: 0x00f5d4, wireframe: true })
        );
        soulCore.position.set(0, 1.05, 0.06);
        npcGroup.add(soulCore);

        for (let ry = 0.84; ry <= 1.24; ry += 0.14) {
            const ghostRib = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.022, 6, 12, Math.PI), boneMat);
            ghostRib.rotation.x = Math.PI / 2;
            ghostRib.position.set(0, ry, 0.08);
            npcGroup.add(ghostRib);
        }

        const auraRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.52, 0.026, 8, 24),
            new THREE.MeshBasicMaterial({ color: 0x79c0ff })
        );
        auraRing.rotation.x = Math.PI / 2;
        auraRing.position.y = 0.28;
        npcGroup.add(auraRing);
    } else {
        [-0.2, 0.2].forEach((lx, idx) => {
            const legGroup = new THREE.Group();
            legGroup.position.set(lx, 0.55, 0);
            const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.52, 0.26), accentMat);
            thigh.position.y = -0.22;
            const kneeCap = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09, 0), boneMat);
            kneeCap.position.set(0, -0.22, 0.13);
            const boot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.36), darkBootMat);
            boot.position.set(0, -0.46, 0.04);
            legGroup.add(thigh, kneeCap, boot);
            npcGroup.add(legGroup);
            if (idx === 0) leftLeg = legGroup;
            else rightLeg = legGroup;
        });

        if (zombieType === "VAMPIRE") {
            // Aristocratic Crimson Brocade Waistcoat & Gold Blood-Chalice Medallion
            const vest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.84, 0.45), accentMat);
            vest.position.y = 1.02;
            const medallion = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.10, 0),
                new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.92, roughness: 0.18 })
            );
            medallion.position.set(0, 1.25, 0.24);
            const rubyCore = new THREE.Mesh(
                new THREE.SphereGeometry(0.055, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xff002b })
            );
            rubyCore.position.set(0, 1.25, 0.28);

            // Dramatic Flared Nosferatu Bat-Wing Collar
            const highCollar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.48, 0.32, 0.42, 10, 1, true, Math.PI * 0.22, Math.PI * 1.56),
                accentMat
            );
            highCollar.position.set(0, 1.62, -0.06);

            // Spiked Gothic Shoulder Pauldrons
            [-0.44, 0.44].forEach(sx => {
                const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), darkBootMat);
                pauldron.position.set(sx, 1.44, 0);
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 6), boneMat);
                spike.position.set(sx * 1.12, 1.62, 0);
                spike.rotation.z = sx < 0 ? 0.35 : -0.35;
                npcGroup.add(pauldron, spike);
            });

            // Two-Layer Crimson & Obsidian Vampire Cape
            capeMesh = new THREE.Group();
            const outerCape = new THREE.Mesh(new THREE.BoxGeometry(0.94, 1.38, 0.05), torsoMat);
            const innerCrimsonCape = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.34, 0.05), accentMat);
            innerCrimsonCape.position.z = 0.02;
            capeMesh.add(outerCape, innerCrimsonCape);
            capeMesh.position.set(0, 0.88, -0.26);
            capeMesh.rotation.x = 0.16;

            npcGroup.add(vest, medallion, rubyCore, highCollar, capeMesh);
        } else {
            // Frostbite Revenant (CYAN) or Toxic Swamp Ghoul (GREEN)
            const hazardGrowthMat = new THREE.MeshStandardMaterial({
                color: zombieType === "CYAN" ? 0x80ecff : 0x7ee787,
                emissive: zombieType === "CYAN" ? 0x0077aa : 0x1f7a2e,
                emissiveIntensity: 0.75,
                roughness: 0.25
            });

            [-0.42, 0.42].forEach(sx => {
                const pad = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.46), accentMat);
                pad.position.set(sx, 1.42, 0);
                pad.rotation.z = sx < 0 ? 0.18 : -0.18;
                npcGroup.add(pad);

                if (zombieType === "CYAN") {
                    // Jagged Crystalline Ice Spikes erupting from shoulders
                    const iceSpike = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.32, 5), hazardGrowthMat);
                    iceSpike.position.set(sx * 1.05, 1.62, -0.04);
                    iceSpike.rotation.z = sx < 0 ? 0.42 : -0.42;
                    npcGroup.add(iceSpike);
                } else {
                    // Glowing Toxic Bio-Spores on shoulders
                    const spore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), hazardGrowthMat);
                    spore.position.set(sx * 1.04, 1.56, 0.04);
                    npcGroup.add(spore);
                }
            });

            // Exposed Undead Ribcage, Sternum & Dorsal Spine Vertebrae
            const sternum = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.48, 0.46), boneMat);
            sternum.position.set(0, 1.02, 0.02);
            npcGroup.add(sternum);

            for (let ry = 0.80; ry <= 1.24; ry += 0.14) {
                const rib = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.055, 0.46), boneMat);
                rib.position.set(0, ry, 0.02);
                const spineNode = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.14, 5), boneMat);
                spineNode.rotation.x = -Math.PI / 2;
                spineNode.position.set(0, ry, -0.26);
                npcGroup.add(rib, spineNode);
            }
        }
    }

    const headMats = [
        new THREE.MeshBasicMaterial({ map: faceTex }),
        new THREE.MeshBasicMaterial({ map: faceTex }),
        new THREE.MeshStandardMaterial({ color: torsoColor, emissive: emissiveColor, emissiveIntensity: 0.5 }),
        new THREE.MeshStandardMaterial({ color: torsoColor, emissive: emissiveColor, emissiveIntensity: 0.5 }),
        new THREE.MeshBasicMaterial({ map: faceTex }),
        new THREE.MeshBasicMaterial({ map: faceTex })
    ];
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), headMats);
    headMesh.position.y = 1.82;

    const browRidge = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.11, 0.64), accentMat);
    browRidge.position.set(0, 0.22, 0.02);
    headMesh.add(browRidge);

    // 3D Glowing Eye Orbs for an unmistakable scary presence in dark corridors & mist
    [-0.14, 0.14].forEach(ex => {
        const eyeOrb = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), eyeGlowMat);
        eyeOrb.position.set(ex, 0.05, 0.305);
        headMesh.add(eyeOrb);
    });

    if (zombieType === "GHOST") {
        // Peaked Wraith Cowl Hood over the Ghost's skull
        const wraithHood = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.45, 8), torsoMat);
        wraithHood.position.set(0, 0.42, -0.04);
        wraithHood.rotation.x = -0.2;
        headMesh.add(wraithHood);
    }

    npcGroup.add(headMesh);

    const armMat = new THREE.MeshStandardMaterial({
        color: torsoColor,
        emissive: emissiveColor,
        emissiveIntensity: 0.42,
        roughness: 0.72,
        transparent: robeOpacity < 1.0,
        opacity: robeOpacity
    });
    const leftArmGroup = new THREE.Group();
    const rightArmGroup = new THREE.Group();

    [-0.48, 0.48].forEach((ax, idx) => {
        const armContainer = idx === 0 ? leftArmGroup : rightArmGroup;
        armContainer.position.set(ax, 1.36, 0);
        const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.64), armMat);
        upperArm.position.set(0, -0.05, 0.26);
        const clawHand = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), boneMat);
        clawHand.position.set(0, -0.06, 0.6);

        // 3 Razor-Sharp Curved Bone Talons on each hand
        [-0.055, 0, 0.055].forEach(cx => {
            const talon = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.16, 5), boneMat);
            talon.rotation.x = Math.PI * 0.42;
            talon.position.set(cx, -0.08, 0.72);
            armContainer.add(talon);
        });

        armContainer.add(upperArm, clawHand);
        npcGroup.add(armContainer);
    });

    // Clamp spawn height strictly to ground level so enemies NEVER float into trees
    const groundY = (state.environmentMode === "MOUNTAIN_PASS")
        ? Math.min(0.8, getMountainPassHeight(x, z))
        : 0.0;

    npcGroup.position.set(x, groundY, z);
    carriageGroup.add(npcGroup);

    // Balanced speed: calm and manageable for children (3.4 choke speed, 2.6 carriage speed)
    const baseSpeed = isChokeSwarm
        ? (3.4 + Math.random() * 0.4)
        : (2.6 + Math.random() * 0.4);

    npcs.push({
        group: npcGroup,
        headMesh: headMesh,
        torsoMesh: torso,
        leftLeg: leftLeg,
        rightLeg: rightLeg,
        leftArm: leftArmGroup,
        rightArm: rightArmGroup,
        capeMesh: capeMesh,
        ghostTail: ghostTail,
        soulCore: soulCore,
        targetRing: targetRing,
        zombieType: zombieType,
        isChokeSwarm: isChokeSwarm,
        saturated: false,
        wetness: 0,
        requiredWetness: 2,
        hitFlashTimer: 0.0,
        speed: baseSpeed,
        wobblePhase: Math.random() * Math.PI * 2,
        aiState: "PATROL",
        detectionMeter: 0.0,
        visionRange: zombieType === "VAMPIRE" ? 24.0 : 18.0,
        patrolSpeed: zombieType === "VAMPIRE" ? 2.4 : 1.8,
        chaseSpeed: zombieType === "VAMPIRE" ? 4.2 : 3.4,
        waypoints: [new THREE.Vector3(x, 0, z)],
        currentWaypointIndex: 0,
        lostTrackingTimer: 0.0
    });
}
