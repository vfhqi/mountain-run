"use strict";

/**
 * ============================================================================
 * MOUNTAIN RUN - MODULE 3: LABYRINTH & RENDER LOOP
 * Hardcore Labyrinth, LoS Patrol AI, Guardian Specter Boss & Render Loop
 * ============================================================================
 */

// DOM Interface Elements
const minimapContainer = getEl("minimap-container");
const minimapCanvas = getEl("minimap-canvas");
const minimapCtx = minimapCanvas ? minimapCanvas.getContext("2d") : null;
const minimapBanner = getEl("minimap-direction-banner");
const minimapTierTagEl = getEl("minimap-tier-tag");
const detectionContainer = getEl("detection-container");
const detectionFill = getEl("detection-fill");
const bossHudEl = getEl("boss-hud");
const bossPhaseEl = getEl("boss-phase");
const bossHealthFillEl = getEl("boss-health-fill");
const bossHintEl = getEl("boss-vulnerability-hint");
const bossWeaponStatusEl = getEl("boss-weapon-status");

// 21x21 Grand Haunted Manor Labyrinth Grid
// 1 = Solid Victorian Wall, 0 = Corridor, 2 = Central Boss Sanctum (rows 8..12, cols 8..12)
// No straight central shortcut! The player starts at Foyer [19,10] and must journey through the
// West Crypt Wing (Seal 1 at [15,2]), East Library Wing (Seal 2 at [15,18]), and North Gallery (Seal 3 at [1,10])
// to unlock the Sanctum Blood-Gate at [7,10] and confront Lord Malakor at [10,10]!
const LABYRINTH_GRID = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // r=0
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1], // r=1 (North Gallery Seal 3 at [1,10])
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1], // r=2
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1], // r=3
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1], // r=4
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1], // r=5
    [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1], // r=6
    [1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1], // r=7 (Sanctum Gate at [7,10])
    [1, 0, 1, 1, 1, 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0, 1, 1, 1, 0, 1], // r=8
    [1, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 1], // r=9
    [1, 1, 1, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 1, 0, 1, 1, 1], // r=10 (Sanctum Center [10,10])
    [1, 0, 0, 0, 1, 0, 0, 1, 2, 2, 2, 2, 2, 1, 0, 0, 1, 0, 0, 0, 1], // r=11
    [1, 0, 1, 1, 1, 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0, 1, 1, 1, 0, 1], // r=12
    [1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1], // r=13 (Solid south Sanctum wall)
    [1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1], // r=14
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], // r=15 (West Seal [15,2], East Seal [15,18])
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1], // r=16
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1], // r=17
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1], // r=18
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // r=19 (Foyer Spawn [19,10])
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  // r=20
];

const MAZE_GRID_SIZE = 21;
const MAZE_CELL_SIZE = 4.2;
const MAZE_CENTER_GRID_INDEX = 10;
const MAZE_ORIGIN_Z = -6.0;

// --- 3 CURSED MANOR SEALS & SANCTUM GATE SYSTEM ---
let manorSeals = [];
let sanctumGateMesh = null;
let sanctumUnlocked = false;
let guideRingMeshes = [];
let bossOrbs = [];

const MANOR_SEAL_CONFIGS = [
    {
        id: 0,
        name: "West Crypt Seal",
        pipId: "seal-pip-0",
        label: "WEST CRYPT",
        r: 15,
        c: 2,
        color: 0x38b6ff,
        guards: [
            { r: 15, c: 3, type: "CYAN" },
            { r: 17, c: 3, type: "GHOST" },
            { r: 13, c: 2, type: "GREEN" }
        ]
    },
    {
        id: 1,
        name: "East Library Seal",
        pipId: "seal-pip-1",
        label: "EAST LIBRARY",
        r: 15,
        c: 18,
        color: 0x56d364,
        guards: [
            { r: 15, c: 17, type: "VAMPIRE" },
            { r: 17, c: 17, type: "GREEN" },
            { r: 13, c: 18, type: "GHOST" }
        ]
    },
    {
        id: 2,
        name: "North Gallery Seal",
        pipId: "seal-pip-2",
        label: "NORTH GALLERY",
        r: 1,
        c: 10,
        color: 0xffd166,
        guards: [
            { r: 1, c: 8,  type: "VAMPIRE" },
            { r: 1, c: 12, type: "GHOST" },
            { r: 3, c: 10, type: "CYAN" },
            { r: 5, c: 10, type: "GREEN" }
        ]
    }
];

function worldToMazeGrid(wx, wz) {
    const c = Math.max(0, Math.min(MAZE_GRID_SIZE - 1, Math.round(wx / MAZE_CELL_SIZE + MAZE_CENTER_GRID_INDEX)));
    const r = Math.max(0, Math.min(MAZE_GRID_SIZE - 1, Math.round((MAZE_ORIGIN_Z - wz) / MAZE_CELL_SIZE)));
    return { r, c };
}

function mazeGridToWorld(r, c) {
    return {
        x: (c - MAZE_CENTER_GRID_INDEX) * MAZE_CELL_SIZE,
        z: MAZE_ORIGIN_Z - (r * MAZE_CELL_SIZE)
    };
}

function getActiveLabyrinthTargetCell() {
    for (let i = 0; i < manorSeals.length; i++) {
        if (!manorSeals[i].purified) {
            return { r: manorSeals[i].r, c: manorSeals[i].c, isSeal: true, seal: manorSeals[i] };
        }
    }
    return { r: 10, c: 10, isSeal: false, seal: null };
}

function computeShortestPathToTarget(startR, startC, goalR = 10, goalC = 10) {
    const queue = [[startR, startC]];
    const visited = Array.from({ length: MAZE_GRID_SIZE }, () => Array(MAZE_GRID_SIZE).fill(false));
    const parent = Array.from({ length: MAZE_GRID_SIZE }, () => Array(MAZE_GRID_SIZE).fill(null));
    visited[startR][startC] = true;

    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    while (queue.length > 0) {
        const [r, c] = queue.shift();
        if (r === goalR && c === goalC) break;

        for (let i = 0; i < dirs.length; i++) {
            const nr = r + dirs[i][0];
            const nc = c + dirs[i][1];
            if (
                nr >= 0 && nr < MAZE_GRID_SIZE &&
                nc >= 0 && nc < MAZE_GRID_SIZE &&
                !visited[nr][nc] &&
                LABYRINTH_GRID[nr][nc] !== 1
            ) {
                // Keep path out of the sealed Sanctum until all 3 Seals are broken
                if (!sanctumUnlocked && nr === 7 && nc === 10 && !(goalR === 10 && goalC === 10)) {
                    continue;
                }
                visited[nr][nc] = true;
                parent[nr][nc] = [r, c];
                queue.push([nr, nc]);
            }
        }
    }

    const path = [];
    let curr = [goalR, goalC];
    if (!visited[goalR][goalC]) return path;

    while (curr) {
        path.push(curr);
        curr = parent[curr[0]][curr[1]];
    }
    path.reverse();
    return path;
}

function computeShortestPathToCentre(startR, startC) {
    const target = getActiveLabyrinthTargetCell();
    return computeShortestPathToTarget(startR, startC, target.r, target.c);
}

function rebuildLabyrinthGuideRings() {
    for (let i = 0; i < guideRingMeshes.length; i++) {
        carriageGroup.remove(guideRingMeshes[i]);
    }
    guideRingMeshes = [];

    if (state.environmentMode !== "LABYRINTH") return;
    const pCell = worldToMazeGrid(state.playerX, state.playerZ);
    const target = getActiveLabyrinthTargetCell();
    const guidePath = computeShortestPathToTarget(pCell.r, pCell.c, target.r, target.c);
    const ringColor = target.isSeal ? target.seal.color : 0xffd166;
    const guideGemMat = new THREE.MeshBasicMaterial({ color: ringColor });

    for (let gp = 0; gp < guidePath.length; gp++) {
        const [gr, gc] = guidePath[gp];
        const gPos = mazeGridToWorld(gr, gc);
        const guideMarker = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.05, 8, 20), guideGemMat);
        guideMarker.rotation.x = Math.PI / 2;
        guideMarker.position.set(gPos.x, 0.04, gPos.z);
        carriageGroup.add(guideMarker);
        guideRingMeshes.push(guideMarker);
    }
}

function updateManorSealHUD() {
    let brokenCount = 0;
    for (let i = 0; i < manorSeals.length; i++) {
        const s = manorSeals[i];
        const pip = getEl(s.pipId);
        if (s.purified) {
            brokenCount++;
            if (pip) {
                pip.classList.add("purified");
                pip.innerHTML = `<span class="seal-gem">✔</span> ${s.label} PURIFIED`;
            }
        } else if (pip) {
            pip.classList.remove("purified");
            pip.innerHTML = `<span class="seal-gem">◆</span> ${s.label}`;
        }
    }
    state.sealsBroken = brokenCount;

    const subEl = getEl("seal-tracker-sub");
    if (brokenCount < manorSeals.length) {
        const nextTarget = getActiveLabyrinthTargetCell();
        if (subEl && nextTarget.seal) {
            subEl.textContent = `Next Objective: Destroy the ${nextTarget.seal.name} (${brokenCount}/3 Broken) — Shoot or Press [E]!`;
        }
        if (minimapTierTagEl) {
            minimapTierTagEl.textContent = `Cursed Seals Broken: ${brokenCount} / 3`;
            minimapTierTagEl.style.color = "#00f5d4";
        }
        safeSetText("objective-label", nextTarget.seal ? nextTarget.seal.name : "Cursed Manor Seal");
    } else {
        if (subEl) {
            subEl.textContent = "ALL 3 SEALS SHATTERED! Enter the Central Sanctum & Defeat Lord Malakor!";
        }
        if (minimapTierTagEl) {
            minimapTierTagEl.textContent = "SANCTUM UNLOCKED: CONFRONT LORD MALAKOR!";
            minimapTierTagEl.style.color = "#ff7b72";
        }
        safeSetText("objective-label", "Lord Malakor (Sanctum)");
    }
}

function purifyManorSeal(seal) {
    if (!seal || seal.purified) return;
    seal.purified = true;
    if (seal.group) seal.group.visible = false;

    sound.playKindnessComplete();
    if (typeof rewardTransitionLife === "function") {
        rewardTransitionLife(1);
    }
    if (typeof showCombatFeedback === "function") {
        showCombatFeedback(`✨ ${seal.label} SEAL SHATTERED! (+1 HEART)`, true, 2200);
    }
    spawnImpactParticles(
        new THREE.Vector3(seal.x, 1.6, seal.z),
        seal.color || 0x00f5d4,
        26,
        1.55
    );

    // Spawn a retaliatory corridor ambush wave nearby so fighting from wing to wing is intense!
    const ambushOffsets = [[-2, 0], [2, 0], [0, -2], [0, 2]];
    const ambushPool = ["GHOST", "VAMPIRE", "CYAN", "GREEN"];
    let spawnedAmbush = 0;
    for (let a = 0; a < ambushOffsets.length && spawnedAmbush < 2; a++) {
        const ar = seal.r + ambushOffsets[a][0];
        const ac = seal.c + ambushOffsets[a][1];
        if (ar > 0 && ar < MAZE_GRID_SIZE - 1 && ac > 0 && ac < MAZE_GRID_SIZE - 1 && LABYRINTH_GRID[ar][ac] === 0) {
            const wPos = mazeGridToWorld(ar, ac);
            const route = buildCorridorPatrolRoute(ar, ac);
            spawnPatrolNPC(wPos.x, wPos.z, ambushPool[(seal.id + a) % ambushPool.length], route);
            const newNpc = npcs[npcs.length - 1];
            if (newNpc) {
                newNpc.detectionMeter = 100.0;
                newNpc.aiState = "CHASE";
            }
            spawnedAmbush++;
        }
    }

    updateManorSealHUD();

    // Check if all 3 Seals are now broken!
    const allBroken = manorSeals.every(s => s.purified);
    if (allBroken && !sanctumUnlocked) {
        sanctumUnlocked = true;
        if (sanctumGateMesh) {
            sanctumGateMesh.visible = false;
        }
        // Remove the Sanctum Gate collision box so the player can enter the Boss Arena!
        for (let b = mazeWallBoxes.length - 1; b >= 0; b--) {
            if (mazeWallBoxes[b].isSanctumGate) {
                mazeWallBoxes.splice(b, 1);
            }
        }
        sound.playBossPhaseShift();
        safeSetDisplay("seal-tracker-hud", "none");
        if (bossHudEl) bossHudEl.style.display = "block";
        syncBossWeaponMatchHUD();
        showNarrativeBanner(
            "SANCTUM UNLOCKED! All 3 Cursed Seals shattered! Follow the Golden Rings into the Central Sanctum to battle Lord Malakor!",
            5200
        );
    } else {
        const nextTarget = getActiveLabyrinthTargetCell();
        showNarrativeBanner(
            `SEAL BROKEN (+1 HEART)! ${manorSeals.filter(s => !s.purified).length} Seal(s) left! Follow the glowing floor trail to the ${nextTarget.seal ? nextTarget.seal.name : "Sanctum"}!`,
            4200
        );
    }

    rebuildLabyrinthGuideRings();
}

