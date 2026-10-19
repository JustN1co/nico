/* ==========================================================================
   1. STORAGE, KEYBINDS (SPACE FOR DODGE) & PERSISTENT STATS
========================================================================== */
const STORAGE_KEY = 'infernal_sandbox_nico03_v6';

const DEFAULT_KEYBINDS = {
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    mainPower: 'KeyQ',
    secPower: 'KeyE',
    dash: 'Space' // Default hotkey is SPACEBAR
};

const KEYBIND_LABELS = {
    up: 'MOVE UP',
    down: 'MOVE DOWN',
    left: 'MOVE LEFT',
    right: 'MOVE RIGHT',
    mainPower: 'MAIN POWER (3x GIANT)',
    secPower: 'SECONDARY POWER (5x ORBS)',
    dash: 'DODGE'
};

let keybinds = { ...DEFAULT_KEYBINDS };

let savedStats = {
    bestWave: 0,
    totalKills: 0,
    crtEnabled: true,
    sfxVolume: 0.7,
    bgmVolume: 0.6,
    muted: false,
    selectedSkin: 'hellknight'
};

function formatKeyCode(code) {
    if (!code) return '?';
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    if (code === 'Space') return 'SPC';
    if (code.startsWith('Arrow')) return code.replace('Arrow', 'ARR ');
    if (code === 'ShiftLeft' || code === 'ShiftRight') return 'SHIFT';
    return code.toUpperCase();
}

function loadStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.keybinds) keybinds = { ...DEFAULT_KEYBINDS, ...parsed.keybinds };
            if (parsed.stats) {
                savedStats = { ...savedStats, ...parsed.stats };
            }
        }
    } catch (e) {
        console.warn('Storage load skipped:', e);
    }
    if (typeof AudioEngine !== 'undefined') {
        AudioEngine.sfxVolume = savedStats.sfxVolume;
        AudioEngine.bgmVolume = savedStats.bgmVolume;
        AudioEngine.muted = savedStats.muted;
    }
}

function saveStorage() {
    try {
        if (typeof AudioEngine !== 'undefined') {
            savedStats.sfxVolume = AudioEngine.sfxVolume;
            savedStats.bgmVolume = AudioEngine.bgmVolume;
            savedStats.muted = AudioEngine.muted;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            keybinds,
            stats: savedStats
        }));
    } catch (e) {
        console.warn('Storage save skipped:', e);
    }
}

/* ==========================================================================
   4. DIFFICULTY CONFIGURATIONS (WITH UPGRADE, REGEN & CHEST SCALING)
========================================================================== */
const DIFFICULTIES = {
    easy: {
        name: 'EASY',
        hpMult: 0.75,
        dmgMult: 0.70,
        spawnMult: 0.82,
        xpMult: 1.15,
        upgMult: 1.08,
        regenUpgMult: 1.10,
        chestMinSec: 12,
        chestMaxSec: 16,
        maxChests: 2,
        badgeColor: 'bg-emerald-700',
        desc: '0.75x Ghost Threat & frequent Golden Chests. Upgrades are 108% stronger (110% Regen).'
    },
    medium: {
        name: 'MEDIUM',
        hpMult: 1.00,
        dmgMult: 0.95,
        spawnMult: 1.02,
        xpMult: 1.00,
        upgMult: 1.00,
        regenUpgMult: 1.00,
        chestMinSec: 18,
        chestMaxSec: 24,
        maxChests: 2,
        badgeColor: 'bg-amber-600',
        desc: 'True 1.0x arena challenge. Standard upgrade potency (100% stats & regen).'
    },
    hard: {
        name: 'HARD',
        hpMult: 1.35,
        dmgMult: 1.25,
        spawnMult: 1.22,
        xpMult: 0.95,
        upgMult: 0.90,
        regenUpgMult: 0.75,
        chestMinSec: 26,
        chestMaxSec: 34,
        maxChests: 1,
        badgeColor: 'bg-red-700',
        desc: '1.35x Threat & rarer Chests. Upgrades grant 90% power & HP Regen is 75% effective!'
    },
    infernal: {
        name: 'INFERNAL',
        hpMult: 1.80,
        dmgMult: 1.60,
        spawnMult: 1.45,
        xpMult: 1.18,
        upgMult: 0.88,
        regenUpgMult: 0.65,
        chestMinSec: 36,
        chestMaxSec: 46,
        maxChests: 1,
        badgeColor: 'bg-purple-700',
        desc: '1.80x Nightmare Threat & scarce Chests, but +1 Reroll on start, +18% XP & boosted Soul Chest gems! Upgrades grant 88% power & Regen is 65%!'
    }
};

