// src/managers.js

let audioCtx;

export const SoundManager = {
    init() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    },
    sounds: {
        charge: new Audio('spear charging.mp3'),
        swing: new Audio('swing.mp3'),
        baseball: new Audio('baseball.mp3'),
        stonecutter0: new Audio('chainsaw.mp3'),
        stonecutter1: new Audio('chainsaw1.mp3'),
        stonecutter2: new Audio('chainsaw2.mp3'),
        crush: new Audio('crush.mp3'),
        pistonOpen: new Audio('piston open.mp3'),
        pistonClose: new Audio('piston close.mp3'),
        creeper1: new Audio('creeper1.mp3'),
        creeper2: new Audio('creeper2.mp3'),
        firework1: new Audio('firework1.mp3'), 
        firework2: new Audio('firework2.mp3'), 
        firework3: new Audio('firework3.mp3'),
        rail1: new Audio('rail1.mp3'),
        rail2: new Audio('rail2.mp3'),
        rail3: new Audio('rail3.mp3'),
        minecart: new Audio('minecart.mp3'),
        minecart2: new Audio('minecart2.mp3'),
        through: new Audio('through2.mp3'),
        break: new Audio('break2.mp3'),
        freeze: new Audio('freeze.mp3'),
        drive: new Audio('drive.mp3'),
        goatHorn: new Audio('goat horn1.mp3'),
        goatScream1: new Audio('goat scream1.mp3'),
        goatScream2: new Audio('goat scream2.mp3'),
        goatScream3: new Audio('goat scream3.mp3'),
        goatScream4: new Audio('goat scream4.mp3'),
        goatFootstep: new Audio('goat footstep.mp3'),
        shear: new Audio('shear.mp3'),
        
        wardenCharge: new Audio('warden charge.mp3'),
        wardenBoom: new Audio('warden boom.mp3'),
        wardenRumble: new Audio('warden rumble.mp3'),
        wardenAttack: new Audio('warden attack.mp3'),
        maceHit: new Audio('mace1.mp3'),

        mining: new Audio('mining.mp3'),
        pickaxeUp: new Audio('pickaxe up.mp3'),
        breakBone: new Audio('break bone.mp3'), 
        hit1: new Audio('hit1.mp3'), 
        
        angler: new Audio('angler.mp3'),
        pickaxeHit: new Audio('pickaxe hit.mp3'),
        netheritePickaxe: new Audio('Netherite Pickaxe.mp3'),
        
        dragonFlap: new Audio('ender dragon flap.mp3'),
        dragonSwoop: new Audio('ender dragon idle.mp3'),
        dragonDot: new Audio('ender dragon dot.mp3'),
        dragonDeath: new Audio('ender dragon death.mp3'),
        dragonSpeed: new Audio('ender dragon speed.mp3'),
        dragonBreath: new Audio('ender dragon breath.mp3'),
        
        electric1: new Audio('electric1.mp3'),
        electric2: new Audio('electric2.mp3'),
        electric3: new Audio('electric3.mp3'),
        thunder: new Audio('thunder.mp3'),
        electric4: new Audio('electric4.mp3'),
        electric5: new Audio('electric5.mp3'), 

        trident1: new Audio('trident1.mp3'),
        trident2: new Audio('trident2.mp3'),
        trident3: new Audio('trident3.mp3'),
        trident4: new Audio('trident4.mp3'),
        tridentCharge: new Audio('trident charging.mp3'),

        snowball1: new Audio('snowball.wav'),
        snowball2: new Audio('snowball2.wav'),
        snowball3: new Audio('snowball3.wav'),
        'snowball wind': new Audio('snowball wind.wav'),
        
        'wither spawn': new Audio('wither spawn.mp3'),
        'wither shoot': new Audio('wither shoot.mp3'),
        'wither shoot2': new Audio('wither shoot2.mp3'),
        'explosion1': new Audio('explosion1.mp3'),
        'explosion2': new Audio('explosion2.mp3'),
        'explosion3': new Audio('explosion3.mp3'),

        'bow shoot': new Audio('bow shoot.mp3'),
        'hit': new Audio('hit.mp3'),

        // ★ 추가: 대시 전용 사운드 에셋 추가 등록
        'dash': new Audio('dash.mp3')
    },
    
    fadeIntervals: {},

    play(name, rate = 1.0) {
        if(this.sounds[name]) {
            clearInterval(this.fadeIntervals[name]); 
            this.sounds[name].currentTime = 0;
            this.sounds[name].volume = 0.7;
            this.sounds[name].playbackRate = rate; 
            this.sounds[name].play().catch(e => {});
        } else { this.playSynth(name); }
    },

    loopPlay(name, vol = 1.0) {
        if(this.sounds[name]) {
            clearInterval(this.fadeIntervals[name]); 
            this.sounds[name].loop = true;
            this.sounds[name].volume = vol;
            this.sounds[name].currentTime = 0; 
            this.sounds[name].play().catch(e => {});
        }
    },

    loopPlayWithoutReset(name, vol = 1.0) {
        if(this.sounds[name]) {
            clearInterval(this.fadeIntervals[name]); 
            this.sounds[name].loop = true;
            this.sounds[name].volume = vol;
            if (this.sounds[name].paused) {
                this.sounds[name].play().catch(e => {});
            }
        }
    },

    fadeOut(name) {
        if(!this.sounds[name]) return;
        let audio = this.sounds[name];
        clearInterval(this.fadeIntervals[name]);
        this.fadeIntervals[name] = setInterval(() => {
            if(audio.volume > 0.05) audio.volume -= 0.05;
            else { audio.pause(); audio.volume = 1.0; clearInterval(this.fadeIntervals[name]); }
        }, 50);
    },

    fadeVolume(name, targetVol, durationMs) {
        if (!this.sounds[name]) return;
        let audio = this.sounds[name];
        clearInterval(this.fadeIntervals[name]);
        
        let startVol = audio.volume;
        let diff = targetVol - startVol;
        let steps = 30; 
        let stepTime = durationMs / steps; 
        let currentStep = 0;
        
        if (targetVol > 0 && audio.paused) audio.play().catch(e => {});
        
        this.fadeIntervals[name] = setInterval(() => {
            currentStep++; 
            let v = startVol + diff * (currentStep / steps);
            audio.volume = Math.max(0, Math.min(1, v));
            if (currentStep >= steps) {
                clearInterval(this.fadeIntervals[name]);
                if (targetVol === 0) audio.pause();
            }
        }, stepTime);
    },

    setVolume(name, vol) {
        if (this.sounds[name]) this.sounds[name].volume = Math.max(0, Math.min(1, vol));
    },

    stop(name) {
        if(this.sounds[name]) {
            clearInterval(this.fadeIntervals[name]);
            this.sounds[name].pause();
            this.sounds[name].currentTime = 0;
        }
    },

    playSynth(type) {
        if (!audioCtx) return;
        let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain();
        let t = audioCtx.currentTime;
        
        if (type === 'hit') { 
            osc.type = "sawtooth"; osc.frequency.setValueAtTime(250, t); osc.frequency.exponentialRampToValueAtTime(50, t + 0.1); 
            gain.gain.setValueAtTime(0.2, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1); 
        } else if (type === 'bounce') { 
            osc.type = "sine"; osc.frequency.setValueAtTime(200, t); osc.frequency.exponentialRampToValueAtTime(80, t + 0.1); 
            gain.gain.setValueAtTime(0.05, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1); 
        } else if (type === 'crash' || type === 'knockback') { 
            osc.type = "square"; osc.frequency.setValueAtTime(100, t); osc.frequency.exponentialRampToValueAtTime(10, t + 0.4); 
            gain.gain.setValueAtTime(0.4, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4); 
        } else if (type === 'heavyHit') { 
            osc.type = "sawtooth"; osc.frequency.setValueAtTime(120, t); osc.frequency.exponentialRampToValueAtTime(10, t + 0.4); 
            gain.gain.setValueAtTime(0.5, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4); 
        } else { return; }
        
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(t + 0.5);
    }
};