function renderLabyrinthMinimap(currentYaw) {
    if (!minimapCtx || state.environmentMode !== "LABYRINTH") return;

    const size = minimapCanvas.width;
    const cellPx = size / MAZE_GRID_SIZE;
    minimapCtx.clearRect(0, 0, size, size);

    for (let r = 0; r < MAZE_GRID_SIZE; r++) {
        for (let c = 0; c < MAZE_GRID_SIZE; c++) {
            const val = LABYRINTH_GRID[r][c];
            if (val === 1) {
                minimapCtx.fillStyle = "#3b232e";
            } else if (val === 2) {
                minimapCtx.fillStyle = sanctumUnlocked ? "rgba(220, 38, 38, 0.82)" : "rgba(88, 28, 135, 0.65)";
            } else {
                minimapCtx.fillStyle = "#100c14";
            }
            minimapCtx.fillRect(c * cellPx, r * cellPx, cellPx, cellPx);
        }
    }

    // Draw locked Sanctum Gate bar at [7,10] if not yet unlocked
    if (!sanctumUnlocked) {
        minimapCtx.fillStyle = "#ff0055";
        minimapCtx.fillRect(10 * cellPx, 7 * cellPx, cellPx, cellPx);
    }

    const playerCell = worldToMazeGrid(state.playerX, state.playerZ);
    const activeTarget = getActiveLabyrinthTargetCell();
    const path = computeShortestPathToTarget(playerCell.r, playerCell.c, activeTarget.r, activeTarget.c);

    if (path.length > 1) {
        minimapCtx.strokeStyle = activeTarget.isSeal ? "rgba(0, 245, 212, 0.95)" : "rgba(255, 209, 102, 0.98)";
        minimapCtx.lineWidth = 3.0;
        minimapCtx.lineCap = "round";
        minimapCtx.lineJoin = "round";
        minimapCtx.beginPath();
        for (let i = 0; i < path.length; i++) {
            const [pr, pc] = path[i];
            const px = (pc + 0.5) * cellPx;
            const py = (pr + 0.5) * cellPx;
            if (i === 0) minimapCtx.moveTo(px, py);
            else minimapCtx.lineTo(px, py);
        }
        minimapCtx.stroke();

        const nextStep = path[Math.min(1, path.length - 1)];
        const targetWorld = mazeGridToWorld(nextStep[0], nextStep[1]);
        const toTargetX = targetWorld.x - state.playerX;
        const toTargetZ = targetWorld.z - state.playerZ;
        const distToNext = Math.hypot(toTargetX, toTargetZ);

        const fwdX = -Math.sin(currentYaw);
        const fwdZ = -Math.cos(currentYaw);
        const rightX = Math.cos(currentYaw);
        const rightZ = -Math.sin(currentYaw);

        if (minimapBanner && distToNext > 0.05) {
            const normX = toTargetX / distToNext;
            const normZ = toTargetZ / distToNext;
            const dotFwd = fwdX * normX + fwdZ * normZ;
            const dotRight = rightX * normX + rightZ * normZ;

            if (dotFwd > 0.65) {
                minimapBanner.textContent = "FOLLOW TRAIL: STRAIGHT AHEAD";
                minimapBanner.style.color = "#00f5d4";
            } else if (dotFwd < -0.55) {
                minimapBanner.textContent = "WRONG WAY: 180 TURN [SPACE]";
                minimapBanner.style.color = "#ff7b72";
            } else if (dotRight > 0) {
                minimapBanner.textContent = "TURN RIGHT ->";
                minimapBanner.style.color = "#ffd166";
            } else {
                minimapBanner.textContent = "<- TURN LEFT";
                minimapBanner.style.color = "#ffd166";
            }
        }
    } else if (minimapBanner) {
        minimapBanner.textContent = "BOSS SANCTUM ARENA";
        minimapBanner.style.color = "#ff4d4d";
    }

    // Draw unpurified Manor Seals as bright pulsing diamonds on the radar
    for (let s = 0; s < manorSeals.length; s++) {
        const seal = manorSeals[s];
        if (seal.purified) continue;
        const sx = (seal.c + 0.5) * cellPx;
        const sz = (seal.r + 0.5) * cellPx;
        minimapCtx.fillStyle = "#00f5d4";
        minimapCtx.beginPath();
        minimapCtx.arc(sx, sz, 4.2, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.strokeStyle = "#ffffff";
        minimapCtx.lineWidth = 1.5;
        minimapCtx.stroke();
    }

    // Draw Boss icon at [10,10]
    if (guardianBoss.isActive && !guardianBoss.isDefeated) {
        const bx = (10 + 0.5) * cellPx;
        const bz = (10 + 0.5) * cellPx;
        minimapCtx.fillStyle = "#ffd166";
        minimapCtx.beginPath();
        minimapCtx.arc(bx, bz, 4.8, 0, Math.PI * 2);
        minimapCtx.fill();
    }

    for (let i = 0; i < npcs.length; i++) {
        const npc = npcs[i];
        if (npc.saturated) continue;
        const gridPos = worldToMazeGrid(npc.group.position.x, npc.group.position.z);
        const ex = (gridPos.c + 0.5) * cellPx;
        const ez = (gridPos.r + 0.5) * cellPx;
        minimapCtx.fillStyle = npc.zombieType === "GHOST" ? "#79c0ff" : "#da3633";
        minimapCtx.beginPath();
        minimapCtx.arc(ex, ez, 2.6, 0, Math.PI * 2);
        minimapCtx.fill();
    }

    const pGrid = worldToMazeGrid(state.playerX, state.playerZ);
    const px = (pGrid.c + 0.5) * cellPx;
    const py = (pGrid.r + 0.5) * cellPx;
    const dirX = -Math.sin(currentYaw);
    const dirY = -Math.cos(currentYaw);

    minimapCtx.strokeStyle = "#58a6ff";
    minimapCtx.lineWidth = 2.2;
    minimapCtx.beginPath();
    minimapCtx.moveTo(px, py);
    minimapCtx.lineTo(px + dirX * 8, py + dirY * 8);
    minimapCtx.stroke();

    minimapCtx.fillStyle = "#ffffff";
    minimapCtx.beginPath();
    minimapCtx.arc(px, py, 3.4, 0, Math.PI * 2);
    minimapCtx.fill();
}

const CATWALK_HEIGHT = 3.6;
let labyrinthRamps = [];
let labyrinthCatwalkBoxes = [];

function registerLabyrinthRamp(gridR, gridC, direction) {
    const worldPos = mazeGridToWorld(gridR, gridC);
    labyrinthRamps.push({
        r: gridR,
        c: gridC,
        minX: worldPos.x - MAZE_CELL_SIZE / 2,
        maxX: worldPos.x + MAZE_CELL_SIZE / 2,
        minZ: worldPos.z - MAZE_CELL_SIZE / 2,
        maxZ: worldPos.z + MAZE_CELL_SIZE / 2,
        direction: direction
    });
}

function getLabyrinthFloorElevation(x, z) {
    return 0.0;
}

function buildLabyrinthCatwalks(targetGroup) {
    labyrinthRamps = [];
    labyrinthCatwalkBoxes = [];
}

function checkLineOfSight(npcPos, npcQuaternion, targetPos, maxRange = 22.0, fovAngle = Math.PI * 0.48) {
    const origin = npcPos.clone().add(new THREE.Vector3(0, 1.3, 0));
    const target = targetPos.clone().add(new THREE.Vector3(0, 1.3, 0));
    const toTarget = new THREE.Vector3().subVectors(target, origin);
    const distance = toTarget.length();

    if (distance > maxRange) return false;

    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(npcQuaternion).normalize();
    const dirToTarget = toTarget.clone().normalize();
    const angle = forward.angleTo(dirToTarget);
    if (angle > fovAngle / 2) return false;

    const ray = new THREE.Ray(origin, dirToTarget);
    const hitPoint = new THREE.Vector3();

    for (let i = 0; i < mazeWallBoxes.length; i++) {
        const box = mazeWallBoxes[i];
        const bbox = new THREE.Box3(
            new THREE.Vector3(box.minX, 0, box.minZ),
            new THREE.Vector3(box.maxX, 4.8, box.maxZ)
        );
        if (ray.intersectBox(bbox, hitPoint)) {
            if (origin.distanceTo(hitPoint) < distance) {
                return false;
            }
        }
    }

    return true;
}

function buildCorridorPatrolRoute(startR, startC) {
    const waypoints = [mazeGridToWorld(startR, startC)];
    const offsets = [
        [0, 2], [0, -2], [2, 0], [-2, 0],
        [0, 3], [0, -3], [3, 0], [-3, 0]
    ];

    for (let i = 0; i < offsets.length; i++) {
        const nr = startR + offsets[i][0];
        const nc = startC + offsets[i][1];
        if (
            nr >= 1 && nr < MAZE_GRID_SIZE - 1 &&
            nc >= 1 && nc < MAZE_GRID_SIZE - 1 &&
            LABYRINTH_GRID[nr][nc] === 0
        ) {
            waypoints.push(mazeGridToWorld(nr, nc));
            if (waypoints.length >= 3) break;
        }
    }

    return waypoints.map(wp => new THREE.Vector3(wp.x, 0.0, wp.z));
}

function spawnPatrolNPC(x, z, type, patrolWaypoints = []) {
    spawnNPC(x, z, type, false);
    const npc = npcs[npcs.length - 1];
    npc.aiState = "PATROL";
    npc.detectionMeter = 0.0;
    npc.visionRange = (type === "VAMPIRE") ? 21.0 : 17.0;
    npc.patrolSpeed = (type === "VAMPIRE") ? 2.5 : 1.9;
    npc.chaseSpeed = (type === "VAMPIRE") ? 4.5 : 3.8;
    npc.waypoints = patrolWaypoints.length > 0 ? patrolWaypoints : [new THREE.Vector3(x, 0, z)];
    npc.currentWaypointIndex = 0;
    npc.lostTrackingTimer = 0.0;
}

function populateLabyrinthPatrols() {
    const patrolTypes = ["GHOST", "VAMPIRE", "CYAN", "GREEN"];
    let pCounter = 0;
    for (let i = 0; i < openMazeCells.length; i++) {
        const cell = openMazeCells[i];
        // Leave the Foyer (r >= 18, c 8..12) and Central Sanctum (r 7..13, c 7..13) clear of random corridor patrols
        const inFoyer = (cell.r >= 18 && cell.c >= 8 && cell.c <= 12);
        const inSanctum = (cell.r >= 7 && cell.r <= 13 && cell.c >= 7 && cell.c <= 13);
        if (!inFoyer && !inSanctum) {
            if ((cell.r * 7 + cell.c * 13) % 4 === 0) {
                const type = patrolTypes[pCounter % patrolTypes.length];
                pCounter++;
                const route = buildCorridorPatrolRoute(cell.r, cell.c);
                spawnPatrolNPC(cell.x, cell.z, type, route);
            }
        }
    }

    // Spawn dedicated Elite Guards at each of the 3 Cursed Manor Seals
    MANOR_SEAL_CONFIGS.forEach(cfg => {
        cfg.guards.forEach(g => {
            const gWorld = mazeGridToWorld(g.r, g.c);
            const route = buildCorridorPatrolRoute(g.r, g.c);
            spawnPatrolNPC(gWorld.x, gWorld.z, g.type, route);
        });
    });
}

// ============================================================================
// LORD MALAKOR — DREAD ARCH-SPECTER (4-PHASE ELEMENTAL BOSS)
// ============================================================================
const BOSS_PHASE_CONFIG = {
    1: {
        title: "PHASE I / IV: SPECTRAL SHROUD",
        requiredWeapon: "TORCH",
        weaponKeyNum: "3",
        weaponLabel: "SPECIAL TORCH",
        hint: "GOLD SHIELD ACTIVE — EQUIP SPECIAL TORCH [3 / Q] & BLAST HIS CORE!",
        colorHex: 0xffd166,
        cssColor: "#ffd166",
        barGradient: "linear-gradient(90deg, #b45309 0%, #f59e0b 65%, #fef08a 100%)",
        summonTypes: ["GHOST", "GHOST"]
    },
    2: {
        title: "PHASE II / IV: VAMPIRIC BLOOD AEGIS",
        requiredWeapon: "GARLIC",
        weaponKeyNum: "4",
        weaponLabel: "GARLIC SLINGSHOT",
        hint: "BLOOD SHIELD ACTIVE — EQUIP GARLIC SLINGSHOT [4 / Q] TO SHATTER IT!",
        colorHex: 0xf4e285,
        cssColor: "#f4e285",
        barGradient: "linear-gradient(90deg, #991b1b 0%, #e11d48 65%, #fda4af 100%)",
        summonTypes: ["VAMPIRE", "GHOST"]
    },
    3: {
        title: "PHASE III / IV: NECROTIC PLAGUE CLOUD",
        requiredWeapon: "FART",
        weaponKeyNum: "2",
        weaponLabel: "FART GUN",
        hint: "PLAGUE SHIELD ACTIVE — EQUIP FART GUN [2 / Q] TO NEUTRALIZE THE CORE!",
        colorHex: 0x56d364,
        cssColor: "#56d364",
        barGradient: "linear-gradient(90deg, #15803d 0%, #22c55e 65%, #86efac 100%)",
        summonTypes: ["GREEN", "VAMPIRE"]
    },
    4: {
        title: "PHASE IV / IV: HELLFIRE MELTDOWN",
        requiredWeapon: "WATER",
        weaponKeyNum: "1",
        weaponLabel: "WATER GUN",
        hint: "FINAL MELTDOWN — EQUIP WATER GUN [1 / Q] & DOUSE THE INFERNO CORE!",
        colorHex: 0x38b6ff,
        cssColor: "#38b6ff",
        barGradient: "linear-gradient(90deg, #0369a1 0%, #38b6ff 65%, #bae6fd 100%)",
        summonTypes: ["CYAN", "GHOST"]
    }
};

const guardianBoss = {
    group: null,
    headMesh: null,
    coreMesh: null,
    shieldMesh: null,
    targetHalo: null,
    leftArm: null,
    rightArm: null,
    staffLantern: null,
    shockwaveRing: null,
    orbiters: [],
    light: null,
    maxHealth: 600,
    currentHealth: 600,
    phase: 1,
    isActive: false,
    isDefeated: false,
    position: new THREE.Vector3(0, 0, 0),
    homePosition: new THREE.Vector3(0, 0, 0),
    hitRadius: 2.55,
    hitFlashTimer: 0.0,
    shockwaveTimer: 0.0,
    shockwaveInterval: 5.8,
    shockwaveActive: false,
    shockwaveRadius: 0.0,
    shockwaveDamagedPlayer: false,
    orbFireTimer: 0.0,
    orbFireInterval: 3.8,
    arenaRadius: 9.2
};

function syncBossWeaponMatchHUD() {
    if (!bossWeaponStatusEl || !guardianBoss.isActive || guardianBoss.isDefeated) return;
    const cfg = BOSS_PHASE_CONFIG[guardianBoss.phase] || BOSS_PHASE_CONFIG[1];
    if (state.activeWeapon === cfg.requiredWeapon) {
        bossWeaponStatusEl.className = "boss-weapon-match";
        bossWeaponStatusEl.textContent = `✔ ${cfg.weaponLabel} EQUIPPED — FIRE AT LORD MALAKOR'S GLOWING CORE!`;
    } else {
        bossWeaponStatusEl.className = "boss-weapon-mismatch";
        bossWeaponStatusEl.textContent = `⚠ WRONG BLASTER EQUIPPED! PRESS [Q] OR [${cfg.weaponKeyNum}] FOR ${cfg.weaponLabel}!`;
    }
}

function applyBossPhaseVisuals(phaseNum) {
    const cfg = BOSS_PHASE_CONFIG[phaseNum] || BOSS_PHASE_CONFIG[1];
    if (guardianBoss.coreMesh) {
        guardianBoss.coreMesh.material.color.setHex(cfg.colorHex);
        guardianBoss.coreMesh.material.emissive.setHex(cfg.colorHex);
    }
    if (guardianBoss.shieldMesh) {
        guardianBoss.shieldMesh.material.color.setHex(cfg.colorHex);
    }
    if (guardianBoss.targetHalo) {
        guardianBoss.targetHalo.material.color.setHex(cfg.colorHex);
    }
    if (guardianBoss.staffLantern) {
        guardianBoss.staffLantern.material.color.setHex(cfg.colorHex);
    }
    if (guardianBoss.shockwaveRing) {
        guardianBoss.shockwaveRing.material.color.setHex(cfg.colorHex);
    }
    if (guardianBoss.light) {
        guardianBoss.light.color.setHex(cfg.colorHex);
    }
    for (let i = 0; i < guardianBoss.orbiters.length; i++) {
        guardianBoss.orbiters[i].material.color.setHex(cfg.colorHex);
        guardianBoss.orbiters[i].material.emissive.setHex(cfg.colorHex);
    }

    if (bossPhaseEl) {
        bossPhaseEl.textContent = cfg.title;
        bossPhaseEl.style.color = cfg.cssColor;
    }
    if (bossHintEl) {
        bossHintEl.textContent = cfg.hint;
        bossHintEl.style.color = cfg.cssColor;
    }
    if (bossHealthFillEl) {
        bossHealthFillEl.style.background = cfg.barGradient;
    }
    syncBossWeaponMatchHUD();
}

function spawnGuardianSpecter(arenaX, arenaZ) {
    if (guardianBoss.group) {
        carriageGroup.remove(guardianBoss.group);
    }
    for (let i = 0; i < bossOrbs.length; i++) {
        carriageGroup.remove(bossOrbs[i].mesh);
    }
    bossOrbs = [];

    guardianBoss.group = new THREE.Group();
    guardianBoss.homePosition.set(arenaX, 0.35, arenaZ);
    guardianBoss.position.copy(guardianBoss.homePosition);
    guardianBoss.group.position.copy(guardianBoss.position);

    const darkArmorMat = new THREE.MeshStandardMaterial({ color: 0x160d24, roughness: 0.35, metalness: 0.78 });
    const cloakMat = new THREE.MeshStandardMaterial({
        color: 0x240b36,
        emissive: 0x0c0314,
        roughness: 0.65,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide
    });
    const goldCrownMat = new THREE.MeshStandardMaterial({
        color: 0xffd166,
        emissive: 0x996600,
        emissiveIntensity: 0.5,
        metalness: 0.9,
        roughness: 0.2
    });
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xe2d4f0, roughness: 0.45 });

    // 1. Lower Billowing Necromancer Cloak & Tattered Spectral Ribbons
    const lowerRobe = new THREE.Mesh(new THREE.ConeGeometry(1.45, 2.2, 10, 1, true), cloakMat);
    lowerRobe.position.y = 1.1;
    guardianBoss.group.add(lowerRobe);

    for (let r = 0; r < 6; r++) {
        const ang = (r / 6) * Math.PI * 2;
        const ribbon = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.35, 5), cloakMat);
        ribbon.position.set(Math.cos(ang) * 1.1, 0.45, Math.sin(ang) * 1.1);
        ribbon.rotation.x = Math.PI;
        guardianBoss.group.add(ribbon);
    }

    // 2. Armored Gothic Torso & Skeletal Ribcage Framing the Soul Core
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.72, 1.45, 8), darkArmorMat);
    torso.position.y = 2.05;
    guardianBoss.group.add(torso);

    for (let rib = 0; rib < 4; rib++) {
        const ribArc = new THREE.Mesh(
            new THREE.TorusGeometry(0.78 - rib * 0.05, 0.055, 6, 14, Math.PI * 1.15),
            boneMat
        );
        ribArc.position.set(0, 1.65 + rib * 0.22, 0.12);
        ribArc.rotation.x = Math.PI / 2;
        ribArc.rotation.z = -Math.PI * 0.075;
        guardianBoss.group.add(ribArc);
    }

    // Spiked Dread Pauldrons
    [-1, 1].forEach(side => {
        const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.52, 10, 10), darkArmorMat);
        pauldron.scale.set(1.2, 0.75, 1.0);
        pauldron.position.set(side * 1.15, 2.68, 0);
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.55, 6), goldCrownMat);
        spike.position.set(side * 1.35, 3.02, 0);
        spike.rotation.z = -side * 0.45;
        guardianBoss.group.add(pauldron, spike);
    });

    // 3. Exposed Glowing Elemental Soul Core in Chest (Primary Target!)
    const coreGeo = new THREE.OctahedronGeometry(0.68, 1);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0xffd166,
        emissive: 0xffd166,
        emissiveIntensity: 1.0,
        roughness: 0.15
    });
    guardianBoss.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    guardianBoss.coreMesh.position.set(0, 2.05, 0.45);
    guardianBoss.group.add(guardianBoss.coreMesh);

    // 4. Horned Arch-Specter Skull Head & 5-Spike Golden Dread Crown
    const headSideMat = new THREE.MeshStandardMaterial({ color: 0x240f36, roughness: 0.4 });
    const headFrontMat = new THREE.MeshStandardMaterial({
        map: typeof bossFaceTex !== "undefined" ? bossFaceTex : ghostFaceTex,
        roughness: 0.3,
        emissive: 0x220833,
        emissiveIntensity: 0.35
    });
    const headMats = [headSideMat, headSideMat, headSideMat, headSideMat, headFrontMat, headSideMat];
    guardianBoss.headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.02, 0.92), headMats);
    guardianBoss.headMesh.position.set(0, 3.28, 0.08);
    guardianBoss.group.add(guardianBoss.headMesh);

    // Crown Base & 5 Jagged Crown Spikes + Curved Demon Horns
    const crownBand = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.54, 0.22, 10), goldCrownMat);
    crownBand.position.set(0, 3.85, 0.08);
    guardianBoss.group.add(crownBand);
    for (let cs = 0; cs < 5; cs++) {
        const cAng = (cs / 5) * Math.PI * 2;
        const cSpike = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.42, 5), goldCrownMat);
        cSpike.position.set(Math.cos(cAng) * 0.48, 4.12, 0.08 + Math.sin(cAng) * 0.48);
        guardianBoss.group.add(cSpike);
    }
    [-1, 1].forEach(side => {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.85, 7), boneMat);
        horn.position.set(side * 0.65, 3.85, 0.05);
        horn.rotation.z = -side * 0.55;
        guardianBoss.group.add(horn);
    });

    // 5. Articulated Clawed Arms & Cursed Lantern Staff
    guardianBoss.leftArm = new THREE.Group();
    guardianBoss.leftArm.position.set(-1.25, 2.55, 0);
    const lArmShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 1.25, 8), darkArmorMat);
    lArmShaft.position.y = -0.55;
    lArmShaft.rotation.x = 0.75;
    guardianBoss.leftArm.add(lArmShaft);
    guardianBoss.group.add(guardianBoss.leftArm);

    guardianBoss.rightArm = new THREE.Group();
    guardianBoss.rightArm.position.set(1.25, 2.55, 0);
    const rArmShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 1.25, 8), darkArmorMat);
    rArmShaft.position.y = -0.55;
    rArmShaft.rotation.x = 0.75;
    const staffPole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 3.6, 8), goldCrownMat);
    staffPole.position.set(0, -0.2, 0.68);
    guardianBoss.staffLantern = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.36, 0),
        new THREE.MeshBasicMaterial({ color: 0xffd166 })
    );
    guardianBoss.staffLantern.position.set(0, 1.65, 0.68);
    guardianBoss.rightArm.add(rArmShaft, staffPole, guardianBoss.staffLantern);
    guardianBoss.group.add(guardianBoss.rightArm);

    // 6. Translucent Elemental Aegis Shield & Color-Coded Target Ring
    const shieldGeo = new THREE.IcosahedronGeometry(2.35, 1);
    const shieldMat = new THREE.MeshStandardMaterial({
        color: 0xffd166,
        transparent: true,
        opacity: 0.24,
        wireframe: true
    });
    guardianBoss.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    guardianBoss.shieldMesh.position.y = 2.15;
    guardianBoss.group.add(guardianBoss.shieldMesh);

    const haloGeo = new THREE.TorusGeometry(2.15, 0.08, 8, 36);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    guardianBoss.targetHalo = new THREE.Mesh(haloGeo, haloMat);
    guardianBoss.targetHalo.rotation.x = Math.PI / 2;
    guardianBoss.targetHalo.position.y = 0.12;
    guardianBoss.group.add(guardianBoss.targetHalo);

    // 7. Visible Expanding Ground Shockwave Ring (Starts hidden at floor level)
    const swGeo = new THREE.RingGeometry(0.85, 1.15, 36);
    const swMat = new THREE.MeshBasicMaterial({
        color: 0xffd166,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88
    });
    guardianBoss.shockwaveRing = new THREE.Mesh(swGeo, swMat);
    guardianBoss.shockwaveRing.rotation.x = -Math.PI / 2;
    guardianBoss.shockwaveRing.position.set(arenaX, 0.14, arenaZ);
    guardianBoss.shockwaveRing.visible = false;
    carriageGroup.add(guardianBoss.shockwaveRing);

    // 8. 4 Elemental Orbiting Runes
    guardianBoss.orbiters = [];
    const orbiterGeo = new THREE.OctahedronGeometry(0.30, 0);
    for (let i = 0; i < 4; i++) {
        const orbMat = new THREE.MeshStandardMaterial({
            color: 0xffd166,
            emissive: 0xffa600,
            emissiveIntensity: 0.9
        });
        const orb = new THREE.Mesh(orbiterGeo, orbMat);
        guardianBoss.group.add(orb);
        guardianBoss.orbiters.push(orb);
    }

    guardianBoss.light = new THREE.PointLight(0xffd166, 4.2, 28, 1.5);
    guardianBoss.light.position.set(0, 2.4, 0.8);
    guardianBoss.group.add(guardianBoss.light);

    carriageGroup.add(guardianBoss.group);

    guardianBoss.currentHealth = guardianBoss.maxHealth;
    guardianBoss.phase = 1;
    guardianBoss.isActive = true;
    guardianBoss.isDefeated = false;
    guardianBoss.shockwaveTimer = 0.0;
    guardianBoss.shockwaveActive = false;
    guardianBoss.shockwaveRadius = 0.0;
    guardianBoss.orbFireTimer = 0.0;

    applyBossPhaseVisuals(1);
    updateBossHUD();
    // Keep Boss HUD hidden until the player unlocks the Sanctum or approaches the Sanctum
    if (bossHudEl) bossHudEl.style.display = "none";
}

