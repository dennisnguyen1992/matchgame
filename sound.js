'use strict';

class SoundManager {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.unlocked = false;
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

    play(name) {
        if (!this.unlocked || !this.context || !this.masterGain) return;

        const patterns = {
            start:    [[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.2]],
            question: [[392, 0, 0.1], [523, 0.1, 0.16]],
            correct:  [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.24]],
            wrong:    [[220, 0, 0.16], [165, 0.15, 0.25]],
            levelUp:  [[659, 0, 0.1], [784, 0.1, 0.1], [1047, 0.2, 0.3]],
            victory:  [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.45]]
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