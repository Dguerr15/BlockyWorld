class Point {
    constructor(position, color, size) {
        this.position = position;  // [x, y]
        this.color = color;        // [r, g, b, a]
        this.size = size;          // point size
    }
    
    render(gl, a_Position, u_FragColor, u_PointSize) {
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        
        gl.uniform1f(u_PointSize, this.size);
        
        const vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.log('Failed to create the buffer object');
            return -1;
        }
        
        // bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        
        // write data into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([this.position[0], this.position[1]]), gl.STATIC_DRAW);
        
        // assign the buffer object to a_Position variable
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        
        // enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);
        
        // draw the point
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}