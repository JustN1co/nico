/* ==========================================================================
   3. 8-BIT PIXEL ART SPRITE MATRICES & SURVIVOR SKINS (WITH BUFFS & NERFS)
========================================================================== */
const PALETTE = {
    'K': '#09060e',
    'W': '#ffffff',
    'G': '#cbd5e1',
    'S': '#64748b',
    'R': '#ef4444',
    'D': '#991b1b',
    'O': '#f97316',
    'Y': '#fde047',
    'F': '#fdba74',
    'C': '#22d3ee',
    'P': '#c084fc',
    'E': '#4ade80',
    'T': '#a16207'
};

const PLAYER_SKINS = {
    hellknight: {
        id: 'hellknight',
        name: 'HELLKNIGHT',
        traitHtml: '<span class="text-amber-300">0 BUFFS / 0 NERFS (DEFAULT)</span>',
        dashColor: '#ef4444',
        stats: {
            dmgMult: 1.0,
            hpMult: 1.0,
            speedMult: 1.0,
            regenMult: 1.0,
            lifestealMult: 1.0,
            startWeapon: 'blaster',
            thorns: 0
        },
        map: { 'R': '#ef4444', 'Y': '#fde047', 'F': '#fdba74', 'D': '#991b1b', 'T': '#a16207' }
    },
    cyber: {
        id: 'cyber',
        name: 'CYBER RONIN',
        traitHtml: '<span class="text-emerald-400">BUFF: x1.15 DMG</span> <span class="text-slate-500">|</span> <span class="text-rose-400">NERF: x0.90 HP</span>',
        dashColor: '#22d3ee',
        stats: {
            dmgMult: 1.15,
            hpMult: 0.90,
            speedMult: 1.0,
            regenMult: 1.0,
            lifestealMult: 1.0,
            startWeapon: 'blaster',
            thorns: 0
        },
        map: { 'R': '#0ea5e9', 'Y': '#22d3ee', 'F': '#e2e8f0', 'D': '#1e293b', 'T': '#ec4899' }
    },
    necro: {
        id: 'necro',
        name: 'VOID REAPER',
        traitHtml: '<span class="text-emerald-400">BUFF: SCYTHE, x1.35 LIFESTEAL, +8% HEART DROP</span> <span class="text-slate-500">|</span> <span class="text-rose-400">NERF: x0.75 HP, x0.88 SPD</span>',
        dashColor: '#c084fc',
        stats: {
            dmgMult: 1.0,
            hpMult: 0.75,
            speedMult: 0.88,
            regenMult: 1.0,
            lifestealMult: 1.35,
            startWeapon: 'scythe',
            deathHarvest: 0.08,
            thorns: 0
        },
        map: { 'R': '#9333ea', 'Y': '#4ade80', 'F': '#d8b4fe', 'D': '#3b0764', 'T': '#22c55e' }
    },
    paladin: {
        id: 'paladin',
        name: 'SOLAR PALADIN',
        traitHtml: '<span class="text-emerald-400">BUFF: x1.25 HP REGEN, x1.2 SPD, RADIANT SLOW AURA</span> <span class="text-slate-500">|</span> <span class="text-rose-400">NERF: x0.80 HP, x0.95 DMG</span>',
        dashColor: '#fde047',
        stats: {
            dmgMult: 0.95,
            hpMult: 0.80,
            speedMult: 1.20,
            regenMult: 1.25,
            lifestealMult: 1.0,
            startWeapon: 'blaster',
            radiantAura: true,
            thorns: 0
        },
        map: { 'R': '#f59e0b', 'Y': '#ffffff', 'F': '#fef08a', 'D': '#fef3c7', 'T': '#38bdf8' }
    },
    toxic: {
        id: 'toxic',
        name: 'BIO STALKER',
        traitHtml: '<span class="text-emerald-400">BUFF: 30% THORNS, TOXIC CLOUD, COMBO PREDATOR</span> <span class="text-slate-500">|</span> <span class="text-rose-400">NERF: x0.94 SPD, x0.90 HP</span>',
        dashColor: '#4ade80',
        stats: {
            dmgMult: 1.0,
            hpMult: 0.90,
            speedMult: 0.94,
            regenMult: 1.0,
            lifestealMult: 1.0,
            startWeapon: 'blaster',
            thorns: 0.30,
            toxicCloud: true,
            predator: true
        },
        map: { 'R': '#22c55e', 'Y': '#facc15', 'F': '#bbf7d0', 'D': '#14532d', 'T': '#a855f7' }
    }
};

