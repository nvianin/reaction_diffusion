let log = console.log

let scene, camera, renderer;


let frametexture = new THREE.DataTexture();
let framebuffer = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat
});
/* frametexture.copy(framebuffer.texture) */
let debug_sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: frametexture
}))
debug_sprite.renderOrder = 10000;
debug_sprite.material.depthTest = false;
let texLoader = new THREE.TextureLoader();
let debug_tex = texLoader.load("./test.png")
debug_tex.name = "debug"

renderer = new THREE.WebGLRenderer();
renderer.autoClear = false;
renderer.setClearColor(new THREE.Color(0x000000))
renderer.clear();
scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000)
camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, .1, 1000);
renderer.setSize(window.innerWidth, window.innerHeight);
let light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light)
scene.add(debug_sprite)
debug_sprite.position.z = 3;
debug_sprite.position.y = -10;
debug_sprite.position.x = -1
/* let cube = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({
    map: frametexture
}))
scene.add(cube)
cube.position.y = .1;
cube.position.z = -1; */

let shader = new THREE.ShaderMaterial();
shader.transparent = true;
shader.needsUpdate = true;
shader.uniforms = {

    resolution: {
        value: new THREE.Vector2(renderer.domElement.offsetWidth, renderer.domElement.offsetHeight)
    },
    prevFrame: {
        value: frametexture
    },
    debug_tex: {
        value: debug_tex
    },
    time: {
        value: 0
    },
    mouse: {
        value: new THREE.Vector2()
    },
    mousedown: {
        value: false
    },
    fk: {
        value: new THREE.Vector2(.5, .5)
    }
}

let plane = new THREE.Mesh(
    new THREE.PlaneGeometry(),
    new THREE.MeshBasicMaterial()
);

let init = false;
fetch("./vertex.glsl").then(thing => {
    thing.text().then(data => {
        /* log(data) */
        plane.material.vertexShader = data;
        shader.vertexShader = data;
        if (!init) {
            init = true;
        } else {
            plane.material = shader;
        }
    });
})
fetch("./frag.glsl").then(thing => {
    thing.text().then(data => {
        plane.material.fragmentShader = data;
        shader.fragmentShader = data;
        if (!init) {
            init = true;
        } else {
            plane.material = shader;
        }
    })

});

scene.add(plane)
camera.position.z = 5;

let cube = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshBasicMaterial({
        color: 0xffffff
    }));
scene.add(cube);
cube.material.map = debug_tex

window.onload = () => {
    document.body.appendChild(renderer.domElement);
    shader.uniforms.resolution.value.x = renderer.domElement.offsetWidth;
    shader.uniforms.resolution.value.y = renderer.domElement.offsetHeight;
    log(shader.uniforms.resolution.value)
    log(shader.uniforms.resolution.value.x / shader.uniforms.resolution.value.y);
    document.querySelector("#f").oninput = e => {
        shader.uniforms.fk.value = new THREE.Vector2(parseFloat(e.target.value), shader.uniforms.fk.value.y)
        document.getElementById("f_label").textContent = "f:" + e.target.value
    }
    document.querySelector("#k").oninput = e => {
        shader.uniforms.fk.value = new THREE.Vector2(shader.uniforms.fk.value.x, parseFloat(e.target.value));
        document.getElementById("k_label").textContent = "k:" + e.target.value
    }
    shader.uniforms.fk.value = new THREE.Vector2(
        parseFloat(document.querySelector("#f").value),
        parseFloat(document.querySelector("#k").value)
    );
    document.getElementById("k_label").textContent = "k:" + document.querySelector("#k").value
    document.getElementById("f_label").textContent = "f:" + document.querySelector("#f").value
    /* log(shader.uniforms.fk) */
    render()
}

window.onkeydown = key => {
    if (key.key == " ") {
        log("reset")
        reset()
    }
}

function reset() {
    start_time = Date.now();
    blackplane.position.y = 0;
    setTimeout(() => {
        blackplane.position.y = -10
    }, 50)
}

let blackplane = new THREE.Mesh(
    new THREE.PlaneGeometry(),
    new THREE.MeshBasicMaterial({
        color: 0x000000
    }))

blackplane.position.z = 4.9;
scene.add(blackplane)

setTimeout(() => {
    blackplane.position.y = -10
}, 500)
let frame = 0;
let start_time;

let render = () => {
    if (frame == 0) {
        start_time = Date.now();
    }
    frame++;
    let time = (Date.now() - start_time) / 1000
    shader.uniforms.time.value = time;
    frametexture.copy(framebuffer.texture)

    plane.position.z = Math.sin(time) - 1
    plane.position.z = 4.89;
    cube.rotation.y = time * 2;

    // animate fk
    shader.uniforms.fk.value.x = shader.uniforms.fk.value.x + Math.sin(time) * .000001;
    shader.uniforms.fk.value.y = shader.uniforms.fk.value.y + Math.cos(time) * .000001;
    /* log(shader.uniforms.fk.value) */


    requestAnimationFrame(render);
    renderer.setRenderTarget(null)
    renderer.render(scene, camera);
    renderer.setRenderTarget(framebuffer);
    renderer.render(scene, camera);
    renderer.copyFramebufferToTexture(new THREE.Vector2(), frametexture);
    shader.uniforms.prevFrame.value = frametexture;

}



window.onresize = () => {
    camera.aspectRatio = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    framebuffer.setSize(window.innerWidth, window.innerHeight);
    /* frametexture.setSize(window.innerWidth, window.innerHeight); */
    shader.uniforms.resolution.value.x = renderer.domElement.offsetWidth
    shader.uniforms.resolution.value.y = renderer.domElement.offsetHeight
}

window.onmousemove = e => {

    shader.uniforms.mouse.value.x = e.layerX;
    shader.uniforms.mouse.value.y = e.layerY;
}



renderer.domElement.onpointerdown = () => {
    shader.uniforms.mousedown.value = true;
}
renderer.domElement.onpointerup = () => {
    shader.uniforms.mousedown.value = false;
}