// src/main.js

import GameBall from './entities/GameBall.js';
import Wither from './weapons/Wither.js'; 
import Bow from './weapons/Bow.js'; 

// 🌟 [추가] 기존에 적어두었던 가상 클래스 모형들을 안전하게 선언하여, 아래쪽에 배치된 수많은 잔여 무기 코드들이 에러를 뿜지 않도록 철저히 보존합니다.
class Creeper { constructor() { this.name = "CREEPER"; } }
class Piston { constructor() { this.name = "PISTON"; } }
class GoatHorn { constructor() { this.name = "GOAT_HORN"; } }
class Shears { constructor() { this.name = "SHEARS"; } }
class Stick { constructor() { this.name = "STICK"; } }
class Minecart { constructor() { this.name = "MINECART"; } }
class Pickaxe { constructor() { this.name = "PICKAXE"; } }
class Stonecutter { constructor() { this.name = "STONECUTTER"; } }
class EnderDragon { constructor() { this.name = "ENDER_DRAGON"; } }
class LightningRod { constructor() { this.name = "LIGHTNING_ROD"; } }
class Trident { constructor() { this.name = "TRIDENT"; } }
class Snowball { constructor() { this.name = "SNOWBALL"; } }
class Warden { constructor() { this.name = "WARDEN"; } }
class Boat { constructor() { this.name = "BOAT"; } }

// 🌟 [유지] 기존 매니저 연결 구조를 훼손 없이 그대로 이어받습니다.
import { CollisionManager, EffectManager, SoundManager } from './managers.js';

const bgCanvas = document.getElementById("bgCanvas");
const bgCtx = bgCanvas.getContext("2d");
const fgCanvas = document.getElementById("fgCanvas");
const fgCtx = fgCanvas.getContext("2d");
const startOverlay = document.getElementById("startOverlay");
const statusBar = document.getElementById("statusBar");
const wrapperDom = document.getElementById("canvasWrapper");

// 위더 단독 레이드 상단 체력바 DOM 연동 유지
const bossHpFill = document.getElementById("bossHpFill"); 

// 왼쪽 하단 인터페이스 DOM 요소 캐싱 (DASH 키캡 추가 연동)
const keyElements = {
    w: document.getElementById("key-w"),
    a: document.getElementById("key-a"),
    s: document.getElementById("key-s"),
    d: document.getElementById("key-d"),
    dash: document.getElementById("key-dash") // 대시 인터페이스 연동
};

// ==========================================
// 무기 인스턴스 생성 순서 정돈 (오류 방지 및 웹 우회 가동 안전장치 추가)
// ==========================================
let goatHornWeapon, lightningRodWeapon, enderDragonWeapon, tridentWeapon, pistonWeapon;
let pickaxeWeapon, snowballWeapon, witherWeapon, wardenWeapon, boatWeapon, bowWeapon;

try { goatHornWeapon = new GoatHorn(); } catch(e) { console.warn("GoatHorn 로드 생략"); }
try { lightningRodWeapon = new LightningRod(); } catch(e) { console.warn("LightningRod 로드 생략"); }
try { enderDragonWeapon = new EnderDragon(); } catch(e) { console.warn("EnderDragon 로드 생략"); }
try { tridentWeapon = new Trident(); } catch(e) { console.warn("Trident 로드 생략"); }
try { pistonWeapon = new Piston(); } catch(e) { console.warn("Piston 로드 생략"); }
try { pickaxeWeapon = new Pickaxe(); } catch(e) { console.warn("Pickaxe 로드 생략"); }
try { snowballWeapon = new Snowball(); } catch(e) { console.warn("Snowball 로드 생략"); }
try { witherWeapon = new Wither(); } catch(e) { console.warn("Wither 로드 완화"); }
try { wardenWeapon = new Warden(); } catch(e) { console.warn("Warden 로드 생략"); }
try { boatWeapon = new Boat(); } catch(e) { console.warn("Boat 로드 생략"); }
try { bowWeapon = new Bow(); } catch(e) { console.warn("Bow 로드 완화"); }