const SPRITES = {
    playerIdle: [
        "...KKKKKK...",
        "..KRRRRRRK..",
        ".KRRYYYYRRK.",
        ".KFFFFFFFFK.",
        ".KFKFFFFKFK.",
        ".KFFFFFFFFK.",
        ".KDDDDDDDDK.",
        "..KDDDDDDK..",
        "..KTTTTTTK..",
        "..K.K..K.K..",
        "....K..K...."
    ],
    playerWalk: [
        "...KKKKKK...",
        "..KRRRRRRK..",
        ".KRRYYYYRRK.",
        ".KFFFFFFFFK.",
        ".KFKFFFFKFK.",
        ".KFFFFFFFFK.",
        ".KDDDDDDDDK.",
        "..KDDDDDDK..",
        "..KTTTTTTK..",
        ".K..K..K..K.",
        ".K........K."
    ],
    soulChest: [
        "..KKKKKKKK..",
        ".KYYYYYYYYK.",
        "KYYTTTTTTYYK",
        "KYTTTTTTTTYK",
        "KYYYYWWYYYYK",
        "KYTTTWWTTTYK",
        "KYYTTTTTTYYK",
        "KYYYYYYYYYYK",
        ".KKKKKKKKKK."
    ],
    ghostMelee: [
        "....KKKK....",
        "..KKWWWWKK..",
        ".KWWWWWWWWK.",
        ".KWKKWWKKWK.",
        ".KWRKWWKRWK.",
        "KWWWWWWWWWWK",
        "KWWWWWWWWWWK",
        "KWWWWGGGGWWK",
        "KWWGGGGGGGGK",
        "KWK.KWWK.KWK",
        ".K...KK...K."
    ],
    ghostFast: [
        "...KKKKKK...",
        "..KWWWWWWK..",
        ".KWWRWWWRWWK",
        ".KWRRWWWRRWK",
        ".KWWWWWWWWK.",
        "KWWWWGGGGWWK",
        "KWWGGGGGGGGK",
        ".KWK.KK.KWK.",
        "..K......K.."
    ],
    ghostRanged: [
        "...PPPPPP...",
        "..PKKKKKKP..",
        ".PKWWWWWWKP.",
        ".KWWWWWWWWK.",
        ".KWCCWWCCWK.",
        ".KWWWWWWWWK.",
        "KWWPPPPPPWWK",
        "KWWWWGGGGWWK",
        "KWWGGGGGGGGK",
        "KWK.KWWK.KWK",
        ".K...KK...K."
    ],
    ghostTank: [
        ".KK......KK.",
        "KYYK.KK.KYYK",
        "KYYKWWWWKYYK",
        ".KKWWWWWWKK.",
        ".KWWWWWWWWK.",
        "KWRRKWWKRRWK",
        "KWRRKWWKRRWK",
        "KWWWWWWWWWWK",
        "KWWKKKKKKWWK",
        "KWWWWGGGGWWK",
        "KWWGGGGGGGGK",
        "KWK.KWWK.KWK"
    ],
    ghostDasher: [
        ".KK......KK.",
        "KRRKKKKKKRRK",
        ".KRRRRRRRRK.",
        ".KRWWKKWWRK.",
        "KRRYYKKYYRRK",
        "KRRRRRRRRRRK",
        "KRRDDDDDDRRK",
        ".KDDDDDDDDK.",
        ".KDK.KK.KDK.",
        "..K......K.."
    ],
    ghostBomber: [
        "....KKKK....",
        "..KKYYYYKK..",
        ".KYYOOOOYYK.",
        "KYYOKWWKOYYK",
        "KYYORWWROYYK",
        "KYYOOOOOOYYK",
        "KOOOORRROOOK",
        ".KOOOOOOOO..",
        ".KOK.KK.KOK.",
        "..K......K.."
    ],
    ghostNecro: [
        "...KKKKKK...",
        "..KPPPPPPK..",
        ".KPPWWWWPPK.",
        "KPPWEEEEWPPK",
        "KPPWWWWWWPPK",
        "KPPPPPPPPPPK",
        "KPPSWWWWSPPK",
        "KPPSSSSSSPPK",
        ".KPK.KK.KPK.",
        "..K......K.."
    ],
    ghostSwarm: [
        "..KKKK..",
        ".KWWWWK.",
        "KWCCWWCK",
        "KWWWWWWK",
        "KWGGGGWK",
        ".K.KK.K."
    ],
    ghostSniper: [
        "...KKKKKK...",
        "..KSSSSSSK..",
        ".KSSWWWWSSK.",
        ".KSWEEEEWSK.",
        ".KSSWWWWSSK.",
        "KSSSSSSSSSSK",
        "KSSGGGGGGSSK",
        ".KSK.KK.KSK.",
        "..K......K.."
    ],
    ghostReaper: [
        "..KKKKKKKK..",
        ".KPPPPPPPPK.",
        "KPPKKKKKKPPK",
        "KPKWCCCCWKPK",
        "KPKWCCCCWKPK",
        "KPPKWWWWKPPK",
        "KPPPWWWWPPPK",
        "KPPCCCCCCPPK",
        "KPPPPPPPPPPK",
        ".KPK.KK.KPK.",
        "..K..KK..K.."
    ],
    ghostOverlord: [
        "KYYK.KK.KYYK",
        "KYYKKRRKKYYK",
        ".KRRRRRRRRK.",
        "KRRWWWWWWWRK",
        "KRWYYKKYYWRK",
        "KRWYYKKYYWRK",
        "KRRWWWWWWWRK",
        "KRRRRRRRRRRK",
        "KRRYYYYYYRRK",
        "KDDDDDDDDDDK",
        "KDK.KKKK.KDK",
        ".K...KK...K."
    ],
    ghostAssassin: [
        "...KKKKKK...",
        "..KSSSSSSK..",
        ".KSCCCCCCSKS",
        "KSCWKKWKCSKK",
        "KSCWRKWRCSKK",
        "KSSSSSSSSSK.",
        ".KSSDDSSSK..",
        ".KSSSSSSSK..",
        "KSK.KK.KSK..",
        "KK......KK..",
        "............"
    ],
    weaponGun: [
        "....KKKKKK",
        "..KKCCCCCCK",
        ".KSSSSSSSSK",
        "KYYYYYYYYK.",
        "KSSSKKKK...",
        "KKK........"
    ],
    weaponShotgun: [
        "...KKKKKKKK",
        ".KKDDDDDDDK",
        "KTTTTTTTTK.",
        "KTTTKKKK...",
        "KKKK......."
    ],
    weaponSmg: [
        "...KKKKKKK.",
        "..KCCCCCCC.",
        ".KSSSSSSSSK",
        "KSSK..KSSK.",
        "KKK...KKK.."
    ],
    weaponRailgun: [
        ".KKKKKKKKKK",
        "KCCCCCCCCCK",
        "KPPPPPPPPPK",
        ".KSSSSSSSS.",
        ".KKK......."
    ],
    weaponLauncher: [
        "..KKKKKKKK.",
        ".KRRRRRRRRK",
        "KYYYYYYYYYK",
        "KRRRRRRRRK.",
        ".KKK..KKK.."
    ],
    weaponScythe: [
        "...KKKKKK..",
        ".KKCCCCCCK.",
        "KCCK....KK.",
        "KCK...KK...",
        "KK..KK.....",
        "..KK......."
    ],
    weaponMinigun: [
        "..KKKKKKKKK",
        ".KYYYYYYYYK",
        "KOOOOOOOOOK",
        "KSSSSSSSSSK",
        ".KKK..KKKK."
    ],
    backpack: [
        "...KKKK...",
        "..KTTTTK..",
        ".KTTTTTTK.",
        "KTTTTTTTTK",
        "KTTYYYYTTK",
        "KTTKYYKTTK",
        "KTTTTTTTTK",
        "KSSSSSSSSK",
        ".KKKKKKKK."
    ],
    iconMain: [
        "..KK....KK..",
        ".KYYK..KYYK.",
        ".KORK..KORK.",
        ".KRRK..KRRK.",
        "....KKKK....",
        "...KYYYYK...",
        "...KOORK...",
        "...KRRRRK..."
    ],
    iconSec: [
        "....KK....",
        "...KCCK...",
        "KK..KK..KK",
        "KCK.PP.KCK",
        "KK.KPPK.KK",
        "...KKKK...",
        ".KK....KK.",
        ".KCK..KCK."
    ],
    iconDash: [
        "....KKKK..",
        "...KEEEEK.",
        "...KEEEEK.",
        "...KEEEKK.",
        ".KKEEEEK..",
        "KEEEEEEEKK",
        "KYYYYYYYYK",
        "KKKKKKKKKK"
    ],
    upgPowder: [
        "..K..KK..K..",
        ".KOK.KYYKOK.",
        "..KOOYYYYOK.",
        "..KOOOOOOOK.",
        ".KRRRRRRRRK.",
        "KRRRRYYYYRRK",
        "KRRRYYYYYRRK",
        "KRRRRRRRRRRK",
        ".KDDDDDDDDK.",
        "..KKKKKKKK.."
    ],
    upgCalibre: [
        "....KKKK....",
        "...KYYYYK...",
        "..KYYWWYYK..",
        "..KOOOOOOK..",
        "..KRRRRRRK..",
        "..KRRRRRRK..",
        "..KDDDDDDK..",
        "..KSSSSSSK..",
        "..KYYYYYYK..",
        "..KKKKKKKK.."
    ],
    upgNova: [
        ".....KK.....",
        "..K..CC..K..",
        ".KCK.CC.KCK.",
        "..KCCCCCCK..",
        "KCCCCWWCCCCK",
        "KCCCCWWCCCCK",
        "..KCCCCCCK..",
        ".KCK.CC.KCK.",
        "..K..CC..K..",
        ".....KK....."
    ],
    upgChrono: [
        ".KKKKKKKKKK.",
        ".KYYYYYYYYK.",
        "..KPPPPPPK..",
        "...KCCCCK...",
        "....KWWK....",
        "....KCCK....",
        "...KCCCCK...",
        "..KPCCCCPK..",
        ".KYYYYYYYYK.",
        ".KKKKKKKKKK."
    ],
    upgTrigger: [
        ".....KKKKKK.",
        "....KYYYYK..",
        "...KYYWWYK..",
        "..KYYYYKKKK.",
        ".KYYYYYYYYK.",
        "....KYYYYK..",
        "...KYYYYK...",
        "..KYYYYK....",
        ".KYYYK......",
        ".KKKK......."
    ],
    upgMultishot: [
        ".KK..KK..KK.",
        "KYYKKYYKKYYK",
        "KCCKKCCKKCCK",
        "KCCKKCCKKCCK",
        "KSSKKSSKKSSK",
        ".KK..KK..KK.",
        "....KKKK....",
        "...KCCCCK...",
        "...KSSSSK...",
        "....KKKK...."
    ],
    upgBoots: [
        "....KKKKKK..",
        "...KEEEEEEK.",
        "...KEEYYEEK.",
        "...KEEEEEEK.",
        "...KEEEEEKK.",
        ".KKEEEEEEK..",
        "KEEEEEEEEEKK",
        "KYYYYYYYYYYK",
        "KKKKKKKKKKKK"
    ],
    upgHeart: [
        ".KKK....KKK.",
        "KRRRK..KRRRK",
        "KRWWRKKRRRRK",
        "KRWRRRRRRRRK",
        "KRRRRRRRRRRK",
        ".KRRRRRRRRK.",
        "..KRRRRRRK..",
        "...KDDDDK...",
        "....KKKK...."
    ],
    upgFangs: [
        ".KKKKKKKKKK.",
        "KWWWWWWWWWWK",
        "KWWWWWWWWWWK",
        "KWWKWWWWKWWK",
        "KWK.KKKK.KWK",
        "KRK......KRK",
        "KRK......KRK",
        ".K........K."
    ],
    upgPierce: [
        "......KKKKK.",
        ".....KPPPPK.",
        "....KPPCCPK.",
        "...KPPCCPPK.",
        "..KPPCCPK...",
        ".KPPPPK.....",
        "KPPPK.......",
        "KPK.........",
        "KK.........."
    ],
    upgMagnet: [
        ".KKKK..KKKK.",
        "KCCCCKKCCCCK",
        "KWWWWKKWWWWK",
        "KRRRRKKRRRRK",
        "KRRRRKKRRRRK",
        "KRRRRRRRRRRK",
        ".KRRRRRRRRK.",
        "..KKKKKKKK.."
    ],
    upgChalice: [
        ".KKKKKKKKKK.",
        "KYYYYRRRRYYK",
        "KYYRRRRRRYYK",
        ".KYYYYYYYYK.",
        "..KYYYYYYK..",
        "....KYYK....",
        "....KYYK....",
        "..KKYYYYKK..",
        ".KYYYYYYYYK.",
        ".KKKKKKKKKK."
    ],
    upgCursedSkull: [
        ".KK......KK.",
        "KRRK....KRRK",
        "KRRKKKKKKRRK",
        ".KPPPPPPPPK.",
        ".KPKKPPKKPK.",
        ".KPPPPPPPPK.",
        "..KPKPPKPK..",
        "..KPPPPPPK..",
        "...KKKKKK..."
    ],
    upgBloodPact: [
        "....KKKK....",
        "..KKRRRRKK..",
        ".KRRDDDDRRK.",
        "KRDDRRRRDDRK",
        "KRDDDDDDDDRK",
        ".KRRDDDDRRK.",
        "..KKRRRRKK..",
        "....KKKK...."
    ],
    upgSoulFracture: [
        "...KK..KK...",
        "..KCCKKCCK..",
        ".KCCCCCCCCCK",
        ".KCCKWWKCCK.",
        "..KKWWWWKK..",
        ".KCCKWWKCCK.",
        ".KCCCCCCCCCK",
        "..KCCKKCCK..",
        "...KK..KK..."
    ],
    upgTemporalRift: [
        "..KKKKKKKK..",
        ".KPPCCCCPPK.",
        "KPCKWWWWKCPK",
        "KPCWWWWWWCPK",
        "KPCKWWWWKCPK",
        ".KPPCCCCPPK.",
        "..KKKKKKKK.."
    ]
};

