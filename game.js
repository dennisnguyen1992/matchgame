'use strict';

const STATES = {
    LOBBY:    'LOBBY',
    PLAYING:  'PLAYING',
    QUESTION: 'QUESTION',
    REVEAL:   'REVEAL',
    GAME_OVER:'GAME_OVER'
};

class Game {
    constructor() {
        this.state       = STATES.LOBBY;
        this.world       = null;
        this.question    = null;
        this.round       = 0;
        this.MAX_ROUNDS  = 25;
        this.TIME_LIMIT  = 20000;
        this.pendingAns  = new Map();   // playerId → result
        this.qTimerId    = null;
        this.rafId       = null;
        this.selectedWorldId = 1;

        this.qEngine  = new QuestionEngine();
        this.renderer = null;
        this.ui       = new UIManager();
        this.mp       = new MultiplayerManager(this);

        this._boot();
    }

    _boot() {
        const canvas = document.getElementById('game-canvas');
        if (canvas) this.renderer = new WorldRenderer(canvas);

        this.ui.showScreen('lobby');
        this.ui.updateLobby([]);

        this._setupScreenListeners();
        window.addEventListener('resize', () => {
            if (this.renderer) {
                this.renderer.resize(window.innerWidth, window.innerHeight);
            }
        });
        this._loop();
    }

    // ── Render loop ──────────────────────────────────────────────
    _loop() {
        this.rafId = requestAnimationFrame(() => this._loop());
        if (this.state === STATES.PLAYING && this.renderer) {
            this.renderer.render(this.mp.getPlayers());
            this.ui.updateHUD(this.mp.getPlayers(), this.world ? this.world.name : '', this.round);
        }
    }

    // ── Screen button listeners ──────────────────────────────────
    _setupScreenListeners() {
        document.getElementById('btn-start-game')?.addEventListener('click', () => {
            window.gameAudio?.unlock();
            this._tryStartGame();
        });

        document.getElementById('btn-play-again')?.addEventListener('click', () => {
            window.gameAudio?.unlock();
            this._resetToLobby();
        });

        document.getElementById('btn-return-menu')?.addEventListener('click', () => {
            window.gameAudio?.unlock();
            this._resetToLobby();
        });

        document.getElementById('btn-confirm-world')?.addEventListener('click', () => {
            window.gameAudio?.unlock();
            this._launchGame(this.selectedWorldId);
        });
    }

    // ── AirConsole callbacks (called by MultiplayerManager) ──────
    onPlayerConnect(player) {
        const players = this.mp.getPlayers();
        console.log(`[Game] Player ${player.id} joined. Total: ${players.length}`);
        this.ui.updateLobby(players);
        this.ui.showPopup(`${CHAR_EMOJI[player.character] || '🎉'} ${player.nickname} joined!`, 'success');

        this.mp.broadcast({
            type: 'lobby_update',
            players: this._publicPlayers(),
            yourId: player.id
        });
    }

    onPlayerDisconnect(player) {
        const players = this.mp.getPlayers();
        this.ui.updateLobby(players);
        this.ui.showPopup(`${player.nickname} disconnected`, 'warning');
        this.mp.broadcast({ type: 'lobby_update', players: this._publicPlayers() });
    }

    onControllerMessage(player, data) {
        switch (data.type) {
            case 'select_character':
                this._onCharSelect(player, data.character); break;
            case 'set_nickname':
                this._onSetNickname(player, data.nickname); break;
            case 'ready':
                this._onReady(player); break;
            case 'start_game':
                if (this.mp.isHost(player)) this._tryStartGame(); break;
            case 'force_quit':
                if (this.mp.isHost(player)) this._resetToLobby(); break;
            case 'answer':
                this._onAnswer(player, data.value, data.timestamp || Date.now()); break;
            case 'request_sync':
                this._syncPlayer(player); break;
        }
    }

    onBotAnswer(bot, answer) {
        this._onAnswer(bot, answer, Date.now());
    }

    // ── Controller message handlers ──────────────────────────────
    _onCharSelect(player, character) {
        const valid = ['explorer_boy', 'explorer_girl', 'robomath', 'astro_cat'];
        if (!valid.includes(character)) return;
        this.mp.updatePlayer(player.deviceId, { character });
        player.character = character;
        this.ui.updateLobby(this.mp.getPlayers());
        this.mp.broadcast({ type: 'lobby_update', players: this._publicPlayers() });
    }

    _onSetNickname(player, rawNick) {
        const nickname = String(rawNick).trim().substring(0, 12) || player.nickname;
        this.mp.updatePlayer(player.deviceId, { nickname });
        player.nickname = nickname;
        this.ui.updateLobby(this.mp.getPlayers());
        this.mp.broadcast({ type: 'lobby_update', players: this._publicPlayers() });
    }

    _onReady(player) {
        this.mp.updatePlayer(player.deviceId, { ready: true });
        player.ready = true;
        this.ui.updateLobby(this.mp.getPlayers());
        this.mp.broadcast({ type: 'lobby_update', players: this._publicPlayers() });
    }

