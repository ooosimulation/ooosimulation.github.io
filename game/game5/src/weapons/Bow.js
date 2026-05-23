// src/weapons/Bow.js

import BaseWeapon from './BaseWeapon.js';
import { SoundManager, EffectManager } from '../managers.js';

// 활 애니메이션 및 화살 에셋 등록 유지
const bow01 = new Image(); bow01.src = 'bow01.png';
const bow02 = new Image(); bow02.src = 'bow02.png';
const bow03 = new Image(); bow03.src = 'bow03.png';
const bow04 = new Image(); bow04.src = 'bow04.png';
const arrowImg = new Image(); arrowImg.src = 'bow05.png';

export default class Bow extends BaseWeapon {
    constructor() {
        super("BOW");
        
        this.cooldownTimer = 0;
        // 차징 2초 유지
        this.maxCooldown = 288; 
        
        this.chargeTimer = 0;
        // 차징 1초 유지
        this.maxCharge = 144;   
        this.isCharging = false;

        this.arrows = []; // 발사된 화살(투사체) 배열 유지
        
        // 마우스 월드 좌표 보관용
        this.mouseX = 0;
        this.mouseY = 0;

        // 활 에셋 시각 방향 정밀 조절 코드 유지
        this.bowAssetRotationOffset = 135 * Math.PI / 180; 

        // 적중 시 누적 가속할 장전 속도 배율 변수 유지
        this.chargeSpeedMultiplier = 1.0; 

        // 공 위에 배율을 표시해 줄 부유 텍스트 배열 유지
        this.floatingTexts = [];

        // 🌟 [추가]: 위더 및 스켈레톤 공격 피격 감지용 이전 체력 기록 변수
        this.lastOwnerHp = null;
    }

    // main.js에서 마우스 좌표를 실시간 동기화하기 위한 메서드 유지
    updateMousePosition(mx, my) {
        this.mouseX = mx;
        this.mouseY = my;
    }

    // 기존 차징 시작 트리거 유지
    startCharging() {
        if (this.cooldownTimer <= 0 && !this.isCharging) {
            this.isCharging = true;
            this.chargeTimer = 0;
            SoundManager.play('tridentCharge', this.chargeSpeedMultiplier); 
        }
    }

    // 기존 발사 로직 유지
    releaseCharging(owner) {
        if (!this.isCharging) return;

        if (this.chargeTimer >= this.maxCharge) {
            let angle = Math.atan2(this.mouseY - owner.y, this.mouseX - owner.x);
            let speed = 15.0; 

            this.arrows.push({
                x: owner.x + Math.cos(angle) * owner.radius,
                y: owner.y + Math.sin(angle) * owner.radius,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                angle: angle,
                // 화살의 기본 데미지 절반 수치(8.75) 유지
                damage: 8.75 
            });

            SoundManager.play('bow shoot'); 
            SoundManager.stop('tridentCharge');
            this.cooldownTimer = this.maxCooldown; 
        } else {
            SoundManager.stop('tridentCharge');
        }

        this.isCharging = false;
        this.chargeTimer = 0;
    }

