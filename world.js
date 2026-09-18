'use strict';

const WORLD_DATA = [
    {
        id: 1,
        name: 'Kindergarten Explorer',
        subtitle: 'Magical Forest Adventure',
        emoji: '🌲',
        bgGradientTop: '#5DBB63',
        bgGradientBot: '#2E7D32',
        pathColor: '#8B4513',
        pathBorder: '#5D3A1A',
        nodeColor: '#FFD700',
        skills: 'Counting · Number Recognition · Basic Addition',
        bossName: 'Grumpy Bear',
        bossEmoji: '🐻',
        enemyEmoji: '🐺',
        chestEmoji: '🍯',
        npcEmoji: '🧚',
        bgElements: ['🌳', '🌸', '🦋', '🐦', '🍄', '🌈', '🐸'],
        primaryColor: '#4CAF50',
        secondaryColor: '#81C784'
    },
    {
        id: 2,
        name: 'Pirate Island',
        subtitle: 'Treasure Maps & Hidden Coves',
        emoji: '🏴‍☠️',
        bgGradientTop: '#1565C0',
        bgGradientBot: '#0D47A1',
        pathColor: '#DEB887',
        pathBorder: '#A0522D',
        nodeColor: '#FFD700',
        skills: 'Addition & Subtraction up to 20',
        bossName: 'Captain Kraken',
        bossEmoji: '🦑',
        enemyEmoji: '🐊',
        chestEmoji: '💰',
        npcEmoji: '🦜',
        bgElements: ['⛵', '🌊', '🦈', '🏝️', '⚓', '🔱', '🐟'],
        primaryColor: '#1976D2',
        secondaryColor: '#42A5F5'
    },
    {
        id: 3,
        name: 'Jungle Expedition',
        subtitle: 'Hidden Temples & Animal Guardians',
        emoji: '🌿',
        bgGradientTop: '#1B5E20',
        bgGradientBot: '#33691E',
        pathColor: '#795548',
        pathBorder: '#4E342E',
        nodeColor: '#FFC107',
        skills: 'Add/Sub up to 100 · Multiplication Basics',
        bossName: 'Ancient Gorilla',
        bossEmoji: '🦍',
        enemyEmoji: '🐍',
        chestEmoji: '🏺',
        npcEmoji: '🦜',
        bgElements: ['🌴', '🐆', '🐘', '🦁', '🌺', '🦎', '🐊'],
        primaryColor: '#388E3C',
        secondaryColor: '#66BB6A'
    },
    {
        id: 4,
        name: 'Ancient Temple',
        subtitle: 'Traps, Puzzles & Number Secrets',
        emoji: '🏛️',
        bgGradientTop: '#37474F',
        bgGradientBot: '#263238',
        pathColor: '#B8860B',
        pathBorder: '#8B6914',
        nodeColor: '#E67E22',
        skills: 'Multiplication · Division · Basic Geometry',
        bossName: 'Stone Guardian',
        bossEmoji: '🗿',
        enemyEmoji: '👾',
        chestEmoji: '⚱️',
        npcEmoji: '🔮',
        bgElements: ['🏛️', '⚔️', '🗡️', '🔥', '💎', '🪬', '⚡'],
        primaryColor: '#607D8B',
        secondaryColor: '#90A4AE'
    },
    {
        id: 5,
        name: 'Lost Civilization',
        subtitle: 'Ancient Kingdom of Numbers',
        emoji: '🏺',
        bgGradientTop: '#4A148C',
        bgGradientBot: '#880E4F',
        pathColor: '#7B1FA2',
        pathBorder: '#4A148C',
        nodeColor: '#CE93D8',
        skills: 'Fractions · Area · Perimeter',
        bossName: 'Pharaoh Math',
        bossEmoji: '👑',
        enemyEmoji: '🦂',
        chestEmoji: '📜',
        npcEmoji: '🧙',
        bgElements: ['🏺', '⚱️', '🌙', '⭐', '🔮', '🪄', '🌟'],
        primaryColor: '#7B1FA2',
        secondaryColor: '#AB47BC'
    },
    {
        id: 6,
        name: 'Space Academy',
        subtitle: 'Galactic Math Missions',
        emoji: '🚀',
        bgGradientTop: '#0D0D2B',
        bgGradientBot: '#1A1A4E',
        pathColor: '#1565C0',
        pathBorder: '#0D47A1',
        nodeColor: '#E94560',
        skills: 'Decimals · Ratios · Word Problems',
        bossName: 'Galactic Emperor',
        bossEmoji: '👾',
        enemyEmoji: '🛸',
        chestEmoji: '🌟',
        npcEmoji: '🤖',
        bgElements: ['🌍', '🌙', '⭐', '🚀', '🪐', '☄️', '🌌'],
        primaryColor: '#1565C0',
        secondaryColor: '#42A5F5'
    }
];