    _tryStartGame() {
        const players = this.mp.getPlayers();
        if (players.length === 0) { this.ui.showPopup('No players connected!', 'error'); return; }
        if (this.mp.humanCount() < 1) { this.ui.showPopup('Need at least 1 human player!', 'error'); return; }

        // Fill to 2 players with bots if needed
        while (this.mp.getPlayerCount() < 2) {
            this.mp.addBot('medium');
        }

        // Show world select
        this.ui.buildWorldGrid(WORLD_DATA, (id) => { this.selectedWorldId = id; });
        this.ui.showScreen('worldSelect');

        // Auto-launch if host doesn't pick within 8 seconds
        setTimeout(() => {
            if (this.state === STATES.LOBBY) this._launchGame(this.selectedWorldId);
        }, 8000);
    }

    _launchGame(worldId) {
        if (this.state !== STATES.LOBBY) return;
        this.world = WORLD_DATA.find(w => w.id === worldId) || WORLD_DATA[0];
        this.round = 0;

        // Reset all players
        for (const p of this.mp.getPlayers()) {
            Object.assign(p, {
                hp: 100, maxHp: 100, xp: 0, level: 1,
                coins: 0, position: 0, score: 0, streak: 0,
                ready: false, answeredThisRound: false, correctThisRound: false
            });
        }

        if (this.renderer) this.renderer.loadWorld(worldId);

        this.mp.broadcast({
            type: 'game_start',
            worldId, worldName: this.world.name,
            hostPlayerId: this.mp.getPlayers().find(p => this.mp.isHost(p))?.id,
            players: this._publicPlayers()
        });

        this._setState(STATES.PLAYING);
        window.gameAudio?.play('start');
        window.gameAudio?.playWorldMusic(worldId);
        this.ui.showScreen('game');
        this.ui.setCanvasTitle(`${this.world.emoji} ${this.world.name}`);
        this.ui.showPopup(`🚀 Adventure begins in ${this.world.name}!`, 'success', 3000);

        setTimeout(() => this._nextRound(), 2500);
    }

    // ── Game loop ────────────────────────────────────────────────
    _nextRound() {
        if (this.state === STATES.GAME_OVER) return;

        const winner = this._checkWin();
        if (winner || this.round >= this.MAX_ROUNDS) {
            this._endGame(winner);
            return;
        }

        this.round++;

        // Reset per-round flags
        for (const p of this.mp.getPlayers()) {
            p.answeredThisRound = false;
            p.correctThisRound = false;
        }
        this.pendingAns.clear();

        this.question = this.qEngine.generateQuestion(this.world.id);

        // Show encounter popup
        const maxPos = Math.max(...this.mp.getPlayers().map(p => p.position), 0);
        const enc = this.renderer ? this.renderer.getEncounterAt(maxPos) : 'normal';
        const popups = {
            monster: `${this.world.enemyEmoji} A wild monster appears! Answer fast!`,
            boss:    `${this.world.bossEmoji} BOSS BATTLE! ${this.world.bossName} challenges you!`,
            chest:   `${this.world.chestEmoji} Treasure chest! Solve to unlock bonus coins!`,
            treasure:`🏆 FINAL CHALLENGE — reach the treasure!`,
            normal:  `❓ Math Challenge Round ${this.round}!`
        };
        this.ui.showPopup(popups[enc] || popups.normal, enc === 'boss' ? 'danger' : 'info', 2200);

        setTimeout(() => {
            if (this.state !== STATES.PLAYING) return;
            this._setState(STATES.QUESTION);
            this.mp.broadcast({ type: 'question', data: this.question, round: this.round });
            this.ui.showQuestion(this.question, this.round, this.MAX_ROUNDS, this.mp.getPlayers());
            this.mp.simulateBotAnswers(this.question, this.TIME_LIMIT - 2000);
            this.qTimerId = setTimeout(() => this._closeQuestion(), this.TIME_LIMIT);
        }, 2400);
    }

    _onAnswer(player, value, timestamp) {
        if (this.state !== STATES.QUESTION) return;
        if (player.answeredThisRound) return;

        player.answeredThisRound = true;

        const correct = value == this.question.answer;   // loose equality handles string/number
        const responseTime = timestamp - (Date.now() - this.TIME_LIMIT);

        this.pendingAns.set(player.id, { player, value, correct, responseTime, timedOut: false });

        this.ui.markPlayerAnswered(player);

        // Immediate feedback to controller
        this.mp.sendToPlayer(player.id, {
            type: 'answer_feedback',
            correct,
            correctAnswer: this.question.answer
        });

        // If all humans answered, close early
        const humans = this.mp.getPlayers().filter(p => !p.isBot);
        if (humans.every(p => p.answeredThisRound)) {
            clearTimeout(this.qTimerId);
            setTimeout(() => this._closeQuestion(), 800);
        }
    }

