// src/entities/GameBall.js

import { SoundManager, EffectManager } from '../managers.js';

export default class GameBall {
    constructor(x, y, color, darkColor, team, weaponModule) {
        this.x = x; 
        this.y = y;
        this.color = color; 
        this.darkColor = darkColor;
        this.team = team;
        
        this.weapon = weaponModule; 
        this.label = this.weapon ? this.weapon.name : 'NORMAL';

        this.baseRadius = 45; 
        this.radius = this.baseRadius;
        
        let initialSpeed = this.team.includes('boss') ? 1.719 : 2.865; 
        
        let randomAngle = Math.random() * Math.PI * 2; 
        this.dx = Math.cos(randomAngle) * initialSpeed; 
        this.dy = Math.sin(randomAngle) * initialSpeed;
        this.angle = Math.atan2(this.dy, this.dx);
        
        this.angleToEnemy = 0; 
        
        this._hp = 100; 
        this.isDead = false;
        
        this.damageDealt = 0; 
        this.lastAttacker = null; 
        
        this.knockbackBounces = 0;
        this.friendlyKnockback = false; 

        this.constantKnockback = false; 

        this.isInvincible = false;
        this.poisonTimer = 0;
        this.burnTimer = 0;
        this.slowTimer = 0;
        this.snowSlowTimer = 0;

        this.freezeTimer = 0;          
        this.freezeAccum = 0;          
        this.wallDamageCooldown = 0;   
        this.isBoatKnocked = false;    
        this.boatBouncePhase = 0;      
        this.wasFrozen = false; 

        this.paralysisTimer = 0;
        this.wasParalyzed = false;

        this.timeStopFreeze = 0; 

        this.minecartComboTimer = 0; 
        this.wallPistonDamageCooldown = 0; 
        
        this.wallSoundCooldown = 0; 

        this.pistonSlideTimer = 0;

        // 대시 관련 변수
        this.dashTimer = 0;            // 대시 지속 타이머
        this.dashMaxDuration = 8;      // 대시 돌진 시간
        
        // 대시 거리를 지금보다 2배 더 길게 가기 위해 대시 순간 최고 속도를 배가합니다. (9.5 -> 19.0)
        this.dashSpeed = 19.0;          
        
        this.dashAfterimages = [];     // 잔상 보관 배열
        this.dashCooldownTimer = 0;    // 대시 쿨타임용 프레임 타이머
    }

    get hp() {
        return this._hp;
    }

    set hp(newVal) {
        let damage = this._hp - newVal; 
        
        if (damage > 0 && this.weapon && (this.weapon.name === 'WARDEN' || this.weapon.name === 'ENDER_DRAGON')) {
            newVal = this._hp - (damage * 1);
        }

        let actualDamage = this._hp - newVal;
        if (actualDamage > 0 && this.lastAttacker) {
            let appliedDamage = Math.min(this._hp, actualDamage); 
            this.lastAttacker.damageDealt += appliedDamage;
        }

        this._hp = newVal;
    }

    // 대시 스킬 트리거 함수
    triggerDash(keysPressed) {
        if (this.isDead || this.dashTimer > 0 || this.dashCooldownTimer > 0 || this.freezeTimer > 0 || this.timeStopFreeze > 0 || this.paralysisTimer > 0) return;

        // 넉백을 강하게 당하는 와중에는 대시 스킬을 써서 조종권을 임의로 탈취할 수 없도록 방어 조건을 유지합니다.
        if (this.knockbackBounces > 0 || this.isBoatKnocked) return;

        let moveX = 0;
        let moveY = 0;
        if (keysPressed.w) moveY -= 1;
        if (keysPressed.s) moveY += 1;
        if (keysPressed.a) moveX -= 1;
        if (keysPressed.d) moveX += 1;

        let dashAngle = 0;
        if (moveX !== 0 || moveY !== 0) {
            dashAngle = Math.atan2(moveY, moveX);
        } else {
            dashAngle = this.angle;
        }

        this.dx = Math.cos(dashAngle) * this.dashSpeed;
        this.dy = Math.sin(dashAngle) * this.dashSpeed;
        this.dashTimer = this.dashMaxDuration;
        
        // 대시 쿨타임을 1초(144프레임)로 축소 적용합니다.
        this.dashCooldownTimer = 144;

        SoundManager.play('dash');
    }

