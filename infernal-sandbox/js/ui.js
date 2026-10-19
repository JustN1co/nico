/* ==========================================================================
   10. LEVEL UP, VICTORY & INVENTORY MODALS
========================================================================== */
function refreshWeaponCanvasIcons() {
    if (!Game.player) return;
    const wep = WEAPONS[Game.player.weaponId] || WEAPONS.blaster;
    ['weaponIconCanvas', 'invModalWeaponCanvas'].forEach((id) => {
        const wc = document.getElementById(id);
        if (wc) drawCenteredPixelIcon(wc, wep.sprite, 3);
    });

    // Offhand slot
    const offhandBox = document.getElementById('offhandSlotBox');
    const offhandEmpty = document.getElementById('offhandSlotEmpty');
    const offhandCanvas = document.getElementById('offhandIconCanvas');
    const offhandBonus = document.getElementById('hudOffhandBonus');
    if (offhandBox && offhandEmpty) {
        if (Game.player.offhandWeaponId) {
            const offWep = WEAPONS[Game.player.offhandWeaponId];
            offhandBox.classList.remove('hidden');
            offhandEmpty.classList.add('hidden');
            if (offhandCanvas && offWep) drawCenteredPixelIcon(offhandCanvas, offWep.sprite, 1);
            if (offhandBonus) offhandBonus.classList.remove('hidden');
        } else {
            offhandBox.classList.add('hidden');
            offhandEmpty.classList.remove('hidden');
            if (offhandBonus) offhandBonus.classList.add('hidden');
        }
    }
}

function generateUpgradeOffer() {
    const p = Game.player;
    const diff = DIFFICULTIES[Game.difficulty];
    const choices = pickWeightedUpgrades(3);

    const offerWeapon = (p.level % 4 === 0 && Math.random() < 0.65) || Math.random() < 0.16;
    if (offerWeapon) {
        const weaponKeys = Object.keys(WEAPONS);
        const pickedKey = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
        const wep = WEAPONS[pickedKey];
        const isSameWeapon = p.weaponId === wep.id;
        const nextTier = isSameWeapon ? p.weaponTier + 1 : p.weaponTier;

        const curWep = WEAPONS[p.weaponId] || WEAPONS.blaster;
        const curTierBonus = 1 + (p.weaponTier - 1) * ((curWep.adaptiveTierBonus || 0.22) * diff.upgMult);
        const curEffDmg = Math.round(p.dmg * curWep.dmgFactor * curTierBonus);

        const newTierBonus = 1 + (p.weaponTier - 1) * ((wep.adaptiveTierBonus || 0.22) * diff.upgMult);
        const newEffDmg = Math.round(p.dmg * wep.dmgFactor * newTierBonus);

        const upgradedTierBonus = 1 + (nextTier - 1) * ((wep.adaptiveTierBonus || 0.22) * diff.upgMult);
        const nextEffDmg = Math.round(p.dmg * wep.dmgFactor * upgradedTierBonus);

        const isOffhandSame = p.offhandWeaponId && p.offhandWeaponId === wep.id;
        const hasOffhand = !!p.offhandWeaponId;

        const slotIndex = Math.floor(Math.random() * 3);
        choices[slotIndex] = {
            id: `weapon_${wep.id}`,
            isWeaponCard: true,
            weaponObj: wep,
            sprite: wep.sprite,
            name: isSameWeapon
                ? `${wep.name} MK ${nextTier}`
                : (isOffhandSame ? `${wep.name} (OFFHAND MK UP)` : (hasOffhand ? `MAIN: ${wep.name}` : `OFFHAND: ${wep.name}`)),
            type: isSameWeapon ? '★ WEAPON TIER UP' : (hasOffhand ? '⚔ SWAP MAIN' : '⚔ SET OFFHAND'),
            color: wep.color,
            getDesc() {
                if (isSameWeapon) {
                    const bonusPct = Math.round((wep.adaptiveTierBonus || 0.22) * diff.upgMult * 100);
                    return `Upgrades to MK ${nextTier}! (DMG: ${curEffDmg} → ${nextEffDmg}, +${bonusPct}% scaling & +1 Shot / 2 Tiers).`;
                } else if (!hasOffhand) {
                    const curRate = (p.fireRate * curWep.rateFactor).toFixed(1);
                    const newRate = (p.fireRate * wep.rateFactor).toFixed(1);
                    return `Sets OFFHAND slot! Grants +1 bonus Shot (passive). ${wep.name}: SPD ${newRate}/s. ${wep.desc}`;
                } else {
                    const curRate = (p.fireRate * curWep.rateFactor).toFixed(1);
                    const newRate = (p.fireRate * wep.rateFactor).toFixed(1);
                    return `Swaps MAIN weapon (offhand stays). DMG: ${curEffDmg} → ${newEffDmg} • SPD: ${curRate}/s → ${newRate}/s. ${wep.desc}`;
                }
            },
            apply(player) {
                if (player.weaponId === wep.id) {
                    // Same weapon → tier up main
                    player.weaponTier += 1;
                } else if (!player.offhandWeaponId) {
                    // No offhand yet → new weapon goes to offhand (+1 shot bonus)
                    player.offhandWeaponId = wep.id;
                    player.projectiles += 1; // passive offhand bonus
                    spawnFloatingText(player.x, player.y - 28, `⚔ OFFHAND: ${wep.name} (+1 SHOT)!`, '#c084fc');
                } else {
                    // Already have offhand → swap main weapon (inherit tier)
                    player.weaponId = wep.id;
                }
                const invKey = `wep_${wep.id}`;
                player.inventory[invKey] = (player.inventory[invKey] || 0) + 1;
                refreshWeaponCanvasIcons();
                if (player.weaponId === wep.id && !player.offhandWeaponId) {
                    spawnFloatingText(player.x, player.y - 28, `${wep.name} MK ${player.weaponTier}!`, wep.color);
                }
            }
        };
    }

    Game.currentUpgradeChoices = choices;
    Game.selectedUpgradeIndex = 0;
    renderLevelUpCards();
}

