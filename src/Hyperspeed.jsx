import { useEffect, useRef } from "react";
import * as THREE from "three";

const defaultOptions = {
  onSpeedUp: () => {},
  onSlowDown: () => {},
  distortion: {
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: 0 },
    },
    getDistortion: `
      vec3 getDistortion(float progress) {
        return vec3(
          sin(progress * PI * 2.0 - uTime * 0.5) * 0.15,
          cos(progress * PI * 2.0 - uTime * 0.5) * 0.15,
          0.0
        );
      }
    `,
  },
  length: 400,
  roadWidth: 9,
  islandWidth: 2,
  lanesPerRoad: 3,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 50,
  lightPairsPerRoadWay: 50,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5],
  lightStickHeight: [1.3, 1.7],
  movingAwaySpeed: [60, 80],
  movingCloserSpeed: [-120, -160],
  carLightsLength: [400 * 0.05, 400 * 0.15],
  carLightsRadius: [0.05, 0.14],
  carWidthPercentage: [0.3, 0.5],
  carShiftX: [-0.8, 0.8],
  carFloorSeparation: [0.05, 1],
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0xffffff,
    brokenLines: 0xffffff,
    leftCars: [0xff102a, 0xeb383e, 0xff102a],
    rightCars: [0xfafafa, 0xf4f4f4, 0xfafafa],
    sticks: 0xfafafa,
  },
};

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

class CarLights {
  constructor(webgl, options, colors, speed, fade) {
    this.webgl = webgl;
    this.options = options;
    this.colors = colors;
    this.speed = speed;
    this.fade = fade;
  }

  init() {
    const options = this.options;
    const curve = new THREE.LineCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1)
    );
    const geometry = new THREE.TubeGeometry(curve, 40, 1, 8, false);

    const instanced = new THREE.InstancedBufferGeometry().copy(geometry);
    instanced.instanceCount = options.lightPairsPerRoadWay * 2;

    const laneWidth = options.roadWidth / options.lanesPerRoad;

    const aOffset = [];
    const aMetrics = [];
    const aColor = [];

    for (let i = 0; i < options.lightPairsPerRoadWay; i++) {
      const width =
        THREE.MathUtils.randFloat(
          options.carLightsRadius[0],
          options.carLightsRadius[1]
        ) * options.carWidthPercentage[THREE.MathUtils.randInt(0, 1)];
      const height = THREE.MathUtils.randFloat(
        options.carLightsRadius[0],
        options.carLightsRadius[1]
      );
      const length = THREE.MathUtils.randFloat(
        options.carLightsLength[0],
        options.carLightsLength[1]
      );
      const laneIndex = THREE.MathUtils.randInt(0, options.lanesPerRoad - 1);
      const laneX =
        laneIndex * laneWidth -
        options.roadWidth / 2 +
        laneWidth / 2 +
        THREE.MathUtils.randFloat(
          -options.carWidthPercentage[0],
          options.carWidthPercentage[1]
        ) *
          laneWidth;
      const carLane = laneX;
      const shiftX =
        THREE.MathUtils.randFloat(
          options.carShiftX[0],
          options.carShiftX[1]
        ) * width;
      const offsetX = carLane + shiftX;
      const offsetY = THREE.MathUtils.randFloat(
        options.carFloorSeparation[0],
        options.carFloorSeparation[1]
      ) + height;
      const offsetZ = THREE.MathUtils.randFloat(0, options.length);

      aOffset.push(offsetX, -offsetX);
      aOffset.push(offsetY, offsetY);
      aOffset.push(-offsetZ, -offsetZ);

      aMetrics.push(width, height, length, width, height, length);

      const color = new THREE.Color(
        this.colors[THREE.MathUtils.randInt(0, this.colors.length - 1)]
      );
      aColor.push(color.r, color.g, color.b);
      aColor.push(color.r, color.g, color.b);
    }

    instanced.setAttribute(
      "aOffset",
      new THREE.InstancedBufferAttribute(new Float32Array(aOffset), 3, false)
    );
    instanced.setAttribute(
      "aMetrics",
      new THREE.InstancedBufferAttribute(new Float32Array(aMetrics), 3, false)
    );
    instanced.setAttribute(
      "aColor",
      new THREE.InstancedBufferAttribute(new Float32Array(aColor), 3, false)
    );

    const material = new THREE.ShaderMaterial({
      fragmentShader: `
        varying vec3 vColor;
        varying float vProgress;
        uniform float uFade;
        void main() {
          float fade = smoothstep(0.0, uFade, vProgress) * smoothstep(1.0, 1.0 - uFade, vProgress);
          gl_FragColor = vec4(vColor, fade);
        }
      `,
      vertexShader: `
        attribute vec3 aOffset;
        attribute vec3 aMetrics;
        attribute vec3 aColor;
        uniform float uTime;
        uniform float uSpeed;
        uniform float uTravelLength;
        varying vec3 vColor;
        varying float vProgress;
        void main() {
          vec3 transformed = position.xyz;
          float radius = aMetrics.r;
          float depthLength = aMetrics.g;
          float progress = mod(aOffset.z + (-uTime * uSpeed), uTravelLength) / uTravelLength;
          transformed.z = transformed.z * depthLength - progress * uTravelLength;
          transformed.xy *= radius;
          transformed.xy += aOffset.xy;
          vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          vColor = aColor;
          vProgress = progress;
        }
      `,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: this.speed,
        uTravelLength: { value: options.length },
        uFade: { value: this.fade },
      },
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(instanced, material);
    this.mesh.frustumCulled = false;
  }

  update(time) {
    this.mesh.material.uniforms.uTime.value = time;
  }
}

