// src/weapons/Wither.js

import BaseWeapon from './BaseWeapon.js';
import { SoundManager, EffectManager } from '../managers.js';
import GameBall from '../entities/GameBall.js'; 

const witherFaceImg = new Image();
witherFaceImg.src = 'wither face.png';

const skeletonImg = new Image();
skeletonImg.src = 'wither skeleton.png';
const swordImg = new Image();
swordImg.src = 'stone sword2.png';

class WitherSkeletonWeapon extends BaseWeapon {
    constructor() {
        super("WITHER_SKELETON");
        this.hideBase = true; 
        this.swingTimer = 0;
        this.attackCooldown = 0;
    }

    update(owner, enemies, target, canvas) {
        if (owner.freezeTimer > 0 || owner.timeStopFreeze > 0 || owner.paralysisTimer > 0) return;

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.swingTimer > 0) this.swingTimer--;

        if (target && !target.isDead) {
            let dist = Math.hypot(target.x - owner.x, target.y - owner.y);
            if (dist < owner.radius + target.radius + 30 && this.attackCooldown <= 0) {
                
                // ★ 오류 교정: target.weapon이 존재하지 않거나 안전하게 예외처리 되도록 옵셔널 체이닝(?.) 적용
                let isTargetBoostingBoat = target.weapon?.name === 'BOAT' && target.weapon?.boatBoostTimer > 0;
                
                if (!isTargetBoostingBoat) {
                    this.swingTimer = 20; 
                    this.attackCooldown = 86; 
                    
                    target.hp -= 1.25; 
                    
                    // 🌟 [추가]: 플레이어의 활 무기에서 공격 주체가 누구인지 명확히 걸러낼 수 있도록, 나를 때린 마지막 타격자 객체를 위더 스켈레톤 본체(owner)로 완벽하게 기록해 둡니다.
                    target.lastAttacker = owner;

                    target.knockbackBounces += 1;
                    let kbAngle = Math.atan2(target.y - owner.y, target.x - owner.x);
                    target.dx += Math.cos(kbAngle) * 15.0;
                    target.dy += Math.sin(kbAngle) * 15.0;
                    
                    EffectManager.triggerHitStop(5);
                    EffectManager.createHitEffect(target.x, target.y, "#FF0000", 2);
                    SoundManager.play('swing');
                    SoundManager.play('hit1');
                }
            }
        }
    }

    drawForeground(owner, ctx) {
        ctx.save();
        ctx.translate(0, 0);

        let hpRatio = Math.max(0, owner.hp / owner.maxHp);
        let barW = 35;
        let barH = 5;
        let barY = -owner.radius - 20;

        ctx.fillStyle = "#000";
        ctx.fillRect(-barW/2, barY, barW, barH);
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(-barW/2, barY, barW * hpRatio, barH);
        ctx.strokeStyle = "#FFF";
        ctx.lineWidth = 1;
        ctx.strokeRect(-barW/2, barY, barW, barH);

        ctx.rotate(owner.angle);

        let s = owner.radius * 2.2;
        
        if (skeletonImg.complete && skeletonImg.naturalWidth > 0) {
            ctx.save();
            ctx.rotate(Math.PI / 2); 
            ctx.shadowColor = "#FFFFFF";
            ctx.shadowBlur = 5;
            ctx.drawImage(skeletonImg, -s/2, -s/2, s, s);
            ctx.restore();
        } else {
            ctx.fillStyle = "#333333";
            ctx.fillRect(-s/2, -s/2, s, s);
        }

        if (swordImg.complete && swordImg.naturalWidth > 0) {
            ctx.save();
            
            ctx.translate(owner.radius * 0.4, -owner.radius * 0.85); 
            
            let swingAngle = Math.PI / 2; 
            
            if (this.swingTimer > 0) {
                let progress = 1 - (this.swingTimer / 20); 
                swingAngle = (Math.PI / 2) - Math.PI/3 + Math.sin(progress * Math.PI) * (Math.PI / 1.2);
            }
            
            ctx.rotate(swingAngle);
            
            ctx.drawImage(swordImg, -12, -45, 24, 60); 
            ctx.restore();
        }

        ctx.restore();
    }
    
    onDeath(owner) {
        EffectManager.createSmokeExplosion(owner.x, owner.y, 1.0);
        SoundManager.play('breakBone');
    }
}