function renderLevelUpCards() {
    const p = Game.player;
    const diff = DIFFICULTIES[Game.difficulty];
    const container = document.getElementById('upgradeChoicesContainer');
    container.innerHTML = '';

    document.getElementById('lvlDiffScalingBadge').textContent =
        `POTENCY: ${Math.round(diff.upgMult * 100)}% (REGEN: ${Math.round(diff.regenUpgMult * 100)}%)`;
    document.getElementById('rerollCountText').textContent = Game.rerollsLeft;

    Game.currentUpgradeChoices.forEach((upg, index) => {
        const currentStacks = upg.isWeaponCard
            ? `MK ${p.weaponTier}`
            : (p.inventory[upg.id] || 0);
        const isSelected = index === Game.selectedUpgradeIndex;
        const isCursed = !!upg.isCursed;
        const descText = upg.getDesc ? upg.getDesc(diff) : upg.desc;

        const card = document.createElement('div');
        const cursedClasses = isCursed ? 'border-purple-500 shadow-[0_0_12px_rgba(192,132,252,0.45)] bg-purple-950/40' : '';
        card.className = `upgrade-card pixel-box-dark p-4 flex flex-col justify-between text-center cursor-pointer ${isSelected ? 'selected-card' : ''} ${cursedClasses}`;
        card.innerHTML = `
            <div class="flex flex-col items-center">
                <div class="w-full flex items-center justify-between text-[9px] mb-2">
                    <span class="upg-type-badge px-1.5 py-0.5 ${isCursed ? 'bg-purple-900 border border-purple-400 text-purple-300' : 'bg-slate-900 border border-slate-500'}">${upg.type}</span>
                    <span class="text-slate-400">${upg.isWeaponCard ? currentStacks : 'OWNED: ' + currentStacks}</span>
                </div>

                <!-- 8-Bit Pixel Art Upgrade Thumbnail -->
                <div class="upg-icon-box upgrade-icon-frame w-16 h-16 mb-2.5 border-2 flex items-center justify-center">
                    <canvas width="48" height="48" class="upg-icon-canvas w-12 h-12"></canvas>
                </div>

                <div class="text-xs sm:text-sm ${isCursed ? 'text-purple-300' : 'text-amber-300'} mb-1.5 leading-snug font-bold">${upg.name}</div>
                <p class="font-retro text-base sm:text-lg ${isCursed ? 'text-purple-200' : 'text-slate-200'} leading-snug">${descText}</p>
            </div>
            <button class="pixel-btn ${isSelected ? 'pixel-btn-primary' : ''} w-full py-2.5 text-[10px] mt-4">
                ${isSelected ? '▶ [ENTER / SPC] CONFIRM ◀' : 'SELECT UPGRADE'}
            </button>
        `;

        const typeBadge = card.querySelector('.upg-type-badge');
        if (typeBadge && !isCursed) typeBadge.style.color = upg.color;

        const iconBox = card.querySelector('.upg-icon-box');
        if (iconBox) iconBox.style.borderColor = upg.color;

        const iconCanvas = card.querySelector('.upg-icon-canvas');
        drawCenteredPixelIcon(iconCanvas, upg.sprite || 'upgPowder', 3);

        card.addEventListener('mouseenter', () => {
            if (Game.selectedUpgradeIndex !== index) {
                Game.selectedUpgradeIndex = index;
                updateLevelUpCardHighlight();
            }
        });

        card.addEventListener('click', () => {
            confirmUpgradeChoice(index);
        });

        container.appendChild(card);
    });
}