if (!witherWeapon) witherWeapon = { name: "WITHER", update: () => {}, drawForeground: () => {}, drawBackground: () => {} };
if (!bowWeapon) bowWeapon = { name: "BOW", update: () => {}, drawForeground: () => {}, drawBackground: () => {}, updateMousePosition: () => {} };

// ==========================================
// 활(Bow) VS 위더 보스 레이드전 세팅 유지
// ==========================================
let player1 = new GameBall(275, 400, "#22CC44", "#0A3311", 'player', bowWeapon); 
player1.radius = 45; player1.maxHp = 100; player1.hp = 100; 

let player2 = null; 

let boss = new GameBall(275, 150, "#000000", "#555555", 'boss', witherWeapon);
boss.radius = 60; 
boss.maxHp = 500; 
boss.hp = 500; 
boss.isDead = false; 

let normalSpeed = 1.719; 
let playerSpeed = 2.865;
let randomAngleP1 = Math.random() * Math.PI * 2; 
let randomAngleB = Math.random() * Math.PI * 2;

player1.speed = playerSpeed;
player1.baseSpeed = playerSpeed;
player1.maxSpeed = playerSpeed;
player1.dx = Math.cos(randomAngleP1) * playerSpeed; 
player1.dy = Math.sin(randomAngleP1) * playerSpeed;
player1.angle = Math.atan2(player1.dy, player1.dx);

let bossSpeed = playerSpeed * 1.5;
boss.speed = bossSpeed;
boss.baseSpeed = bossSpeed;
boss.maxSpeed = bossSpeed;
boss.dx = Math.cos(randomAngleB) * bossSpeed;
boss.dy = Math.sin(randomAngleB) * bossSpeed;
boss.angle = Math.atan2(boss.dy, boss.dx);

let players = [player1, boss];

let isStarted = false;
let animationId;
let startDelayTimer = 0; 

const fps = 144;
const fpsInterval = 1000 / fps;
let then = performance.now();

let accumulator = 0;

let isGameOver = false;
let isWin = false;
let gameStartTime = 0;
let finalClearTime = 0;
let hasSharedRecord = false;
let shareStatusMessage = '';
let shareStatusTimer = 0;
let shareButtonBounds = null;

const formatTime = ms => {
    let t = Math.floor(ms);
    let m = Math.floor(t / 60000).toString().padStart(2, '0');
    let s = Math.floor((t % 60000) / 1000).toString().padStart(2, '0');
    let msPart = Math.floor((t % 1000) / 10).toString().padStart(2, '0');
    return `${m}:${s}.${msPart}`;
};

async function shareRecordToDiscord() {
    if (!isGameOver || !isWin || hasSharedRecord) return;
    hasSharedRecord = true;
    shareStatusMessage = 'SHARING...';
    shareStatusTimer = 180;
    
    const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api/submit-record'
        : '/api/submit-record';

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameName: 'Bow VS Wither Raid',
                player: window.discordUserName || 'Unknown Player',
                clearTime: formatTime(finalClearTime),
                matchup: 'Bow Player VS Wither Boss',
                achievements: player1.hp === 100 ? "FLAWLESS VICTORY" : "WITHER SLAYER"
            })
        });
        const data = await response.json();
        if (data.ok) {
            shareStatusMessage = 'SHARED TO DISCORD!';
        } else {
            hasSharedRecord = false;
            shareStatusMessage = 'SHARE FAILED';
        }
    } catch (error) {
        hasSharedRecord = false;
        shareStatusMessage = 'SERVER ERROR';
    }
    shareStatusTimer = 240;
}