export default class Wither extends BaseWeapon {
    constructor() {
        super("WITHER");
        this.witherState = 'spawning'; 
        
        this.spawnTimer = 0;
        this.maxSpawnTime = 144; 

        this.skulls = [];
        
        this.burstCount = 0; 
        this.burstTimer = 0; 

        this.maxCooldown = 432; 
        
        this.cooldown = 144; 
        
        this.headAngles = [0, 0, 0];
        
        this.isPhase2 = false;
        this.newSpawns = [];
    }

    update(owner, enemies, target, canvas) {
        // ★ 오류 예방: canvas 매개변수가 비어있을 경우 안전하게 기본 해상도 550으로 바인딩 처리
        let canvasW = canvas ? canvas.width : 550;
        let canvasH = canvas ? canvas.height : 550;

        if (owner.freezeTimer <= 0) {

            if (this.witherState === 'spawning') {
                if (this.spawnTimer === 0) {
                    owner.hp = 1;
                }

                this.spawnTimer++;
                
                owner.hp = Math.max(1, Math.min(owner.maxHp, (this.spawnTimer / this.maxSpawnTime) * owner.maxHp));
                
                owner.isInvincible = true;
                owner.dx = 0;
                owner.dy = 0;
                owner.knockbackBounces = 0;
                owner.isBoatKnocked = false;
                owner.constantKnockback = false;

                owner.angleToEnemy = Math.PI / 2;
                owner.angle = Math.PI / 2;

                if (this.spawnTimer >= this.maxSpawnTime) {
                    this.witherState = 'idle';
                    owner.isInvincible = false; 

                    SoundManager.play('wither spawn'); 
                    EffectManager.createHighQualityExplosion(owner.x, owner.y);
                    EffectManager.triggerHitStop(25); 

                    let startRandomAngle = Math.random() * Math.PI * 2;
                    let initialMoveSpeed = 2.865 * 1.5; 
                    
                    owner.dx = Math.cos(startRandomAngle) * initialMoveSpeed;
                    owner.dy = Math.sin(startRandomAngle) * initialMoveSpeed;
                    owner.angle = Math.atan2(owner.dy, owner.dx);
                    owner.angleToEnemy = owner.angle;

                    // 🌟 [유지] 시작 시 주변 플레이어를 밀쳐내던 충격 파동 데미지/넉백 로직 제거 유지
                }
            } 
            else if (this.witherState === 'idle') {
                
                if (owner.hp <= owner.maxHp / 2 && !this.isPhase2) {
                    this.isPhase2 = true; 
                    
                    SoundManager.play('wither spawn'); 
                    EffectManager.createHighQualityExplosion(owner.x, owner.y);
                    EffectManager.triggerHitStop(25); 

                    // 🌟 [유지] 파란색 위더 각성(2페이즈) 시 주변 플레이어를 밀쳐내던 파동 데미지/넉백 로직 제거 유지

                    for (let i = 0; i < 4; i++) {
                        let angle = (Math.PI / 2) * i + Math.PI / 4; 
                        let sx = owner.x + Math.cos(angle) * 80; 
                        let sy = owner.y + Math.sin(angle) * 80;
                        
                        let skelWeapon = new WitherSkeletonWeapon();
                        let skel = new GameBall(sx, sy, "#333333", "#222222", owner.team, skelWeapon);
                        
                        // 🌟 [변경]: 위더 스켈레톤의 체력을 기존 30에서 절반인 15로 하향 조정합니다.
                        skel.radius = 20; 
                        skel.maxHp = 15;
                        skel.hp = 15;
                        skel.speed = 2.5;
                        skel.baseSpeed = 2.5;
                        skel.maxSpeed = 2.5;
                        
                        this.newSpawns.push(skel); 
                    }
                }

                if (this.cooldown > 0) this.cooldown--;

                if (this.cooldown <= 0 && target && !target.isDead && this.burstCount === 0 && owner.knockbackBounces <= 0 && !owner.isPinned) {
                    SoundManager.play('wither shoot'); 
                    this.burstCount = 3;
                    this.burstTimer = 0;
                    this.cooldown = this.maxCooldown; 
                }

                if (this.burstCount > 0) {
                    if (owner.knockbackBounces > 0) {
                        owner.knockbackBounces = Math.max(owner.knockbackBounces, 1);
                    } else {
                        owner.constantKnockback = false;
                    }

                    if (!owner.isPinned) {
                        if (this.burstTimer > 0) this.burstTimer--;

                        if (this.burstTimer <= 0 && target && !target.isDead) {
                            let angle = Math.atan2(target.y - owner.y, target.x - owner.x);
                            let speed = 8.4; 
                            
                            this.skulls.push({
                                x: owner.x + Math.cos(angle) * owner.radius,
                                y: owner.y + Math.sin(angle) * owner.radius,
                                dx: Math.cos(angle) * speed,
                                dy: Math.sin(angle) * speed,
                                angle: angle,
                                trail: [],
                                isBlue: this.isPhase2
                            });
                            
                            SoundManager.play('wither shoot2'); 
                            this.burstCount--;

                            if (this.burstCount > 0) {
                                this.burstTimer = 29; 
                            }
                        }
                    }
                }
            }

            let headDist = owner.radius * 0.95; 
            
            let headAnglesOffset = this.witherState === 'spawning' 
                ? [Math.PI - Math.PI / 2.7, Math.PI, Math.PI + Math.PI / 2.7] 
                : [-Math.PI / 2.7, 0, Math.PI / 2.7];

            for (let i = 0; i < 3; i++) {
                let worldAngle = owner.angle + headAnglesOffset[i];
                
                if (this.witherState === 'spawning') {
                    this.headAngles[i] = worldAngle; 
                    continue;
                }

                if (owner.isPinned) {
                    continue;
                }

                let hx = owner.x + Math.cos(worldAngle) * headDist;
                let hy = owner.y + Math.sin(worldAngle) * headDist;

                let nearestEnemy = null;
                let minDist = Infinity;
                for (let e of enemies) {
                    if (e.isDead || e.team === owner.team) continue;
                    let dist = Math.hypot(e.x - hx, e.y - hy);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestEnemy = e;
                    }
                }

                if (nearestEnemy) {
                    let targetAngle = Math.atan2(nearestEnemy.y - hy, nearestEnemy.x - hx);
                    let diff = targetAngle - this.headAngles[i];
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    
                    this.headAngles[i] += diff * 0.05; 
                } else {
                    let diff = worldAngle - this.headAngles[i];
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    this.headAngles[i] += diff * 0.05;
                }
            }

        } 