export const EffectManager = {
    particles: [],
    hitStopTimer: 0, 
    flashAlpha: 0, 
    frameCount: 0, 

    triggerHitStop(frames) {
        this.hitStopTimer = Math.max(this.hitStopTimer, frames);
    },
    triggerFlash() {
        this.flashAlpha = 1.0;
    },
    createHitEffect(x, y, colorCode, sizeMult = 1) {
        for (let i = 0; i < 20 * sizeMult; i++) {
            this.particles.push({
                x: x, y: y,
                dx: (Math.random() - 0.5) * 13.75 * sizeMult, dy: (Math.random() - 0.5) * 13.75 * sizeMult,
                life: 17.5 + Math.random() * 13.1 * sizeMult, size: (Math.random() * 4 + 2) * sizeMult,
                color: colorCode || "#FFF",
                isSquare: false
            });
        }
    },
    createHighQualityExplosion(x, y) {
        const colors = ['#FF0000', '#FF7700', '#FFFF00', '#FFFFFF', '#AAAAAA', '#FF00FF', '#00FFFF'];
        for(let i=0; i<120; i++) {
            let angle = Math.random() * Math.PI * 2;
            let speed = Math.random() * 20.6 + 2.3; 
            let life = 34.9 + Math.random() * 26.2;
            this.particles.push({
                x: x, y: y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed,
                life: life, maxLife: life, size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                isSquare: true, friction: 0.908 
            });
        }
        this.triggerFlash();
    },

    createSmokeExplosion(x, y, sizeMult = 1) {
        const colors = ['#444444', '#666666', '#888888', '#AAAAAA', '#CCCCCC'];
        for(let i=0; i<40 * sizeMult; i++) {
            let angle = Math.random() * Math.PI * 2;
            let speed = Math.random() * 12.6 * sizeMult + 2; 
            let life = 25 + Math.random() * 25;
            this.particles.push({
                x: x, y: y, 
                dx: Math.cos(angle) * speed, 
                dy: Math.sin(angle) * speed,
                life: life, 
                maxLife: life, 
                size: (Math.random() * 12 + 8) * sizeMult,
                color: colors[Math.floor(Math.random() * colors.length)],
                isSquare: true, 
                friction: 0.85 
            });
        }
        this.triggerFlash();
    },

    updateAndDraw(ctx) {
        this.frameCount++;
        for (let i = this.particles.length - 1; i >= 0; i--) { 
            let p = this.particles[i]; 
            p.x += p.dx; p.y += p.dy; 
            
            if (p.friction) { p.dx *= p.friction; p.dy *= p.friction; } 
            
            p.life--; 
            if (p.life <= 0) { this.particles.splice(i, 1); continue; }
            
            ctx.fillStyle = p.color;
            ctx.beginPath(); 
            let renderSize = Math.max(0, p.size * (p.life / (p.maxLife || 26.2)));
            
            if (p.isSquare) {
                ctx.fillRect(p.x - renderSize/2, p.y - renderSize/2, renderSize, renderSize);
            } else {
                ctx.arc(p.x, p.y, renderSize, 0, Math.PI*2);
                ctx.fill(); 
            }
            ctx.closePath();
        }

        if (this.flashAlpha > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
            ctx.fillRect(0, 0, 5000, 5000); 
            ctx.restore();
            this.flashAlpha *= 0.83;
            if (this.flashAlpha < 0.01) this.flashAlpha = 0;
        }
    }
};

