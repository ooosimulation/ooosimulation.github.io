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
// 🌟 [변경] 특정 무기 파일이 서버에 없더라도 전체 스크립트가 마비되는 현상을 완벽히 방어합니다.
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

// 🌟 [추가] 일반 웹 브라우저 테스트 중 타 무기 파일이 온전히 없는 상황이어도, 
// 시뮬레이션 기본 틀이 절대 터지지 않도록 예비 인스턴스를 바인딩하여 스타트를 보장합니다.
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

// 보스 기본 무빙 스피드를 플레이어의 1.5배 수치로 대폭 상향 주입합니다.
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

// 🌟 [변경] 모니터 가변 주사율 성능 보정 공식의 핵심이 되는 고정 주사율 타겟 세팅
const fps = 144;
const fpsInterval = 1000 / fps;
let then = performance.now();

// 🌟 [추가] 모니터 프레임과 물리 속도를 완벽히 동격으로 동기화하기 위한 현실 시간 누적 변수
let accumulator = 0;

// 디스코드 기록 연동 및 타임 트래킹용 글로벌 변수군 생성
let isGameOver = false;
let isWin = false;
let gameStartTime = 0;
let finalClearTime = 0;
let hasSharedRecord = false;
let shareStatusMessage = '';
let shareStatusTimer = 0;
let shareButtonBounds = null;

// 밀리초 단위를 mm:s.SS 형태의 깔끔한 문자열로 포맷팅하는 함수
const formatTime = ms => {
    let t = Math.floor(ms);
    let m = Math.floor(t / 60000).toString().padStart(2, '0');
    let s = Math.floor((t % 60000) / 1000).toString().padStart(2, '0');
    let msPart = Math.floor((t % 1000) / 10).toString().padStart(2, '0');
    return `${m}:${s}.${msPart}`;
};

// Node.js 멀티플레이어 서버 서버의 API로 기록을 전송하는 비동기 함수
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

// 🌟 [추가] R 키 입력을 감지했을 때 모든 개체 데이터 및 기록 스탬프를 완벽하게 재생성하는 함수
function resetGame() {
    // 1. 캐릭터 핵심 엔티티 재배치 및 무기 인스턴스 초기 연동
    player1 = new GameBall(275, 400, "#22CC44", "#0A3311", 'player', bowWeapon); 
    player1.radius = 45; player1.maxHp = 100; player1.hp = 100; 

    boss = new GameBall(275, 150, "#000000", "#555555", 'boss', witherWeapon);
    boss.radius = 60; boss.maxHp = 500; boss.hp = 500; boss.isDead = false; 

    // 2. 물리 팩터(속도, 불규칙 각도, 방향 벡터) 완전 복구
    player1.speed = playerSpeed; player1.baseSpeed = playerSpeed; player1.maxSpeed = playerSpeed;
    let newAngleP1 = Math.random() * Math.PI * 2;
    player1.dx = Math.cos(newAngleP1) * playerSpeed; player1.dy = Math.sin(newAngleP1) * playerSpeed;
    player1.angle = Math.atan2(player1.dy, player1.dx);

    boss.speed = bossSpeed; boss.baseSpeed = bossSpeed; boss.maxSpeed = bossSpeed;
    let newAngleB = Math.random() * Math.PI * 2;
    boss.dx = Math.cos(newAngleB) * bossSpeed; boss.dy = Math.sin(newAngleB) * bossSpeed;
    boss.angle = Math.atan2(boss.dy, boss.dx);

    players = [player1, boss];

    // 3. 잔여 화면 진동 및 파티클 전량 소거
    if (EffectManager) {
        EffectManager.particles = [];
        EffectManager.hitStopTimer = 0;
    }

    // 4. 타이머 및 디스코드 기록 연동 변수 정밀 초기화
    isGameOver = false;
    isWin = false;
    hasSharedRecord = false;
    shareStatusMessage = '';
    shareStatusTimer = 0;
    shareButtonBounds = null;

    // 5. 즉시 READY 상태(120프레임 카운트다운) 재진입
    startDelayTimer = 120; 
    then = performance.now();
    accumulator = 0;
}

// ==========================================
// WASD 키보드 입력 및 대시 마우스 클릭 입력 감지용 상태 변수와 독립 리스너
// ==========================================
const keysPressed = { w: false, a: false, s: false, d: false };

window.addEventListener('keydown', function(e) {
    if (!isStarted) return;
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        keysPressed[key] = true;
        
        // 키가 눌렸을 때 해당 방향키 인터페이스 요소에 'active' 클래스를 붙여 불을 켭니다.
        if (keyElements[key]) {
            keyElements[key].classList.add("active");
        }
    }
});

window.addEventListener('keyup', function(e) {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        keysPressed[key] = false;
        
        // 키를 뗐을 때 해당 방향키 인터페이스 요소에서 'active' 클래스를 제거해 불을 끕니다.
        if (keyElements[key]) {
            keyElements[key].classList.remove("active");
        }
    }
});

