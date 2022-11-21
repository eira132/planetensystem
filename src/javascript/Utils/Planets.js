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

    createPlanet(size, texture, ring) {
        const geo = new THREE.SphereGeometry(size, 30, 30);
        const mat = new THREE.MeshPhongMaterial({
            map: texture
        });
        const mesh = new THREE.Mesh(geo, mat);
        const obj = new THREE.Object3D();
        obj.add(mesh);
        mesh.rotation.x = -Math.PI/2 
        mesh.rotation.y = -Math.PI/2 

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
            ringMesh.rotation.x = 0;
        }
        //mesh.position.x = position
        return {obj, mesh}
    }
    createOrbit(scene, planet, size, texture, ring = false) {
        this[planet] = this.createPlanet(size, texture, ring)
        let elements = orbit.computeOrbitalElementsByTime(orbit[planet], this.time)
        elements.orbitalElements.a = elements.orbitalElements.a * this.scale
        this.orbits[planet] = this.createOrbitCircle({x: 0, y: 0}, elements.orbitalElements, this[planet].obj)
        scene.add(this.orbits[planet].threeObject)
    }

    createStandardPlanets(scene, resources) {
        this.scale = 100
        this.planetScale = 1
        this.resources = resources

        this.createOrbit(scene, 'mercury', 3.2*this.planetScale, this.resources.textures.mercuryTexture)
        this.createOrbit(scene, 'venus', 5.8*this.planetScale, this.resources.textures.venusTexture)
        this.createOrbit(scene, 'earth', 6*this.planetScale, this.resources.textures.earthTexture)
        this.createOrbit(scene, 'mars', 4*this.planetScale, this.resources.textures.marsTexture)
        this.createOrbit(scene, 'jupiter', 12*this.planetScale, this.resources.textures.jupiterTexture)
        this.createOrbit(scene, 'saturn', 10*this.planetScale, this.resources.textures.saturnTexture, {
            innerRadius: 10,
            outerRadius: 20,
            texture: this.resources.textures.saturnRingTexture
        })
        this.createOrbit(scene, 'uranus', 3.2*this.planetScale, this.resources.textures.urnausTexture, {
            innerRadius: 7,
            outerRadius: 12,
            texture: this.resources.textures.uranusRingTexture
        })
        this.createOrbit(scene, 'neptune', 3.2*this.planetScale, this.resources.textures.neptuneTexture)
        return this.orbits
    }

    updatePlanetAnomaly(date, planet) {
        let v = orbit.computeTrueAnomalyByTime(orbit[planet], date)
        this.orbits[planet].updateTrueAnomaly(THREE.MathUtils.degToRad(v))
    }

}