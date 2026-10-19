/* ==========================================================================
   7. STARTING RUN, WAVES, CHESTS & 11-ARCHETYPE SPAWNING LOGIC
========================================================================== */
function startNewRun() {
    AudioEngine.init();
    AudioEngine.sfxClick();
    AudioEngine.startBGM();

    Game.player = createPlayer();
    Game.enemies = [];
    Game.chests = [];
    Game.spawnMarkers = [];
    Game.bullets = [];
    Game.enemyBullets = [];
    Game.xpGems = [];
    Game.heartDrops = [];
    Game.particles = [];
    Game.floatingTexts = [];
    Game.dashTrails = [];
    Game.wave = 1;
    Game.freeplay = false;
    Game.killsThisRun = 0;
    Game.maxComboThisRun = 0;
    Game.totalDamageDealt = 0;
    Game.heartsCollected = 0;
    Game.milestonesReached = {};
    Game.waveEvent = null;
    Game.rerollsLeft = (Game.difficulty === 'infernal') ? 3 : 2;
    Game.chestSpawnTimer = getNextChestSpawnDelay();

    initFloorDetails();
    refreshWeaponCanvasIcons();
    startWave(1);

    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('modalGameOver').classList.add('hidden');
    document.getElementById('modalVictory').classList.add('hidden');
    document.getElementById('gameHud').classList.remove('hidden');

    const diffCfg = DIFFICULTIES[Game.difficulty];
    const badge = document.getElementById('hudDifficultyBadge');
    badge.textContent = diffCfg.name;
    badge.className = `text-[10px] px-1.5 py-0.5 text-white ${diffCfg.badgeColor}`;

    Game.state = 'PLAYING';
    updateHud();
}

const WAVE_EVENTS = [
    {
        id: 'blood_moon',
        name: '🌙 BLOOD MOON EVENT',
        sub: 'FAST SPAWNS (+35%) & BONUS XP (+40%)!',
        color: '#ef4444',
        spawnMult: 1.35,
        xpMult: 1.40
    },
    {
        id: 'soul_drought',
        name: '⚡ SOUL DROUGHT EVENT',
        sub: 'NO CHESTS THIS WAVE, BUT +50% XP FROM GHOSTS!',
        color: '#f59e0b',
        noChests: true,
        xpMult: 1.50
    },
    {
        id: 'phantom_rush',
        name: '💨 PHANTOM RUSH EVENT',
        sub: 'GHOSTS +25% SPEED, SURVIVOR +15% MOVE SPEED!',
        color: '#22d3ee',
        enemySpeedMult: 1.25,
        playerSpeedMult: 1.15
    },
    {
        id: 'golden_age',
        name: '💰 GOLDEN AGE EVENT',
        sub: 'DOUBLE CHEST SPAWN RATE & 2x CHEST XP GEMS!',
        color: '#fde047',
        chestRateMult: 0.5,
        chestXpMult: 2.0
    }
];