function damageGuardianSpecter(amount, weaponType) {
    if (!guardianBoss.isActive || guardianBoss.isDefeated) return false;

    const cfg = BOSS_PHASE_CONFIG[guardianBoss.phase] || BOSS_PHASE_CONFIG[1];
    const isValidStrike = (weaponType === cfg.requiredWeapon);

    if (isValidStrike) {
        guardianBoss.currentHealth = Math.max(0, guardianBoss.currentHealth - amount);
        guardianBoss.hitFlashTimer = 0.18;
        sound.playKindnessComplete();
        if (typeof showCombatFeedback === "function") {
            showCombatFeedback(`💥 CRITICAL HIT ON MALAKOR! (${Math.ceil((guardianBoss.currentHealth / guardianBoss.maxHealth) * 100)}% HP)`, true, 950);
        }
        evaluateBossPhaseTransitions();
        updateBossHUD();
        return true;
    } else {
        sound.playDeflect();
        if (typeof showCombatFeedback === "function") {
            showCombatFeedback(`🛡 SHIELD DEFLECTED! PRESS [${cfg.weaponKeyNum}] OR [Q] FOR ${cfg.weaponLabel}!`, false, 1650);
        }
        return false;
    }
}

function spawnBossPhaseReinforcementsAndPickup(phaseCfg) {
    const sanctumSpawns = [
        mazeGridToWorld(8, 8),
        mazeGridToWorld(8, 12),
        mazeGridToWorld(12, 8),
        mazeGridToWorld(12, 12)
    ];
    if (phaseCfg && phaseCfg.summonTypes) {
        for (let i = 0; i < phaseCfg.summonTypes.length; i++) {
            const sp = sanctumSpawns[(guardianBoss.phase + i) % sanctumSpawns.length];
            spawnPatrolNPC(sp.x, sp.z, phaseCfg.summonTypes[i], [new THREE.Vector3(sp.x, 0, sp.z)]);
            const summoned = npcs[npcs.length - 1];
            if (summoned) {
                summoned.detectionMeter = 100.0;
                summoned.aiState = "CHASE";
            }
        }
    }

    // Spawn a helpful Raincoat Shield crystal in the Sanctum on phase transitions!
    const dropPos = mazeGridToWorld(9, 10);
    const shieldCrystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.45, 1),
        new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0x996600, roughness: 0.2 })
    );
    shieldCrystal.position.set(dropPos.x + (Math.random() - 0.5) * 4.0, 1.1, dropPos.z);
    carriageGroup.add(shieldCrystal);
    pickups.push({ mesh: shieldCrystal, type: "RAINCOAT", collected: false });
}

function evaluateBossPhaseTransitions() {
    const healthRatio = guardianBoss.currentHealth / guardianBoss.maxHealth;

    if (guardianBoss.phase === 1 && healthRatio <= 0.75) {
        guardianBoss.phase = 2;
        applyBossPhaseVisuals(2);
        sound.playBossPhaseShift();
        spawnBossPhaseReinforcementsAndPickup(BOSS_PHASE_CONFIG[2]);
        showNarrativeBanner("PHASE 2: VAMPIRIC BLOOD SHIELD! Press [4] or [Q] for GARLIC SLINGSHOT to shatter his barrier!", 4500);
    } else if (guardianBoss.phase === 2 && healthRatio <= 0.50) {
        guardianBoss.phase = 3;
        applyBossPhaseVisuals(3);
        sound.playBossPhaseShift();
        spawnBossPhaseReinforcementsAndPickup(BOSS_PHASE_CONFIG[3]);
        showNarrativeBanner("PHASE 3: NECROTIC PLAGUE CLOUD! Press [2] or [Q] for FART GUN to neutralize his toxic core!", 4500);
    } else if (guardianBoss.phase === 3 && healthRatio <= 0.25) {
        guardianBoss.phase = 4;
        applyBossPhaseVisuals(4);
        sound.playBossPhaseShift();
        spawnBossPhaseReinforcementsAndPickup(BOSS_PHASE_CONFIG[4]);
        showNarrativeBanner("FINAL PHASE: HELLFIRE MELTDOWN! Press [1] or [Q] for WATER GUN and douse Lord Malakor!", 4500);
    } else if (guardianBoss.currentHealth <= 0) {
        guardianBoss.isDefeated = true;
        guardianBoss.isActive = false;
        sound.setBossDrone(false);
        spawnImpactParticles(guardianBoss.group.position.clone().add(new THREE.Vector3(0, 2.0, 0)), 0xffd166, 36, 1.8);
        carriageGroup.remove(guardianBoss.group);
        if (guardianBoss.shockwaveRing) carriageGroup.remove(guardianBoss.shockwaveRing);
        for (let i = 0; i < bossOrbs.length; i++) {
            carriageGroup.remove(bossOrbs[i].mesh);
        }
        bossOrbs = [];
        if (bossHudEl) bossHudEl.style.display = "none";
        endGame(
            true,
            `VICTORY! Lord Malakor is banished & the Midnight Curse is broken! (Monsters Purified: ${state.monstersPurified} | Seals Shattered: 3/3)`
        );
    }
}

function updateBossHUD() {
    if (!bossHealthFillEl) return;
    const percent = (guardianBoss.currentHealth / guardianBoss.maxHealth) * 100;
    bossHealthFillEl.style.width = `${Math.max(0, percent)}%`;
    syncBossWeaponMatchHUD();
}

function updateGuardianSpecter(dt, elapsedSeconds, playerPos) {
    if (!guardianBoss.isActive || guardianBoss.isDefeated || !guardianBoss.group) return;

    const horizDistToPlayer = Math.hypot(
        playerPos.x - guardianBoss.group.position.x,
        playerPos.z - guardianBoss.group.position.z
    );

    // Reveal Boss HUD when Sanctum is unlocked or player approaches within 16m
    if (bossHudEl && (sanctumUnlocked || horizDistToPlayer < 16.0)) {
        bossHudEl.style.display = "block";
    }

    // Smooth hovering & facing the player
    const bobAmplitude = guardianBoss.phase === 4 ? 0.38 : 0.22;
    const bobRate = guardianBoss.phase === 4 ? 3.8 : 2.2;
    guardianBoss.group.position.y = guardianBoss.homePosition.y + Math.sin(elapsedSeconds * bobRate) * bobAmplitude;

    // Prowl around the Sanctum center while keeping a fair fighting distance from the player
    if (horizDistToPlayer < 16.0 && !(typeof isCountdownActive !== "undefined" && isCountdownActive)) {
        const orbitAngle = elapsedSeconds * 0.55;
        const desiredX = guardianBoss.homePosition.x + Math.cos(orbitAngle) * 2.8;
        const desiredZ = guardianBoss.homePosition.z + Math.sin(orbitAngle) * 2.8;
        guardianBoss.group.position.x += (desiredX - guardianBoss.group.position.x) * Math.min(1, 2.0 * dt);
        guardianBoss.group.position.z += (desiredZ - guardianBoss.group.position.z) * Math.min(1, 2.0 * dt);
    }
    guardianBoss.group.lookAt(playerPos.x, guardianBoss.group.position.y, playerPos.z);

    // Hit-flash scale pulse when damaged
    if (guardianBoss.hitFlashTimer > 0) {
        guardianBoss.hitFlashTimer = Math.max(0, guardianBoss.hitFlashTimer - dt);
        const s = 1.0 + Math.sin((guardianBoss.hitFlashTimer / 0.18) * Math.PI) * 0.14;
        guardianBoss.group.scale.set(s, 1.0 / s, s);
    } else {
        guardianBoss.group.scale.set(1, 1, 1);
    }

    // Rotate Soul Core, Shield, Target Halo & Staff Arms
    if (guardianBoss.coreMesh) {
        guardianBoss.coreMesh.rotation.y += dt * 2.6;
        guardianBoss.coreMesh.rotation.x += dt * 1.4;
    }
    if (guardianBoss.shieldMesh) {
        guardianBoss.shieldMesh.rotation.y -= dt * 0.9;
        guardianBoss.shieldMesh.rotation.z += dt * 0.45;
    }
    if (guardianBoss.targetHalo) {
        const haloPulse = 1.0 + Math.sin(elapsedSeconds * 5.0) * 0.08;
        guardianBoss.targetHalo.scale.set(haloPulse, haloPulse, 1);
    }
    if (guardianBoss.leftArm && guardianBoss.rightArm) {
        guardianBoss.leftArm.rotation.x = Math.sin(elapsedSeconds * 2.8) * 0.25;
        guardianBoss.rightArm.rotation.x = -Math.sin(elapsedSeconds * 2.8) * 0.32;
    }

    const orbitRadius = 2.45;
    for (let i = 0; i < guardianBoss.orbiters.length; i++) {
        const angle = elapsedSeconds * 2.4 + (i * (Math.PI / 2));
        guardianBoss.orbiters[i].position.set(
            Math.cos(angle) * orbitRadius,
            1.8 + Math.sin(elapsedSeconds * 3.0 + i) * 0.45,
            Math.sin(angle) * orbitRadius
        );
        guardianBoss.orbiters[i].rotation.y += dt * 3.2;
    }

    // Only execute Boss Attacks when the player is inside or near the Sanctum Arena!
    const playerInSanctum = horizDistToPlayer <= 13.5 && sanctumUnlocked;

    // ATTACK 1: Visible Expanding Ground Shockwave Ring (Player can dodge by stepping back or behind pillars)
    if (playerInSanctum) {
        guardianBoss.shockwaveTimer += dt;
        if (!guardianBoss.shockwaveActive && guardianBoss.shockwaveTimer >= guardianBoss.shockwaveInterval) {
            guardianBoss.shockwaveTimer = 0.0;
            guardianBoss.shockwaveActive = true;
            guardianBoss.shockwaveRadius = 0.8;
            guardianBoss.shockwaveDamagedPlayer = false;
            if (guardianBoss.shockwaveRing) {
                guardianBoss.shockwaveRing.position.set(guardianBoss.group.position.x, 0.16, guardianBoss.group.position.z);
                guardianBoss.shockwaveRing.scale.setScalar(0.8);
                guardianBoss.shockwaveRing.visible = true;
            }
            sound.playBossShockwave();
        }
    }

    if (guardianBoss.shockwaveActive && guardianBoss.shockwaveRing) {
        guardianBoss.shockwaveRadius += 5.4 * dt;
        guardianBoss.shockwaveRing.scale.setScalar(guardianBoss.shockwaveRadius);

        const ringDist = Math.hypot(
            playerPos.x - guardianBoss.shockwaveRing.position.x,
            playerPos.z - guardianBoss.shockwaveRing.position.z
        );
        if (!guardianBoss.shockwaveDamagedPlayer && Math.abs(ringDist - guardianBoss.shockwaveRadius) < 0.65) {
            guardianBoss.shockwaveDamagedPlayer = true;
            triggerDamage();
            showNarrativeBanner("Malakor Floor Shockwave! Keep your distance when the ring expands!", 2400);
        }

        if (guardianBoss.shockwaveRadius >= guardianBoss.arenaRadius) {
            guardianBoss.shockwaveActive = false;
            guardianBoss.shockwaveRing.visible = false;
        }
    }

    // ATTACK 2: Shootable Homing Dark-Energy Orbs
    if (playerInSanctum) {
        guardianBoss.orbFireTimer += dt;
        if (guardianBoss.orbFireTimer >= guardianBoss.orbFireInterval) {
            guardianBoss.orbFireTimer = 0.0;
            const cfg = BOSS_PHASE_CONFIG[guardianBoss.phase] || BOSS_PHASE_CONFIG[1];
            const orbGroup = new THREE.Group();
            const innerOrb = new THREE.Mesh(
                new THREE.SphereGeometry(0.36, 10, 10),
                new THREE.MeshBasicMaterial({ color: 0xff0055 })
            );
            const outerCage = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.48, 0),
                new THREE.MeshBasicMaterial({ color: cfg.colorHex, wireframe: true })
            );
            orbGroup.add(innerOrb, outerCage);
            const spawnOrigin = guardianBoss.group.position.clone().add(new THREE.Vector3(0, 2.1, 0));
            orbGroup.position.copy(spawnOrigin);
            carriageGroup.add(orbGroup);

            const toPlayer = new THREE.Vector3(playerPos.x - spawnOrigin.x, (playerPos.y - 0.2) - spawnOrigin.y, playerPos.z - spawnOrigin.z).normalize();
            bossOrbs.push({
                mesh: orbGroup,
                vel: toPlayer.multiplyScalar(5.4),
                life: 4.5
            });
        }
    }

    // Update active Boss Orbs
    for (let i = bossOrbs.length - 1; i >= 0; i--) {
        const orb = bossOrbs[i];
        orb.life -= dt;
        orb.mesh.position.addScaledVector(orb.vel, dt);
        orb.mesh.rotation.y += 5.0 * dt;
        orb.mesh.rotation.x += 3.5 * dt;

        let removeOrb = orb.life <= 0;
        if (!removeOrb && !canMoveToMazePos(orb.mesh.position.x, orb.mesh.position.z, 0.2)) {
            spawnImpactParticles(orb.mesh.position, 0xff0055, 8, 0.8);
            removeOrb = true;
        }
        if (!removeOrb && orb.mesh.position.distanceTo(playerPos) < 1.05) {
            spawnImpactParticles(orb.mesh.position, 0xff0055, 12, 1.1);
            removeOrb = true;
            triggerDamage();
            if (typeof showCombatFeedback === "function") {
                showCombatFeedback("⚠ HIT BY DARK ORB! SHOOT OR DODGE INCOMING ORBS!", false, 1500);
            }
        }
        if (removeOrb) {
            carriageGroup.remove(orb.mesh);
            bossOrbs.splice(i, 1);
        }
    }
}

let bossParticleGroup = null;
const BOSS_PARTICLE_COUNT = 140;

function initBossParticleAura(targetGroup) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(BOSS_PARTICLE_COUNT * 3);
    const velocities = new Float32Array(BOSS_PARTICLE_COUNT * 3);

    for (let i = 0; i < BOSS_PARTICLE_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.2 + Math.random() * 2.2;
        positions[i * 3]     = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.random() * 3.2;
        positions[i * 3 + 2] = Math.sin(angle) * radius;

        velocities[i * 3]     = (Math.random() - 0.5) * 0.4;
        velocities[i * 3 + 1] = 0.6 + Math.random() * 1.2;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.userData.velocities = velocities;

    const mat = new THREE.PointsMaterial({
        color: 0xffd166,
        size: 0.18,
        transparent: true,
        opacity: 0.75,
        depthWrite: false
    });

    bossParticleGroup = new THREE.Points(geo, mat);
    targetGroup.add(bossParticleGroup);
}