function updateLevelUpCardHighlight() {
    const container = document.getElementById('upgradeChoicesContainer');
    const cards = container.querySelectorAll('.upgrade-card');
    cards.forEach((card, idx) => {
        const btn = card.querySelector('button');
        if (idx === Game.selectedUpgradeIndex) {
            card.classList.add('selected-card');
            if (btn) {
                btn.classList.add('pixel-btn-primary');
                btn.textContent = '▶ [ENTER / SPC] CONFIRM ◀';
            }
        } else {
            card.classList.remove('selected-card');
            if (btn) {
                btn.classList.remove('pixel-btn-primary');
                btn.textContent = 'SELECT UPGRADE';
            }
        }
    });
}

function confirmUpgradeChoice(index) {
    const upg = Game.currentUpgradeChoices[index];
    if (!upg) return;

    const diff = DIFFICULTIES[Game.difficulty];
    AudioEngine.sfxClick();
    upg.apply(Game.player, diff);
    if (!upg.isWeaponCard) {
        Game.player.inventory[upg.id] = (Game.player.inventory[upg.id] || 0) + 1;
    }
    document.getElementById('modalLevelUp').classList.add('hidden');
    Game.state = 'PLAYING';
    updateHud();
}

function triggerRerollUpgrades() {
    if (Game.state !== 'LEVEL_UP' || Game.rerollsLeft <= 0) return;
    Game.rerollsLeft -= 1;
    AudioEngine.sfxSecPower();
    generateUpgradeOffer();
}

function openLevelUpModal() {
    Game.state = 'LEVEL_UP';
    Game.levelUpInputLockTimer = 0.22;
    Game.navKeyHeld = { ...Game.keysPressed };
    AudioEngine.sfxLevelUp();
    updateHud();
    generateUpgradeOffer();
    document.getElementById('modalLevelUp').classList.remove('hidden');
}