// 마우스 왼쪽 클릭 시 대시 기능 연결 및 결과창 버튼 클릭 감지 통합
fgCanvas.addEventListener('mousedown', function(e) {
    if (!isStarted || e.button !== 0) return;

    // 게임 종료 후 클리어 상태일 때 버튼 클릭 좌표 판정
    if (isGameOver && isWin && shareButtonBounds && !hasSharedRecord) {
        const rect = fgCanvas.getBoundingClientRect();
        const scaleX = fgCanvas.width / rect.width;
        const scaleY = fgCanvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        if (mx >= shareButtonBounds.x && mx <= shareButtonBounds.x + shareButtonBounds.w &&
            my >= shareButtonBounds.y && my <= shareButtonBounds.y + shareButtonBounds.h) {
            shareRecordToDiscord();
            return; // 클릭 처리가 완료되면 아래 대시 로직을 바이패스
        }
    }

    if (player1.isDead) return;
    if (player1.triggerDash) {
        player1.triggerDash(keysPressed);
    }
});

// ==========================================
// 수동 마우스 클릭 트리거를 제거하고 실시간 조준 좌표 추적 기능만 보존
// ==========================================
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

    // 🌟 [추가] 과도한 비정상 연산 버퍼 현상을 막기 위해 최대 보정치를 제한 (예제 코드의 if (deltaTime > 250)과 동일 역할)
    if (elapsed > 250) elapsed = 250;
    
    // 🌟 [추가] 현실 세계에서 흘러간 실제 시간을 누적 타이머 버퍼에 계속 더함
    accumulator += elapsed;

    // 🌟 [변경] 모니터 주사율에 상관없이 고정된 물리 루프를 독립적으로 성립시키는 'while' 루프 처리 구조 주입
    while (accumulator >= fpsInterval) {

        if (EffectManager.hitStopTimer > 0) {
            EffectManager.hitStopTimer--;
        } else {
            if (startDelayTimer > 0) {
                startDelayTimer--;
                if (startDelayTimer === 0) gameStartTime = performance.now();
            } else if (!isGameOver) {
                if (boss.isDead || player1.isDead) {
                    isGameOver = true;
                    isWin = boss.isDead && !player1.isDead;
                    finalClearTime = performance.now() - gameStartTime;
                }

                // 보스 실시간 물리 가속 수치를 플레이어의 1.5배 속도(playerSpeed * 1.5)로 확실히 갱신 및 보존합니다.
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

        // 🌟 [추가] 고정 프레임 공식 한 판이 돌 때마다 누적 버퍼에서 타겟 간격만큼 정확하게 차감
        accumulator -= fpsInterval;
    }

    // =========================================================================
    // 🌟 여기서부터는 물리 연산과 완벽히 분리되어 모니터 주사율에 부드럽게 맞춰지는 화면 드로잉(Render) 영역입니다.
    // =========================================================================
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);

    // 화면 흔들림 제어 (드로잉 전용 갱신)
    if (EffectManager.hitStopTimer > 0) {
        let shakeAmt = Math.min(EffectManager.hitStopTimer, 12) * 1.5;
        let sx = (Math.random() - 0.5) * shakeAmt;
        let sy = (Math.random() - 0.5) * shakeAmt;
        wrapperDom.style.transform = `translate(${sx}px, ${sy}px)`;
    } else {
        wrapperDom.style.transform = `translate(0px, 0px)`;
    }

    // 플레이어가 실제 대시 스킬 사용 중일 때 DASH 키캡의 불을 실시간으로 켬 (반투명 해제)
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
        fgCtx.fillStyle = "rgba(0, 0, 0, 0.4)";
        fgCtx.fillRect(0, 0, fgCanvas.width, fgCanvas.height);
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

    // 인게임 화면 내부 상단에 실시간 경과 타임 레이아웃 드로잉
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

    // 게임 종료 조건(클리어/게임오버) 만족 시 화면에 오버레이 및 상호작용 UI 생성
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

            // 디스코드 기록 전송 전용 그래픽 인터랙티브 박스 좌표 설정
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

// 🌟 [변경] 최초 가동 스페이스바 감지 리스너에 'R' 키 리셋 분기점을 유연하게 추가 결합
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

    // 🌟 [추가] 인게임 가동 중(isStarted)일 때 'R' 키를 누르면 언제든지 리셋 연쇄 반응 가동
    if (e.key.toLowerCase() === 'r') {
        if (isStarted) {
            if (startOverlay) startOverlay.style.display = "none";
            SoundManager.init();
            resetGame();
        }
    }
});

// 시작 오버레이 클릭 시 마우스 인터랙션으로도 가동할 수 있도록 이벤트 추가 바인딩
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