function updateBossParticleAura(dt, elapsedSeconds) {
    if (!bossParticleGroup || !guardianBoss.isActive || guardianBoss.isDefeated) {
        if (bossParticleGroup) bossParticleGroup.visible = false;
        return;
    }
    bossParticleGroup.visible = true;
    bossParticleGroup.position.copy(guardianBoss.group.position);

    const cfg = BOSS_PHASE_CONFIG[guardianBoss.phase] || BOSS_PHASE_CONFIG[1];
    bossParticleGroup.material.color.setHex(cfg.colorHex);

    const posAttr = bossParticleGroup.geometry.attributes.position;
    const pos = posAttr.array;
    const vels = bossParticleGroup.geometry.userData.velocities;

    for (let i = 0; i < BOSS_PARTICLE_COUNT; i++) {
        const idx = i * 3;
        pos[idx]     += vels[idx] * dt;
        pos[idx + 1] += vels[idx + 1] * dt;
        pos[idx + 2] += vels[idx + 2] * dt;

        if (pos[idx + 1] > 3.8) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 1.0 + Math.random() * 2.2;
            pos[idx]     = Math.cos(angle) * radius;
            pos[idx + 1] = 0.1;
            pos[idx + 2] = Math.sin(angle) * radius;
        }
    }
    posAttr.needsUpdate = true;
}

// --- HAUNTED MANOR PORTRAIT TEXTURE GENERATOR ---
let hauntedPortraitTex = null;
function getHauntedPortraitTexture() {
    if (hauntedPortraitTex) return hauntedPortraitTex;
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 320;
    const ctx = c.getContext("2d");

    const grad = ctx.createRadialGradient(128, 120, 15, 128, 160, 170);
    grad.addColorStop(0, "#2c1e38");
    grad.addColorStop(1, "#0d0812");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 320);

    ctx.fillStyle = "#140e1c";
    ctx.beginPath();
    ctx.ellipse(128, 265, 72, 65, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#d8d0c5";
    ctx.beginPath();
    ctx.moveTo(95, 195);
    ctx.lineTo(161, 195);
    ctx.lineTo(145, 232);
    ctx.lineTo(111, 232);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#cfc6b8";
    ctx.beginPath();
    ctx.ellipse(128, 138, 42, 54, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#00f5d4";
    ctx.shadowColor = "#00f5d4";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(112, 132, 5.5, 0, Math.PI * 2);
    ctx.arc(144, 132, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "#3a2832";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(114, 166);
    ctx.quadraticCurveTo(128, 160, 142, 166);
    ctx.stroke();

    hauntedPortraitTex = new THREE.CanvasTexture(c);
    return hauntedPortraitTex;
}

function buildManorSealsAndGate(goldMoldingMat, pillarMat) {
    manorSeals = [];
    sanctumUnlocked = false;
    state.sealsBroken = 0;

    MANOR_SEAL_CONFIGS.forEach(cfg => {
        const wPos = mazeGridToWorld(cfg.r, cfg.c);
        const sealGroup = new THREE.Group();
        sealGroup.position.set(wPos.x, 0, wPos.z);

        // Stepped Gothic Altar Plinth
        const plinth1 = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 0.35, 8), pillarMat);
        plinth1.position.y = 0.175;
        const plinth2 = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 0.9, 8), goldMoldingMat);
        plinth2.position.y = 0.75;
        sealGroup.add(plinth1, plinth2);

        // Glowing Cursed Runic Crystal
        const crystalMat = new THREE.MeshStandardMaterial({
            color: cfg.color,
            emissive: cfg.color,
            emissiveIntensity: 0.95,
            roughness: 0.15
        });
        const crystalMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), crystalMat);
        crystalMesh.position.y = 1.95;
        sealGroup.add(crystalMesh);

        // Orbiting Halo Ring
        const haloRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.92, 0.06, 8, 24),
            new THREE.MeshBasicMaterial({ color: cfg.color })
        );
        haloRing.position.y = 1.95;
        sealGroup.add(haloRing);

        // Floor Beacon Ring
        const floorRing = new THREE.Mesh(
            new THREE.TorusGeometry(1.45, 0.07, 8, 28),
            new THREE.MeshBasicMaterial({ color: cfg.color })
        );
        floorRing.rotation.x = Math.PI / 2;
        floorRing.position.y = 0.06;
        sealGroup.add(floorRing);

        const sealLight = new THREE.PointLight(cfg.color, 2.6, 16.0, 1.5);
        sealLight.position.y = 2.2;
        sealGroup.add(sealLight);

        carriageGroup.add(sealGroup);

        manorSeals.push({
            id: cfg.id,
            name: cfg.name,
            pipId: cfg.pipId,
            label: cfg.label,
            r: cfg.r,
            c: cfg.c,
            x: wPos.x,
            z: wPos.z,
            color: cfg.color,
            group: sealGroup,
            crystalMesh,
            haloRing,
            hp: 3,
            purified: false
        });
    });

    // Build the Sealed Sanctum Blood-Gate at [7, 10]
    const gateWorld = mazeGridToWorld(7, 10);
    sanctumGateMesh = new THREE.Group();
    sanctumGateMesh.position.set(gateWorld.x, 0, gateWorld.z);

    const gateBarMat = new THREE.MeshStandardMaterial({
        color: 0xff0055,
        emissive: 0xb91c1c,
        emissiveIntensity: 0.9,
        metalness: 0.8,
        roughness: 0.2
    });
    const gateFieldMat = new THREE.MeshBasicMaterial({
        color: 0xff0055,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide
    });
    const energyWall = new THREE.Mesh(new THREE.PlaneGeometry(MAZE_CELL_SIZE, 4.8), gateFieldMat);
    energyWall.position.y = 2.4;
    sanctumGateMesh.add(energyWall);

    for (let bx = -1.6; bx <= 1.6; bx += 0.53) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.8, 8), gateBarMat);
        bar.position.set(bx, 2.4, 0);
        sanctumGateMesh.add(bar);
    }
    carriageGroup.add(sanctumGateMesh);

    const halfCell = MAZE_CELL_SIZE / 2;
    mazeWallBoxes.push({
        minX: gateWorld.x - halfCell,
        maxX: gateWorld.x + halfCell,
        minZ: gateWorld.z - 0.45,
        maxZ: gateWorld.z + 0.45,
        mesh: sanctumGateMesh,
        isSanctumGate: true
    });

    updateManorSealHUD();
}

function buildLabyrinthScene() {
    clearWorldGroups();
    exteriorGroup.visible = false;
    sound.setMountainWind(false);
    state.environmentMode = "LABYRINTH";
    state.isPerched = false;

    // Grant bonus health on reaching the Haunted Manor Labyrinth
    if (typeof rewardTransitionLife === "function") {
        rewardTransitionLife(2);
    }

    // Well-lit, atmospheric Gothic Haunted Manor interior (never pitch-black!)
    scene.background = new THREE.Color(0x161020);
    scene.fog = new THREE.FogExp2(0x161020, 0.020);
    ambientLight.color.setHex(0xb8a8dc);
    ambientLight.intensity = 0.88;
    dirLight.color.setHex(0xffdfba);
    dirLight.intensity = 0.65;

    torchSpotLight.color.setHex(0xffea9f);
    torchSpotLight.angle = Math.PI / 4.5;
    torchSpotLight.penumbra = 0.42;
    torchSpotLight.decay = 1.4;
    torchSpotLight.distance = 40.0;

    // Rich Haunted Manor Materials
    const wallpaperMat = new THREE.MeshStandardMaterial({
        map: typeof trainWallpaperTex !== "undefined" ? trainWallpaperTex : stoneWallTex,
        color: 0x8e5a6a,
        roughness: 0.72,
        metalness: 0.08
    });
    const wainscotMat = new THREE.MeshStandardMaterial({
        map: trainWoodTex,
        color: 0x4a2a18,
        roughness: 0.65,
        metalness: 0.08
    });
    const goldMoldingMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.82,
        roughness: 0.28
    });
    const pillarMat = new THREE.MeshStandardMaterial({
        map: trainWoodTex,
        color: 0x361d10,
        roughness: 0.6
    });
    const floorMat = new THREE.MeshStandardMaterial({
        map: trainWoodTex,
        color: 0x5c3a24,
        roughness: 0.75,
        metalness: 0.06
    });
    const ceilingMat = new THREE.MeshStandardMaterial({
        map: typeof trainCeilingTex !== "undefined" ? trainCeilingTex : stoneWallTex,
        color: 0x4a3525,
        roughness: 0.8
    });
    const runnerCarpetMat = new THREE.MeshStandardMaterial({
        map: typeof trainCarpetTex !== "undefined" ? trainCarpetTex : flagstoneFloorTex,
        color: 0x9e1b24,
        roughness: 0.85
    });
    const runnerTrimMat = new THREE.MeshStandardMaterial({
        color: 0xe3b341,
        metalness: 0.75,
        roughness: 0.3
    });
    const stainedGlassMat = new THREE.MeshBasicMaterial({
        map: typeof stainedGlassTex !== "undefined" ? stainedGlassTex : null,
        color: 0xa5d6ff
    });
    const portraitMat = new THREE.MeshBasicMaterial({ map: getHauntedPortraitTexture() });
    const candleFlameMat = new THREE.MeshBasicMaterial({ color: 0xffcc55 });
    const ghostFlameMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
    const armorSteelMat = new THREE.MeshStandardMaterial({ color: 0x8b95a5, metalness: 0.88, roughness: 0.25 });

    const mazeFloorSize = MAZE_GRID_SIZE * MAZE_CELL_SIZE;
    const mazeCenterZ = MAZE_ORIGIN_Z - ((MAZE_GRID_SIZE - 1) * MAZE_CELL_SIZE) / 2;

    // Parquet Hardwood Manor Floor
    const mazeFloor = new THREE.Mesh(new THREE.PlaneGeometry(mazeFloorSize, mazeFloorSize), floorMat);
    mazeFloor.rotation.x = -Math.PI / 2;
    mazeFloor.position.set(0, 0, mazeCenterZ);
    carriageGroup.add(mazeFloor);

    // Coffered Haunted Manor Ceiling (at Y = 5.0m)
    const mazeCeiling = new THREE.Mesh(new THREE.PlaneGeometry(mazeFloorSize, mazeFloorSize), ceilingMat);
    mazeCeiling.rotation.x = Math.PI / 2;
    mazeCeiling.position.set(0, 5.0, mazeCenterZ);
    carriageGroup.add(mazeCeiling);

    const wallHeight = 5.0;
    const halfCell = MAZE_CELL_SIZE / 2;

    for (let r = 0; r < MAZE_GRID_SIZE; r++) {
        for (let c = 0; c < MAZE_GRID_SIZE; c++) {
            const worldPos = mazeGridToWorld(r, c);
            const cellVal = LABYRINTH_GRID[r][c];

            if (cellVal === 1) {
                const wallGroup = new THREE.Group();
                wallGroup.position.set(worldPos.x, 0, worldPos.z);

                const upperWall = new THREE.Mesh(
                    new THREE.BoxGeometry(MAZE_CELL_SIZE, 3.3, MAZE_CELL_SIZE),
                    wallpaperMat
                );
                upperWall.position.y = 3.15;
                wallGroup.add(upperWall);

                const lowerWainscot = new THREE.Mesh(
                    new THREE.BoxGeometry(MAZE_CELL_SIZE + 0.06, 1.5, MAZE_CELL_SIZE + 0.06),
                    wainscotMat
                );
                lowerWainscot.position.y = 0.75;
                wallGroup.add(lowerWainscot);

                const dadoRail = new THREE.Mesh(
                    new THREE.BoxGeometry(MAZE_CELL_SIZE + 0.10, 0.10, MAZE_CELL_SIZE + 0.10),
                    goldMoldingMat
                );
                dadoRail.position.y = 1.52;
                const crownMolding = new THREE.Mesh(
                    new THREE.BoxGeometry(MAZE_CELL_SIZE + 0.12, 0.16, MAZE_CELL_SIZE + 0.12),
                    goldMoldingMat
                );
                crownMolding.position.y = 4.88;
                wallGroup.add(dadoRail, crownMolding);

                [-halfCell + 0.12, halfCell - 0.12].forEach(px => {
                    [-halfCell + 0.12, halfCell - 0.12].forEach(pz => {
                        const pilaster = new THREE.Mesh(
                            new THREE.BoxGeometry(0.28, wallHeight, 0.28),
                            pillarMat
                        );
                        pilaster.position.set(px, wallHeight / 2, pz);
                        wallGroup.add(pilaster);
                    });
                });

                const neighborDirs = [
                    { dr: -1, dc: 0, nx: 0, nz: -1, rotY: 0 },
                    { dr: 1,  dc: 0, nx: 0, nz: 1,  rotY: Math.PI },
                    { dr: 0,  dc: -1, nx: -1, nz: 0, rotY: -Math.PI / 2 },
                    { dr: 0,  dc: 1,  nx: 1,  nz: 0, rotY: Math.PI / 2 }
                ];

                neighborDirs.forEach((nd, sideIdx) => {
                    const nr = r + nd.dr;
                    const nc = c + nd.dc;
                    if (nr >= 0 && nr < MAZE_GRID_SIZE && nc >= 0 && nc < MAZE_GRID_SIZE && LABYRINTH_GRID[nr][nc] !== 1) {
                        const decorHash = (r * 13 + c * 7 + sideIdx) % 5;
                        const faceOffset = halfCell + 0.06;

                        if (decorHash === 0) {
                            const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.9, 0.08), goldMoldingMat);
                            frame.position.set(nd.nx * faceOffset, 2.85, nd.nz * faceOffset);
                            frame.rotation.y = nd.rotY;
                            const canvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 1.68), portraitMat);
                            canvasMesh.position.set(nd.nx * (faceOffset + 0.05), 2.85, nd.nz * (faceOffset + 0.05));
                            canvasMesh.rotation.y = nd.rotY;
                            wallGroup.add(frame, canvasMesh);
                        } else if (decorHash === 1 && (r === 0 || r === MAZE_GRID_SIZE - 1 || c === 0 || c === MAZE_GRID_SIZE - 1)) {
                            const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.4, 0.09), pillarMat);
                            winFrame.position.set(nd.nx * faceOffset, 2.95, nd.nz * faceOffset);
                            winFrame.rotation.y = nd.rotY;
                            const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 2.15), stainedGlassMat);
                            glass.position.set(nd.nx * (faceOffset + 0.055), 2.95, nd.nz * (faceOffset + 0.055));
                            glass.rotation.y = nd.rotY;
                            wallGroup.add(winFrame, glass);
                        } else if (decorHash === 2) {
                            const sconcePlate = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45, 0.08), goldMoldingMat);
                            sconcePlate.position.set(nd.nx * faceOffset, 2.65, nd.nz * faceOffset);
                            sconcePlate.rotation.y = nd.rotY;
                            const flame = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), candleFlameMat);
                            flame.position.set(nd.nx * (faceOffset + 0.18), 2.82, nd.nz * (faceOffset + 0.18));
                            wallGroup.add(sconcePlate, flame);
                        }
                    }
                });

                carriageGroup.add(wallGroup);

                mazeWallBoxes.push({
                    minX: worldPos.x - halfCell,
                    maxX: worldPos.x + halfCell,
                    minZ: worldPos.z - halfCell,
                    maxZ: worldPos.z + halfCell,
                    mesh: wallGroup
                });
            } else {
                openMazeCells.push({ r, c, x: worldPos.x, z: worldPos.z });

                const carpetTile = new THREE.Mesh(
                    new THREE.PlaneGeometry(MAZE_CELL_SIZE * 0.72, MAZE_CELL_SIZE * 0.72),
                    runnerCarpetMat
                );
                carpetTile.rotation.x = -Math.PI / 2;
                carpetTile.position.set(worldPos.x, 0.015, worldPos.z);
                carriageGroup.add(carpetTile);

                const carpetBorder = new THREE.Mesh(
                    new THREE.PlaneGeometry(MAZE_CELL_SIZE * 0.80, MAZE_CELL_SIZE * 0.80),
                    runnerTrimMat
                );
                carpetBorder.rotation.x = -Math.PI / 2;
                carpetBorder.position.set(worldPos.x, 0.008, worldPos.z);
                carriageGroup.add(carpetBorder);

                if ((r + c) % 3 === 0 || cellVal === 2) {
                    const chandGroup = new THREE.Group();
                    chandGroup.position.set(worldPos.x, 4.9, worldPos.z);

                    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), goldMoldingMat);
                    chain.position.y = -0.35;
                    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.05, 8, 16), goldMoldingMat);
                    ring.rotation.x = Math.PI / 2;
                    ring.position.y = -0.7;
                    chandGroup.add(chain, ring);

                    const isSanctuary = (cellVal === 2);
                    const bulbMat = isSanctuary ? ghostFlameMat : candleFlameMat;
                    for (let a = 0; a < 4; a++) {
                        const ang = (a / 4) * Math.PI * 2;
                        const candle = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 8), bulbMat);
                        candle.position.set(Math.cos(ang) * 0.48, -0.62, Math.sin(ang) * 0.48);
                        chandGroup.add(candle);
                    }
                    carriageGroup.add(chandGroup);

                    if ((r % 4 === 1 && c % 4 === 1) || (r === 10 && c === 10) || (r === 19 && c === 10)) {
                        const hallLight = new THREE.PointLight(
                            isSanctuary ? 0x58a6ff : 0xffb86c,
                            isSanctuary ? 2.4 : 1.75,
                            22.0,
                            1.5
                        );
                        hallLight.position.set(worldPos.x, 4.05, worldPos.z);
                        carriageGroup.add(hallLight);
                    }
                }

                if (cellVal === 0 && (r === 19 || r === 5 || r === 13) && (c === 3 || c === 17)) {
                    const armorGroup = new THREE.Group();
                    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.55), pillarMat);
                    plinth.position.y = 0.125;
                    const cuirass = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.20, 0.95, 8), armorSteelMat);
                    cuirass.position.y = 1.15;
                    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 8), armorSteelMat);
                    helm.position.y = 1.82;
                    const halberdPole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.3, 6), pillarMat);
                    halberdPole.position.set(0.26, 1.15, 0.1);
                    armorGroup.add(plinth, cuirass, helm, halberdPole);
                    armorGroup.position.set(worldPos.x + (c < 10 ? -1.45 : 1.45), 0, worldPos.z - 1.45);
                    carriageGroup.add(armorGroup);
                }
            }
        }
    }

    // Seal behind the Foyer entrance (Row 20, Col 10) with Grand Manor Entry Doors
    const foyerWorld = mazeGridToWorld(20, 10);
    const entryDoorWall = new THREE.Mesh(
        new THREE.BoxGeometry(MAZE_CELL_SIZE, wallHeight, 0.6),
        wainscotMat
    );
    entryDoorWall.position.set(foyerWorld.x, wallHeight / 2, foyerWorld.z + halfCell + 0.3);
    carriageGroup.add(entryDoorWall);
    mazeWallBoxes.push({
        minX: foyerWorld.x - halfCell,
        maxX: foyerWorld.x + halfCell,
        minZ: foyerWorld.z + halfCell,
        maxZ: foyerWorld.z + halfCell + 1.0,
        mesh: entryDoorWall
    });

    const startWorld = mazeGridToWorld(19, 10);
    state.playerX = startWorld.x;
    state.playerZ = startWorld.z;
    state.playerY = 1.6;
    state.facingRear = false;
    state.aimYawOffset = 0;
    state.aimPitch = 0;

    // Build the 3 Cursed Manor Seals & Sanctum Blood-Gate
    buildManorSealsAndGate(goldMoldingMat, pillarMat);

    // Place glowing floor guide rings pointing to the first Seal
    rebuildLabyrinthGuideRings();

    const bossCenterWorld = mazeGridToWorld(10, 10);
    state.mazeCenterPos.set(bossCenterWorld.x, 1.8, bossCenterWorld.z);
    spawnGuardianSpecter(bossCenterWorld.x, bossCenterWorld.z);

    buildLabyrinthCatwalks(carriageGroup);
    populateLabyrinthPatrols();
    initBossParticleAura(carriageGroup);
    sound.setBossDrone(true, 0.16);

    safeSetText("carriage-value", "BLACKWOOD MANOR");
    safeSetText("chapter-pill", "ACT III: THE THREE CURSED SEALS");
    safeSetDisplay("minimap-container", "flex");
    safeSetDisplay("seal-tracker-hud", "flex");

    showNarrativeBanner("+2 LIVES RESTORED! Destroy the Three Cursed Seals in the West, East, and North Wings to unlock the Boss Sanctum!");

    if (typeof triggerSectionCountdown === "function") {
        triggerSectionCountdown();
    }
}

