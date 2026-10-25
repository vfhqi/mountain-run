"use strict";

// Defensive DOM Helper Utilities
function getEl(id) {
    return document.getElementById(id);
}

function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function safeSetDisplay(id, display) {
    const el = document.getElementById(id);
    if (el) el.style.display = display;
}

function safeSetColor(id, color) {
    const el = document.getElementById(id);
    if (el) el.style.color = color;
}

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.waterGain = null;
        this.waterFilter = null;
        this.isStreaming = false;
        this.windGain = null;
        this.windFilter = null;
        this.windActive = false;
        this.bossDroneOsc = null;
        this.bossDroneGain = null;
        this.bossDroneFilter = null;
    }

    init() {
        if (this.ctx) {
            if (this.ctx.state === "suspended") this.ctx.resume();
            return;
        }
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();

        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        this.waterFilter = this.ctx.createBiquadFilter();
        this.waterFilter.type = "bandpass";
        this.waterFilter.frequency.value = 2600;
        this.waterFilter.Q.value = 1.4;

        this.waterGain = this.ctx.createGain();
        this.waterGain.gain.value = 0.0;

        whiteNoise.connect(this.waterFilter);
        this.waterFilter.connect(this.waterGain);
        this.waterGain.connect(this.ctx.destination);
        whiteNoise.start(0);

        const windNoise = this.ctx.createBufferSource();
        windNoise.buffer = noiseBuffer;
        windNoise.loop = true;

        this.windFilter = this.ctx.createBiquadFilter();
        this.windFilter.type = "bandpass";
        this.windFilter.frequency.value = 420;
        this.windFilter.Q.value = 3.2;

        this.windGain = this.ctx.createGain();
        this.windGain.gain.value = 0.0;

        windNoise.connect(this.windFilter);
        this.windFilter.connect(this.windGain);
        this.windGain.connect(this.ctx.destination);
        windNoise.start(0);
    }

    setMountainWind(active, elapsedSeconds = 0) {
        if (!this.ctx || !this.windGain) return;
        const now = this.ctx.currentTime;
        if (active) {
            if (!this.windActive) {
                this.windActive = true;
                this.windGain.gain.setTargetAtTime(0.09, now, 0.5);
            }
            const gustFreq = 340 + Math.sin(elapsedSeconds * 0.75) * 140 + Math.cos(elapsedSeconds * 1.9) * 65;
            const gustGain = 0.07 + Math.abs(Math.sin(elapsedSeconds * 0.45)) * 0.065;
            this.windFilter.frequency.setTargetAtTime(gustFreq, now, 0.12);
            this.windGain.gain.setTargetAtTime(gustGain, now, 0.15);
        } else if (this.windActive) {
            this.windActive = false;
            this.windGain.gain.setTargetAtTime(0.0, now, 0.3);
        }
    }

    setWaterStream(active) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        if (active && !this.isStreaming) {
            this.isStreaming = true;
            this.waterGain.gain.cancelScheduledValues(now);
            this.waterGain.gain.setTargetAtTime(0.16, now, 0.03);
            this.waterFilter.frequency.setTargetAtTime(2900, now, 0.06);
        } else if (!active && this.isStreaming) {
            this.isStreaming = false;
            this.waterGain.gain.cancelScheduledValues(now);
            this.waterGain.gain.setTargetAtTime(0.0, now, 0.04);
        }
    }

    playFartWobble() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const carrier = this.ctx.createOscillator();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        const mainGain = this.ctx.createGain();

        carrier.type = "sawtooth";
        carrier.frequency.setValueAtTime(92, now);
        carrier.frequency.exponentialRampToValueAtTime(46, now + 0.22);
        lfo.type = "sine";
        lfo.frequency.setValueAtTime(22, now);
        lfoGain.gain.setValueAtTime(28, now);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(340, now);
        mainGain.gain.setValueAtTime(0.24, now);
        mainGain.gain.exponentialRampToValueAtTime(0.005, now + 0.23);

        lfo.connect(lfoGain);
        lfoGain.connect(carrier.frequency);
        carrier.connect(filter);
        filter.connect(mainGain);
        mainGain.connect(this.ctx.destination);
        carrier.start(now);
        lfo.start(now);
        carrier.stop(now + 0.24);
        lfo.stop(now + 0.24);
    }

    playTorchBeam() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1480, now + 0.08);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
    }

    playSlingshotTwang() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(165, now);
        osc.frequency.exponentialRampToValueAtTime(390, now + 0.09);
        osc.frequency.exponentialRampToValueAtTime(130, now + 0.19);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.21);
    }

    playDeflect() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(190, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
    }

    playSplash() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        const baseFreq = 360 + Math.random() * 240;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.7, now + 0.055);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    playSparkHazard() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const mod = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        const mainGain = this.ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(65, now + 0.45);
        mod.type = "square";
        mod.frequency.setValueAtTime(55, now);
        modGain.gain.setValueAtTime(400, now);
        mainGain.gain.setValueAtTime(0.35, now);
        mainGain.gain.exponentialRampToValueAtTime(0.005, now + 0.45);

        mod.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(mainGain);
        mainGain.connect(this.ctx.destination);
        osc.start(now);
        mod.start(now);
        osc.stop(now + 0.46);
        mod.stop(now + 0.46);
    }

    playKindnessComplete() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, now + idx * 0.055);
            gain.gain.setValueAtTime(0.14, now + idx * 0.055);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.055);
            osc.stop(now + idx * 0.055 + 0.26);
        });
    }

    playPickupRaincoat() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playQuickTurn() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.09);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    initSpecterAudio() {
        if (!this.ctx || this.bossDroneOsc) return;
        this.bossDroneOsc = this.ctx.createOscillator();
        this.bossDroneGain = this.ctx.createGain();
        this.bossDroneFilter = this.ctx.createBiquadFilter();
        this.bossDroneOsc.type = "sawtooth";
        this.bossDroneOsc.frequency.value = 58;
        this.bossDroneFilter.type = "lowpass";
        this.bossDroneFilter.frequency.value = 180;
        this.bossDroneGain.gain.value = 0.0;
        this.bossDroneOsc.connect(this.bossDroneFilter);
        this.bossDroneFilter.connect(this.bossDroneGain);
        this.bossDroneGain.connect(this.ctx.destination);
        this.bossDroneOsc.start(0);
    }

    setBossDrone(active, intensity = 0.18) {
        if (!this.ctx) return;
        this.initSpecterAudio();
        const now = this.ctx.currentTime;
        if (active) {
            this.bossDroneGain.gain.cancelScheduledValues(now);
            this.bossDroneGain.gain.setTargetAtTime(intensity, now, 0.4);
        } else if (this.bossDroneGain) {
            this.bossDroneGain.gain.cancelScheduledValues(now);
            this.bossDroneGain.gain.setTargetAtTime(0.0, now, 0.2);
        }
    }

    playBossShockwave() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.65);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.exponentialRampToValueAtTime(70, now + 0.6);
        gain.gain.setValueAtTime(0.42, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.7);
    }

    playBossPhaseShift() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const chords = [220, 277.18, 329.63, 440, 554.37];
        chords.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, now + idx * 0.04);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + idx * 0.04 + 0.4);
            gain.gain.setValueAtTime(0.18, now + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.45);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.04);
            osc.stop(now + idx * 0.04 + 0.48);
        });
    }

    playActionVoiceChime() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const freqs = [587.33, 880.0]; // Action tactical two-tone radio alert (D5 -> A5)
        freqs.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(f, now + i * 0.055);
            gain.gain.setValueAtTime(0.08, now + i * 0.055);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.09);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.055);
            osc.stop(now + i * 0.055 + 0.095);
        });
    }

    getBestActionVoice() {
        if (!window.speechSynthesis) return null;
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return null;

        // Prioritize natural/neural/enhanced English voices over flat legacy robotic voices
        const preferredKeywords = [
            "Natural", "Online", "Neural", "Premium", "Enhanced",
            "Samantha", "Ava", "Evan", "Nathan", "Tom", "Daniel", "Alex", "Aaron", "Google US English", "Google UK English Male"
        ];
        const englishVoices = voices.filter(v => /^en(-|_|$)/i.test(v.lang));
        const pool = englishVoices.length > 0 ? englishVoices : voices;

        for (let k = 0; k < preferredKeywords.length; k++) {
            const kw = preferredKeywords[k].toLowerCase();
            const match = pool.find(v => v.name.toLowerCase().includes(kw));
            if (match) return match;
        }
        return pool[0];
    }

    formatActionCallout(rawText) {
        if (!rawText) return "";
        // Strip bracketed keybind hints like [SPACE], [Q], [E], parens, and symbols so TTS never reads out robotic punctuation!
        let cleaned = rawText
            .replace(/\[[^\]]*\]/g, "")
            .replace(/\([^)]*\)/g, "")
            .replace(/\+2 LIVES RESTORED!/gi, "Bonus lives restored!")
            .replace(/180 Turn/gi, "turn around")
            .replace(/&/g, " and ")
            .replace(/\s+/g, " ")
            .trim();

        // Map long instructional banners to punchy, high-energy arcade action callouts!
        const lower = cleaned.toLowerCase();
        if (lower.includes("carriage 1")) {
            return "Carriage One! Six zombies ahead! Blast blue with Water and green with Fart Gun!";
        }
        if (lower.includes("carriage 2")) {
            return "Carriage Two! Monsters closing in from front and behind! Spin around and fire!";
        }
        if (lower.includes("carriage 3")) {
            return "Carriage Three! Ghosts in the corridor! Light them up with your Special Torch!";
        }
        if (lower.includes("carriage 4")) {
            return "Carriage Four! Vampires and Ghosts attacking! Load the Garlic Slingshot!";
        }
        if (lower.includes("engine room:")) {
            return "Engine Room! Watch the roaring boiler and take the side catwalks to the nose door!";
        }
        if (lower.includes("mid-carriage")) {
            return "Incoming wave! Reinforcements charging ahead and behind!";
        }
        if (lower.includes("carriage ambush")) {
            return "Ambush! Enemies closing in fast! Watch your six!";
        }
        if (lower.includes("late-carriage")) {
            return "Heavy swarm ahead! Clear the corridor!";
        }
        if (lower.includes("doorway guard")) {
            return "Exit guards spotted ahead! Blast your way through!";
        }
        if (lower.includes("final steam train stand")) {
            return "Final Engine Room wave! Defeat the horde and breach the nose door!";
        }
        if (lower.includes("cross the mountain pass")) {
            return "Mountain Pass! Sprint for the glowing pine trees and snipe the horde from above!";
        }
        if (lower.includes("swarm ahead")) {
            return "Swarm incoming! Climb the pine tree perch now!";
        }
        if (lower.includes("haunted manor") || lower.includes("three cursed seals")) {
            return "Blackwood Manor! Follow the glowing trail to shatter all three Cursed Seals and unlock the Boss Sanctum!";
        }
        if (lower.includes("seal purified") || lower.includes("seal broken")) {
            return "Cursed Seal destroyed! Follow the cyan trail to the next wing!";
        }
        if (lower.includes("sanctum unlocked")) {
            return "All three Seals broken! The Central Sanctum is open! Confront Lord Malakor!";
        }
        if (lower.includes("phase 1") || lower.includes("spectral shroud")) {
            return "Lord Malakor! Phase One: Spectral Shroud! Equip your Special Torch and blast his gold core!";
        }
        if (lower.includes("phase 2") || lower.includes("vampiric blood")) {
            return "Phase Two: Vampiric Blood Shield! Switch to the Garlic Slingshot and shatter his barrier!";
        }
        if (lower.includes("phase 3") || lower.includes("necrotic plague")) {
            return "Phase Three: Necrotic Plague Cloud! Switch to the Fart Gun and neutralize his toxic core!";
        }
        if (lower.includes("phase 4") || lower.includes("hellfire meltdown")) {
            return "Final Phase: Hellfire Meltdown! Switch to the Water Gun and douse Lord Malakor!";
        }
        return cleaned;
    }

    speakNarrative(text, rateBoost = 1.16, pitchVal = 1.04) {
        if (!window.speechSynthesis) return;
        this.playActionVoiceChime();
        window.speechSynthesis.cancel();
        const callout = this.formatActionCallout(text);
        if (!callout) return;

        const utterance = new SpeechSynthesisUtterance(callout);
        const bestVoice = this.getBestActionVoice();
        if (bestVoice) utterance.voice = bestVoice;
        utterance.rate = rateBoost;
        utterance.pitch = pitchVal;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

function createFaceTexture(bgColor, mode) {
    const canvas = document.createElement("canvas");
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // Base atmospheric radial shading
    const grad = ctx.createRadialGradient(128, 120, 18, 128, 128, 155);
    grad.addColorStop(0, bgColor);
    grad.addColorStop(0.75, bgColor);
    grad.addColorStop(1, "#090c10");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    if (mode === "BOSS") {
        // LORD MALAKOR — DREAD ARCH-SPECTER SKULL VISAGE
        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = 5;
        ctx.shadowColor = "#ffd166";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(128, 20); ctx.lineTo(106, 58); ctx.lineTo(150, 58); ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(128, 45, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = "#050208";
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(32, 76); ctx.lineTo(116, 104);
        ctx.moveTo(224, 76); ctx.lineTo(140, 104);
        ctx.stroke();

        ctx.fillStyle = "#040108";
        ctx.beginPath();
        ctx.ellipse(80, 106, 30, 22, 0.22, 0, Math.PI * 2);
        ctx.ellipse(176, 106, 30, 22, -0.22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ff2a2a";
        ctx.shadowColor = "#ff0055";
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.ellipse(80, 106, 18, 10, 0.2, 0, Math.PI * 2);
        ctx.ellipse(176, 106, 18, 10, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffd166";
        ctx.beginPath();
        ctx.ellipse(80, 106, 5, 9, 0, 0, Math.PI * 2);
        ctx.ellipse(176, 106, 5, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#040108";
        ctx.beginPath();
        ctx.moveTo(128, 116); ctx.lineTo(112, 148); ctx.lineTo(144, 148);
        ctx.closePath();
        ctx.fill();

        const mawGrad = ctx.createRadialGradient(128, 192, 6, 128, 192, 58);
        mawGrad.addColorStop(0, "#00f5d4");
        mawGrad.addColorStop(0.5, "#1a0526");
        mawGrad.addColorStop(1, "#040108");
        ctx.fillStyle = mawGrad;
        ctx.beginPath();
        ctx.rect(50, 162, 156, 62);
        ctx.fill();

        ctx.fillStyle = "#e2d4f0";
        for (let tx = 56; tx < 198; tx += 18) {
            ctx.beginPath();
            ctx.moveTo(tx, 162); ctx.lineTo(tx + 9, 190); ctx.lineTo(tx + 18, 162);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(tx + 2, 224); ctx.lineTo(tx + 9, 198); ctx.lineTo(tx + 16, 224);
            ctx.fill();
        }
    } else if (mode === "GHOST") {
        // Eerie translucent skull shroud & ectoplasmic mist
        const aura = ctx.createRadialGradient(128, 118, 10, 128, 128, 120);
        aura.addColorStop(0, "rgba(210, 250, 255, 0.55)");
        aura.addColorStop(0.6, "rgba(0, 245, 212, 0.22)");
        aura.addColorStop(1, "rgba(6, 13, 26, 0.92)");
        ctx.fillStyle = aura;
        ctx.fillRect(0, 0, 256, 256);

        // Gaunt skull cheekbone shadows
        ctx.fillStyle = "rgba(4, 10, 20, 0.65)";
        ctx.beginPath();
        ctx.ellipse(54, 155, 22, 42, 0.25, 0, Math.PI * 2);
        ctx.ellipse(202, 155, 22, 42, -0.25, 0, Math.PI * 2);
        ctx.fill();

        // Weeping cyan ectoplasm streaks from eye sockets
        ctx.fillStyle = "rgba(0, 245, 212, 0.45)";
        [[82, 120], [174, 120]].forEach(([ex, ey]) => {
            ctx.beginPath();
            ctx.moveTo(ex - 8, ey);
            ctx.quadraticCurveTo(ex - 4, ey + 52, ex, ey + 85);
            ctx.quadraticCurveTo(ex + 6, ey + 52, ex + 8, ey);
            ctx.fill();
        });

        // Deep abyssal eye sockets
        ctx.fillStyle = "#03070e";
        ctx.beginPath();
        ctx.ellipse(82, 96, 26, 33, -0.14, 0, Math.PI * 2);
        ctx.ellipse(174, 96, 26, 33, 0.14, 0, Math.PI * 2);
        ctx.fill();

        // Glowing soul-fire pupils
        ctx.shadowColor = "#00f5d4";
        ctx.shadowBlur = 16;
        ctx.fillStyle = "#00f5d4";
        ctx.beginPath();
        ctx.arc(82, 96, 9, 0, Math.PI * 2);
        ctx.arc(174, 96, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(82, 96, 4, 0, Math.PI * 2);
        ctx.arc(174, 96, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Skeletal nasal cavity
        ctx.fillStyle = "#040811";
        ctx.beginPath();
        ctx.moveTo(128, 114);
        ctx.lineTo(116, 140);
        ctx.lineTo(140, 140);
        ctx.closePath();
        ctx.fill();

        // Banshee wailing jaw & spectral teeth
        ctx.fillStyle = "#03070e";
        ctx.beginPath();
        ctx.ellipse(128, 188, 30, 42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 245, 212, 0.65)";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "rgba(210, 250, 255, 0.8)";
        for (let tx = 104; tx <= 152; tx += 8) {
            ctx.beginPath();
            ctx.moveTo(tx, 152);
            ctx.lineTo(tx + 4, 168);
            ctx.lineTo(tx + 8, 152);
            ctx.fill();
        }
    } else if (mode === "VAMPIRE") {
        // Aristocratic corpse-pallor skin with gaunt contour shading
        const vGrad = ctx.createLinearGradient(0, 0, 0, 256);
        vGrad.addColorStop(0, "#e2dced");
        vGrad.addColorStop(0.6, "#c9bfd9");
        vGrad.addColorStop(1, "#8f82a3");
        ctx.fillStyle = vGrad;
        ctx.fillRect(10, 10, 236, 236);

        // Gaunt hollow cheeks
        ctx.fillStyle = "rgba(42, 24, 56, 0.38)";
        ctx.beginPath();
        ctx.moveTo(28, 130); ctx.quadraticCurveTo(68, 165, 58, 225); ctx.lineTo(24, 225); ctx.closePath();
        ctx.moveTo(228, 130); ctx.quadraticCurveTo(188, 165, 198, 225); ctx.lineTo(232, 225); ctx.closePath();
        ctx.fill();

        // Slicked-back obsidian hair with sharp Widow's Peak
        ctx.fillStyle = "#0a0710";
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(256, 0); ctx.lineTo(256, 62);
        ctx.quadraticCurveTo(190, 45, 128, 96);
        ctx.quadraticCurveTo(66, 45, 0, 62);
        ctx.closePath();
        ctx.fill();

        // Dark sunken eye rings
        ctx.fillStyle = "rgba(38, 12, 34, 0.65)";
        ctx.beginPath();
        ctx.ellipse(82, 106, 24, 19, -0.1, 0, Math.PI * 2);
        ctx.ellipse(174, 106, 24, 19, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Severe demonic scowling brows
        ctx.strokeStyle = "#0d0914";
        ctx.lineWidth = 9;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(46, 76); ctx.lineTo(110, 96);
        ctx.moveTo(210, 76); ctx.lineTo(146, 96);
        ctx.stroke();

        // Hypnotic blood-crimson eyes with golden-slit pupils
        ctx.shadowColor = "#ff002b";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#d90429";
        ctx.beginPath();
        ctx.arc(82, 106, 15, 0, Math.PI * 2);
        ctx.arc(174, 106, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ffd166";
        ctx.beginPath();
        ctx.ellipse(82, 106, 3.5, 12, 0, 0, Math.PI * 2);
        ctx.ellipse(174, 106, 3.5, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Aquiline nose shading
        ctx.strokeStyle = "rgba(50, 35, 65, 0.6)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(128, 96); ctx.lineTo(122, 146); ctx.lineTo(136, 148);
        ctx.stroke();

        // Snarling blood-stained mouth Cavity
        ctx.fillStyle = "#24050e";
        ctx.beginPath();
        ctx.moveTo(68, 174);
        ctx.quadraticCurveTo(128, 160, 188, 174);
        ctx.quadraticCurveTo(128, 212, 68, 174);
        ctx.closePath();
        ctx.fill();

        // Long razor-sharp Vampire Fangs & smaller incisors
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#3b000b";
        ctx.lineWidth = 2;
        [
            [82, 172, 92, 218, 104, 174],
            [152, 174, 164, 218, 174, 172],
            [106, 173, 113, 190, 120, 173],
            [136, 173, 143, 190, 150, 173]
        ].forEach(([x1, y1, x2, y2, x3, y3]) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        });

        // Fresh crimson blood drips on fang tips
        ctx.fillStyle = "#e60026";
        ctx.beginPath();
        ctx.arc(92, 215, 4.5, 0, Math.PI * 2);
        ctx.arc(164, 215, 4.5, 0, Math.PI * 2);
        ctx.fill();
    } else {
        const isSmiling = mode === "SMILE";
        ctx.fillStyle = bgColor;
        ctx.fillRect(10, 10, 236, 236);

        if (!isSmiling) {
            // Necrotic veins & decaying skin mottling
            ctx.strokeStyle = "rgba(12, 22, 18, 0.45)";
            ctx.lineWidth = 3;
            [
                [18, 30, 55, 70, 42, 110],
                [235, 40, 195, 80, 212, 125],
                [35, 190, 70, 165, 55, 230],
                [220, 195, 185, 170, 200, 235]
            ].forEach(([x1, y1, x2, y2, x3, y3]) => {
                ctx.beginPath();
                ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
                ctx.stroke();
            });

            // Deep surgical forehead scar & iron staples
            ctx.strokeStyle = "#1b0d14";
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(38, 44);
            ctx.quadraticCurveTo(95, 64, 152, 48);
            ctx.stroke();
            ctx.lineWidth = 4;
            for (let sx = 48; sx <= 142; sx += 15) {
                ctx.beginPath();
                ctx.moveTo(sx, 36);
                ctx.lineTo(sx - 4, 66);
                ctx.stroke();
            }

            // Sunken necrotic eye sockets & furious brow wrinkles
            ctx.fillStyle = "rgba(8, 12, 16, 0.72)";
            ctx.beginPath();
            ctx.arc(82, 104, 29, 0, Math.PI * 2);
            ctx.arc(174, 104, 29, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#0e1418";
            ctx.lineWidth = 9;
            ctx.beginPath();
            ctx.moveTo(48, 78); ctx.lineTo(112, 94);
            ctx.moveTo(208, 78); ctx.lineTo(144, 94);
            ctx.stroke();

            // Glowing bloodshot undead eyes
            ctx.shadowColor = "#ff1e1e";
            ctx.shadowBlur = 12;
            ctx.fillStyle = "#ff1e1e";
            ctx.beginPath();
            ctx.arc(82, 104, 15, 0, Math.PI * 2);
            ctx.arc(174, 104, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = "#ffe066";
            ctx.beginPath();
            ctx.arc(82, 104, 6, 0, Math.PI * 2);
            ctx.arc(174, 104, 6, 0, Math.PI * 2);
            ctx.fill();

            // Skeletal nose cavity
            ctx.fillStyle = "#10161a";
            ctx.beginPath();
            ctx.moveTo(128, 118); ctx.lineTo(115, 144); ctx.lineTo(141, 144);
            ctx.closePath();
            ctx.fill();

            // Snarling undead mouth with jagged bared teeth
            ctx.fillStyle = "#0e1317";
            ctx.beginPath();
            ctx.rect(62, 162, 132, 54);
            ctx.fill();
            ctx.strokeStyle = "#1f282d";
            ctx.lineWidth = 5;
            ctx.stroke();

            ctx.fillStyle = "#e9e2bc";
            for (let tx = 68; tx < 186; tx += 15) {
                // Upper jagged teeth
                ctx.beginPath();
                ctx.moveTo(tx, 164); ctx.lineTo(tx + 7, 186); ctx.lineTo(tx + 14, 164);
                ctx.fill();
                // Lower jagged teeth
                ctx.beginPath();
                ctx.moveTo(tx + 2, 214); ctx.lineTo(tx + 7, 192); ctx.lineTo(tx + 13, 214);
                ctx.fill();
            }
        } else {
            // Purified happy face!
            ctx.fillStyle = "#1f2428";
            ctx.beginPath();
            ctx.arc(84, 102, 16, 0, Math.PI * 2);
            ctx.arc(172, 102, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(89, 97, 5, 0, Math.PI * 2);
            ctx.arc(177, 97, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#1f2428";
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.arc(128, 148, 48, 0.15 * Math.PI, 0.85 * Math.PI, false);
            ctx.stroke();
        }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
}

const cyanZombieFaceTex = createFaceTexture("#00d8f0", "ZOMBIE");
const greenZombieFaceTex = createFaceTexture("#32b846", "ZOMBIE");
const ghostFaceTex = createFaceTexture("#e2f1ff", "GHOST");
const vampireFaceTex = createFaceTexture("#d8d2e1", "VAMPIRE");
const bossFaceTex = createFaceTexture("#1a0924", "BOSS");
const smilingFaceTex = createFaceTexture("#ffdf91", "SMILE");

const WEAPON_ORDER = ["WATER", "FART", "TORCH", "GARLIC"];
const WEAPON_META = {
    WATER: {
        label: "WATER GUN",
        color: "#38b6ff",
        counterText: "BLUE FROST & HELLFIRE",
        svgPath: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>'
    },
    FART: {
        label: "FART GUN",
        color: "#56d364",
        counterText: "GREEN SWAMP & PLAGUE",
        svgPath: '<path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>'
    },
    TORCH: {
        label: "SPECIAL TORCH",
        color: "#ffd166",
        counterText: "GHOSTS & GOLD SHIELD",
        svgPath: '<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0-5v3m0 14v3M4.22 4.22l2.12 2.12m11.32 11.32l2.12 2.12M2 12h3m14 0h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    },
    GARLIC: {
        label: "GARLIC SLINGSHOT",
        color: "#f4e285",
        counterText: "VAMPIRES & BLOOD SHIELD",
        svgPath: '<path d="M12 3c-1.5 2.5-5 5.5-5 10.5C7 17.64 9.24 21 12 21s5-3.36 5-7.5C17 8.5 13.5 5.5 12 3zm0 15c-1.66 0-3-1.79-3-4 0-2.5 1.8-4.8 3-6.4 1.2 1.6 3 3.9 3 6.4 0 2.21-1.34 4-3 4z"/>'
    }
};

let combatFeedbackTimeout = null;
function showCombatFeedback(text, isSuccess = true, durationMs = 1350) {
    const pill = document.getElementById("combat-feedback-pill");
    const crosshair = document.getElementById("crosshair");
    if (crosshair) {
        crosshair.classList.remove("hit-valid", "hit-deflect");
        crosshair.classList.add(isSuccess ? "hit-valid" : "hit-deflect");
        setTimeout(() => {
            crosshair.classList.remove("hit-valid", "hit-deflect");
        }, 220);
    }
    if (!pill) return;
    pill.textContent = text;
    pill.style.display = "block";
    if (isSuccess) {
        pill.style.background = "rgba(16, 185, 129, 0.92)";
        pill.style.border = "2px solid #a7f3d0";
        pill.style.color = "#ffffff";
    } else {
        pill.style.background = "rgba(220, 38, 38, 0.94)";
        pill.style.border = "2px solid #fecaca";
        pill.style.color = "#ffffff";
    }
    if (combatFeedbackTimeout) clearTimeout(combatFeedbackTimeout);
    combatFeedbackTimeout = setTimeout(() => {
        pill.style.display = "none";
    }, durationMs);
}

const sound = new SoundEngine();
const canvas = document.getElementById("game-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.outputEncoding = THREE.sRGBEncoding;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3a4e63);
scene.fog = new THREE.FogExp2(0x3a4e63, 0.0065);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 450);
scene.add(camera);
camera.rotation.order = "YXZ";

const ambientLight = new THREE.AmbientLight(0xffeedd, 0.68);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x9bb8d3, 0x2b2118, 0.45);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xfff4e0, 0.85);
dirLight.position.set(25, 45, 20);
scene.add(dirLight);

const torchSpotLight = new THREE.SpotLight(0xffea9f, 0.0, 34, Math.PI / 5.5, 0.38, 1.7);
const torchTarget = new THREE.Object3D();
scene.add(torchSpotLight);
scene.add(torchTarget);
torchSpotLight.target = torchTarget;

const weaponRig = new THREE.Group();
weaponRig.position.set(0.28, -0.25, -0.48);
camera.add(weaponRig);

const weaponModels = {};
let weaponRecoil = 0.0;
let weaponRecoilVel = 0.0;
let weaponBobPhase = 0.0;
let weaponSwayX = 0.0;
let weaponSwayY = 0.0;
let weaponRollAngle = 0.0;
let weaponEquipOffset = 0.0;
let prevCameraYawForSway = 0.0;
let prevCameraPitchForSway = 0.0;
let weaponMuzzleFlashMesh = null;
let weaponMuzzleLight = null;
let weaponMuzzleFlashTimer = 0.0;

function triggerWeaponMuzzleFlash(hexColor) {
    weaponMuzzleFlashTimer = 0.075;
    if (weaponMuzzleFlashMesh) {
        weaponMuzzleFlashMesh.visible = true;
        weaponMuzzleFlashMesh.material.color.setHex(hexColor);
        weaponMuzzleFlashMesh.rotation.z = Math.random() * Math.PI * 2;
        const sc = 0.85 + Math.random() * 0.45;
        weaponMuzzleFlashMesh.scale.set(sc, sc, sc * 1.3);
    }
    if (weaponMuzzleLight) {
        weaponMuzzleLight.color.setHex(hexColor);
        weaponMuzzleLight.intensity = 2.6;
    }
}

function buildFirstPersonWeapons() {
    // 1. WATER GUN: High-Pressure Super-Soaker Hydro-Cannon (Inspired by title.png!)
    const waterGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf0f6fc, roughness: 0.25, metalness: 0.18 });
    const blueCasingMat = new THREE.MeshStandardMaterial({ color: 0x1d70b8, roughness: 0.32, metalness: 0.25 });
    const tankGlassMat = new THREE.MeshPhysicalMaterial({ color: 0xccf2ff, transparent: true, opacity: 0.48, roughness: 0.08, clearcoat: 1.0 });
    const waterCoreMat = new THREE.MeshStandardMaterial({ color: 0x00b4ff, emissive: 0x005588, emissiveIntensity: 0.5, roughness: 0.15 });
    const limePumpMat = new THREE.MeshStandardMaterial({ color: 0x56d364, roughness: 0.35, metalness: 0.15 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0xff6b00, emissive: 0x441500, roughness: 0.32 });
    const yellowTrimMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.3, metalness: 0.3 });
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x1b2028, roughness: 0.82 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8e2ec, metalness: 0.92, roughness: 0.14 });

    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.115, 0.36), bodyMat);
    const sideCowling = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.055, 0.26), blueCasingMat);
    sideCowling.position.set(0, 0.01, -0.02);

    // Dual Chrome Barrel & Tri-Nozzle Muzzle
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.029, 0.25, 14), chromeMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.25);
    const underTube = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.24, 10), chromeMat);
    underTube.rotation.x = Math.PI / 2;
    underTube.position.set(0, -0.028, -0.23);

    // Sliding Lime-Green Pump Handle on Under-Barrel Rail
    const pumpGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.13, 12), limePumpMat);
    pumpGrip.rotation.x = Math.PI / 2;
    pumpGrip.position.set(0, -0.03, -0.22);
    pumpGrip.userData.isPumpGrip = true;

    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.028, 0.06, 14), accentMat);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(0, 0.02, -0.38);
    const nozzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.006, 8, 16), yellowTrimMat);
    nozzleRing.position.set(0, 0.02, -0.41);

    // Pressurized Top Water Tank with Animated Sloshing Water Core
    const hydroTank = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.052, 0.27, 16), tankGlassMat);
    hydroTank.rotation.x = Math.PI / 2;
    hydroTank.position.set(0, 0.105, -0.02);
    const waterLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.044, 0.24, 14), waterCoreMat);
    waterLiquid.rotation.x = Math.PI / 2;
    waterLiquid.position.set(0, 0.098, -0.02);
    waterLiquid.userData.isWaterCore = true;

    const tankCap = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.035, 12), accentMat);
    tankCap.position.set(0, 0.16, 0.06);
    const rearBottle = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 12), yellowTrimMat);
    rearBottle.position.set(0, 0.095, 0.14);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.16, 0.075), gripMat);
    grip.rotation.x = 0.24;
    grip.position.set(0, -0.105, 0.08);
    const triggerGuard = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.08), accentMat);
    triggerGuard.position.set(0, -0.065, 0.02);

    waterGroup.add(
        receiver, sideCowling, barrel, underTube, pumpGrip,
        nozzle, nozzleRing, hydroTank, waterLiquid, tankCap,
        rearBottle, grip, triggerGuard
    );
    weaponRig.add(waterGroup);
    weaponModels.WATER = waterGroup;

    // 2. FART GUN: Steampunk Bio-Alchemical Gas Blunderbuss
    const fartGroup = new THREE.Group();
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.22 });
    const copperMat = new THREE.MeshStandardMaterial({ color: 0xc86428, metalness: 0.8, roughness: 0.28 });
    const canisterMat = new THREE.MeshStandardMaterial({ color: 0x32b846, emissive: 0x166524, emissiveIntensity: 0.65, roughness: 0.18 });
    const glassDomeMat = new THREE.MeshPhysicalMaterial({ color: 0x99ffaa, transparent: true, opacity: 0.42, roughness: 0.1 });
    const darkIronMat = new THREE.MeshStandardMaterial({ color: 0x262c34, metalness: 0.75, roughness: 0.38 });
    const redValveMat = new THREE.MeshStandardMaterial({ color: 0xd91c1c, roughness: 0.3, metalness: 0.3 });

    const mainTube = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.056, 0.36, 16), darkIronMat);
    mainTube.rotation.x = Math.PI / 2;
    const bellMuzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.045, 0.15, 16), brassMat);
    bellMuzzle.rotation.x = Math.PI / 2;
    bellMuzzle.position.z = -0.24;
    const muzzleCore = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.035, 0.05, 14), canisterMat);
    muzzleCore.rotation.x = Math.PI / 2;
    muzzleCore.position.z = -0.29;

    // Twin Bio-Chambers with Glowing Green Gas
    const bioChamberR = new THREE.Mesh(new THREE.SphereGeometry(0.066, 14, 14), canisterMat);
    bioChamberR.position.set(0.062, 0.045, -0.02);
    bioChamberR.userData.isBioChamber = true;
    const bioGlassR = new THREE.Mesh(new THREE.SphereGeometry(0.074, 14, 14), glassDomeMat);
    bioGlassR.position.copy(bioChamberR.position);

    const bioChamberL = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.16, 12), canisterMat);
    bioChamberL.rotation.x = Math.PI / 2;
    bioChamberL.position.set(-0.052, 0.03, -0.06);
    bioChamberL.userData.isBioChamber = true;

    // Spinning Pressure Valve Wheel on Top
    const gasValve = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.008, 8, 14), redValveMat);
    gasValve.rotation.x = Math.PI / 2;
    gasValve.position.set(0, 0.078, -0.04);
    gasValve.userData.isGasValve = true;

    const brassRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.054, 0.01, 8, 16), brassMat);
    brassRing1.position.z = -0.09;
    const brassRing2 = brassRing1.clone();
    brassRing2.position.z = 0.05;
    const copperCoil = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.008, 8, 16), copperMat);
    copperCoil.rotation.y = 0.35;
    copperCoil.position.z = -0.15;
    const fartGrip = grip.clone();

    fartGroup.add(
        mainTube, bellMuzzle, muzzleCore, bioChamberR, bioGlassR,
        bioChamberL, gasValve, brassRing1, brassRing2, copperCoil, fartGrip
    );
    fartGroup.visible = false;
    weaponRig.add(fartGroup);
    weaponModels.FART = fartGroup;

    // 3. SPECIAL TORCH: Arcane Solar-Focus Ghost Purifier
    const torchGroup = new THREE.Group();
    const crystalMat = new THREE.MeshBasicMaterial({ color: 0xfff5b8 });
    const crystalHaloMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, wireframe: true });
    const goldRimMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.92, roughness: 0.16 });

    const handleShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.03, 0.38, 14), darkIronMat);
    handleShaft.rotation.x = Math.PI / 2;
    const reflectorHead = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.042, 0.14, 18), goldRimMat);
    reflectorHead.rotation.x = Math.PI / 2;
    reflectorHead.position.z = -0.22;

    const lensCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.056, 1), crystalMat);
    lensCore.position.z = -0.28;
    lensCore.userData.isLens = true;
    const lensCage = new THREE.Mesh(new THREE.IcosahedronGeometry(0.072, 0), crystalHaloMat);
    lensCage.position.z = -0.28;
    lensCage.userData.isLens = true;

    // Counter-Rotating Astrolabe Gyroscope Rings
    const gyroRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.007, 8, 20), goldRimMat);
    gyroRing1.position.z = -0.26;
    gyroRing1.userData.isGyroRing1 = true;
    const gyroRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.006, 8, 18), copperMat);
    gyroRing2.rotation.x = Math.PI / 3;
    gyroRing2.position.z = -0.14;
    gyroRing2.userData.isGyroRing2 = true;

    const coolingRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.008, 8, 14), goldRimMat);
    coolingRing1.position.z = -0.05;
    const torchGrip = grip.clone();

    torchGroup.add(
        handleShaft, reflectorHead, lensCore, lensCage,
        gyroRing1, gyroRing2, coolingRing1, torchGrip
    );
    torchGroup.visible = false;
    weaponRig.add(torchGroup);
    weaponModels.TORCH = torchGroup;

    // 4. GARLIC SLINGSHOT: Vampire-Hunter Carved Walnut Y-Slingshot with Elastic Draw Physics
    const garlicGroup = new THREE.Group();
    const woodCarveMat = new THREE.MeshStandardMaterial({ color: 0x5c3818, roughness: 0.68 });
    const bandMat = new THREE.MeshStandardMaterial({ color: 0xe09f3e, roughness: 0.45 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x3d2210, roughness: 0.8 });
    const cloveMat = new THREE.MeshStandardMaterial({ color: 0xf7f4e9, roughness: 0.35 });
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x588157, roughness: 0.55 });

    const stemHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.022, 0.2, 12), woodCarveMat);
    stemHandle.position.set(0, -0.085, -0.14);
    const gripWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.026, 0.11, 12), leatherMat);
    gripWrap.position.set(0, -0.09, -0.14);

    const forkLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.024, 0.17, 10), woodCarveMat);
    forkLeft.rotation.z = 0.50;
    forkLeft.position.set(-0.055, 0.04, -0.14);
    const forkTipL = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.021, 0.03, 10), brassMat);
    forkTipL.rotation.z = 0.50;
    forkTipL.position.set(-0.09, 0.105, -0.14);

    const forkRight = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.024, 0.17, 10), woodCarveMat);
    forkRight.rotation.z = -0.50;
    forkRight.position.set(0.055, 0.04, -0.14);
    const forkTipR = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.021, 0.03, 10), brassMat);
    forkTipR.rotation.z = -0.50;
    forkTipR.position.set(0.09, 0.105, -0.14);

    const bandLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.20, 8), bandMat);
    bandLeft.rotation.x = Math.PI / 2; bandLeft.rotation.z = -0.36;
    bandLeft.position.set(-0.048, 0.095, -0.05);
    bandLeft.userData.isBandLeft = true;

    const bandRight = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.20, 8), bandMat);
    bandRight.rotation.x = Math.PI / 2; bandRight.rotation.z = 0.36;
    bandRight.position.set(0.048, 0.095, -0.05);
    bandRight.userData.isBandRight = true;

    // Multi-Clove Garlic Cluster Bomb in Leather Pouch
    const loadedGarlic = new THREE.Group();
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.055, 0.03), leatherMat);
    pouch.position.set(0, -0.005, 0.025);
    const bulbBody = new THREE.Mesh(new THREE.DodecahedronGeometry(0.044, 1), cloveMat);
    for (let c = 0; c < 5; c++) {
        const ang = (c / 5) * Math.PI * 2;
        const sideClove = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), cloveMat);
        sideClove.position.set(Math.cos(ang) * 0.024, -0.005, Math.sin(ang) * 0.024);
        loadedGarlic.add(sideClove);
    }
    const bulbSprout = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.048, 7), stemMat);
    bulbSprout.position.y = 0.046;
    loadedGarlic.add(pouch, bulbBody, bulbSprout);
    loadedGarlic.position.set(0, 0.095, 0.04);
    loadedGarlic.userData.isGarlicPouch = true;

    garlicGroup.add(
        stemHandle, gripWrap, forkLeft, forkTipL,
        forkRight, forkTipR, bandLeft, bandRight, loadedGarlic
    );
    garlicGroup.visible = false;
    weaponRig.add(garlicGroup);
    weaponModels.GARLIC = garlicGroup;

    // 5. SHARED 3D MUZZLE FLASH STARBURST & DYNAMIC BARREL POINTLIGHT
    const flashGroup = new THREE.Group();
    const flashMat = new THREE.MeshBasicMaterial({
        color: 0x38b6ff,
        transparent: true,
        opacity: 0.9,
        depthWrite: false
    });
    const flashCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), flashMat);
    const flashSpikes = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.18, 6), flashMat);
    flashSpikes.rotation.x = -Math.PI / 2;
    flashSpikes.position.z = -0.06;
    flashGroup.add(flashCore, flashSpikes);
    flashGroup.position.set(0, 0.02, -0.44);
    flashGroup.visible = false;
    weaponRig.add(flashGroup);
    weaponMuzzleFlashMesh = flashGroup;
    weaponMuzzleFlashMesh.material = flashMat;

    weaponMuzzleLight = new THREE.PointLight(0x38b6ff, 0.0, 7.5, 1.8);
    weaponMuzzleLight.position.set(0, 0.04, -0.45);
    weaponRig.add(weaponMuzzleLight);
}

