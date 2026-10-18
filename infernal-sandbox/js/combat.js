/* ==========================================================================
   9. MAIN COMBAT & UPDATE LOOP
========================================================================== */
function findNearestGhost(x, y, maxRange) {
    let best = null;
    let bestDist = maxRange;
    for (let i = 0; i < Game.enemies.length; i++) {
        const e = Game.enemies[i];
        const d = Math.hypot(e.x - x, e.y - y);
        if (d < bestDist) {
            bestDist = d;
            best = e;
        }
    }
    return best;
}

function addScreenShake(duration, magnitude) {
    Game.shakeTime = Math.max(Game.shakeTime, duration);
    Game.shakeMagnitude = Math.max(Game.shakeMagnitude, magnitude);
}

function spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 140;
        Game.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 3 + Math.floor(Math.random() * 4),
            color,
            life: 0.25 + Math.random() * 0.25,
            maxLife: 0.5
        });
    }
}

function spawnFloatingText(x, y, text, color = '#ffffff') {
    Game.floatingTexts.push({
        x: x + (Math.random() - 0.5) * 16,
        y,
        text,
        color,
        life: 0.75
    });
}

function updateGame(dt) {
    if (Game.levelUpInputLockTimer > 0) {
        Game.levelUpInputLockTimer = Math.max(0, Game.levelUpInputLockTimer - dt);
    }

    if (Game.state === 'MENU') {
        for (const mg of Game.menuGhosts) {
            mg.x += mg.vx * dt;
            mg.y += mg.vy * dt;
            if (mg.y < -60) mg.y = window.innerHeight + 60;
            if (mg.x < -60) mg.x = window.innerWidth + 60;
            if (mg.x > window.innerWidth + 60) mg.x = -60;
        }
        return;
    }

    if (Game.state !== 'PLAYING') return;

    const p = Game.player;
    const diff = DIFFICULTIES[Game.difficulty];

    if (Game.shakeTime > 0) {
        Game.shakeTime = Math.max(0, Game.shakeTime - dt);
    }

    if (p.mainCd > 0) p.mainCd = Math.max(0, p.mainCd - dt);
    if (p.secCd > 0) p.secCd = Math.max(0, p.secCd - dt);
    if (p.dashCd > 0) p.dashCd = Math.max(0, p.dashCd - dt);
    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    if (p.overdriveTimer > 0) p.overdriveTimer = Math.max(0, p.overdriveTimer - dt);

    if (p.comboTimer > 0) {
        p.comboTimer -= dt;
        if (p.comboTimer <= 0) {
            p.comboCount = 0;
        }
    }

    const overdriveSpeedMult = p.overdriveTimer > 0 ? 1.30 : 1.0;
    const comboSpeedMult = 1 + Math.min(0.22, p.comboCount * 0.007);
    const predatorSpeedMult = p.predator ? (1 + Math.min(0.15, Math.floor(p.comboCount / 15) * 0.05)) : 1.0;
    const eventSpeedMult = (Game.waveEvent && Game.waveEvent.playerSpeedMult) ? Game.waveEvent.playerSpeedMult : 1.0;
    const effSpeed = p.speed * overdriveSpeedMult * comboSpeedMult * predatorSpeedMult * eventSpeedMult;

    if (p.dashActiveTimer > 0) {
        p.dashActiveTimer -= dt;
        p.x += p.dashVx * dt;
        p.y += p.dashVy * dt;

        Game.dashTrails.push({
            x: p.x,
            y: p.y,
            facingX: p.facingX,
            life: 0.22,
            isFlame: !!p.hasFlameDash
        });

        // Flame Dash milestone damage
        if (p.hasFlameDash) {
            for (let j = Game.enemies.length - 1; j >= 0; j--) {
                const e = Game.enemies[j];
                if (Math.hypot(p.x - e.x, p.y - e.y) < p.radius + e.radius + 12) {
                    const flameDmg = Math.max(1, Math.round(p.dmg * 0.5));
                    e.hp -= flameDmg;
                    e.hitFlash = 0.1;
                    Game.totalDamageDealt += flameDmg;
                    spawnParticles(e.x, e.y, '#f97316', 3);
                    spawnFloatingText(e.x, e.y - 14, `${flameDmg}`, '#f97316');
                    if (e.hp <= 0) killGhost(j);
                }
            }
        }
    } else {
        let mx = 0;
        let my = 0;
        if (Game.keysPressed[keybinds.up] || Game.keysPressed['ArrowUp']) my -= 1;
        if (Game.keysPressed[keybinds.down] || Game.keysPressed['ArrowDown']) my += 1;
        if (Game.keysPressed[keybinds.left] || Game.keysPressed['ArrowLeft']) mx -= 1;
        if (Game.keysPressed[keybinds.right] || Game.keysPressed['ArrowRight']) mx += 1;

        if (mx !== 0 || my !== 0) {
            const len = Math.hypot(mx, my);
            mx /= len;
            my /= len;
            p.facingX = mx;
            p.facingY = my;
            p.x += mx * effSpeed * dt;
            p.y += my * effSpeed * dt;

            p.walkAnimTimer += dt;
            if (p.walkAnimTimer > 0.14) {
                p.walkAnimTimer = 0;
                p.walkFrame = 1 - p.walkFrame;
            }
        } else {
            p.walkFrame = 0;
        }
    }

    const wallPad = 24;
    p.x = Math.max(wallPad, Math.min(ARENA_SIZE - wallPad, p.x));
    p.y = Math.max(wallPad, Math.min(ARENA_SIZE - wallPad, p.y));

    if (p.hp < p.maxHp && p.hpRegen > 0) {
        p.regenCarry += p.hpRegen * dt;
        if (p.regenCarry >= 1) {
            const healPts = Math.floor(p.regenCarry);
            p.regenCarry -= healPts;
            p.hp = Math.min(p.maxHp, p.hp + healPts);
        }
    }

    // Difficulty-Scaled Golden Soul Chest Spawns
    Game.chestSpawnTimer -= dt;
    if (Game.chestSpawnTimer <= 0) {
        Game.chestSpawnTimer = getNextChestSpawnDelay();
        if (Game.waveEvent && Game.waveEvent.chestRateMult) {
            Game.chestSpawnTimer *= Game.waveEvent.chestRateMult;
        }
        spawnSoulChest();
    }

    for (let cIdx = Game.chests.length - 1; cIdx >= 0; cIdx--) {
        const ch = Game.chests[cIdx];
        ch.bobPhase += dt * 4;
        if (Math.hypot(p.x - ch.x, p.y - ch.y) < p.radius + ch.radius) {
            openSoulChest(cIdx);
        }
    }

    const wep = WEAPONS[p.weaponId] || WEAPONS.blaster;
    const tierBonusPerLevel = wep.adaptiveTierBonus || 0.22;
    const tierDmgBonus = 1 + (p.weaponTier - 1) * (tierBonusPerLevel * diff.upgMult);
    const tierExtraShots = Math.floor((p.weaponTier - 1) / 2);

    // Combo Milestone Perks
    const comboDmgMult = p.comboCount >= 15 ? 1.08 : 1.0;
    const comboRateMult = p.comboCount >= 5 ? 1.05 : 1.0;
    const comboCritBonus = p.comboCount >= 30 ? 0.12 : 0.0;
    const isGodlike = p.comboCount >= 50;

    const effDmgBase = p.dmg * wep.dmgFactor * tierDmgBonus * comboDmgMult;
    const overdriveFireMult = p.overdriveTimer > 0 ? 1.38 : 1.0;
    const effFireRate = p.fireRate * wep.rateFactor * overdriveFireMult * comboRateMult;
    const effShots = p.projectiles + wep.bonusShots + tierExtraShots;
    const effPierce = p.pierce + wep.bonusPierce;
    const effBulletSpeed = wep.bulletSpeed * (p.bulletSpeedMult || 1.0);

    const targetGhost = findNearestGhost(p.x, p.y, p.range);
    if (targetGhost) {
        p.aimAngle = Math.atan2(targetGhost.y - p.y, targetGhost.x - p.x);
    } else {
        p.aimAngle = Math.atan2(p.facingY, p.facingX);
    }

    p.fireCooldown -= dt;
    if (targetGhost && p.fireCooldown <= 0) {
        p.fireCooldown = 1 / effFireRate;
        AudioEngine.sfxShoot();

        const spread = wep.spread;
        for (let s = 0; s < effShots; s++) {
            const offset = (s - (effShots - 1) / 2) * spread;
            const angle = p.aimAngle + offset;
            const isCrit = Math.random() < (p.critChance + comboCritBonus);
            const finalDmg = Math.max(1, Math.round(effDmgBase * (isCrit ? 2.0 : 1.0)));

            Game.bullets.push({
                x: p.x + Math.cos(angle) * 20,
                y: p.y + Math.sin(angle) * 20,
                vx: Math.cos(angle) * effBulletSpeed,
                vy: Math.sin(angle) * effBulletSpeed,
                radius: isCrit ? wep.bulletSize + 2 : wep.bulletSize,
                dmg: finalDmg,
                isCrit,
                isGodlike,
                armorBreak: wep.armorBreak || 0,
                pierce: effPierce,
                explosiveRadius: wep.explosiveRadius || 0,
                knockback: wep.knockback || 10,
                isSpinning: !!wep.isSpinning,
                spinAngle: 0,
                hitSet: new Set(),
                color: isCrit ? '#fde047' : (isGodlike ? '#c084fc' : wep.color),
                coreColor: '#ffffff',
                life: 1.25
            });
        }
    }

    for (let i = Game.spawnMarkers.length - 1; i >= 0; i--) {
        const m = Game.spawnMarkers[i];
        m.timer -= dt;
        if (m.timer <= 0) {
            spawnGhostFromMarker(m);
            Game.spawnMarkers.splice(i, 1);
        }
    }

    const lateSpawnSurge = Game.wave >= 14 ? 1 + (Game.wave - 13) * 0.06 : 1.0;
    const eventSpawnMult = (Game.waveEvent && Game.waveEvent.spawnMult) ? Game.waveEvent.spawnMult : 1.0;
    const spawnRatePerSec = (0.88 + Game.wave * 0.24) * lateSpawnSurge * diff.spawnMult * eventSpawnMult;
    const maxArenaEnemies = Game.wave >= 15 ? 110 : 85;
    Game.spawnAccumulator += spawnRatePerSec * dt;
    while (Game.spawnAccumulator >= 1) {
        Game.spawnAccumulator -= 1;
        if (Game.enemies.length + Game.spawnMarkers.length < maxArenaEnemies) {
            queueEnemySpawn();
        }
    }

    for (let i = Game.bullets.length - 1; i >= 0; i--) {
        const b = Game.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.isSpinning) b.spinAngle += dt * 18;
        b.life -= dt;

        if (
            b.life <= 0 ||
            b.x < 0 || b.x > ARENA_SIZE ||
            b.y < 0 || b.y > ARENA_SIZE
        ) {
            Game.bullets.splice(i, 1);
            continue;
        }

        let bulletConsumed = false;
        for (let cIdx = Game.chests.length - 1; cIdx >= 0; cIdx--) {
            const ch = Game.chests[cIdx];
            if (Math.hypot(b.x - ch.x, b.y - ch.y) < b.radius + ch.radius) {
                ch.hp -= b.dmg;
                spawnParticles(ch.x, ch.y, '#fde047', 4);
                if (ch.hp <= 0) {
                    openSoulChest(cIdx);
                }
                if (b.pierce <= 0) {
                    Game.bullets.splice(i, 1);
                    bulletConsumed = true;
                    break;
                } else {
                    b.pierce--;
                }
            }
        }
        if (bulletConsumed) continue;

        for (let j = Game.enemies.length - 1; j >= 0; j--) {
            const e = Game.enemies[j];
            if (b.hitSet.has(e)) continue;

            const dist = Math.hypot(b.x - e.x, b.y - e.y);
            if (dist < b.radius + e.radius) {
                b.hitSet.add(e);

                let hitDmg = b.dmg;
                if (e.armorBreakTimer > 0) {
                    hitDmg = Math.round(hitDmg * 1.15);
                }

                if (b.armorBreak) {
                    e.armorBreakTimer = Math.max(e.armorBreakTimer || 0, b.armorBreak);
                }

                e.hp -= hitDmg;
                e.hitFlash = 0.1;
                Game.totalDamageDealt += hitDmg;

                const bSpeed = Math.hypot(b.vx, b.vy) || 1;
                const kb = b.knockback || 10;
                e.x += (b.vx / bSpeed) * kb;
                e.y += (b.vy / bSpeed) * kb;

                // Godlike combo 50+ mini-explosion
                if (b.isGodlike && (!b.explosiveRadius || b.explosiveRadius === 0)) {
                    spawnParticles(b.x, b.y, '#c084fc', 6);
                    const miniAoE = Math.max(1, Math.round(hitDmg * 0.30));
                    for (let k = Game.enemies.length - 1; k >= 0; k--) {
                        const other = Game.enemies[k];
                        if (other !== e && Math.hypot(other.x - b.x, other.y - b.y) <= 28) {
                            other.hp -= miniAoE;
                            other.hitFlash = 0.1;
                            Game.totalDamageDealt += miniAoE;
                            if (other.hp <= 0) {
                                killGhost(k);
                                if (k < j) j--;
                            }
                        }
                    }
                }

                if (b.explosiveRadius > 0) {
                    spawnParticles(b.x, b.y, '#f97316', 12);
                    spawnParticles(b.x, b.y, '#fde047', 6);
                    addScreenShake(0.05, 1.4);
                    const aoeDmg = Math.max(1, Math.round(hitDmg * 0.65));
                    for (let k = Game.enemies.length - 1; k >= 0; k--) {
                        const other = Game.enemies[k];
                        if (other !== e && Math.hypot(other.x - b.x, other.y - b.y) <= b.explosiveRadius) {
                            other.hp -= aoeDmg;
                            other.hitFlash = 0.1;
                            Game.totalDamageDealt += aoeDmg;
                            spawnFloatingText(other.x, other.y - 14, `${aoeDmg}`, '#f97316');
                            if (other.hp <= 0) {
                                killGhost(k);
                                if (k < j) j--;
                            }
                        }
                    }
                } else {
                    spawnParticles(e.x, e.y, b.color, b.isGiant ? 10 : 4);
                }

                const hitTextColor = b.isGiant ? '#f97316' : (b.isCrit ? '#fde047' : (e.armorBreakTimer > 0 ? '#c084fc' : '#ffffff'));
                spawnFloatingText(
                    e.x,
                    e.y - 16,
                    b.isCrit ? `${hitDmg}!` : `${hitDmg}`,
                    hitTextColor
                );

                if (e.hp <= 0) {
                    killGhost(j);
                }

                if (b.pierce > 0) {
                    b.pierce--;
                } else {
                    Game.bullets.splice(i, 1);
                    break;
                }
            }
        }
    }

    for (let i = Game.enemies.length - 1; i >= 0; i--) {
        const e = Game.enemies[i];
        e.bobPhase += dt * 6;
        if (e.hitFlash > 0) e.hitFlash -= dt;
        if (e.armorBreakTimer > 0) e.armorBreakTimer = Math.max(0, e.armorBreakTimer - dt);

        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const dist = Math.hypot(dx, dy) || 1;

        // Solar Paladin Radiant Aura slow
        let curSpeed = e.speed;
        if (p.radiantAura && dist < 95) {
            curSpeed *= 0.85;
        }

        if (e.type === 'ranged') {
            const desiredDist = 250;
            if (dist > desiredDist + 30) {
                e.x += (dx / dist) * curSpeed * dt;
                e.y += (dy / dist) * curSpeed * dt;
            } else if (dist < desiredDist - 40) {
                e.x -= (dx / dist) * (curSpeed * 0.65) * dt;
                e.y -= (dy / dist) * (curSpeed * 0.65) * dt;
            }

            e.shootCd -= dt;
            if (e.shootCd <= 0 && dist < 480) {
                e.shootCd = Math.max(1.35, 2.6 - Game.wave * 0.04);
                const angle = Math.atan2(dy, dx);
                Game.enemyBullets.push({
                    x: e.x,
                    y: e.y,
                    vx: Math.cos(angle) * 175,
                    vy: Math.sin(angle) * 175,
                    radius: 7,
                    dmg: e.dmg,
                    attacker: e,
                    trail: [],
                    trailTimer: 0,
                    pulsePhase: Math.random() * Math.PI * 2
                });
            }
        } else if (e.type === 'sniper') {
            const desiredDist = 350;
            if (dist > desiredDist + 30) {
                e.x += (dx / dist) * curSpeed * dt;
                e.y += (dy / dist) * curSpeed * dt;
            } else if (dist < desiredDist - 50) {
                e.x -= (dx / dist) * (curSpeed * 0.8) * dt;
                e.y -= (dy / dist) * (curSpeed * 0.8) * dt;
            }

            e.shootCd -= dt;
            if (e.shootCd <= 0 && dist < 620) {
                e.shootCd = Math.max(1.8, 3.1 - Game.wave * 0.04);
                const angle = Math.atan2(dy, dx);
                Game.enemyBullets.push({
                    x: e.x,
                    y: e.y,
                    vx: Math.cos(angle) * 290,
                    vy: Math.sin(angle) * 290,
                    radius: 6,
                    dmg: Math.round(e.dmg * 1.25),
                    attacker: e,
                    trail: [],
                    trailTimer: 0,
                    pulsePhase: Math.random() * Math.PI * 2
                });
            }
        } else if (e.type === 'assassin') {
            e.teleportCd = (e.teleportCd || 5.0) - dt;
            if (e.teleportCd <= 0) {
                e.teleportCd = 4.5 + Math.random() * 2.5;
                spawnParticles(e.x, e.y, '#c084fc', 8);
                const flankAngle = Math.random() * Math.PI * 2;
                const flankDist = 170 + Math.random() * 60;
                e.x = Math.max(30, Math.min(ARENA_SIZE - 30, p.x + Math.cos(flankAngle) * flankDist));
                e.y = Math.max(30, Math.min(ARENA_SIZE - 30, p.y + Math.sin(flankAngle) * flankDist));
                spawnParticles(e.x, e.y, '#22d3ee', 8);
            }

            if (dist > 185) {
                e.stealth = true;
                e.stealthAlpha = Math.max(0.20, (e.stealthAlpha || 1.0) - dt * 2.5);
                e.x += (dx / dist) * curSpeed * dt;
                e.y += (dy / dist) * curSpeed * dt;
            } else {
                e.stealth = false;
                e.stealthAlpha = Math.min(1.0, (e.stealthAlpha || 0.20) + dt * 4.0);
                if (e.dashBurstTimer > 0) {
                    e.dashBurstTimer -= dt;
                    e.x += e.dashVx * dt;
                    e.y += e.dashVy * dt;
                } else {
                    e.x += (dx / dist) * curSpeed * dt;
                    e.y += (dy / dist) * curSpeed * dt;
                    e.specialCd -= dt;
                    if (e.specialCd <= 0) {
                        e.specialCd = 3.2;
                        e.dashBurstTimer = 0.24;
                        e.dashVx = (dx / dist) * (curSpeed * 2.6);
                        e.dashVy = (dy / dist) * (curSpeed * 2.6);
                        spawnParticles(e.x, e.y, '#22d3ee', 8);
                    }
                }
            }
        } else if (e.type === 'dasher') {
            if (e.dashBurstTimer > 0) {
                e.dashBurstTimer -= dt;
                e.x += e.dashVx * dt;
                e.y += e.dashVy * dt;
            } else {
                e.x += (dx / dist) * curSpeed * dt;
                e.y += (dy / dist) * curSpeed * dt;
                e.specialCd -= dt;
                if (e.specialCd <= 0 && dist < 320) {
                    e.specialCd = 2.6 + Math.random() * 0.8;
                    e.dashBurstTimer = 0.34;
                    e.dashVx = (dx / dist) * (curSpeed * 3.3);
                    e.dashVy = (dy / dist) * (curSpeed * 3.3);
                    spawnParticles(e.x, e.y, '#ef4444', 5);
                }
            }
        } else if (e.type === 'necromancer') {
            const desiredDist = 280;
            if (dist > desiredDist) {
                e.x += (dx / dist) * curSpeed * dt;
                e.y += (dy / dist) * curSpeed * dt;
            } else if (dist < 180) {
                e.x -= (dx / dist) * (curSpeed * 0.6) * dt;
                e.y -= (dy / dist) * (curSpeed * 0.6) * dt;
            }

            e.specialCd -= dt;
            if (e.specialCd <= 0) {
                e.specialCd = 4.6;
                if (Game.enemies.length < 95) {
                    spawnParticles(e.x, e.y, '#c084fc', 10);
                    queueEnemySpawn('swarm', Math.max(40, Math.min(ARENA_SIZE - 40, e.x - 28)), e.y);
                    queueEnemySpawn('swarm', Math.max(40, Math.min(ARENA_SIZE - 40, e.x + 28)), e.y);
                }
            }
        } else if (e.type === 'reaper') {
            if (e.dashBurstTimer > 0) {
                e.dashBurstTimer -= dt;
                e.x += e.dashVx * dt;
                e.y += e.dashVy * dt;
            } else {
                e.x += (dx / dist) * curSpeed * dt;
                e.y += (dy / dist) * curSpeed * dt;
                e.specialCd -= dt;
                if (e.specialCd <= 0 && dist < 440) {
                    e.specialCd = 3.0;
                    e.dashBurstTimer = 0.28;
                    e.dashVx = (dx / dist) * (curSpeed * 3.8);
                    e.dashVy = (dy / dist) * (curSpeed * 3.8);
                    spawnParticles(e.x, e.y, '#22d3ee', 10);
                }
            }

            e.shootCd -= dt;
            if (e.shootCd <= 0 && dist < 560) {
                e.shootCd = 2.3;
                const baseAng = Math.atan2(dy, dx);
                for (let s = -1; s <= 1; s++) {
                    const ang = baseAng + s * 0.22;
                    Game.enemyBullets.push({
                        x: e.x,
                        y: e.y,
                        vx: Math.cos(ang) * 235,
                        vy: Math.sin(ang) * 235,
                        radius: 8,
                        dmg: e.dmg,
                        attacker: e,
                        trail: [],
                        trailTimer: 0,
                        pulsePhase: s
                    });
                }
            }
        } else if (e.type === 'overlord') {
            e.x += (dx / dist) * curSpeed * dt;
            e.y += (dy / dist) * curSpeed * dt;

            e.shootCd -= dt;
            if (e.shootCd <= 0) {
                e.shootCd = 2.4;
                e.spiralAngle = (e.spiralAngle || 0) + 0.35;
                const count = 10;
                for (let k = 0; k < count; k++) {
                    const ang = e.spiralAngle + (Math.PI * 2 * k) / count;
                    Game.enemyBullets.push({
                        x: e.x,
                        y: e.y,
                        vx: Math.cos(ang) * 185,
                        vy: Math.sin(ang) * 185,
                        radius: 8,
                        dmg: e.dmg,
                        attacker: e,
                        trail: [],
                        trailTimer: 0,
                        pulsePhase: k
                    });
                }
            }

            e.specialCd -= dt;
            if (e.specialCd <= 0) {
                e.specialCd = 6.5;
                if (Game.enemies.length < 100) {
                    spawnParticles(e.x, e.y, '#ef4444', 14);
                    queueEnemySpawn('dasher', Math.max(50, Math.min(ARENA_SIZE - 50, e.x - 40)), e.y);
                    queueEnemySpawn('dasher', Math.max(50, Math.min(ARENA_SIZE - 50, e.x + 40)), e.y);
                }
            }
        } else {
            e.x += (dx / dist) * curSpeed * dt;
            e.y += (dy / dist) * curSpeed * dt;

            if (e.type === 'tank') {
                e.shootCd -= dt;
                if (e.shootCd <= 0) {
                    e.shootCd = 3.2;
                    for (let k = 0; k < 8; k++) {
                        const ang = (Math.PI * 2 * k) / 8;
                        Game.enemyBullets.push({
                            x: e.x,
                            y: e.y,
                            vx: Math.cos(ang) * 165,
                            vy: Math.sin(ang) * 165,
                            radius: 8,
                            dmg: e.dmg,
                            attacker: e,
                            trail: [],
                            trailTimer: 0,
                            pulsePhase: k
                        });
                    }
                }
            }
        }

        e.x = Math.max(20, Math.min(ARENA_SIZE - 20, e.x));
        e.y = Math.max(20, Math.min(ARENA_SIZE - 20, e.y));

        if (dist < p.radius + e.radius - 2 && p.invulnTimer <= 0) {
            damagePlayer(e.dmg, e);
            if (e.type === 'bomber' && Game.enemies[i] === e) {
                killGhost(i);
            }
        }
    }

    for (let i = Game.enemyBullets.length - 1; i >= 0; i--) {
        const eb = Game.enemyBullets[i];
        eb.pulsePhase = (eb.pulsePhase || 0) + dt * 10;
        eb.trailTimer = (eb.trailTimer || 0) + dt;
        if (eb.trailTimer >= 0.022) {
            eb.trailTimer = 0;
            if (!eb.trail) eb.trail = [];
            eb.trail.unshift({ x: eb.x, y: eb.y });
            if (eb.trail.length > 7) eb.trail.pop();
        }

        eb.x += eb.vx * dt;
        eb.y += eb.vy * dt;

        if (eb.x < 0 || eb.x > ARENA_SIZE || eb.y < 0 || eb.y > ARENA_SIZE) {
            Game.enemyBullets.splice(i, 1);
            continue;
        }

        const d = Math.hypot(eb.x - p.x, eb.y - p.y);
        if (d < eb.radius + p.radius - 2 && p.invulnTimer <= 0) {
            damagePlayer(eb.dmg, eb.attacker || null);
            Game.enemyBullets.splice(i, 1);
        }
    }

    for (let i = Game.heartDrops.length - 1; i >= 0; i--) {
        const hd = Game.heartDrops[i];
        const d = Math.hypot(p.x - hd.x, p.y - hd.y);
        if (d < p.pickupRadius * 0.85) {
            hd.x += ((p.x - hd.x) / (d || 1)) * 280 * dt;
            hd.y += ((p.y - hd.y) / (d || 1)) * 280 * dt;
        }
        if (d < p.radius + 12) {
            AudioEngine.sfxXp();
            const heal = hd.heal;
            p.hp = Math.min(p.maxHp, p.hp + heal);
            Game.heartsCollected = (Game.heartsCollected || 0) + 1;
            spawnFloatingText(p.x, p.y - 22, `+${heal} HP`, '#4ade80');
            Game.heartDrops.splice(i, 1);
        }
    }

    for (let i = Game.xpGems.length - 1; i >= 0; i--) {
        const g = Game.xpGems[i];
        const d = Math.hypot(p.x - g.x, p.y - g.y);
        if (d < p.pickupRadius) {
            const pullSpeed = 380;
            g.x += ((p.x - g.x) / (d || 1)) * pullSpeed * dt;
            g.y += ((p.y - g.y) / (d || 1)) * pullSpeed * dt;
        }
        if (d < p.radius + 10) {
            AudioEngine.sfxXp();
            const gained = g.val * p.xpGainMult * diff.xpMult;
            p.xp += gained;
            Game.xpGems.splice(i, 1);

            if (p.xp >= p.xpNext) {
                p.xp -= p.xpNext;
                p.level += 1;
                p.xpNext = Math.round(p.xpNext * 1.13 + 10);
                openLevelUpModal();
                return;
            }
        }
    }

    for (let i = Game.particles.length - 1; i >= 0; i--) {
        const pt = Game.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        if (pt.life <= 0) Game.particles.splice(i, 1);
    }

    for (let i = Game.floatingTexts.length - 1; i >= 0; i--) {
        const ft = Game.floatingTexts[i];
        ft.y -= 32 * dt;
        ft.life -= dt;
        if (ft.life <= 0) Game.floatingTexts.splice(i, 1);
    }

    for (let i = Game.dashTrails.length - 1; i >= 0; i--) {
        Game.dashTrails[i].life -= dt;
        if (Game.dashTrails[i].life <= 0) Game.dashTrails.splice(i, 1);
    }

    Game.waveTimer -= dt;
    if (Game.waveTimer <= 0) {
        completeCurrentWave();
    }

    updateHud();
}

