/* Sourced from https://github.com/rtoole13/OrbitalElements */
import * as THREE from 'three'

export default class EllipticalTrajectory {
    constructor(x, y, semimajorAxis, eccentricity, argumentofPeriapsis, inclination, longitudeOfAscendingNode){
        this.x = x;
        this.y = y;
        this.semimajorAxis = semimajorAxis;
        this.eccentricity = eccentricity;
        this.argumentofPeriapsis = argumentofPeriapsis;
        this.inclination = inclination;
        this.longitudeOfAscendingNode = longitudeOfAscendingNode;
        this.trajectory = this.initializeTrajectory();
        this.threeObject = new THREE.Group();
        this.threeObject.add(this.trajectory);

        // NOT part of group, not on the orbital plane
        this.ascendingNodeVector = this.initializeAscendingNodeVector();

        // Initialize arg of periapse
        //this.updateArgumentofPeriapsis(this.argumentofPeriapsis);

        // Initialize inclination and arg of longitude
        this.threeObject.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI/2)
        this.threeObject.rotateOnAxis(this.threeObject.up, this.inclination);
        this.threeObject.rotateOnAxis(new THREE.Vector3(0, 0, 1), this.longitudeOfAscendingNode - Math.PI/2);
        //this.ascendingNodeVector.rotateOnAxis(new THREE.Vector3(0, 0, 1), this.longitudeOfAscendingNode - Math.PI/2);
    }

    get semiminorAxis(){
        return this.semimajorAxis * Math.sqrt(1 - Math.pow(this.eccentricity, 2));
    }

    get semiLatusRectum(){
        return this.semimajorAxis * (1 - Math.pow(this.eccentricity, 2));
    }

    updateSemimajorAxis(semimajorAxis){
        this.semimajorAxis = semimajorAxis;
        this.threeObject.remove(this.trajectory);
        this.trajectory = this.initializeTrajectory();
        this.threeObject.add(this.trajectory);

        this.updateArgumentofPeriapsis(this.argumentofPeriapsis);
        this.updateInclination(this.inclination);
    }

    updateEccentricity(eccentricity){
        this.eccentricity = eccentricity;
        this.threeObject.remove(this.trajectory);
        this.trajectory = this.initializeTrajectory();
        this.threeObject.add(this.trajectory);

        this.updateArgumentofPeriapsis(this.argumentofPeriapsis);
        this.updateInclination(this.inclination);
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

    // INITIALIZATION
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

