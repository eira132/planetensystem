import * as THREE from 'three'
let orbit = require('orbit')

export default class {
    /**
     * Constructor
     */
    constructor(time = new Date('now'), elements = null, ecliptic = null, spherical = null) {
        this.time = time
        this.elements = elements
        this.ecliptic = ecliptic
        this.spherical = spherical
    }

    updateTime(time) {
        this.time = time
    }

    createOrbitCircleMesh(planet) {
        var segmentCount = 32,
            radius = 100,
            geometry = new THREE.Geometry(),
            material = new THREE.LineBasicMaterial({ color: 0xFFFFFF });

        for (var i = 0; i <= segmentCount; i++) {
            var theta = (i / segmentCount) * Math.PI * 2;
            geometry.vertices.push(
                new THREE.Vector3(
                    Math.cos(theta) * radius,
                    Math.sin(theta) * radius,
                    0));
        }

        scene.add(new THREE.Line(geometry, material));
    }
}