function startWave(waveNum) {
    Game.wave = waveNum;
    Game.waveDuration = Math.min(45, 24 + Math.floor(waveNum * 0.8));
    Game.waveTimer = Game.waveDuration;
    Game.spawnAccumulator = 0;

    Game.enemyBullets = [];
    Game.spawnMarkers = [];

    // Wave Events (waves 4+, non-boss waves, ~40% chance)
    const isBossWave = waveNum % 5 === 0 || waveNum >= 25;
    if (waveNum >= 4 && !isBossWave && !Game.freeplay && Math.random() < 0.40) {
        Game.waveEvent = WAVE_EVENTS[Math.floor(Math.random() * WAVE_EVENTS.length)];
    } else {
        Game.waveEvent = null;
    }

    const diff = DIFFICULTIES[Game.difficulty];
    if (waveNum > 1 && Game.player) {
        const heal = Math.ceil((Game.player.maxHp - Game.player.hp) * 0.08 * diff.regenUpgMult);
        if (heal > 0) {
            Game.player.hp = Math.min(Game.player.maxHp, Game.player.hp + heal);
            spawnFloatingText(Game.player.x, Game.player.y - 24, `+${heal} HP`, '#4ade80');
        }
        if (waveNum % 5 === 0) {
            Game.rerollsLeft += 1;
            spawnFloatingText(Game.player.x, Game.player.y - 40, '+1 REROLL [R]!', '#22d3ee');
        }
    }

    const banner = document.getElementById('waveBanner');
    const title = document.getElementById('waveBannerTitle');
    const sub = document.getElementById('waveBannerSub');

    title.textContent = Game.freeplay
        ? `FREEPLAY - WAVE ${waveNum}`
        : `WAVE ${waveNum} / ${Game.maxTargetWave}`;

    if (Game.waveEvent) {
        title.textContent = `${title.textContent} • ${Game.waveEvent.name}`;
        sub.textContent = Game.waveEvent.sub;
        sub.style.color = Game.waveEvent.color;
    } else {
        sub.style.color = '';
        if (waveNum === 25) {
            sub.textContent = '💀 FINAL WAVE: INFERNAL OVERLORDS & REAPERS! 💀';
            queueEnemySpawn('overlord');
            queueEnemySpawn('overlord');
            queueEnemySpawn('reaper');
            queueEnemySpawn('tank');
        } else if (waveNum % 5 === 0) {
            if (waveNum >= 20) {
                sub.textContent = '⚠ INFERNAL OVERLORD & SOUL REAPER BOSSES! ⚠';
                queueEnemySpawn('overlord');
                queueEnemySpawn('reaper');
                queueEnemySpawn('tank');
            } else if (waveNum >= 15) {
                sub.textContent = '⚠ SOUL REAPER & DREAD WRAITH BOSSES! ⚠';
                queueEnemySpawn('reaper');
                queueEnemySpawn('tank');
                queueEnemySpawn('necromancer');
            } else {
                sub.textContent = '⚠ DREAD WRAITH BOSS APPROACHING! ⚠';
                queueEnemySpawn('tank');
                if (waveNum >= 10) queueEnemySpawn('necromancer');
            }
        } else if (waveNum >= 18) {
            sub.textContent = '🔥 END-GAME NIGHTMARE HORDE! 🔥';
            if (waveNum % 2 === 0) queueEnemySpawn('reaper');
            if (waveNum >= 22) queueEnemySpawn('overlord');
        } else {
            sub.textContent = 'PURGE THE NIGHTMARE SPIRITS!';
        }
    }

    banner.classList.remove('opacity-0');
    setTimeout(() => {
        banner.classList.add('opacity-0');
    }, 2200);

    const initialCount = 4 + Math.min(14, Math.floor(waveNum * 0.85));
    for (let i = 0; i < initialCount; i++) {
        queueEnemySpawn();
    }
}

function spawnSoulChest() {
    if (Game.waveEvent && Game.waveEvent.noChests) return;
    const diff = DIFFICULTIES[Game.difficulty] || DIFFICULTIES.medium;
    if (Game.chests.length >= diff.maxChests) return;

    const margin = 110;
    const x = margin + Math.random() * (ARENA_SIZE - margin * 2);
    const y = margin + Math.random() * (ARENA_SIZE - margin * 2);
    const chestHp = Math.round((25 + Game.wave * 8) * diff.hpMult);

    Game.chests.push({
        x,
        y,
        hp: chestHp,
        maxHp: chestHp,
        radius: 16,
        bobPhase: Math.random() * Math.PI * 2
    });
    if (Game.player) {
        spawnFloatingText(x, y - 20, '★ SOUL CHEST SPAWNED! ★', '#fde047');
    }
}

function openSoulChest(index) {
    const c = Game.chests[index];
    if (!c) return;
    Game.chests.splice(index, 1);

    AudioEngine.sfxChestOpen();
    spawnParticles(c.x, c.y, '#fde047', 16);
    addScreenShake(0.10, 2.5);

    const p = Game.player;
    const diff = DIFFICULTIES[Game.difficulty] || DIFFICULTIES.medium;

    for (let i = 0; i < 3; i++) {
        let gemVal = 22 + Game.wave * 4;
        if (Game.waveEvent && Game.waveEvent.chestXpMult) {
            gemVal = Math.round(gemVal * Game.waveEvent.chestXpMult);
        }
        if (Game.difficulty === 'infernal') {
            gemVal = Math.round(gemVal * 1.20);
        }
        Game.xpGems.push({
            x: c.x + (Math.random() - 0.5) * 32,
            y: c.y + (Math.random() - 0.5) * 32,
            val: gemVal
        });
    }

    const roll = Math.random();
    if (roll < 0.45) {
        p.overdriveTimer = Math.max(4.5, 6.5 * diff.upgMult);
        spawnFloatingText(c.x, c.y - 24, `⚡ ${p.overdriveTimer.toFixed(1)}s OVERDRIVE (+35% SPD & FIRE)!`, '#fde047');
    } else if (roll < 0.78) {
        Game.rerollsLeft += 1;
        const heal = Math.round(14 * diff.regenUpgMult);
        p.hp = Math.min(p.maxHp, p.hp + heal);
        spawnFloatingText(c.x, c.y - 24, `🎲 +1 REROLL & +${heal} HP!`, '#22d3ee');
    } else {
        const heal = Math.round(22 * diff.regenUpgMult);
        p.hp = Math.min(p.maxHp, p.hp + heal);
        spawnFloatingText(c.x, c.y - 24, `♥ SOUL BLESSING (+${heal} HP)!`, '#4ade80');
    }
}

