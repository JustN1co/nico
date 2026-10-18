/* ==========================================================================
   8. PLAYER ABILITIES (MAIN POWER [Q], SECONDARY [E], DODGE [SPACE])
========================================================================== */
function triggerMainPower() {
    const p = Game.player;
    if (!p || Game.state !== 'PLAYING' || p.mainCd > 0) return;

    p.mainCd = p.mainBaseCd * p.cdr;
    AudioEngine.sfxMainPower();
    addScreenShake(0.16, 3.2);

    const nearest = findNearestGhost(p.x, p.y, 9999);
    const baseAngle = nearest
        ? Math.atan2(nearest.y - p.y, nearest.x - p.x)
        : Math.atan2(p.facingY, p.facingX);

    const count = p.mainPowerCount;
    const spread = 0.18;
    const bulletDmg = Math.round(p.dmg * p.mainPowerMult);

    for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * spread;
        const angle = baseAngle + offset;

        Game.bullets.push({
            x: p.x + Math.cos(angle) * 20,
            y: p.y + Math.sin(angle) * 20,
            vx: Math.cos(angle) * 520,
            vy: Math.sin(angle) * 520,
            radius: 13,
            dmg: bulletDmg,
            pierce: 4,
            hitSet: new Set(),
            color: '#f97316',
            coreColor: '#fef08a',
            isGiant: true,
            life: 1.8
        });
    }

    spawnFloatingText(p.x, p.y - 30, `MAIN POWER! (x${p.mainPowerMult.toFixed(1)} DMG)`, '#fde047');
}

function triggerSecPower() {
    const p = Game.player;
    if (!p || Game.state !== 'PLAYING' || p.secCd > 0) return;

    p.secCd = p.secBaseCd * p.cdr;
    AudioEngine.sfxSecPower();
    addScreenShake(0.10, 2.0);

    const count = p.secPowerCount;
    const orbDmg = Math.round(p.dmg * p.secPowerMult);
    const startAngle = p.aimAngle;

    for (let i = 0; i < count; i++) {
        const angle = startAngle + (Math.PI * 2 * i) / count;
        Game.bullets.push({
            x: p.x + Math.cos(angle) * 16,
            y: p.y + Math.sin(angle) * 16,
            vx: Math.cos(angle) * 340,
            vy: Math.sin(angle) * 340,
            radius: 9,
            dmg: orbDmg,
            pierce: 2,
            hitSet: new Set(),
            color: '#22d3ee',
            coreColor: '#ffffff',
            isOrb: true,
            life: 2.2
        });
    }

    spawnFloatingText(p.x, p.y - 26, `SOUL NOVA! (${count} ORBS)`, '#22d3ee');
}

function triggerDash() {
    const p = Game.player;
    if (!p || Game.state !== 'PLAYING' || p.dashCd > 0) return;

    p.dashCd = p.dashBaseCd * p.cdr;
    p.dashActiveTimer = 0.20;
    p.invulnTimer = 0.30;

    const mag = Math.hypot(p.facingX, p.facingY) || 1;
    p.dashVx = (p.facingX / mag) * 680;
    p.dashVy = (p.facingY / mag) * 680;

    const skinObj = PLAYER_SKINS[savedStats.selectedSkin] || PLAYER_SKINS.hellknight;
    AudioEngine.sfxDash();
    spawnParticles(p.x, p.y, skinObj.dashColor, 12);
    spawnFloatingText(p.x, p.y - 22, 'DODGE!', skinObj.dashColor);
}

window.triggerMainPower = triggerMainPower;
window.triggerSecPower = triggerSecPower;
window.triggerDash = triggerDash;
