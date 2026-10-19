/* ==========================================================================
   12. 8-BIT PIXEL CANVAS RENDERER
========================================================================== */
function renderGame() {
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#09060e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (Game.state === 'MENU') {
        ctx.strokeStyle = '#191229';
        ctx.lineWidth = 2;
        const step = 48;
        for (let x = 0; x < canvas.width; x += step) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += step) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        for (const mg of Game.menuGhosts) {
            const sp = getSpriteCanvas(mg.sprite, mg.scale);
            if (sp) {
                ctx.globalAlpha = 0.28;
                ctx.drawImage(sp, Math.floor(mg.x), Math.floor(mg.y));
                ctx.globalAlpha = 1.0;
            }
        }
        return;
    }

    const p = Game.player;
    if (!p) return;

    let shakeX = 0;
    let shakeY = 0;
    if (Game.shakeTime > 0) {
        shakeX = (Math.random() - 0.5) * Game.shakeMagnitude * 2;
        shakeY = (Math.random() - 0.5) * Game.shakeMagnitude * 2;
    }

    const camX = Math.floor(canvas.width / 2 - p.x + shakeX);
    const camY = Math.floor(canvas.height / 2 - p.y + shakeY);

    ctx.save();
    ctx.translate(camX, camY);

    // 1. Draw 1x1 Square Arena Floor
    const isInfernal = Game.difficulty === 'infernal';
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, ARENA_SIZE, ARENA_SIZE);
    ctx.clip();

    ctx.fillStyle = isInfernal ? '#1c0d18' : '#181424';
    ctx.fillRect(0, 0, ARENA_SIZE, ARENA_SIZE);

    ctx.fillStyle = isInfernal ? '#24111f' : '#1e192d';
    for (let tx = 0; tx < ARENA_SIZE; tx += TILE_SIZE) {
        for (let ty = 0; ty < ARENA_SIZE; ty += TILE_SIZE) {
            if (((tx / TILE_SIZE) + (ty / TILE_SIZE)) % 2 === 0) {
                const w = Math.min(TILE_SIZE, ARENA_SIZE - tx);
                const h = Math.min(TILE_SIZE, ARENA_SIZE - ty);
                ctx.fillRect(tx, ty, w, h);
            }
        }
    }

    ctx.fillStyle = isInfernal ? '#3b1c32' : '#2b2440';
    for (const fd of Game.floorDetails) {
        ctx.fillRect(fd.x, fd.y, fd.size, fd.size);
        if (fd.type === 1) {
            ctx.fillRect(fd.x + fd.size, fd.y + fd.size, fd.size, fd.size);
        }
    }
    ctx.restore();

    // 1x1 Arena Hazard / Lava Border
    ctx.strokeStyle = isInfernal ? '#a855f7' : '#ef4444';
    ctx.lineWidth = 8;
    ctx.strokeRect(-4, -4, ARENA_SIZE + 8, ARENA_SIZE + 8);

    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, ARENA_SIZE - 8, ARENA_SIZE - 8);

    // 2. Draw Spawn Warning Markers
    for (const m of Game.spawnMarkers) {
        if (Math.floor(m.timer * 14) % 2 === 0) {
            const isBossMarker = m.type === 'tank' || m.type === 'reaper' || m.type === 'overlord';
            ctx.fillStyle = m.type === 'overlord' ? '#f97316' : (m.type === 'reaper' ? '#22d3ee' : (m.type === 'tank' ? '#fde047' : '#ef4444'));
            const sz = isBossMarker ? 18 : 10;
            ctx.fillRect(Math.floor(m.x - sz), Math.floor(m.y - 2), sz * 2, 4);
            ctx.fillRect(Math.floor(m.x - 2), Math.floor(m.y - sz), 4, sz * 2);
        }
    }

    // 2.5 Draw Golden Soul Chests
    const chestSp = getSpriteCanvas('soulChest', 3);
    for (const ch of Game.chests) {
        const bob = Math.sin(ch.bobPhase) * 2.5;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(Math.floor(ch.x - 14), Math.floor(ch.y + 12), 28, 6);
        if (chestSp) {
            ctx.drawImage(chestSp, Math.floor(ch.x - chestSp.width / 2), Math.floor(ch.y - chestSp.height / 2 + bob));
        }
    }

    // 3. Draw XP Gems & Soul Heart Pickups
    for (const g of Game.xpGems) {
        ctx.fillStyle = g.val >= 25 ? '#fde047' : '#22d3ee';
        ctx.fillRect(Math.floor(g.x - 5), Math.floor(g.y - 5), 10, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.floor(g.x - 2), Math.floor(g.y - 2), 4, 4);
    }

    for (const hd of Game.heartDrops) {
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(Math.floor(hd.x - 6), Math.floor(hd.y - 6), 12, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.floor(hd.x - 3), Math.floor(hd.y - 3), 4, 4);
    }

    // 4. Draw Dodge Afterimages
    const skinObj = PLAYER_SKINS[savedStats.selectedSkin] || PLAYER_SKINS.hellknight;
    for (const dt of Game.dashTrails) {
        const trailColor = dt.isFlame ? '#f97316' : skinObj.dashColor;
        const sp = getPlayerSpriteCanvas('playerIdle', 3, trailColor);
        if (sp) {
            ctx.globalAlpha = dt.life * 2;
            ctx.drawImage(sp, Math.floor(dt.x - sp.width / 2), Math.floor(dt.y - sp.height / 2));
            ctx.globalAlpha = 1.0;
        }
    }

    // 5. Draw Ghosts (All 11 Archetypes, Elites & Bosses)
    for (const e of Game.enemies) {
        const bobOffset = Math.sin(e.bobPhase) * 3;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(Math.floor(e.x - e.radius * 0.7), Math.floor(e.y + e.radius - 3), Math.floor(e.radius * 1.4), 6);

        // Elite Enemy golden halo
        if (e.isElite) {
            ctx.save();
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 2;
            const haloSize = Math.floor(e.radius * 2);
            ctx.strokeRect(Math.floor(e.x - haloSize / 2), Math.floor(e.y - haloSize / 2 + bobOffset), haloSize, haloSize);
            ctx.restore();
        }

        const sp = getSpriteCanvas(
            e.sprite,
            e.spriteScale,
            e.hitFlash > 0 ? '#ef4444' : (e.armorBreakTimer > 0 ? '#c084fc' : null)
        );

        if (sp) {
            ctx.save();
            ctx.translate(Math.floor(e.x), Math.floor(e.y + bobOffset));
            if (p.x < e.x) {
                ctx.scale(-1, 1);
            }
            if (e.stealth) {
                ctx.globalAlpha = Math.max(0.18, Math.min(1.0, e.stealthAlpha || 0.20));
            }
            ctx.drawImage(sp, -Math.floor(sp.width / 2), -Math.floor(sp.height / 2));
            ctx.restore();
        }

        const isMajor = e.type === 'tank' || e.type === 'necromancer' || e.type === 'reaper' || e.type === 'overlord' || e.isElite;
        if (e.hp < e.maxHp || isMajor) {
            const bw = (e.type === 'overlord' || e.type === 'reaper' || e.type === 'tank') ? 46 : (e.isElite ? 34 : 26);
            const bh = e.isElite ? 6 : 5;
            const bx = Math.floor(e.x - bw / 2);
            const by = Math.floor(e.y - e.radius - 12);
            ctx.fillStyle = '#000000';
            ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
            ctx.fillStyle = e.isElite ? '#fde047' : (e.type === 'overlord' ? '#f97316' : (e.type === 'reaper' ? '#22d3ee' : (e.type === 'necromancer' ? '#c084fc' : (e.type === 'assassin' ? '#38bdf8' : '#ef4444'))));
            ctx.fillRect(bx, by, Math.max(0, Math.floor((e.hp / e.maxHp) * bw)), bh);
        }
    }

    // 5.5 Draw Sniper Crosshair Telegraph
    for (const e of Game.enemies) {
        if (e.type === 'sniper' && e.shootCd <= 0.35 && typeof e.aimAngle === 'number') {
            const lineLen = 600;
            const alpha = Math.min(1.0, (0.35 - e.shootCd) / 0.35);
            ctx.save();
            ctx.globalAlpha = alpha * 0.72;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(Math.floor(e.x), Math.floor(e.y));
            ctx.lineTo(
                Math.floor(e.x + Math.cos(e.aimAngle) * lineLen),
                Math.floor(e.y + Math.sin(e.aimAngle) * lineLen)
            );
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }
    }

    // 6. Draw Player Character & Orbiting Auto-Weapon
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(Math.floor(p.x - 12), Math.floor(p.y + 13), 24, 6);

    if (p.overdriveTimer > 0) {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.strokeRect(Math.floor(p.x - 20), Math.floor(p.y - 20), 40, 40);
    }

    const pSpriteName = p.walkFrame === 1 ? 'playerWalk' : 'playerIdle';
    const pTint = p.invulnTimer > 0 && Math.floor(p.invulnTimer * 20) % 2 === 0 ? '#ffffff' : null;
    const pSprite = getPlayerSpriteCanvas(pSpriteName, 3, pTint);

    if (pSprite) {
        ctx.save();
        ctx.translate(Math.floor(p.x), Math.floor(p.y));
        if (p.facingX < 0) {
            ctx.scale(-1, 1);
        }
        ctx.drawImage(pSprite, -Math.floor(pSprite.width / 2), -Math.floor(pSprite.height / 2));
        ctx.restore();
    }

    const activeWep = WEAPONS[p.weaponId] || WEAPONS.blaster;
    const gunSprite = getSpriteCanvas(activeWep.sprite, 2);
    if (gunSprite) {
        const orbitDist = 22;
        const gx = p.x + Math.cos(p.aimAngle) * orbitDist;
        const gy = p.y + Math.sin(p.aimAngle) * orbitDist;
        ctx.save();
        ctx.translate(Math.floor(gx), Math.floor(gy));
        ctx.rotate(p.aimAngle);
        if (Math.cos(p.aimAngle) < 0) {
            ctx.scale(1, -1);
        }
        ctx.drawImage(gunSprite, -Math.floor(gunSprite.width / 2), -Math.floor(gunSprite.height / 2));
        ctx.restore();
    }

    // 7. Draw Player Projectiles
    for (const b of Game.bullets) {
        const r = b.radius;
        if (b.isSpinning) {
            ctx.save();
            ctx.translate(Math.floor(b.x), Math.floor(b.y));
            ctx.rotate(b.spinAngle || 0);
            ctx.fillStyle = b.color;
            ctx.fillRect(-r, -3, r * 2, 6);
            ctx.fillRect(-3, -r, 6, r * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-3, -3, 6, 6);
            ctx.restore();
        } else {
            ctx.fillStyle = b.color;
            ctx.fillRect(Math.floor(b.x - r), Math.floor(b.y - r), r * 2, r * 2);
            ctx.fillStyle = b.coreColor;
            const cr = Math.max(2, Math.floor(r * 0.55));
            ctx.fillRect(Math.floor(b.x - cr), Math.floor(b.y - cr), cr * 2, cr * 2);
        }
    }

    // 8. Draw Enemy Ectoplasm Projectiles
    for (const eb of Game.enemyBullets) {
        if (eb.trail && eb.trail.length > 0) {
            for (let t = eb.trail.length - 1; t >= 0; t--) {
                const pt = eb.trail[t];
                const ratio = 1 - (t + 1) / (eb.trail.length + 1);
                const ts = Math.max(3, Math.floor(eb.radius * 1.9 * ratio));
                ctx.globalAlpha = ratio * 0.55;
                ctx.fillStyle = t % 2 === 0 ? '#ff2a85' : '#c084fc';
                ctx.fillRect(Math.floor(pt.x - ts / 2), Math.floor(pt.y - ts / 2), ts, ts);
            }
            ctx.globalAlpha = 1.0;
        }

        const pulse = 1 + Math.sin(eb.pulsePhase || 0) * 0.22;
        const glowSize = Math.floor(eb.radius * 3.1 * pulse);

        ctx.save();
        ctx.shadowColor = '#ff2a85';
        ctx.shadowBlur = 14;

        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#ff2a85';
        ctx.fillRect(Math.floor(eb.x - glowSize / 2), Math.floor(eb.y - glowSize / 2), glowSize, glowSize);

        ctx.globalAlpha = 1.0;
        const midSize = eb.radius * 2 + 2;
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(Math.floor(eb.x - midSize / 2), Math.floor(eb.y - midSize / 2), midSize, midSize);

        ctx.fillStyle = '#fef08a';
        ctx.fillRect(Math.floor(eb.x - 4), Math.floor(eb.y - 4), 8, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.floor(eb.x - 2), Math.floor(eb.y - 2), 4, 4);

        ctx.restore();
    }

    // 9. Draw Pixel Particles
    for (const pt of Game.particles) {
        ctx.fillStyle = pt.color;
        ctx.fillRect(Math.floor(pt.x), Math.floor(pt.y), pt.size, pt.size);
    }

    // 10. Draw Floating Combat Numbers
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    for (const ft of Game.floatingTexts) {
        ctx.fillStyle = '#000000';
        ctx.fillText(ft.text, Math.floor(ft.x + 2), Math.floor(ft.y + 2));
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, Math.floor(ft.x), Math.floor(ft.y));
    }

    ctx.restore();

    // 11. Render 1x1 Minimap Radar
    renderMinimap();
}