export const CollisionManager = {
    cooldown: 0,
    handleBodyCollisions(players, canvas) {
        if (this.cooldown > 0) this.cooldown--;

        for (let i = 0; i < players.length; i++) {
            if (players[i].scHitCooldown > 0) players[i].scHitCooldown--;
        }

        let isFixedBoss = (p) => p.weapon && (
            (p.weapon.name === 'WITHER' && (p.weapon.witherState === 'spawning' || p.weapon.burstCount > 0)) ||
            (p.weapon.name === 'WARDEN' && (p.weapon.wardenState === 'charging' || p.weapon.wardenState === 'firing')) ||
            (p.weapon.name === 'ENDER_DRAGON' && (p.weapon.dragonState === 'charging' || p.weapon.dragonState === 'swooping' || p.weapon.dragonState === 'breathing')) ||
            (p.weapon.name === 'SNOWBALL' && p.weapon.state === 'rolling')
        );

        let handleBoatKnockback = (attacker, victim) => {
            if (attacker.weapon && attacker.weapon.name === 'BOAT' && attacker.weapon.boatBoostTimer > 0 && !victim.isBoatKnocked && victim.knockbackBounces <= 0) {
                
                if (victim.weapon && victim.weapon.name === 'MINECART' && victim.weapon.isLayingRail) {
                    victim.weapon.isLayingRail = false;
                    victim.weapon.wallBounceCount = 0;
                    victim.weapon.railVertices = [];
                    victim.weapon.railLockTimer = 0;
                }

                if (victim.freezeTimer > 0) {
                    victim.freezeTimer = 0;
                    victim.freezeAccum = 0;
                    victim.wasFrozen = true; 
                    EffectManager.createHitEffect(victim.x, victim.y, "#88CCFF", 3.0); 
                    SoundManager.play('break'); 
                }

                victim.isBoatKnocked = true;
                victim.boatBouncePhase = 0;
                victim.wallDamageCooldown = 0;
                
                let moveAngle = Math.atan2(attacker.dy, attacker.dx);
                victim.dx = Math.cos(moveAngle) * 40.1; 
                victim.dy = Math.sin(moveAngle) * 40.1;
                
                victim.lastAttacker = attacker;
                victim.hp -= 8; 
                EffectManager.createHitEffect(victim.x, victim.y, "#FFFFFF", 4.0);
                
                EffectManager.triggerHitStop(22); 
                
                SoundManager.play('crush'); 
                this.cooldown = 26; 
                return true;
            }
            return false;
        };

        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                let p1 = players[i]; let p2 = players[j];

                if (p1.isDead || p2.isDead) continue;
                if ((p1.weapon && p1.weapon.hideBase) || (p2.weapon && p2.weapon.hideBase)) continue;
                
                let isP1Ghost = p1.knockbackBounces > 0 || (p1.isBoatKnocked && p1.boatBouncePhase < 5);
                let isP2Ghost = p2.knockbackBounces > 0 || (p2.isBoatKnocked && p2.boatBouncePhase < 5);
                if (isP1Ghost || isP2Ghost) continue;

                let dx = p2.x - p1.x; let dy = p2.y - p1.y; let distance = Math.hypot(dx, dy);
                if (distance === 0) { dx = 1; dy = 0; distance = 1; }

                if (distance < p1.radius + p2.radius) {
                    let overlap = (p1.radius + p2.radius) - distance;
                    let nx = dx / distance; let ny = dy / distance; 
                    overlap = Math.min(overlap, 11.5);
                    
                    if (p1.team !== p2.team) {
                        if (handleBoatKnockback(p1, p2)) continue;
                        if (handleBoatKnockback(p2, p1)) continue;
                    }

                    let isP1Dashing = p1.weapon && p1.weapon.name === 'STONECUTTER' && (p1.weapon.isSawActive || p1.weapon.isWallRiding || p1.weapon.isWallJumping);
                    let isP2Dashing = p2.weapon && p2.weapon.name === 'STONECUTTER' && (p2.weapon.isSawActive || p2.weapon.isWallRiding || p2.weapon.isWallJumping);
                    let isP1Revving = p1.weapon && p1.weapon.name === 'STONECUTTER' && p1.weapon.isRevving;
                    let isP2Revving = p2.weapon && p2.weapon.name === 'STONECUTTER' && p2.weapon.isRevving;
                    
                    let isP1Flying = p1.weapon && p1.weapon.name === 'FIREWORKS' && p1.weapon.fireworkState === 'flying';
                    let isP2Flying = p2.weapon && p2.weapon.name === 'FIREWORKS' && p2.weapon.fireworkState === 'flying';

                    let m1 = p1.freezeTimer > 0 ? 0.1 : 1;
                    let m2 = p2.freezeTimer > 0 ? 0.1 : 1;
                    let p1Ratio = 0.5; let p2Ratio = 0.5;

                    let p1Fixed = isFixedBoss(p1);
                    let p2Fixed = isFixedBoss(p2);

                    if (p1Fixed && !p2Fixed) { p1Ratio = 0; p2Ratio = 1; }
                    else if (!p1Fixed && p2Fixed) { p1Ratio = 1; p2Ratio = 0; }
                    else if ((isP1Dashing || isP1Flying) && !isP2Dashing && !isP2Flying) { p1Ratio = 0; p2Ratio = 1; }
                    else if (!isP1Dashing && !isP1Flying && (isP2Dashing || isP2Flying)) { p1Ratio = 1; p2Ratio = 0; }
                    else if (isP1Revving && !isP2Revving && !isP2Dashing && !isP2Flying) { p1Ratio = 0; p2Ratio = 1; }
                    else if (!isP1Revving && !isP1Dashing && !isP1Flying && isP2Revving) { p1Ratio = 1; p2Ratio = 0; }
                    else {
                        let totalM = m1 + m2;
                        p1Ratio = m2 / totalM;
                        p2Ratio = m1 / totalM;
                    }

                    p1.x -= nx * overlap * p1Ratio; p1.y -= ny * overlap * p1Ratio;
                    p2.x += nx * overlap * p2Ratio; p2.y += ny * overlap * p2Ratio;

                    let dvx = p1.dx - p2.dx; let dvy = p1.dy - p2.dy;
                    let velAlongNormal = dvx * nx + dvy * ny;
                    
                    let forceCollision = false;
                    if (p1.team !== p2.team) {
                        let isP1Stone = (isP1Dashing || isP1Revving);
                        let isP2Stone = (isP2Dashing || isP2Revving);
                        if ((isP1Stone && p2Fixed) || (isP2Stone && p1Fixed)) {
                            forceCollision = true;
                        }
                    }
                    
                    if ((velAlongNormal > 0 || forceCollision) && this.cooldown === 0) {
                        
                        if (p1.team !== p2.team) {
                            if (p1.weapon && p1.weapon.name === 'MINECART' && p1.weapon.isLayingRail) {
                                p1.weapon.isLayingRail = false; p1.weapon.wallBounceCount = 0; p1.weapon.railVertices = []; p1.weapon.railLockTimer = 0;
                            }
                            if (p2.weapon && p2.weapon.name === 'MINECART' && p2.weapon.isLayingRail) {
                                p2.weapon.isLayingRail = false; p2.weapon.wallBounceCount = 0; p2.weapon.railVertices = []; p2.weapon.railLockTimer = 0;
                            }
                        }

                        if (isP1Flying || isP2Flying) {
                            if (p1.team === p2.team) {
                                if (isP1Flying) {
                                    let dot1 = p1.dx * nx + p1.dy * ny;
                                    if (dot1 > 0) { p1.dx -= 2 * dot1 * nx; p1.dy -= 2 * dot1 * ny; }
                                    p2.dx += nx * 5.7; p2.dy += ny * 5.7;
                                }
                                if (isP2Flying) {
                                    let dot2 = p2.dx * nx + p2.dy * ny;
                                    if (dot2 < 0) { p2.dx -= 2 * dot2 * nx; p2.dy -= 2 * dot2 * ny; }
                                    p1.dx -= nx * 5.7; p1.dy -= ny * 5.7; 
                                }
                                
                                EffectManager.createHitEffect(p1.x + dx/2, p1.y + dy/2, "#FFFFFF", 1.0);
                                SoundManager.playSynth('bounce');
                                this.cooldown = 9;
                            } else {
                                if ((isP1Flying && isP2Flying) || (isP1Flying && isP2Dashing) || (isP1Dashing && isP2Flying)) {
                                    EffectManager.createHighQualityExplosion(p1.x + dx/2, p1.y + dy/2);
                                    SoundManager.playSynth('heavyHit'); SoundManager.play('firework3'); SoundManager.play('crush');
                                    EffectManager.triggerHitStop(52);

                                    if (isP1Flying) { p1.weapon.fireworkState = 'cooldown'; p1.weapon.fireworkTimer = 157; }
                                    if (isP2Flying) { p2.weapon.fireworkState = 'cooldown'; p2.weapon.fireworkTimer = 157; }
                                    if (isP1Dashing) { p1.weapon.isSawActive = false; p1.weapon.isWallRiding = false; p1.weapon.attachCooldown = 157; }
                                    if (isP2Dashing) { p2.weapon.isSawActive = false; p2.weapon.isWallRiding = false; p2.weapon.attachCooldown = 157; }

                                    p1.knockbackBounces = 7; p2.knockbackBounces = 7;
                                    let cAng1 = Math.atan2((canvas.height/2) - p1.y, (canvas.width/2) - p1.x);
                                    let cAng2 = Math.atan2((canvas.height/2) - p2.y, (canvas.width/2) - p2.x);
                                    p1.dx = -nx * 57.3 + Math.cos(cAng1)*11.5; p1.dy = -ny * 57.3 + Math.sin(cAng1)*11.5;
                                    p2.dx = nx * 57.3 + Math.cos(cAng2)*11.5; p2.dy = ny * 57.3 + Math.sin(cAng2)*11.5;
                                    
                                    p1.lastAttacker = p2; p1.hp -= 30;
                                    p2.lastAttacker = p1; p2.hp -= 30;
                                    this.cooldown = 13;
                                } else {
                                    let attacker = isP1Flying ? p1 : p2;
                                    let victim = isP1Flying ? p2 : p1;
                                    let atkDirX = isP1Flying ? nx : -nx; let atkDirY = isP1Flying ? ny : -ny;

                                    EffectManager.createHighQualityExplosion(victim.x, victim.y);
                                    SoundManager.play('firework3'); 
                                    EffectManager.triggerHitStop(39);

                                    attacker.weapon.fireworkState = 'cooldown'; attacker.weapon.fireworkTimer = 157;
                                    attacker.dx = -atkDirX * 17.2; attacker.dy = -atkDirY * 17.2;

                                    victim.knockbackBounces = 7;
                                    let cAng = Math.atan2((canvas.height/2) - victim.y, (canvas.width/2) - victim.x);
                                    victim.dx = atkDirX * 63 + Math.cos(cAng) * 11.5; 
                                    victim.dy = atkDirY * 63 + Math.sin(cAng) * 11.5;
                                    
                                    victim.lastAttacker = attacker;
                                    victim.hp -= 30; 
                                    this.cooldown = 13;
                                }
                            }
                        }
                        else if (isP1Dashing || isP2Dashing) {
                            if (p1.team === p2.team) {
                                if (isP1Dashing) {
                                    let dot1 = p1.dx * nx + p1.dy * ny;
                                    if (dot1 > 0) { p1.dx -= 2 * dot1 * nx; p1.dy -= 2 * dot1 * ny; }
                                    p2.dx += nx * 5.7; p2.dy += ny * 5.7;
                                }
                                if (isP2Dashing) {
                                    let dot2 = p2.dx * nx + p2.dy * ny;
                                    if (dot2 < 0) { p2.dx -= 2 * dot2 * nx; p2.dy -= 2 * dot2 * ny; }
                                    p1.dx -= nx * 5.7; p1.dy -= ny * 5.7;
                                }
                                EffectManager.createHitEffect(p1.x + dx/2, p1.y + dy/2, "#FFFFFF", 1.0);
                                SoundManager.playSynth('bounce');
                                this.cooldown = 9;
                            } else {
                                let attacker = isP1Dashing ? p1 : p2;
                                let victim = isP1Dashing ? p2 : p1;
                                let atkDirX = isP1Dashing ? nx : -nx; let atkDirY = isP1Dashing ? ny : -ny;

                                let isVictimFixed = isFixedBoss(victim);

                                if (!victim.scHitCooldown || victim.scHitCooldown <= 0) {
                                    EffectManager.createHitEffect(victim.x, victim.y, "#FF0000", 3.0);
                                    SoundManager.playSynth('heavyHit'); SoundManager.play('crush'); 
                                    
                                    EffectManager.triggerHitStop(isVictimFixed ? 3.5 : 31); 
                                    
                                    victim.knockbackBounces = 5;
                                    let cAng = Math.atan2((canvas.height/2) - victim.y, (canvas.width/2) - victim.x);
                                    victim.dx = atkDirX * 51.6 + Math.cos(cAng) * 11.5; 
                                    victim.dy = atkDirY * 51.6 + Math.sin(cAng) * 11.5;
                                    
                                    victim.lastAttacker = attacker;
                                    victim.hp -= 8; 
                                    victim.scHitCooldown = 39;
                                    
                                    this.cooldown = isVictimFixed ? 3.5 : 13; 
                                }
                            }
                        } 
                        else if (isP1Revving || isP2Revving) {
                            if (p1.team === p2.team) {
                                let restitution = 1; let impulse = (1 + restitution) * velAlongNormal / 2; 
                                impulse = Math.min(impulse, 9.2);
                                p1.dx -= impulse * nx; p1.dy -= impulse * ny;
                                p2.dx += impulse * nx; p2.dy += impulse * ny;
                                SoundManager.playSynth('bounce');
                                this.cooldown = 9; 
                            } else {
                                let attacker = isP1Revving ? p1 : p2;
                                let victim = isP1Revving ? p2 : p1;
                                let atkDirX = isP1Revving ? nx : -nx; let atkDirY = isP1Revving ? ny : -ny;

                                let isVictimFixed = isFixedBoss(victim);

                                EffectManager.createHitEffect(victim.x, victim.y, "#FF8800", 1.5);
                                SoundManager.playSynth('hit'); SoundManager.play('crush'); 
                                
                                EffectManager.triggerHitStop(isVictimFixed ? 2.6 : 7); 
                                
                                victim.dx = atkDirX * 28.7; victim.dy = atkDirY * 28.7;
                                
                                victim.lastAttacker = attacker;
                                victim.hp -= 3; 
                                
                                this.cooldown = isVictimFixed ? 2.6 : 9; 
                            }
                        } 
                        else {
                            if (p1Fixed && !p2Fixed) {
                                let dot2 = p2.dx * nx + p2.dy * ny;
                                if (dot2 < 0) { 
                                    p2.dx -= 2 * dot2 * nx; 
                                    p2.dy -= 2 * dot2 * ny; 
                                    p2.lastAttacker = p1;
                                }
                            } else if (!p1Fixed && p2Fixed) {
                                let dot1 = p1.dx * nx + p1.dy * ny;
                                if (dot1 > 0) { 
                                    p1.dx -= 2 * dot1 * nx; 
                                    p1.dy -= 2 * dot1 * ny; 
                                    p1.lastAttacker = p2;
                                }
                            } else {
                                let restitution = 1; let impulse = (1 + restitution) * velAlongNormal / 2; 
                                impulse = Math.min(impulse, 9.2);
                                
                                if (p1.freezeTimer <= 0) { p1.dx -= impulse * nx; p1.dy -= impulse * ny; }
                                if (p2.freezeTimer <= 0) { p2.dx += impulse * nx; p2.dy += impulse * ny; }
                                
                                if (p1.team !== p2.team) {
                                    p1.lastAttacker = p2;
                                    p2.lastAttacker = p1;

                                    let isBossBattle = (p1.team.includes('boss') || p2.team.includes('boss'));
                                    
                                    if (!isBossBattle) {
                                        let p1CanAttack = !(p1.weapon && p1.weapon.isPacifist);
                                        let p2CanAttack = !(p2.weapon && p2.weapon.isPacifist);
                                        
                                        if (p2CanAttack) {
                                            p1.hp -= 1; 
                                            EffectManager.createHitEffect(p1.x, p1.y, p1.color);
                                        }
                                        if (p1CanAttack) {
                                            p2.hp -= 1; 
                                            EffectManager.createHitEffect(p2.x, p2.y, p2.color);
                                        }
                                    }
                                }
                            }
                            
                            SoundManager.playSynth('bounce');
                            this.cooldown = 9; 
                        }
                    }
                }
            }
        }
    }
};