buildFirstPersonWeapons();

const state = {
    isRunning: false,
    isGameOver: false,
    environmentMode: "TRAIN",
    lives: 5,
    maxLives: 5,
    carriageLevel: 1,
    maxCarriages: 5,
    carriageLength: 100,
    corridorHalfWidth: 1.8,
    strafeLimit: 1.2,
    playerX: 0.0,
    playerY: 1.6,
    basePlayerY: 1.6,
    playerZ: -4.0,
    facingRear: false,
    aimYawOffset: 0,
    aimPitch: 0,
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    activeWeapon: "WATER",
    isFiring: false,
    lastFireTime: 0,
    invincibleTimer: 0,
    isPerched: false,
    perchTimer: 0,
    perchCooldown: 0,
    redDoorPos: null,
    manorDoorPos: null,
    mazeCenterPos: new THREE.Vector3(0, 0, -32),
    trainSpeed: 42.0,
    trainWetStrikes: 0,
    maxWetStrikes: 3,
    cameraShudderTimer: 0.0,
    cameraShudderIntensity: 0.0,
    spawnTimer: 0,
    monstersPurified: 0,
    sealsBroken: 0
};

function syncWeaponViewModelVisibility() {
    WEAPON_ORDER.forEach(key => {
        if (weaponModels[key]) {
            weaponModels[key].visible = (state.activeWeapon === key);
        }
    });
    // Trigger crisp equip pop-up physics when switching weapons!
    weaponEquipOffset = -0.14;
}