function getNextChestSpawnDelay() {
    const diff = (typeof Game !== 'undefined' && DIFFICULTIES[Game.difficulty]) ? DIFFICULTIES[Game.difficulty] : DIFFICULTIES.medium;
    return diff.chestMinSec + Math.random() * (diff.chestMaxSec - diff.chestMinSec);
}

const WEAPONS = {
    blaster: {
        id: 'blaster',
        name: 'HELLFIRE BLASTER',
        sprite: 'weaponGun',
        tag: 'AUTO-AIM: BALANCED',
        color: '#38bdf8',
        dmgFactor: 1.0,
        rateFactor: 1.0,
        bonusShots: 0,
        spread: 0.12,
        bulletSpeed: 530,
        bulletSize: 5,
        bonusPierce: 0,
        explosiveRadius: 0,
        knockback: 10,
        adaptiveTierBonus: 0.28,
        desc: 'Adaptive soul-blaster with balanced fire rate and pinpoint accuracy. Gains +28% DMG per tier up!'
    },
    shotgun: {
        id: 'shotgun',
        name: 'INFERNAL SHOTGUN',
        sprite: 'weaponShotgun',
        tag: 'SPREAD: BUCKSHOT',
        color: '#f97316',
        dmgFactor: 0.82,
        rateFactor: 0.72,
        bonusShots: 3,
        spread: 0.14,
        bulletSpeed: 460,
        bulletSize: 5,
        bonusPierce: 0,
        explosiveRadius: 0,
        knockback: 22,
        desc: 'Fires +3 extra buckshot pellets (4 total) in a wide cone that knock ghosts back!'
    },
    smg: {
        id: 'smg',
        name: 'PHANTOM SMG',
        sprite: 'weaponSmg',
        tag: 'RAPID-FIRE: 2.1x SPD',
        color: '#22d3ee',
        dmgFactor: 0.68,
        rateFactor: 2.1,
        bonusShots: 0,
        spread: 0.18,
        bulletSpeed: 540,
        bulletSize: 4,
        bonusPierce: 0,
        explosiveRadius: 0,
        knockback: 6,
        desc: 'Ultra-fast spectral submachine gun with +110% Attack Speed!'
    },
    railgun: {
        id: 'railgun',
        name: 'SOUL RAILGUN',
        sprite: 'weaponRailgun',
        tag: 'PIERCING LASER',
        color: '#c084fc',
        dmgFactor: 1.75,
        rateFactor: 0.68,
        bonusShots: 0,
        spread: 0.08,
        bulletSpeed: 750,
        bulletSize: 7,
        bonusPierce: 4,
        explosiveRadius: 0,
        knockback: 28,
        armorBreak: 2.0,
        desc: 'High-velocity hyper beam dealing 1.75x DMG, piercing +4 Ghosts, and shattering enemy armor (+15% DMG taken)!'
    },
    launcher: {
        id: 'launcher',
        name: 'BRIMSTONE LAUNCHER',
        sprite: 'weaponLauncher',
        tag: 'AOE EXPLOSIVE BLAST',
        color: '#ef4444',
        dmgFactor: 1.65,
        rateFactor: 0.65,
        bonusShots: 0,
        spread: 0.14,
        bulletSpeed: 390,
        bulletSize: 9,
        bonusPierce: 0,
        explosiveRadius: 78,
        knockback: 32,
        desc: 'Launches heavy Brimstone shells that detonate in a fiery AoE explosion!'
    },
    scythe: {
        id: 'scythe',
        name: "REAPER'S SCYTHE",
        sprite: 'weaponScythe',
        tag: 'CLEAVING BLADES',
        color: '#4ade80',
        dmgFactor: 1.30,
        rateFactor: 1.05,
        bonusShots: 0,
        spread: 0.22,
        bulletSpeed: 420,
        bulletSize: 8,
        bonusPierce: 2,
        explosiveRadius: 0,
        knockback: 18,
        isSpinning: true,
        desc: 'Hurls a spinning spectral scythe that cleaves through +2 Ghosts!'
    },
    minigun: {
        id: 'minigun',
        name: 'ARCHON MINIGUN',
        sprite: 'weaponMinigun',
        tag: 'ROTARY SUPPRESSION',
        color: '#fde047',
        dmgFactor: 0.72,
        rateFactor: 1.75,
        bonusShots: 0,
        spread: 0.20,
        bulletSpeed: 560,
        bulletSize: 5,
        bonusPierce: 0,
        explosiveRadius: 0,
        knockback: 10,
        desc: 'Rotary plasma cannon with +75% Attack Speed and rapid suppression fire!'
    }
};