// 🌟 [변경] R 키 리셋 시 무기 인스턴스의 변수 데이터까지 완벽하게 태초 상태로 초기화합니다.
function resetGame() {
    // 1. 무기 모듈 자체 변수값 완벽 타일 청소 (Wither 내부 실드 오라 메모리 소거)
    if (witherWeapon) {
        witherWeapon.witherState = 'spawning';
        witherWeapon.spawnTimer = 288;
        witherWeapon.burstCount = 0;
        witherWeapon.attackCooldown = 0;
        witherWeapon.hasTransformed = false; // 절반 이하 기믹 기억 상실 처리
        witherWeapon.skulls = [];            // 화면상 잔여 머리 유도탄 제거
        witherWeapon.skeletons = [];         // 소환되어 있던 위더 스켈레톤 부하들 소멸
    }

    if (bowWeapon) {
        bowWeapon.cooldownTimer = 0;
        bowWeapon.chargeTimer = 0;
        bowWeapon.isCharging = false;
        bowWeapon.arrows = [];               // 날아가던 화살 오브젝트 완전 회수
        bowWeapon.floatingTexts = [];        // 화면에 떠있던 가속/감속 피드백 텍스트 제거
        bowWeapon.chargeSpeedMultiplier = 1.0;
    }

    // 2. 캐릭터 개체 데이터 완전히 새로 정의
    player1 = new GameBall(275, 400, "#22CC44", "#0A3311", 'player', bowWeapon); 
    player1.radius = 45; player1.maxHp = 100; player1.hp = 100; 

    boss = new GameBall(275, 150, "#000000", "#555555", 'boss', witherWeapon);
    boss.radius = 60; boss.maxHp = 500; boss.hp = 500; boss.isDead = false; 

    // 3. 방향 벡터 및 속도 스펙 완전 원상 복구
    player1.speed = playerSpeed; player1.baseSpeed = playerSpeed; player1.maxSpeed = playerSpeed;
    let newAngleP1 = Math.random() * Math.PI * 2;
    player1.dx = Math.cos(newAngleP1) * playerSpeed; player1.dy = Math.sin(newAngleP1) * playerSpeed;
    player1.angle = Math.atan2(player1.dy, player1.dx);

    boss.speed = bossSpeed; boss.baseSpeed = bossSpeed; boss.maxSpeed = bossSpeed;
    let newAngleB = Math.random() * Math.PI * 2;
    boss.dx = Math.cos(newAngleB) * bossSpeed; boss.dy = Math.sin(newAngleB) * bossSpeed;
    boss.angle = Math.atan2(boss.dy, boss.dx);

    players = [player1, boss];

    // 4. 화면 잔여 파티클 효과 완전 정돈
    if (EffectManager) {
        EffectManager.particles = [];
        EffectManager.hitStopTimer = 0;
    }

    // 5. 스탬프 변수군 정밀 리셋
    isGameOver = false;
    isWin = false;
    hasSharedRecord = false;
    shareStatusMessage = '';
    shareStatusTimer = 0;
    shareButtonBounds = null;

    startDelayTimer = 120; 
    then = performance.now();
    accumulator = 0;
}

const keysPressed = { w: false, a: false, s: false, d: false };

window.addEventListener('keydown', function(e) {
    if (!isStarted) return;
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        keysPressed[key] = true;
        if (keyElements[key]) {
            keyElements[key].classList.add("active");
        }
    }
});

window.addEventListener('keyup', function(e) {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        keysPressed[key] = false;
        if (keyElements[key]) {
            keyElements[key].classList.remove("active");
        }
    }
});

fgCanvas.addEventListener('mousedown', function(e) {
    if (!isStarted || e.button !== 0) return;

    if (startDelayTimer > 0) return;

    if (isGameOver && isWin && shareButtonBounds && !hasSharedRecord) {
        const rect = fgCanvas.getBoundingClientRect();
        const scaleX = fgCanvas.width / rect.width;
        const scaleY = fgCanvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        if (mx >= shareButtonBounds.x && mx <= shareButtonBounds.x + shareButtonBounds.w &&
            my >= shareButtonBounds.y && my <= shareButtonBounds.y + shareButtonBounds.h) {
            shareRecordToDiscord();
            return;
        }
    }

    if (player1.isDead) return;
    if (player1.triggerDash) {
        player1.triggerDash(keysPressed);
    }
});