function checkRunMilestones(p, kills) {
    if (!Game.milestonesReached) Game.milestonesReached = {};
    if (kills >= 50 && !Game.milestonesReached[50]) {
        Game.milestonesReached[50] = true;
        p.pickupRadius = Math.min(340, p.pickupRadius + 25);
        spawnFloatingText(p.x, p.y - 38, '🏆 50 KILLS: +25 MAGNET!', '#2dd4bf');
    }
    if (kills >= 150 && !Game.milestonesReached[150]) {
        Game.milestonesReached[150] = true;
        p.critChance = Math.min(0.85, p.critChance + 0.06);
        spawnFloatingText(p.x, p.y - 38, '🏆 150 KILLS: +6% CRIT!', '#fde047');
    }
    if (kills >= 300 && !Game.milestonesReached[300]) {
        Game.milestonesReached[300] = true;
        p.hasFlameDash = true;
        spawnFloatingText(p.x, p.y - 38, '🏆 300 KILLS: FLAME DASH!', '#f97316');
    }
    if (kills >= 500 && !Game.milestonesReached[500]) {
        Game.milestonesReached[500] = true;
        p.hasDoubleHarvest = true;
        spawnFloatingText(p.x, p.y - 38, '🏆 500 KILLS: 2x BOSS HEARTS!', '#4ade80');
    }
}