    update(owner, enemies, target, canvas) {
        // 🌟 [추가]: 최초 실행 시 현재 체력을 백업
        if (this.lastOwnerHp === null) {
            this.lastOwnerHp = owner.hp;
        }

        // 🌟 [추가]: 보스(Wither)나 쫄몹(Skeleton)에게 맞아서 체력이 깎였을 때 연사속도 감속 패널티 부여
        if (owner.hp < this.lastOwnerHp) {
            let hpDecreased = this.lastOwnerHp - owner.hp;
            
            // 데미지를 입었을 때 현재 장전 배율에서 패널티 차감 (최하 1.0 제한)
            let bowLoss = this.chargeSpeedMultiplier * 0.25; // 피격 시 공속 배율 25% 급감
            let prevMult = this.chargeSpeedMultiplier;
            this.chargeSpeedMultiplier = Math.max(1.0, this.chargeSpeedMultiplier - bowLoss);

            // 실제로 공속 배율이 깎였다면 머리 위에 빨간색 수치로 시각화 알림
            if (prevMult > 1.0) {
                this.floatingTexts.push({
                    text: `-${(prevMult - this.chargeSpeedMultiplier).toFixed(2)} Slowed`,
                    relX: 0,
                    relY: -owner.radius - 15,
                    alpha: 1.0,
                    color: "#FF4444", // 패널티 빨간색
                    life: 50
                });
            }

            // 피격 시 쿨타임 패널티 추가 및 장전 한계치 원복 조율
            this.cooldownTimer = Math.min(this.maxCooldown, this.cooldownTimer + 30);
            this.maxCooldown = Math.min(288, this.maxCooldown + 12);
        }
        // 다음 프레임 비교를 위해 실시간 체력 갱신 동기화
        this.lastOwnerHp = owner.hp;

        // 본체 상태 이상 적용 시 차징 강제 취소 유지
        if (owner.freezeTimer > 0 || owner.timeStopFreeze > 0 || owner.paralysisTimer > 0) {
            if (this.isCharging) {
                this.isCharging = false;
                this.chargeTimer = 0;
                SoundManager.stop('tridentCharge');
            }
        }

        // 쿨타임 감소
        if (this.cooldownTimer > 0) this.cooldownTimer--;
        
        // 자동 공격 시스템 유지
        if (this.cooldownTimer <= 0 && !this.isCharging && (owner.freezeTimer <= 0 && owner.timeStopFreeze <= 0 && owner.paralysisTimer <= 0)) {
            this.startCharging();
        }

        if (this.isCharging && (owner.freezeTimer <= 0 && owner.timeStopFreeze <= 0 && owner.paralysisTimer <= 0)) {
            if (this.chargeTimer < this.maxCharge) {
                this.chargeTimer += this.chargeSpeedMultiplier;
            } else {
                this.releaseCharging(owner);
            }
        }

        // 화살 투사체 물리 및 충돌 업데이트 루프
        for (let i = this.arrows.length - 1; i >= 0; i--) {
            let arrow = this.arrows[i];
            arrow.x += arrow.dx;
            arrow.y += arrow.dy;

            let hitWall = (arrow.x < 0 || arrow.x > canvas.width || arrow.y < 0 || arrow.y > canvas.height);
            let hitEnemy = null;

            if (!hitWall) {
                for (let e of enemies) {
                    if (e.isDead || e.team === owner.team) continue;
                    
                    let dist = Math.hypot(e.x - arrow.x, e.y - arrow.y);
                    if (dist < arrow.radius + e.radius || dist < 35 + e.radius) {
                        hitEnemy = e;
                        break;
                    }
                }
            }

            if (hitWall || hitEnemy) {
                if (hitEnemy) {
                    // 데미지 주입 유지
                    hitEnemy.hp -= arrow.damage;
                    
                    EffectManager.triggerHitStop(6);
                    EffectManager.createHitEffect(hitEnemy.x, hitEnemy.y, "#FFFFFF", 2);
                    
                    SoundManager.play('hit');

                    // 기존 잔여 연사 대기시간 차감
                    if (this.cooldownTimer > 0) {
                        this.cooldownTimer = Math.max(0, this.cooldownTimer - 40);
                    }
                    
                    // 연사 속도 한계치 단축 메커니즘 유지
                    this.maxCooldown = Math.max(20, this.maxCooldown - 24);

                    // 상대방을 적중 시 빨라지는 수치를 기존 0.30에서 0.5배 감소한 0.15 증가로 조율합니다.
                    this.chargeSpeedMultiplier += 0.15;

                    // 머리 위 가속도 상승 수치 시각화 부유 텍스트 푸시 유지
                    this.floatingTexts.push({
                        text: `x${this.chargeSpeedMultiplier.toFixed(2)}`,
                        relX: 0,
                        relY: -owner.radius - 15,
                        alpha: 1.0,
                        color: "#FFDD00", // 노란색 (가속)
                        life: 45 
                    });

                } else {
                    // 화살이 보스를 맞추지 못하고 벽에 부딪혔을 때의 패널티 로직
                    EffectManager.createHitEffect(arrow.x, arrow.y, "#999999", 0.8);
                    SoundManager.playSynth('bounce');

                    // ★ 변경: 현재 쌓여있는 총 공격속도 배율의 6분의 1만큼 정확하게 연산하여 차감
                    let loss = this.chargeSpeedMultiplier / 6;
                    
                    let prevMultiplier = this.chargeSpeedMultiplier;
                    this.chargeSpeedMultiplier = Math.max(1.0, this.chargeSpeedMultiplier - loss);

                    // 실제로 배율이 깎였을 때만 머리 위에 빨간색 감속 패널티 텍스트 연출
                    if (prevMultiplier > 1.0) {
                        this.floatingTexts.push({
                            text: `-${(prevMultiplier - this.chargeSpeedMultiplier).toFixed(2)}`,
                            relX: 0,
                            relY: -owner.radius - 15,
                            alpha: 1.0,
                            color: "#FF4444", // 빨간색 (감속 패널티)
                            life: 45
                        });
                    }
                }

                this.arrows.splice(i, 1);
            }
        }

        // 부유 텍스트 상태 업데이트 루프 유지
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            let t = this.floatingTexts[i];
            t.life--;
            t.relY -= 0.8; 
            t.alpha -= 0.022; 
            if (t.life <= 0 || t.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    // 배경단 화살 레이아웃 렌더링 유지
    drawBackground(owner, ctx) {
        for (let arrow of this.arrows) {
            ctx.save();
            ctx.translate(arrow.x, arrow.y);
            ctx.rotate(arrow.angle);
            
            if (arrowImg.complete && arrowImg.naturalWidth > 0) {
                ctx.rotate(Math.PI / 4);
                let s = 60;
                ctx.drawImage(arrowImg, -s / 2, -s / 2, s, s);
            } else {
                ctx.strokeStyle = "#FFF";
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(-25, 0); ctx.lineTo(25, 0);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    // 전경단 활 조준선 및 실시간 차징 에셋 애니메이션 연동 유지
    drawForeground(owner, ctx) {
        ctx.save();
        ctx.translate(owner.radius, 0);

        let currentBowImg = bow01;

        if (this.isCharging) {
            let progress = this.chargeTimer / this.maxCharge;
            if (progress >= 1.0) currentBowImg = bow04;      
            else if (progress >= 0.66) currentBowImg = bow03; 
            else if (progress >= 0.33) currentBowImg = bow02; 
        }

        let s = owner.radius * 1.5;
        if (currentBowImg.complete && currentBowImg.naturalWidth > 0) {
            ctx.save();
            ctx.rotate(this.bowAssetRotationOffset); 
            ctx.drawImage(currentBowImg, -s / 2, -s / 2, s, s);
            ctx.restore();
        } else {
            ctx.fillStyle = this.isCharging ? "#FF5555" : "#FFFF55";
            ctx.fillRect(-10, -10, 20, 20);
        }

        ctx.restore(); 

        if (this.isCharging && this.chargeTimer >= this.maxCharge) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, owner.radius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 242, 0, ${0.5 + Math.sin(EffectManager.frameCount * 0.2) * 0.3})`;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore(); // 전체 매트릭스 복구 (본체 중심 좌표계)

        // 가속 및 감속 텍스트 화면 드로잉 연동 유지
        for (let t of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = t.alpha;
            ctx.font = "900 20px 'Arial Black', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 4;
            ctx.strokeText(t.text, owner.x + t.relX, owner.y + t.relY);
            
            ctx.fillStyle = t.color || "#FFDD00";
            ctx.fillText(t.text, owner.x + t.relX, owner.y + t.relY);
            ctx.restore();
        }
    }

    onDeath(owner) {
        this.arrows = [];
        this.isCharging = false;
        SoundManager.stop('tridentCharge');
        this.chargeSpeedMultiplier = 1.0; 
        this.maxCooldown = 288;
        this.floatingTexts = [];
        this.lastOwnerHp = null;
    }
}
