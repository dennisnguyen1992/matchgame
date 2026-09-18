'use strict';

class QuestionEngine {
    constructor() {
        this.recentQuestions = [];
        this.MAX_RECENT = 12;
    }

    generateQuestion(worldLevel) {
        let q, attempts = 0;
        do {
            q = this._generateForWorld(worldLevel);
            attempts++;
        } while (this.recentQuestions.includes(q.question) && attempts < 20);

        this.recentQuestions.push(q.question);
        if (this.recentQuestions.length > this.MAX_RECENT) this.recentQuestions.shift();
        return q;
    }

    _generateForWorld(level) {
        switch (level) {
            case 1: return this._world1_KindergartenExplorer();
            case 2: return this._world2_PirateIsland();
            case 3: return this._world3_JungleExpedition();
            case 4: return this._world4_AncientTemple();
            case 5: return this._world5_LostCivilization();
            case 6: return this._world6_SpaceAcademy();
            default: return this._world1_KindergartenExplorer();
        }
    }

    _world1_KindergartenExplorer() {
        const roll = Math.random();
        if (roll < 0.33) {
            const n = this._rand(1, 9);
            const sets = [['🍎', 'apples'], ['⭐', 'stars'], ['🐱', 'cats'], ['🌸', 'flowers'], ['🦋', 'butterflies']];
            const [emoji, name] = sets[this._rand(0, sets.length - 1)];
            return {
                question: `How many ${name}?\n${emoji.repeat(n)}`,
                options: this._numOptions(n, 4, 1, 10),
                answer: n, type: 'multiple_choice', theme: '🌲', worldLevel: 1
            };
        } else if (roll < 0.66) {
            const a = this._rand(1, 9), b = this._rand(1, 9);
            const answer = Math.max(a, b);
            return {
                question: `Which number is BIGGER?\n  ${a}   or   ${b}`,
                options: [a, b, Math.max(a, b) + 1, Math.min(a, b) - 1 < 0 ? 0 : Math.min(a, b) - 1].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 4),
                answer, type: 'multiple_choice', theme: '🌲', worldLevel: 1
            };
        } else {
            const a = this._rand(1, 5), b = this._rand(1, 5);
            return {
                question: `${a} + ${b} = ?`,
                options: this._numOptions(a + b, 4, 1, 10),
                answer: a + b, type: 'multiple_choice', theme: '🌲', worldLevel: 1
            };
        }
    }

    _world2_PirateIsland() {
        if (Math.random() > 0.45) {
            const a = this._rand(5, 15), b = this._rand(1, 20 - a);
            return {
                question: `⚓ ${a} + ${b} = ?`,
                options: this._numOptions(a + b, 4, 0, 20),
                answer: a + b, type: 'multiple_choice', theme: '🏴‍☠️', worldLevel: 2
            };
        } else {
            const a = this._rand(10, 20), b = this._rand(1, a);
            return {
                question: `⚓ ${a} − ${b} = ?`,
                options: this._numOptions(a - b, 4, 0, 20),
                answer: a - b, type: 'multiple_choice', theme: '🏴‍☠️', worldLevel: 2
            };
        }
    }

    _world3_JungleExpedition() {
        const roll = Math.random();
        if (roll < 0.35) {
            const a = this._rand(20, 75), b = this._rand(10, 99 - a);
            return {
                question: `🌿 ${a} + ${b} = ?`,
                options: this._numOptions(a + b, 4, 10, 99),
                answer: a + b, type: 'multiple_choice', theme: '🐆', worldLevel: 3
            };
        } else if (roll < 0.7) {
            const a = this._rand(40, 99), b = this._rand(5, a - 5);
            return {
                question: `🌿 ${a} − ${b} = ?`,
                options: this._numOptions(a - b, 4, 0, 95),
                answer: a - b, type: 'multiple_choice', theme: '🐆', worldLevel: 3
            };
        } else {
            const a = this._rand(2, 9), b = this._rand(2, 9);
            return {
                question: `🌿 ${a} × ${b} = ?`,
                options: this._numOptions(a * b, 4, 4, 81),
                answer: a * b, type: 'multiple_choice', theme: '🐆', worldLevel: 3
            };
        }
    }

    _world4_AncientTemple() {
        const roll = Math.random();
        if (roll < 0.35) {
            const a = this._rand(3, 12), b = this._rand(3, 12);
            return {
                question: `🏛️ ${a} × ${b} = ?`,
                options: this._numOptions(a * b, 4, 6, 144),
                answer: a * b, type: 'multiple_choice', theme: '⚔️', worldLevel: 4
            };
        } else if (roll < 0.7) {
            const b = this._rand(2, 12), ans = this._rand(2, 12);
            return {
                question: `🏛️ ${b * ans} ÷ ${b} = ?`,
                options: this._numOptions(ans, 4, 1, 12),
                answer: ans, type: 'multiple_choice', theme: '⚔️', worldLevel: 4
            };
        } else {
            const shapes = [['triangle', 3], ['square', 4], ['pentagon', 5], ['hexagon', 6], ['octagon', 8]];
            const [name, sides] = shapes[this._rand(0, shapes.length - 1)];
            return {
                question: `🏛️ How many sides does a ${name} have?`,
                options: this._numOptions(sides, 4, 3, 8),
                answer: sides, type: 'multiple_choice', theme: '📐', worldLevel: 4
            };
        }
    }

    _world5_LostCivilization() {
        const roll = Math.random();
        if (roll < 0.33) {
            const fqs = [
                { q: '½ + ¼ = ?', a: '¾', opts: ['¾', '½', '⅔', '⅓'] },
                { q: '¾ − ¼ = ?', a: '½', opts: ['½', '¼', '⅔', '¾'] },
                { q: '⅓ + ⅓ = ?', a: '⅔', opts: ['⅔', '⅓', '½', '1'] },
                { q: '¾ + ¼ = ?', a: '1', opts: ['1', '½', '⅔', '¾'] },
                { q: '½ + ½ = ?', a: '1', opts: ['1', '¾', '⅓', '½'] },
            ];
            const fq = fqs[this._rand(0, fqs.length - 1)];
            return {
                question: `🏺 ${fq.q}`,
                options: fq.opts, answer: fq.a,
                type: 'multiple_choice', theme: '⚱️', worldLevel: 5
            };
        } else if (roll < 0.66) {
            const w = this._rand(2, 10), h = this._rand(2, 10);
            return {
                question: `🏺 Area of a ${w} × ${h} rectangle?`,
                options: this._numOptions(w * h, 4, 4, 100),
                answer: w * h, type: 'multiple_choice', theme: '📏', worldLevel: 5
            };
        } else {
            const w = this._rand(2, 10), h = this._rand(2, 10);
            return {
                question: `🏺 Perimeter of a ${w} × ${h} rectangle?`,
                options: this._numOptions(2 * (w + h), 4, 8, 40),
                answer: 2 * (w + h), type: 'multiple_choice', theme: '📐', worldLevel: 5
            };
        }
    }

    _world6_SpaceAcademy() {
        const roll = Math.random();
        if (roll < 0.33) {
            const a = (this._rand(1, 20) * 25) / 100;
            const b = (this._rand(1, 20) * 25) / 100;
            const ans = Math.round((a + b) * 100) / 100;
            return {
                question: `🚀 ${a.toFixed(2)} + ${b.toFixed(2)} = ?`,
                options: this._decimalOptions(ans, 4),
                answer: ans, type: 'multiple_choice', theme: '🌌', worldLevel: 6
            };
        } else if (roll < 0.66) {
            const ratioQs = [
                { q: '2 : 4 simplified =', a: '1 : 2', opts: ['1 : 2', '2 : 4', '1 : 3', '3 : 6'] },
                { q: '4 : 8 simplified =', a: '1 : 2', opts: ['1 : 2', '2 : 4', '1 : 4', '2 : 3'] },
                { q: '3 : 9 simplified =', a: '1 : 3', opts: ['1 : 3', '1 : 2', '3 : 9', '2 : 6'] },
                { q: '5 : 15 simplified =', a: '1 : 3', opts: ['1 : 3', '1 : 5', '2 : 6', '5 : 10'] },
                { q: '6 : 9 simplified =', a: '2 : 3', opts: ['2 : 3', '1 : 3', '3 : 6', '6 : 9'] },
            ];
            const rq = ratioQs[this._rand(0, ratioQs.length - 1)];
            return {
                question: `🚀 ${rq.q}`,
                options: rq.opts, answer: rq.a,
                type: 'multiple_choice', theme: '⭐', worldLevel: 6
            };
        } else {
            const probs = [
                { q: '5 astronauts × 3 oxygen tanks each = ? tanks total', a: 15 },
                { q: 'A rocket has 8 rows × 12 seats = ? seats total', a: 96 },
                { q: '100 stars ÷ 4 planets = ? stars each', a: 25 },
                { q: '7 planets × 4 moons each = ? moons total', a: 28 },
                { q: 'Mission takes 3.5 + 2.5 years = ? years', a: 6 },
            ];
            const wp = probs[this._rand(0, probs.length - 1)];
            return {
                question: `🚀 ${wp.q}`,
                options: this._numOptions(wp.a, 4, 5, 120),
                answer: wp.a, type: 'multiple_choice', theme: '🛸', worldLevel: 6
            };
        }
    }

    _numOptions(answer, count, min, max) {
        const set = new Set([answer]);
        let tries = 0;
        while (set.size < count && tries < 100) {
            const v = Math.floor(Math.random() * (max - min + 1)) + min;
            if (v !== answer) set.add(v);
            tries++;
        }
        for (let i = 1; set.size < count; i++) {
            if (answer + i <= max) set.add(answer + i);
            if (answer - i >= min && set.size < count) set.add(answer - i);
        }
        return this._shuffle([...set]);
    }

    _decimalOptions(answer, count) {
        const set = new Set([answer]);
        let tries = 0;
        while (set.size < count && tries < 100) {
            const offset = (this._rand(-4, 4)) * 0.25;
            const v = Math.round((answer + offset) * 100) / 100;
            if (v !== answer && v > 0) set.add(v);
            tries++;
        }
        return this._shuffle([...set]);
    }

    _rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}