function spawnImpactParticles(pos, color, count = 10, speedScale = 1.0) {
    const pGeo = new THREE.SphereGeometry(0.06, 6, 6);
    for (let i = 0; i < count; i++) {
        const pMat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.92
        });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.copy(pos);
        carriageGroup.add(pMesh);

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const spd = (1.6 + Math.random() * 4.2) * speedScale;
        particles.push({
            mesh: pMesh,
            vel: new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * spd,
                Math.abs(Math.cos(phi)) * spd + 1.0,
                Math.sin(phi) * Math.sin(theta) * spd
            ),
            gravity: 7.5,
            life: 0.35 + Math.random() * 0.28,
            maxLife: 0.63,
            scaleRate: -1.2
        });
    }
}

function fireActiveWeapon() {
    const now = performance.now();
    const cooldown = state.activeWeapon === "WATER" ? 95 : 210;
    if (now - state.lastFireTime < cooldown) return;
    state.lastFireTime = now;
    weaponRecoil = Math.min(1.3, weaponRecoil + 0.85);
    weaponRecoilVel = 1.8;

    let dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation).normalize();
    const rightVec = new THREE.Vector3(1, 0, 0).applyEuler(camera.rotation).normalize();
    const spawnPos = camera.position.clone()
        .addScaledVector(dir, 0.72)
        .addScaledVector(rightVec, 0.18);
    spawnPos.y -= 0.14;

    // Smart Aim-Assist when perched in a tree (or gentle assist on ground) so shooting the approaching mob is effortless!
    let bestTarget = null;
    let bestScore = Infinity;
    for (let i = 0; i < npcs.length; i++) {
        const npc = npcs[i];
        if (npc.saturated) continue;
        const aimPoint = new THREE.Vector3(npc.group.position.x, npc.group.position.y + 1.05, npc.group.position.z);
        const toNpc = aimPoint.clone().sub(spawnPos);
        const dist = toNpc.length();
        if (dist < 0.5 || dist > (state.isPerched ? 36.0 : 22.0)) continue;
        const toNpcNorm = toNpc.clone().normalize();
        const dot = dir.dot(toNpcNorm);
        // Wide vertical/horizontal acceptance cone when perched so close mobs below are super easy to hit
        const minDot = state.isPerched ? 0.42 : 0.90;
        if (dot >= minDot) {
            const score = dist * (1.35 - dot);
            if (score < bestScore) {
                bestScore = score;
                bestTarget = toNpcNorm;
            }
        }
    }
    if (bestTarget) {
        const blend = state.isPerched ? 0.85 : 0.35;
        dir.lerp(bestTarget, blend).normalize();
    }

    let color = 0x38b6ff;
    let trailColor = 0x90e0ef;
    let radius = state.isPerched ? 0.19 : 0.13;
    let speed = 28.0;
    let gravity = 0.0;
    let buoyancy = 0.0;
    let spinSpeed = 0.0;

    const projGroup = new THREE.Group();

    if (state.activeWeapon === "WATER") {
        color = 0x38b6ff;
        trailColor = 0x90e0ef;
        radius = state.isPerched ? 0.18 : 0.13;
        speed = 29.0;
        gravity = state.isPerched ? 0.45 : 2.1; // Slight realistic hydro-stream arc

        const dropCore = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 10, 10),
            new THREE.MeshBasicMaterial({ color: 0x90e0ef })
        );
        dropCore.scale.set(0.85, 0.85, 1.85);
        projGroup.add(dropCore);

        const outerSplash = new THREE.Mesh(
            new THREE.TorusGeometry(radius * 0.95, radius * 0.22, 6, 12),
            new THREE.MeshBasicMaterial({ color: 0x00b4d8, transparent: true, opacity: 0.7 })
        );
        projGroup.add(outerSplash);
        spinSpeed = 12.0;
        sound.playSplash();
    } else if (state.activeWeapon === "FART") {
        color = 0x56d364;
        trailColor = 0x80ed99;
        radius = state.isPerched ? 0.30 : 0.24;
        speed = 20.5;
        buoyancy = 0.65; // Swirling buoyant toxic cloud
        spinSpeed = 6.5;

        const coreCloud = new THREE.Mesh(
            new THREE.DodecahedronGeometry(radius, 1),
            new THREE.MeshBasicMaterial({ color: 0x56d364, transparent: true, opacity: 0.82 })
        );
        projGroup.add(coreCloud);

        for (let b = 0; b < 3; b++) {
            const subPuff = new THREE.Mesh(
                new THREE.SphereGeometry(radius * 0.62, 8, 8),
                new THREE.MeshBasicMaterial({ color: b % 2 === 0 ? 0x38b000 : 0x9ef01a, transparent: true, opacity: 0.65 })
            );
            const ang = (b / 3) * Math.PI * 2;
            subPuff.position.set(Math.cos(ang) * radius * 0.55, Math.sin(ang) * radius * 0.55, 0);
            projGroup.add(subPuff);
        }
        sound.playFartWobble();
    } else if (state.activeWeapon === "TORCH") {
        color = 0xffe066;
        trailColor = 0xffb703;
        radius = state.isPerched ? 0.24 : 0.18;
        speed = 36.0;
        gravity = 0.0; // Zero-drop photon solar lance
        spinSpeed = 16.0;

        const photonLance = new THREE.Mesh(
            new THREE.CylinderGeometry(radius * 0.45, radius * 0.85, radius * 4.2, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        photonLance.rotation.x = Math.PI / 2;
        projGroup.add(photonLance);

        const solarHalo = new THREE.Mesh(
            new THREE.OctahedronGeometry(radius * 1.15, 0),
            new THREE.MeshBasicMaterial({ color: 0xffd166, wireframe: true })
        );
        projGroup.add(solarHalo);
        sound.playTorchBeam();
    } else if (state.activeWeapon === "GARLIC") {
        color = 0xf4f1de;
        trailColor = 0xe9c46a;
        radius = state.isPerched ? 0.22 : 0.16;
        speed = 26.5;
        gravity = state.isPerched ? 0.55 : 2.6; // Ballistic slingshot arc
        spinSpeed = 15.0;

        const bulbCore = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 10, 10),
            new THREE.MeshStandardMaterial({ color: 0xf4f1de, roughness: 0.5 })
        );
        bulbCore.scale.set(1.0, 0.85, 1.0);
        projGroup.add(bulbCore);

        for (let c = 0; c < 4; c++) {
            const clove = new THREE.Mesh(
                new THREE.SphereGeometry(radius * 0.55, 6, 6),
                new THREE.MeshBasicMaterial({ color: 0xe9d8a6 })
            );
            const cAng = (c / 4) * Math.PI * 2;
            clove.position.set(Math.cos(cAng) * radius * 0.45, 0, Math.sin(cAng) * radius * 0.45);
            projGroup.add(clove);
        }
        const rootStem = new THREE.Mesh(
            new THREE.ConeGeometry(radius * 0.35, radius * 0.7, 6),
            new THREE.MeshBasicMaterial({ color: 0x6b705c })
        );
        rootStem.position.y = radius * 0.8;
        projGroup.add(rootStem);
        sound.playSlingshotTwang();
    }

    if (typeof triggerWeaponMuzzleFlash === "function") {
        triggerWeaponMuzzleFlash(color);
    }

    projGroup.position.copy(spawnPos);
    projGroup.lookAt(spawnPos.clone().add(dir));
    carriageGroup.add(projGroup);

    projectiles.push({
        mesh: projGroup,
        vel: dir.multiplyScalar(speed),
        weaponType: state.activeWeapon,
        color,
        trailColor,
        gravity,
        buoyancy,
        spinSpeed,
        trailTimer: 0.0,
        life: 2.2
    });
}

function attemptTreePerch() {
    if (state.environmentMode !== "MOUNTAIN_PASS") return false;
    if (state.isPerched) {
        dismountTreePerch();
        return true;
    }
    if (state.perchCooldown > 0) return false;

    for (let i = 0; i < climbableTrees.length; i++) {
        const tree = climbableTrees[i];
        const dist = Math.hypot(state.playerX - tree.x, state.playerZ - tree.z);
        if (dist <= 5.5) {
            state.isPerched = true;
            state.perchTimer = 15.0;
            activePerchedTree = tree;
            state.playerX = (typeof tree.perchX === "number") ? tree.perchX : tree.x;
            state.playerZ = (typeof tree.perchZ === "number") ? tree.perchZ : tree.z;
            state.playerY = tree.perchY;
            state.facingRear = false;
            safeSetText("facing-value", "FORWARD");
            // Automatically angle the camera toward the trail and oncoming horde!
            state.aimYawOffset = (tree.x < 0) ? -0.22 : 0.22;
            state.aimPitch = -0.32;
            sound.playQuickTurn();
            return true;
        }
    }
    return false;
}

function dismountTreePerch() {
    if (!state.isPerched) return;
    state.isPerched = false;
    state.perchTimer = 0;
    state.perchCooldown = 1.2;
    // Brief safety grace when dropping out of the tree so enemies below can never harm the player from the tree
    state.invincibleTimer = Math.max(state.invincibleTimer, 2.0);
    if (activePerchedTree) {
        state.playerX = activePerchedTree.x * 0.35;
        state.playerZ = activePerchedTree.z + 1.2;
    }
    activePerchedTree = null;
    state.aimPitch = 0;
    state.playerY = getMountainPassHeight(state.playerX, state.playerZ) + state.basePlayerY;
    safeSetDisplay("perch-banner", "none");
}

function advanceToNextCarriageOrPass() {
    if (state.carriageLevel < state.maxCarriages) {
        state.carriageLevel++;
        rewardTransitionLife(1);
        buildCarriage();
        try { sound.playQuickTurn(); } catch (e) {}
    } else {
        buildMountainPassScene();
    }
}

function handleInteractKey() {
    if (!state.isRunning || state.isGameOver) return;

    if (state.environmentMode === "TRAIN") {
        const distObj = Math.max(0, state.playerZ - (-state.carriageLength));
        if (state.carriageLevel < state.maxCarriages) {
            if (distObj <= 3.5) {
                advanceToNextCarriageOrPass();
                return;
            }
        } else if (state.redDoorPos) {
            const distExit = Math.hypot(state.playerX - state.redDoorPos.x, state.playerZ - state.redDoorPos.z);
            if (distExit <= 4.0) {
                advanceToNextCarriageOrPass();
                return;
            }
        }
    }

    if (state.environmentMode === "MOUNTAIN_PASS") {
        if (state.manorDoorPos) {
            const distManor = Math.hypot(state.playerX - state.manorDoorPos.x, state.playerZ - state.manorDoorPos.z);
            if (distManor <= 5.0) {
                buildLabyrinthScene();
                return;
            }
        }
        attemptTreePerch();
        return;
    }

    if (state.environmentMode === "LABYRINTH" && typeof manorSeals !== "undefined") {
        for (let i = 0; i < manorSeals.length; i++) {
            const seal = manorSeals[i];
            if (!seal.purified && Math.hypot(state.playerX - seal.worldPos.x, state.playerZ - seal.worldPos.z) <= 3.4) {
                purifyManorSeal(seal);
                return;
            }
        }
    }
}

function updateMountainPassMechanics(dt, elapsedSeconds) {
    if (state.environmentMode !== "MOUNTAIN_PASS") {
        sound.setMountainWind(false);
        return;
    }

    sound.setMountainWind(true, elapsedSeconds);
    updateSnowSystem(dt, state.playerZ);

    for (let i = 0; i < passLanternLights.length; i++) {
        const item = passLanternLights[i];
        item.light.intensity = item.baseIntensity + Math.sin(elapsedSeconds * 7.5 + item.phase) * 0.25;
    }
    for (let i = 0; i < climbableTrees.length; i++) {
        const tree = climbableTrees[i];
        if (tree.beaconRing) {
            const pulse = 1.0 + Math.sin(elapsedSeconds * 4.2 + i) * 0.14;
            tree.beaconRing.scale.set(pulse, pulse, 1);
        }
    }

    for (let idx = 1; idx < CHOKE_POINT_CONFIGS.length; idx++) {
        if (!chokeWavesTriggered[idx] && state.playerZ <= CHOKE_POINT_CONFIGS[idx].treeZ + 11.0) {
            chokeWavesTriggered[idx] = true;
            spawnMountainPassHordeWave(idx);
            showNarrativeBanner("Swarm ahead! Run to the Pine Tree Perch [E] before the mob arrives!");
        }
    }

    const perchBanner = getEl("perch-banner");
    if (state.perchCooldown > 0) {
        state.perchCooldown = Math.max(0, state.perchCooldown - dt);
    }

    if (state.isPerched && activePerchedTree) {
        state.perchTimer -= dt;
        state.playerX = (typeof activePerchedTree.perchX === "number") ? activePerchedTree.perchX : activePerchedTree.x;
        state.playerZ = (typeof activePerchedTree.perchZ === "number") ? activePerchedTree.perchZ : activePerchedTree.z;
        state.playerY = activePerchedTree.perchY;
        if (perchBanner) {
            perchBanner.style.display = "block";
            perchBanner.textContent = `SAFE IN TREE PERCH (${Math.max(0, state.perchTimer).toFixed(1)}s) — Enemies Cannot Harm You! Aim & Shoot Below! [E to Drop]`;
        }

        if (state.perchTimer <= 0) {
            dismountTreePerch();
        }
    } else {
        if (perchBanner) perchBanner.style.display = "none";
        const targetGroundY = getMountainPassHeight(state.playerX, state.playerZ) + state.basePlayerY;
        state.playerY += (targetGroundY - state.playerY) * Math.min(1, 14 * dt);
    }
}

function triggerDamage() {
    if (state.invincibleTimer > 0 || state.isPerched || (typeof isCountdownActive !== "undefined" && isCountdownActive)) return;
    state.lives = Math.max(0, state.lives - 1);
    safeSetText("lives-value", `${state.lives} / ${state.maxLives}`);
    const flash = getEl("damage-flash");
    if (flash) {
        flash.style.opacity = "1";
        setTimeout(() => { flash.style.opacity = "0"; }, 180);
    }
    sound.playSparkHazard();

    if (state.lives <= 0) {
        endGame(false, "Overwhelmed by the horrors of the mountain.");
    }
}

function endGame(victory, message) {
    state.isRunning = false;
    state.isGameOver = true;
    sound.setWaterStream(false);
    sound.setMountainWind(false);
    sound.setBossDrone(false);
    safeSetDisplay("overlay", "flex");
    const statsSuffix = state.monstersPurified > 0 ? ` [Monsters Purified: ${state.monstersPurified}]` : "";
    safeSetText("modal-status", message + statsSuffix);
    const btn = getEl("start-btn");
    if (btn) btn.textContent = victory ? "PLAY AGAIN" : "TRY AGAIN";
}

function selectWeapon(weaponKey, silent = false) {
    if (!WEAPON_META[weaponKey]) return;
    state.activeWeapon = weaponKey;
    const meta = WEAPON_META[state.activeWeapon];
    safeSetText("weapon-value", meta.label);
    safeSetColor("weapon-value", meta.color);
    if (meta.counterText) {
        safeSetText("weapon-counter-hint", meta.counterText);
    }
    const svgEl = getEl("active-weapon-svg");
    if (svgEl && meta.svgPath) {
        svgEl.innerHTML = meta.svgPath;
    }
    const badge = getEl("weapon-icon-badge");
    if (badge) {
        badge.style.borderColor = meta.color;
        badge.style.boxShadow = `inset 0 2px 4px rgba(255,255,255,0.35), 0 0 12px ${meta.color}66`;
    }
    WEAPON_ORDER.forEach(wKey => {
        const slotEl = getEl(`slot-${wKey}`);
        if (slotEl) {
            if (wKey === state.activeWeapon) {
                slotEl.classList.add("active");
            } else {
                slotEl.classList.remove("active");
            }
        }
    });
    syncWeaponViewModelVisibility();
    if (typeof syncBossWeaponMatchHUD === "function") {
        syncBossWeaponMatchHUD();
    }
    if (!silent && typeof showCombatFeedback === "function") {
        showCombatFeedback(`${meta.label} — ${meta.counterText || ""}`, true, 900);
    }
}

function cycleWeapon() {
    const idx = WEAPON_ORDER.indexOf(state.activeWeapon);
    const nextKey = WEAPON_ORDER[(idx + 1) % WEAPON_ORDER.length];
    selectWeapon(nextKey, false);
}