        for (let i = this.skulls.length - 1; i >= 0; i--) {
            let skull = this.skulls[i];
            skull.x += skull.dx;
            skull.y += skull.dy;

            if (EffectManager.frameCount % 3 === 0) {
                skull.trail.push({ x: skull.x, y: skull.y, angle: skull.angle });
                if (skull.trail.length > 5) skull.trail.shift();
            }

            let hitWall = (skull.x < 0 || skull.x > canvasW || skull.y < 0 || skull.y > canvasH);
            let hitEnemy = null;
            
            let hitRadius = skull.isBlue ? 40 : 25;

            if (!hitWall) {
                for (let e of enemies) {
                    if (e.isDead || e.team === owner.team) continue;
                    
                    // 🌟 [유지]: 해골 투사체 대시 중인 플레이어 유령 통과 유지
                    if (e.dashTimer > 0) continue;

                    let dist = Math.hypot(e.x - skull.x, e.y - skull.y);
                    if (dist < hitRadius + e.radius) { 
                        hitEnemy = e;
                        break;
                    }
                }
            }

            if (hitWall || hitEnemy) {
                let blastRadius = skull.isBlue ? 80 : 40; 

                for (let e of enemies) {
                    if (e.isDead || e.team === owner.team) continue;
                    
                    // 🌟 [유지]: 폭발 스플래시 대시 관통 유지
                    if (e.dashTimer > 0) continue;

                    let dist = Math.hypot(e.x - skull.x, e.y - skull.y);
                    
                    if (dist <= blastRadius + e.radius) {
                        e.hp -= skull.isBlue ? 3.5 : 2.5; 
                        
                        // 🌟 [추가]: 해골 투사체 폭발 대미지 피격 시 나를 때린 마지막 주체를 위더 보스 본체(owner)로 기록
                        e.lastAttacker = owner;

                        e.knockbackBounces += 2;
                        
                        e.dx = Math.cos(skull.angle) * (skull.isBlue ? 30.0 : 25.0);
                        e.dy = Math.sin(skull.angle) * (skull.isBlue ? 30.0 : 25.0);
                        
                        EffectManager.triggerHitStop(7);
                        EffectManager.createHitEffect(e.x, e.y, skull.isBlue ? "#6699FF" : "#CCCCCC", 3);
                    }
                }

                let randExplosion = Math.floor(Math.random() * 3) + 1;
                SoundManager.play('explosion' + randExplosion);
                
                let effectSize = skull.isBlue ? 2.5 : 1.5;
                EffectManager.createSmokeExplosion(skull.x, skull.y, effectSize);

                this.skulls.splice(i, 1);
            }
        }
    }

    drawBackground(owner, ctx) {
        if (this.witherState === 'spawning') {
            let progress = this.spawnTimer / this.maxSpawnTime;
            
            ctx.save();
            ctx.translate(owner.renderDrawX || owner.x, owner.renderDrawY || owner.y);
            
            let pulseSize = owner.radius + 300 * (1 - progress);
            ctx.beginPath();
            ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(100, 150, 255, ${progress})`;
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, owner.radius + 20 + Math.sin(progress * Math.PI * 15) * 10, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100, 150, 255, ${0.1 * progress})`;
            ctx.fill();
            
            ctx.restore();
        }

        for (let skull of this.skulls) {
            if (skull.trail) {
                for (let i = 0; i < skull.trail.length; i++) {
                    let t = skull.trail[i];
                    ctx.save();
                    ctx.translate(t.x, t.y);
                    ctx.rotate(t.angle);
                    ctx.globalAlpha = (i / skull.trail.length) * 0.4; 
                    
                    let s = skull.isBlue ? 55 : 45; 
                    ctx.fillStyle = skull.isBlue ? "#4682B4" : "#222222";
                    ctx.fillRect(-s/2, -s/2, s, s);
                    ctx.restore();
                }
            }

            ctx.save();
            ctx.translate(skull.x, skull.y);
            ctx.rotate(skull.angle);
            
            let s = skull.isBlue ? 55 : 45; 
            if (witherFaceImg.complete && witherFaceImg.naturalWidth > 0) {
                ctx.rotate(Math.PI / 2);
                ctx.shadowColor = skull.isBlue ? "#6699FF" : "#FFFFFF"; 
                ctx.shadowBlur = skull.isBlue ? 15 : 5;
                ctx.drawImage(witherFaceImg, -s/2, -s/2, s, s);
                
                if (skull.isBlue) {
                    ctx.fillStyle = "rgba(70, 150, 255, 0.4)";
                    ctx.fillRect(-s/2, -s/2, s, s);
                }
            } else {
                ctx.fillStyle = skull.isBlue ? "#4682B4" : "#888888"; 
                ctx.fillRect(-s/2, -s/2, s, s);
            }
            ctx.restore();
        }
    }

    drawForeground(owner, ctx) {
        let isBlueAura = (this.witherState === 'spawning' || this.isPhase2);
        let pulse = (Math.sin(EffectManager.frameCount * 0.046) + 1) / 2; 
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, owner.radius, 0, Math.PI * 2);

        let heartAlpha = 0.05 + pulse * 0.4; 
        let grad = ctx.createRadialGradient(0, 0, 0, 0, 0, owner.radius);
        
        if (isBlueAura) {
            grad.addColorStop(0, `rgba(150, 200, 255, ${Math.min(1, heartAlpha + 0.5)})`); 
            grad.addColorStop(0.7, `rgba(70, 100, 150, ${heartAlpha * 0.8})`);
            grad.addColorStop(1, `rgba(0, 0, 0, 0)`); 
            ctx.shadowColor = "#6699FF"; 
        } else {
            grad.addColorStop(0, `rgba(220, 220, 220, ${Math.min(1, heartAlpha + 0.2)})`); 
            grad.addColorStop(0.7, `rgba(120, 120, 120, ${heartAlpha * 0.5})`);
            grad.addColorStop(1, `rgba(0, 0, 0, 0)`); 
            ctx.shadowColor = "#888888"; 
        }
        
        ctx.shadowBlur = 4 + pulse * 12; 
        ctx.fillStyle = grad; 
        ctx.fill();
        ctx.restore();

        ctx.save();
        let boneColor = isBlueAura ? "#AACCFF" : "#D5DFD1"; 
        let boneShadow = isBlueAura ? "#336699" : "#0A1F1F";

        let ribWidth = owner.radius * 0.18;  
        let ribXOffsets = [owner.radius * 0.35, 0, -owner.radius * 0.35]; 
        let extendAmount = owner.radius * 0.25; 

        for (let side of [-1, 1]) {
            for (let i = 0; i < 3; i++) {
                ctx.save();
                
                let baseRibHeight = (i === 1) ? owner.radius * 0.38 : owner.radius * 0.25; 
                let ribHeight = baseRibHeight + extendAmount;
                let yPos = side * (owner.radius * 0.5 + extendAmount / 2); 
                
                ctx.translate(ribXOffsets[i], yPos);
                if (side === 1) ctx.scale(1, -1);

                ctx.fillStyle = boneColor;
                ctx.shadowColor = boneShadow;
                ctx.shadowBlur = 4;
                
                ctx.fillRect(-ribWidth/2, -ribHeight/2, ribWidth, ribHeight);
                
                ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                ctx.fillRect(-ribWidth/2, -ribHeight/2, ribWidth, 3);
                ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
                ctx.fillRect(-ribWidth/2, ribHeight/2 - 3, ribWidth, 3);
                
                ctx.restore();
            }
        }
        ctx.restore();

        let headDistBase = owner.radius * 0.95;
        
        let headAnglesOffsetBase = this.witherState === 'spawning' 
            ? [Math.PI - Math.PI / 2.7, Math.PI, Math.PI + Math.PI / 2.7] 
            : [-Math.PI / 2.7, 0, Math.PI / 2.7];
            
        let headSizes = [owner.radius * 0.6, owner.radius * 1.0, owner.radius * 0.6]; 

        for (let i = 0; i < 3; i++) {
            ctx.save();
            let localAngle = headAnglesOffsetBase[i];
            let hx = Math.cos(localAngle) * headDistBase;
            let hy = Math.sin(localAngle) * headDistBase;
            
            ctx.translate(hx, hy);
            ctx.rotate(this.headAngles[i] - owner.angle);

            let s = headSizes[i];
            
            if (witherFaceImg.complete && witherFaceImg.naturalWidth > 0) {
                ctx.rotate(Math.PI / 2); 
                ctx.drawImage(witherFaceImg, -s/2, -s/2, s, s);
                
                if (isBlueAura) {
                    ctx.fillStyle = "rgba(70, 120, 200, 0.4)";
                    ctx.fillRect(-s/2, -s/2, s, s);
                }
            } else {
                ctx.fillStyle = "#222222";
                ctx.fillRect(-s/2, -s/2, s, s);
            }
            
            ctx.restore();
        }
    }

    onDeath(owner) {
        this.witherState = 'idle';
        this.skulls = [];
        this.burstCount = 0; 
        this.isPhase2 = false;
        this.newSpawns = [];
    }
}