/* ==========================================================================
   5. UPGRADE POOL (NERFED MAGNET, HP REGEN & LIFESTEAL)
========================================================================== */
const UPGRADE_POOL = [
    {
        id: 'dmg_mult',
        name: 'HELLFIRE POWDER',
        sprite: 'upgPowder',
        type: 'PASSIVE',
        weight: 1.15,
        color: '#ef4444',
        getDesc(d) {
            const pct = Math.round(18 * d.upgMult);
            return `+${pct}% Damage to all Auto-Attacks and Abilities.`;
        },
        apply(p, d) {
            p.dmg *= (1 + 0.18 * d.upgMult);
        }
    },
    {
        id: 'main_overcharge',
        name: 'OMEGA CALIBRE [Q]',
        sprite: 'upgCalibre',
        type: 'ACTIVE UPGRADE',
        weight: 1.0,
        color: '#f97316',
        getDesc(d) {
            const bonusMult = (1.25 * d.upgMult).toFixed(2);
            return `Main Power [Q] deals +x${bonusMult} extra DMG & fires +1 Giant Bullet!`;
        },
        apply(p, d) {
            p.mainPowerMult += 1.25 * d.upgMult;
            p.mainPowerCount += 1;
        }
    },
    {
        id: 'sec_expansion',
        name: 'SOUL NOVABURST [E]',
        sprite: 'upgNova',
        type: 'ACTIVE UPGRADE',
        weight: 1.0,
        color: '#22d3ee',
        getDesc(d) {
            const pct = Math.round(35 * d.upgMult);
            return `Secondary Power [E] unleashes +2 extra Orbs and +${pct}% Orb Damage.`;
        },
        apply(p, d) {
            p.secPowerCount += 2;
            p.secPowerMult *= (1 + 0.35 * d.upgMult);
        }
    },
    {
        id: 'cooldown_haste',
        name: 'CHRONO SIGIL',
        sprite: 'upgChrono',
        type: 'ACTIVE & PASSIVE',
        weight: 1.0,
        color: '#c084fc',
        getDesc(d) {
            const cdrPct = Math.round(16 * d.upgMult);
            return `-${cdrPct}% Cooldown on Main Power [Q], Secondary [E], and Dodge!`;
        },
        apply(p, d) {
            p.cdr *= (1 - 0.16 * d.upgMult);
        }
    },
    {
        id: 'fire_rate',
        name: 'HAIR TRIGGER',
        sprite: 'upgTrigger',
        type: 'PASSIVE',
        weight: 0.9,
        color: '#fde047',
        getDesc(d) {
            const spdPct = Math.round(20 * d.upgMult);
            return `+${spdPct}% Auto-Weapon Attack Speed.`;
        },
        apply(p, d) {
            p.fireRate *= (1 + 0.20 * d.upgMult);
        }
    },
    {
        id: 'multishot',
        name: 'TWIN CHAMBER',
        sprite: 'upgMultishot',
        type: 'WEAPON UPGRADE',
        weight: 0.42,
        color: '#38bdf8',
        getDesc() {
            return '+1 Projectile per Auto-Attack shot.';
        },
        apply(p) {
            p.projectiles += 1;
        }
    },
    {
        id: 'phantom_boots',
        name: 'PHANTOM GREAVES',
        sprite: 'upgBoots',
        type: 'MOBILITY',
        weight: 1.1,
        color: '#4ade80',
        getDesc(d) {
            const mvPct = Math.round(14 * d.upgMult);
            const cdCut = (0.7 * d.upgMult).toFixed(1);
            return `+${mvPct}% Move Speed & reduces Dodge base cooldown by ${cdCut}s.`;
        },
        apply(p, d) {
            p.speed *= (1 + 0.14 * d.upgMult);
            p.dashBaseCd = Math.max(2.2, p.dashBaseCd - 0.7 * d.upgMult);
        }
    },
    {
        id: 'vitality_heart',
        name: 'DEMON HEART',
        sprite: 'upgHeart',
        type: 'SURVIVAL',
        weight: 1.0,
        color: '#f43f5e',
        getDesc(d) {
            const hpGain = Math.round(22 * d.upgMult);
            const healNow = Math.round(20 * d.regenUpgMult);
            return `+${hpGain} Max HP and immediately restores ${healNow} HP.`;
        },
        apply(p, d) {
            const hpGain = Math.round(22 * d.upgMult);
            const healNow = Math.round(20 * d.regenUpgMult);
            p.maxHp += hpGain;
            p.hp = Math.min(p.maxHp, p.hp + healNow);
        }
    },
    {
        id: 'vampiric_fangs',
        name: 'VAMPIRIC SOUL',
        sprite: 'upgFangs',
        type: 'SURVIVAL',
        weight: 0.8,
        color: '#ec4899',
        getDesc(d) {
            const lMult = (typeof Game !== 'undefined' && Game.player) ? (Game.player.lifestealMult || 1) : 1;
            const leech = (0.14 * d.regenUpgMult * lMult).toFixed(2);
            const crit = Math.round(10 * d.upgMult);
            return `+${leech} HP Leech per Ghost slain & +${crit}% Crit Chance (2x DMG).`;
        },
        apply(p, d) {
            p.lifeStealOnKill += 0.14 * d.regenUpgMult * (p.lifestealMult || 1);
            p.critChance = Math.min(0.85, p.critChance + 0.10 * d.upgMult);
        }
    },
    {
        id: 'piercing_rounds',
        name: 'SPECTRAL PIERCE',
        sprite: 'upgPierce',
        type: 'WEAPON UPGRADE',
        weight: 0.45,
        color: '#a855f7',
        getDesc(d) {
            const dmgPct = Math.round(12 * d.upgMult);
            return `Auto-Bullets pierce +1 additional Ghost and deal +${dmgPct}% DMG.`;
        },
        apply(p, d) {
            p.pierce += 1;
            p.dmg *= (1 + 0.12 * d.upgMult);
        }
    },
    {
        id: 'soul_magnet',
        name: 'ASTRAL MAGNET',
        sprite: 'upgMagnet',
        type: 'UTILITY',
        weight: 0.75,
        color: '#2dd4bf',
        getDesc(d) {
            const radPct = Math.round(25 * d.upgMult);
            const xpPct = Math.round(10 * d.upgMult);
            return `+${radPct}% XP Pickup Radius (max 340px) & +${xpPct}% XP gained.`;
        },
        apply(p, d) {
            p.pickupRadius = Math.min(340, p.pickupRadius * (1 + 0.25 * d.upgMult));
            p.xpGainMult *= (1 + 0.10 * d.upgMult);
        }
    },
    {
        id: 'infernal_regen',
        name: 'BLOOD CHALICE',
        sprite: 'upgChalice',
        type: 'SURVIVAL',
        weight: 0.8,
        color: '#fb7185',
        getDesc(d) {
            const rMult = (typeof Game !== 'undefined' && Game.player) ? (Game.player.regenMult || 1) : 1;
            const regenVal = (0.65 * d.regenUpgMult * rMult).toFixed(2);
            const maxHpVal = Math.round(10 * d.upgMult);
            return `+${regenVal} HP/s passive Regeneration & +${maxHpVal} Max HP.`;
        },
        apply(p, d) {
            const regenVal = 0.65 * d.regenUpgMult * (p.regenMult || 1);
            const maxHpVal = Math.round(10 * d.upgMult);
            p.hpRegen += regenVal;
            p.maxHp += maxHpVal;
            p.hp = Math.min(p.maxHp, p.hp + maxHpVal);
        }
    },
    {
        id: 'devils_bargain',
        name: "DEVIL'S BARGAIN",
        sprite: 'upgCursedSkull',
        type: 'CURSED POWER',
        weight: 0.35,
        color: '#c084fc',
        isCursed: true,
        getDesc(d) {
            const pct = Math.round(40 * d.upgMult);
            return `☠ CURSED: +${pct}% Attack & Ability DMG, but lose 25 Max HP!`;
        },
        apply(p, d) {
            p.dmg *= (1 + 0.40 * d.upgMult);
            p.maxHp = Math.max(30, p.maxHp - 25);
            p.hp = Math.min(p.hp, p.maxHp);
        }
    },
    {
        id: 'blood_pact',
        name: 'BLOOD PACT',
        sprite: 'upgBloodPact',
        type: 'CURSED POWER',
        weight: 0.35,
        color: '#c084fc',
        isCursed: true,
        getDesc(d) {
            const regenPts = (2.2 * d.regenUpgMult).toFixed(2);
            return `☠ CURSED: +${regenPts} HP/s passive Regen, but deal -20% Damage!`;
        },
        apply(p, d) {
            p.hpRegen += 2.2 * d.regenUpgMult;
            p.dmg *= 0.80;
        }
    },
    {
        id: 'soul_fracture',
        name: 'SOUL FRACTURE',
        sprite: 'upgSoulFracture',
        type: 'CURSED POWER',
        weight: 0.30,
        color: '#c084fc',
        isCursed: true,
        getDesc() {
            return `☠ CURSED: +2 Projectiles to Auto-Attack, but -25% Bullet Speed!`;
        },
        apply(p) {
            p.projectiles += 2;
            p.bulletSpeedMult = (p.bulletSpeedMult || 1.0) * 0.75;
        }
    },
    {
        id: 'temporal_rift',
        name: 'TEMPORAL RIFT',
        sprite: 'upgTemporalRift',
        type: 'CURSED POWER',
        weight: 0.35,
        color: '#c084fc',
        isCursed: true,
        getDesc(d) {
            const cdrPct = Math.round(35 * d.upgMult);
            return `☠ CURSED: -${cdrPct}% Cooldowns on [Q], [E] & Dodge, but -15% Move Speed!`;
        },
        apply(p, d) {
            p.cdr *= (1 - 0.35 * d.upgMult);
            p.speed *= 0.85;
        }
    }
];

