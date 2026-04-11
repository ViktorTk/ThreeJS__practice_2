import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Stats from 'three/addons/libs/stats.module.js'

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js'
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js'
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js'

// // Отображение FPS
const stats = new Stats()
document.body.appendChild(stats.dom)

// // Настройки
const config = {
  shadows: {
    resolution: 2048,
    normalBias: 0.05,
  },
  lighting: {
    ambientIntensity: 0.4,
    directionalIntensity: 1.75,
    directionalPosition: [5, 10, 7],
  },
  camera: {
    fov: 60,
    position: [4, 4, 8],
    near: 0.1,
    far: 1000,
  },
  materials: {
    roughness: 0.7,
    metalness: 0,
  },
}

// // Работа со сценой
const scene = new THREE.Scene()

// загрузчик
const loader = new GLTFLoader()

const processModel = (gltf) => {
  gltf.scene.rotation.y = Math.PI / 2

  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({
        map: child.material.map,
        color: child.material.color,
        transparent: child.material.transparent,
        opacity: child.material.opacity,
        alphaMap: child.material.alphaMap,
        roughness: 0.7,
        metalness: 0,
      })
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  scene.add(gltf.scene)
}

loader.load(
  '../models/scene.glb',
  processModel,
  (progress) => {},
  (error) => {},
)

// освещение
scene.add(new THREE.AmbientLight('#fff', config.lighting.ambientIntensity))

const directionalLight = new THREE.DirectionalLight(
  '#fff',
  config.lighting.directionalIntensity,
)
directionalLight.position.set(...config.lighting.directionalPosition)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = config.shadows.resolution
directionalLight.shadow.mapSize.height = config.shadows.resolution
directionalLight.shadow.normalBias = config.shadows.normalBias
directionalLight.shadow.camera.far = 50
scene.add(directionalLight)

// фон сцены

function createSkyGradient() {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 0, 256)
  gradient.addColorStop(0, '#0038a8')
  gradient.addColorStop(1, '#66a3ff')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1, 256)

  return canvas
}

const gradientTexture = new THREE.CanvasTexture(createSkyGradient())
scene.background = gradientTexture

// камера
const camera = new THREE.PerspectiveCamera(
  config.camera.fov,
  window.innerWidth / window.innerHeight,
  config.camera.near,
  config.camera.far,
)

camera.position.set(...config.camera.position)

const renderer = new THREE.WebGLRenderer({
  // antialias: true,
  powerPreference: 'high-performance',
  depth: true,
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.physicallyCorrectLights = true
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(window.innerWidth, window.innerHeight)

document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
// отключаем ручное управление камерой
controls.enableRotate = false
controls.enableZoom = false
controls.enablePan = false

const mouse = { x: 0, y: 0 }
const targetCamera = {
  x: 0,
  y: 0,
  z: 0,
  offsetX: 1.5,
  offsetY: 3,
  offsetZ: 0,
}

// // Работа с эффектами

// scene.fog = new THREE.Fog('#fff', 1, 8)

const composer = new EffectComposer(renderer)

const renderPass = new RenderPass(scene, camera)
composer.addPass(renderPass)

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5,
  1,
  0.4,
)
composer.addPass(bloomPass)

// // Дополнительная обработка сглаживания
const fxaaPass = new ShaderPass(FXAAShader)
fxaaPass.material.uniforms['resolution'].value.set(
  1 / (window.innerWidth * renderer.getPixelRatio()),
  1 / (window.innerHeight * renderer.getPixelRatio()),
)
composer.addPass(fxaaPass)

const outputPass = new OutputPass()
composer.addPass(outputPass)

// // Цикличная функция анимации
const animate = () => {
  requestAnimationFrame(animate)

  stats.begin()

  targetCamera.x = targetCamera.offsetX + 5 * Math.cos(mouse.x * Math.PI * 0.3)
  targetCamera.y = targetCamera.offsetY + 2 * mouse.y * 1.25
  targetCamera.z = targetCamera.offsetZ + 5 * Math.sin(mouse.x * Math.PI * 0.3)

  camera.position.lerp(
    new THREE.Vector3(targetCamera.x, targetCamera.y, targetCamera.z),
    0.045,
  )

  controls.update()

  // renderer.render(scene, camera)
  composer.render()

  stats.end()
}

animate()

// // // Смещение камеры в зависимости от положения курсора
// document.addEventListener('mousemove', (e) => {
//   mouse.x = (e.clientX / window.innerWidth) * 2 - 1
//   mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
// })

// // // Смещение источника освещения в зависимости от положения курсора
// document.addEventListener('mousemove', (e) => {
//   const mouseX = (e.clientX / window.innerWidth) * 2 - 1
//   const mouseY = -(e.clientY / window.innerHeight) * 2 + 1
//   directionalLight.position.x = mouseX * 10
//   directionalLight.position.y = mouseY * 10
// })

// // Корректное изменение размеров canvas в зависимости от изменений окна браузера
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)

  fxaaPass.material.uniforms['resolution'].value.set(
    1 / (window.innerWidth * renderer.getPixelRatio()),
    1 / (window.innerHeight * renderer.getPixelRatio()),
  )
})

document.querySelectorAll('.position').forEach((button) => {
  button.addEventListener('click', () => {
    const position = button.dataset.position.split(', ').map(Number)

    targetCamera.offsetX = position[0]
    targetCamera.offsetY = position[1]
    targetCamera.offsetZ = position[2]
  })
})
