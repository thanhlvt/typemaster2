import * as THREE from 'three';

export class PlayerShip {
  readonly group: THREE.Group;
  private baseY: number;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x66c2ff,
      metalness: 0.8,
      roughness: 0.18,
      emissive: 0x0c2a6e,
      emissiveIntensity: 0.8,
    });

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x2266dd,
      metalness: 0.7,
      roughness: 0.28,
      emissive: 0x061836,
      emissiveIntensity: 0.7,
    });

    const cockpitMat = new THREE.MeshStandardMaterial({
      color: 0x00ffee,
      emissive: 0x00bbcc,
      emissiveIntensity: 1.4,
      roughness: 0.05,
      metalness: 0.3,
    });

    const podMat = new THREE.MeshStandardMaterial({
      color: 0x1a3a8a,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x08103a,
    });

    const engineGlowMat = new THREE.MeshBasicMaterial({ color: 0xff9933 });

    // Thân tàu chính (cylinder)
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.9, 4.2, 14), bodyMat);
    fuselage.rotation.x = Math.PI / 2;
    fuselage.position.z = 0.9;

    // Mũi tàu (cone)
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.1, 4.8, 14), bodyMat);
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -3.1;

    // Buồng lái phát sáng (dome)
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 12), cockpitMat);
    cockpit.scale.set(0.82, 0.72, 1.35);
    cockpit.position.set(0, 0.95, 0.3);

    // Cánh chính
    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.28, 2.8), wingMat);
    leftWing.position.set(-3.4, -0.15, 1.3);
    leftWing.rotation.z = 0.14;
    const rightWing = leftWing.clone();
    rightWing.position.x = 3.4;
    rightWing.rotation.z = -0.14;

    // Fin đứng đầu cánh
    const finGeo = new THREE.BoxGeometry(0.15, 0.5, 2.5);
    const leftFin = new THREE.Mesh(finGeo, wingMat);
    leftFin.position.set(-5.8, -0.1, 2.0);
    const rightFin = leftFin.clone();
    rightFin.position.x = 5.8;

    // Pod động cơ
    const podGeo = new THREE.CylinderGeometry(0.46, 0.58, 2.6, 12);
    const leftPod = new THREE.Mesh(podGeo, podMat);
    leftPod.rotation.x = Math.PI / 2;
    leftPod.position.set(-2.1, -0.45, 2.1);
    const rightPod = leftPod.clone();
    rightPod.position.x = 2.1;

    // Glow động cơ (sphere phát sáng)
    const glowGeo = new THREE.SphereGeometry(0.44, 12, 12);
    const leftGlow = new THREE.Mesh(glowGeo, engineGlowMat);
    leftGlow.position.set(-2.1, -0.45, 3.5);
    const rightGlow = leftGlow.clone();
    rightGlow.position.x = 2.1;

    // Đèn động cơ
    const leftLight = new THREE.PointLight(0xff8833, 50, 18);
    leftLight.position.copy(leftGlow.position);
    const rightLight = new THREE.PointLight(0xff8833, 50, 18);
    rightLight.position.copy(rightGlow.position);

    // Đèn buồng lái
    const cockpitLight = new THREE.PointLight(0x00eeff, 30, 14);
    cockpitLight.position.set(0, 1.4, 0);

    this.group.add(
      fuselage, nose, cockpit,
      leftWing, rightWing,
      leftFin, rightFin,
      leftPod, rightPod,
      leftGlow, rightGlow,
      leftLight, rightLight, cockpitLight,
    );
    this.group.position.set(0, 3.0, 6);
    this.baseY = this.group.position.y;
    scene.add(this.group);
  }

  get position(): THREE.Vector3 {
    return this.group.position;
  }

  get nosePosition(): THREE.Vector3 {
    return this.group.position.clone().add(new THREE.Vector3(0, 0, -4.8));
  }

  update(_dt: number, time: number) {
    this.group.position.y = this.baseY + Math.sin(time * 2) * 0.18;
    this.group.rotation.z = Math.sin(time * 1.3) * 0.06;
  }
}
