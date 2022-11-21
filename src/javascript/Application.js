import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer, RenderPass, EffectPass, SMAAEffect, BloomEffect, GodRaysEffect, KernelSize, OutlineEffect, BlendFunction } from 'postprocessing'
import * as dat from 'dat.gui'

import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'

import Planets from './Utils/Planets.js';
import { LoadingManager } from 'three';


/**
 * Normalized device coordinates.
 *
 * @type {Vector2}
 * @private
 */
const ndc = new THREE.Vector2();

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
        this.planets = new Planets()

        this.date = new Date()
        this.updateInterval = 'realtime'


		/**
		 * A raycaster.
		 *
		 * @type {Raycaster}
		 * @private
		 */
		this.raycaster = null;

		/**
		 * A selected object.
		 *
		 * @type {Object3D}
		 * @private
		 */
		this.selectedObject = null;

		/**
		 * An effect.
		 *
		 * @type {Effect}
		 * @private
		 */
		this.effect = null;

        /**
         * A list of selected objects
         */
        this.selection = []

        // Bind controls
        this.bindEventListeners()

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
            },
            {
                id: "starsTexture",
                url: "textures/stars.jpg"
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
                console.log(`loading ${list[i]} at ${imgURL}`)
                loader.load(imgURL, (texture) => {
                        count++
                        textures[list[i].id] = texture
                        console.log(`loaded ${imgURL}`)
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

        // actual relative value is 108.9683
		const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
		const sun = new THREE.Mesh(sunGeometry, sunMaterial);
		sun.frustumCulled = false;
		sun.matrixAutoUpdate = false;

        return sun
    }
    /**
     * Bind event listeners
     */
    bindEventListeners() {
        document.getElementById('realtime').addEventListener('click', this.handleSpeedChange.bind(this))
        document.getElementById('hps').addEventListener('click', this.handleSpeedChange.bind(this))
        document.getElementById('dps').addEventListener('click', this.handleSpeedChange.bind(this))
        document.getElementById('mps').addEventListener('click', this.handleSpeedChange.bind(this))
        document.getElementById('yps').addEventListener('click', this.handleSpeedChange.bind(this))
        document.getElementById('Dps').addEventListener('click', this.handleSpeedChange.bind(this))
    }
    /**
     * Handler function for Mouseclicks on UI
     * @param {PointerEvent} e 
     */
    handleSpeedChange(e) {
        this.updateInterval = e.target.id
        if (!e.target.classList.contains('active')) {
            document.querySelectorAll('.active').forEach(elem => {
                elem.classList.remove('active')
            })
            e.target.classList.add('active')
        } else {
            if (e.target.id === 'realtime') {
                if (e.target.classList.contains('active')) {
                    //todo: implement pause button
                }
            }
        }
    }

	handleSelection() {
		const selection = this.effect.selection;
		const selectedObject = this.selectedObject;

		/*if(selectedObject !== null) {
			if(selection.has(selectedObject)) {
				selection.delete(selectedObject);
			} else {
				selection.add(selectedObject);
			}
		}*/
        if(selectedObject !== null) {
            if (selection.has(selectedObject)) {
                selection.clear()
            } else {
                selection.clear()
                selection.add(selectedObject)
                console.log(this.selectedObject)
            }
        }
	}

	handleEvent(event) {
		switch(event.type) {
			case "pointerdown":
				this.raycast(event);
				this.handleSelection();
				break;
		}
	}

	/**
	 * Raycasts the scene.
	 *
	 * @param {PointerEvent} event - An event.
	 */
	raycast(event) {
		const raycaster = this.raycaster;

		ndc.x = (event.clientX / window.innerWidth) * 2.0 - 1.0;
		ndc.y = -(event.clientY / window.innerHeight) * 2.0 + 1.0;

		raycaster.setFromCamera(ndc, this.camera);
		const intersects = raycaster.intersectObjects(this.scene.children, true);

		this.selectedObject = null;

		if(intersects.length > 0) {
			const object = intersects[0].object;

			if(object !== undefined) {
				this.selectedObject = object;
			}
		}
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
        //this.planets.createSSB(this.scene)
        this.orbits = this.planets.createStandardPlanets(this.scene, this.resources)
        // Sun
        this.planets.sun = this.createSun()

        // Background
        /*const textureLoader = new THREE.TextureLoader()
        const starsTexture = textureLoader.load('http://localhost:1234/textures/stars.jpg')
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        this.scene.background = cubeTextureLoader.load([
            starsTexture,
            starsTexture,
            starsTexture,
            starsTexture,
            starsTexture,
            starsTexture
        ]);*/
        console.log(this.resources)

        // Lighting
		const ambientLight = new THREE.AmbientLight(0x101010);
		//const ambientLight = new THREE.AmbientLight(0xffffff)

		const mainLight = new THREE.PointLight(0xffe3b1)
		mainLight.position.set(0, 0, 0)
		mainLight.castShadow = true
        mainLight.power = 10
		mainLight.shadow.bias = 0.0000125
		mainLight.shadow.mapSize.width = 2048
		mainLight.shadow.mapSize.height = 2048

		if (window.innerWidth < 720) {
			mainLight.shadow.mapSize.width = 512
			mainLight.shadow.mapSize.height = 512
		} else if (window.innerWidth < 1280) {
			mainLight.shadow.mapSize.width = 1024
			mainLight.shadow.mapSize.height = 1024
		}

		this.light = mainLight;
		this.scene.add(ambientLight, mainLight);

		// Using a group here to check if matrix updates work correctly.
		const group = new THREE.Group();
		group.position.copy(this.light.position);
		group.add(this.planets.sun);


        // Postprocessing effect
        this.initShaders()


        // Time tick (render loop)
        this.time.on('tick', () =>
        {
            // Renderer
            if(this.useComposer)
            {
                this.composer.render(this.scene, this.camera)

                let options = {timezone: "UTC", year: "numeric", month: "long", day: "numeric"}
                let localdate = this.date.toLocaleDateString([], options)
                let localtime = this.date.toLocaleTimeString([], {timezone: "UTC", })
                document.getElementById('datestring').innerText = localdate
                document.getElementById('timestring').innerText = localtime

                // simulation speed
                let percent = this.time.delta/1000 // percentage to the next whole division
                let current = this.date.getTime()
                let division = 1000 // real time, 1s per 1000ms
                switch(this.updateInterval) {
                    case "cps":
                        division = 3155760000000 // 1 century in ms 
                        break;
                    case "Dps":
                        division = 315576000000 // 10 years in ms
                        break;
                    case "yps":
                        division = 31557600000 // 1 year in ms
                        break;
                    case "mps":
                        division = 2629800000 // 1 month in ms
                        break;
                    case "wps":
                        division = 604800000 // 1 week in ms
                        break;
                    case "dps":
                        division = 86400000 // 1 day in ms
                        break;
                    case "hps":
                        division = 3600 * 1000 // 1 hour in ms 
                        break;
                    case "realtime":
                        division = 1000 // real time, 1s in ms
                        break;
                }
                this.date.setTime(current + division * percent)

                this.planets.updateStandardPlanets(this.date, division * percent)
                
                //this.time.stop()
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
     * Init shader passes
     */
    initShaders() {
        // Composer
        this.composer = new EffectComposer(this.renderer, { depthTexture: true })

		// Raycaster
		this.raycaster = new THREE.Raycaster();
		this.renderer.domElement.addEventListener("pointerdown", this);

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
			height: 240,
			kernelSize: KernelSize.LARGE,
			density: 0.96,
			decay: 0.92,
			weight: 0.3,
			exposure: 0.54,
			samples: 60,
			clampMax: 1.0
		});
        this.passes.godray = new EffectPass(this.camera, godRaysEffect)
        this.passes.godray.enabled = true
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
		outlineEffect.selection.set(this.selection);
		this.effect = outlineEffect;
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
