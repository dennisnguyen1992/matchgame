'use strict';

const CHAR_EMOJI = { explorer_boy: '🧒', explorer_girl: '👧', robomath: '🤖', astro_cat: '🐱' };
const CHAR_NAMES = {
    explorer_boy:  'Explorer Boy',
    explorer_girl: 'Explorer Girl',
    robomath:      'RoboMath',
    astro_cat:     'Astro Cat'
};
const CHAR_DESC = {
    explorer_boy:  '⚖️ Balanced adventurer. Good all-rounder.',
    explorer_girl: '💨 Fast answers = bonus XP!',
    robomath:      '🎯 High accuracy gives bonus points.',
    astro_cat:     '🍀 Lucky bonuses on treasure squares!'
};
const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
const ANSWER_COLORS  = ['#6C63FF', '#2ECC71', '#E74C3C', '#F39C12'];
const ANSWER_LABELS  = ['A', 'B', 'C', 'D'];

class Controller {
    constructor() {
        this.ac          = new AirConsole();
        this.playerId    = null;
        this.isHost      = false;
        this.player      = null;
        this.gameState   = 'LOBBY';
        this.question    = null;
        this.selectedChar = 'explorer_boy';
        this.nickname    = '';
        this.answered    = false;
        this.timerInt    = null;
        this.worlds      = [];
        this.selectedWorldIndex = 0;

        this._cacheEls();
        this._bindAirConsole();
        this._bindUI();
        const versionEl = document.getElementById('load-version');
        const version = window.GAME_VERSION || '1.0.2';
        if (versionEl) versionEl.textContent = `Version ${version}`;
        const playVersionEl = document.getElementById('play-version');
        if (playVersionEl) playVersionEl.textContent = `Version ${version}`;
        this._showScreen('loading');
    }

    // ── DOM cache ──────────────────────────────────────────────
    _cacheEls() {
        this.el = {
            // Screens
            sLoading:   document.getElementById('s-loading'),
            sLobby:     document.getElementById('s-lobby'),
            sWorldSelect: document.getElementById('s-world-select'),
            sCharSel:   document.getElementById('s-char-select'),
            sPlaying:   document.getElementById('s-playing'),
            sQuestion:  document.getElementById('s-question'),
            sFeedback:  document.getElementById('s-feedback'),
            sRoundResult: document.getElementById('s-round-result'),
            sGameOver:  document.getElementById('s-gameover'),

            // Loading
            loadMsg:    document.getElementById('load-msg'),

            // Lobby
            lobbyName:  document.getElementById('lobby-name'),
            lobbyChar:  document.getElementById('lobby-char'),
            lobbyStatus:document.getElementById('lobby-status'),
            nickInput:  document.getElementById('nick-input'),
            btnReady:   document.getElementById('btn-ready'),
            btnCharSel: document.getElementById('btn-char-select'),
            worldRole: document.getElementById('controller-world-role'),
            worldEmoji: document.getElementById('controller-world-emoji'),
            worldName: document.getElementById('controller-world-name'),
            worldSubtitle: document.getElementById('controller-world-subtitle'),
            worldSkills: document.getElementById('controller-world-skills'),
            worldPrev: document.getElementById('btn-controller-world-prev'),
            worldNext: document.getElementById('btn-controller-world-next'),
            worldStart: document.getElementById('btn-controller-world-start'),
            worldWait: document.getElementById('controller-world-wait'),

            // Character select
            charGrid:   document.getElementById('char-grid'),

            // Playing
            playHP:     document.getElementById('play-hp'),
            playHPBar:  document.getElementById('play-hp-bar'),
            playXP:     document.getElementById('play-xp'),
            playCoins:  document.getElementById('play-coins'),
            playPos:    document.getElementById('play-pos'),
            playScore:  document.getElementById('play-score'),
            playStreak: document.getElementById('play-streak'),
            playLevel:  document.getElementById('play-level'),
            playChar:   document.getElementById('play-char'),
            playName:   document.getElementById('play-name'),
            playWait:   document.getElementById('play-wait'),
            btnHostQuit: document.getElementById('btn-host-quit'),
            quitConfirm: document.getElementById('quit-confirm'),
            btnQuitNo:   document.getElementById('btn-quit-no'),
            btnQuitYes:  document.getElementById('btn-quit-yes'),

            // Question
            qRound:     document.getElementById('q-round'),
            qText:      document.getElementById('q-text'),
            qBtns:      document.getElementById('q-buttons'),
            qTimer:     document.getElementById('q-timer'),
            qTimerBar:  document.getElementById('q-timer-bar'),
            qAnswered:  document.getElementById('q-answered-msg'),

            // Feedback
            fbIcon:     document.getElementById('fb-icon'),
            fbMsg:      document.getElementById('fb-msg'),
            fbSub:      document.getElementById('fb-sub'),
            fbAnswer:   document.getElementById('fb-correct-answer'),

            // Game over
            goRank:     document.getElementById('go-rank'),
            goStats:    document.getElementById('go-stats'),
            goBoard:    document.getElementById('go-board'),
        };
    }