fgCanvas.addEventListener('mousemove', function(e) {
    if (!isStarted || player1.isDead) return;
    const rect = fgCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    if (player1.weapon && player1.weapon.updateMousePosition) {
        player1.weapon.updateMousePosition(mx, my);
    }
});


function updateStatusBar() {
    let hpFormat = p => (!p || p.isDead) ? "<span style='color:#555'>DEAD</span>" : Math.ceil(Math.max(p.hp, 0));
    let dmgFormat = p => p ? Math.floor(p.damageDealt || 0) : 0;
    
    let getStatusTags = p => {
        if (!p) return "";
        if (p.isDead) return "<span style='color:#555'>[DEAD]</span>";
        let tags = "";
        
        if (p.freezeTimer > 0) tags += "<span style='color:#88CCFF; font-weight:bold;'>[FROZEN]</span> ";
        
        if (p.weapon) {
            if (p.weapon.name === 'WARDEN') {
                if (p.weapon.wardenState === 'charging') tags += "<span style='color:#00FFFF; font-weight:bold; animation: blink 0.2s infinite;'>[ROARING...]</span> ";
                if (p.weapon.wardenState === 'firing') tags += "<span style='color:#FFFFFF; font-weight:bold;'>[SONIC BOOM]</span> ";
            }
            else if (p.weapon.name === 'ENDER_DRAGON') {
                if (p.weapon.dragonState === 'charging') tags += "<span style='color:#FF00FF'>[CHARGING]</span> ";
                if (p.weapon.dragonState === 'swooping') tags += "<span style='color:#AA00FF'>[SWOOPING]</span> ";
                if (p.weapon.dragonState === 'breath_charging' || p.weapon.dragonState === 'breathing') tags += "<span style='color:#FF00FF; font-weight:bold;'>[BREATHING]</span> ";
            }
            else if (p.weapon.name === 'WITHER') {
                if (p.weapon.witherState === 'spawning') tags += "<span style='color:#88CCFF; font-weight:bold; animation: blink 0.5s infinite;'>[SPAWNING...]</span> ";
                if (p.weapon.burstCount > 0) tags += "<span style='color:#FFFFFF; font-weight:bold;'>[FIRING SKULLS]</span> ";
            }
            else if (p.weapon.name === 'LIGHTNING_ROD') {
                if (p.weapon.installState === 'installing') tags += "<span style='color:#FFFF00; font-weight:bold; animation: blink 0.2s infinite;'>[INSTALLING...]</span> ";
                if (p.weapon.charge >= p.weapon.maxCharge) tags += "<span style='color:#FFFFFF; font-weight:bold; animation: blink 0.1s infinite;'>[OVERLOAD!]</span> ";
                tags += `<span style='color:#00FFFF'>[CHARGE: ${p.weapon.charge}/${p.weapon.maxCharge}]</span> `;
            }
            else if (p.weapon.name === 'TRIDENT') {
                if (p.weapon.tridentState === 'charging') tags += "<span style='color:#FF5555'>[CHARGING TRIDENT]</span> ";
            }
            else if (p.weapon.name === 'PISTON') {
                if (p.weapon.installState === 'installing') tags += "<span style='color:#FFFF00; font-weight:bold; animation: blink 0.2s infinite;'>[INSTALLING...]</span> ";
                if (p.weapon.pistonState === 'extending' || p.weapon.pistonState === 'extended') tags += "<span style='color:#88CCFF'>[PUSHING]</span> ";
            }
            else if (p.weapon.name === 'PICKAXE') {
                if (p.weapon.isAttached) tags += "<span style='color:#FFFF00; font-weight:bold; animation: blink 0.2s infinite;'>[MINING WALL]</span> ";
                if (p.weapon.isAttachedToEnemy) tags += "<span style='color:#FF0000; font-weight:bold;'>[MINING ENEMY]</span> ";
                tags += `<span style='color:#CCCCCC'>[LV: ${p.weapon.level}]</span> `;
            }
            else if (p.weapon.name === 'SNOWBALL') {
                let dispDamage = p.weapon.currentDamage || 1;
                let dispStage = p.weapon.currentStage || 1;
                let stageText = dispStage >= 10 ? "MAX" : dispStage;

                if (p.weapon.state === 'cooldown') tags += `<span style='color:#777777'>[COOLDOWN: ${(p.weapon.cooldownTimer / 144).toFixed(1)}s]</span> `;
                else if (p.weapon.state === 'rolling') tags += `<span style='color:#FFFFFF; font-weight:bold;'>[ROLLING | DMG: ${dispDamage} | STAGE: ${stageText}]</span> `;
                else if (p.weapon.state === 'detached') tags += `<span style='color:#88CCFF'>[DETACHED | DMG: ${dispDamage} | STAGE: ${stageText}]</span> `;
            }
            else if (p.weapon.name === 'BOAT') {
                if (p.weapon.boatBoostTimer > 0) tags += "<span style='color:#22CC44; font-weight:bold;'>[DRIFTING BOOSTER]</span> ";
            }
            else if (p.weapon.name === 'BOW') {
                if (p.weapon.isCharging) {
                    let pct = Math.floor((p.weapon.chargeTimer / p.weapon.maxCharge) * 100);
                    tags += `<span style='color:#FFFF00; font-weight:bold;'>[AUTO CHARGING: ${pct}%]</span> `;
                } else if (p.weapon.cooldownTimer > 0) {
                    tags += `<span style='color:#777777'>[AUTO COOLDOWN: ${(p.weapon.cooldownTimer / 144).toFixed(1)}s]</span> `;
                } else {
                    tags += "<span style='color:#22CC44; font-weight:bold;'>[AUTO LOCKING]</span> ";
                }
            }
        }
        
        if (p.knockbackBounces > 0) tags += `<span style='color:#FF9900'>[KNOCKBACK]</span> `;
        
        return tags !== "" ? tags : "<span style='color:#FFF'>[NORMAL]</span>"; 
    };

    statusBar.innerHTML = 
        `<div class="status-hp" style="font-size: 11px;">
            <span style="color:#22CC44">Bow Player: ${hpFormat(player1)}</span> &nbsp;|&nbsp; 
            <span style="color:#CCCCCC">Wither: ${hpFormat(boss)}</span>
        </div>
        <div class="status-effects" style="margin-bottom: 2px;">
            <span style="color:#22CC44">DMG: ${dmgFormat(player1)}</span> &nbsp;|&nbsp; 
            <span style="color:#CCCCCC">DMG: ${dmgFormat(boss)}</span>
        </div>
        <div class="status-effects">
            <span style="color:#22CC44">${getStatusTags(player1)}</span> &nbsp;|&nbsp; 
            <span style="color:#CCCCCC">${getStatusTags(boss)}</span>
        </div>`;

    if (bossHpFill) {
        if (!boss.isDead) {
            bossHpFill.parentElement.style.display = "block";
            let hpPercent = Math.max(0, boss.hp / boss.maxHp) * 100;
            bossHpFill.style.width = hpPercent + "%";
        } else {
            bossHpFill.parentElement.style.display = "none";
        }
    }
}