class LightsSticks {
  constructor(webgl, options) {
    this.webgl = webgl;
    this.options = options;
  }

  init() {
    const options = this.options;
    const geometry = new THREE.PlaneGeometry(1, 1);
    const instanced = new THREE.InstancedBufferGeometry().copy(geometry);
    instanced.instanceCount = options.totalSideLightSticks;

    const aOffset = [];
    const aColor = [];
    const aMetrics = [];

    for (let i = 0; i < options.totalSideLightSticks; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const offsetX =
        side * (options.roadWidth / 2 + options.islandWidth / 2);
      const offsetY = 0;
      const offsetZ = (i / 2) * (options.length / (options.totalSideLightSticks / 2));
      aOffset.push(offsetX, offsetY, offsetZ);

      const width = THREE.MathUtils.randFloat(
        options.lightStickWidth[0],
        options.lightStickWidth[1]
      );
      const height = THREE.MathUtils.randFloat(
        options.lightStickHeight[0],
        options.lightStickHeight[1]
      );
      aMetrics.push(width, height);

      const color = new THREE.Color(options.colors.sticks);
      aColor.push(color.r, color.g, color.b);
    }

    instanced.setAttribute(
      "aOffset",
      new THREE.InstancedBufferAttribute(new Float32Array(aOffset), 3, false)
    );
    instanced.setAttribute(
      "aColor",
      new THREE.InstancedBufferAttribute(new Float32Array(aColor), 3, false)
    );
    instanced.setAttribute(
      "aMetrics",
      new THREE.InstancedBufferAttribute(new Float32Array(aMetrics), 2, false)
    );

    const material = new THREE.ShaderMaterial({
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(vColor, 1.0);
        }
      `,
      vertexShader: `
        attribute vec3 aOffset;
        attribute vec3 aColor;
        attribute vec2 aMetrics;
        uniform float uTime;
        uniform float uSpeed;
        uniform float uTravelLength;
        varying vec3 vColor;
        void main() {
          vec3 transformed = position.xyz;
          transformed.xy *= aMetrics;
          float progress = mod(aOffset.z - uTime * uSpeed, uTravelLength);
          transformed.z += progress;
          transformed.x += aOffset.x;
          transformed.y += aOffset.y;
          vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          vColor = aColor;
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 0 },
        uTravelLength: { value: options.length },
      },
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(instanced, material);
    this.mesh.frustumCulled = false;
  }

  update(time) {
    this.mesh.material.uniforms.uTime.value = time;
  }
}

class Road {
  constructor(webgl, options) {
    this.webgl = webgl;
    this.options = options;
  }

