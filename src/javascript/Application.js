import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer, RenderPass, EffectPass, SMAAEffect, BloomEffect, GodRaysEffect, KernelSize, OutlineEffect, BlendFunction } from 'postprocessing'
import * as dat from 'dat.gui'

import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'

import EllipticalTrajectory from './Utils/EllipticalTrajectory.js';

export default class Application
{
    /**
     * Constructor
     */
    constructor(_options)
    {
        // Options
        this.$canvas = _options.$canvas
        this.useComposer = _options.useComposer

        // Set up
        this.time = new Time()
        this.sizes = new Sizes()

        // Load resources
        this.resources = {}

        const textureList = [
            {
                id: "sunTexture",
                url: "textures/sun.jpg"
            },
            {
                id: "mercuryTexture",
                url: "textures/mercury.jpg"
            },
            {
                id: "venusTexture",
                url: "textures/venus.jpg"
            },
            {
                id: "earthTexture",
                url: "textures/earth.jpg"
            },
            {
                id: "marsTexture",
                url: "textures/mars.jpg"
            },
            {
                id: "jupiterTexture",
                url: "textures/jupiter.jpg"
            },
            {
                id: "saturnTexture",
                url: "textures/saturn.jpg"
            },
            {
                id: "saturnRingTexture",
                url: "textures/saturn ring.png"
            },
            {
                id: "uranusTexture",
                url: "textures/uranus.jpg"
            },
            {
                id: "uranusRingTexture",
                url: "textures/uranus ring.png"
            },
            {
                id: "neptuneTexture",
                url: "textures/neptune.jpg"
            },
            {
                id: "plutoTexture",
                url: "textures/pluto.jpg"
            }
        ]
        this.loadTextures(textureList).then((value) => {
            this.resources.textures = value
            this.setEnvironment()
        }).catch((error) => {
            console.error(error)
        })
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


    /**
     * Planet Generation
     */
    createPlanet(size, texture, position, ring) {
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
            ringMesh.position.x = position;
            ringMesh.rotation.x = -0.5 * Math.PI;
        }
        this.scene.add(obj);
        mesh.position.x = position;
        return {mesh, obj}
    }
    generateStandardPlanets() {
        const mercury = this.createPlanet(3.2, this.resources.textures.mercuryTexture, 28);
        const venus = this.createPlanet(5.8, this.resources.textures.venusTexture, 44);
        const earth = this.createPlanet(6, this.resources.textures.earthTexture, 62);
        /*const mars = this.createPlanet(4, this.resources.textures.marsTexture, 78);
        const jupiter = this.createPlanet(12, this.resources.textures.jupiterTexture, 100);
        const saturn = this.createPlanet(10, this.resources.textures.saturnTexture, 138, {
            innerRadius: 10,
            outerRadius: 20,
            texture: this.resources.textures.saturnRingTexture
        });
        const uranus = this.createPlanet(7, this.resources.textures.uranusTexture, 176, {
            innerRadius: 7,
            outerRadius: 12,
            texture: this.resources.textures.uranusRingTexture
        });
        const neptune = this.createPlanet(7, this.resources.textures.neptuneTexture, 200);
        const pluto = this.createPlanet(2.8, this.resources.textures.plutoTexture, 216);*/
        return {
            mercury: mercury,
            venus: venus,
            earth: earth,
            //mars: mars,
            //jupiter: jupiter,
            //saturn: saturn,
            //uranus: uranus,
            //neptune: neptune,
            //pluto: pluto
        }
    }
    createSun() {
        /*const sunGeo = new THREE.SphereGeometry(16, 30, 30);
        const sunMat = new THREE.MeshBasicMaterial({
            map: this.resources.textures.sunTexture
        });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        this.scene.add(sun);*/

		const sunMaterial = new THREE.MeshBasicMaterial({
			color: 0xffddaa,
			transparent: true,
			fog: false
		});

		const sunGeometry = new THREE.SphereGeometry(16, 32, 32);
		const sun = new THREE.Mesh(sunGeometry, sunMaterial);
		sun.frustumCulled = false;
		sun.matrixAutoUpdate = false;

        return sun
    }
    generateOrbitLines() {
        let scalingFactor = 100
        this.orbits = {}
        this.orbits.mercury = new EllipticalTrajectory(
            0,
            0,
            0.387098 * scalingFactor,
            0.205630,
            THREE.MathUtils.degToRad(29.124),
            THREE.MathUtils.degToRad(3.38),
            THREE.MathUtils.degToRad(48.331),
            0,
            this.planets.mercury.mesh
        )
        this.scene.add(this.orbits.mercury.threeObject)
        this.orbits.venus = new EllipticalTrajectory(
            0,
            0,
            0.723332 * scalingFactor,
            0.006772,
            THREE.MathUtils.degToRad(54.884),
            THREE.MathUtils.degToRad(3.86),
            THREE.MathUtils.degToRad(76.680),
            0,
            this.planets.venus.mesh
        )
        this.scene.add(this.orbits.venus.threeObject)
        this.orbits.earth = new EllipticalTrajectory(
            0,
            0,
            1.0000010178 * scalingFactor,
            0.0167086,
            THREE.MathUtils.degToRad(228.1),
            THREE.MathUtils.degToRad(7.155),
            THREE.MathUtils.degToRad(174.9),
            0,
            this.planets.earth.mesh
        )
        this.scene.add(this.orbits.earth.threeObject)
    }