function updateWeaponViewModel(dt) {
    // 1. Spring-Damper Recoil Physics
    const springStiffness = 140.0;
    const springDamping = 16.0;
    const springForce = -springStiffness * weaponRecoil - springDamping * weaponRecoilVel;
    weaponRecoilVel += springForce * dt;
    weaponRecoil += weaponRecoilVel * dt;
    if (weaponRecoil < 0) {
        weaponRecoil = 0;
        weaponRecoilVel = 0;
    }

    // Equip vertical recovery
    weaponEquipOffset += (0 - weaponEquipOffset) * Math.min(1, 14.0 * dt);

    // 2. Movement Stride Bobbing & Strafe Tilt
    const isMoving = state.moveForward || state.moveBackward || state.moveLeft || state.moveRight;
    if (isMoving && !state.isPerched) weaponBobPhase += 10.2 * dt;
    else weaponBobPhase += 2.0 * dt;

    const bobX = Math.cos(weaponBobPhase * 0.5) * (isMoving ? 0.016 : 0.0035);
    const bobY = Math.abs(Math.sin(weaponBobPhase)) * (isMoving ? -0.018 : -0.004);

    // 3. Rotational Inertia Sway & Strafe Roll
    const currentCamYaw = camera.rotation.y;
    const currentCamPitch = camera.rotation.x;
    let deltaYaw = currentCamYaw - prevCameraYawForSway;
    if (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
    if (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
    const deltaPitch = currentCamPitch - prevCameraPitchForSway;
    prevCameraYawForSway = currentCamYaw;
    prevCameraPitchForSway = currentCamPitch;

    weaponSwayX = Math.max(-0.06, Math.min(0.06, weaponSwayX + deltaYaw * 0.22));
    weaponSwayY = Math.max(-0.05, Math.min(0.05, weaponSwayY + deltaPitch * 0.18));
    weaponSwayX += (0 - weaponSwayX) * Math.min(1, 10.0 * dt);
    weaponSwayY += (0 - weaponSwayY) * Math.min(1, 10.0 * dt);

    const targetRoll = (state.moveLeft ? 0.065 : 0) + (state.moveRight ? -0.065 : 0) - weaponSwayX * 1.4;
    weaponRollAngle += (targetRoll - weaponRollAngle) * Math.min(1, 11.0 * dt);

    weaponRig.position.set(
        0.28 + bobX + weaponSwayX,
        -0.25 + bobY + weaponSwayY + weaponEquipOffset - weaponRecoil * 0.022,
        -0.48 + weaponRecoil * 0.11
    );
    weaponRig.rotation.set(
        weaponRecoil * 0.28 + weaponSwayY * 0.8,
        -weaponSwayX * 0.9,
        weaponRollAngle
    );

    // 4. Muzzle Flash Decay
    if (weaponMuzzleFlashTimer > 0) {
        weaponMuzzleFlashTimer -= dt;
        if (weaponMuzzleFlashTimer <= 0) {
            if (weaponMuzzleFlashMesh) weaponMuzzleFlashMesh.visible = false;
            if (weaponMuzzleLight) weaponMuzzleLight.intensity = 0.0;
        } else if (weaponMuzzleLight) {
            weaponMuzzleLight.intensity = (weaponMuzzleFlashTimer / 0.075) * 2.6;
        }
    }

    // 5. Per-Weapon Dynamic Moving Parts
    if (weaponModels.WATER && weaponModels.WATER.visible) {
        weaponModels.WATER.children.forEach(ch => {
            if (ch.userData.isPumpGrip) {
                ch.position.z = -0.22 + Math.sin(weaponRecoil * Math.PI) * 0.065;
            } else if (ch.userData.isWaterCore) {
                ch.position.y = 0.098 + Math.sin(weaponBobPhase * 1.5) * 0.004;
            }
        });
    } else if (weaponModels.FART && weaponModels.FART.visible) {
        weaponModels.FART.children.forEach(ch => {
            if (ch.userData.isGasValve) {
                ch.rotation.z += (2.0 + weaponRecoil * 18.0) * dt;
            } else if (ch.userData.isBioChamber) {
                const pulse = 1.0 + Math.sin(weaponBobPhase * 2.2) * 0.04 + weaponRecoil * 0.08;
                ch.scale.setScalar(pulse);
            }
        });
    } else if (weaponModels.TORCH && weaponModels.TORCH.visible) {
        const spinBoost = 1.0 + weaponRecoil * 4.5;
        weaponModels.TORCH.children.forEach(ch => {
            if (ch.userData.isLens) {
                ch.rotation.z += 3.8 * spinBoost * dt;
                ch.rotation.x += 2.2 * spinBoost * dt;
            } else if (ch.userData.isGyroRing1) {
                ch.rotation.z -= 4.5 * spinBoost * dt;
                ch.rotation.y += 1.8 * dt;
            } else if (ch.userData.isGyroRing2) {
                ch.rotation.y -= 5.2 * spinBoost * dt;
            }
        });
    } else if (weaponModels.GARLIC && weaponModels.GARLIC.visible) {
        const drawStretch = weaponRecoil * 0.085;
        weaponModels.GARLIC.children.forEach(ch => {
            if (ch.userData.isGarlicPouch) {
                ch.position.z = 0.04 + drawStretch;
            } else if (ch.userData.isBandLeft || ch.userData.isBandRight) {
                ch.position.z = -0.05 + drawStretch * 0.5;
                ch.scale.y = 1.0 + weaponRecoil * 0.45;
            }
        });
    }
}

const carriageGroup = new THREE.Group();
const exteriorGroup = new THREE.Group();
scene.add(carriageGroup);
scene.add(exteriorGroup);

let hazards = [];
let projectiles = [];
let npcs = [];
let particles = [];
let pickups = [];
let climbableTrees = [];
let mazeWallBoxes = [];
let openMazeCells = [];
let steamClouds = [];
let arcaneRings = [];
let engineHitboxes = [];

// ============================================================================
// SELF-INJECTING ARCADE COUNTDOWN & PLAYER LOCK ENGINE
// ============================================================================
let isCountdownActive = false;

function ensureCountdownDOM() {
    let overlay = document.getElementById("countdown-overlay");
    let label = document.getElementById("countdown-text");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "countdown-overlay";
        overlay.style.cssText = `
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 99999;
            text-align: center;
        `;
        label = document.createElement("div");
        label.id = "countdown-text";
        label.style.cssText = `
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: clamp(80px, 18vw, 160px);
            font-weight: 900;
            letter-spacing: 6px;
            color: #ffffff;
            text-shadow: 0 0 35px #58a6ff, 0 0 70px #00f5d4, 0 0 100px #000000;
            transition: transform 0.22s cubic-bezier(0.18, 0.89, 0.32, 1.28), opacity 0.2s ease-out;
        `;
        overlay.appendChild(label);
        document.body.appendChild(overlay);
    }
    return { overlay, label: document.getElementById("countdown-text") || label };
}

function triggerSectionCountdown(onComplete) {
    isCountdownActive = true;
    
    // Immediately zero out any lingering movement or firing
    state.moveForward = false;
    state.moveBackward = false;
    state.moveLeft = false;
    state.moveRight = false;
    state.isFiring = false;

    const { overlay, label } = ensureCountdownDOM();
    overlay.style.display = "block";

    const steps = [
        { text: "3", scale: "1.25", color: "#ffffff", shadow: "0 0 40px #58a6ff, 0 0 80px #00f5d4", delay: 850 },
        { text: "2", scale: "1.25", color: "#ffd166", shadow: "0 0 40px #ffd166, 0 0 80px #ff9f1c", delay: 850 },
        { text: "1", scale: "1.25", color: "#ff7b72", shadow: "0 0 40px #ff7b72, 0 0 80px #f85149", delay: 850 },
        { text: "GO!", scale: "1.5", color: "#00f5d4", shadow: "0 0 50px #00f5d4, 0 0 100px #58a6ff", delay: 650 }
    ];

    let idx = 0;
    function runNextStep() {
        if (idx < steps.length) {
            const cur = steps[idx];
            label.textContent = cur.text;
            label.style.color = cur.color;
            label.style.textShadow = cur.shadow;
            label.style.opacity = "1";
            label.style.transform = `scale(${cur.scale})`;
            
            try { sound.playQuickTurn(); } catch(e) {}

            setTimeout(() => {
                label.style.opacity = "0.15";
                label.style.transform = "scale(0.65)";
                idx++;
                setTimeout(runNextStep, 80);
            }, cur.delay);
        } else {
            overlay.style.display = "none";
            isCountdownActive = false; // Controls unlocked!
            if (onComplete) onComplete();
        }
    }

    runNextStep();
}

function rewardTransitionLife(bonusAmount = 2) {
    state.lives = Math.min(state.maxLives, state.lives + bonusAmount);
    safeSetText("lives-value", `${state.lives} / ${state.maxLives}`);
    try { sound.playKindnessComplete(); } catch(e) {}
}
