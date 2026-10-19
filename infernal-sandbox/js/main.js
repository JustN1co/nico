/* ==========================================================================
   14. EVENT LISTENERS & INPUT HANDLERS
========================================================================== */
function setupEventListeners() {
    const diffBtns = document.querySelectorAll('.diff-btn');
    diffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            AudioEngine.sfxClick();
            const d = btn.getAttribute('data-diff');
            Game.difficulty = d;

            diffBtns.forEach(b => {
                b.classList.remove('active-easy', 'active-medium', 'active-hard', 'active-infernal');
            });
            btn.classList.add(`active-${d}`);
            document.getElementById('diffDescription').textContent = DIFFICULTIES[d].desc;
        });
    });

    document.getElementById('btnPlay').addEventListener('click', startNewRun);
    document.getElementById('btnRerollUpgrades').addEventListener('click', triggerRerollUpgrades);

    document.getElementById('btnControls').addEventListener('click', () => {
        AudioEngine.sfxClick();
        Game.rebindTarget = null;
        renderKeybindModalList();
        document.getElementById('modalControls').classList.remove('hidden');
    });

    document.getElementById('btnVolume').addEventListener('click', () => {
        AudioEngine.sfxClick();
        renderVolumeModalUI();
        document.getElementById('modalVolume').classList.remove('hidden');
    });

    document.getElementById('btnCredits').addEventListener('click', () => {
        AudioEngine.sfxClick();
        document.getElementById('modalCredits').classList.remove('hidden');
    });

    document.getElementById('btnToggleCRT').addEventListener('click', () => {
        AudioEngine.sfxClick();
        savedStats.crtEnabled = !savedStats.crtEnabled;
        saveStorage();
        refreshMenuStats();
    });

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            AudioEngine.sfxClick();
            Game.rebindTarget = null;
            const target = btn.getAttribute('data-close-modal');
            document.getElementById(target).classList.add('hidden');
            updateHud();
        });
    });

    document.getElementById('btnResetKeybinds').addEventListener('click', () => {
        AudioEngine.sfxClick();
        keybinds = { ...DEFAULT_KEYBINDS };
        Game.rebindTarget = null;
        saveStorage();
        renderKeybindModalList();
        updateHud();
    });

    document.getElementById('btnToggleMuteModal').addEventListener('click', () => {
        AudioEngine.muted = !AudioEngine.muted;
        AudioEngine.sfxClick();
        saveStorage();
        renderVolumeModalUI();
    });

    document.getElementById('btnSfxDown').addEventListener('click', () => {
        AudioEngine.muted = false;
        AudioEngine.sfxVolume = Math.max(0, Math.round((AudioEngine.sfxVolume - 0.1) * 10) / 10);
        AudioEngine.sfxClick();
        saveStorage();
        renderVolumeModalUI();
    });

    document.getElementById('btnSfxUp').addEventListener('click', () => {
        AudioEngine.muted = false;
        AudioEngine.sfxVolume = Math.min(1, Math.round((AudioEngine.sfxVolume + 0.1) * 10) / 10);
        AudioEngine.sfxClick();
        saveStorage();
        renderVolumeModalUI();
    });

    document.getElementById('btnBgmDown').addEventListener('click', () => {
        AudioEngine.muted = false;
        AudioEngine.bgmVolume = Math.max(0, Math.round((AudioEngine.bgmVolume - 0.1) * 10) / 10);
        AudioEngine.playTone(261.6, 'triangle', 0.1, 0.25, null, 'bgm');
        saveStorage();
        renderVolumeModalUI();
    });

    document.getElementById('btnBgmUp').addEventListener('click', () => {
        AudioEngine.muted = false;
        AudioEngine.bgmVolume = Math.min(1, Math.round((AudioEngine.bgmVolume + 0.1) * 10) / 10);
        AudioEngine.playTone(329.6, 'triangle', 0.1, 0.25, null, 'bgm');
        saveStorage();
        renderVolumeModalUI();
    });

    document.getElementById('btnHudMute').addEventListener('click', () => {
        AudioEngine.muted = !AudioEngine.muted;
        AudioEngine.sfxClick();
        saveStorage();
        renderVolumeModalUI();
    });

    document.getElementById('btnHudPause').addEventListener('click', openInventoryModal);
    document.getElementById('btnOpenInventory').addEventListener('click', openInventoryModal);
    document.getElementById('btnCloseInventory').addEventListener('click', closeInventoryModal);
    document.getElementById('btnResumeFromInv').addEventListener('click', closeInventoryModal);

    document.getElementById('btnInvControls').addEventListener('click', () => {
        AudioEngine.sfxClick();
        renderKeybindModalList();
        document.getElementById('modalControls').classList.remove('hidden');
    });

    document.getElementById('btnInvVolume').addEventListener('click', () => {
        AudioEngine.sfxClick();
        renderVolumeModalUI();
        document.getElementById('modalVolume').classList.remove('hidden');
    });

    document.getElementById('btnAbandonRun').addEventListener('click', () => {
        AudioEngine.sfxClick();
        document.getElementById('lowHpVignette').classList.add('hidden');
        document.getElementById('modalInventory').classList.add('hidden');
        document.getElementById('gameHud').classList.add('hidden');
        document.getElementById('mainMenu').classList.remove('hidden');
        Game.state = 'MENU';
        refreshMenuStats();
    });

    document.getElementById('slotMainPower').addEventListener('click', triggerMainPower);
    document.getElementById('slotSecPower').addEventListener('click', triggerSecPower);
    document.getElementById('slotDash').addEventListener('click', triggerDash);

    document.getElementById('btnEnterFreeplay').addEventListener('click', () => {
        AudioEngine.sfxClick();
        document.getElementById('modalVictory').classList.add('hidden');
        Game.freeplay = true;
        Game.state = 'PLAYING';
        startWave(26);
    });

    document.getElementById('btnVictoryMenu').addEventListener('click', () => {
        AudioEngine.sfxClick();
        document.getElementById('modalVictory').classList.add('hidden');
        document.getElementById('gameHud').classList.add('hidden');
        document.getElementById('mainMenu').classList.remove('hidden');
        Game.state = 'MENU';
        refreshMenuStats();
    });

    document.getElementById('btnGameOverRetry').addEventListener('click', startNewRun);
    document.getElementById('btnGameOverMenu').addEventListener('click', () => {
        AudioEngine.sfxClick();
        document.getElementById('modalGameOver').classList.add('hidden');
        document.getElementById('gameHud').classList.add('hidden');
        document.getElementById('mainMenu').classList.remove('hidden');
        Game.state = 'MENU';
        refreshMenuStats();
    });

    window.addEventListener('keydown', (e) => {
        if (Game.rebindTarget) {
            e.preventDefault();
            if (e.code !== 'Escape') {
                keybinds[Game.rebindTarget] = e.code;
                saveStorage();
            }
            Game.rebindTarget = null;
            renderKeybindModalList();
            updateHud();
            return;
        }

        if (Game.state === 'LEVEL_UP') {
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
                e.preventDefault();
                if (e.repeat || Game.navKeyHeld[e.code]) return;
                Game.navKeyHeld[e.code] = true;
                AudioEngine.sfxClick();
                Game.selectedUpgradeIndex = (Game.selectedUpgradeIndex + 2) % 3;
                updateLevelUpCardHighlight();
                return;
            }
            if (e.code === 'KeyD' || e.code === 'ArrowRight') {
                e.preventDefault();
                if (e.repeat || Game.navKeyHeld[e.code]) return;
                Game.navKeyHeld[e.code] = true;
                AudioEngine.sfxClick();
                Game.selectedUpgradeIndex = (Game.selectedUpgradeIndex + 1) % 3;
                updateLevelUpCardHighlight();
                return;
            }
            if (e.code === 'KeyR') {
                e.preventDefault();
                if (e.repeat || Game.navKeyHeld[e.code]) return;
                Game.navKeyHeld[e.code] = true;
                triggerRerollUpgrades();
                return;
            }
            if (e.code === 'Enter' || e.code === 'Space') {
                e.preventDefault();
                if (e.repeat || Game.navKeyHeld[e.code] || Game.levelUpInputLockTimer > 0) return;
                Game.navKeyHeld[e.code] = true;
                confirmUpgradeChoice(Game.selectedUpgradeIndex);
                return;
            }
            return;
        }

        Game.keysPressed[e.code] = true;

        if (e.code === 'Escape' || e.code === 'KeyI' || e.code === 'Tab') {
            if (Game.state === 'PLAYING') {
                e.preventDefault();
                openInventoryModal();
            } else if (Game.state === 'PAUSED') {
                e.preventDefault();
                closeInventoryModal();
            }
            return;
        }

        if (Game.state === 'PLAYING') {
            if (e.code === keybinds.mainPower) {
                e.preventDefault();
                triggerMainPower();
            } else if (e.code === keybinds.secPower) {
                e.preventDefault();
                triggerSecPower();
            } else if (e.code === keybinds.dash) {
                e.preventDefault();
                triggerDash();
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        Game.keysPressed[e.code] = false;
        Game.navKeyHeld[e.code] = false;
    });

    window.addEventListener('blur', () => {
        Game.keysPressed = {};
        Game.navKeyHeld = {};
    });
}

/* ==========================================================================
   15. BOOTSTRAP & ANIMATION LOOP
========================================================================== */
let lastTime = performance.now();
function gameLoop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    updateGame(dt);
    renderGame();

    requestAnimationFrame(gameLoop);
}

window.onload = function() {
    loadStorage();
    initMenuGhosts();
    renderSkinSelector();
    drawStaticHudIcons();
    refreshMenuStats();
    renderVolumeModalUI();
    setupEventListeners();
    requestAnimationFrame(gameLoop);
};

window.setupEventListeners = setupEventListeners;
window.gameLoop = gameLoop;
