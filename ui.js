'use strict';

const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
const CHAR_EMOJI = { explorer_boy: '🧒', explorer_girl: '👧', robomath: '🤖', astro_cat: '🐱' };

class UIManager {
    constructor() {
        this.timerInterval = null;
        this.timerWarningTimeout = null;
        this.popupTimer = null;
        this._cacheEls();
    }

    _cacheEls() {
        this.el = {
            // Screens
            sLobby:      document.getElementById('screen-lobby'),
            sGame:       document.getElementById('screen-game'),
            sQuestion:   document.getElementById('screen-question'),
            sResult:     document.getElementById('screen-result'),
            sGameOver:   document.getElementById('screen-game-over'),
            sWorldSel:   document.getElementById('screen-world-select'),
            // Lobby
            playerList:  document.getElementById('player-list'),
            lobbyMsg:    document.getElementById('lobby-msg'),
            btnStart:    document.getElementById('btn-start-game'),
            // Question
            qNum:        document.getElementById('q-number'),
            qWorldBadge: document.getElementById('q-world-badge'),
            qText:       document.getElementById('q-text'),
            qOptions:    document.getElementById('q-options'),
            qTimer:      document.getElementById('q-timer'),
            qTimerBar:   document.getElementById('q-timer-bar'),
            qAnswered:   document.getElementById('q-answered'),
            // Result
            rList:       document.getElementById('result-list'),
            rCorrect:    document.getElementById('result-correct'),
            // Game Over
            goWinner:    document.getElementById('go-winner'),
            goBoard:     document.getElementById('go-scoreboard'),
            // World select
            worldGrid:   document.getElementById('world-grid'),
            // HUD
            hud:         document.getElementById('game-hud'),
            hudWorld:    document.getElementById('hud-world'),
            hudRound:    document.getElementById('hud-round'),
            // Popup
            popup:       document.getElementById('popup'),
            // Canvas title bar
            canvasTitle: document.getElementById('canvas-title'),
        };
    }

