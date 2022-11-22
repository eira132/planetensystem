/* Sourced from https://github.com/rtoole13/OrbitalElements */
import * as THREE from 'three'

export default class EllipticalTrajectory {
    constructor(x, y, semimajorAxis, eccentricity, argumentofPeriapsis, inclination, longitudeOfAscendingNode, trueAnomaly, satellite){
        this.x = x;
        this.y = y;
        this.semimajorAxis = semimajorAxis;
        this.eccentricity = eccentricity;
        this.argumentofPeriapsis = argumentofPeriapsis;
        this.inclination = inclination;
        this.longitudeOfAscendingNode = longitudeOfAscendingNode;
        this.trueAnomaly = trueAnomaly;
        this.satellite = this.createSatellite(satellite);
        this.trajectory = this.initializeTrajectory();
        this.threeObject = new THREE.Group();
        this.trajectory.add(this.satellite);
        this.threeObject.add(this.trajectory);

        // NOT part of group, not on the orbital plane
        this.ascendingNodeVector = this.initializeAscendingNodeVector();

        // Initialize arg of periapse
        this.updateArgumentofPeriapsis(this.argumentofPeriapsis);

        // Initialize inclination and arg of longitude
        this.threeObject.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI/2)
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

    decrementTrueAnomaly(value){
        this.trueAnomaly -= value
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

    setSatellitePosition(angle){
        this.setOrbitalPositionInPlane(this.orbitalDistance, angle);
    }

    setOrbitalPositionInPlane(distance, trueAnomaly){
        var axis = new THREE.Vector3(0,0,1);
        var positionVector = new THREE.Vector3(distance, 0, 0);
        positionVector.applyAxisAngle(axis, trueAnomaly);
        this.satellite.position.set(this.semimajorAxis * this.eccentricity + positionVector.x, positionVector.y, 0);
    }

    // INITIALIZATION
    createSatellite(satellite){
        var centerX = this.semimajorAxis * this.eccentricity;
        satellite.position.set(centerX + this.orbitalDistance, 0, 0);
        // sphere.rotateOnAxis(new THREE.Vector3(0, 0, 1), this.trueAnomaly); // rotate the OBJECT
        return satellite;
    }

    initializeTrajectory(){
        var curve = new Ellipse(this.semimajorAxis, this.semiminorAxis);

        // params
        var pathSegments = 256;
        var tubeRadius = 0.1;
        var radiusSegments = 32;
        var geometry = new THREE.TubeGeometry(curve, pathSegments, tubeRadius, radiusSegments, true);
        var material = new THREE.MeshBasicMaterial({ color : 0x888888 });
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
        var geometry = new THREE.TubeGeometry(curve, pathSegments, tubeRadius, radiusSegments, false);
        var material = new THREE.MeshBasicMaterial({ color : 0xaaaaaa });
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