function openInventoryModal() {
    if (Game.state !== 'PLAYING' && Game.state !== 'PAUSED') return;
    Game.state = 'PAUSED';
    AudioEngine.sfxClick();

    const p = Game.player;
    const diff = DIFFICULTIES[Game.difficulty];
    const wep = WEAPONS[p.weaponId] || WEAPONS.blaster;
    refreshWeaponCanvasIcons();
    document.getElementById('invWeaponTitle').textContent = `${wep.name} MK ${p.weaponTier}`;

    const tierBonusPerLevel = wep.adaptiveTierBonus || 0.22;
    const tierDmgBonus = 1 + (p.weaponTier - 1) * (tierBonusPerLevel * diff.upgMult);
    const effDmg = Math.round(p.dmg * wep.dmgFactor * tierDmgBonus);
    const effRate = (p.fireRate * wep.rateFactor).toFixed(2);
    const effShots = p.projectiles + wep.bonusShots + Math.floor((p.weaponTier - 1) / 2);

    const statsList = document.getElementById('invStatsList');
    statsList.innerHTML = `
        <div class="flex justify-between"><span>Survivor:</span><strong class="text-amber-300">${p.skinName}</strong></div>
        <div class="flex justify-between"><span>Max HP:</span><strong class="text-red-400">${Math.ceil(p.hp)} / ${p.maxHp}</strong></div>
        <div class="flex justify-between"><span>HP Regen:</span><strong class="text-emerald-400">+${p.hpRegen.toFixed(2)}/s</strong></div>
        <div class="flex justify-between"><span>Leech / Kill:</span><strong class="text-pink-400">${p.lifeStealOnKill.toFixed(2)} HP</strong></div>
        <div class="flex justify-between"><span>Thorns DMG:</span><strong class="text-lime-400">${Math.round((p.thorns || 0) * 100)}%</strong></div>
        <div class="flex justify-between"><span>Weapon DMG:</span><strong class="text-amber-300">${effDmg}</strong></div>
        <div class="flex justify-between"><span>Attack Speed:</span><strong class="text-cyan-300">${effRate}/s</strong></div>
        <div class="flex justify-between"><span>Projectiles:</span><strong class="text-white">${effShots}</strong></div>
        <div class="flex justify-between"><span>Crit Chance:</span><strong class="text-yellow-300">${Math.round(p.critChance * 100)}%</strong></div>
        <div class="flex justify-between"><span>Magnet Radius:</span><strong class="text-teal-300">${Math.round(p.pickupRadius)}px</strong></div>
        <div class="flex justify-between"><span>Rerolls Left:</span><strong class="text-cyan-300">${Game.rerollsLeft}</strong></div>
        <div class="flex justify-between"><span>Move Speed:</span><strong class="text-emerald-300">${Math.round(p.speed)}</strong></div>
        ${p.deathHarvest ? `<div class="flex justify-between"><span>Heart Harvest:</span><strong class="text-emerald-400">+${Math.round(p.deathHarvest * 100)}%</strong></div>` : ''}
        ${p.radiantAura ? `<div class="flex justify-between"><span>Radiant Aura:</span><strong class="text-yellow-300">-15% Ghost SPD</strong></div>` : ''}
        ${p.toxicCloud ? `<div class="flex justify-between"><span>Toxic Cloud:</span><strong class="text-emerald-300">Active</strong></div>` : ''}
        ${p.hasFlameDash ? `<div class="flex justify-between"><span>Flame Dash:</span><strong class="text-orange-400">Active</strong></div>` : ''}
    `;

    const grid = document.getElementById('invItemsGrid');
    grid.innerHTML = '';
    const entries = Object.entries(p.inventory);
    let totalItems = 0;

    if (entries.length === 0) {
        grid.innerHTML = `<div class="col-span-full font-retro text-lg text-slate-400 py-8 text-center">No upgrades collected yet. Slay spirits and level up!</div>`;
    } else {
        entries.forEach(([id, count]) => {
            totalItems += count;
            let upg = UPGRADE_POOL.find(u => u.id === id);
            if (!upg && id.startsWith('wep_')) {
                const wKey = id.replace('wep_', '');
                const wObj = WEAPONS[wKey];
                if (wObj) {
                    upg = {
                        name: wObj.name,
                        sprite: wObj.sprite,
                        type: 'WEAPON ARSENAL',
                        color: wObj.color,
                        desc: wObj.desc
                    };
                }
            }
            if (!upg) return;
            const descText = upg.getDesc ? upg.getDesc(diff) : upg.desc;
            const itemEl = document.createElement('div');
            itemEl.className = 'bg-black/60 border-2 border-slate-600 p-2.5 flex flex-col justify-between';
            itemEl.innerHTML = `
                <div>
                    <div class="flex items-center justify-between text-[9px] mb-1.5">
                        <span class="inv-type-badge">${upg.type}</span>
                        <span class="px-1.5 py-0.5 bg-amber-600 text-white">x${count}</span>
                    </div>
                    <div class="flex items-center gap-2 mb-1">
                        <div class="w-8 h-8 bg-slate-950 border border-slate-600 flex items-center justify-center shrink-0">
                            <canvas width="32" height="32" class="inv-item-canvas w-7 h-7"></canvas>
                        </div>
                        <div class="text-[10px] text-white leading-tight">${upg.name}</div>
                    </div>
                    <div class="font-retro text-sm text-slate-300 leading-tight">${descText}</div>
                </div>
            `;
            const badgeEl = itemEl.querySelector('.inv-type-badge');
            if (badgeEl) badgeEl.style.color = upg.color;
            const itemCanvas = itemEl.querySelector('.inv-item-canvas');
            drawCenteredPixelIcon(itemCanvas, upg.sprite || 'upgPowder', 2);
            grid.appendChild(itemEl);
        });
    }

    document.getElementById('invTotalUpgrades').textContent = `${totalItems} Upgrades`;
    document.getElementById('modalInventory').classList.remove('hidden');
}

function closeInventoryModal() {
    document.getElementById('modalInventory').classList.add('hidden');
    if (Game.state === 'PAUSED') {
        Game.state = 'PLAYING';
    }
}