function killGhost(index) {
    const e = Game.enemies[index];
    if (!e) return;

    AudioEngine.sfxGhostDeath();
    const isElite = !!e.isElite;
    spawnParticles(e.x, e.y, isElite ? '#fde047' : (e.type === 'bomber' ? '#f97316' : '#ffffff'), isElite ? 18 : (e.type === 'bomber' ? 14 : 9));

    if (e.type === 'bomber') {
        for (let k = 0; k < 6; k++) {
            const ang = (Math.PI * 2 * k) / 6;
            Game.enemyBullets.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(ang) * 155,
                vy: Math.sin(ang) * 155,
                radius: 6,
                dmg: Math.max(4, Math.round(e.dmg * 0.75)),
                attacker: null,
                trail: [],
                trailTimer: 0,
                pulsePhase: k
            });
        }
    }

    Game.xpGems.push({
        x: e.x,
        y: e.y,
        val: e.xpVal
    });

    const diff = DIFFICULTIES[Game.difficulty];
    const isBoss = e.type === 'tank' || e.type === 'reaper' || e.type === 'overlord';
    const baseDropRate = (Game.difficulty === 'infernal' ? 0.065 : 0.045) + (Game.player ? (Game.player.deathHarvest || 0) : 0);

    if (isBoss || isElite || Math.random() < baseDropRate) {
        const heartCount = (isBoss && Game.player && Game.player.hasDoubleHarvest) ? 2 : 1;
        const healAmt = Math.max(5, Math.round((isBoss ? 22 : (isElite ? 18 : 10)) * diff.regenUpgMult));
        for (let h = 0; h < heartCount; h++) {
            Game.heartDrops.push({
                x: e.x + (Math.random() - 0.5) * 16,
                y: e.y + (Math.random() - 0.5) * 16,
                heal: healAmt
            });
        }
    }

    Game.enemies.splice(index, 1);
    Game.killsThisRun++;
    savedStats.totalKills++;
    if (Game.wave > savedStats.bestWave) {
        savedStats.bestWave = Game.wave;
    }
    saveStorage();

    const p = Game.player;
    if (p) {
        p.comboCount++;
        p.comboTimer = 3.2;
        Game.maxComboThisRun = Math.max(Game.maxComboThisRun || 0, p.comboCount);

        if (p.comboCount === 5) spawnFloatingText(p.x, p.y - 32, '⚡ 5x COMBO (+5% SPD)!', '#22d3ee');
        if (p.comboCount === 15) spawnFloatingText(p.x, p.y - 32, '🔥 15x COMBO (+8% DMG)!', '#fde047');
        if (p.comboCount === 30) spawnFloatingText(p.x, p.y - 32, '⚡ 30x RAMPAGE (+12% CRIT)!', '#f97316');
        if (p.comboCount === 50) spawnFloatingText(p.x, p.y - 32, '💀 50x GODLIKE EXPLOSIONS!', '#c084fc');

        checkRunMilestones(p, Game.killsThisRun);

        if (p.lifeStealOnKill > 0) {
            p.killHealProgress += p.lifeStealOnKill;
            if (p.killHealProgress >= 1) {
                const healAmt = Math.floor(p.killHealProgress);
                p.killHealProgress -= healAmt;
                p.hp = Math.min(p.maxHp, p.hp + healAmt);
            }
        }
    }
}

