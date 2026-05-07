import * as THREE from 'three'

type DisposableMaterial = THREE.Material | THREE.Material[]
type DisposableObject = THREE.Object3D & {
  geometry?: THREE.BufferGeometry
  material?: DisposableMaterial
}

export function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const disposable = child as DisposableObject

    disposable.geometry?.dispose()

    if (Array.isArray(disposable.material)) {
      disposable.material.forEach((material) => material.dispose())
    } else {
      disposable.material?.dispose()
    }
  })
}