    // ── AirConsole ─────────────────────────────────────────────
    _bindAirConsole() {
        this.ac.onConnect = () => {
            this._setLoadMsg('🔗 Connected! Setting up...');
        };

        this.ac.onMessage = (from, data) => {
            if (from !== AirConsole.SCREEN) return;
            this._handleScreenMessage(data);
        };

        this.ac.onAdReady = () => { /* AirConsole ad integration hook */ };
    }

    _handleScreenMessage(data) {
        switch (data.type) {
            case 'player_assigned':
                this.playerId = data.playerId;
                this.isHost   = data.isHost;
                this.player   = data.player;
                this.selectedChar = data.player.character;
                this.nickname = data.player.nickname;
                this.gameState = data.gameState || 'LOBBY';
                this._onAssigned();
                break;

            case 'lobby_update':
                this._onLobbyUpdate(data);
                break;

            case 'world_select': {
                this.gameState = 'WORLD_SELECT';
                this.worlds = data.worlds || [];
                const selectedIndex = this.worlds.findIndex(w => w.id === data.selectedWorldId);
                this.selectedWorldIndex = selectedIndex >= 0 ? selectedIndex : 0;
                this._showWorldSelect();
                break;
            }

            case 'game_start':
                if (data.hostPlayerId) this.isHost = data.hostPlayerId === this.playerId;
                this.gameState = 'PLAYING';
                this._syncHostControls();
                window.gameAudio?.play('start');
                this._showScreen('playing');
                this._toast(`🚀 Adventure starts! World: ${data.worldName}`, 'success');
                break;

            case 'question':
                this.gameState = 'QUESTION';
                window.gameAudio?.play('question');
                this.question  = data.data;
                this.answered  = false;
                this._showQuestion(data.data, data.round);
                break;

            case 'answer_feedback':
                this._showFeedback(data.correct, data.correctAnswer);
                break;

            case 'round_result':
                this.gameState = 'PLAYING';
                this._updatePlayerFromResults(data);
                break;

            case 'player_update':
                this._applyPlayerUpdate(data.player);
                break;

            case 'level_up':
                window.gameAudio?.play('levelUp');
                this._toast(`🎉 Level Up! You are now Level ${data.level}!`, 'success');
                break;

            case 'game_over':
                this.gameState = 'GAME_OVER';
                this._showGameOver(data);
                break;

            case 'reset':
                this.gameState = 'LOBBY';
                this.answered  = false;
                this._closeQuitConfirm();
                this._showScreen('lobby');
                this._syncLobbyUI();
                break;

            case 'state_sync':
                this.gameState = data.gameState;
                if (data.player) this._applyPlayerUpdate(data.player);
                this._showScreenForState(data.gameState);
                break;

            case 'error':
                this._toast(`❌ ${data.msg}`, 'error');
                break;
        }
    }

    _send(data) {
        this.ac.message(AirConsole.SCREEN, data);
    }

    // ── UI binding ─────────────────────────────────────────────
    _bindUI() {
        // Nickname input
        this.el.nickInput?.addEventListener('input', (e) => {
            this.nickname = e.target.value.trim().substring(0, 12);
        });
        this.el.nickInput?.addEventListener('blur', () => {
            if (this.nickname) {
                this._send({ type: 'set_nickname', nickname: this.nickname });
            }
        });

        // Ready button
        this.el.btnReady?.addEventListener('click', () => {
            window.gameAudio?.unlock();
            if (!this.nickname) {
                this.nickname = `Hero ${this.playerId}`;
                if (this.el.nickInput) this.el.nickInput.value = this.nickname;
            }
            this._send({ type: 'set_nickname', nickname: this.nickname });
            this._send({ type: 'ready' });
            this.el.btnReady.textContent = '✅ Ready!';
            this.el.btnReady.disabled = true;
            this.el.btnReady.style.background = '#2ECC71';
            if (this.el.lobbyStatus) this.el.lobbyStatus.textContent = '✅ You are READY!';
        });

        // Character select button
        this.el.btnCharSel?.addEventListener('click', () => {
            window.gameAudio?.unlock();
            this._showScreen('charSelect');
            this._buildCharGrid();
        });

        // Host start (only if isHost)
        document.getElementById('btn-host-start')?.addEventListener('click', () => {
            window.gameAudio?.unlock();
            this._send({ type: 'start_game' });
        });

        this.el.btnHostQuit?.addEventListener('click', () => {
            this.el.quitConfirm?.classList.add('visible');
            this.el.quitConfirm?.setAttribute('aria-hidden', 'false');
        });
        this.el.btnQuitNo?.addEventListener('click', () => {
            this._closeQuitConfirm();
        });
        this.el.btnQuitYes?.addEventListener('click', () => {
            this._closeQuitConfirm();
            this._send({ type: 'force_quit' });
        });
        this.el.worldPrev?.addEventListener('click', () => this._changeWorld(-1));
        this.el.worldNext?.addEventListener('click', () => this._changeWorld(1));
        this.el.worldStart?.addEventListener('click', () => {
            window.gameAudio?.unlock();
            this._send({ type: 'launch_game' });
        });
    }