function damagePlayer(amount, attacker = null) {
    const p = Game.player;
    p.hp = Math.max(0, p.hp - amount);
    p.invulnTimer = 0.52;

    // Reworked combo: reduce by 40% instead of resetting to 0!
    p.comboCount = Math.floor(p.comboCount * 0.60);
    p.comboTimer = p.comboCount > 0 ? 2.0 : 0;

    AudioEngine.sfxPlayerHit();
    addScreenShake(0.20, 6);
    spawnParticles(p.x, p.y, '#ef4444', 12);
    spawnFloatingText(p.x, p.y - 20, `-${amount} HP`, '#ef4444');

    // BIO STALKER THORNS (30% reflected) & TOXIC CLOUD
    if (p.thorns > 0 && attacker) {
        const idx = Game.enemies.indexOf(attacker);
        if (idx !== -1) {
            const thornsDmg = Math.max(1, Math.round(amount * p.thorns));
            attacker.hp -= thornsDmg;
            attacker.hitFlash = 0.14;
            Game.totalDamageDealt += thornsDmg;
            spawnParticles(attacker.x, attacker.y, '#4ade80', 8);
            spawnFloatingText(attacker.x, attacker.y - 20, `-${thornsDmg} THORNS`, '#4ade80');

            if (p.toxicCloud) {
                spawnParticles(attacker.x, attacker.y, '#22c55e', 14);
                spawnFloatingText(attacker.x, attacker.y - 34, '☠ TOXIC CLOUD!', '#4ade80');
                const cloudDmg = Math.max(2, Math.round(amount * 0.20));
                for (let k = Game.enemies.length - 1; k >= 0; k--) {
                    const other = Game.enemies[k];
                    if (other !== attacker && Math.hypot(other.x - attacker.x, other.y - attacker.y) <= 80) {
                        other.hp -= cloudDmg;
                        other.hitFlash = 0.12;
                        Game.totalDamageDealt += cloudDmg;
                        if (other.hp <= 0) {
                            killGhost(k);
                        }
                    }
                }
            }

            if (attacker.hp <= 0) {
                const refreshedIdx = Game.enemies.indexOf(attacker);
                if (refreshedIdx !== -1) killGhost(refreshedIdx);
            }
        }
    }

    if (p.hp <= 0) {
        triggerGameOver();
    }
}

function completeCurrentWave() {
    for (const e of Game.enemies) {
        spawnParticles(e.x, e.y, '#cbd5e1', 5);
    }
    Game.enemies = [];
    Game.enemyBullets = [];
    Game.spawnMarkers = [];

    if (Game.wave >= savedStats.bestWave) {
        savedStats.bestWave = Game.wave;
        saveStorage();
    }

    if (Game.wave === Game.maxTargetWave && !Game.freeplay) {
        openVictoryModal();
        return;
    }

    startWave(Game.wave + 1);
}

window.findNearestGhost = findNearestGhost;
window.addScreenShake = addScreenShake;
window.spawnParticles = spawnParticles;
window.spawnFloatingText = spawnFloatingText;
window.updateGame = updateGame;
window.killGhost = killGhost;
window.damagePlayer = damagePlayer;
window.completeCurrentWave = completeCurrentWave;