function buildMapWaypoints(cw, ch) {
    // Snake path: 21 positions (0=start, 20=treasure)
    // 4 rows × 5 cols + 1 extra = 21 nodes
    const mx = 90, my = 100;
    const W = cw - mx * 2;
    const H = ch - my * 2 - 60;
    const cols = 5;
    const rows = 4;
    const dx = W / (cols - 1);
    const dy = H / (rows - 1);
    const pts = [];

    for (let r = 0; r < rows; r++) {
        const y = my + r * dy;
        const reversed = r % 2 === 1;
        for (let c = 0; c < cols; c++) {
            const col = reversed ? (cols - 1 - c) : c;
            pts.push({ x: Math.round(mx + col * dx), y: Math.round(y) });
        }
    }
    // Position 20: treasure just below last row, right side
    pts.push({ x: Math.round(mx + W), y: Math.round(my + H + 55) });
    return pts;
}

function buildEncounters() {
    // 21 positions: 0=start, 10=midBoss, 18=preBoss, 20=treasure
    const encounters = [];
    for (let i = 0; i <= 20; i++) {
        if (i === 0) encounters.push('start');
        else if (i === 20) encounters.push('treasure');
        else if (i === 10 || i === 18) encounters.push('boss');
        else if (i % 5 === 0) encounters.push('chest');
        else if (i % 3 === 0) encounters.push('monster');
        else encounters.push('normal');
    }
    return encounters;
}

class WorldRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.world = null;
        this.waypoints = [];
        this.encounters = [];
        this.frame = 0;
        this.particles = [];
        this._buildParticles();
    }

    _buildParticles() {
        for (let i = 0; i < 18; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                spd: Math.random() * 0.4 + 0.15,
                sz: Math.random() * 22 + 10,
                op: Math.random() * 0.25 + 0.08,
                idx: i
            });
        }
    }

    loadWorld(worldId) {
        this.world = WORLD_DATA.find(w => w.id === worldId) || WORLD_DATA[0];
        this.waypoints = buildMapWaypoints(this.canvas.width, this.canvas.height);
        this.encounters = buildEncounters();
        this.frame = 0;
    }

    render(players) {
        if (!this.world) return;
        this.frame++;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._drawBackground();
        this._drawFloatingEmoji();
        this._drawPath();
        this._drawNodes();
        this._drawPlayers(players);
        this._drawMapLegend();
    }

    _drawBackground() {
        const ctx = this.ctx;
        const w = this.world;
        const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, w.bgGradientTop);
        grad.addColorStop(1, w.bgGradientBot);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Subtle grid overlay
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 60) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.canvas.height); ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += 60) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.canvas.width, y); ctx.stroke();
        }
    }

    _drawFloatingEmoji() {
        const ctx = this.ctx;
        const elems = this.world.bgElements;
        ctx.save();
        for (const p of this.particles) {
            p.y -= p.spd;
            if (p.y < -40) p.y = this.canvas.height + 40;
            ctx.globalAlpha = p.op + Math.sin(this.frame * 0.03 + p.idx) * 0.04;
            ctx.font = `${p.sz}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(elems[p.idx % elems.length], p.x, p.y);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    _drawPath() {
        const ctx = this.ctx;
        const pts = this.waypoints;
        if (pts.length < 2) return;

        // Shadow layer
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = this.world.pathBorder;
        ctx.lineWidth = 28;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.restore();

        // Main path
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = this.world.pathColor;
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Dashed center line
        ctx.setLineDash([12, 8]);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    _drawNodes() {
        const ctx = this.ctx;
        const pts = this.waypoints;
        const enc = this.encounters;
        const w = this.world;
        const pulse = Math.sin(this.frame * 0.08) * 3;

        for (let i = 0; i < pts.length; i++) {
            const { x, y } = pts[i];
            const type = enc[i] || 'normal';

            ctx.save();
            let color, size, emoji;

            switch (type) {
                case 'start':
                    color = '#2ECC71'; size = 28; emoji = '🏁'; break;
                case 'normal':
                    color = w.nodeColor; size = 20; emoji = null; break;
                case 'chest':
                    color = '#F39C12'; size = 26; emoji = w.chestEmoji; break;
                case 'monster':
                    color = '#E74C3C'; size = 24; emoji = w.enemyEmoji; break;
                case 'boss':
                    color = '#8E44AD'; size = 30 + pulse; emoji = w.bossEmoji; break;
                case 'treasure':
                    color = '#F1C40F'; size = 36 + pulse; emoji = '🏆'; break;
            }

            // Glow for special nodes
            if (type === 'boss' || type === 'treasure') {
                ctx.shadowColor = color;
                ctx.shadowBlur = 18 + pulse;
            }

            // Circle base
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Inner glow ring for boss/treasure
            if (type === 'boss' || type === 'treasure') {
                ctx.beginPath();
                ctx.arc(x, y, size - 6, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Emoji icon
            if (emoji) {
                ctx.font = `${size - 4}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(emoji, x, y);
            } else {
                // Position number
                ctx.font = `bold ${size - 4}px Arial`;
                ctx.fillStyle = '#333';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(i, x, y);
            }

            // Label below node
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            if (type === 'start') ctx.fillText('START', x, y + size + 4);
            else if (type === 'treasure') ctx.fillText('GOAL!', x, y + size + 4);
            else if (type === 'boss') ctx.fillText('BOSS', x, y + size + 4);
            else if (type !== 'normal') ctx.fillText(i, x, y + size + 4);

            ctx.restore();
        }
    }

    _drawPlayers(players) {
        if (!players || players.length === 0) return;
        const ctx = this.ctx;
        const pts = this.waypoints;
        const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
        const CHARS = { explorer_boy: '🧒', explorer_girl: '👧', robomath: '🤖', astro_cat: '🐱' };

        // Group by position
        const byPos = {};
        for (const p of players) {
            const pos = Math.min(p.position || 0, 20);
            if (!byPos[pos]) byPos[pos] = [];
            byPos[pos].push(p);
        }

        for (const [posStr, group] of Object.entries(byPos)) {
            const pos = parseInt(posStr);
            const pt = pts[pos];
            if (!pt) continue;
            const n = group.length;

            for (let gi = 0; gi < n; gi++) {
                const p = group[gi];
                const ci = (p.id - 1) % COLORS.length;
                const color = COLORS[ci];
                const offsetX = n > 1 ? (gi - (n - 1) / 2) * 34 : 0;
                const px = pt.x + offsetX;
                const bobY = Math.sin(this.frame * 0.12 + gi * 1.2) * 5;
                const py = pt.y - 38 + bobY;

                ctx.save();

                // Shadow
                ctx.shadowColor = 'rgba(0,0,0,0.6)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetY = 3;

                // Player circle
                ctx.beginPath();
                ctx.arc(px, py, 22, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Character emoji
                ctx.font = '20px serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(CHARS[p.character] || '🧒', px, py);

                // Name tag
                const tag = p.nickname.substring(0, 8);
                ctx.font = 'bold 10px Arial';
                const tw = ctx.measureText(tag).width + 10;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.roundRect(px - tw / 2, py - 38, tw, 16, 4);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.textBaseline = 'middle';
                ctx.fillText(tag, px, py - 30);

                ctx.restore();
            }
        }
    }

    _drawMapLegend() {
        const ctx = this.ctx;
        const w = this.world;
        const lx = this.canvas.width - 180;
        const ly = 16;

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.beginPath();
        ctx.roundRect(lx - 8, ly - 4, 188, 106, 10);
        ctx.fill();

        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const items = [
            ['🟡', 'Normal Square'],
            [w.chestEmoji, 'Bonus Chest'],
            [w.enemyEmoji, 'Monster Danger'],
            [w.bossEmoji, 'Boss Battle'],
            ['🏆', 'GOAL — Win Here!'],
        ];
        items.forEach(([ico, label], i) => {
            ctx.fillStyle = 'white';
            ctx.fillText(`${ico} ${label}`, lx, ly + 14 + i * 19);
        });
        ctx.restore();
    }

    getEncounterAt(position) {
        return this.encounters[Math.min(position, 20)] || 'normal';
    }
}
