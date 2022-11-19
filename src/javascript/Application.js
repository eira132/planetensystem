import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer, RenderPass, EffectPass, SMAAEffect } from 'postprocessing'
import * as dat from 'dat.gui'

import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'

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

        const textures = [
            {
                id: "sunTexture",
                url: "/assets/textures/sun.jpg"
            },
        ]
        this.loadTextures(textures, this.setEnvironment)
    }

    /**
     * Image Loader for textures
     */
    loadTextures(textures, callback) {
        console.log('loading textures')
        let count = 0
        let target = textures.length
        for (let i = 0; i < textures.length; i++) {
            // create url dependency
            const base = 'http://localhost:1234'
            let imgURL = new URL(textures[i].url, base)
            // load the texture using three's loader
            let loader = new THREE.TextureLoader()
            console.log(imgURL)
            loader.load(imgURL, (texture) => {
                    count++
                    console.log(`loaded texture ${textures[i].id} (#${count})`)
                    this.resources[textures[i].id] = texture
                    if (count === target) {
                        console.log('finished loading textures')
                        callback()
                    }
                }, () => {}, (error) => {
                    console.error(error)
                }
            )
        }
    }


    /**
     * Planet Generation
     */
    createPlanet(size, texture, position, ring) {
        const geo = new THREE.SphereGeometry(size, 30, 30);
        const mat = new THREE.MeshStandardMaterial({
            map: textureLoader.load(texture)
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
                map: textureLoader.load(ring.texture),
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
    createSun() {
        const textureLoader = new THREE.TextureLoader();
        const sunGeo = new THREE.SphereGeometry(16, 30, 30);
        const sunMat = new THREE.MeshBasicMaterial({
            map: this.sunTexture
        });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        this.scene.add(sun);

        const pointLight = new THREE.PointLight(0xFFFFFF, 2, 300);
        this.scene.add(pointLight);
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
            0.1, // near clipping cutoff
            1000 // far clipping cutoff
        );
        this.camera.position.set(-90, 140, 140);

        // Controls
        this.controls = new OrbitControls(this.camera, this.$canvas)
        this.controls.update()

        // Sun
        this.createSun()
        

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