function pickGhostArchetype() {
    const w = Game.wave;
    const pool = [
        { type: 'melee', weight: w >= 15 ? 20 : 32 },
        { type: 'swarm', weight: w >= 1 ? 18 : 0 },
        { type: 'fast', weight: w >= 2 ? 20 : 8 },
        { type: 'ranged', weight: w >= 2 ? 18 : 0 },
        { type: 'dasher', weight: w >= 3 ? (w >= 14 ? 22 : 15) : 0 },
        { type: 'bomber', weight: w >= 4 ? (w >= 14 ? 18 : 14) : 0 },
        { type: 'sniper', weight: w >= 5 ? (w >= 14 ? 18 : 12) : 0 },
        { type: 'assassin', weight: w >= 7 ? (w >= 14 ? 14 : 9) : 0 },
        { type: 'necromancer', weight: w >= 6 ? (w >= 15 ? 14 : 9) : 0 },
        { type: 'tank', weight: w >= 6 ? (w >= 15 ? 11 : 6) : 0 },
        { type: 'reaper', weight: w >= 12 ? (w >= 18 ? 9 : 5) : 0 },
        { type: 'overlord', weight: w >= 17 ? (w >= 22 ? 6 : 3) : 0 }
    ];

    const total = pool.reduce((acc, item) => acc + item.weight, 0);
    let r = Math.random() * total;
    for (const item of pool) {
        r -= item.weight;
        if (r <= 0) return item.type;
    }
    return 'melee';
}

function queueEnemySpawn(forcedType = null, customX = null, customY = null) {
    const margin = 70;
    let x = customX;
    let y = customY;

    if (x === null || y === null) {
        let attempts = 0;
        do {
            x = margin + Math.random() * (ARENA_SIZE - margin * 2);
            y = margin + Math.random() * (ARENA_SIZE - margin * 2);
            attempts++;
        } while (
            Game.player &&
            Math.hypot(x - Game.player.x, y - Game.player.y) < 195 &&
            attempts < 10
        );
    }

    const type = forcedType || pickGhostArchetype();

    if (type === 'swarm' && customX === null) {
        for (let s = 0; s < 3; s++) {
            const sx = Math.max(40, Math.min(ARENA_SIZE - 40, x + (Math.random() - 0.5) * 70));
            const sy = Math.max(40, Math.min(ARENA_SIZE - 40, y + (Math.random() - 0.5) * 70));
            Game.spawnMarkers.push({ x: sx, y: sy, timer: 0.85, type: 'swarm' });
        }
        return;
    }

    Game.spawnMarkers.push({
        x,
        y,
        timer: 0.90,
        type
    });
}