    showScreen(name) {
        const all = ['sLobby', 'sGame', 'sQuestion', 'sResult', 'sGameOver', 'sWorldSel'];
        all.forEach(k => this.el[k] && this.el[k].classList.add('hidden'));
        const map = { lobby: 'sLobby', game: 'sGame', question: 'sQuestion',
                      result: 'sResult', gameOver: 'sGameOver', worldSelect: 'sWorldSel' };
        const target = this.el[map[name]];
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('anim-enter');
            setTimeout(() => target.classList.remove('anim-enter'), 600);
        }
    }

    // ── Lobby ────────────────────────────────────────────────────
    updateLobby(players, minPlayers = 2) {
        const { playerList, lobbyMsg, btnStart } = this.el;
        if (!playerList) return;

        playerList.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const p = players[i];
            const card = document.createElement('div');
            card.className = 'player-card' + (p ? ' connected' : ' empty');
            if (p) card.style.borderColor = PLAYER_COLORS[i];

            if (p) {
                card.innerHTML = `
                    <div class="pc-avatar" style="background:${PLAYER_COLORS[i]}">${CHAR_EMOJI[p.character] || '❓'}</div>
                    <div class="pc-body">
                        <div class="pc-name">${p.nickname}</div>
                        <div class="pc-status ${p.ready ? 'status-ready' : 'status-wait'}">
                            ${p.ready ? '✅ READY!' : '⏳ Getting ready...'}
                        </div>
                        <div class="pc-char">${this._charLabel(p.character)}</div>
                    </div>`;
            } else {
                card.innerHTML = `
                    <div class="pc-avatar empty-slot">P${i + 1}</div>
                    <div class="pc-body">
                        <div class="pc-name">Waiting for player...</div>
                        <div class="pc-status status-wait">📱 Scan QR Code</div>
                    </div>`;
            }
            playerList.appendChild(card);
        }

        const readyCount = players.filter(p => p.ready).length;
        const canStart = players.length >= minPlayers && readyCount >= players.length;
        if (btnStart) {
            btnStart.disabled = !canStart;
            btnStart.textContent = canStart ? '🚀 START ADVENTURE!' :
                players.length < minPlayers ? `Waiting for players (${players.length}/${minPlayers})` :
                `⏳ Waiting for ready (${readyCount}/${players.length})`;
        }
        if (lobbyMsg) {
            lobbyMsg.textContent = players.length < minPlayers
                ? `📱 Need at least ${minPlayers} players — scan the QR code with your phone!`
                : canStart ? '🎉 All ready! Host can start the adventure!'
                : '⏳ Waiting for all players to be ready...';
        }
    }

    _charLabel(c) {
        const m = { explorer_boy: '🧒 Explorer Boy', explorer_girl: '👧 Explorer Girl',
                    robomath: '🤖 RoboMath', astro_cat: '🐱 Astro Cat' };
        return m[c] || c;
    }

    // ── World Select ─────────────────────────────────────────────
    buildWorldGrid(worlds, onSelect, selectedWorldId = null) {
        const { worldGrid } = this.el;
        if (!worldGrid) return;
        worldGrid.innerHTML = '';
        worlds.forEach(w => {
            const card = document.createElement('div');
            card.className = `world-card${w.id === selectedWorldId ? ' selected' : ''}`;
            card.style.setProperty('--wc', w.primaryColor);
            card.innerHTML = `
                <div class="wc-emoji">${w.emoji}</div>
                <div class="wc-name">${w.name}</div>
                <div class="wc-sub">${w.subtitle}</div>
                <div class="wc-skills">${w.skills}</div>`;
            card.addEventListener('click', () => {
                worldGrid.querySelectorAll('.world-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                onSelect?.(w.id);
            });
            worldGrid.appendChild(card);
        });
    }

    // ── Question screen ──────────────────────────────────────────
    showQuestion(q, round, maxRounds, players) {
        const { qNum, qWorldBadge, qText, qOptions, qTimer, qTimerBar, qAnswered } = this.el;
        const LABELS = ['A', 'B', 'C', 'D'];

        if (qNum) qNum.textContent = `Q ${round}/${maxRounds}`;
        if (qWorldBadge) qWorldBadge.textContent = `${q.theme || '❓'} World ${q.worldLevel}`;
        if (qText) qText.textContent = q.question;

        if (qOptions) {
            qOptions.innerHTML = '';
            q.options.forEach((opt, i) => {
                const d = document.createElement('div');
                d.className = 'q-option';
                d.dataset.idx = i;
                d.innerHTML = `<span class="opt-letter">${LABELS[i] || i + 1}</span><span class="opt-val">${opt}</span>`;
                qOptions.appendChild(d);
            });
        }

        if (qAnswered) qAnswered.innerHTML = '';
        window.gameAudio?.play('question');
        this._startTimer(20, qTimer, qTimerBar);
        this.showScreen('question');
    }

    markPlayerAnswered(player) {
        const { qAnswered } = this.el;
        if (!qAnswered) return;
        const span = document.createElement('span');
        span.className = 'answered-badge';
        span.style.background = PLAYER_COLORS[(player.id - 1) % PLAYER_COLORS.length];
        span.textContent = CHAR_EMOJI[player.character] || '✅';
        qAnswered.appendChild(span);
    }

    revealAnswer(correctIdx) {
        document.querySelectorAll('.q-option').forEach((opt, i) => {
            if (i === correctIdx) opt.classList.add('opt-correct');
        });
    }

    stopTimer() {
        clearInterval(this.timerInterval);
        clearTimeout(this.timerWarningTimeout);
    }

    _startTimer(seconds, timerEl, barEl) {
        this.stopTimer();
        let remaining = seconds;
        const tick = () => {
            if (timerEl) timerEl.textContent = remaining;
            if (barEl) {
                const pct = (remaining / seconds) * 100;
                barEl.style.width = pct + '%';
                barEl.style.background = pct > 50 ? '#2ECC71' : pct > 25 ? '#F39C12' : '#E74C3C';
            }
            if (timerEl) timerEl.classList.toggle('timer-urgent', remaining <= 5);
            if (remaining <= 0) return;

            window.gameAudio?.play('tick', { urgent: remaining <= 5 });
            if (remaining <= 5) {
                this.timerWarningTimeout = setTimeout(() => {
                    window.gameAudio?.play('tick', { urgent: true });
                }, 500);
            }
            remaining--;
        };
        tick();
        this.timerInterval = setInterval(() => {
            tick();
            if (remaining <= 0) this.stopTimer();
        }, 1000);
    }

    // ── Result screen ────────────────────────────────────────────
    showRoundResult(results, correctAnswer) {
        const { rList, rCorrect } = this.el;
        window.gameAudio?.play(results.some(result => result.correct) ? 'correct' : 'wrong');
        if (rCorrect) rCorrect.textContent = `✅ Answer: ${correctAnswer}`;

        if (rList) {
            rList.innerHTML = '';
            const sorted = [...results].sort((a, b) => (b.correct - a.correct) || (a.responseTime - b.responseTime));
            sorted.forEach((r, rank) => {
                const d = document.createElement('div');
                d.className = `result-row ${r.correct ? 'row-correct' : 'row-wrong'}`;
                d.style.setProperty('--pc', PLAYER_COLORS[(r.player.id - 1) % PLAYER_COLORS.length]);
                d.innerHTML = `
                    <span class="rr-rank">${['🥇','🥈','🥉','4️⃣'][rank] || '—'}</span>
                    <span class="rr-avatar">${CHAR_EMOJI[r.player.character] || '❓'}</span>
                    <span class="rr-name">${r.player.nickname}</span>
                    <span class="rr-icon">${r.correct ? '✅' : '❌'}</span>
                    <span class="rr-pts">${r.correct ? `+${r.points} pts` : r.timedOut ? '⏱️ Too slow' : '-10 HP'}</span>
                    <span class="rr-pos">📍 ${r.player.position}/20</span>`;
                rList.appendChild(d);
            });
        }
        this.showScreen('result');
    }

    // ── HUD (overlaid on canvas) ─────────────────────────────────
    updateHUD(players, worldName, round) {
        const { hud, hudWorld, hudRound } = this.el;
        if (hudWorld) hudWorld.textContent = worldName || '';
        if (hudRound) hudRound.textContent = `Round ${round}`;

        if (!hud) return;
        hud.innerHTML = players.map((p, i) => {
            const hpPct = Math.round((p.hp / p.maxHp) * 100);
            const hpColor = hpPct > 50 ? '#2ECC71' : hpPct > 25 ? '#F39C12' : '#E74C3C';
            return `
                <div class="hud-card" style="border-color:${PLAYER_COLORS[i]}">
                    <div class="hud-av" style="background:${PLAYER_COLORS[i]}">${CHAR_EMOJI[p.character] || '❓'}</div>
                    <div class="hud-body">
                        <div class="hud-name">${p.nickname}</div>
                        <div class="hud-hp-wrap">
                            <div class="hud-hp-bar" style="width:${hpPct}%;background:${hpColor}"></div>
                        </div>
                        <div class="hud-stats">⭐${p.score} 🪙${p.coins} 📍${p.position}/20</div>
                    </div>
                    <div class="hud-lv">Lv${p.level}</div>
                </div>`;
        }).join('');
    }

    // ── Game Over ────────────────────────────────────────────────
    showGameOver(winner, scoreboard) {
        const { goWinner, goBoard } = this.el;
        window.gameAudio?.play('victory');
        if (goWinner) {
            goWinner.innerHTML = `
                <div class="go-trophy">🏆</div>
                <div class="go-winner-emoji">${CHAR_EMOJI[winner.character] || '🎉'}</div>
                <div class="go-winner-name">${winner.nickname}</div>
                <div class="go-winner-sub">Winner! Score: ${winner.score} · Coins: ${winner.coins}</div>`;
        }
        if (goBoard) {
            const medals = ['🥇', '🥈', '🥉', '4️⃣'];
            goBoard.innerHTML = scoreboard.map((p, i) => `
                <div class="sb-row">
                    <span class="sb-medal">${medals[i] || ''}</span>
                    <span class="sb-av" style="background:${PLAYER_COLORS[i]}">${CHAR_EMOJI[p.character] || '❓'}</span>
                    <span class="sb-name">${p.nickname}</span>
                    <span class="sb-pos">📍 ${p.position}/20</span>
                    <span class="sb-score">⭐ ${p.score}</span>
                    <span class="sb-coins">🪙 ${p.coins}</span>
                </div>`).join('');
        }
        this.showScreen('gameOver');
    }

    // ── Popup ────────────────────────────────────────────────────
    showPopup(msg, type = 'info', duration = 2500) {
        const { popup } = this.el;
        if (!popup) return;
        clearTimeout(this.popupTimer);
        popup.textContent = msg;
        popup.className = `popup popup-${type} popup-show`;
        this.popupTimer = setTimeout(() => popup.classList.remove('popup-show'), duration);
    }

    setCanvasTitle(text) {
        if (this.el.canvasTitle) this.el.canvasTitle.textContent = text;
    }
}
