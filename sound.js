'use strict';

class SoundManager {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.unlocked = false;
        this.music = null;
        this.musicWorldId = null;
        this.musicUrls = {
            1: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            2: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            3: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
            4: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
            5: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
            6: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
        };
    }

    unlock() {
        if (!this.context) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            this.context = new AudioContext();
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = 0.16;
            this.masterGain.connect(this.context.destination);
        }

        if (this.context.state === 'suspended') this.context.resume();
        this.unlocked = true;
    }

    playWorldMusic(worldId) {
        if (!this.unlocked) return;
        const url = this.musicUrls[worldId];
        if (!url || this.musicWorldId === worldId) return;

        this.stopWorldMusic();
        this.music = new Audio(url);
        this.music.loop = true;
        this.music.volume = 0.12;
        this.musicWorldId = worldId;
        this.music.play().catch(() => {});
    }

    stopWorldMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
            this.music = null;
        }
        this.musicWorldId = null;
    }

    play(name, options = {}) {
        if (!this.unlocked || !this.context || !this.masterGain) return;

        const patterns = {
            start:    [[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.2]],
            question: [[392, 0, 0.1], [523, 0.1, 0.16]],
            correct:  [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.24]],
            wrong:    [[220, 0, 0.16], [165, 0.15, 0.25]],
            levelUp:  [[659, 0, 0.1], [784, 0.1, 0.1], [1047, 0.2, 0.3]],
            victory:  [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.45]],
            tick:     [[options.urgent ? 880 : 660, 0, options.urgent ? 0.07 : 0.1]]
        };
        const pattern = patterns[name];
        if (!pattern) return;

        const now = this.context.currentTime;
        pattern.forEach(([frequency, offset, duration]) => {
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();
            oscillator.type = name === 'wrong' ? 'sawtooth' : 'sine';
            oscillator.frequency.setValueAtTime(frequency, now + offset);
            gain.gain.setValueAtTime(0.001, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.55, now + offset + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + duration);
            oscillator.connect(gain);
            gain.connect(this.masterGain);
            oscillator.start(now + offset);
            oscillator.stop(now + offset + duration + 0.02);
        });
    }
}

window.gameAudio = new SoundManager();