function openVictoryModal() {
    Game.state = 'VICTORY';
    document.getElementById('lowHpVignette').classList.add('hidden');
    AudioEngine.sfxLevelUp();

    const p = Game.player;
    const wep = WEAPONS[p.weaponId] || WEAPONS.blaster;
    const box = document.getElementById('victoryStatsBox');
    box.innerHTML = `
        <div class="grid grid-cols-2 gap-2 text-sm sm:text-base">
            <div>SURVIVOR: <strong class="text-amber-300">${p.skinName}</strong></div>
            <div>DIFFICULTY: <strong class="text-amber-300">${DIFFICULTIES[Game.difficulty].name}</strong></div>
            <div>WAVES CONQUERED: <strong class="text-emerald-400">25 / 25</strong></div>
            <div>PLAYER LEVEL: <strong class="text-cyan-300">LVL ${p.level}</strong></div>
            <div>SPIRITS SLAIN: <strong class="text-white">${Game.killsThisRun}</strong></div>
            <div>MAX COMBO: <strong class="text-rose-400">${Game.maxComboThisRun || 0}x</strong></div>
            <div>TOTAL DAMAGE: <strong class="text-orange-300">${Game.totalDamageDealt || 0}</strong></div>
            <div>HEARTS FOUND: <strong class="text-red-400">${Game.heartsCollected || 0}</strong></div>
            <div class="col-span-2 border-t border-slate-700 pt-1 text-slate-300">
                FINAL WEAPON: <strong class="text-yellow-300">${wep.name} MK ${p.weaponTier}</strong>
            </div>
        </div>
    `;
    document.getElementById('modalVictory').classList.remove('hidden');
}

function triggerGameOver() {
    Game.state = 'GAME_OVER';
    document.getElementById('lowHpVignette').classList.add('hidden');
    const p = Game.player;
    const wep = WEAPONS[p.weaponId] || WEAPONS.blaster;
    const box = document.getElementById('gameOverStatsBox');
    box.innerHTML = `
        <div class="grid grid-cols-2 gap-2 text-sm sm:text-base">
            <div>SURVIVOR: <strong class="text-amber-300">${p.skinName}</strong></div>
            <div>DIFFICULTY: <strong class="text-amber-300">${DIFFICULTIES[Game.difficulty].name}</strong></div>
            <div>WAVE REACHED: <strong class="text-red-400">WAVE ${Game.wave} ${Game.freeplay ? '(FREEPLAY)' : '/ 25'}</strong></div>
            <div>PLAYER LEVEL: <strong class="text-cyan-300">LVL ${p.level}</strong></div>
            <div>GHOSTS SLAIN: <strong class="text-white">${Game.killsThisRun}</strong></div>
            <div>MAX COMBO: <strong class="text-rose-400">${Game.maxComboThisRun || 0}x</strong></div>
            <div>TOTAL DAMAGE: <strong class="text-orange-300">${Game.totalDamageDealt || 0}</strong></div>
            <div>HEARTS FOUND: <strong class="text-red-400">${Game.heartsCollected || 0}</strong></div>
            <div class="col-span-2 border-t border-slate-700 pt-1 text-slate-300">
                FINAL WEAPON: <strong class="text-yellow-300">${wep.name} MK ${p.weaponTier}</strong>
            </div>
        </div>
    `;
    document.getElementById('modalGameOver').classList.remove('hidden');
    refreshMenuStats();
}

