let g_triangleBuffer = null;
let g_triangleBuffer3D = null;
let g_uVBuffer = null;

class Triangle {
    constructor() {
        this.type = 'triangle';
        this.position = [0, 0, 0];
        this.color = [1, 1, 1, 1];
        this.size = 5.0;
        this.vertices = null;

        if (!g_triangleBuffer) {
            g_triangleBuffer = gl.createBuffer();
            if (!g_triangleBuffer) console.log('Failed to create triangle buffer');
        }
    }

    generateVertices() {
        const [x, y] = this.position;
        const d = this.size / 20.0;
        this.vertices = new Float32Array([
            x - d/2, y - d/2,
            x + d/2, y - d/2,
            x,       y + d/2
        ]);
    }

    render() {
        if (!this.vertices) this.generateVertices();

        gl.uniform4f(u_FragColor, ...this.color);

        gl.bindBuffer(gl.ARRAY_BUFFER, g_triangleBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
}

function drawTriangle(vertices) {
    gl.bindBuffer(gl.ARRAY_BUFFER, g_triangleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function initTriangle3D() {
    if (!g_triangleBuffer3D) {
        g_triangleBuffer3D = gl.createBuffer();
        if (!g_triangleBuffer3D) return console.log('Failed to create 3D triangle buffer');
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, g_triangleBuffer3D);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
}

function drawTriangle3D(vertices) {
    if (!g_triangleBuffer3D) initTriangle3D();
    gl.bindBuffer(gl.ARRAY_BUFFER, g_triangleBuffer3D);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
}

function drawTriangle3DUV(vertices, uv) {
    if (!g_triangleBuffer3D) {
        g_triangleBuffer3D = gl.createBuffer();
        if (!g_triangleBuffer3D) return console.log('Failed to create 3D triangle buffer');
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, g_triangleBuffer3D);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    if (!g_uVBuffer) {
        g_uVBuffer = gl.createBuffer();
        if (!g_uVBuffer) return console.log('Failed to create UV buffer');
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, g_uVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}