const spriteCache = {};

function getSpriteCanvas(name, scale = 1, tint = null, customPalette = null) {
    const skinTag = customPalette ? JSON.stringify(customPalette) : 'default';
    const key = `${name}_${scale}_${tint || 'none'}_${skinTag}`;
    if (spriteCache[key]) return spriteCache[key];

    const matrix = SPRITES[name];
    if (!matrix) return null;

    const rows = matrix.length;
    const cols = matrix[0].length;
    const off = document.createElement('canvas');
    off.width = cols * scale;
    off.height = rows * scale;
    const octx = off.getContext('2d');

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const ch = matrix[r][c];
            if (ch === '.') continue;
            const mappedColor = (customPalette && customPalette[ch]) ? customPalette[ch] : PALETTE[ch];
            const color = tint || mappedColor;
            if (color) {
                octx.fillStyle = color;
                octx.fillRect(c * scale, r * scale, scale, scale);
            }
        }
    }
    spriteCache[key] = off;
    return off;
}

function getPlayerSpriteCanvas(spriteName, scale = 3, tint = null, skinId = null) {
    const activeSkinId = skinId || (typeof savedStats !== 'undefined' && savedStats.selectedSkin) || 'hellknight';
    const skinObj = PLAYER_SKINS[activeSkinId] || PLAYER_SKINS.hellknight;
    return getSpriteCanvas(spriteName, scale, tint, skinObj.map);
}

function drawCenteredPixelIcon(canvasEl, spriteName, scale = 3, customPalette = null) {
    if (!canvasEl) return;
    const cctx = canvasEl.getContext('2d');
    cctx.imageSmoothingEnabled = false;
    cctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    const sp = getSpriteCanvas(spriteName, scale, null, customPalette);
    if (sp) {
        const ox = Math.floor((canvasEl.width - sp.width) / 2);
        const oy = Math.floor((canvasEl.height - sp.height) / 2);
        cctx.drawImage(sp, ox, oy);
    }
}

window.PALETTE = PALETTE;
window.PLAYER_SKINS = PLAYER_SKINS;
window.SPRITES = SPRITES;
window.getSpriteCanvas = getSpriteCanvas;
window.getPlayerSpriteCanvas = getPlayerSpriteCanvas;
window.drawCenteredPixelIcon = drawCenteredPixelIcon;