    /**
     * Set environments
     */
    setEnvironment()
    {
        // Scene
        this.scene = new THREE.Scene()

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.$canvas })
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.setSize(this.sizes.viewport.width, this.sizes.viewport.height)

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            45, // fov
            window.innerWidth / window.innerHeight, // aspect ratio
            0.01, // near clipping cutoff
            10000 // far clipping cutoff
        );
        this.camera.position.set(-90, 140, 140);

        // Controls
        this.controls = new OrbitControls(this.camera, this.$canvas)
        this.controls.update()

        // Planets
        this.planets = this.generateStandardPlanets()
        this.generateOrbitLines()
        // Sun
        this.planets.sun = this.createSun()


        // Planet Selection
        const selection = [this.planets.earth.mesh]

        // Lighting
        /*const pointLight = new THREE.PointLight(0xFFFFFF, 2, 300)
        this.scene.add(pointLight)*/

		const ambientLight = new THREE.AmbientLight(0x101010);

		const mainLight = new THREE.PointLight(0xffe3b1);
		mainLight.position.set(-0.5, 3, -0.25);
		mainLight.castShadow = true;
		mainLight.shadow.bias = 0.0000125;
		mainLight.shadow.mapSize.width = 2048;
		mainLight.shadow.mapSize.height = 2048;

		if (window.innerWidth < 720) {

			mainLight.shadow.mapSize.width = 512;
			mainLight.shadow.mapSize.height = 512;

		} else if (window.innerWidth < 1280) {

			mainLight.shadow.mapSize.width = 1024;
			mainLight.shadow.mapSize.height = 1024;

		}

		this.light = mainLight;
		this.scene.add(ambientLight, mainLight);

		// Using a group here to check if matrix updates work correctly.
		const group = new THREE.Group();
		group.position.copy(this.light.position);
		group.add(this.planets.sun);


        // Composer
        this.composer = new EffectComposer(this.renderer, { depthTexture: true })

        // Passes
        this.passes = {}
        this.passes.list = []
        this.passes.updateRenderToScreen = () =>
        {
            let enabledPassFound = false

            for(let i = this.passes.list.length - 1; i >= 0; i--)
            {
                const pass = this.passes.list[i]

                if(pass.enabled && !enabledPassFound)
                {
                    pass.renderToScreen = true
                    enabledPassFound = true
                }
                else
                {
                    pass.renderToScreen = false
                }
            }
        }

        this.passes.render = new RenderPass(this.scene, this.camera)
        this.composer.addPass(this.passes.render)
        this.passes.list.push(this.passes.render)

        this.passes.bloom = new EffectPass(this.camera, new BloomEffect())
        this.passes.bloom.enabled = true
        this.composer.addPass(this.passes.bloom)
        this.passes.list.push(this.passes.bloom)

        // sun godray effect
		const godRaysEffect = new GodRaysEffect(this.camera, this.planets.sun, {
			height: 1080,
			kernelSize: KernelSize.MEDIUM,
			density: 0.96,
			decay: 0.92,
			weight: 0.3,
			exposure: 0.54,
			samples: 60,
			clampMax: 1.0
		});
        this.passes.godray = new EffectPass(this.camera, godRaysEffect)
        this.passes.godray.enabled = false
        this.composer.addPass(this.passes.godray)
        this.passes.list.push(this.passes.godray)

        // planet outlining
		const outlineEffect = new OutlineEffect(this.scene, this.camera, {
			blendFunction: BlendFunction.SCREEN,
			edgeStrength: 2.5,
			pulseSpeed: 0.0,
			visibleEdgeColor: 0xffffff,
			hiddenEdgeColor: 0x22090a,
			height: 1080,
			blur: false,
			xRay: true
		});
		outlineEffect.selection.set(selection);
        this.passes.outline = new EffectPass(this.camera, outlineEffect)
        this.passes.outline.enabled = true
        this.composer.addPass(this.passes.outline)
        this.passes.list.push(this.passes.outline)

        // smaa antialiasing
        this.passes.smaa = new EffectPass(this.camera, new SMAAEffect(this.resources.searchImage, this.resources.areaImage))
        this.passes.smaa.enabled = window.devicePixelRatio <= 1
        this.composer.addPass(this.passes.smaa)
        this.passes.list.push(this.passes.smaa)

        this.passes.updateRenderToScreen()

        // Time tick
        this.time.on('tick', () =>
        {
            // Renderer
            if(this.useComposer)
            {
                this.composer.render(this.scene, this.camera)

                //Self-rotation
                let scale = 0.1

                /*this.planets.sun.rotateY(0.004 * scale);
                this.planets.mercury.mesh.rotateY(0.004 * scale);
                this.planets.venus.mesh.rotateY(0.002 * scale);
                this.planets.earth.mesh.rotateY(0.02 * scale);
                this.planets.mars.mesh.rotateY(0.018 * scale);
                this.planets.jupiter.mesh.rotateY(0.04 * scale);
                this.planets.saturn.mesh.rotateY(0.038 * scale);
                this.planets.uranus.mesh.rotateY(0.03 * scale);
                this.planets.neptune.mesh.rotateY(0.032 * scale);
                this.planets.pluto.mesh.rotateY(0.008 * scale);

                //Around-sun-rotation
                this.planets.mercury.obj.rotateY(0.04 * scale);
                this.planets.venus.obj.rotateY(0.015 * scale);
                this.planets.earth.obj.rotateY(0.01 * scale);
                this.planets.mars.obj.rotateY(0.008 * scale);
                this.planets.jupiter.obj.rotateY(0.002 * scale);
                this.planets.saturn.obj.rotateY(0.0009 * scale);
                this.planets.uranus.obj.rotateY(0.0004 * scale);
                this.planets.neptune.obj.rotateY(0.0001 * scale);
                this.planets.pluto.obj.rotateY(0.00007 * scale);*/
                this.orbits.mercury.decrementTrueAnomaly(0.04 * scale)
                this.orbits.venus.decrementTrueAnomaly(0.015 * scale)
                this.orbits.earth.decrementTrueAnomaly(0.01 * scale)
            }
            else
            {
                this.renderer.render(this.scene, this.camera)
            }
        })

        // Resize event
        this.sizes.on('resize', () =>
        {
            this.camera.aspect = this.sizes.viewport.width / this.sizes.viewport.height
            this.camera.updateProjectionMatrix()

            this.renderer.setSize(this.sizes.viewport.width, this.sizes.viewport.height)

            if(this.useComposer)
            {
                for(const _pass of this.passes.list)
                {
                    if(_pass.setSize)
                    {
                        _pass.setSize(this.sizes.viewport.width, this.sizes.viewport.height)
                    }
                }
                this.composer.setSize(this.sizes.viewport.width, this.sizes.viewport.height)
            }
        })
    }


    /**
     * Set debug
     */
    setDebug()
    {
        this.debug = new dat.GUI()

        /*this.debug.add(this.suzanne.scale, 'x', 0.01, 10, 0.001)
        this.debug.add(this.suzanne.scale, 'y', 0.01, 10, 0.001)
        this.debug.add(this.suzanne.scale, 'z', 0.01, 10, 0.001)*/
    }

    /**
     * Destructor
     */
    destructor()
    {
        this.time.off('tick')
        this.sizes.off('resize')

        this.controls.dispose()
        this.renderer.dispose()
        this.composer.dispose()
        this.debug.destroy()
    }
}
