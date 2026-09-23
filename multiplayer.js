'use strict';

class MultiplayerManager {
    constructor(game) {
        this.game = game;
        this.players = new Map();   // deviceId → player
        this.nextId = 1;
        this.hostDeviceId = null;
        this._initAirConsole();
    }

    _initAirConsole() {
        this.ac = new AirConsole({ synchronize_time: true });

        this.ac.onConnect = (did) => {
            if (this.players.size >= 4) {
                this.ac.message(did, { type: 'error', msg: 'Game is full (max 4 players)' });
                return;
            }
            const player = this._makePlayer(this.nextId++, did);
            if (this.hostDeviceId === null) this.hostDeviceId = did;
            this.players.set(did, player);
            console.log(`[MP] Player ${player.id} connected — device ${did}`);
            this.ac.message(did, {
                type: 'player_assigned',
                playerId: player.id,
                isHost: did === this.hostDeviceId,
                player,
                gameState: this.game.state
            });
            this.game.onPlayerConnect(player);
        };

        this.ac.onDisconnect = (did) => {
            const p = this.players.get(did);
            if (!p) return;
            console.log(`[MP] Player ${p.id} disconnected`);
            this.players.delete(did);
            this.game.onPlayerDisconnect(p);
        };

        this.ac.onMessage = (did, data) => {
            const p = this.players.get(did);
            if (!p) return;
            this.game.onControllerMessage(p, data);
        };
    }

    _makePlayer(id, deviceId) {
        const nicknames = ['Hero Red', 'Hero Teal', 'Hero Blue', 'Hero Orange'];
        const chars = ['explorer_boy', 'explorer_girl', 'robomath', 'astro_cat'];
        const airConsoleName = typeof this.ac.getNickname === 'function'
            ? this.ac.getNickname(deviceId)
            : '';
        const nickname = String(airConsoleName || '').trim().substring(0, 12)
            || nicknames[(id - 1) % 4];
        return {
            id, deviceId,
            nickname,
            character: chars[(id - 1) % 4],
            hp: 100, maxHp: 100,
            xp: 0, level: 1,
            coins: 0, position: 0,
            score: 0, streak: 0,
            ready: false,
            isBot: false,
            answeredThisRound: false,
            correctThisRound: false
        };
    }

    // ── Sending ──────────────────────────────────────────────────
    sendTo(deviceId, data) {
        this.ac.message(deviceId, data);
    }

    sendToPlayer(playerId, data) {
        for (const [did, p] of this.players) {
            if (p.id === playerId) { this.ac.message(did, data); return; }
        }
    }

    broadcast(data) {
        for (const did of this.players.keys()) {
            this.ac.message(did, data);
        }
    }

    // ── Queries ──────────────────────────────────────────────────
    getPlayers() { return [...this.players.values()]; }
    isHost(player) { return player?.deviceId === this.hostDeviceId; }
    getPlayerCount() { return this.players.size; }
    humanCount() { return this.getPlayers().filter(p => !p.isBot).length; }

    updatePlayer(deviceId, patch) {
        const p = this.players.get(deviceId);
        if (p) Object.assign(p, patch);
    }

    // ── Bot management ───────────────────────────────────────────
    addBot(difficulty = 'medium') {
        const id = this.nextId++;
        const chars = ['explorer_boy', 'explorer_girl', 'robomath', 'astro_cat'];
        const accuracy = { easy: 0.55, medium: 0.78, hard: 0.95 }[difficulty] || 0.78;
        const bot = {
            id, deviceId: `bot_${id}`,
            nickname: `Bot ${['Alpha','Beta','Gamma','Delta'][(id - 1) % 4]}`,
            character: chars[(id - 1) % 4],
            hp: 100, maxHp: 100,
            xp: 0, level: 1,
            coins: 0, position: 0,
            score: 0, streak: 0,
            ready: true,
            isBot: true,
            botAccuracy: accuracy,
            botDifficulty: difficulty,
            answeredThisRound: false,
            correctThisRound: false
        };
        this.players.set(bot.deviceId, bot);
        console.log(`[MP] Bot added: ${bot.nickname} (${difficulty})`);
        return bot;
    }

    simulateBotAnswers(question, maxDelay = 16000) {
        for (const p of this.players.values()) {
            if (!p.isBot || p.answeredThisRound) continue;
            const delay = Math.random() * maxDelay * 0.6 + 2000;
            setTimeout(() => {
                if (p.answeredThisRound) return;
                const correct = Math.random() < p.botAccuracy;
                let answer;
                if (correct) {
                    answer = question.answer;
                } else {
                    const wrongs = question.options.filter(o => o !== question.answer);
                    answer = wrongs[Math.floor(Math.random() * wrongs.length)];
                }
                this.game.onBotAnswer(p, answer);
            }, delay);
        }
    }
}
