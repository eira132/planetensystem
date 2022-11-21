import * as THREE from 'three'

import orbitingObject from "./orbitingObject";
import orbit from './orbitalElements.js'

export default class planets extends orbitingObject {
    /**
     * Constructor
     */
    constructor(orbitScale = 100, planetScale = 5) {
        super()

        this.orbits = {}
        this.resources = {}

        this.orbitScale = orbitScale
        this.planetScale = planetScale

        /**
         * Object of the length of planet days relative to one Earth day
         */
        this.dayLength = {
            mercury: 58.646,
            venus: -243.018,
            earth: 1,
            mars: 1.026,
            jupiter: 0.4135,
            saturn: 0.444,
            urnaus: -0.718,
            neptune: 0.671
        }
    }

    createPlanet(size, tilt, texture, ring) {
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
                128);
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
        obj.rotation.x = THREE.MathUtils.degToRad(tilt)
        return {obj, mesh}
    }
    createOrbit(scene, planet, size, tilt, texture, ring = false) {
        this[planet] = this.createPlanet(size, tilt, texture, ring)
        this[planet].mesh.name = planet
        let elements = orbit.computeOrbitalElementsByTime(orbit[planet], this.time)
        elements.orbitalElements.a = elements.orbitalElements.a * this.orbitScale
        this.orbits[planet] = this.createOrbitCircle({x: 0, y: 0}, elements.orbitalElements, this[planet].obj)
        scene.add(this.orbits[planet].threeObject)
    }

    createStandardPlanets(scene, resources) {
        this.resources = resources

        this.createOrbit(scene, 'mercury', 0.3825 * this.planetScale, 0, this.resources.textures.mercuryTexture)
        this.createOrbit(scene, 'venus', 0.9488 * this.planetScale, 177.3, this.resources.textures.venusTexture)
        this.createOrbit(scene, 'earth', 1 * this.planetScale, 23.4, this.resources.textures.earthTexture)
        this.createOrbit(scene, 'mars', 0.5325 * this.planetScale, 25.2, this.resources.textures.marsTexture)
        this.createOrbit(scene, 'jupiter', 11.2092 * this.planetScale, 3.1, this.resources.textures.jupiterTexture)
        this.createOrbit(scene, 'saturn', 9.4494 * this.planetScale, 26.7, this.resources.textures.saturnTexture, {
            innerRadius: 10 * this.planetScale,
            outerRadius: 20 * this.planetScale,
            texture: this.resources.textures.saturnRingTexture
        })
        this.createOrbit(scene, 'uranus', 4.0074 * this.planetScale, 97.8, this.resources.textures.urnausTexture, {
            innerRadius: 7 * this.planetScale,
            outerRadius: 12 * this.planetScale,
            texture: this.resources.textures.uranusRingTexture
        })
        this.createOrbit(scene, 'neptune', 3.8827 * this.planetScale, 28.3, this.resources.textures.neptuneTexture)
        return this.orbits
    }

    updatePlanetAnomaly(date, planet) {
        let v = orbit.computeTrueAnomalyByTime(orbit[planet], date)
        this.orbits[planet].updateTrueAnomaly(-1 * THREE.MathUtils.degToRad(v))
    }
    /**
     * 
     * @param {String} planet a string denoting the planet
     * @param {Int} elapsedMs the amount of ms that have elapsed in the simulation
     */
    updatePlanetRotation(planet, elapsedMs) {
        const days = elapsedMs / 86400000; //convert elapsed ms to days 
        let rotations = days / this.dayLength[planet]
        this[planet].mesh.rotation.y += rotations * 5.5
    }

    updateStandardPlanets(date, elapsed) {
        this.updatePlanetAnomaly(date, 'mercury')
        this.updatePlanetRotation('mercury', elapsed)
        
        this.updatePlanetAnomaly(date, 'venus')
        this.updatePlanetRotation('venus', elapsed)

        this.updatePlanetAnomaly(date, 'earth')
        this.updatePlanetRotation('earth', elapsed)

        this.updatePlanetAnomaly(date, 'mars')
        this.updatePlanetRotation('mars', elapsed)

        this.updatePlanetAnomaly(date, 'jupiter')
        this.updatePlanetRotation('jupiter', elapsed)
        
        this.updatePlanetAnomaly(date, 'saturn')
        this.updatePlanetRotation('saturn', elapsed)

        this.updatePlanetAnomaly(date, 'uranus')
        this.updatePlanetRotation('uranus', elapsed)

        this.updatePlanetAnomaly(date, 'neptune')
        this.updatePlanetRotation('neptune', elapsed)
    }
}