/* ==========================================================================
   11. HUD UPDATER (WITH LOW-HP RED VIGNETTE & COMBO / OVERDRIVE BADGES)
========================================================================== */
function updateHud() {
    const p = Game.player;
    if (!p) return;

    document.getElementById('hudKills').textContent = Game.killsThisRun;
    document.getElementById('hudLevel').textContent = p.level;
    const xpPct = Math.min(100, Math.round((p.xp / p.xpNext) * 100));
    document.getElementById('hudXpBar').style.width = `${xpPct}%`;
    document.getElementById('hudXpText').textContent = `${Math.floor(p.xp)}/${p.xpNext}`;

    const comboBadge = document.getElementById('hudComboBadge');
    if (p.comboCount >= 3) {
        comboBadge.classList.remove('hidden');
        let badgeText = `🔥 ${p.comboCount}x STREAK`;
        let badgeClass = 'text-[9px] px-2 py-0.5 border ';
        if (p.comboCount >= 50) {
            badgeText = `💀 ${p.comboCount}x GODLIKE!`;
            badgeClass += 'bg-purple-900 text-yellow-300 border-yellow-400 animate-pulse';
        } else if (p.comboCount >= 25) {
            badgeText = `⚡ ${p.comboCount}x RAMPAGE!`;
            badgeClass += 'bg-orange-800 text-amber-200 border-amber-400 animate-bounce';
        } else if (p.comboCount >= 15) {
            badgeText = `🔥 ${p.comboCount}x COMBO (+8% DMG)`;
            badgeClass += 'bg-rose-700 text-white border-rose-300';
        } else if (p.comboCount >= 5) {
            badgeText = `⚡ ${p.comboCount}x COMBO (+5% SPD)`;
            badgeClass += 'bg-cyan-800 text-cyan-200 border-cyan-400';
        } else {
            badgeClass += 'bg-slate-800 text-slate-200 border-slate-500';
        }
        comboBadge.textContent = badgeText;
        comboBadge.className = badgeClass;
    } else {
        comboBadge.classList.add('hidden');
    }

    const overdriveBadge = document.getElementById('hudOverdriveBadge');
    if (p.overdriveTimer > 0) {
        overdriveBadge.classList.remove('hidden');
        overdriveBadge.textContent = `⚡ OVERDRIVE (${p.overdriveTimer.toFixed(1)}s)`;
    } else {
        overdriveBadge.classList.add('hidden');
    }

    const baseWaveTitle = Game.freeplay
        ? `FREEPLAY - WAVE ${Game.wave}`
        : `WAVE ${Game.wave} / ${Game.maxTargetWave}`;
    document.getElementById('hudWaveTitle').textContent = Game.waveEvent
        ? `${baseWaveTitle} • ${Game.waveEvent.name}`
        : baseWaveTitle;
    document.getElementById('hudWaveTimer').textContent = Math.ceil(Math.max(0, Game.waveTimer));

    document.getElementById('hudHpText').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
    const hpRatio = Math.max(0, Math.min(1, p.hp / p.maxHp));
    document.getElementById('hudHpBar').style.width = `${hpRatio * 100}%`;

    const lowHpEl = document.getElementById('lowHpVignette');
    const hpLabel = document.getElementById('hudHpLabel');
    if (Game.state === 'PLAYING' && hpRatio <= 0.35 && p.hp > 0) {
        lowHpEl.classList.remove('hidden');
        hpLabel.textContent = '⚠ CRITICAL HP!';
        hpLabel.className = 'text-red-400 animate-pulse';
    } else {
        lowHpEl.classList.add('hidden');
        hpLabel.textContent = '♥ PLAYER HP';
        hpLabel.className = 'text-red-400';
    }

    const diff = DIFFICULTIES[Game.difficulty];
    const wep = WEAPONS[p.weaponId] || WEAPONS.blaster;
    const tierBonusPerLevel = wep.adaptiveTierBonus || 0.22;
    const tierDmgBonus = 1 + (p.weaponTier - 1) * (tierBonusPerLevel * diff.upgMult);
    const comboDmgMult = p.comboCount >= 15 ? 1.08 : 1.0;
    const comboRateMult = p.comboCount >= 5 ? 1.05 : 1.0;
    const effDmg = Math.round(p.dmg * wep.dmgFactor * tierDmgBonus * comboDmgMult);
    const effRate = (p.fireRate * wep.rateFactor * (p.overdriveTimer > 0 ? 1.38 : 1.0) * comboRateMult).toFixed(1);
    const effShots = p.projectiles + wep.bonusShots + Math.floor((p.weaponTier - 1) / 2);

    document.getElementById('hudWeaponName').textContent = `${wep.name} MK ${p.weaponTier}`;
    document.getElementById('hudWeaponDmg').textContent = effDmg;
    document.getElementById('hudWeaponRate').textContent = `${effRate}/s`;
    document.getElementById('hudWeaponShots').textContent = effShots;
    document.getElementById('hudWeaponTag').textContent = wep.tag;

    const totalUpgrades = Object.values(p.inventory).reduce((a, b) => a + b, 0);
    document.getElementById('hudItemCount').textContent = totalUpgrades;

    document.getElementById('keyBadgeMain').textContent = formatKeyCode(keybinds.mainPower);
    document.getElementById('keyBadgeSec').textContent = formatKeyCode(keybinds.secPower);
    document.getElementById('keyBadgeDash').textContent = formatKeyCode(keybinds.dash);

    document.getElementById('descMainPower').textContent = `${p.mainPowerCount}x BIG (x${p.mainPowerMult.toFixed(1)})`;
    document.getElementById('descSecPower').textContent = `${p.secPowerCount}x ORB NOVA`;
    document.getElementById('descDash').textContent = `${(p.dashBaseCd * p.cdr).toFixed(1)}s CD`;

    const cdOverlayMain = document.getElementById('cdOverlayMain');
    if (p.mainCd > 0) {
        cdOverlayMain.classList.remove('hidden');
        document.getElementById('cdTextMain').textContent = `${p.mainCd.toFixed(1)}s`;
        document.getElementById('statusBadgeMain').textContent = 'WAIT';
        document.getElementById('statusBadgeMain').className = 'text-amber-400';
    } else {
        cdOverlayMain.classList.add('hidden');
        document.getElementById('statusBadgeMain').textContent = 'READY';
        document.getElementById('statusBadgeMain').className = 'text-emerald-400';
    }

    const cdOverlaySec = document.getElementById('cdOverlaySec');
    if (p.secCd > 0) {
        cdOverlaySec.classList.remove('hidden');
        document.getElementById('cdTextSec').textContent = `${p.secCd.toFixed(1)}s`;
        document.getElementById('statusBadgeSec').textContent = 'WAIT';
        document.getElementById('statusBadgeSec').className = 'text-cyan-400';
    } else {
        cdOverlaySec.classList.add('hidden');
        document.getElementById('statusBadgeSec').textContent = 'READY';
        document.getElementById('statusBadgeSec').className = 'text-emerald-400';
    }

    const cdOverlayDash = document.getElementById('cdOverlayDash');
    if (p.dashCd > 0) {
        cdOverlayDash.classList.remove('hidden');
        document.getElementById('cdTextDash').textContent = `${p.dashCd.toFixed(1)}s`;
        document.getElementById('statusBadgeDash').textContent = 'WAIT';
        document.getElementById('statusBadgeDash').className = 'text-emerald-300';
    } else {
        cdOverlayDash.classList.add('hidden');
        document.getElementById('statusBadgeDash').textContent = 'READY';
        document.getElementById('statusBadgeDash').className = 'text-emerald-400';
    }
}

