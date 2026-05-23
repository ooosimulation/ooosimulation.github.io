// src/weapons/BaseWeapon.js

export default class BaseWeapon {
    constructor(name) {
        this.name = name; 
        
        // 무기가 공통 물리 엔진을 무시하고 직접 이동을 제어할지 여부
        this.overrideMovement = false;
        this.overrideWallCollision = false;
        this.overrideFriction = false;
    }

    update(owner, enemies, target, canvas) {}
    drawBackground(owner, ctx) {}
    drawForeground(owner, ctx) {}
    onDeath(owner) {}

    // 공이 벽에 부딪혔을 때 무기 로직에서 개입 (true 반환 시 기본 튕김 무시)
    onHitWall(owner, wallSide, canvas) {
        return false; 
    }
}
