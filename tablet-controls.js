/*
 * Mountain Run - tablet controls add-on.
 *
 * This file sits BESIDE the game's own files and never edits them.
 * It talks to the game only through these names from the game's code:
 *   state.moveForward / moveBackward / moveLeft / moveRight / isFiring
 *   state.aimYawOffset / aimPitch / isPerched / isRunning
 *   cycleWeapon(), toggle180Turn(), handleInteractKey(), renderer, canvas
 * If a new version of the game renames any of those, the build script warns,
 * and this file switches off only the feature that needs the missing name.
 *
 * What it does:
 *   - On a PC: hides the on-screen buttons. Keyboard and mouse are unchanged.
 *   - On a tablet: a thumb joystick bottom left; Fire, Swap, 180 and Use bottom right;
 *     look around by tilting the tablet (gyroscope) and/or dragging a finger;
 *     a settings panel; a "turn sideways" message; lighter graphics if it runs slowly;
 *     full screen on Android; offline play via the service worker.
 */
(function () {
    "use strict";

    var VERSION = (window.MOUNTAIN_RUN_BUILD && window.MOUNTAIN_RUN_BUILD.version) || "dev";
    var doc = document;
    var root = doc.documentElement;

    // ---------- 0. Safe access to the game's own names ----------
    function hasGlobal(name) {
        try { return typeof eval(name) !== "undefined"; } catch (e) { return false; }
    }
    function g(name) { try { return eval(name); } catch (e) { return undefined; } }
    var S = g("state");
    var missing = [];
    ["state", "renderer", "canvas", "cycleWeapon", "toggle180Turn", "handleInteractKey"].forEach(function (n) {
        if (!hasGlobal(n)) missing.push(n);
    });
    if (S) {
        ["moveForward", "moveBackward", "moveLeft", "moveRight", "isFiring", "aimYawOffset", "aimPitch", "isRunning"].forEach(function (k) {
            if (!(k in S)) missing.push("state." + k);
        });
    }
    if (missing.length) {
        console.warn("[Mountain Run tablet controls] game names not found, some features are off:", missing.join(", "));
    }
    var canMove = S && ("moveForward" in S);
    var canLook = S && ("aimYawOffset" in S) && ("aimPitch" in S);

    // ---------- 1. Settings, remembered on this device ----------
    var DEFAULTS = { tilt: true, tiltSens: 1.0, invertTilt: false, graphics: "auto", touchOverride: "auto" };
    var settings = {};
    try { settings = JSON.parse(localStorage.getItem("mountainRunSettings") || "{}") || {}; } catch (e) { settings = {}; }
    Object.keys(DEFAULTS).forEach(function (k) { if (!(k in settings)) settings[k] = DEFAULTS[k]; });
    function saveSettings() { try { localStorage.setItem("mountainRunSettings", JSON.stringify(settings)); } catch (e) {} }

    // ---------- 2. Is this a tablet (touch) or a PC? ----------
    var params = new URLSearchParams(location.search);
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    var isAndroid = /Android/i.test(navigator.userAgent);
    var coarse = false;
    try { coarse = window.matchMedia("(any-pointer: coarse)").matches; } catch (e) {}
    var isTouch = (navigator.maxTouchPoints > 1 && coarse) || isIOS || isAndroid;
    if (params.get("touch") === "1" || settings.touchOverride === "on") isTouch = true;
    if (params.get("touch") === "0" || settings.touchOverride === "off") isTouch = false;
    var isStandalone = (window.matchMedia && window.matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches) || navigator.standalone === true;

    root.classList.add(isTouch ? "mr-touch" : "mr-desktop");
    if (isIOS) root.classList.add("mr-ios");
    if (isStandalone) root.classList.add("mr-standalone");

    // ---------- 3. Small helpers ----------
    function el(tag, attrs, html) {
        var e = doc.createElement(tag);
        if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
        if (html != null) e.innerHTML = html;
        return e;
    }
    var toastTimer = null;
    var toastEl = el("div", { id: "mr-toast" });
    doc.body.appendChild(toastEl);
    function toast(msg, ms) {
        toastEl.textContent = msg;
        toastEl.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, ms || 3200);
    }

    // ---------- 3b. Crash guard for the haunted manor (applies on every device) ----------
    // The 23-Oct-26 version of the game stores each seal's position as seal.x / seal.z but reads it as
    // seal.worldPos.x / .z, which stops the manor from drawing. This fills in the missing
    // worldPos from the values the game already has. It changes no gameplay, and does nothing
    // once a new version of the game fixes the slip itself.
    var guardNotes = {};
    function fixSeals() {
        var seals = g("manorSeals");
        if (!seals || !seals.length) return;
        for (var i = 0; i < seals.length; i++) {
            var s = seals[i];
            if (s && !s.worldPos && typeof s.x === "number" && typeof s.z === "number") {
                s.worldPos = { x: s.x, z: s.z };
                if (!guardNotes.seal) { guardNotes.seal = true; console.info("[Mountain Run] manor seal position guard applied"); }
            }
            // The distance panel shows "Seal NaN/3" because each seal's number is never stored.
            if (s && typeof s.index !== "number") s.index = i;
        }
    }
    // Run straight after the game builds the seals, and every 100 ms as a back-up.
    if (typeof window.buildManorSealsAndGate === "function") {
        var origBuildSeals = window.buildManorSealsAndGate;
        try {
            window.buildManorSealsAndGate = function () { var r = origBuildSeals.apply(this, arguments); fixSeals(); return r; };
        } catch (e) {}
    }
    setInterval(fixSeals, 100);

    // On a PC nothing else is needed: the stylesheet hides the old on-screen buttons.
    if (!isTouch) { registerServiceWorker(); return; }

    // ---------- 4. Tablet controls ----------
    var modal = doc.getElementById("modal-status");
    if (modal) modal.textContent = "Tilt the tablet or drag the screen: look  |  Left thumb: move and 180  |  Right thumb: Fire, weapons, Swap, Use";
    var hint = doc.getElementById("touch-look-hint");
    if (hint) hint.textContent = "";

    var pad = el("div", { id: "mr-pad" });
    pad.innerHTML =
        '<div id="mr-stick" aria-label="Move"><div id="mr-stick-knob"></div><span class="mr-stick-label">MOVE</span></div>' +
        '<div id="mr-buttons">' +
        '  <button type="button" class="mr-btn" id="mr-fire" aria-label="Fire">FIRE</button>' +
        '  <button type="button" class="mr-btn" id="mr-swap" aria-label="Swap weapon">SWAP</button>' +
        '</div>' +
        '<button type="button" class="mr-btn" id="mr-use" aria-label="Use">USE</button>' +
        '<button type="button" class="mr-btn" id="mr-turn" aria-label="Turn round">180°</button>' +
        '<button type="button" id="mr-gear" aria-label="Settings">&#9881;</button>';
    doc.body.appendChild(pad);

    var rotateMsg = el("div", { id: "mr-rotate" }, '<div class="mr-rotate-box"><div class="mr-rotate-icon">&#8635;</div>Turn your tablet sideways to play</div>');
    doc.body.appendChild(rotateMsg);

    // Release everything (finger lifted off-screen, app switched away, notification, etc.)
    function releaseAll() {
        if (!S) return;
        S.moveForward = S.moveBackward = S.moveLeft = S.moveRight = false;
        S.isFiring = false;
        resetStick();
        [].forEach.call(doc.querySelectorAll(".mr-btn.down"), function (b) { b.classList.remove("down"); });
    }
    window.addEventListener("blur", releaseAll);
    doc.addEventListener("visibilitychange", function () { if (doc.hidden) releaseAll(); });

    // 4a. Joystick (left thumb). The game understands on/off directions, so the stick
    //     turns its position into forward/back/left/right, diagonals included.
    var stick = doc.getElementById("mr-stick");
    var knob = doc.getElementById("mr-stick-knob");
    var stickId = null, stickCx = 0, stickCy = 0, stickR = 60;
    function resetStick() {
        stickId = null;
        knob.style.transform = "translate(-50%, -50%)";
        stick.classList.remove("down");
        if (S && canMove) { S.moveForward = S.moveBackward = S.moveLeft = S.moveRight = false; }
    }
    function moveStick(x, y) {
        var dx = x - stickCx, dy = y - stickCy;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d > stickR) { dx = dx / d * stickR; dy = dy / d * stickR; }
        knob.style.transform = "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px))";
        if (!S || !canMove) return;
        var nx = dx / stickR, ny = dy / stickR, T = 0.38;
        S.moveForward = ny < -T;
        S.moveBackward = ny > T;
        S.moveLeft = nx < -T;
        S.moveRight = nx > T;
    }
    stick.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        if (stickId !== null) return;
        stickId = e.pointerId;
        try { stick.setPointerCapture(e.pointerId); } catch (err) {}
        var r = stick.getBoundingClientRect();
        stickCx = r.left + r.width / 2; stickCy = r.top + r.height / 2; stickR = r.width * 0.36;
        stick.classList.add("down");
        moveStick(e.clientX, e.clientY);
    });
    stick.addEventListener("pointermove", function (e) { if (e.pointerId === stickId) { e.preventDefault(); moveStick(e.clientX, e.clientY); } });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (t) {
        stick.addEventListener(t, function (e) { if (e.pointerId === stickId) resetStick(); });
    });

    // 4b. Action buttons (right thumb).
    function bindBtn(id, onDown, onUp) {
        var b = doc.getElementById(id);
        var active = {};
        b.addEventListener("pointerdown", function (e) {
            e.preventDefault(); e.stopPropagation();
            active[e.pointerId] = true;
            try { b.setPointerCapture(e.pointerId); } catch (err) {}
            b.classList.add("down");
            if (navigator.vibrate) { try { navigator.vibrate(8); } catch (err) {} }
            try { onDown(); } catch (err) { console.warn(err); }
        });
        ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (t) {
            b.addEventListener(t, function (e) {
                if (!active[e.pointerId]) return;
                delete active[e.pointerId];
                b.classList.remove("down");
                if (onUp) { try { onUp(); } catch (err) {} }
            });
        });
        b.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    }
    bindBtn("mr-fire", function () { if (S) S.isFiring = true; }, function () { if (S) S.isFiring = false; });
    bindBtn("mr-swap", function () { var f = g("cycleWeapon"); if (f) f(); });
    bindBtn("mr-turn", function () { var f = g("toggle180Turn"); if (f) f(); });
    bindBtn("mr-use", function () { var f = g("handleInteractKey"); if (f) f(); });

    // Make the Use and 180 buttons glow when the game is asking for them.
    var useBtn = doc.getElementById("mr-use"), turnBtn = doc.getElementById("mr-turn");
    var interactPrompt = doc.getElementById("interact-prompt"), rearWarning = doc.getElementById("rear-warning");
    // Layout requested by Richard (25-Oct-26): the weapon panel sits on the right above FIRE,
    // and USE sits directly above the weapon panel.
    var weaponCard = doc.querySelector(".hud-card-weapon");
    function placeUse() {
        if (!weaponCard) return;
        var r = weaponCard.getBoundingClientRect();
        if (!r.width) return;
        var w = useBtn.offsetWidth || 76;
        useBtn.style.bottom = Math.round(window.innerHeight - r.top + 10) + "px";
        useBtn.style.right = Math.round(window.innerWidth - r.right + (r.width - w) / 2) + "px";
    }
    placeUse();
    window.addEventListener("resize", function () { setTimeout(placeUse, 60); });
    setInterval(function () {
        placeUse();
        if (interactPrompt) useBtn.classList.toggle("ask", interactPrompt.style.display === "block");
        if (rearWarning) turnBtn.classList.toggle("ask", rearWarning.style.display === "block");
    }, 200);

    // A tap on the 3D view must not count as a mouse click (the game fires on mouse click).
    var lastTouchAt = 0;
    window.addEventListener("touchstart", function () { lastTouchAt = Date.now(); }, { capture: true, passive: true });
    window.addEventListener("mousedown", function (e) {
        if (Date.now() - lastTouchAt < 1200) { e.stopImmediatePropagation(); }
    }, true);

    // Wake the game's sound up again after the tablet has slept.
    doc.addEventListener("pointerdown", function () {
        var snd = g("sound");
        try { if (snd && snd.ctx && snd.ctx.state === "suspended") snd.ctx.resume(); } catch (e) {}
    }, true);

    // ---------- 5. Tilt to look (gyroscope) ----------
    // Turning the tablet turns the view by the same angle, like looking through a window.
    // Works by change: each reading adds the difference since the last one, so finger-drag
    // and tilt can be used together and nothing ever needs re-centring.
    var tiltState = { listening: false, gotData: false, prevYaw: null, prevPitch: null };
    var Q = (typeof THREE !== "undefined") ? {
        q: new THREE.Quaternion(), q0: new THREE.Quaternion(), q1: new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)),
        e: new THREE.Euler(), z: new THREE.Vector3(0, 0, 1), f: new THREE.Vector3(), u: new THREE.Vector3()
    } : null;
    var DEG = Math.PI / 180;
    function screenAngle() {
        if (screen.orientation && typeof screen.orientation.angle === "number") return screen.orientation.angle;
        if (typeof window.orientation === "number") return window.orientation;
        return 0;
    }
    function wrap(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
    function onOrientation(ev) {
        if (ev.alpha == null || ev.beta == null || ev.gamma == null || !Q) return;
        tiltState.gotData = true;
        // Device orientation -> camera orientation (same maths as Three.js DeviceOrientationControls)
        Q.e.set(ev.beta * DEG, ev.alpha * DEG, -ev.gamma * DEG, "YXZ");
        Q.q.setFromEuler(Q.e);
        Q.q.multiply(Q.q1);
        Q.q.multiply(Q.q0.setFromAxisAngle(Q.z, -screenAngle() * DEG));
        Q.f.set(0, 0, -1).applyQuaternion(Q.q);   // where the screen looks
        Q.u.set(0, 1, 0).applyQuaternion(Q.q);    // top edge of the screen
        // Heading: when the tablet is tipped back (looking down), the top edge points the
        // same way as the view, so adding it keeps the heading steady even close to flat.
        var hx = -Q.f.x, hz = -Q.f.z;
        if (Q.f.y < 0) { hx += -Q.u.x * (-Q.f.y); hz += -Q.u.z * (-Q.f.y); }
        var yaw = Math.atan2(hx, hz);
        var pitch = Math.asin(Math.max(-1, Math.min(1, Q.f.y)));
        if (tiltState.prevYaw === null) { tiltState.prevYaw = yaw; tiltState.prevPitch = pitch; return; }
        var dYaw = wrap(yaw - tiltState.prevYaw), dPitch = pitch - tiltState.prevPitch;
        tiltState.prevYaw = yaw; tiltState.prevPitch = pitch;
        if (Math.abs(dYaw) > 0.6 || Math.abs(dPitch) > 0.6) return;   // ignore jumps (screen rotating, sensor glitch)
        if (!settings.tilt || !canLook || !S || !S.isRunning || S.isGameOver) return;
        var k = settings.tiltSens * (settings.invertTilt ? -1 : 1);
        S.aimYawOffset += dYaw * k;
        var minPitch = S.isPerched ? -1.35 : -0.85;
        S.aimPitch = Math.max(minPitch, Math.min(0.85, S.aimPitch + dPitch * k));
    }
    function resetTiltBaseline() { tiltState.prevYaw = null; tiltState.prevPitch = null; }
    window.addEventListener("orientationchange", resetTiltBaseline);
    if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener("change", resetTiltBaseline);

    function startTiltListening() {
        if (tiltState.listening) return;
        tiltState.listening = true;
        window.addEventListener("deviceorientation", onOrientation);
    }
    function checkTiltArrives() {
        setTimeout(function () {
            if (!tiltState.gotData && settings.tilt && S && S.isRunning) toast("No tilt signal from this device. Drag the screen to look around.", 4500);
        }, 3000);
    }
    // iPad needs one tap on "Allow" (Apple's rule); it must be asked from a button press.
    function askForTilt(fromUser) {
        // Ask on ANY device that offers the permission step (an iPad can pretend to be a Mac, so
        // never rely only on recognising it). On Android the step is not needed: if it is refused
        // or fails there, listen anyway.
        var hasAsk = typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function";
        if (hasAsk) {
            DeviceOrientationEvent.requestPermission().then(function (answer) {
                if (answer === "granted" || !isIOS) { startTiltListening(); }
                else {
                    settings.tilt = false; saveSettings(); syncPanel();
                    toast("Tilt is off (motion access was not allowed). Drag the screen to look around.", 5000);
                }
            }).catch(function () {
                if (!isIOS) { startTiltListening(); return; }
                if (fromUser) toast("Tilt needs a tap on Allow. Try the Tilt switch in Settings.", 4500);
            });
        } else {
            startTiltListening();
        }
    }

    // ---------- 6. Start button extras: tilt permission, full screen, graphics ----------
    var startBtn = doc.getElementById("start-btn");
    if (startBtn) {
        startBtn.addEventListener("click", function () {
            if (settings.tilt) askForTilt(true);
            if (!isIOS && !isStandalone && root.requestFullscreen && !doc.fullscreenElement) {
                root.requestFullscreen({ navigationUI: "hide" }).then(function () {
                    if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(function () {});
                }).catch(function () {});
            }
            resetTiltBaseline();
            if (settings.tilt) checkTiltArrives();
            startFpsWatch();
        });
    }
    if (settings.tilt && !isIOS) {
        startTiltListening();   // Android: no permission step needed
    }

    // ---------- 7. Graphics: sharp enough to look good, light enough to run smoothly ----------
    var R = g("renderer");
    var dpr = window.devicePixelRatio || 1;
    var LEVELS = [2, 1.75, 1.5, 1.25, 1, 0.85];
    var ratio = 1.5;
    function applyRatio(r) {
        ratio = Math.min(r, dpr);
        if (R && R.setPixelRatio) { try { R.setPixelRatio(ratio); R.setSize(window.innerWidth, window.innerHeight); } catch (e) {} }
    }
    function graphicsStartRatio() {
        if (settings.graphics === "sharp") return Math.min(2, dpr);
        if (settings.graphics === "fast") return 1;
        return Math.min(1.5, dpr);
    }
    applyRatio(graphicsStartRatio());
    window.addEventListener("resize", function () { setTimeout(function () { applyRatio(ratio); }, 50); });
    var fpsWatching = false;
    function startFpsWatch() {
        if (fpsWatching) return; fpsWatching = true;
        var frames = 0, t0 = performance.now(), slowWindows = 0;
        function tick(now) {
            frames++;
            if (now - t0 >= 3000) {
                var fps = frames * 1000 / (now - t0);
                frames = 0; t0 = now;
                if (settings.graphics === "auto" && S && S.isRunning && !doc.hidden) {
                    slowWindows = fps < 42 ? slowWindows + 1 : 0;
                    if (slowWindows >= 2) {
                        var i = LEVELS.indexOf(ratio); if (i < 0) i = 2;
                        if (i < LEVELS.length - 1) { applyRatio(LEVELS[i + 1]); }
                        slowWindows = 0;
                    }
                }
                window.__mrFps = Math.round(fps);
            }
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // ---------- 8. Settings panel ----------
    var panel = el("div", { id: "mr-panel", role: "dialog", "aria-label": "Settings" });
    panel.innerHTML =
        '<div class="mr-panel-box">' +
        '<div class="mr-panel-title">SETTINGS</div>' +
        '<label class="mr-row"><span>Tilt to look</span><input type="checkbox" id="mr-set-tilt"></label>' +
        '<div class="mr-row"><span>Tilt speed</span><span class="mr-seg" id="mr-set-sens">' +
        '<button data-v="0.7">Slow</button><button data-v="1">Normal</button><button data-v="1.5">Fast</button><button data-v="2.2">Super</button></span></div>' +
        '<label class="mr-row"><span>Flip tilt direction</span><input type="checkbox" id="mr-set-invert"></label>' +
        '<div class="mr-row"><span>Graphics</span><span class="mr-seg" id="mr-set-gfx">' +
        '<button data-v="auto">Auto</button><button data-v="sharp">Sharp</button><button data-v="fast">Smooth</button></span></div>' +
        '<div class="mr-row mr-row-btns"><button type="button" id="mr-set-full">Full screen</button><button type="button" id="mr-set-close">Back to game</button></div>' +
        '<div class="mr-panel-foot">Version ' + VERSION + '</div>' +
        '</div>';
    doc.body.appendChild(panel);
    var gear = doc.getElementById("mr-gear");
    function syncPanel() {
        doc.getElementById("mr-set-tilt").checked = !!settings.tilt;
        doc.getElementById("mr-set-invert").checked = !!settings.invertTilt;
        [].forEach.call(doc.querySelectorAll("#mr-set-sens button"), function (b) { b.classList.toggle("on", Math.abs(parseFloat(b.dataset.v) - settings.tiltSens) < 0.01); });
        [].forEach.call(doc.querySelectorAll("#mr-set-gfx button"), function (b) { b.classList.toggle("on", b.dataset.v === settings.graphics); });
        var fsBtn = doc.getElementById("mr-set-full");
        fsBtn.style.display = (isIOS || isStandalone || !root.requestFullscreen) ? "none" : "";
    }
    syncPanel();
    gear.addEventListener("pointerdown", function (e) { e.preventDefault(); e.stopPropagation(); releaseAll(); syncPanel(); panel.classList.add("open"); });
    panel.addEventListener("pointerdown", function (e) { e.stopPropagation(); if (e.target === panel) panel.classList.remove("open"); });
    doc.getElementById("mr-set-close").addEventListener("click", function () { panel.classList.remove("open"); resetTiltBaseline(); });
    doc.getElementById("mr-set-tilt").addEventListener("change", function (e) {
        settings.tilt = e.target.checked; saveSettings(); resetTiltBaseline();
        if (settings.tilt) askForTilt(true);
    });
    doc.getElementById("mr-set-invert").addEventListener("change", function (e) { settings.invertTilt = e.target.checked; saveSettings(); });
    doc.getElementById("mr-set-sens").addEventListener("click", function (e) {
        var v = e.target && e.target.dataset && e.target.dataset.v; if (!v) return;
        settings.tiltSens = parseFloat(v); saveSettings(); syncPanel();
    });
    doc.getElementById("mr-set-gfx").addEventListener("click", function (e) {
        var v = e.target && e.target.dataset && e.target.dataset.v; if (!v) return;
        settings.graphics = v; saveSettings(); syncPanel(); applyRatio(graphicsStartRatio());
    });
    doc.getElementById("mr-set-full").addEventListener("click", function () {
        if (doc.fullscreenElement) { doc.exitFullscreen().catch(function () {}); }
        else if (root.requestFullscreen) { root.requestFullscreen({ navigationUI: "hide" }).catch(function () {}); }
    });

    // For testing in a desktop browser.
    window.__mountainRunTablet = { settings: settings, releaseAll: releaseAll, onOrientation: onOrientation, tiltState: tiltState, applyRatio: applyRatio, ratio: function () { return ratio; }, missing: missing };

    registerServiceWorker();

    // ---------- 9. Offline play ----------
    function registerServiceWorker() {
        if (!("serviceWorker" in navigator)) return;
        if (!(location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) return;
        if (params.get("nosw") === "1") return;
        window.addEventListener("load", function () {
            navigator.serviceWorker.register("sw.js").catch(function (e) { console.warn("[Mountain Run] offline mode not available:", e); });
        });
    }
})();
