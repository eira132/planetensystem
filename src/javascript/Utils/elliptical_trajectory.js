"use strict";
import { THREE } from '../three_scene.js'


class EllipticalTrajectory {
    constructor(x, y, sourceRadius, satelliteRadius, semimajorAxis, eccentricity, argumentofPeriapsis, inclination, longitudeOfAscendingNode, trueAnomaly, showOrbitalPlane){
        this.x = x;
        this.y = y;
        this.semimajorAxis = semimajorAxis;
        this.eccentricity = eccentricity;
        this.argumentofPeriapsis = argumentofPeriapsis;
        this.inclination = inclination;
        this.longitudeOfAscendingNode = longitudeOfAscendingNode;
        this.trueAnomaly = trueAnomaly;
        this.showOrbitalPlane = showOrbitalPlane;
        this.gravitySource = this.createGravitySource(sourceRadius);
        this.satellite = this.createSatellite(satelliteRadius);
        this.orbitalPlane = this.createOrbitalPlane();
        this.trajectory = this.initializeTrajectory();
        this.threeObject = new THREE.Group();
        this.trajectory.add(this.gravitySource);
        this.trajectory.add(this.satellite);
        this.threeObject.add(this.trajectory);
        this.setOrbitalPlaneVisibility();

        // NOT part of group, not on the orbital plane
        this.ascendingNodeVector = this.initializeAscendingNodeVector();

        // Initialize arg of periapse
        this.updateArgumentofPeriapsis(this.argumentofPeriapsis);

        // Initialize inclination and arg of longitude
        this.threeObject.rotateOnAxis(this.threeObject.up, this.inclination);
        this.threeObject.rotateOnAxis(new THREE.Vector3(0, 0, 1), this.longitudeOfAscendingNode - Math.PI/2);
        this.ascendingNodeVector.rotateOnAxis(new THREE.Vector3(0, 0, 1), this.longitudeOfAscendingNode - Math.PI/2);
    }

    get semiminorAxis(){
        return this.semimajorAxis * Math.sqrt(1 - Math.pow(this.eccentricity, 2));
    }

    get semiLatusRectum(){
        return this.semimajorAxis * (1 - Math.pow(this.eccentricity, 2));
    }

    get orbitalDistance(){
        return this.semiLatusRectum / (1 + this.eccentricity * Math.cos(this.trueAnomaly));
    }

    updateSemimajorAxis(semimajorAxis){
        this.semimajorAxis = semimajorAxis;
        this.threeObject.remove(this.trajectory);
        this.trajectory = this.initializeTrajectory();
        this.threeObject.add(this.trajectory);

        this.updateArgumentofPeriapsis(this.argumentofPeriapsis);
        this.updateInclination(this.inclination);

        this.setSourcePosition();
        this.setSatellitePosition(this.trueAnomaly);
        this.trajectory.add(this.gravitySource);
        this.trajectory.add(this.satellite);
    }

    updateEccentricity(eccentricity){
        this.eccentricity = eccentricity;
        this.threeObject.remove(this.trajectory);
        this.trajectory = this.initializeTrajectory();
        this.threeObject.add(this.trajectory);

        this.updateArgumentofPeriapsis(this.argumentofPeriapsis);
        this.updateInclination(this.inclination);

        this.setSourcePosition();
        this.setSatellitePosition(this.trueAnomaly);
        this.trajectory.add(this.gravitySource);
        this.trajectory.add(this.satellite);
    }

    updateArgumentofPeriapsis(argumentofPeriapsis){
        this.argumentofPeriapsis = argumentofPeriapsis;
        this.setTrajectoryAngleInOrbitalPlane(this.longitudeOfAscendingNode - Math.PI/2 + this.argumentofPeriapsis);
    }

    updateInclination(inclination){
        this.inclination = inclination;

        var axis = new THREE.Vector3(0, 0, 1);
        this.threeObject.setRotationFromAxisAngle(axis, this.longitudeOfAscendingNode - Math.PI/2);

        this.setAscendingNodeAngle();
        this.threeObject.rotateOnAxis(this.threeObject.up, this.inclination);
    }

    updateLongitudeOfAscendingNode(longitudeOfAscendingNode){
        this.longitudeOfAscendingNode = longitudeOfAscendingNode;

        var axis = new THREE.Vector3(0, 0, 1);
        this.threeObject.setRotationFromAxisAngle(axis, this.longitudeOfAscendingNode - Math.PI/2);

        this.setAscendingNodeAngle();
        this.threeObject.rotateOnAxis(this.threeObject.up, this.inclination);
    }

    updateTrueAnomaly(trueAnomaly){
        this.trueAnomaly = trueAnomaly;
        this.setSatellitePosition(this.trueAnomaly);
    }

    // general utilities
    setTrajectoryAngleInOrbitalPlane(targetAngle){
        var axis = new THREE.Vector3(0,0,1);
        var rotationAngle = targetAngle  - this.trajectory.rotation.z;
        this.trajectory.position.applyAxisAngle(axis, rotationAngle); // rotate the POSITION
        this.trajectory.rotateOnAxis(axis, rotationAngle); // rotate the OBJECT
    }