/* ==========================================================================
   13. STATIC HUD, SKIN SELECTOR & MENU PIXEL ICONS INITIALIZATION
========================================================================== */
function refreshMenuLogoEmblem() {
    const logoCanvas = document.getElementById('menuLogoCanvas');
    if (!logoCanvas) return;
    const lctx = logoCanvas.getContext('2d');
    lctx.imageSmoothingEnabled = false;
    lctx.clearRect(0, 0, 96, 96);
    const heroSp = getPlayerSpriteCanvas('playerIdle', 6);
    const ghostSp = getSpriteCanvas('ghostOverlord', 4);
    if (ghostSp) lctx.drawImage(ghostSp, 42, 6);
    if (heroSp) lctx.drawImage(heroSp, 8, 22);
}

function renderSkinSelector() {
    const grid = document.getElementById('skinSelectorGrid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.values(PLAYER_SKINS).forEach((skin) => {
        const isSelected = savedStats.selectedSkin === skin.id;
        const btn = document.createElement('button');
        btn.className = `skin-btn pixel-btn py-2 px-1 flex flex-col items-center justify-between gap-1 min-h-[70px] ${isSelected ? 'active-skin' : ''}`;
        btn.innerHTML = `
            <canvas width="36" height="36" class="w-8 h-8 shrink-0"></canvas>
            <span class="text-[7px] sm:text-[8px] leading-tight tracking-tighter break-words w-full text-center">${skin.name}</span>
        `;
        const c = btn.querySelector('canvas');
        drawCenteredPixelIcon(c, 'playerIdle', 3, skin.map);

        btn.addEventListener('click', () => {
            AudioEngine.sfxClick();
            savedStats.selectedSkin = skin.id;
            saveStorage();
            document.getElementById('skinTraitLabel').innerHTML = skin.traitHtml;
            renderSkinSelector();
            refreshMenuLogoEmblem();
        });

        grid.appendChild(btn);
    });

    const currentSkin = PLAYER_SKINS[savedStats.selectedSkin] || PLAYER_SKINS.hellknight;
    document.getElementById('skinTraitLabel').innerHTML = currentSkin.traitHtml;
}

function drawStaticHudIcons() {
    refreshMenuLogoEmblem();
    drawCenteredPixelIcon(document.getElementById('invIconCanvas'), 'backpack', 3);
    drawCenteredPixelIcon(document.getElementById('weaponIconCanvas'), 'weaponGun', 3);
    drawCenteredPixelIcon(document.getElementById('invModalWeaponCanvas'), 'weaponGun', 3);
    drawCenteredPixelIcon(document.getElementById('iconMainPower'), 'iconMain', 2);
    drawCenteredPixelIcon(document.getElementById('iconSecPower'), 'iconSec', 2);
    drawCenteredPixelIcon(document.getElementById('iconDash'), 'iconDash', 2);
}

