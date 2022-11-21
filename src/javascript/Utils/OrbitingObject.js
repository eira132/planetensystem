import * as THREE from 'three'

import EllipticalTrajectory from './EllipticalTrajectory.js'

export default class OrbitingObject {
    /**
     * Constructor
     */
    constructor(time = new Date()) {
        this.time = time
    }

    updateTime(time) {
        this.time = time
    }

    createOrbitCircle(center, elements, object) {
        let {x, y} = center
        let {N, i, w, a, e, M} = elements
        i = THREE.MathUtils.degToRad(i)
        e = THREE.MathUtils.degToRad(e)
        let t = this.calculateTrueAnomaly(M, e)
        return new EllipticalTrajectory(x, y, a, e, w, i, N, 0, object)
    }

    createSSB(scene) {
        const axesHelper = new THREE.AxesHelper( 5 );
        scene.add( axesHelper );
    }

    calculateTrueAnomaly(mp, ec) {
        // compute the true anomaly of an orbit from mean anomaly using iteration
		// mp- mean anomaly in radians
		// ec- orbit eccentricity
 	
 		// initial approximation of eccentric anomaly
 		var E = mp + ec*Math.sin(mp)*(1.0 + ec*Math.cos(mp));
 	
 		// iterate to improve accuracy
 		var loop = 0;
 		while ( loop < 20 ) { //TODO: Check how many times to loop
 			var eone = E;
 			E = eone - (eone - ec*Math.sin(eone) - mp)/(1 - ec*Math.cos(eone));
 	
 			if (Math.abs( E - eone) < 0.0000007) break;
 			loop++;
 		}
 		
 		// convert eccentric anomaly to true anomaly
 		var V = 2*Math.atan2(Math.sqrt((1+ec)/(1-ec))*Math.tan(0.5*E),1);
 		// modulo 2pi
 		if (V < 0) V = V + (2 * Math.PI); 
 
 		return V;
    }

}