  init() {
    const options = this.options;
    const segments = 100;
    const geometry = new THREE.PlaneGeometry(
      options.roadWidth,
      options.length,
      20,
      segments
    );

    const material = new THREE.ShaderMaterial({
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 uColor;
        uniform float uTime;
        uniform float uSpeed;
        uniform float uShouldersWidthPercentage;
        uniform float uBrokenLinesWidthPercentage;
        uniform float uBrokenLinesLengthPercentage;
        uniform vec3 uShouldersColor;
        uniform vec3 uBrokenLinesColor;
        uniform float uLanesPerRoad;

        void main() {
          vec2 uv = vUv;
          float brokenLineWidth = uBrokenLinesWidthPercentage / uLanesPerRoad;
          float brokenLineLen = uBrokenLinesLengthPercentage;
          
          float laneWidth = 1.0 / uLanesPerRoad;
          
          vec3 color = uColor;
          
          float shoulderWidth = uShouldersWidthPercentage;
          if (uv.x < shoulderWidth || uv.x > 1.0 - shoulderWidth) {
            color = uShouldersColor;
          } else {
            for (float i = 1.0; i < 10.0; i++) {
              if (i >= uLanesPerRoad) break;
              float laneX = i / uLanesPerRoad;
              float halfBW = brokenLineWidth * 0.5;
              if (abs(uv.x - laneX) < halfBW) {
                float scrollUv = mod(uv.y - uTime * uSpeed * 0.1, 1.0);
                float inLine = step(0.0, scrollUv) * step(scrollUv, brokenLineLen);
                if (inLine > 0.0) {
                  color = uBrokenLinesColor;
                }
              }
            }
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      uniforms: {
        uColor: { value: new THREE.Color(options.colors.roadColor) },
        uTime: { value: 0 },
        uSpeed: { value: 0 },
        uShouldersWidthPercentage: {
          value: options.shoulderLinesWidthPercentage,
        },
        uBrokenLinesWidthPercentage: {
          value: options.brokenLinesWidthPercentage,
        },
        uBrokenLinesLengthPercentage: {
          value: options.brokenLinesLengthPercentage,
        },
        uShouldersColor: {
          value: new THREE.Color(options.colors.shoulderLines),
        },
        uBrokenLinesColor: {
          value: new THREE.Color(options.colors.brokenLines),
        },
        uLanesPerRoad: { value: options.lanesPerRoad },
      },
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.z = -options.length / 2;
  }

  update(time) {
    this.mesh.material.uniforms.uTime.value = time;
  }
}

export default function Hyperspeed({ effectOptions = {} }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const animFrameRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const speedRef = useRef({ value: 1 });
  const fovRef = useRef(null);

  useEffect(() => {
    const options = { ...defaultOptions, ...effectOptions };
    const container = containerRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(options.colors.background, 1);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      options.fov,
      container.clientWidth / container.clientHeight,
      0.1,
      options.length * 2
    );
    camera.position.set(0, 4.5, -5);
    camera.lookAt(0, 4.5, -100);
    cameraRef.current = camera;
    fovRef.current = options.fov;

    // Road
    const road = new Road({ renderer, scene }, options);
    road.init();
    scene.add(road.mesh);

    // Island (center divider)
    const islandGeometry = new THREE.PlaneGeometry(
      options.islandWidth,
      options.length
    );
    const islandMaterial = new THREE.MeshBasicMaterial({
      color: options.colors.islandColor,
    });
    const island = new THREE.Mesh(islandGeometry, islandMaterial);
    island.rotation.x = -Math.PI / 2;
    island.position.z = -options.length / 2;
    scene.add(island);

    // Car lights
    const leftCarLights = new CarLights(
      { renderer, scene },
      options,
      options.colors.leftCars,
      speedRef.current,
      options.carLightsFade
    );
    leftCarLights.init();
    scene.add(leftCarLights.mesh);

    const rightCarLights = new CarLights(
      { renderer, scene },
      options,
      options.colors.rightCars,
      speedRef.current,
      options.carLightsFade
    );
    rightCarLights.init();
    scene.add(rightCarLights.mesh);

    // Light sticks
    const lightSticks = new LightsSticks({ renderer, scene }, options);
    lightSticks.init();
    scene.add(lightSticks.mesh);

    // Fog
    scene.fog = new THREE.FogExp2(options.colors.background, 0.005);

    // Animation
    let time = 0;
    let currentSpeed = 1;
    const targetSpeed = options.speedUp;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      time += delta;

      currentSpeed = THREE.MathUtils.lerp(currentSpeed, targetSpeed, delta * 0.5);
      speedRef.current.value = currentSpeed;

      if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      }

      const targetFov = options.fovSpeedUp;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 0.3);
      camera.updateProjectionMatrix();

      road.update(time);
      leftCarLights.update(time);
      rightCarLights.update(time);
      lightSticks.update(time);

      lightSticks.mesh.material.uniforms.uSpeed.value = currentSpeed;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", overflow: "hidden" }}
    />
  );
}