/* ==========================================================================
   14. UI BINDINGS (CONTROLS, VOLUME, STATS)
========================================================================== */
function refreshMenuStats() {
    document.getElementById('menuBestWave').textContent = savedStats.bestWave;
    document.getElementById('menuTotalKills').textContent = savedStats.totalKills;

    const crtBtn = document.getElementById('btnToggleCRT');
    const crtOverlay = document.getElementById('crtOverlay');
    if (savedStats.crtEnabled) {
        crtBtn.textContent = 'CRT: ON';
        crtOverlay.classList.remove('hidden');
    } else {
        crtBtn.textContent = 'CRT: OFF';
        crtOverlay.classList.add('hidden');
    }
}

function renderKeybindModalList() {
    const list = document.getElementById('keybindList');
    list.innerHTML = '';

    Object.keys(DEFAULT_KEYBINDS).forEach(action => {
        const row = document.createElement('div');
        row.className = 'pixel-box-dark px-3.5 py-2.5 flex items-center justify-between';
        const isListening = Game.rebindTarget === action;

        row.innerHTML = `
            <span class="text-[10px] sm:text-xs text-slate-200">${KEYBIND_LABELS[action]}</span>
            <button class="pixel-btn px-3 py-1.5 text-xs min-w-[90px] ${isListening ? 'border-amber-400 text-amber-300 animate-pulse' : ''}">
                ${isListening ? 'PRESS KEY...' : formatKeyCode(keybinds[action])}
            </button>
        `;

        row.querySelector('button').addEventListener('click', () => {
            AudioEngine.sfxClick();
            Game.rebindTarget = action;
            renderKeybindModalList();
        });

        list.appendChild(row);
    });
}

function renderSegmentBar(containerId, volumeValue, isMuted) {
    const segContainer = document.getElementById(containerId);
    if (!segContainer) return;
    segContainer.innerHTML = '';
    const activeBars = isMuted ? 0 : Math.round(volumeValue * 10);
    for (let i = 1; i <= 10; i++) {
        const seg = document.createElement('div');
        seg.className = i <= activeBars
            ? (i > 8 ? 'bg-red-500' : i > 5 ? 'bg-amber-400' : 'bg-emerald-400')
            : 'bg-slate-900';
        segContainer.appendChild(seg);
    }
}

function renderVolumeModalUI() {
    const sfxPct = Math.round(AudioEngine.sfxVolume * 100);
    const bgmPct = Math.round(AudioEngine.bgmVolume * 100);

    document.getElementById('sfxPercentText').textContent = AudioEngine.muted ? 'MUTED' : `${sfxPct}%`;
    document.getElementById('bgmPercentText').textContent = AudioEngine.muted ? 'MUTED' : `${bgmPct}%`;

    const statusSub = document.getElementById('audioStatusSub');
    statusSub.textContent = AudioEngine.muted ? 'MASTER MUTED' : 'ALL AUDIO ACTIVE';
    statusSub.className = `font-retro text-base ${AudioEngine.muted ? 'text-rose-400' : 'text-emerald-400'}`;

    const muteBtn = document.getElementById('btnToggleMuteModal');
    muteBtn.textContent = AudioEngine.muted ? 'UNMUTE ALL' : 'MUTE ALL';

    document.getElementById('btnHudMute').textContent = AudioEngine.muted ? '🔇' : '🔊';

    renderSegmentBar('sfxSegments', AudioEngine.sfxVolume, AudioEngine.muted);
    renderSegmentBar('bgmSegments', AudioEngine.bgmVolume, AudioEngine.muted);
}

window.refreshWeaponCanvasIcons = refreshWeaponCanvasIcons;
window.generateUpgradeOffer = generateUpgradeOffer;
window.renderLevelUpCards = renderLevelUpCards;
window.updateLevelUpCardHighlight = updateLevelUpCardHighlight;
window.confirmUpgradeChoice = confirmUpgradeChoice;
window.triggerRerollUpgrades = triggerRerollUpgrades;
window.openLevelUpModal = openLevelUpModal;
window.openInventoryModal = openInventoryModal;
window.closeInventoryModal = closeInventoryModal;
window.openVictoryModal = openVictoryModal;
window.triggerGameOver = triggerGameOver;
window.updateHud = updateHud;
window.refreshMenuLogoEmblem = refreshMenuLogoEmblem;
window.renderSkinSelector = renderSkinSelector;
window.drawStaticHudIcons = drawStaticHudIcons;
window.refreshMenuStats = refreshMenuStats;
window.renderKeybindModalList = renderKeybindModalList;
window.renderSegmentBar = renderSegmentBar;
window.renderVolumeModalUI = renderVolumeModalUI;
