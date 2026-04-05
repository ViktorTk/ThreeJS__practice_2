import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Stats from 'three/addons/libs/stats.module.js'

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js'
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
    directionalIntensity: 2,
    directionalPosition: [5, 10, 7],
  },
  camera: {
    fov: 60,
    position: [0, 0, 0],
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

const camera = new THREE.PerspectiveCamera(
  config.camera.fov,
  window.innerWidth / window.innerHeight,
  config.camera.near,
  config.camera.far,
)

camera.position.set(...config.camera.position)

const renderer = new THREE.WebGLRenderer({
  antialias: true,
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

// // Цикличная функция анимации
const animate = () => {
  requestAnimationFrame(animate)

  stats.begin()

  renderer.render(scene, camera)

  stats.end()
}

animate()

// // Корректное изменение размеров canvas в зависимости от изменений окна браузера
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
})