    // ── Screen management ──────────────────────────────────────
    _showScreen(name) {
        const map = {
            loading:  'sLoading',
            lobby:    'sLobby',
            worldSelect: 'sWorldSelect',
            charSelect:'sCharSel',
            playing:  'sPlaying',
            question: 'sQuestion',
            feedback: 'sFeedback',
            roundResult: 'sRoundResult',
            gameOver: 'sGameOver'
        };
        Object.values(map).forEach(k => this.el[k]?.classList.add('hidden'));
        const target = this.el[map[name]];
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('slide-in');
            setTimeout(() => target.classList.remove('slide-in'), 500);
        }
        this._syncHostControls();
    }

    _syncHostControls() {
        if (!this.el.btnHostQuit) return;
        const inGame = ['playing', 'question', 'feedback', 'roundResult'].includes(this.gameState);
        this.el.btnHostQuit.style.display = inGame ? 'block' : 'none';
    }

    _showWorldSelect() {
        const world = this.worlds[this.selectedWorldIndex];
        if (!world) return;
        const isHost = this.isHost;
        if (this.el.worldRole) this.el.worldRole.textContent = isHost ? 'Choose the next adventure' : 'The host is choosing the world';
        if (this.el.worldEmoji) this.el.worldEmoji.textContent = world.emoji;
        if (this.el.worldName) this.el.worldName.textContent = world.name;
        if (this.el.worldSubtitle) this.el.worldSubtitle.textContent = world.subtitle;
        if (this.el.worldSkills) this.el.worldSkills.textContent = world.skills;
        if (this.el.worldPrev) this.el.worldPrev.style.display = isHost ? 'block' : 'none';
        if (this.el.worldNext) this.el.worldNext.style.display = isHost ? 'block' : 'none';
        if (this.el.worldStart) this.el.worldStart.style.display = isHost ? 'block' : 'none';
        if (this.el.worldWait) this.el.worldWait.style.display = isHost ? 'none' : 'block';
        this._showScreen('worldSelect');
    }

    _changeWorld(direction) {
        if (!this.isHost || !this.worlds.length) return;
        this.selectedWorldIndex = (this.selectedWorldIndex + direction + this.worlds.length) % this.worlds.length;
        const world = this.worlds[this.selectedWorldIndex];
        this._send({ type: 'select_world', worldId: world.id });
        this._showWorldSelect();
    }

    _closeQuitConfirm() {
        this.el.quitConfirm?.classList.remove('visible');
        this.el.quitConfirm?.setAttribute('aria-hidden', 'true');
    }

    _showScreenForState(state) {
        switch (state) {
            case 'LOBBY':    this._showScreen('lobby');    break;
            case 'PLAYING':  this._showScreen('playing');  break;
            case 'QUESTION': break; // question message will arrive
            case 'GAME_OVER':break; // game_over message will arrive
        }
    }

    _setLoadMsg(msg) {
        if (this.el.loadMsg) this.el.loadMsg.textContent = msg;
    }

    // ── Lobby ──────────────────────────────────────────────────
    _onAssigned() {
        this._showScreen('lobby');
        this._syncLobbyUI();
    }

    _onLobbyUpdate(data) {
        if (!this.playerId && data.yourId) this.playerId = data.yourId;
        // Find own player in the list
        if (data.players) {
            const me = data.players.find(p => p.id === this.playerId);
            if (me) {
                this.selectedChar = me.character;
                this.nickname     = me.nickname;
            }
        }
        this._syncLobbyUI();
    }

    _syncLobbyUI() {
        const color = PLAYER_COLORS[(this.playerId - 1) % PLAYER_COLORS.length];
        if (this.el.lobbyName) this.el.lobbyName.textContent = this.nickname || `Hero ${this.playerId}`;
        if (this.el.lobbyChar) {
            this.el.lobbyChar.textContent = CHAR_EMOJI[this.selectedChar];
            this.el.lobbyChar.style.background = color;
        }
        if (this.el.nickInput && !this.el.nickInput.value) this.el.nickInput.value = this.nickname || '';

        // Show/hide host start button
        const hostBtn = document.getElementById('btn-host-start');
        if (hostBtn) hostBtn.style.display = this.isHost ? 'block' : 'none';
        this._syncHostControls();
    }

    // ── Character Select ───────────────────────────────────────
    _buildCharGrid() {
        const { charGrid } = this.el;
        if (!charGrid) return;
        charGrid.innerHTML = '';

        ['explorer_boy', 'explorer_girl', 'robomath', 'astro_cat'].forEach(char => {
            const card = document.createElement('div');
            card.className = 'char-card' + (char === this.selectedChar ? ' selected' : '');
            card.innerHTML = `
                <div class="char-emoji">${CHAR_EMOJI[char]}</div>
                <div class="char-name">${CHAR_NAMES[char]}</div>
                <div class="char-desc">${CHAR_DESC[char]}</div>`;
            card.addEventListener('click', () => {
                this.selectedChar = char;
                this._send({ type: 'select_character', character: char });
                this._buildCharGrid(); // re-render to update selection
                setTimeout(() => {
                    this._showScreen('lobby');
                    this._syncLobbyUI();
                }, 400);
            });
            charGrid.appendChild(card);
        });
    }

    // ── Playing screen ─────────────────────────────────────────
    _applyPlayerUpdate(p) {
        this.player = p;
        const { playHP, playHPBar, playXP, playCoins, playPos, playScore,
                playStreak, playLevel, playChar, playName } = this.el;

        if (playHP) playHP.textContent = `${p.hp}/${p.maxHp}`;
        if (playHPBar) {
            const pct = Math.round((p.hp / p.maxHp) * 100);
            playHPBar.style.width = pct + '%';
            playHPBar.style.background = pct > 50 ? '#2ECC71' : pct > 25 ? '#F39C12' : '#E74C3C';
        }
        if (playXP)     playXP.textContent     = p.xp;
        if (playCoins)  playCoins.textContent   = p.coins;
        if (playPos)    playPos.textContent     = `${p.position}/20`;
        if (playScore)  playScore.textContent   = p.score;
        if (playStreak) playStreak.textContent  = p.streak > 0 ? `🔥 ${p.streak}` : '—';
        if (playLevel)  playLevel.textContent   = `Lv ${p.level}`;
        if (playChar)   playChar.textContent    = CHAR_EMOJI[p.character] || '🧒';
        if (playName)   playName.textContent    = p.nickname;
    }

    // ── Question ───────────────────────────────────────────────
    _showQuestion(q, round) {
        this.answered = false;
        const { qRound, qText, qBtns, qTimer, qTimerBar, qAnswered } = this.el;

        if (qRound) qRound.textContent = `Round ${round}`;
        if (qText)  qText.textContent  = q.question;

        if (qBtns) {
            qBtns.innerHTML = '';
            q.options.forEach((opt, i) => {
                const btn = document.createElement('button');
                btn.className = 'answer-btn';
                btn.style.setProperty('--ac', ANSWER_COLORS[i % ANSWER_COLORS.length]);
                btn.innerHTML = `<span class="ans-label">${ANSWER_LABELS[i]}</span><span class="ans-val">${opt}</span>`;
                btn.addEventListener('click', () => {
                    if (this.answered) return;
                    window.gameAudio?.unlock();
                    this.answered = true;

                    // Highlight selected
                    qBtns.querySelectorAll('.answer-btn').forEach(b => b.classList.add('dimmed'));
                    btn.classList.remove('dimmed');
                    btn.classList.add('selected');

                    this._send({ type: 'answer', value: opt, timestamp: Date.now() });
                    if (qAnswered) qAnswered.textContent = '✅ Answer submitted! Waiting for others...';
                    qBtns.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);
                });
                qBtns.appendChild(btn);
            });
        }

        if (qAnswered) qAnswered.textContent = '';
        this._startTimer(20, qTimer, qTimerBar);
        this._showScreen('question');
    }

    _startTimer(secs, timerEl, barEl) {
        clearInterval(this.timerInt);
        let rem = secs;
        const tick = () => {
            if (timerEl) timerEl.textContent = rem;
            if (barEl) {
                const pct = (rem / secs) * 100;
                barEl.style.width = pct + '%';
                barEl.style.background = pct > 50 ? '#2ECC71' : pct > 25 ? '#F39C12' : '#E74C3C';
            }
            if (timerEl) timerEl.classList.toggle('urgent', rem <= 5);
            if (rem-- <= 0) clearInterval(this.timerInt);
        };
        tick();
        this.timerInt = setInterval(tick, 1000);
    }

    // ── Answer feedback ────────────────────────────────────────
    _showFeedback(correct, correctAnswer) {
        clearInterval(this.timerInt);
        window.gameAudio?.play(correct ? 'correct' : 'wrong');
        const { fbIcon, fbMsg, fbSub, fbAnswer } = this.el;

        if (fbIcon)   fbIcon.textContent   = correct ? '✅' : '❌';
        if (fbMsg)    fbMsg.textContent    = correct ? 'Correct! Great job!' : 'Wrong answer!';
        if (fbSub)    fbSub.textContent    = correct
            ? '🏆 You earned points and moved forward!'
            : '💔 -10 HP — Don\'t give up!';
        if (fbAnswer) fbAnswer.textContent = correct
            ? ''
            : `✅ The answer was: ${correctAnswer}`;

        const el = document.getElementById('s-feedback');
        if (el) {
            el.style.background = correct ? 'linear-gradient(135deg,#0D3B1A,#1B5E20)' : 'linear-gradient(135deg,#3B0D0D,#5E1B1B)';
        }
        this._showScreen('feedback');
    }

    _updatePlayerFromResults(data) {
        const me = data.players?.find(p => p.id === this.playerId);
        if (me) this._applyPlayerUpdate(me);
        if (!data.result) return;

        const icon = document.getElementById('rr-icon');
        const msg = document.getElementById('rr-msg');
        const stats = document.getElementById('rr-stats');
        if (icon) icon.textContent = data.result.correct ? '✅' : data.result.timedOut ? '⏱️' : '❌';
        if (msg) msg.textContent = data.result.correct ? 'Correct! You moved forward.' : data.result.timedOut ? 'Time ran out.' : 'Not this time.';
        if (stats) stats.textContent = data.result.correct
            ? `+${data.result.points} points · 📍 ${me?.position ?? data.result.position}/20`
            : `${data.result.timedOut ? '-5' : '-10'} HP · 📍 ${me?.position ?? data.result.position}/20`;
        this._showScreen('roundResult');
    }

    // ── Game Over ──────────────────────────────────────────────
    _showGameOver(data) {
        const { goRank, goStats, goBoard } = this.el;
        const board = data.scoreboard || [];
        const myRank = board.findIndex(p => p.id === this.playerId) + 1;
        const me = board.find(p => p.id === this.playerId) || this.player;
        const medals = ['🥇', '🥈', '🥉', '4️⃣'];

        if (goRank) {
            goRank.textContent = medals[myRank - 1] || myRank;
            goRank.style.color = myRank === 1 ? '#FFD700' : 'white';
        }
        if (goStats && me) {
            goStats.textContent = `Score: ${me.score} · Position: ${me.position}/20 · Coins: ${me.coins}`;
        }
        if (goBoard) {
            goBoard.innerHTML = board.map((p, i) => `
                <div class="go-row ${p.id === this.playerId ? 'go-me' : ''}">
                    <span>${medals[i] || i + 1}</span>
                    <span>${CHAR_EMOJI[p.character] || '❓'}</span>
                    <span class="go-pname">${p.nickname}${p.id === this.playerId ? ' (You)' : ''}</span>
                    <span>📍${p.position}</span>
                    <span>⭐${p.score}</span>
                </div>`).join('');
        }

        const isWinner = myRank === 1;
        window.gameAudio?.play(isWinner ? 'victory' : 'wrong');
        if (isWinner) this._toast('🎉 YOU WON! Amazing math skills!', 'success');

        this._showScreen('gameOver');
    }

    // ── Toast notification ─────────────────────────────────────
    _toast(msg, type = 'info', duration = 2500) {
        const el = document.getElementById('toast');
        if (!el) return;
        clearTimeout(this._toastTimer);
        el.textContent = msg;
        el.className = `toast toast-${type} toast-show`;
        this._toastTimer = setTimeout(() => el.classList.remove('toast-show'), duration);
    }
}

window.addEventListener('DOMContentLoaded', () => new Controller());
