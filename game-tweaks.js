/*
 * Mountain Run - game tweaks asked for by Richard (25-Oct-26).
 *
 * Sits BESIDE the game's own files and never edits them. Each tweak switches itself off if the
 * game's code no longer has the names it relies on.
 *
 * Tweak 1. Steam Engine Room (carriage 5): fewer enemies, arriving one at a time.
 *   Richard's words: "reduce the number of enemies that appear and makes them appear in a more
 *   spaced out manner which makes it easier for the player to beat them."
 *   The game's own code sends 38 enemies into carriage 5, mostly in bursts of 5 or 6 at once.
 *   This tweak catches each enemy the game asks for in carriage 5, keeps about half of them, and
 *   lets them in one at a time: at least GAP_SECONDS apart and never more than MAX_AT_ONCE still
 *   standing. Each one appears at the game's own safe distance from the player, on the side
 *   (ahead or behind) the game chose. Their types, speed and toughness are unchanged.
 *   To adjust: change the three numbers below. To switch off: set ENABLED to false.
 */
(function () {
    "use strict";
    var ENGINE_ROOM = {
        ENABLED: true,
        KEEP_EVERY: 2,      // keep 1 in every 2 enemies the game sends (38 becomes about 19)
        GAP_SECONDS: 3.0,   // at least this long between one enemy appearing and the next
        MAX_AT_ONCE: 3      // never more than this many enemies standing at the same time
    };

    function g(name) { try { return eval(name); } catch (e) { return undefined; } }
    var S = g("state");
    var orig = (typeof window.spawnNPC === "function") ? window.spawnNPC : null;
    var npcsOk = Array.isArray(g("npcs"));
    if (!ENGINE_ROOM.ENABLED || !S || !orig || !npcsOk || !("carriageLevel" in S) || !("maxCarriages" in S)) {
        if (ENGINE_ROOM.ENABLED) console.warn("[Mountain Run] engine room tweak is off: the game's names have changed");
        return;
    }

    var held = [];          // enemies waiting to come in: { side, x, type, choke }
    var seen = 0;           // how many enemies the game has asked for in this visit to carriage 5
    var lastRelease = -1e9;
    var released = 0;
    var inEngineRoom = false;
    var stats = { asked: 0, kept: 0, released: 0, maxAlive: 0, gaps: [] };
    window.__mountainRunTweaks = { engineRoom: ENGINE_ROOM, stats: stats, held: held };

    function isEngineRoom() {
        return S.environmentMode === "TRAIN" && S.carriageLevel === S.maxCarriages;
    }
    function aliveCount() {
        var list = g("npcs") || [];
        var n = 0;
        for (var i = 0; i < list.length; i++) if (list[i] && !list[i].saturated) n++;
        return n;
    }

    window.spawnNPC = function (x, z, forceType, isChokeSwarm) {
        if (!isEngineRoom()) return orig.apply(this, arguments);
        if (!inEngineRoom) { inEngineRoom = true; held.length = 0; seen = 0; released = 0; lastRelease = -1e9; }
        seen++; stats.asked++;
        if ((seen - 1) % ENGINE_ROOM.KEEP_EVERY !== 0) return;   // thin out
        stats.kept++;
        held.push({ side: (typeof z === "number" && z > S.playerZ) ? "behind" : "ahead", x: x, z: z, type: forceType, choke: isChokeSwarm, opening: seen <= 2 });
    };

    function release(item, now) {
        var len = S.carriageLength || 100;
        var z;
        if (item.opening && typeof item.z === "number" && Math.abs(item.z - S.playerZ) > 16) {
            z = item.z;                                   // the opening guard keeps its place
        } else if (item.side === "behind") {
            z = Math.min(-3.0, S.playerZ + 18.0);
        } else {
            z = Math.max(-len + 8.5, S.playerZ - 22.0);
        }
        if (Math.abs(z - S.playerZ) < 14) {               // too close (e.g. near the door): put it on the other side
            z = (item.side === "behind") ? Math.max(-len + 8.5, S.playerZ - 22.0) : Math.min(-3.0, S.playerZ + 18.0);
        }
        if (Math.abs(z - S.playerZ) < 14) return false;    // nowhere safe yet; try again shortly
        if (lastRelease > -1e9) stats.gaps.push(Math.round((now - lastRelease) / 100) / 10);
        lastRelease = now; released++; stats.released++;
        orig.call(window, item.x, z, item.type, item.choke);
        return true;
    }

    function tick(nowMs) {
        requestAnimationFrame(tick);
        if (!isEngineRoom()) { if (inEngineRoom) { inEngineRoom = false; held.length = 0; } return; }
        var countdown = g("isCountdownActive");
        if (countdown === true || !S.isRunning || S.isGameOver) return;
        var alive = aliveCount();
        if (alive > stats.maxAlive) stats.maxAlive = alive;
        if (!held.length) return;
        var now = nowMs;
        if (now - lastRelease < ENGINE_ROOM.GAP_SECONDS * 1000) return;
        if (alive >= ENGINE_ROOM.MAX_AT_ONCE) return;
        release(held[0], now) && held.shift();
    }
    requestAnimationFrame(tick);
    console.info("[Mountain Run] engine room tweak on: keep 1 in " + ENGINE_ROOM.KEEP_EVERY + ", " + ENGINE_ROOM.GAP_SECONDS + "s apart, at most " + ENGINE_ROOM.MAX_AT_ONCE + " at once");
})();
