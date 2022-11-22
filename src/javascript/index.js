import Application from './application.js'

window.application = new Application({
    $canvas: document.querySelector('.js-canvas'),
    useComposer: true
})

// for fast web development
if(module.hot)
{
    module.hot.dispose(() =>
    {
        window.application.destructor()
        window.application = null
    })
}