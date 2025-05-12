// Vertex shader program
const VSHADER_SOURCE = `
    precision mediump float;
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    varying vec2 v_UV;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
    }`;

// Fragment shader program
const FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform int u_whichTexture;
    void main() {
        if (u_whichTexture == -2) {
            gl_FragColor = u_FragColor;
        }else if (u_whichTexture == -1) {
            gl_FragColor = vec4(v_UV, 1.0, 1.0);
        }else if (u_whichTexture == 0) {
            gl_FragColor = texture2D(u_Sampler0, v_UV);
        }else if (u_whichTexture == 1) {
            gl_FragColor = texture2D(u_Sampler1, v_UV);      
        }else if (u_whichTexture == 2) {
            gl_FragColor = texture2D(u_Sampler2, v_UV); 
        }else{
            gl_FragColor = vec4(1, .2, .2, 1);
        }
    }`;

// Global variables
let gl;
let canvas;
let a_Position;
let a_UV;
let u_FragColor;
let u_ModelMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_GlobalRotateMatrix;

var g_lastFrameTime = performance.now(); // time at last frame
var g_frameCount = 0; // how many frames since last FPS update
var g_fps = 0; // current FPS

let g_camera;
let g_mapVertexBuffer = null;
let g_numMapVertices = 0;
let g_isMapInitialized = false;

let g_dogObjects ={};
let g_flowerObject = {};
let g_birdObjects = {};
let g_skyObject = null;
let g_floorObject = null;
let g_stickObject = null;

// UI
var g_globalAngleX = 20; // Camera
var g_globalAngleY = -35; // Camera

var g_body = 0; // Body angle

var g_mouth = 0; // Mouth angle

var g_tail = 0; // Tail angle

var g_FLU = 0; // Front Left Upper Leg
var g_FRU = 0; // Front Right Upper Leg

var g_FLL = 0; // Front Left Lower Leg
var g_FRL = 0; // Front Right Lower Leg

var g_FLP = 0; // Front Left Paw
var g_FRP = 0; // Front Right Paw

var g_BLU = 0; // Back Left Upper Leg
var g_BRU = 0; // Back Right Upper Leg

var g_BLL = 0; // Back Left Lower Leg
var g_BRL = 0; // Back Right Lower Leg

var g_BLP = 0; // Back Left Paw
var g_BRP = 0; // Back Right Paw

// Mouse variables
var g_isDragging = false;
var g_lastX = -1;
var g_lastY = -1;


// Animation
var g_Animation = false;
var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

var g_isPoking = false;
var g_pokeStartTime = 0;
var g_pokeDuration = 3.5; // Duration of the poke animation in seconds
let g_isAnimating = false;
let g_lastAnimationTime = 0;


function main() {
    // set up webGL context
    setupWebGL();
    
    connectVariablesToGLSL();

    addActionsForHtmlUI();

    g_camera = new Camera();

    document.onkeydown = keydown;
    
    initTextures();

    setupMouseHandlers();

    initMap();

    initRenderObjects();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    requestAnimationFrame(tick);
}

// Initialize the pre-created objects to avoid recreation in every frame
function initRenderObjects() {
    // Create the sky and floor once
    g_skyObject = new Cube();
    g_skyObject.textureNum = 1;
    g_skyObject.matrix.scale(20, 20, 20);
    g_skyObject.matrix.translate(-.5, -0.5, -.8);

    g_floorObject = new Cube();
    g_floorObject.textureNum = 0;
    g_floorObject.matrix.setTranslate(0, -.75, 0);
    g_floorObject.matrix.scale(16, 0, 16);
    g_floorObject.matrix.translate(-.5, 0.5, -.8);
    
    // Create the stick object (new)
    g_stickObject = new Cube();
    g_stickObject.matrix.setTranslate(-.2, -.65, -.5);
    g_stickObject.matrix.rotate(45, 0, 1, 0);
    g_stickObject.matrix.scale(0.1, 0.1, 0.8);
    g_stickObject.textureNum = -2; // Solid color

    // Create all dog parts once
    g_dogObjects.body = new Cube();
    g_dogObjects.tail = new Cylinder();
    g_dogObjects.head = new Cube();
    g_dogObjects.mouthRoof = new Cube();
    g_dogObjects.mouthFloor = new Cube();
    g_dogObjects.leftEye = new Cube();
    g_dogObjects.rightEye = new Cube();
    g_dogObjects.leftEar = new Cube();
    g_dogObjects.rightEar = new Cube();
    g_dogObjects.leftFU = new Cube();
    g_dogObjects.leftFL = new Cube();
    g_dogObjects.leftFP = new Cube();
    g_dogObjects.rightFU = new Cube();
    g_dogObjects.rightFL = new Cube();
    g_dogObjects.rightFP = new Cube();
    g_dogObjects.leftBU = new Cube();
    g_dogObjects.leftBL = new Cube();
    g_dogObjects.leftBP = new Cube();
    g_dogObjects.rightBU = new Cube();
    g_dogObjects.rightBL = new Cube();
    g_dogObjects.rightBP = new Cube();

    g_flowerObject.stem = new Cube();
    g_flowerObject.petal1 = new Cube();
    g_flowerObject.petal2 = new Cube();

    g_birdObjects.left = new Cube();
    g_birdObjects.right = new Cube();
}

function keydown(ev) {
    if (ev.keyCode == 87) { // W key
        g_camera.moveForward(); 
    } else if (ev.keyCode == 83) { // S key
        g_camera.moveBackwards();
    } else if (ev.keyCode == 65) { // A key
        g_camera.moveLeft();
    } else if (ev.keyCode == 68) { // D key
        g_camera.moveRight();
    } else if (ev.keyCode == 81) { // Q key
        g_camera.panLeft();
    } else if (ev.keyCode == 69) { // E key
        g_camera.panRight();
    } else if (ev.keyCode == 70) { // F key
        addBlockInFront();
    } else if (ev.keyCode == 71) { // G key
        deleteBlockInFront();
    }
}

function setupWebGL() {
    // get the canvas element
    canvas = document.getElementById('webgl');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    // get the webGL context
    gl = getWebGLContext(canvas, {preserveDrawingBuffer: true});
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return null;
    }

    gl.enable(gl.DEPTH_TEST);
}

// connect js variables to glsl
function connectVariablesToGLSL() {
    // initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return;
    }
    
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get u_ModelMatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get u_GlobalRotateMatrix');
        return;
    }

    // Get the storage location of u_Sampler
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0) {
      console.log('Failed to get the storage location of u_Sampler0');
      return false;
    }

    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler1) {
      console.log('Failed to get the storage location of u_Sampler1');
      return false;
    }

    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    if (!u_Sampler2) {
      console.log('Failed to get the storage location of u_Sampler2');
      return false;
    }

    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
      console.log('Failed to get the storage location of u_whichTexture');
      return false;
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get u_ViewMatrix');
        return false;
    }

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log('Failed to get u_ProjectionMatrix');
        return false;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

// set up event listeners
function addActionsForHtmlUI() {
    document.getElementById("start").onclick = function() {g_Animation = true;};
    document.getElementById("stop").onclick = function() {g_Animation = false;};
}

function setupMouseHandlers() {
    canvas.onmousedown = function(ev) {
        var x = ev.clientX;
        var y = ev.clientY;
        
        // Check if shift key is pressed
        if (ev.shiftKey && !g_Animation) {
            // Start the poke animation
            g_isPoking = true;
            g_pokeStartTime = performance.now()/1000.0;
            return; // Don't start rotation when poking
        }

        // Start dragging if a mouse is in the canvas
        var rect = ev.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            g_lastX = x;
            g_lastY = y;
            g_isDragging = true;
        }
    };
    canvas.onmouseup = function(ev) {
        g_isDragging = false;
    }

    canvas.onmouseleave = function(ev) {
        g_isDragging = false; // Also stop dragging if mouse leaves canvas
    }
    canvas.onclick = function(ev) {
        if (ev.spaceKey) {
            deleteBlockInFront();
        } else {
            addBlockInFront();
        }
    };

    canvas.onmousemove = function(ev) {
        if (!g_isDragging) return; // Skip processing if not dragging
        
        var x = ev.clientX;
        var y = ev.clientY;
        
        // Calculate the difference from the last position
        var dx = x - g_lastX;
        var dy = y - g_lastY;
        
        // Only update if there's significant movement
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            // Update the camera's rotation instead of the global rotation
            g_camera.yaw += dx * 0.1;
            g_camera.pitch -= dy * 0.1;
            g_camera.pitch = Math.max(-89.0, Math.min(89.0, g_camera.pitch)); // clamp pitch
            g_camera.updateCameraVectors();
            
            // Update the last position
            g_lastX = x;
            g_lastY = y;
        }
    };
}

function initTextures() {
    // Create the image object
    var image0 = new Image();
    if (!image0) {
      console.log('Failed to create the image object');
      return false;
    }
    // Register the event handler to be called when image loading is completed
    image0.onload = function(){ sendTextureToGLSL(image0, 0); };
    // Tell the browser to load an Image
    image0.src = 'grass.png';

    var image1 = new Image();
    if (!image1) {
      console.log('Failed to create the image1 object');
      return false;
    }
    // Register the event handler to be called when image loading is completed
    image1.onload = function(){ sendTextureToGLSL(image1, 1); };
    // Tell the browser to load an Image
    image1.src = 'sky.jpg';

    var image2 = new Image();
    if (!image2) {
      console.log('Failed to create the image1 object');
      return false;
    }
    // Register the event handler to be called when image loading is completed
    image2.onload = function(){ sendTextureToGLSL(image2, 2); };
    // Tell the browser to load an Image
    image2.src = 'wall.jpg';

    return true;
}
function sendTextureToGLSL(image, index) {
    if (index == 0) {
        // Create a texture object
        var texture0 = gl.createTexture();
        if (!texture0) {
        console.log('Failed to create the texture0 object');
        return false;
        }
    
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image's y axis
        // Activate texture unit0
        gl.activeTexture(gl.TEXTURE0);
        // Bind the texture object to the target
        gl.bindTexture(gl.TEXTURE_2D, texture0);
    
        // Set the texture parameter
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // Set the image to texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        
        // Set the texture unit 0 to the sampler
        gl.uniform1i(u_Sampler0, 0);
    } else if (index == 1) {
        // Create a texture object
        var texture1 = gl.createTexture();
        if (!texture1) {
        console.log('Failed to create the texture object');
        return false;
        }
    
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image's y axis
        // Activate texture unit1
        gl.activeTexture(gl.TEXTURE1);
        // Bind the texture object to the target
        gl.bindTexture(gl.TEXTURE_2D, texture1);
    
        // Set the texture parameter
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // Set the image to texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        
        // Set the texture unit 1 to the sampler
        gl.uniform1i(u_Sampler1, 1);
    }
    else if (index == 2) {
        // Create a texture object
        var texture2 = gl.createTexture();
        if (!texture2) {
        console.log('Failed to create the texture object');
        return false;
        }
    
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image's y axis
        // Activate texture unit1
        gl.activeTexture(gl.TEXTURE2);
        // Bind the texture object to the target
        gl.bindTexture(gl.TEXTURE_2D, texture2);
    
        // Set the texture parameter
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // Set the image to texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        
        // Set the texture unit 2 to the sampler
        gl.uniform1i(u_Sampler2, 2);
    }
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
    g_seconds = performance.now() / 1000.0;

    // FPS calculation
    let now = performance.now();
    g_frameCount++;
    if (now - g_lastFrameTime >= 1000.0) { // One second passed
        g_fps = g_frameCount;
        g_frameCount = 0;
        g_lastFrameTime = now;
        sendTextToHtml(g_fps, 'fpsValue'); // Update FPS on HTML
    }
    
    // Check if we need to update animation
    const needsAnimation = (g_Animation || g_isPoking);
    
    // Only update and render when necessary
    if (needsAnimation) {
        if (g_isPoking) {
            updatePokeAnimation();
        } else if (g_Animation) {
            updateRunAnimation();
        }
    }
    renderScene();  
    
    requestAnimationFrame(tick);
}


function updateRunAnimation() {
    if (g_Animation) {
        g_FLU = (30 * Math.sin(3 * g_seconds));
        g_FRU = (30 * Math.sin(3 * g_seconds + 10));
        g_BLU = (30 * Math.sin(3 * g_seconds + 10.5));
        g_BRU = (30 * Math.sin(3 * g_seconds+ .5));
        g_tail = (30 * Math.sin(g_seconds * 3));
    }
}

function updatePokeAnimation() {
    var pokeTime = performance.now()/1000.0 - g_pokeStartTime;
    
    if (pokeTime > g_pokeDuration) {
        // Reset after animation completes
        g_isPoking = false;
        g_isDragging = false;
        resetAnimalPose();
        return;
    }
    
    // Calculate animation progress (0 to 1)
    var progress = pokeTime / g_pokeDuration;
    
    // Surprised reaction animation - ears up, mouth open, front paws up
    // Sitting animation
    if (progress < 0.3) {
        // Initial phase - start sitting down
        var sitProgress = progress / 0.3;

        // Bend Body
        g_body = 25 * sitProgress;  // Bend body down
        
        // Back legs bend to sit
        g_BLU = -30 * sitProgress;  // Rotate back upper legs forward
        g_BRU = -30 * sitProgress;
        g_BLL = 15 * sitProgress;  // Bend back lower legs
        g_BRL = 15 * sitProgress;
        
        // Front legs extend slightly
        g_FLU = -15 * sitProgress;  // Extend front upper legs
        g_FRU = -15 * sitProgress;
        
        // Open mouth (bark)
        g_mouth = 12 * sitProgress;
        
        // Wag tail slightly
        g_tail = 15 * sitProgress;
    } 
    else if (progress < 0.7) {
        // Middle of animation - sitting and barking
        var barkPhase = (progress - 0.3) / 0.3;
        
        // Keep legs in sitting position
        g_BLU = -30;
        g_BRU = -30;
        g_BLL = 15;
        g_BRL = 15;
        g_FLU = -15;
        g_FRU = -15;
        
        // Bark - mouth opening and closing
        g_mouth = 12 + 3 * Math.sin(barkPhase * 5);
        
        // Wag tail more vigorously
        g_tail = 15 + 10 * Math.sin(barkPhase * 20);
    } 
    else {
        // End of animation - gradually return to normal
        var recovery = (progress - 0.7) / 0.3;
        
        // Gradually return body to normal position
        g_body = 25 * (1 - recovery);  // Straighten body

        // Gradually return legs to normal position
        g_BLU = -30 * (1 - recovery);
        g_BRU = -30 * (1 - recovery);
        g_BLL = 15 * (1 - recovery);
        g_BRL = 15 * (1 - recovery);
        g_FLU = -15 * (1 - recovery);
        g_FRU = -15 * (1 - recovery);
        
        // Close mouth
        g_mouth = 12 * (1 - recovery);
        
        // Stop wagging tail
        g_tail = 15 * (1 - recovery);
    }
}

// Helper function to reset the animal pose
function resetAnimalPose() {
    if (!g_Animation) {
        // Only reset if not in normal animation mode
        g_body = 0;
        g_mouth = 0;
        g_tail = 0;
        g_FLU = 0;
        g_FRU = 0;
        g_FLL = 0;
        g_FRL = 0;
        g_FLP = 0;
        g_FRP = 0;
        g_BLU = 0;
        g_BRU = 0;
        g_BLL = 0;
        g_BRL = 0;
        g_BLP = 0;
        g_BRP = 0;
    }
}


var g_map = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [4,4,3,3,4,4,3,3,4,4,3,3,4,4,0,0,0,0,0,4,3,4,4,3,3,4,4,3,3,4,4,4],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,1,2,3,1,2,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,2,1,2,2,3,2,3,3,3,0,0,0,0,0,0,0,0,2,2,2,2,1,1,1,2,3,2,3,3,3,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,2,3,2,2,1,1,1,1,1,2,2,3,3,1,1,1,1,2,1,2,3,1,2,3,1,4,4,4,1,1,2]
];

function initMap() {
    // Only initialize the map once
    if (g_isMapInitialized) return;
    
    // Create a buffer for the map vertices
    g_mapVertexBuffer = gl.createBuffer();
    if (!g_mapVertexBuffer) {
        console.log('Failed to create map vertex buffer');
        return;
    }

    g_mapUVBuffer = gl.createBuffer(); // New buffer for texture coordinates
    if (!g_mapUVBuffer) {
        console.log('Failed to create map UV buffer');
        return;
    }
    
    // Collect all vertices for the entire map
    let mapVertices = [];
    let mapUVs = [];
    let cube = new Cube();
    cube.initBuffers(); // Make sure the cube buffers are initialized
    
    for(var y=0; y < g_map.length; y++){
        if(g_map[y]) { // Check if row exists
            for(var x=0; x < g_map[y].length; x++){
                var height = g_map[y][x];
                if(height > 0){
                    for(var h=0; h < height; h++){
                        // Calculate the transformation matrix for this cube
                        let modelMatrix = new Matrix4();
                        modelMatrix.setTranslate(0, 0, 0);
                        modelMatrix.scale(.5, .5, .5);
                        modelMatrix.translate(x-16, h-2, y-25.75);
                        
                        // Transform each vertex of the cube and add to mapVertices
                        for (let i = 0, j = 0; i < cube.vert.length; i += 3, j += 2) {
                            let vertex = new Vector3([cube.vert[i], cube.vert[i+1], cube.vert[i+2]]);
                            let transformedVertex = modelMatrix.multiplyVector3(vertex);
                            
                            mapVertices.push(transformedVertex.elements[0]);
                            mapVertices.push(transformedVertex.elements[1]);
                            mapVertices.push(transformedVertex.elements[2]);
                            
                            // Add corresponding UV coordinates
                            if (j < cube.uv.length) {
                                mapUVs.push(cube.uv[j]);
                                mapUVs.push(cube.uv[j+1]);
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Store the total number of vertices
    g_numMapVertices = mapVertices.length / 3;
    
    // Send the vertex data to the GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, g_mapVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mapVertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, g_mapUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mapUVs), gl.STATIC_DRAW);
    
    g_isMapInitialized = true;
}

function drawMap() {
    // If the map isn't initialized yet, do it now
    if (!g_isMapInitialized) {
        initMap();
    }
    
    // Set the texture
    gl.uniform1i(u_whichTexture, 2);
    
    // Set the model matrix to identity since vertices are pre-transformed
    let identityMatrix = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityMatrix.elements);
    
    // Bind the pre-computed map vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, g_mapVertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    // Bind the pre-computed map UV buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, g_mapUVBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    
    // Draw all the pre-computed vertices in one go
    gl.drawArrays(gl.TRIANGLES, 0, g_numMapVertices);
}

// render all shapes
function renderScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let projMat = new Matrix4();
    projMat.setPerspective(60, canvas.width / canvas.height, 0.1, 100); 
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    let viewMat = new Matrix4();
    viewMat.setLookAt(
        g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],
        g_camera.at.elements[0],  g_camera.at.elements[1],  g_camera.at.elements[2],
        g_camera.up.elements[0],  g_camera.up.elements[1],  g_camera.up.elements[2]
    );  
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    // Create a global rotation matrix that combines X and Y rotations
    var globalRotateMatrix = new Matrix4()
        .rotate(g_globalAngleX, 1, 0, 0)  // Rotate around X axis
        .rotate(g_globalAngleY, 0, 1, 0); // Rotate around Y axis
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotateMatrix.elements);
    
    // Draw map
    drawMap();

    // Draw sky
    g_skyObject.render();

    // Draw floor with color
    g_floorObject.render([0.5, 0.5, 0.5, 1.0]);

    // Draw the stick
    
    g_stickObject.render([0.4, 0.2, 0.0, 1.0]);

    createFlower([-1, -.6, -2]);
    createFlower([1, -.6, -2]);
    createFlower([-1, -.6, 2]);

    createBird([1, 2.6, 2]);
    createBird([-3.5, .55, -.45]);
    createBird([-2, 1.3, -2]);

    // Body
    let body = g_dogObjects.body;
    body.matrix.setTranslate(-.25, -0.2, -0.05);
    body.matrix.rotate(g_body, 1, 0, 0);
    var bodyCoords = new Matrix4(body.matrix);
    body.matrix.scale(0.5, 0.3, 0.65);
    body.render([0.45, 0.3, 0.0, 1.0]);

    // Tail
    let tail = g_dogObjects.tail;
    tail.matrix = bodyCoords;
    tail.matrix.translate(0.25, 0.25, 0.55);
    tail.matrix.rotate(45, 1, 0, 0);
    tail.matrix.rotate(g_tail, 0, 0, 1);
    tail.matrix.scale(0.1, 0.4, 0.1);
    tail.render([0.4, 0.2, 0.0, 1.0]);

    // Head
    let head = g_dogObjects.head;
    head.textureNum = -2;
    head.matrix = bodyCoords;
    head.matrix.setTranslate(-0.175, 0.025, -0.15);
    var headCoords = new Matrix4(head.matrix);
    head.matrix.scale(0.35, 0.25, 0.2);
    head.render([0.5, 0.3, 0.0, 1.0]);

    // Mouth roof
    let mouthRoof = g_dogObjects.mouthRoof;
    mouthRoof.matrix = headCoords;
    mouthRoof.matrix.setTranslate(-0.075, 0.075, -0.3);
    mouthRoof.matrix.scale(0.15, 0.075, 0.2);
    mouthRoof.render([0.5, 0.2, 0.0, 1.0]);

    // Mouth floor
    let mouthFloor = g_dogObjects.mouthFloor;
    mouthFloor.matrix = headCoords;
    mouthFloor.matrix.setTranslate(0.075, 0.025, -0.1);
    mouthFloor.matrix.rotate(180, 0, 1, 0);
    mouthFloor.matrix.rotate(10, 1, 0, 0);
    mouthFloor.matrix.rotate(g_mouth, 1, 0, 0);
    mouthFloor.matrix.scale(0.15, 0.075, 0.2);
    mouthFloor.render([0.5, 0.3, 0.0, 1.0]);

    // Left eye
    let leftEye = g_dogObjects.leftEye;
    leftEye.matrix = headCoords;
    leftEye.matrix.setTranslate(0.075, 0.175, -0.151);
    leftEye.matrix.scale(0.05, 0.05, 0.05);
    leftEye.render([0, 0, 0, 1.0]);

    // Right eye
    let rightEye = g_dogObjects.rightEye;
    rightEye.matrix = headCoords;
    rightEye.matrix.setTranslate(-0.125, 0.175, -0.151);
    rightEye.matrix.scale(0.05, 0.05, 0.05);
    rightEye.render([0, 0, 0, 1.0]);

    // Left ear
    let leftEar = g_dogObjects.leftEar;
    leftEar.matrix = headCoords;
    leftEar.matrix.setTranslate(0.075, 0.2, -0.05);
    leftEar.matrix.rotate(45, 0, 0, 1);
    leftEar.matrix.scale(0.1, 0.1, 0.05);
    leftEar.render([0.5, 0.3, 0.0, 1.0]);

    // Right ear
    let rightEar = g_dogObjects.rightEar;
    rightEar.matrix = headCoords;
    rightEar.matrix.setTranslate(-0.075, 0.2, -0.05);
    rightEar.matrix.rotate(45, 0, 0, 1);
    rightEar.matrix.scale(0.1, 0.1, 0.05);
    rightEar.render([0.5, 0.3, 0.0, 1.0]);

    // Front left upper leg
    let leftFU = g_dogObjects.leftFU;
    leftFU.matrix = new Matrix4(bodyCoords);
    leftFU.matrix.translate(1.2, -0.75, 0.75);
    leftFU.matrix.rotate(180, 0, 0, 1);
    leftFU.matrix.rotate(-15, 1, 0, 0);
    leftFU.matrix.rotate(g_FLU, 1, 0, 0);
    var leftFUCoords = new Matrix4(leftFU.matrix);
    leftFU.matrix.scale(0.3, 1.1, 0.5);
    leftFU.render([0.6, 0.4, 0.0, 1.0]);

    // Left lower leg
    let leftFL = g_dogObjects.leftFL;
    leftFL.matrix = leftFUCoords;
    leftFL.matrix.translate(0.0, 1.0 , 0.0);
    leftFL.matrix.rotate(30, 1, 0, 0);
    leftFL.matrix.rotate(g_FLL, 1, 0, 0);
    var leftFLCoords = new Matrix4(leftFL.matrix);
    leftFL.matrix.scale(.3, 1.0, 0.5);
    leftFL.render([.65, .35, 0.0, 1.0]);

    // Left front paw
    let leftFP = g_dogObjects.leftFP;
    leftFP.matrix = leftFLCoords;
    leftFP.matrix.translate(-0.01, 1.0, 0.5);
    leftFP.matrix.rotate(180, 1, 0, 0);
    leftFP.matrix.rotate(g_FLP, 1, 0, 0);
    leftFP.matrix.scale(0.34, 0.2, 1.);
    leftFP.render([0.7, 0.5, 0.0, 1.0]);

    // Front right upper leg
    let rightFU = g_dogObjects.rightFU;
    rightFU.matrix = new Matrix4(bodyCoords);
    rightFU.matrix.translate(0.1, -0.75, 0.75);
    rightFU.matrix.rotate(180, 0, 0, 1);
    rightFU.matrix.rotate(-15, 1, 0, 0);
    rightFU.matrix.rotate(g_FRU, 1, 0, 0);
    var rightFUCoords = new Matrix4(rightFU.matrix);
    rightFU.matrix.scale(0.3, 1.1, 0.5);
    rightFU.render([0.6, 0.4, 0.0, 1.0]);

    // Right lower leg
    let rightFL = g_dogObjects.rightFL;
    rightFL.matrix = rightFUCoords;
    rightFL.matrix.translate(0.0, 1.0 , 0.0);
    rightFL.matrix.rotate(30, 1, 0, 0);
    rightFL.matrix.rotate(g_FRL, 1, 0, 0);
    var rightFLCoords = new Matrix4(rightFL.matrix);
    rightFL.matrix.scale(0.3, 1.0, 0.5);
    rightFL.render([.65, .35, 0.0, 1.0]);

    // Right front paw
    let rightFP = g_dogObjects.rightFP;
    rightFP.matrix = rightFLCoords;
    rightFP.matrix.translate(-0.01, 1.0, 0.5);
    rightFP.matrix.rotate(180, 1, 0, 0);
    rightFP.matrix.rotate(g_FRP, 1, 0, 0);
    rightFP.matrix.scale(0.34, 0.2, 1.0);
    rightFP.render([0.7, 0.5, 0.0, 1.0]);

    // Back left upper leg
    let leftBU = g_dogObjects.leftBU;
    leftBU.matrix = new Matrix4(bodyCoords);
    leftBU.matrix.translate(0.1, -0.75, 3.25);
    leftBU.matrix.rotate(180, 0, 0, 1);
    leftBU.matrix.rotate(-15, 1, 0, 0);
    leftBU.matrix.rotate(g_BLU, 1, 0, 0);
    var leftBUCoords = new Matrix4(leftBU.matrix);
    leftBU.matrix.scale(0.3, 1.1, 0.5);
    leftBU.render([0.6, 0.4, 0.0, 1.0]);

    // Back left lower leg
    let leftBL = g_dogObjects.leftBL;
    leftBL.matrix = leftBUCoords;
    leftBL.matrix.translate(0.0, 1.0 , 0.0);
    leftBL.matrix.rotate(30, 1, 0, 0);
    leftBL.matrix.rotate(g_BLL, 1, 0, 0);
    var leftBLCoords = new Matrix4(leftBL.matrix);
    leftBL.matrix.scale(0.3, 1.0, 0.5);
    leftBL.render([.65, .35, 0.0, 1.0]);

    // Left back paw
    let leftBP = g_dogObjects.leftBP;
    leftBP.matrix = leftBLCoords;
    leftBP.matrix.translate(-0.01, 1.0, 0.5);
    leftBP.matrix.rotate(180, 1, 0, 0);
    leftBP.matrix.rotate(g_BLP, 1, 0, 0);
    leftBP.matrix.scale(0.34, 0.2, 1.0);
    leftBP.render([0.5, 0.35, 0.0, 1.0]);

    // Back right upper leg
    let rightBU = g_dogObjects.rightBU;
    rightBU.matrix = new Matrix4(bodyCoords);
    rightBU.matrix.translate(1.2, -0.75, 3.25);
    rightBU.matrix.rotate(180, 0, 0, 1);
    rightBU.matrix.rotate(-15, 1, 0, 0);
    rightBU.matrix.rotate(g_BRU, 1, 0, 0);
    var rightBUCoords = new Matrix4(rightBU.matrix);
    rightBU.matrix.scale(0.3, 1.1, 0.5);
    rightBU.render([0.65, 0.4, 0.0, 1.0]);

    // Back right lower leg
    let rightBL = g_dogObjects.rightBL;
    rightBL.matrix = rightBUCoords;
    rightBL.matrix.translate(0.0, 1.0 , 0.0);
    rightBL.matrix.rotate(30, 1, 0, 0);
    rightBL.matrix.rotate(g_BRL, 1, 0, 0);
    var rightBLCoords = new Matrix4(rightBL.matrix);
    rightBL.matrix.scale(0.3, 1.0, 0.5);
    rightBL.render([.55, .35, 0.0, 1.0]);

    // Right back paw
    let rightBP = g_dogObjects.rightBP;
    rightBP.matrix = rightBLCoords;
    rightBP.matrix.translate(-0.01, 1.0, 0.5);
    rightBP.matrix.rotate(180, 1, 0, 0);
    rightBP.matrix.rotate(g_BRP, 1, 0, 0);
    rightBP.matrix.scale(0.34, 0.2, 1.0);
    rightBP.render([0.5, 0.3, 0.0, 1.0]);
}

function sendTextToHtml (text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get" + htmlID + "from HTML");
    return;
  }
  htmlElm.innerHTML = "FPS: " + text;
}

function getBlockCoordsInFront(dist = 1.0) {
    // Compute point in front of camera
    const dir = new Vector3(g_camera.forward);
    dir.normalize();
    dir.mul(dist);
    const target = new Vector3(g_camera.eye);
    target.add(dir);

    // Convert world coordinates to map grid
    const x = Math.floor(target.elements[0] + 16);
    const z = Math.floor(target.elements[2] + 16);

    return { x, z };
}

function addBlockInFront() {
    const { x, z } = getBlockCoordsInFront();

    if (isNaN(x) || isNaN(z)) return;
    if (x < 0 || x >= g_map[0].length || z < 0 || z >= g_map.length) return;

    // Limit max stack height
    if (g_map[z][x] < 6) g_map[z][x] += 1;

    g_isMapInitialized = false; // Rebuild map
    initMap();
}

function deleteBlockInFront() {
    const { x, z } = getBlockCoordsInFront();

     if (isNaN(x) || isNaN(z)) return;
    if (x < 0 || x >= g_map[0].length || z < 0 || z >= g_map.length) return;

    // Limit min height
    if (g_map[z][x] > 0) g_map[z][x] -= 1;

    g_isMapInitialized = false;
    initMap();
}

// Updated createFlower function
function createFlower(coords) {
    // Get the pre-initialized stem object
    let stem = g_flowerObject.stem;
    stem.matrix = new Matrix4(); // Reset matrix
    stem.matrix.translate(coords[0], coords[1], coords[2]);
    
    // Save stem coordinates for petals
    let stemCoords = new Matrix4(stem.matrix);
    
    // Scale the stem (thin and tall)
    stem.matrix.scale(0.05, 0.5, 0.05);
    stem.render([0.0, 0.5, 0.0, 1.0]); // Green stem
    
    // Create first petal (extends in x direction)
    let petal1 = g_flowerObject.petal1;
    petal1.matrix = new Matrix4(stemCoords);
    petal1.matrix.translate(-0.2, 0.5, 0); // Move to top of stem
    petal1.matrix.scale(0.4, 0.05, 0.05);
    petal1.render([1.0, 0.0, 0.0, 1.0]); // Red petal
    
    // Create second petal (extends in z direction)
    let petal2 = g_flowerObject.petal2;
    petal2.matrix = new Matrix4(stemCoords);
    petal2.matrix.translate(0, 0.5, .2); // Move to top of stem
    petal2.matrix.rotate(90, 0, 1, 0); // Rotate 90 degrees around y-axis
    petal2.matrix.scale(0.4, 0.05, 0.05);
    petal2.render([1.0, 0.0, 0.0, 1.0]); // Red petal
}

function createBird(coords) {
    let left = g_birdObjects.left;
    left.matrix = new Matrix4(); // Reset with identity matrix
    left.matrix.translate(coords[0], coords[1], coords[2]);
    
    let leftCoords = new Matrix4(left.matrix);
    left.matrix.rotate(45, 0, 0, 1);
    left.matrix.scale(0.15, 0.3, 0.15);
    left.render([0.0, 0.0, 0.0, 1.0]); 
    
    let right = g_birdObjects.right;
    right.matrix = new Matrix4(leftCoords);
    right.matrix.rotate(-45, 0, 0, 1); 
    right.matrix.scale(0.15, 0.45, 0.15);
    right.render([0.0, 0.0, 0.0, 1.0]);
}