    _closeQuestion() {
        if (this.state !== STATES.QUESTION) return;
        clearTimeout(this.qTimerId);
        this._setState(STATES.REVEAL);
        this.ui.stopTimer();

        // Mark non-answerers as timed-out
        for (const p of this.mp.getPlayers()) {
            if (!p.answeredThisRound) {
                this.pendingAns.set(p.id, { player: p, value: null, correct: false, responseTime: 99999, timedOut: true });
            }
        }

        // Reveal correct option index on screen
        const ci = this.question.options.indexOf(this.question.answer);
        this.ui.revealAnswer(ci);

        this._processResults();

        const results = [...this.pendingAns.values()];
        this.ui.showRoundResult(results, this.question.answer);

        for (const p of this.mp.getPlayers()) {
            const result = results.find(r => r.player.id === p.id);
            this.mp.sendToPlayer(p.id, {
                type: 'round_result',
                correctAnswer: this.question.answer,
                result: {
                    correct: result?.correct || false,
                    points: result?.points || 0,
                    timedOut: result?.timedOut || false,
                    position: p.position
                },
                players: this._publicPlayers()
            });
        }

        setTimeout(() => {
            if (this.state !== STATES.REVEAL) return;
            this._setState(STATES.PLAYING);
            this.ui.showScreen('game');
            const winner = this._checkWin();
            if (winner) { this._endGame(winner); }
            else { setTimeout(() => this._nextRound(), 1500); }
        }, 3200);
    }

    _processResults() {
        const results = [...this.pendingAns.values()]
            .sort((a, b) => {
                if (b.correct !== a.correct) return b.correct - a.correct;
                return a.responseTime - b.responseTime;
            });

        let firstCorrectDone = false;

        results.forEach((r, rank) => {
            const p = r.player;
            if (r.correct) {
                const pts = [100, 75, 50, 25][rank] ?? 15;
                r.points = pts;
                p.score += pts;
                p.xp    += firstCorrectDone ? 20 : 30;
                p.coins += firstCorrectDone ? 5  : 10;
                p.streak++;
                p.correctThisRound = true;

                // Advance on map
                const move = firstCorrectDone ? 1 : 2;
                p.position = Math.min(20, p.position + move);
                firstCorrectDone = true;

                // Level up
                if (p.xp >= p.level * 100) {
                    p.level++;
                    this.mp.sendToPlayer(p.id, { type: 'level_up', level: p.level });
                }
            } else {
                r.points = 0;
                p.hp      = Math.max(0, p.hp - (r.timedOut ? 5 : 10));
                p.streak  = 0;
            }

            // Sync full player state back to controller
            this.mp.sendToPlayer(p.id, { type: 'player_update', player: this._safePlayer(p) });
        });
    }

    _checkWin() {
        return this.mp.getPlayers().find(p => p.position >= 20) || null;
    }

    _endGame(winner) {
        this._setState(STATES.GAME_OVER);
        const scoreboard = [...this.mp.getPlayers()].sort((a, b) => {
            if (b.position !== a.position) return b.position - a.position;
            return b.score - a.score;
        });
        const w = winner || scoreboard[0];
        this.ui.showGameOver(w, scoreboard);
        this.mp.broadcast({
            type: 'game_over',
            winnerId: w.id,
            scoreboard: scoreboard.map(p => this._safePlayer(p))
        });
    }

    _resetToLobby() {
        clearTimeout(this.qTimerId);
        window.gameAudio?.stopWorldMusic();
        this.round = 0;
        this.question = null;
        this.pendingAns.clear();
        for (const p of this.mp.getPlayers()) {
            p.ready = false;
            p.answeredThisRound = false;
        }
        this._setState(STATES.LOBBY);
        this.ui.showScreen('lobby');
        this.ui.updateLobby(this.mp.getPlayers());
        this.mp.broadcast({ type: 'reset', state: STATES.LOBBY, players: this._publicPlayers() });
    }

    // ── Helpers ──────────────────────────────────────────────────
    _setState(s) {
        console.log(`[Game] ${this.state} → ${s}`);
        this.state = s;
    }

    _safePlayer(p) {
        return {
            id: p.id, nickname: p.nickname, character: p.character,
            hp: p.hp, maxHp: p.maxHp, xp: p.xp, level: p.level,
            coins: p.coins, position: p.position, score: p.score, streak: p.streak,
            isBot: p.isBot
        };
    }

    _publicPlayers() {
        return this.mp.getPlayers().map(p => this._safePlayer(p));
    }

    _syncPlayer(player) {
        this.mp.sendToPlayer(player.id, {
            type: 'state_sync',
            gameState: this.state,
            player: this._safePlayer(player),
            players: this._publicPlayers()
        });
    }
}

// ── Bootstrap ────────────────────────────────────────────────────
let game;
window.addEventListener('DOMContentLoaded', () => { game = new Game(); });
