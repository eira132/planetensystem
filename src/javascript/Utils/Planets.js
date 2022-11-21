import * as THREE from 'three'

import OrbitingObject from "./OrbitingObject";
import orbit from './OrbitalElements.js'

export default class Planets extends OrbitingObject {
    /**
     * Constructor
     */
    constructor(time = new Date()) {
        super()

        this.orbits = {}
        this.resources = {}
    }

    /**
     * Image Loader for textures
     */
    loadTextures(list) {
        return new Promise((resolve, reject) => {
            let textures = {}
            let count = 0
            let target = list.length
            for (let i = 0; i < list.length; i++) {
                // create url dependency
                const base = 'http://localhost:1234'
                let imgURL = new URL(list[i].url, base)
                // load the texture using three's loader
                let loader = new THREE.TextureLoader()
                loader.load(imgURL, (texture) => {
                        count++
                        textures[list[i].id] = texture
                        if (count === target) {
                            resolve(textures)
                        }
                    }, () => {}, (error) => {
                        reject(error)
                    }
                )
            }
        })
    }

    createPlanet(size, texture, ring) {
        const geo = new THREE.SphereGeometry(size, 30, 30);
        const mat = new THREE.MeshPhongMaterial({
            map: texture
        });
        const mesh = new THREE.Mesh(geo, mat);
        const obj = new THREE.Object3D();
        obj.add(mesh);
        if(ring) {
            const ringGeo = new THREE.RingGeometry(
                ring.innerRadius,
                ring.outerRadius,
                32);
            const ringMat = new THREE.MeshBasicMaterial({
                map: ring.texture,
                side: THREE.DoubleSide
            });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            obj.add(ringMesh);
            //ringMesh.position.x = position;
            ringMesh.rotation.x = -0.5 * Math.PI;
        }
        //mesh.position.x = position
        return {obj, mesh}
    }
    createOrbit(scene, planet, size, texture, ring = false) {
        this[planet] = this.createPlanet(size, texture, ring)
        let elements = orbit.computeOrbitalElementsByTime(orbit[planet], this.time)
        elements.orbitalElements.a = elements.orbitalElements.a * this.scale
        this.orbits[planet] = this.createOrbitCircle({x: 0, y: 0}, elements.orbitalElements, this[planet].mesh)
        scene.add(this.orbits[planet].threeObject)
    }

    createStandardPlanets(scene, resources) {
        this.scale = 100
        this.resources = resources

        this.createOrbit(scene, 'mercury', 3.2, this.resources.textures.mercuryTexture)
        this.createOrbit(scene, 'venus', 5.8, this.resources.textures.venusTexture)
        this.createOrbit(scene, 'earth', 6, this.resources.textures.earthTexture)
        this.createOrbit(scene, 'mars', 4, this.resources.textures.marsTexture)
        this.createOrbit(scene, 'jupiter', 12, this.resources.textures.jupiterTexture)
        this.createOrbit(scene, 'saturn', 10, this.resources.textures.saturnTexture, {
            innerRadius: 10,
            outerRadius: 20,
            texture: this.resources.textures.saturnRingTexture
        })
        this.createOrbit(scene, 'uranus', 3.2, this.resources.textures.urnausTexture, {
            innerRadius: 7,
            outerRadius: 12,
            texture: this.resources.textures.uranusRingTexture
        })
        this.createOrbit(scene, 'neptune', 3.2, this.resources.textures.neptuneTexture)
        return this.orbits
    }

    updatePlanetAnomaly(planet, time) {

    }

}