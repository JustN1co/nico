/* ==========================================================================
   2. 8-BIT WEBAUDIO SYNTHESIZER (PROGRESSIVE WAVE-SCALED AGGRESSIVE BGM)
========================================================================== */
const AudioEngine = {
    ctx: null,
    sfxVolume: 0.7,
    bgmVolume: 0.6,
    muted: false,
    bgmRunning: false,
    bgmStep: 0,

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    playTone(freq, type = 'square', duration = 0.08, volScale = 0.25, slideFreq = null, channel = 'sfx') {
        const channelVol = channel === 'bgm' ? this.bgmVolume : this.sfxVolume;
        if (this.muted || channelVol <= 0) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (slideFreq) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideFreq), now + duration);
        }

        const peak = Math.min(1, channelVol * volScale);
        gain.gain.setValueAtTime(peak, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    },

    sfxClick() {
        this.playTone(620, 'square', 0.045, 0.2, 880, 'sfx');
    },

    sfxShoot() {
        this.playTone(460, 'square', 0.055, 0.14, 160, 'sfx');
    },

    sfxMainPower() {
        this.playTone(180, 'sawtooth', 0.28, 0.38, 55, 'sfx');
        setTimeout(() => this.playTone(320, 'square', 0.22, 0.32, 90, 'sfx'), 50);
    },

    sfxSecPower() {
        this.playTone(520, 'triangle', 0.18, 0.32, 980, 'sfx');
        setTimeout(() => this.playTone(760, 'square', 0.16, 0.26, 360, 'sfx'), 60);
    },

    sfxDash() {
        this.playTone(280, 'triangle', 0.12, 0.28, 660, 'sfx');
    },

    sfxGhostDeath() {
        this.playTone(240, 'sawtooth', 0.09, 0.16, 75, 'sfx');
    },

    sfxPlayerHit() {
        this.playTone(130, 'sawtooth', 0.24, 0.4, 45, 'sfx');
    },

    sfxXp() {
        this.playTone(740, 'sine', 0.05, 0.15, 1080, 'sfx');
    },

    sfxChestOpen() {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((n, idx) => {
            setTimeout(() => this.playTone(n, 'triangle', 0.11, 0.32, null, 'sfx'), idx * 55);
        });
    },

    sfxLevelUp() {
        const notes = [440, 554, 659, 880];
        notes.forEach((n, idx) => {
            setTimeout(() => this.playTone(n, 'square', 0.12, 0.28, null, 'sfx'), idx * 75);
        });
    },

    startBGM() {
        if (this.bgmRunning) return;
        this.bgmRunning = true;

        const calmBass = [
            110, 110, 130.8, 110, 146.8, 130.8, 98, 110,
            110, 110, 164.8, 146.8, 130.8, 123.5, 98, 103.8
        ];
        const intenseBass = [
            110, 116.5, 110, 146.8, 110, 164.8, 155.6, 130.8,
            110, 116.5, 130.8, 174.6, 164.8, 146.8, 130.8, 116.5
        ];
        const leadline = [
            220, 0, 261.6, 0, 293.7, 261.6, 196, 0,
            220, 329.6, 311.1, 293.7, 261.6, 246.9, 196, 233.1
        ];

        const tickBGM = () => {
            const w = (typeof Game !== 'undefined' && Game.wave) ? Game.wave : 1;
            const stepDelay = Math.max(145, Math.round(205 - Math.min(26, w) * 2.3));

            if (typeof Game !== 'undefined' && Game.state === 'PLAYING' && !this.muted && this.bgmVolume > 0) {
                const idx = this.bgmStep % 16;
                const useIntense = w >= 8;
                const bassNote = useIntense ? intenseBass[idx] : calmBass[idx];
                const leadNote = leadline[idx];

                let bassType = 'triangle';
                let bassVol = 0.14;
                if (w >= 14) {
                    bassType = idx % 2 === 0 ? 'sawtooth' : 'square';
                    bassVol = 0.13;
                } else if (w >= 6) {
                    bassType = idx % 4 === 0 ? 'square' : 'triangle';
                    bassVol = 0.14;
                }

                this.playTone(bassNote, bassType, 0.14, bassVol, null, 'bgm');

                const playLead = w >= 12 ? (leadNote > 0) : (leadNote > 0 && idx % 2 === 0);
                if (playLead) {
                    const leadMult = (w >= 18 && idx % 4 === 0) ? 1.5 : 1.0;
                    this.playTone(leadNote * leadMult, 'square', 0.08, 0.06, null, 'bgm');
                }

                if (w >= 10 && idx % 4 === 0) {
                    this.playTone(95, 'sine', 0.07, 0.18, 38, 'bgm');
                }

                this.bgmStep++;
            }

            setTimeout(tickBGM, stepDelay);
        };

        tickBGM();
    }
};

window.AudioEngine = AudioEngine;