    setAscendingNodeAngle(){
        var axis = new THREE.Vector3(0, 0, 1);
        var ascNodeAngle = (this.inclination == 0) ? -Math.PI/2 : this.longitudeOfAscendingNode - Math.PI/2;
        this.ascendingNodeVector.setRotationFromAxisAngle(axis, ascNodeAngle);
    }

    setSourcePosition(){
        var centerX = this.semimajorAxis * this.eccentricity;
        this.gravitySource.position.set(centerX, 0, 0);
    }

    setSatellitePosition(angle){
        this.setOrbitalPositionInPlane(this.orbitalDistance, angle);
    }

    setOrbitalPositionInPlane(distance, trueAnomaly){
        var axis = new THREE.Vector3(0,0,1);
        var positionVector = new THREE.Vector3(distance, 0, 0);
        positionVector.applyAxisAngle(axis, trueAnomaly);
        this.satellite.position.set(this.semimajorAxis * this.eccentricity + positionVector.x, positionVector.y, 0);
    }

    setOrbitalPlaneVisibility(showOrbitalPlane){
        this.showOrbitalPlane = showOrbitalPlane;
        if (this.showOrbitalPlane){
            this.threeObject.add(this.orbitalPlane);
        }
        else{
            this.threeObject.remove(this.orbitalPlane);
        }
    }

    // INITIALIZATION
    createGravitySource(){
        var geometry = new THREE.SphereGeometry(3, 32, 16);
        var material = new THREE.MeshBasicMaterial({color: 0xffff00, transparent: true, opacity: 0.75});
        var sphere = new THREE.Mesh(geometry, material);
        var centerX = this.semimajorAxis * this.eccentricity;
        sphere.position.set(centerX, 0, 0);
        return sphere;
    }

    createSatellite(){
        var geometry = new THREE.SphereGeometry( 0.75, 32, 16 );
        var material = new THREE.MeshBasicMaterial({color: 0x14d4ff, transparent: false, opacity: 1});
        var sphere = new THREE.Mesh(geometry, material);

        var centerX = this.semimajorAxis * this.eccentricity;
        sphere.position.set(centerX + this.orbitalDistance, 0, 0);
        // sphere.rotateOnAxis(new THREE.Vector3(0, 0, 1), this.trueAnomaly); // rotate the OBJECT
        console.log(sphere);
        return sphere;
    }

    createOrbitalPlane(){
        var planeGeom = new THREE.PlaneGeometry(250, 250);
        var alphaMap = new THREE.TextureLoader().load('../../assets/textures/plane_alpha.png' );
        var planeCaptureMaterial = new THREE.MeshBasicMaterial({color: 0xa8ab7b, side: THREE.DoubleSide, alphaMap: alphaMap, transparent: true, opacity: 1})
        var referencePlane = new THREE.Mesh(planeGeom, planeCaptureMaterial);
        return referencePlane;
    }

    initializeTrajectory(){
        var curve = new Ellipse(this.semimajorAxis, this.semiminorAxis);

        // params
        var pathSegments = 64;
        var tubeRadius = 0.25;
        var radiusSegments = 16;
        var geometry = new THREE.TubeBufferGeometry(curve, pathSegments, tubeRadius, radiusSegments, true);
        var material = new THREE.MeshBasicMaterial({ color : 0xff0000 });
        var ellipseMesh = new THREE.Mesh( geometry, material );

        // center of ellipse at focus, appropriately shift

        var centerX = -1 * this.semimajorAxis * this.eccentricity;
        ellipseMesh.position.set(centerX, 0, 0);
        return ellipseMesh;
    }

    initializeAscendingNodeVector(){
        var curve = new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 5, 0));

        // params
        var pathSegments = 2;
        var tubeRadius = 0.15;
        var radiusSegments = 16;
        var geometry = new THREE.TubeBufferGeometry(curve, pathSegments, tubeRadius, radiusSegments, false);
        var material = new THREE.MeshBasicMaterial({ color : 0x00ff00 });
        var dirVector = new THREE.Mesh( geometry, material );
        return dirVector;
    }
}


class Ellipse extends THREE.Curve {
    constructor(semimajorAxis, semiminorAxis){
        super();
        this.semimajorAxis = semimajorAxis;
        this.semiminorAxis = semiminorAxis;
    }

    getPoint(t, optionalTarget = new THREE.Vector3()) {

        const point = optionalTarget;
        var radians = 2 * Math.PI * t;

        return new THREE.Vector3( this.semimajorAxis * Math.cos( radians ), this.semiminorAxis * Math.sin( radians ), 0);
    }
}
//
// function rotateAboutPoint(obj, point, axis, theta){
//     obj.position.sub(point); // remove the offset
//     obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
//     obj.position.add(point); // re-add the offset
//     obj.rotateOnAxis(axis, theta); // rotate the OBJECT
// }

export { EllipticalTrajectory }
