/* ==========================================================================
   6. CORE GAME STATE & ARENA SETUP
========================================================================== */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimapCanvas');
const mctx = minimapCanvas.getContext('2d');

const TILE_SIZE = 48;
const ARENA_SIZE = 1152; // 24 * 48 = 1152

const Game = {
    state: 'MENU', // MENU, PLAYING, PAUSED, LEVEL_UP, VICTORY, GAME_OVER
    difficulty: 'medium',
    wave: 1,
    maxTargetWave: 25,
    freeplay: false,
    waveTimer: 25,
    waveDuration: 25,
    spawnAccumulator: 0,
    chestSpawnTimer: 16,
    shakeTime: 0,
    shakeMagnitude: 0,
    killsThisRun: 0,
    maxComboThisRun: 0,
    totalDamageDealt: 0,
    heartsCollected: 0,
    milestonesReached: {},
    waveEvent: null,
    keysPressed: {},
    navKeyHeld: {},
    rebindTarget: null,

    currentUpgradeChoices: [],
    selectedUpgradeIndex: 0,
    levelUpInputLockTimer: 0,
    rerollsLeft: 2,

    player: null,
    enemies: [],
    chests: [],
    spawnMarkers: [],
    bullets: [],
    enemyBullets: [],
    xpGems: [],
    heartDrops: [],
    particles: [],
    floatingTexts: [],
    dashTrails: [],
    floorDetails: [],
    menuGhosts: []
};

function initFloorDetails() {
    Game.floorDetails = [];
    for (let i = 0; i < 85; i++) {
        Game.floorDetails.push({
            x: 40 + Math.random() * (ARENA_SIZE - 80),
            y: 40 + Math.random() * (ARENA_SIZE - 80),
            type: Math.floor(Math.random() * 3),
            size: 4 + Math.floor(Math.random() * 3) * 2
        });
    }
}

function initMenuGhosts() {
    const menuSprites = [
        'ghostMelee', 'ghostFast', 'ghostRanged', 'ghostDasher',
        'ghostBomber', 'ghostNecro', 'ghostSwarm', 'ghostSniper',
        'ghostReaper', 'ghostOverlord'
    ];
    Game.menuGhosts = [];
    for (let i = 0; i < 18; i++) {
        Game.menuGhosts.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 50,
            vy: -15 - Math.random() * 35,
            sprite: menuSprites[i % menuSprites.length],
            scale: 2 + Math.floor(Math.random() * 2)
        });
    }
}

function createPlayer() {
    const diff = DIFFICULTIES[Game.difficulty];
    const skin = PLAYER_SKINS[savedStats.selectedSkin] || PLAYER_SKINS.hellknight;
    const st = skin.stats;

    const startMaxHp = Math.round(140 * st.hpMult);
    const startWeaponId = st.startWeapon || 'blaster';

    return {
        skinId: skin.id,
        skinName: skin.name,
        x: ARENA_SIZE / 2,
        y: ARENA_SIZE / 2,
        radius: 15,
        hp: startMaxHp,
        maxHp: startMaxHp,
        regenMult: st.regenMult,
        lifestealMult: st.lifestealMult,
        thorns: st.thorns || 0,
        deathHarvest: st.deathHarvest || 0,
        radiantAura: !!st.radiantAura,
        toxicCloud: !!st.toxicCloud,
        predator: !!st.predator,
        bulletSpeedMult: 1.0,
        hpRegen: 0.35 * diff.regenUpgMult * st.regenMult,
        regenCarry: 0,
        speed: 225 * st.speedMult,
        dmg: 17 * st.dmgMult,
        fireRate: 2.9,
        fireCooldown: 0,
        projectiles: 1,
        pierce: 0,
        range: 420,
        critChance: 0.10,
        lifeStealOnKill: 0.05 * diff.regenUpgMult * st.lifestealMult,
        killHealProgress: 0,

        weaponId: startWeaponId,
        weaponTier: 1,

        level: 1,
        xp: 0,
        xpNext: 18,
        pickupRadius: 115,
        xpGainMult: 1.05,

        facingX: 1,
        facingY: 0,
        aimAngle: 0,
        walkAnimTimer: 0,
        walkFrame: 0,
        invulnTimer: 0,

        cdr: 1.0,
        mainBaseCd: 45.0,
        mainCd: 0,
        mainPowerCount: 3,
        mainPowerMult: 3.5,

        secBaseCd: 20.0,
        secCd: 0,
        secPowerCount: 5,
        secPowerMult: 2.0,

        dashBaseCd: 6.0,
        dashCd: 0,
        dashActiveTimer: 0,
        dashVx: 0,
        dashVy: 0,

        comboCount: 0,
        comboTimer: 0,
        overdriveTimer: 0,

        inventory: startWeaponId !== 'blaster' ? { [`wep_${startWeaponId}`]: 1 } : {}
    };
}

window.canvas = canvas;
window.ctx = ctx;
window.minimapCanvas = minimapCanvas;
window.mctx = mctx;
window.TILE_SIZE = TILE_SIZE;
window.ARENA_SIZE = ARENA_SIZE;
window.Game = Game;
window.initFloorDetails = initFloorDetails;
window.initMenuGhosts = initMenuGhosts;
window.createPlayer = createPlayer;