function renderMinimap() {
    if (!Game.player) return;
    const w = minimapCanvas.width;
    const h = minimapCanvas.height;
    const scale = w / ARENA_SIZE;

    mctx.fillStyle = '#09060e';
    mctx.fillRect(0, 0, w, h);

    mctx.strokeStyle = '#ef4444';
    mctx.lineWidth = 2;
    mctx.strokeRect(1, 1, w - 2, h - 2);

    mctx.fillStyle = '#22d3ee';
    for (const g of Game.xpGems) {
        mctx.fillRect(Math.floor(g.x * scale), Math.floor(g.y * scale), 2, 2);
    }

    mctx.fillStyle = '#fde047';
    for (const ch of Game.chests) {
        mctx.fillRect(Math.floor(ch.x * scale - 2), Math.floor(ch.y * scale - 2), 4, 4);
    }

    for (const e of Game.enemies) {
        const isBoss = e.type === 'tank' || e.type === 'reaper' || e.type === 'overlord';
        if (e.isElite) {
            mctx.fillStyle = '#fde047';
            mctx.fillRect(Math.floor(e.x * scale - 2), Math.floor(e.y * scale - 2), 4, 4);
        } else {
            mctx.fillStyle = e.type === 'overlord' ? '#f97316' : (e.type === 'reaper' ? '#22d3ee' : (e.type === 'tank' ? '#fde047' : (e.type === 'assassin' ? '#c084fc' : '#ffffff')));
            const s = isBoss ? 4 : 2;
            mctx.fillRect(Math.floor(e.x * scale - s / 2), Math.floor(e.y * scale - s / 2), s, s);
        }
    }

    mctx.fillStyle = '#4ade80';
    mctx.fillRect(Math.floor(Game.player.x * scale - 2), Math.floor(Game.player.y * scale - 2), 5, 5);
}

window.renderGame = renderGame;
window.renderMinimap = renderMinimap;