    update(enemies, canvas, keysPressed = null) {
        let hasLivingEnemies = enemies.some(e => !e.isDead && e.team !== this.team);
        
        if (!hasLivingEnemies) {
            this.isInvincible = true;
            if (this.hp < 1) this.hp = 1;
            this.poisonTimer = 0;
            this.burnTimer = 0;
            this.slowTimer = 0;
            this.snowSlowTimer = 0;
            this.freezeTimer = 0;
            this.freezeAccum = 0;
            this.paralysisTimer = 0; 
            this.timeStopFreeze = 0; 
            SoundManager.stop('poison');
        } else {
            this.isInvincible = false;
        }

        if (this.hp <= 0 && !this.isDead) { 
            this.isDead = true; 
            EffectManager.createHitEffect(this.x, this.y, this.color, 2.5);
            SoundManager.playSynth('crash'); 
            SoundManager.stop('poison');
            EffectManager.triggerHitStop(9); 
            if (this.weapon && this.weapon.onDeath) this.weapon.onDeath(this);
            return; 
        }
        if (this.isDead) return;

        if (this.minecartComboTimer > 0) {
            this.minecartComboTimer--;
            if (this.minecartComboTimer === 0) {
                for (let e of enemies) {
                    if (e.weapon && e.weapon.name === 'MINECART') {
                        for (let mc of e.weapon.minecarts) {
                            let idx = mc.hitTargets.indexOf(this);
                            if (idx !== -1) {
                                mc.hitTargets.splice(idx, 1);
                            }
                        }
                    }
                }
            }
        }

        if (this.knockbackBounces > 0 || this.isBoatKnocked || this.constantKnockback) {
            this.freezeTimer = 0;
            this.freezeAccum = 0;
            this.timeStopFreeze = 0; 
            this.wasFrozen = false; 
            
            this.paralysisTimer = 0; 
            this.wasParalyzed = false;
        }

        if (this.poisonTimer > 0) {
            this.poisonTimer--;
            if (!this.isInvincible) this.hp -= 0.017;
            
            if (EffectManager.frameCount % 5 === 0) {
                EffectManager.particles.push({
                    x: this.x + (Math.random() - 0.5) * this.radius * 1.5, 
                    y: this.y + (Math.random() - 0.5) * this.radius,
                    dx: (Math.random() - 0.5) * 1, dy: -1.5 - Math.random() * 1.5,
                    life: 25 + Math.random() * 10, size: Math.random() * 5 + 3, 
                    color: "rgba(68, 170, 0, 0.8)", isSquare: false
                });
            }
            SoundManager.loopPlay('poison', 0.6); 
        } else {
            SoundManager.stop('poison');
        }

        if (this.burnTimer > 0) {
            this.burnTimer--;
            if (!this.isInvincible) this.hp -= 0.023;
            if (EffectManager.frameCount % 13 === 0) {
                EffectManager.createHitEffect(this.x, this.y, "#FF8800", 0.5);
            }
        }

        if (this.snowSlowTimer > 0) this.snowSlowTimer--;
        if (this.slowTimer > 0) this.slowTimer--;

        if (this.wallDamageCooldown > 0) this.wallDamageCooldown--;
        if (this.wallPistonDamageCooldown > 0) this.wallPistonDamageCooldown--; 
        
        if (this.wallSoundCooldown > 0) this.wallSoundCooldown--; 
        
        if (this.freezeAccum > 0 && EffectManager.frameCount % 2 === 0) this.freezeAccum--;

        if (this.pistonSlideTimer > 0) this.pistonSlideTimer--;

        // 대시 쿨타임 및 지속 업데이트
        if (this.dashCooldownTimer > 0) {
            this.dashCooldownTimer--;
        }

        if (this.dashTimer > 0) {
            this.dashTimer--;
            this.dashAfterimages.push({
                x: this.x,
                y: this.y,
                angle: this.angle,
                alpha: 1.0
            });
        }

        for (let i = this.dashAfterimages.length - 1; i >= 0; i--) {
            this.dashAfterimages[i].alpha -= 0.12;
            if (this.dashAfterimages[i].alpha <= 0) {
                this.dashAfterimages.splice(i, 1);
            }
        }

        let target = null, minDist = Infinity;
        for (let e of enemies) {
            if (e.isDead || (e.weapon && e.weapon.hideBase)) continue;
            
            let isEnemy = e.team !== this.team;
            
            if (isEnemy) {
                let dist = Math.hypot(e.x - this.x, e.y - this.y); 
                if (dist < minDist) { minDist = dist; target = e; } 
            }
        }
        
        if (this.freezeTimer <= 0 && this.timeStopFreeze <= 0 && this.paralysisTimer <= 0) {
            if (this.weapon && this.weapon.name === 'BOW') {
                this.angleToEnemy = Math.atan2(this.weapon.mouseY - this.y, this.weapon.mouseX - this.x);
            } else if (target) {
                this.angleToEnemy = Math.atan2(target.y - this.y, target.x - this.x); 
            } else {
                this.angleToEnemy += 0.023; 
            }
        } else {
            target = null; 
        }

        this.renderOffsetX = 0; 
        this.renderOffsetY = 0;

        if (this.weapon && this.weapon.update) {
            this.weapon.update(this, enemies, target, canvas);
        }

        let isBossFixed = (this.weapon && (
            (this.weapon.name === 'WITHER' && this.weapon.witherState === 'spawning') ||
            (this.weapon.name === 'WARDEN' && (this.weapon.wardenState === 'charging' || this.weapon.wardenState === 'firing')) ||
            (this.weapon.name === 'ENDER_DRAGON' && (this.weapon.dragonState === 'charging' || this.weapon.dragonState === 'breathing' || this.weapon.dragonState === 'breath_charging'))
        ));

        if (isBossFixed) {
            this.dx = 0;
            this.dy = 0;
            this.knockbackBounces = 0;
            this.constantKnockback = false;
            this.isBoatKnocked = false;
        }

        if (this.freezeTimer <= 0 && this.timeStopFreeze <= 0 && this.paralysisTimer <= 0) {
            if (this.weapon && this.weapon.name === 'BOW') {
                this.angle = this.angleToEnemy;
            } else if (this.knockbackBounces <= 0 && !this.isBoatKnocked && this.pistonSlideTimer <= 0 && !(this.weapon && this.weapon.overrideAngle)) {
                let diff = this.angleToEnemy - this.angle;
                while (diff < -Math.PI) diff += Math.PI*2; 
                while (diff > Math.PI) diff -= Math.PI*2;
                this.angle += diff * 0.172;
            } else if (this.isBoatKnocked || this.knockbackBounces > 0 || this.pistonSlideTimer > 0) {
                this.angle = Math.atan2(this.dy, this.dx);
            }
        }

        if (!(this.weapon && this.weapon.overrideMovement)) {
            let ms = 1.0;
            if (this.weapon && this.weapon.name === 'STICK' && this.weapon.stickState === 'charging') {
                ms = 0.5 - (this.weapon.stickTimer / 157 * 0.4); 
            }
            
            if (this.snowSlowTimer > 0 || this.slowTimer > 0) {
                ms *= 0.45;
            }

            if (this.freezeTimer > 0 || this.timeStopFreeze > 0 || this.paralysisTimer > 0) {
                ms = 0;
            }

            if (isBossFixed) {
                ms = 0;
            }
            
            if (this.team === 'player' && keysPressed && this.dashTimer <= 0 && ms > 0) {
                if (this.knockbackBounces > 0 || this.isBoatKnocked || this.pistonSlideTimer > 0) {
                    // 넉백 중이므로 WASD 조종 가속 연산을 차단하고 외부 힘에 몸을 맡깁니다.
                } else {
                    let inputX = 0;
                    let inputY = 0;
                    if (keysPressed.w) inputY -= 1;
                    if (keysPressed.s) inputY += 1;
                    if (keysPressed.a) inputX -= 1;
                    if (keysPressed.d) inputX += 1;

                    if (inputX !== 0 || inputY !== 0) {
                        let inputAngle = Math.atan2(inputY, inputX);
                        this.dx = Math.cos(inputAngle) * this.speed;
                        this.dy = Math.sin(inputAngle) * this.speed;
                    } else {
                        this.dx = 0;
                        this.dy = 0;
                    }
                }
            }

            this.x += this.dx * ms; 
            this.y += this.dy * ms;
        }

        let currentSpeedForSound = Math.hypot(this.dx, this.dy);

        let hitWall = false; let wallSide = null;
        if (!(this.weapon && this.weapon.overrideWallCollision)) {
            if (this.x + this.radius >= canvas.width) { this.x = canvas.width - this.radius; this.dx = -Math.abs(this.dx); hitWall = true; wallSide = 'right'; }
            if (this.x - this.radius <= 0) { this.x = this.radius; this.dx = Math.abs(this.dx); hitWall = true; wallSide = 'left'; }
            if (this.y + this.radius >= canvas.height) { this.y = canvas.height - this.radius; this.dy = -Math.abs(this.dy); hitWall = true; wallSide = 'bottom'; }
            if (this.y - this.radius <= 0) { this.y = this.radius; this.dy = Math.abs(this.dy); hitWall = true; wallSide = 'top'; }

            if (hitWall) {
                this.minecartComboTimer = 26;

                let weaponHandled = false;
                if (this.weapon && this.weapon.onHitWall && this.timeStopFreeze <= 0) {
                    weaponHandled = this.weapon.onHitWall(this, wallSide, canvas, enemies);
                }

                if (!weaponHandled) {
                    if (this.constantKnockback && this.knockbackBounces > 0) {
                        this.knockbackBounces--;
                        if (!(this.weapon && this.weapon.name === 'BOW')) {
                            this.angle = Math.atan2(this.dy, this.dx);
                        }
                        
                        if (!this.friendlyKnockback) {
                            if (!this.isInvincible) this.hp -= 2;
                            EffectManager.createHitEffect(this.x, this.y, "#FFFFFF", 2.5);
                        } else {
                            EffectManager.createHitEffect(this.x, this.y, "#AAAAAA", 1.5);
                        }
                        
                        if (currentSpeedForSound > 0.2) {
                            SoundManager.playSynth('crash'); 
                        }
                        
                        EffectManager.triggerHitStop(13);
                        if (this.knockbackBounces <= 0) {
                            this.constantKnockback = false; 
                            this.friendlyKnockback = false;
                        } 
                    } 
                    else if (this.isBoatKnocked) {
                        if (this.wallSoundCooldown <= 0) {
                            if (currentSpeedForSound > 0.2) {
                                SoundManager.playSynth('bounce');
                            }
                            this.wallSoundCooldown = 7;
                        }

                        if (this.wallDamageCooldown <= 0) {
                            this.boatBouncePhase++; 
                            if (this.boatBouncePhase <= 5) { 
                                if (!this.isInvincible) this.hp -= 2; 
                                this.wallDamageCooldown = 13; 
                                EffectManager.createHitEffect(this.x, this.y, "#FFFFFF", 3.0); 
                                if (currentSpeedForSound > 0.2) {
                                    SoundManager.playSynth('heavyHit'); 
                                }
                                EffectManager.triggerHitStop(13); 
                                let currentAngle = Math.atan2(this.dy, this.dx);
                                this.dx = Math.cos(currentAngle) * 28.65; 
                                this.dy = Math.sin(currentAngle) * 28.65;
                                if (!(this.weapon && this.weapon.name === 'BOW')) {
                                    this.angle = currentAngle;
                                }
                            }
                        }
                    } 
                    else if (this.knockbackBounces > 0) {
                        this.knockbackBounces--; 
                        if (!(this.weapon && this.weapon.name === 'BOW')) {
                            this.angle = Math.atan2(this.dy, this.dx);
                        }
                        
                        if (!this.friendlyKnockback) { 
                            if (!this.isInvincible) this.hp -= 2; 
                            EffectManager.createHitEffect(this.x, this.y, "#FFFFFF", 2); 
                        } else {
                            EffectManager.createHitEffect(this.x, this.y, "#AAAAAA", 1.5);
                        }
                        
                        if (currentSpeedForSound > 0.2) {
                            SoundManager.playSynth('crash'); 
                        }
                        
                        EffectManager.triggerHitStop(13); 
                        if (this.knockbackBounces <= 0) {
                            let spd = Math.hypot(this.dx, this.dy); 
                            if(spd > 0) { 
                                let inertiaSpeed = 32.09; 
                                this.dx = (this.dx / spd) * inertiaSpeed; 
                                this.dy = (this.dy / spd) * inertiaSpeed; 
                                if (!(this.weapon && this.weapon.name === 'BOW')) {
                                    this.angle = Math.atan2(this.dy, this.dx);
                                }
                            }
                            this.friendlyKnockback = false; 
                        }
                    } else { 
                        // ★ 변경: 수동 무빙 상태 등에서 일반 벽에 문질러질 때 연속적인 소음("드르르륵")이 나는 현상 원천 봉쇄
                        if (this.wallSoundCooldown <= 0) {
                            if (currentSpeedForSound > 0.2) {
                                SoundManager.playSynth('bounce'); 
                            }
                            this.wallSoundCooldown = 15; // 사운드가 난 직후 15프레임 동안 연속 재생을 필터링 처리
                        }
                    }
                }
            }
        }

        let currentMaxSpeed = this.team.includes('boss') ? 1.719 : 2.865;
        if (this.snowSlowTimer > 0 || this.slowTimer > 0) {
            currentMaxSpeed *= 0.45;
        }
        if (isBossFixed) {
            currentMaxSpeed = 0;
        }

        let currentSpeed = Math.hypot(this.dx, this.dy);
        
        if (this.freezeTimer > 0 || this.timeStopFreeze > 0 || this.paralysisTimer > 0) {
            if (this.freezeTimer > 0) this.freezeTimer--;
            if (this.timeStopFreeze > 0) this.timeStopFreeze--; 
            if (this.paralysisTimer > 0) this.paralysisTimer--; 
            
            this.dx = 0; 
            this.dy = 0; 
            
            if (this.freezeTimer > 0) this.wasFrozen = true;
            if (this.paralysisTimer > 0) this.wasParalyzed = true;
        } else {
            if (this.wasFrozen || this.wasParalyzed) { 
                this.dx = Math.cos(this.angle) * currentMaxSpeed;
                this.dy = Math.sin(this.angle) * currentMaxSpeed;
                this.wasFrozen = false;
                this.wasParalyzed = false;
                currentSpeed = currentMaxSpeed;
            }

            let isStickSwinging = (this.weapon && this.weapon.name === 'STICK' && this.weapon.stickState === 'swinging');
            let isStickCharging = (this.weapon && this.weapon.name === 'STICK' && this.weapon.stickState === 'charging');

            if (this.dashTimer > 0) {
                // 대시 상태 보존
            }
            else if (this.constantKnockback && this.knockbackBounces > 0) {
                let fixedSpeed = 40.11; 
                if (currentSpeed < fixedSpeed - 1 || currentSpeed > fixedSpeed + 1) {
                    let moveAngle = Math.atan2(this.dy, this.dx);
                    this.dx = Math.cos(moveAngle) * fixedSpeed;
                    this.dy = Math.sin(moveAngle) * fixedSpeed;
                }
            } 
            else if (this.isBoatKnocked) { 
                if (this.boatBouncePhase >= 5) {
                    this.dx *= 0.931; 
                    this.dy *= 0.931;
                    if (currentSpeed <= currentMaxSpeed + 1) { 
                        this.isBoatKnocked = false; 
                        this.boatBouncePhase = 0; 
                        this.wallDamageCooldown = 0; 
                    }
                }
            } 
            else if (this.knockbackBounces > 0) { 
                if (currentSpeed < 20.63) { 
                    this.dx *= 1.115; 
                    this.dy *= 1.115; 
                } else {
                    this.dx *= 0.965;
                    this.dy *= 0.965;
                }
            } 
            else if (this.pistonSlideTimer > 0) {
                this.dx *= 0.931;
                this.dy *= 0.931;
                let newSpeed = Math.hypot(this.dx, this.dy);
                
                if (newSpeed <= currentMaxSpeed) {
                    if (newSpeed > 0) {
                        this.dx = (this.dx / newSpeed) * currentMaxSpeed;
                        this.dy = (this.dy / newSpeed) * currentMaxSpeed;
                    }
                    this.pistonSlideTimer = 0; 
                }
            }
            else if (!(this.weapon && this.weapon.overrideFriction)) {
                if (this.team === 'player') {
                    // 수동 제어 마찰 예외 보존
                } else if (currentSpeed < 0.1 && currentMaxSpeed > 0) { 
                    this.dx = Math.cos(this.angle) * currentMaxSpeed; 
                    this.dy = Math.sin(this.angle) * currentMaxSpeed; 
                    currentSpeed = currentMaxSpeed;
                }
                
                if (!isStickCharging && !isStickSwinging) {
                    if (this.team === 'player') {
                        // 수동 제어용 바이패스
                    } else if (currentSpeed > currentMaxSpeed) { 
                        let friction = currentSpeed > currentMaxSpeed * 2 ? 0.977 : 0.943; 
                        this.dx *= friction; 
                        this.dy *= friction; 
                    } else if (currentSpeed < currentMaxSpeed - 0.2 && currentMaxSpeed > 0) { 
                        this.dx *= 1.058; 
                        this.dy *= 1.058; 
                    }
                } else if (isStickSwinging) {
                    if (currentSpeed > currentMaxSpeed) { 
                        let friction = 0.797; 
                        this.dx *= friction; 
                        this.dy *= friction; 
                    }
                }
            }
        }
        
        this.renderDrawX = this.x + this.renderOffsetX; 
        this.renderDrawY = this.y + this.renderOffsetY;
    }