function animate(newtime) {
    animationId = requestAnimationFrame(animate);

    let now = newtime || performance.now();
    let elapsed = now - then;
    then = now;

    if (elapsed > 250) elapsed = 250;
    
    accumulator += elapsed;

    while (accumulator >= fpsInterval) {

        if (EffectManager.hitStopTimer > 0) {
            EffectManager.hitStopTimer--;
        } else {
            if (startDelayTimer > 0) {
                startDelayTimer--;
                
                players.forEach(p => {
                    let enemies = players.filter(e => e !== p);
                    p.update(enemies, fgCanvas, null); 
                });

                player1.x = 275; player1.y = 400;
                player1.dx = 0; player1.dy = 0;
                
                boss.x = 275; boss.y = 150;
                boss.dx = 0; boss.dy = 0;

                if (startDelayTimer === 0) {
                    gameStartTime = performance.now();
                    let initAngleP1 = Math.random() * Math.PI * 2;
                    let initAngleB = Math.random() * Math.PI * 2;
                    
                    player1.dx = Math.cos(initAngleP1) * playerSpeed;
                    player1.dy = Math.sin(initAngleP1) * playerSpeed;
                    player1.angle = Math.atan2(player1.dy, player1.dx);

                    boss.dx = Math.cos(initAngleB) * (playerSpeed * 1.5);
                    boss.dy = Math.sin(initAngleB) * (playerSpeed * 1.5);
                    boss.angle = Math.atan2(boss.dy, boss.dx);
                }
            } else if (!isGameOver) {
                if (boss.isDead || player1.isDead) {
                    isGameOver = true;
                    isWin = boss.isDead && !player1.isDead;
                    finalClearTime = performance.now() - gameStartTime;
                }

                if (boss && !boss.isDead) {
                    let updatedBossSpeed = playerSpeed * 1.5;
                    boss.speed = updatedBossSpeed;
                    boss.maxSpeed = updatedBossSpeed;
                    boss.baseSpeed = updatedBossSpeed;
                }

                players.forEach(p => {
                    let enemies = players.filter(e => e !== p);
                    p.update(enemies, fgCanvas, p.team === 'player' ? keysPressed : null); 
                });
                CollisionManager.handleBodyCollisions(players, fgCanvas);

                let newlySpawned = [];
                players.forEach(p => {
                    if (p.weapon && p.weapon.newSpawns && p.weapon.newSpawns.length > 0) {
                        newlySpawned.push(...p.weapon.newSpawns);
                        p.weapon.newSpawns = []; 
                    }
                });
                if (newlySpawned.length > 0) {
                    players.push(...newlySpawned);
                }
            }
        }

        if (shareStatusTimer > 0) shareStatusTimer--;

        accumulator -= fpsInterval;
    }

    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);

    if (EffectManager.hitStopTimer > 0) {
        let shakeAmt = Math.min(EffectManager.hitStopTimer, 12) * 1.5;
        let sx = (Math.random() - 0.5) * shakeAmt;
        let sy = (Math.random() - 0.5) * shakeAmt;
        wrapperDom.style.transform = `translate(${sx}px, ${sy}px)`;
    } else {
        wrapperDom.style.transform = `translate(0px, 0px)`;
    }

    if (keyElements.dash) {
        if (player1 && !player1.isDead && player1.dashTimer > 0) {
            keyElements.dash.classList.add("active");
        } else {
            keyElements.dash.classList.remove("active");
        }
    }

    players.forEach(p => {
        if (p && !p.isDead && p.weapon && p.weapon.drawBackground) {
            bgCtx.save();
            p.weapon.drawBackground(p, bgCtx);
            bgCtx.restore();
        }
    });

    players.forEach(p => p.draw(fgCtx));
    EffectManager.updateAndDraw(fgCtx);

    if (startDelayTimer > 0) {
        fgCtx.save();
        fgCtx.fillStyle = "#FFF200";
        fgCtx.font = "900 55px 'Arial Black', sans-serif";
        fgCtx.textAlign = "center";
        fgCtx.textBaseline = "middle";
        fgCtx.lineWidth = 6;
        fgCtx.strokeStyle = "#000";
        let text = "BATTLE START!";
        fgCtx.strokeText(text, fgCanvas.width / 2, fgCanvas.height / 2);
        fgCtx.fillText(text, fgCanvas.width / 2, fgCanvas.height / 2);
        fgCtx.restore();
    }

    if (isStarted && startDelayTimer <= 0) {
        let timeText = formatTime(!isGameOver ? performance.now() - gameStartTime : finalClearTime);
        fgCtx.save();
        fgCtx.fillStyle = "rgba(255, 255, 255, 0.85)";
        fgCtx.font = "900 16px 'Arial Black', sans-serif";
        fgCtx.textAlign = "center";
        fgCtx.textBaseline = "top";
        fgCtx.strokeStyle = "#000000";
        fgCtx.lineWidth = 3;
        fgCtx.strokeText(timeText, fgCanvas.width / 2, 15);
        fgCtx.fillText(timeText, fgCanvas.width / 2, 15);
        fgCtx.restore();
    }

    if (isGameOver) {
        fgCtx.save();
        fgCtx.fillStyle = "rgba(0, 0, 0, 0.7)";
        fgCtx.fillRect(0, 0, fgCanvas.width, fgCanvas.height);
        fgCtx.textAlign = "center";
        fgCtx.textBaseline = "middle";

        if (isWin) {
            fgCtx.fillStyle = "#22CC44";
            fgCtx.font = "900 45px 'Arial Black', sans-serif";
            fgCtx.strokeStyle = "#000000";
            fgCtx.lineWidth = 4;
            fgCtx.strokeText("BOSS SLAIN!", fgCanvas.width / 2, fgCanvas.height / 2 - 55);
            fgCtx.fillText("BOSS SLAIN!", fgCanvas.width / 2, fgCanvas.height / 2 - 55);

            fgCtx.fillStyle = "#FFFFFF";
            fgCtx.font = "900 18px 'Arial Black', sans-serif";
            fgCtx.strokeText(`CLEAR TIME: ${formatTime(finalClearTime)}`, fgCanvas.width / 2, fgCanvas.height / 2 - 2);
            fgCtx.fillText(`CLEAR TIME: ${formatTime(finalClearTime)}`, fgCanvas.width / 2, fgCanvas.height / 2 - 2);

            const btnW = 210, btnH = 36;
            const btnX = fgCanvas.width / 2 - btnW / 2, btnY = fgCanvas.height / 2 + 35;
            shareButtonBounds = { x: btnX, y: btnY, w: btnW, h: btnH };

            fgCtx.fillStyle = hasSharedRecord ? "rgba(34, 204, 68, 0.25)" : "rgba(0, 150, 255, 0.3)";
            fgCtx.strokeStyle = hasSharedRecord ? "#66FFAA" : "#88CCFF";
            fgCtx.lineWidth = 3;
            fgCtx.fillRect(btnX, btnY, btnW, btnH);
            fgCtx.strokeRect(btnX, btnY, btnW, btnH);

            fgCtx.fillStyle = hasSharedRecord ? "#66FFAA" : "#88CCFF";
            fgCtx.font = "900 13px 'Arial Black', sans-serif";
            fgCtx.fillText(hasSharedRecord ? "RECORD SHARED" : "SHARE RECORD", fgCanvas.width / 2, btnY + btnH / 2);

            if (shareStatusTimer > 0 && shareStatusMessage) {
                fgCtx.fillStyle = "#FFDD00";
                fgCtx.font = "900 12px 'Arial Black', sans-serif";
                fgCtx.fillText(shareStatusMessage, fgCanvas.width / 2, btnY + btnH + 25);
            }
        } else {
            fgCtx.fillStyle = "#FF4444";
            fgCtx.font = "900 45px 'Arial Black', sans-serif";
            fgCtx.strokeStyle = "#000000";
            fgCtx.lineWidth = 4;
            fgCtx.strokeText("RAID FAILED", fgCanvas.width / 2, fgCanvas.height / 2);
            fgCtx.fillText("RAID FAILED", fgCanvas.width / 2, fgCanvas.height / 2);
        }
        fgCtx.restore();
    }

    updateStatusBar();
}

window.addEventListener('keydown', function(e) {
    if (e.code === 'Space' && !isStarted) {
        e.preventDefault(); 
        startOverlay.style.display = "none";
        isStarted = true; 
        SoundManager.init(); 
        startDelayTimer = 120; 
        
        then = performance.now(); 
        animate(performance.now()); 
        return;
    }

    if (e.key.toLowerCase() === 'r') {
        if (isStarted) {
            if (startOverlay) startOverlay.style.display = "none";
            SoundManager.init();
            resetGame();
        }
    }
});

startOverlay.addEventListener('click', function() {
    if (!isStarted) {
        startOverlay.style.display = "none";
        isStarted = true; 
        SoundManager.init(); 
        startDelayTimer = 120; 
        then = performance.now(); 
        animate(performance.now()); 
    }
});