// Allow clicking/tapping individual weapon slots in the HUD bar
WEAPON_ORDER.forEach(wKey => {
    const slotEl = getEl(`slot-${wKey}`);
    if (slotEl) {
        slotEl.addEventListener("mousedown", e => {
            e.stopPropagation();
            selectWeapon(wKey, false);
        });
        slotEl.addEventListener("touchstart", e => {
            e.stopPropagation();
            e.preventDefault();
            selectWeapon(wKey, false);
        }, { passive: false });
    }
});

function toggle180Turn() {
    state.facingRear = !state.facingRear;
    state.aimYawOffset = 0;
    safeSetText("facing-value", state.facingRear ? "REAR (180)" : "FORWARD");
    sound.playQuickTurn();
}

window.addEventListener("keydown", e => {
    if (e.code === "KeyW" || e.code === "ArrowUp") state.moveForward = true;
    if (e.code === "KeyS" || e.code === "ArrowDown") state.moveBackward = true;
    if (e.code === "KeyA" || e.code === "ArrowLeft") state.moveLeft = true;
    if (e.code === "KeyD" || e.code === "ArrowRight") state.moveRight = true;
    if (e.code === "Space") { e.preventDefault(); toggle180Turn(); }
    if (e.code === "KeyQ") cycleWeapon();
    if (e.code === "Digit1") selectWeapon("WATER", false);
    if (e.code === "Digit2") selectWeapon("FART", false);
    if (e.code === "Digit3") selectWeapon("TORCH", false);
    if (e.code === "Digit4") selectWeapon("GARLIC", false);
    if (e.code === "KeyE") handleInteractKey();
});

window.addEventListener("keyup", e => {
    if (e.code === "KeyW" || e.code === "ArrowUp") state.moveForward = false;
    if (e.code === "KeyS" || e.code === "ArrowDown") state.moveBackward = false;
    if (e.code === "KeyA" || e.code === "ArrowLeft") state.moveLeft = false;
    if (e.code === "KeyD" || e.code === "ArrowRight") state.moveRight = false;
});

let isDraggingLook = false;
let lastPointerX = 0;
let lastPointerY = 0;

canvas.addEventListener("mousedown", e => {
    if (!state.isRunning) return;
    if (e.button === 0) state.isFiring = true;
    isDraggingLook = true;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
});

window.addEventListener("mousemove", e => {
    if (!state.isRunning || !isDraggingLook) return;
    const dx = e.clientX - lastPointerX;
    const dy = e.clientY - lastPointerY;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    state.aimYawOffset -= dx * 0.0045;
    const minPitch = state.isPerched ? -1.35 : -0.85;
    state.aimPitch = Math.max(minPitch, Math.min(0.85, state.aimPitch - dy * 0.0045));
});

window.addEventListener("mouseup", () => {
    state.isFiring = false;
    isDraggingLook = false;
});

// Touch-drag look on canvas so mobile/tablet players can aim smoothly too
let touchLookId = null;
canvas.addEventListener("touchstart", e => {
    if (!state.isRunning || e.changedTouches.length === 0) return;
    const t = e.changedTouches[0];
    touchLookId = t.identifier;
    lastPointerX = t.clientX;
    lastPointerY = t.clientY;
}, { passive: true });

canvas.addEventListener("touchmove", e => {
    if (!state.isRunning || touchLookId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchLookId) {
            const dx = t.clientX - lastPointerX;
            const dy = t.clientY - lastPointerY;
            lastPointerX = t.clientX;
            lastPointerY = t.clientY;
            state.aimYawOffset -= dx * 0.005;
            const minPitch = state.isPerched ? -1.35 : -0.85;
            state.aimPitch = Math.max(minPitch, Math.min(0.85, state.aimPitch - dy * 0.005));
            break;
        }
    }
}, { passive: true });

canvas.addEventListener("touchend", e => {
    for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchLookId) {
            touchLookId = null;
            break;
        }
    }
}, { passive: true });

function bindHoldButton(id, onDown, onUp) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = e => { e.preventDefault(); el.classList.add("active"); onDown(); };
    const end = e => { e.preventDefault(); el.classList.remove("active"); if (onUp) onUp(); };
    el.addEventListener("mousedown", start);
    el.addEventListener("mouseup", end);
    el.addEventListener("mouseleave", end);
    el.addEventListener("touchstart", start, { passive: false });
    el.addEventListener("touchend", end, { passive: false });
}

bindHoldButton("btn-up", () => state.moveForward = true, () => state.moveForward = false);
bindHoldButton("btn-down", () => state.moveBackward = true, () => state.moveBackward = false);
bindHoldButton("btn-left", () => state.moveLeft = true, () => state.moveLeft = false);
bindHoldButton("btn-right", () => state.moveRight = true, () => state.moveRight = false);
bindHoldButton("btn-fire", () => state.isFiring = true, () => state.isFiring = false);
bindHoldButton("btn-weapon", () => cycleWeapon());
bindHoldButton("btn-turn", () => toggle180Turn());
bindHoldButton("btn-interact", () => handleInteractKey());

const startBtn = getEl("start-btn");
if (startBtn) {
    startBtn.addEventListener("click", () => {
        sound.init();
        safeSetDisplay("overlay", "none");
        state.lives = state.maxLives;
        state.carriageLevel = 1;
        state.trainWetStrikes = 0;
        state.trainSpeed = 42.0;
        state.monstersPurified = 0;
        state.sealsBroken = 0;
        state.playerX = 0;
        state.playerZ = -4;
        state.playerY = 1.6;
        state.facingRear = false;
        state.aimYawOffset = 0;
        state.aimPitch = 0;
        state.isGameOver = false;
        state.isRunning = true;
        selectWeapon("WATER", true);
        safeSetText("lives-value", `${state.lives} / ${state.maxLives}`);
        buildExteriorScenery();
        buildCarriage();

        // Section Countdown on game start
        if (typeof triggerSectionCountdown === "function") {
            triggerSectionCountdown();
        }
    });
}

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

let lastFrameTime = performance.now();

function canMoveToMazePos(nx, nz, radius = 0.72) {
    // Strictly clamp within outer Haunted Manor perimeter so the player can never leave the building
    const minWorldX = -MAZE_CENTER_GRID_INDEX * MAZE_CELL_SIZE + MAZE_CELL_SIZE * 0.5 + radius;
    const maxWorldX = (MAZE_GRID_SIZE - 1 - MAZE_CENTER_GRID_INDEX) * MAZE_CELL_SIZE - MAZE_CELL_SIZE * 0.5 - radius;
    const maxWorldZ = MAZE_ORIGIN_Z - MAZE_CELL_SIZE * 0.5 - radius;
    const minWorldZ = MAZE_ORIGIN_Z - (MAZE_GRID_SIZE - 1) * MAZE_CELL_SIZE + MAZE_CELL_SIZE * 0.5 + radius;

    if (nx < minWorldX || nx > maxWorldX || nz < minWorldZ || nz > maxWorldZ) {
        return false;
    }

    // Circle-vs-AABB check against every wall block so the player can NEVER pass or clip through walls!
    for (let i = 0; i < mazeWallBoxes.length; i++) {
        const b = mazeWallBoxes[i];
        const closestX = Math.max(b.minX, Math.min(nx, b.maxX));
        const closestZ = Math.max(b.minZ, Math.min(nz, b.maxZ));
        const distX = nx - closestX;
        const distZ = nz - closestZ;
        if ((distX * distX + distZ * distZ) < (radius * radius)) {
            return false;
        }
    }
    return true;
}

let lightningTimer = 0.0;
let lightningFlashDuration = 0.0;

function updateLightningAndThunder(dt, elapsedSeconds) {
    if (state.environmentMode !== "MOUNTAIN_PASS") return;

    lightningTimer -= dt;
    if (lightningTimer <= 0) {
        lightningTimer = 8.0 + Math.random() * 14.0;
        lightningFlashDuration = 0.22;
        dirLight.intensity = 3.8;
        scene.background.setHex(0xcfd9e8);
        sound.playSparkHazard();
    }

    if (lightningFlashDuration > 0) {
        lightningFlashDuration -= dt;
        if (lightningFlashDuration <= 0) {
            dirLight.intensity = 0.72;
            scene.background.setHex(0x0d1522);
        }
    }
}