    draw(ctx) {
        if (this.isDead) return;
        let drawX = this.renderDrawX; 
        let drawY = this.renderDrawY;
        let hideBase = this.weapon && this.weapon.hideBase;

        if (this.paralysisTimer > 0) {
            drawX += (Math.random() - 0.5) * 8;
            drawY += (Math.random() - 0.5) * 8;
        }

        for (let img of this.dashAfterimages) {
            ctx.save();
            ctx.translate(img.x, img.y);
            ctx.rotate(img.angle);
            ctx.globalAlpha = img.alpha * 0.35; 
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.save(); 
        ctx.translate(drawX, drawY); 

        if (this.poisonTimer > 0) {
            ctx.shadowBlur = 20; 
            ctx.shadowColor = "#44AA00";
            ctx.fillStyle = "rgba(68, 170, 0, 0.4)";
            ctx.beginPath(); 
            ctx.arc(0, 0, this.radius + 6, 0, Math.PI*2); 
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.rotate(this.angle); 
        
        if (!hideBase) {
            ctx.beginPath(); 
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            
            if (this.weapon && this.weapon.name === 'WARDEN') {
                let grad = ctx.createRadialGradient(0, 0, this.radius * 0.1, 0, 0, this.radius);
                grad.addColorStop(0, "#E2EBED"); 
                grad.addColorStop(0.5, "#0A2426"); 
                grad.addColorStop(1, "#030A0B");   
                ctx.fillStyle = grad;
            } else if (this.weapon && this.weapon.name === 'ENDER_DRAGON') {
                let grad = ctx.createRadialGradient(0, 0, this.radius * 0.1, 0, 0, this.radius);
                grad.addColorStop(0, "#AA00FF"); 
                grad.addColorStop(0.5, "#220033"); 
                grad.addColorStop(1, "#000000");   
                ctx.fillStyle = grad;
            } else {
                ctx.fillStyle = this.color; 
            }
            
            ctx.fill(); 
            
            ctx.lineWidth = 3; 
            ctx.strokeStyle = (this.weapon && (this.weapon.name === 'WARDEN' || this.weapon.name === 'ENDER_DRAGON')) ? this.color : this.darkColor; 
            ctx.stroke(); 
            ctx.closePath();
        }
        
        if (this.weapon && this.weapon.drawForeground) {
            this.weapon.drawForeground(this, ctx);
        }

        if (this.burnTimer > 0 && EffectManager.frameCount % 9 < 4) {
            ctx.fillStyle = "rgba(255,136,0,0.4)";
            ctx.beginPath(); 
            ctx.arc(0, 0, this.radius, 0, Math.PI*2); 
            ctx.fill();
        }

        if (this.freezeTimer > 0) {
            ctx.fillStyle = "rgba(150, 220, 255, 0.75)"; 
            ctx.strokeStyle = "#FFFFFF"; 
            ctx.lineWidth = 3;
            ctx.beginPath(); 
            let r = this.radius + 18;
            ctx.moveTo(0, -r*1.1); ctx.lineTo(r*0.6, -r*0.8); ctx.lineTo(r*1.1, -r*0.2); ctx.lineTo(r*0.9, r*0.5);
            ctx.lineTo(r*0.5, r*1.1); ctx.lineTo(-r*0.4, r*0.9); ctx.lineTo(-r*1.0, r*0.3); ctx.lineTo(-r*0.8, -r*0.6);
            ctx.closePath(); 
            ctx.fill(); 
            ctx.stroke();
            
            ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(255,255,255,0.6)";
            ctx.beginPath(); ctx.moveTo(0, -r*1.1); ctx.lineTo(0, 0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(r*1.1, -r*0.2); ctx.lineTo(0, 0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-r*1.0, r*0.3); ctx.lineTo(0, 0); ctx.stroke();
        }

        if (this.paralysisTimer > 0) {
            ctx.save();
            let isCyan = EffectManager.frameCount % 3 < 1.5;
            ctx.fillStyle = isCyan ? "rgba(0, 255, 255, 0.4)" : "rgba(255, 255, 0, 0.4)";
            ctx.shadowBlur = 15;
            ctx.shadowColor = isCyan ? "#00FFFF" : "#FFFF00";
            
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = isCyan ? "#FFFFFF" : "#FFFF00";
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                let ang = (Math.PI * 2 / 6) * i + (Math.random() * 0.5);
                let r1 = this.radius - 10;
                let r2 = this.radius + 15 + Math.random() * 20;
                ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
                ctx.lineTo(Math.cos(ang) * r2 + (Math.random() - 0.5) * 20, Math.sin(ang) * r2 + (Math.random() - 0.5) * 20);
            }
            ctx.stroke();

            if (EffectManager.frameCount % 2 === 0) {
                ctx.globalCompositeOperation = "screen";
                ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                ctx.beginPath();
                ctx.arc(0, 0, this.radius - 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        ctx.restore(); 

        if (!hideBase) {
            ctx.save(); 
            ctx.translate(drawX, drawY);
            ctx.font = "900 26px 'Arial Black', sans-serif"; 
            ctx.textAlign = "center"; 
            ctx.textBaseline = "middle";
            ctx.lineWidth = 3; 
            ctx.strokeStyle = "#000"; 
            let displayHp = Math.ceil(Math.max(this.hp, 0));
            ctx.strokeText(displayHp, 0, 0); 
            ctx.fillStyle = "#FFFFFF"; 
            ctx.fillText(displayHp, 0, 0); 
            ctx.restore(); 
        }

        // 플레이어 공 위에 대시 쿨타임 남은 시간을 알려주는 입체 게이지바 UI 렌더링
        if (this.team === 'player' && this.dashCooldownTimer > 0) {
            ctx.save();
            ctx.translate(drawX, drawY - this.radius - 12); 
            
            let barW = 54;
            let barH = 6;
            let progressRatio = (144 - this.dashCooldownTimer) / 144; 
            if (progressRatio < 0) progressRatio = 0;

            ctx.fillStyle = "#000000";
            ctx.fillRect(-barW / 2, -barH / 2, barW, barH);

            ctx.fillStyle = "#00FFFF";
            ctx.fillRect(-barW / 2 + 1, -barH / 2 + 1, (barW - 2) * progressRatio, barH - 2);
            
            ctx.restore();
        }
    }
}