function spawnGhostFromMarker(marker) {
    const diff = DIFFICULTIES[Game.difficulty];
    const lateWaveBoost = Game.wave >= 12 ? 1 + (Game.wave - 11) * 0.08 : 1.0;
    const freeplayMult = Game.freeplay
        ? (Game.wave > 25 ? Math.pow(1.12, Game.wave - 25) : 1.48)
        : 1.0;
    const wScale = (1 + (Game.wave - 1) * 0.17) * lateWaveBoost * freeplayMult;

    let baseHp = 21;
    let speed = 84;
    let dmg = 9;
    let radius = 15;
    let xpVal = 6;
    let sprite = 'ghostMelee';
    let spriteScale = 3;

    if (marker.type === 'fast') {
        baseHp = 15;
        speed = 128;
        dmg = 8;
        radius = 13;
        xpVal = 7;
        sprite = 'ghostFast';
        spriteScale = 3;
    } else if (marker.type === 'swarm') {
        baseHp = 9;
        speed = 142;
        dmg = 6;
        radius = 10;
        xpVal = 4;
        sprite = 'ghostSwarm';
        spriteScale = 3;
    } else if (marker.type === 'ranged') {
        baseHp = 19;
        speed = 68;
        dmg = 10;
        radius = 15;
        xpVal = 9;
        sprite = 'ghostRanged';
        spriteScale = 3;
    } else if (marker.type === 'dasher') {
        baseHp = 28;
        speed = 78;
        dmg = 13;
        radius = 15;
        xpVal = 12;
        sprite = 'ghostDasher';
        spriteScale = 3;
    } else if (marker.type === 'bomber') {
        baseHp = 20;
        speed = 114;
        dmg = 14;
        radius = 14;
        xpVal = 11;
        sprite = 'ghostBomber';
        spriteScale = 3;
    } else if (marker.type === 'sniper') {
        baseHp = 18;
        speed = 62;
        dmg = 13;
        radius = 14;
        xpVal = 12;
        sprite = 'ghostSniper';
        spriteScale = 3;
    } else if (marker.type === 'assassin') {
        baseHp = 32;
        speed = 100;
        dmg = 16;
        radius = 14;
        xpVal = 16;
        sprite = 'ghostAssassin';
        spriteScale = 3;
    } else if (marker.type === 'necromancer') {
        baseHp = 44;
        speed = 56;
        dmg = 12;
        radius = 16;
        xpVal = 20;
        sprite = 'ghostNecro';
        spriteScale = 3;
    } else if (marker.type === 'tank') {
        baseHp = 100;
        speed = 60;
        dmg = 17;
        radius = 24;
        xpVal = 38;
        sprite = 'ghostTank';
        spriteScale = 4;
    } else if (marker.type === 'reaper') {
        baseHp = 145;
        speed = 86;
        dmg = 20;
        radius = 22;
        xpVal = 62;
        sprite = 'ghostReaper';
        spriteScale = 4;
    } else if (marker.type === 'overlord') {
        baseHp = 230;
        speed = 52;
        dmg = 24;
        radius = 26;
        xpVal = 98;
        sprite = 'ghostOverlord';
        spriteScale = 4;
    }

    // Elite Enemy Check (wave 3+, ~8% chance, non-bosses, non-swarms)
    const isMajorBoss = marker.type === 'tank' || marker.type === 'reaper' || marker.type === 'overlord';
    const canBeElite = !isMajorBoss && marker.type !== 'swarm' && Game.wave >= 3;
    const isElite = canBeElite && Math.random() < 0.08;

    if (isElite) {
        baseHp = Math.round(baseHp * 2.4);
        dmg = Math.round(dmg * 1.35);
        speed = speed * 1.12;
        spriteScale = spriteScale + 1;
        radius = Math.round(radius * 1.25);
    }

    if (Game.waveEvent && Game.waveEvent.enemySpeedMult) {
        speed *= Game.waveEvent.enemySpeedMult;
    }

    const maxHp = Math.max(8, Math.round(baseHp * wScale * diff.hpMult));
    const lateDmgBoost = Game.wave >= 12 ? 1 + (Game.wave - 11) * 0.05 : 1.0;

    const waveXpScale = 1 + (Game.wave - 1) * 0.14 + (Game.wave >= 11 ? (Game.wave - 10) * 0.24 : 0);
    let scaledXp = Math.round(xpVal * waveXpScale * (isElite ? 3.0 : 1.0));
    if (Game.waveEvent && Game.waveEvent.xpMult) {
        scaledXp = Math.round(scaledXp * Game.waveEvent.xpMult);
    }

    Game.enemies.push({
        x: marker.x,
        y: marker.y,
        type: marker.type,
        isElite: !!isElite,
        hp: maxHp,
        maxHp: maxHp,
        speed: speed * (0.94 + Math.random() * 0.12) * (Game.wave >= 15 ? 1.08 : 1.0),
        dmg: Math.max(2, Math.round(dmg * (1 + (Game.wave - 1) * 0.08) * lateDmgBoost * diff.dmgMult)),
        radius,
        xpVal: scaledXp,
        sprite,
        spriteScale,
        shootCd: 1.3 + Math.random() * 1.2,
        specialCd: 2.2 + Math.random() * 1.2,
        spiralAngle: 0,
        dashBurstTimer: 0,
        dashVx: 0,
        dashVy: 0,
        hitFlash: 0,
        armorBreakTimer: 0,
        stealth: marker.type === 'assassin',
        stealthAlpha: marker.type === 'assassin' ? 0.20 : 1.0,
        teleportCd: 4.5 + Math.random() * 2.0,
        bobPhase: Math.random() * Math.PI * 2
    });
}

window.startNewRun = startNewRun;
window.startWave = startWave;
window.spawnSoulChest = spawnSoulChest;
window.openSoulChest = openSoulChest;
window.pickGhostArchetype = pickGhostArchetype;
window.queueEnemySpawn = queueEnemySpawn;
window.spawnGhostFromMarker = spawnGhostFromMarker;