function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;
    const elapsedSeconds = now * 0.001;

    if (!state.isRunning) {
        renderer.render(scene, camera);
        return;
    }

    const baseYaw = state.facingRear ? Math.PI : 0;
    const currentYaw = baseYaw + state.aimYawOffset;
    camera.rotation.set(state.aimPitch, currentYaw, 0, "YXZ");

    const controlsLocked = typeof isCountdownActive !== "undefined" && isCountdownActive;

    if (state.isPerched && !controlsLocked) {
        // While perched in a treehouse, allow W/S and A/D keys or D-Pad to aim up/down/left/right!
        const pitchInput = (state.moveForward ? 1 : 0) - (state.moveBackward ? 1 : 0);
        const yawInput = (state.moveLeft ? 1 : 0) - (state.moveRight ? 1 : 0);
        if (pitchInput !== 0) {
            state.aimPitch = Math.max(-1.35, Math.min(0.5, state.aimPitch + pitchInput * 1.35 * dt));
        }
        if (yawInput !== 0) {
            state.aimYawOffset += yawInput * 1.65 * dt;
        }
    } else if (!state.isPerched && !controlsLocked) {
        const moveSpeed = 6.2;

        const fwdInput = (state.moveForward ? 1 : 0) - (state.moveBackward ? 1 : 0);
        const strafeInput = (state.moveRight ? 1 : 0) - (state.moveLeft ? 1 : 0);

        if (state.environmentMode === "LABYRINTH") {
            const fwdX = -Math.sin(currentYaw);
            const fwdZ = -Math.cos(currentYaw);
            const rightX = Math.cos(currentYaw);
            const rightZ = -Math.sin(currentYaw);

            const totalDx = (fwdX * fwdInput + rightX * strafeInput) * moveSpeed * dt;
            const totalDz = (fwdZ * fwdInput + rightZ * strafeInput) * moveSpeed * dt;

            // Sub-step movement (4 micro-steps per frame) so the player smoothly slides along walls and can NEVER tunnel through them
            const subSteps = 4;
            const stepDx = totalDx / subSteps;
            const stepDz = totalDz / subSteps;
            for (let s = 0; s < subSteps; s++) {
                if (canMoveToMazePos(state.playerX + stepDx, state.playerZ, 0.72)) {
                    state.playerX += stepDx;
                }
                if (canMoveToMazePos(state.playerX, state.playerZ + stepDz, 0.72)) {
                    state.playerZ += stepDz;
                }
            }
        } else {
            const dirMultiplier = state.facingRear ? 1 : -1;
            const prevX = state.playerX;
            const prevZ = state.playerZ;
            state.playerZ += fwdInput * moveSpeed * dt * dirMultiplier;
            state.playerX += strafeInput * moveSpeed * dt * (state.facingRear ? -1 : 1);

            if (state.environmentMode === "TRAIN") {
                const maxStrafe = (state.carriageLevel === state.maxCarriages) ? 1.48 : state.strafeLimit;
                state.playerX = Math.max(-maxStrafe, Math.min(maxStrafe, state.playerX));

                // In Carriage 5 (Steam Train Engine Room), the central Boiler & Firebox (Z = -35.8 to -68.8, |X| < 1.02) is a SOLID steel obstacle!
                // The player cannot walk through the steam train engine and must use the left/right side catwalk corridors.
                if (state.carriageLevel === state.maxCarriages) {
                    const boilerMinZ = -68.8;
                    const boilerMaxZ = -35.8;
                    const boilerHalfW = 1.02;
                    if (state.playerZ < boilerMaxZ && state.playerZ > boilerMinZ && Math.abs(state.playerX) < boilerHalfW) {
                        if (prevZ >= boilerMaxZ && Math.abs(prevX) < boilerHalfW) {
                            // Approached the front of the furnace head-on: stop against the firebox and nudge toward the nearest side walkway
                            state.playerZ = boilerMaxZ;
                            const sideSign = state.playerX >= 0 ? 1 : -1;
                            state.playerX += sideSign * moveSpeed * 0.65 * dt;
                        } else if (prevZ <= boilerMinZ && Math.abs(prevX) < boilerHalfW) {
                            // Approached the far end of the boiler head-on: stop against the boiler nose
                            state.playerZ = boilerMinZ;
                            const sideSign = state.playerX >= 0 ? 1 : -1;
                            state.playerX += sideSign * moveSpeed * 0.65 * dt;
                        } else {
                            // Already on the left or right walkway: keep player outside the solid boiler cylinder!
                            state.playerX = (prevX >= 0 ? 1 : -1) * boilerHalfW;
                        }
                    }
                }

                // Clamp player strictly inside the carriage corridor
                state.playerZ = Math.max(-state.carriageLength + 1.2, Math.min(-2.0, state.playerZ));

                // Smoothly auto-advance when the player walks right up to the front carriage door!
                if (state.playerZ <= -state.carriageLength + 1.45 && fwdInput * dirMultiplier < 0) {
                    advanceToNextCarriageOrPass();
                    renderer.render(scene, camera);
                    return;
                }
            } else {
                // MOUNTAIN PASS MOVEMENT & SOLID HAUNTED HOUSE EXTERIOR WALL
                state.playerX = Math.max(-3.6, Math.min(3.6, state.playerX));
                state.playerZ = Math.min(-1.5, state.playerZ);

                if (state.manorDoorPos) {
                    const manorWallZ = state.manorDoorPos.z + 1.1; // Solid stone wall & iron fence plane at Z = -236.9
                    if (state.playerZ <= manorWallZ) {
                        // If the player walks into the open Haunted House Cathedral Doorway (|X| <= 1.85), enter the Haunted Manor Maze!
                        if (Math.abs(state.playerX) <= 1.85) {
                            buildLabyrinthScene();
                            renderer.render(scene, camera);
                            return;
                        } else {
                            // Otherwise, block the player solidly against the Haunted House stone wall & iron fence!
                            state.playerZ = manorWallZ;
                        }
                    }
                }
            }
        }
    }

    updateMountainPassMechanics(dt, elapsedSeconds);
    updateLightningAndThunder(dt, elapsedSeconds);

    // Engine Room Kinematics, Pistons, Flywheels, Billowing Steam & Furnace Flicker (Carriage 5)
    if (state.environmentMode === "TRAIN" && state.carriageLevel === state.maxCarriages) {
        const speedRatio = Math.max(0.2, state.trainSpeed / 42.0);
        carriageGroup.children.forEach(obj => {
            if (!obj.userData) return;
            if (obj.userData.isEngineSteam) {
                obj.position.y = obj.userData.baseY + Math.sin(elapsedSeconds * obj.userData.bobSpeed + obj.userData.bobOffset) * 0.35;
                if (typeof obj.userData.baseX === "number") {
                    obj.position.x = obj.userData.baseX + Math.cos(elapsedSeconds * (obj.userData.bobSpeed * 0.7) + obj.userData.bobOffset) * 0.22;
                }
                const scalePulse = 0.88 + Math.sin(elapsedSeconds * 1.8 + obj.userData.bobOffset) * 0.18;
                obj.scale.setScalar(scalePulse);
                obj.rotation.y += 0.8 * dt;
                obj.rotation.z += 0.4 * dt;
            } else if (obj.userData.isEnginePiston) {
                obj.position.z = obj.userData.baseZ + Math.sin(elapsedSeconds * 11.0 * speedRatio + obj.userData.sidePhase) * 0.85;
            } else if (obj.userData.isEngineFlywheel) {
                obj.rotation.x += obj.userData.spinSpeed * speedRatio * dt;
            } else if (obj.userData.isFireLight) {
                obj.intensity = 4.2 + Math.sin(elapsedSeconds * 18.0) * 0.75 + Math.cos(elapsedSeconds * 29.0) * 0.5;
            } else if (obj.userData.isFireCore) {
                const pulse = 0.94 + Math.sin(elapsedSeconds * 15.0) * 0.08;
                obj.scale.set(pulse, pulse, 1);
            }
        });
    }

    // Staggered Carriage Enemy Spawner (Paused while countdown is counting down)
    if (state.environmentMode === "TRAIN" && typeof carriageSpawnQueue !== "undefined" && !controlsLocked) {
        carriageSpawnTimer += dt;

        for (let q = carriageSpawnQueue.length - 1; q >= 0; q--) {
            const item = carriageSpawnQueue[q];
            if (carriageSpawnTimer >= item.spawnDelay) {
                let spawnZ = item.zPos;
                // Ensure every spawned enemy is at least 18m away from the player and at least 10m clear of the exit door
                if (Math.abs(spawnZ - state.playerZ) <= 16.0) {
                    if (state.playerZ > -state.carriageLength + 30.0) {
                        spawnZ = Math.max(-state.carriageLength + 10.0, state.playerZ - 22.0);
                    } else {
                        spawnZ = Math.min(-3.0, state.playerZ + 18.0);
                    }
                }
                spawnNPC(item.xPos, spawnZ, item.type, item.isChokeSwarm);
                carriageSpawnQueue.splice(q, 1);
            }
        }

        // Wave 1: Early-Mid Carriage Wave (at Z <= -24m, spawns 22m-32m ahead & 18m behind)
        if (typeof carriageMidWaveTriggered !== "undefined" && !carriageMidWaveTriggered && state.playerZ <= -24.0) {
            carriageMidWaveTriggered = true;
            const unlockedTypes = getUnlockedEnemyTypesForCarriage(state.carriageLevel);
            const midWaveCount = 3 + Math.min(2, Math.floor(state.carriageLevel / 2));
            for (let mw = 0; mw < midWaveCount; mw++) {
                const chosenType = unlockedTypes[mw % unlockedTypes.length];
                let xPos = (mw % 2 === 0 ? -1 : 1) * (0.48 + (mw % 3) * 0.22);
                if (state.carriageLevel === state.maxCarriages) {
                    xPos = (mw % 2 === 0 ? -1.22 : 1.22);
                }
                const isRearPursuer = (mw === midWaveCount - 1);
                const zPos = isRearPursuer
                    ? Math.min(-3.5, state.playerZ + 18.0)
                    : Math.max(-state.carriageLength + 24.0, state.playerZ - 22.0 - mw * 4.5);
                spawnNPC(xPos, zPos, chosenType, false);
            }
            showNarrativeBanner("Mid-Carriage Reinforcements! Enemies advancing from ahead and behind!", 2600);
        }

        // Wave 2: Mid-Carriage Ambush Wave (at Z <= -42m, spawns at Z = -64m to -76m & 18m behind)
        if (typeof carriageEndWaveTriggered !== "undefined" && !carriageEndWaveTriggered && state.playerZ <= -42.0) {
            carriageEndWaveTriggered = true;
            const unlockedTypes = getUnlockedEnemyTypesForCarriage(state.carriageLevel);
            const endWaveCount = 3 + Math.min(2, Math.floor(state.carriageLevel / 2));
            for (let ew = 0; ew < endWaveCount; ew++) {
                const chosenType = unlockedTypes[ew % unlockedTypes.length];
                let xPos = (ew % 2 === 0 ? -1 : 1) * (0.45 + (ew % 3) * 0.25);
                if (state.carriageLevel === state.maxCarriages) {
                    xPos = (ew % 2 === 0 ? -1.22 : 1.22);
                }
                const isRearPursuer = (ew === endWaveCount - 1);
                const zPos = isRearPursuer
                    ? Math.min(-4.0, state.playerZ + 18.5)
                    : Math.max(-state.carriageLength + 18.0, state.playerZ - 22.0 - ew * 4.2);
                spawnNPC(xPos, zPos, chosenType, false);
            }
            showNarrativeBanner("Carriage Ambush! Enemies charging from ahead and behind [SPACE]!", 2800);
        }

        // Wave 3 (NEW): Late-Carriage Swarm Towards the End of the 100m Space (triggers at Z <= -56m, spawns at Z = -76m to -88m)
        if (typeof carriageLateWaveTriggered !== "undefined" && !carriageLateWaveTriggered && state.playerZ <= -56.0) {
            carriageLateWaveTriggered = true;
            const unlockedTypes = getUnlockedEnemyTypesForCarriage(state.carriageLevel);
            const lateWaveCount = 3 + Math.min(3, Math.floor(state.carriageLevel / 2));
            for (let lw = 0; lw < lateWaveCount; lw++) {
                const chosenType = unlockedTypes[(lw + 2) % unlockedTypes.length];
                let xPos = (lw % 2 === 0 ? -1 : 1) * (0.42 + (lw % 3) * 0.26);
                if (state.carriageLevel === state.maxCarriages) {
                    xPos = (lw % 2 === 0 ? -1.22 : 1.22);
                }
                const isRearPursuer = (lw === lateWaveCount - 1);
                const zPos = isRearPursuer
                    ? Math.min(-4.0, state.playerZ + 19.0)
                    : Math.max(-state.carriageLength + 12.0, state.playerZ - 20.0 - lw * 3.8);
                spawnNPC(xPos, zPos, chosenType, false);
            }
            showNarrativeBanner("Late-Carriage Swarm! More enemies ahead towards the end of the carriage!", 2800);
        }

        // Wave 4: End-of-Carriage Doorway Wave (triggers earlier at Z <= -65m, spawns at Z = -83m to -90m — 10m to 17m clear of the exit door!)
        if (typeof carriageFinalDoorWaveTriggered !== "undefined" && !carriageFinalDoorWaveTriggered && state.playerZ <= -65.0) {
            carriageFinalDoorWaveTriggered = true;
            const unlockedTypes = getUnlockedEnemyTypesForCarriage(state.carriageLevel);
            const finalWaveCount = 3 + Math.min(3, Math.floor(state.carriageLevel / 2));
            for (let fw = 0; fw < finalWaveCount; fw++) {
                const chosenType = unlockedTypes[(fw + 1) % unlockedTypes.length];
                let xPos = (fw % 2 === 0 ? -1 : 1) * (0.4 + (fw % 3) * 0.28);
                if (state.carriageLevel === state.maxCarriages) {
                    xPos = (fw % 2 === 0 ? -1.22 : 1.22);
                }
                const isRearPursuer = (fw >= finalWaveCount - 2);
                const zPos = isRearPursuer
                    ? Math.min(-4.0, state.playerZ + 19.0 + (fw % 2) * 4.0)
                    : Math.max(-state.carriageLength + 10.0, state.playerZ - 18.0 - fw * 2.6);
                spawnNPC(xPos, zPos, chosenType, false);
            }
            showNarrativeBanner("Doorway Guard Wave! Clear the exit ahead and watch your back!", 3000);
        }

        // Wave 5: Last Round of Enemies in the Steam Train (Engine Room Climax Wave)
        // Triggers at Z <= -72m (28m before the Nose Door) and spawns at Z = -84m to -91.5m (8.5m to 16m away from the door) so the player has plenty of time to shoot them!
        if (
            state.carriageLevel === state.maxCarriages &&
            typeof engineLastStandTriggered !== "undefined" &&
            !engineLastStandTriggered &&
            state.playerZ <= -state.carriageLength + 28.0
        ) {
            engineLastStandTriggered = true;
            const enginePool = ["CYAN", "GREEN", "GHOST", "VAMPIRE"];
            for (let el = 0; el < 6; el++) {
                const chosenType = enginePool[el % enginePool.length];
                const xPos = (el % 2 === 0 ? -1.22 : 1.22);
                const isRear = (el >= 4);
                const zPos = isRear
                    ? Math.min(-6.0, state.playerZ + 19.0 + (el - 4) * 4.5)
                    : Math.max(-state.carriageLength + 8.5, -state.carriageLength + 16.0 - el * 2.2);
                spawnNPC(xPos, zPos, chosenType, true);
            }
            showNarrativeBanner("FINAL STEAM TRAIN STAND! Defeat the Engine Room horde guarding the Nose Door!", 3600);
        }
    }

    let shudderX = 0.0;
    let shudderY = 0.0;
    if (state.cameraShudderTimer > 0) {
        state.cameraShudderTimer -= dt;
        shudderX = (Math.random() - 0.5) * state.cameraShudderIntensity;
        shudderY = (Math.random() - 0.5) * state.cameraShudderIntensity;
    }

    camera.position.set(state.playerX + shudderX, state.playerY + shudderY, state.playerZ);
    updateWeaponViewModel(dt);

    if (state.activeWeapon === "TORCH" || state.isPerched || state.environmentMode === "LABYRINTH") {
        torchSpotLight.intensity = state.activeWeapon === "TORCH"
            ? (state.isFiring ? 4.4 : 2.8)
            : (state.environmentMode === "LABYRINTH" ? 2.2 : 1.8);
        torchSpotLight.position.copy(camera.position);
        const lookDir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
        torchTarget.position.copy(camera.position).addScaledVector(lookDir, 18);
    } else {
        torchSpotLight.intensity = 0.0;
    }

    if (state.isFiring && !controlsLocked) {
        fireActiveWeapon();
        sound.setWaterStream(state.activeWeapon === "WATER");
    } else {
        sound.setWaterStream(false);
    }

    if (state.environmentMode === "TRAIN") {
        exteriorGroup.children.forEach(obj => {
            if (obj.userData.scrollable) {
                obj.position.z += state.trainSpeed * dt;
                if (obj.position.z > 45) obj.position.z -= 300;
            }
        });
    }

    const invBanner = getEl("invincible-banner");
    if (state.invincibleTimer > 0) {
        state.invincibleTimer -= dt;
        if (invBanner) {
            invBanner.style.display = "block";
            invBanner.textContent = `Raincoat Active: ${Math.max(0, state.invincibleTimer).toFixed(1)}s`;
        }
    } else if (invBanner) {
        invBanner.style.display = "none";
    }

    pickups.forEach(p => {
        if (p.collected) return;
        p.mesh.rotation.y += 2.5 * dt;
        const d = Math.hypot(state.playerX - p.mesh.position.x, state.playerZ - p.mesh.position.z);
        if (d < 1.5 && !state.isPerched) {
            p.collected = true;
            p.mesh.visible = false;
            state.invincibleTimer = 8.0;
            sound.playPickupRaincoat();
        }
    });

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.life -= dt;

        // Ballistic gravity & buoyant gas physics
        if (proj.gravity) {
            proj.vel.y -= proj.gravity * dt;
        }
        if (proj.buoyancy) {
            proj.vel.y += proj.buoyancy * dt;
        }
        proj.mesh.position.addScaledVector(proj.vel, dt);

        if (proj.spinSpeed) {
            proj.mesh.rotation.z += proj.spinSpeed * dt;
        }
        if (proj.weaponType === "FART") {
            proj.mesh.scale.addScalar(dt * 0.32);
        }

        // Emit dynamic flight trail particles
        proj.trailTimer = (proj.trailTimer || 0) + dt;
        if (proj.trailTimer >= 0.028) {
            proj.trailTimer = 0;
            const tGeo = new THREE.SphereGeometry(proj.weaponType === "FART" ? 0.09 : 0.045, 5, 5);
            const tMat = new THREE.MeshBasicMaterial({
                color: proj.trailColor || proj.color || 0xffffff,
                transparent: true,
                opacity: 0.72
            });
            const tMesh = new THREE.Mesh(tGeo, tMat);
            tMesh.position.copy(proj.mesh.position);
            carriageGroup.add(tMesh);
            particles.push({
                mesh: tMesh,
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.6,
                    (Math.random() - 0.3) * 0.6,
                    (Math.random() - 0.5) * 0.6
                ),
                gravity: 0.5,
                life: 0.22,
                maxLife: 0.22,
                scaleRate: proj.weaponType === "FART" ? 1.4 : -1.5
            });
        }

        let removeProj = proj.life <= 0;

        // Stop projectiles if they hit a solid Haunted Manor wall
        if (state.environmentMode === "LABYRINTH" && !removeProj) {
            if (!canMoveToMazePos(proj.mesh.position.x, proj.mesh.position.z, 0.12)) {
                spawnImpactParticles(proj.mesh.position, proj.color || 0xffffff, 7, 0.7);
                removeProj = true;
            }
        }

        if (state.environmentMode === "TRAIN" && state.carriageLevel === state.maxCarriages && !removeProj) {
            if (proj.weaponType === "WATER") {
                for (let eb = 0; eb < engineHitboxes.length; eb++) {
                    if (engineHitboxes[eb].containsPoint(proj.mesh.position)) {
                        spawnImpactParticles(proj.mesh.position, 0x90e0ef, 14, 1.2);
                        removeProj = true;
                        state.trainWetStrikes++;
                        state.trainSpeed = Math.max(8.0, state.trainSpeed * 0.52);
                        state.cameraShudderTimer = 0.45;
                        state.cameraShudderIntensity = 0.22;
                        sound.playSparkHazard();

                        showNarrativeBanner(
                            `CRITICAL ALERT: Boiler Doused! Strike ${state.trainWetStrikes}/${state.maxWetStrikes}! Train slowing!`,
                            3400
                        );

                        if (state.trainWetStrikes >= state.maxWetStrikes) {
                            state.trainSpeed = 0;
                            endGame(false, "LOCOMOTIVE HALTED: The boiler drowned and the engine seized!");
                        }
                        break;
                    }
                }
            }
        }

        // Check projectile hits against Cursed Manor Seals in LABYRINTH mode
        if (state.environmentMode === "LABYRINTH" && typeof manorSeals !== "undefined" && !removeProj) {
            for (let sIdx = 0; sIdx < manorSeals.length; sIdx++) {
                const seal = manorSeals[sIdx];
                if (seal.purified) continue;
                const dSeal = Math.hypot(proj.mesh.position.x - seal.worldPos.x, proj.mesh.position.z - seal.worldPos.z);
                if (dSeal < 1.35 && proj.mesh.position.y >= 0.35 && proj.mesh.position.y <= 3.2) {
                    removeProj = true;
                    seal.hp = Math.max(0, seal.hp - 1);
                    spawnImpactParticles(proj.mesh.position, seal.color || 0x00f5d4, 14, 1.25);
                    if (seal.hp <= 0) {
                        purifyManorSeal(seal);
                    } else {
                        sound.playKindnessComplete();
                        if (typeof showCombatFeedback === "function") {
                            showCombatFeedback(`🔮 ${seal.name} CRACKING (${3 - seal.hp}/3)!`, true, 900);
                        }
                    }
                    break;
                }
            }
        }

        // Check projectile hits against shootable Boss Dark Orbs
        if (state.environmentMode === "LABYRINTH" && typeof bossOrbs !== "undefined" && !removeProj) {
            for (let oIdx = bossOrbs.length - 1; oIdx >= 0; oIdx--) {
                const orb = bossOrbs[oIdx];
                if (proj.mesh.position.distanceTo(orb.mesh.position) < 0.95) {
                    removeProj = true;
                    spawnImpactParticles(orb.mesh.position, 0xffaa00, 14, 1.25);
                    carriageGroup.remove(orb.mesh);
                    bossOrbs.splice(oIdx, 1);
                    sound.playKindnessComplete();
                    if (typeof showCombatFeedback === "function") {
                        showCombatFeedback("💥 DARK ORB SHATTERED!", true, 800);
                    }
                    break;
                }
            }
        }

        // Check projectile hits against Lord Malakor (Dread Arch-Specter)
        if (guardianBoss.isActive && !guardianBoss.isDefeated && !removeProj && guardianBoss.group) {
            const bossPos = guardianBoss.group.position;
            const horizBossDist = Math.hypot(proj.mesh.position.x - bossPos.x, proj.mesh.position.z - bossPos.z);
            const vertBossDist = proj.mesh.position.y - bossPos.y;
            if (horizBossDist < guardianBoss.hitRadius && vertBossDist >= 0.15 && vertBossDist <= 4.3) {
                removeProj = true;
                const hitAccepted = damageGuardianSpecter(25, proj.weaponType);
                if (hitAccepted) {
                    spawnImpactParticles(proj.mesh.position, proj.color || 0xffe066, 18, 1.35);
                } else {
                    spawnImpactParticles(proj.mesh.position, 0x999999, 8, 0.75);
                }
            }
        }

        if (!removeProj) {
            for (let j = 0; j < npcs.length; j++) {
                const npc = npcs[j];
                if (npc.saturated) continue;
                const npcPos = npc.group.position;
                const horizDist = Math.hypot(proj.mesh.position.x - npcPos.x, proj.mesh.position.z - npcPos.z);
                const vertDist = proj.mesh.position.y - npcPos.y;
                const hitRadius = state.isPerched ? 1.95 : 1.15;
                const minVert = state.isPerched ? -1.1 : -0.35;
                const maxVert = state.isPerched ? 2.9 : 2.45;

                if (horizDist < hitRadius && vertDist >= minVert && vertDist <= maxVert) {
                    removeProj = true;
                    const match =
                        (proj.weaponType === "WATER" && npc.zombieType === "CYAN") ||
                        (proj.weaponType === "FART" && npc.zombieType === "GREEN") ||
                        (proj.weaponType === "TORCH" && npc.zombieType === "GHOST") ||
                        (proj.weaponType === "GARLIC" && npc.zombieType === "VAMPIRE");

                    if (match) {
                        spawnImpactParticles(proj.mesh.position, proj.color || 0xffffff, 12, 1.1);
                        npc.hitFlashTimer = 0.16;

                        // Physical knockback stagger on matching weapon hit
                        const kbLen = Math.hypot(proj.vel.x, proj.vel.z) || 1.0;
                        const kbX = npc.group.position.x + (proj.vel.x / kbLen) * 0.42;
                        const kbZ = npc.group.position.z + (proj.vel.z / kbLen) * 0.42;
                        if (state.environmentMode !== "LABYRINTH" || canMoveToMazePos(kbX, kbZ, 0.55)) {
                            npc.group.position.x = Math.max(-3.3, Math.min(3.3, kbX));
                            npc.group.position.z = kbZ;
                        }

                        // Tree perch vantage grants extra stopping power so kids can easily clear the mob as it approaches!
                        npc.wetness += state.isPerched ? 2 : 1;
                        if (npc.wetness >= npc.requiredWetness) {
                            npc.saturated = true;
                            state.monstersPurified = (state.monstersPurified || 0) + 1;
                            sound.playKindnessComplete();
                            spawnImpactParticles(
                                npc.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
                                0xffd166,
                                18,
                                1.35
                            );
                            npc.headMesh.material.forEach(m => {
                                if (m.map) { m.map = smilingFaceTex; m.needsUpdate = true; }
                            });
                            if (typeof showCombatFeedback === "function") {
                                showCombatFeedback("✨ MONSTER PURIFIED!", true, 850);
                            }
                        } else if (typeof showCombatFeedback === "function") {
                            showCombatFeedback(`💥 DIRECT HIT (${npc.wetness}/${npc.requiredWetness})`, true, 650);
                        }
                    } else {
                        spawnImpactParticles(proj.mesh.position, 0x999999, 5, 0.6);
                        sound.playDeflect();
                        if (typeof showCombatFeedback === "function") {
                            const counterMap = {
                                CYAN: "🛡 IMMUNE! USE [1] WATER CANNON (BLUE)",
                                GREEN: "🛡 IMMUNE! USE [2] STINK BLASTER (GREEN)",
                                GHOST: "🛡 IMMUNE! USE [3] SOLAR TORCH (GOLD)",
                                VAMPIRE: "🛡 IMMUNE! USE [4] GARLIC LAUNCHER (RED)"
                            };
                            showCombatFeedback(counterMap[npc.zombieType] || "🛡 WRONG BLASTER! SWITCH [Q] / [1-4]", false, 1200);
                        }
                    }
                    break;
                }
            }
        }

        if (removeProj) {
            carriageGroup.remove(proj.mesh);
            projectiles.splice(i, 1);
        }
    }

    // Update active 3D particle bursts & weapon trails
    for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.life -= dt;
        if (pt.life <= 0) {
            carriageGroup.remove(pt.mesh);
            particles.splice(i, 1);
            continue;
        }
        if (pt.gravity) {
            pt.vel.y -= pt.gravity * dt;
        }
        pt.mesh.position.addScaledVector(pt.vel, dt);
        if (pt.scaleRate) {
            const nextScale = Math.max(0.05, pt.mesh.scale.x + pt.scaleRate * dt);
            pt.mesh.scale.setScalar(nextScale);
        }
        if (pt.mesh.material && pt.maxLife) {
            pt.mesh.material.opacity = Math.max(0, (pt.life / pt.maxLife) * 0.9);
        }
    }

    let rearThreat = false;
    let closestRearDist = Infinity;
    let highestDetection = 0.0;
    let activeChasers = 0;
    const playerWorldPos = new THREE.Vector3(state.playerX, state.playerY, state.playerZ);

    npcs.forEach((npc, npcIdx) => {
        if (npc.saturated) {
            npc.group.position.y += 2.5 * dt;
            npc.group.rotation.y += 4.0 * dt;
            return;
        }

        const toPlayerX = state.playerX - npc.group.position.x;
        const toPlayerZ = state.playerZ - npc.group.position.z;
        const distToPlayer = Math.hypot(toPlayerX, toPlayerZ);

        if (state.environmentMode === "LABYRINTH") {
            const hasLoS = checkLineOfSight(
                npc.group.position,
                npc.group.quaternion,
                playerWorldPos,
                npc.visionRange
            );

            if (hasLoS) {
                const proximityFactor = 1.0 - Math.min(1.0, distToPlayer / npc.visionRange);
                const gainRate = 40.0 + (proximityFactor * 65.0);
                npc.detectionMeter = Math.min(100.0, npc.detectionMeter + gainRate * dt);
                npc.lostTrackingTimer = 0.0;
            } else {
                npc.lostTrackingTimer += dt;
                if (npc.lostTrackingTimer > 2.0) {
                    npc.detectionMeter = Math.max(0.0, npc.detectionMeter - 24.0 * dt);
                }
            }

            highestDetection = Math.max(highestDetection, npc.detectionMeter);

            if (npc.detectionMeter >= 100.0) {
                npc.aiState = "CHASE";
                activeChasers++;
            } else if (npc.detectionMeter > 20.0) {
                npc.aiState = "ALERT";
            } else {
                npc.aiState = "PATROL";
            }

            if (npc.aiState === "CHASE") {
                const step = npc.chaseSpeed * dt;
                const nx = npc.group.position.x + (toPlayerX / distToPlayer) * step;
                const nz = npc.group.position.z + (toPlayerZ / distToPlayer) * step;

                if (canMoveToMazePos(nx, npc.group.position.z, 0.55)) npc.group.position.x = nx;
                if (canMoveToMazePos(npc.group.position.x, nz, 0.55)) npc.group.position.z = nz;
                npc.group.lookAt(state.playerX, npc.group.position.y, state.playerZ);
            } else if (npc.aiState === "ALERT") {
                npc.group.lookAt(state.playerX, npc.group.position.y, state.playerZ);
            } else {
                if (npc.waypoints && npc.waypoints.length > 0) {
                    const targetWp = npc.waypoints[npc.currentWaypointIndex];
                    const distToWp = Math.hypot(targetWp.x - npc.group.position.x, targetWp.z - npc.group.position.z);

                    if (distToWp < 0.6) {
                        npc.currentWaypointIndex = (npc.currentWaypointIndex + 1) % npc.waypoints.length;
                    } else {
                        const dirX = (targetWp.x - npc.group.position.x) / distToWp;
                        const dirZ = (targetWp.z - npc.group.position.z) / distToWp;
                        const step = npc.patrolSpeed * dt;
                        const nx = npc.group.position.x + dirX * step;
                        const nz = npc.group.position.z + dirZ * step;

                        if (canMoveToMazePos(nx, npc.group.position.z, 0.55)) npc.group.position.x = nx;
                        if (canMoveToMazePos(npc.group.position.x, nz, 0.55)) npc.group.position.z = nz;
                        npc.group.lookAt(targetWp.x, npc.group.position.y, targetWp.z);
                    }
                }
            }
        } else {
            // --- TRAIN CARRIAGES & MOUNTAIN PASS ENEMY MOVEMENT ---
            let targetX = state.playerX;
            let targetZ = state.playerZ;

            // Check if player is currently inside any tree's fenced perimeter or perched in a tree
            let fencedTree = activePerchedTree;
            if (!fencedTree && state.environmentMode === "MOUNTAIN_PASS") {
                for (let tIdx = 0; tIdx < climbableTrees.length; tIdx++) {
                    const tr = climbableTrees[tIdx];
                    const fRad = tr.fenceRadius || 2.85;
                    if (Math.hypot(state.playerX - tr.x, state.playerZ - tr.z) < fRad) {
                        fencedTree = tr;
                        break;
                    }
                }
            }

            // When player is inside the fenced tree zone or perched in the tree:
            // - Ghosts CAN phase through the outer fence! However, when the player is on the tree perch,
            //   Ghosts CANNOT come up to the tree (they stay back in a ring inside the yard so the player can shoot them).
            // - All other enemies CANNOT pass through the fence and swarm around the outside perimeter.
            if (fencedTree) {
                const slot = npcIdx % 7;
                const row = Math.floor(npcIdx / 7);
                const trailSideAngle = fencedTree.x < 0 ? 0.55 : -0.55;
                const spreadAngle = Math.PI + trailSideAngle + (slot - 3) * 0.34;

                if (npc.zombieType === "GHOST") {
                    if (state.isPerched) {
                        // Ghosts phase inside the fence but CANNOT come up to the tree when player is perched
                        const ghostStandOff = 1.95 + (npcIdx % 3) * 0.22;
                        targetX = Math.max(-3.3, Math.min(3.3, fencedTree.x + Math.sin(spreadAngle) * ghostStandOff));
                        targetZ = fencedTree.z + Math.cos(spreadAngle) * ghostStandOff;
                    } else {
                        // Player is on the ground inside the fence: Ghosts phase right through the fence toward the player!
                        targetX = state.playerX;
                        targetZ = state.playerZ;
                    }
                } else {
                    const fRad = (fencedTree.fenceRadius || 2.85) + 0.55;
                    targetX = Math.max(-3.3, Math.min(3.3, fencedTree.x + Math.sin(spreadAngle) * (fRad + row * 0.95)));
                    targetZ = fencedTree.z + Math.cos(spreadAngle) * (fRad + row * 0.95);
                }
            }

            const dxTarget = targetX - npc.group.position.x;
            const dzTarget = targetZ - npc.group.position.z;
            const distToTarget = Math.hypot(dxTarget, dzTarget);

            if (distToTarget > 0.01) {
                const minStopDist = fencedTree ? 0.35 : 0.65;
                if (distToTarget > minStopDist && !controlsLocked) {
                    let effectiveSpeed = npc.speed;

                    if (state.environmentMode === "TRAIN") {
                        // Enemies approaching from behind (npc.z > playerZ) sprint faster than the player (6.2 m/s)
                        // so the player CANNOT outrun them and is forced to turn around [SPACE] to deal with them!
                        const isBehindPlayer = npc.group.position.z > state.playerZ + 0.6;
                        if (isBehindPlayer) {
                            if (!state.facingRear) {
                                effectiveSpeed = distToPlayer > 5.0 ? 8.0 : 7.1;
                            } else {
                                // Once the player turns around to face them, give a fair fighting pace
                                effectiveSpeed = Math.max(npc.speed, 3.8);
                            }
                        }
                    } else if (state.environmentMode === "MOUNTAIN_PASS") {
                        const isBehindPlayer = npc.group.position.z > state.playerZ + 0.8;
                        if (fencedTree || state.isPerched) {
                            // Once the player is inside the tree fence or perched, both front and rear mobs swarm quickly!
                            effectiveSpeed = Math.max(npc.speed, 4.4);
                        } else if (isBehindPlayer) {
                            // Rear enemies in the Mountain Pass pursue briskly while still allowing the player to reach the nearby tree fence first
                            effectiveSpeed = 5.4;
                        } else {
                            // Front horde paces at 3.1 m/s while the player runs to the tree perch
                            effectiveSpeed = Math.min(npc.speed, 3.1);
                        }
                    }

                    const step = effectiveSpeed * dt;
                    let nx = npc.group.position.x + (dxTarget / distToTarget) * step;
                    let nz = npc.group.position.z + (dzTarget / distToTarget) * step;

                    // In Carriage 5 (Engine Room), route enemies along the left/right walkways around the central boiler!
                    if (state.environmentMode === "TRAIN" && state.carriageLevel === state.maxCarriages) {
                        if (nz < -35.0 && nz > -69.0 && Math.abs(nx) < 0.96) {
                            nx = (nx >= 0 ? 1 : -1) * 1.05;
                        }
                    }

                    // Mountain Pass tree fence & tree trunk barrier rules:
                    // - Non-ghost enemies CANNOT move through the fence around any tree perch (blocked at fenceRadius + 0.42).
                    // - Ghosts CAN move through the fence, EXCEPT when the player is on the perch (`state.isPerched`),
                    //   Ghosts cannot come up to the tree (kept >= 1.85m away from the tree trunk).
                    if (state.environmentMode === "MOUNTAIN_PASS") {
                        for (let tIdx = 0; tIdx < climbableTrees.length; tIdx++) {
                            const tr = climbableTrees[tIdx];
                            let minAllowedDist = 0.0;
                            if (npc.zombieType === "GHOST") {
                                // Ghosts pass through the outer fence, but cannot approach the tree when the player is perched
                                minAllowedDist = state.isPerched ? 1.85 : 0.68;
                            } else {
                                // Other enemies are strictly blocked outside the fence
                                minAllowedDist = (tr.fenceRadius || 2.85) + 0.42;
                            }
                            const dxTree = nx - tr.x;
                            const dzTree = nz - tr.z;
                            const dTree = Math.hypot(dxTree, dzTree);
                            if (dTree < minAllowedDist) {
                                const pushAngle = dTree > 0.001 ? Math.atan2(dxTree, dzTree) : 0;
                                nx = tr.x + Math.sin(pushAngle) * minAllowedDist;
                                nz = tr.z + Math.cos(pushAngle) * minAllowedDist;
                            }
                        }
                    }

                    npc.group.position.x = nx;
                    npc.group.position.z = nz;
                }
                npc.group.lookAt(state.playerX, npc.group.position.y, state.playerZ);
            }

            if (state.environmentMode === "MOUNTAIN_PASS") {
                npc.group.position.y = getMountainPassHeight(npc.group.position.x, npc.group.position.z);
            } else {
                npc.group.position.y = 0.0;
            }
        }

        // Hit-flash reaction scale & glow
        if (npc.hitFlashTimer && npc.hitFlashTimer > 0) {
            npc.hitFlashTimer = Math.max(0, npc.hitFlashTimer - dt);
            const flashBump = 1.0 + Math.sin((npc.hitFlashTimer / 0.16) * Math.PI) * 0.14;
            npc.group.scale.set(flashBump, 1.0 / flashBump, flashBump);
        } else {
            npc.group.scale.set(1, 1, 1);
        }

        // Procedural Limb Stride & Spectral Float Kinematics
        const animPhase = elapsedSeconds * (npc.speed * 2.6) + npc.wobblePhase;
        if (npc.zombieType === "GHOST") {
            npc.group.position.y += Math.sin(animPhase * 0.8) * 0.12 + 0.12;
            if (npc.ghostTail) {
                npc.ghostTail.rotation.z = Math.sin(animPhase) * 0.18;
            }
            if (npc.soulCore) {
                npc.soulCore.rotation.y += 3.2 * dt;
                npc.soulCore.rotation.x += 2.1 * dt;
            }
        } else {
            if (npc.leftLeg && npc.rightLeg) {
                npc.leftLeg.rotation.x = Math.sin(animPhase) * 0.65;
                npc.rightLeg.rotation.x = -Math.sin(animPhase) * 0.65;
            }
            if (npc.capeMesh) {
                npc.capeMesh.rotation.x = 0.22 + Math.abs(Math.sin(animPhase * 0.5)) * 0.25;
            }
        }
        if (npc.leftArm && npc.rightArm) {
            npc.leftArm.rotation.x = Math.sin(animPhase * 0.7) * 0.35;
            npc.rightArm.rotation.x = -Math.sin(animPhase * 0.7) * 0.35;
        }
        if (npc.targetRing) {
            const ringScale = 1.0 + Math.sin(elapsedSeconds * 5.0 + npc.wobblePhase) * 0.12;
            npc.targetRing.scale.set(ringScale, ringScale, 1);
        }
        npc.headMesh.rotation.z = Math.sin(animPhase * 0.5) * 0.09;

        // Check if player is protected inside any tree perch fence
        let playerInsideTreeFence = false;
        if (state.environmentMode === "MOUNTAIN_PASS") {
            for (let tIdx = 0; tIdx < climbableTrees.length; tIdx++) {
                const tr = climbableTrees[tIdx];
                if (Math.hypot(state.playerX - tr.x, state.playerZ - tr.z) <= (tr.fenceRadius || 2.85)) {
                    playerInsideTreeFence = true;
                    break;
                }
            }
        }

        // Ghosts can phase through the fence on the ground, so the fence alone does not block Ghosts unless the player is perched in the tree!
        const blockedByFence = playerInsideTreeFence && npc.zombieType !== "GHOST";

        // Damage trigger with strict tree-perch immunity, non-ghost fence immunity, and countdown immunity check
        if (distToPlayer < 1.15 && !state.isPerched && !blockedByFence && !(typeof isCountdownActive !== "undefined" && isCountdownActive)) {
            npc.saturated = true;
            npc.group.visible = false;
            triggerDamage();
        }

        if (distToPlayer < 25.0 && toPlayerZ < -0.6 && !state.facingRear && !state.isPerched) {
            rearThreat = true;
            if (distToPlayer < closestRearDist) {
                closestRearDist = distToPlayer;
            }
        }
    });

    if (detectionContainer) {
        if (state.environmentMode === "LABYRINTH") {
            if (highestDetection > 0) {
                detectionContainer.style.display = "flex";
                if (detectionFill) {
                    detectionFill.style.width = `${highestDetection}%`;
                    if (activeChasers > 0) {
                        detectionFill.classList.add("alert");
                    } else {
                        detectionFill.classList.remove("alert");
                    }
                }
            } else {
                detectionContainer.style.display = "none";
            }
        } else {
            detectionContainer.style.display = "none";
        }
    }

    if (rearThreat && Number.isFinite(closestRearDist)) {
        safeSetText(
            "rear-warning",
            `⚠ DANGER BEHIND (${closestRearDist.toFixed(1)}m)! PRESS [SPACE] FOR 180° TURN!`
        );
        safeSetDisplay("rear-warning", "block");
    } else {
        safeSetDisplay("rear-warning", "none");
    }

    let sealPromptText = "";
    if (state.environmentMode === "LABYRINTH") {
        state.playerY = state.basePlayerY;

        if (typeof manorSeals !== "undefined") {
            for (let sIdx = 0; sIdx < manorSeals.length; sIdx++) {
                const seal = manorSeals[sIdx];
                if (seal.purified) continue;
                if (seal.crystalMesh) {
                    seal.crystalMesh.rotation.y += 2.2 * dt;
                    seal.crystalMesh.position.y = 1.68 + Math.sin(elapsedSeconds * 3.2 + sIdx) * 0.14;
                }
                if (seal.haloRing) {
                    seal.haloRing.rotation.z += 1.8 * dt;
                }
                const dSeal = Math.hypot(state.playerX - seal.worldPos.x, state.playerZ - seal.worldPos.z);
                if (dSeal <= 1.65) {
                    purifyManorSeal(seal);
                } else if (dSeal <= 4.2 && !sealPromptText) {
                    sealPromptText = `[E] or Shoot to Shatter ${seal.name}`;
                }
            }
        }

        updateGuardianSpecter(dt, elapsedSeconds, camera.position);
        updateBossParticleAura(dt, elapsedSeconds);
    }

    let promptText = "";

    if (state.environmentMode === "TRAIN") {
        const distObj = Math.max(0, state.playerZ - (-state.carriageLength));
        safeSetText("distance-value", `${distObj.toFixed(1)} m`);

        if (state.carriageLevel < state.maxCarriages) {
            if (distObj <= 3.5) {
                promptText = `[E] or Walk Forward to Carriage 0${state.carriageLevel + 1}`;
            }
        } else {
            if (state.redDoorPos && Math.hypot(state.playerX - state.redDoorPos.x, state.playerZ - state.redDoorPos.z) <= 4.0) {
                promptText = "[E] or Walk Forward to Exit Train to Mountain Pass";
            }
        }
    } else if (state.environmentMode === "MOUNTAIN_PASS") {
        const distManor = state.manorDoorPos ? Math.hypot(state.playerX - state.manorDoorPos.x, state.playerZ - state.manorDoorPos.z) : 0;
        safeSetText("distance-value", `${distManor.toFixed(1)} m`);

        if (distManor <= 5.0) {
            promptText = "[E] Enter Victorian Manor";
        } else if (!state.isPerched && state.perchCooldown <= 0) {
            for (let i = 0; i < climbableTrees.length; i++) {
                const t = climbableTrees[i];
                if (Math.hypot(state.playerX - t.x, state.playerZ - t.z) <= 5.5) {
                    promptText = "[E] Climb Pine Tree Perch (Safe Vantage — Shoot Mob Below!)";
                    break;
                }
            }
        }
    } else if (state.environmentMode === "LABYRINTH") {
        const nextSeal = (typeof manorSeals !== "undefined") ? manorSeals.find(s => !s.purified) : null;
        if (nextSeal) {
            const distSeal = Math.hypot(state.playerX - nextSeal.worldPos.x, state.playerZ - nextSeal.worldPos.z);
            safeSetText("distance-value", `${distSeal.toFixed(1)} m (Seal ${nextSeal.index + 1}/3)`);
        } else {
            const distSanctuary = Math.hypot(state.playerX - state.mazeCenterPos.x, state.playerZ - state.mazeCenterPos.z);
            safeSetText("distance-value", `${distSanctuary.toFixed(1)} m (Sanctum)`);
        }
        if (sealPromptText) {
            promptText = sealPromptText;
        }
        renderLabyrinthMinimap(currentYaw);
    }

    const interactEl = getEl("interact-prompt");
    if (interactEl) {
        if (promptText) {
            interactEl.textContent = promptText;
            interactEl.style.display = "block";
        } else {
            interactEl.style.display = "none";
        }
    }

    renderer.render(scene, camera);
}

requestAnimationFrame(animate);