function pickWeightedUpgrades(count) {
    const pool = [...UPGRADE_POOL];
    const chosen = [];
    while (chosen.length < count && pool.length > 0) {
        const totalWeight = pool.reduce((sum, item) => sum + (item.weight || 1), 0);
        let r = Math.random() * totalWeight;
        let idx = 0;
        for (let i = 0; i < pool.length; i++) {
            r -= (pool[i].weight || 1);
            if (r <= 0) {
                idx = i;
                break;
            }
        }
        chosen.push({ ...pool[idx], isWeaponCard: false });
        pool.splice(idx, 1);
    }
    return chosen;
}

window.STORAGE_KEY = STORAGE_KEY;
window.DEFAULT_KEYBINDS = DEFAULT_KEYBINDS;
window.KEYBIND_LABELS = KEYBIND_LABELS;
window.keybinds = keybinds;
window.savedStats = savedStats;
window.formatKeyCode = formatKeyCode;
window.loadStorage = loadStorage;
window.saveStorage = saveStorage;
window.DIFFICULTIES = DIFFICULTIES;
window.getNextChestSpawnDelay = getNextChestSpawnDelay;
window.WEAPONS = WEAPONS;
window.UPGRADE_POOL = UPGRADE_POOL;
window.pickWeightedUpgrades = pickWeightedUpgrades;
