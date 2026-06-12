import * as THREE from 'three';

const STAR_COUNT = 1200;
const STAR_WRAP_Z = 20;
const STAR_DEPTH = 170;
const SPIN_SPEED = 0.06;   // rad/s — tốc độ quay cả trường sao

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  private stars: THREE.Points;
  private starPositions: Float32Array;
  private starColors: Float32Array;
  private starPhases: Float32Array;   // phase nhấp nháy ngẫu nhiên mỗi sao
  private starSpeeds: Float32Array;   // tốc độ nhấp nháy ngẫu nhiên mỗi sao
  private time = 0;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02030a);
    this.scene.fog = new THREE.Fog(0x02030a, 60, 130);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      300,
    );
    this.camera.position.set(0, 7, 18);
    this.camera.lookAt(0, 1, -40);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0x8899bb, 0.7);
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(5, 10, 8);
    const fill = new THREE.PointLight(0x4dd2ff, 60, 80);
    fill.position.set(0, 6, 10);
    this.scene.add(ambient, dir, fill);

    // Khởi tạo vị trí, màu, phase nhấp nháy cho từng sao
    this.starPositions = new Float32Array(STAR_COUNT * 3);
    this.starColors    = new Float32Array(STAR_COUNT * 3);
    this.starPhases    = new Float32Array(STAR_COUNT);
    this.starSpeeds    = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      this.starPositions[i * 3]     = (Math.random() - 0.5) * 160;
      this.starPositions[i * 3 + 1] = (Math.random() - 0.5) * 90;
      this.starPositions[i * 3 + 2] = STAR_WRAP_Z - Math.random() * STAR_DEPTH;
      this.starPhases[i] = Math.random() * Math.PI * 2;
      this.starSpeeds[i] = 0.8 + Math.random() * 2.4; // 0.8–3.2 Hz
      // màu ban đầu tính trong update()
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(this.starPositions, 3));
    starGeo.setAttribute('color',    new THREE.BufferAttribute(this.starColors, 3));

    this.stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        vertexColors: true,
        size: 0.32,
        transparent: true,
        opacity: 1.0,
        sizeAttenuation: true,
        fog: false,
      }),
    );
    this.scene.add(this.stars);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  update(dt: number) {
    this.time += dt;

    // Quay toàn bộ trường sao quanh trục Z
    this.stars.rotation.z += SPIN_SPEED * dt;

    for (let i = 0; i < STAR_COUNT; i++) {
      // Di chuyển về phía người chơi
      this.starPositions[i * 3 + 2] += 22 * dt;
      if (this.starPositions[i * 3 + 2] > STAR_WRAP_Z) {
        this.starPositions[i * 3 + 2] -= STAR_DEPTH;
      }

      // Nhấp nháy: brightness dao động từ ~0.15 đến 1.0
      const b = 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(
        this.time * this.starSpeeds[i] + this.starPhases[i],
      ));
      // Màu sắc: pha trộn giữa trắng (1,1,1) và xanh lạnh (0.55,0.7,1.0)
      this.starColors[i * 3]     = (0.55 + 0.45 * b) * b; // R
      this.starColors[i * 3 + 1] = (0.70 + 0.30 * b) * b; // G
      this.starColors[i * 3 + 2] = b;                      // B
    }

    this.stars.geometry.attributes.position.needsUpdate = true;
    this.stars.geometry.attributes.color.needsUpdate    = true;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
