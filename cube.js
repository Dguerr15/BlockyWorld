class Cube {
    constructor() {
        this.color = [1.0, 1.0, 1.0, 1.0];  // [r, g, b, a]
        this.matrix = new Matrix4();
        this.textureNum = -2;
        
        // Create vertex data for all 12 triangles (36 vertices) at once
        this.vert = new Float32Array([
            // Front face
            0.0, 0.0, 0.0,  1.0, 1.0, 0.0,  1.0, 0.0, 0.0,
            0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  1.0, 1.0, 0.0,
            // Top face
            0.0, 1.0, 0.0,  0.0, 1.0, 1.0,  1.0, 1.0, 1.0,
            0.0, 1.0, 0.0,  1.0, 1.0, 1.0,  1.0, 1.0, 0.0,
            // Bottom face
            0.0, 0.0, 0.0,  0.0, 0.0, 1.0,  1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,  1.0, 0.0, 1.0,  0.0, 0.0, 1.0,
            // Left face
            0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 1.0,
            0.0, 1.0, 1.0,  0.0, 0.0, 0.0,  0.0, 0.0, 1.0,
            // Right face
            1.0, 0.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,  1.0, 0.0, 0.0,  1.0, 0.0, 1.0,
            // Back face
            0.0, 0.0, 1.0,  1.0, 1.0, 1.0,  1.0, 0.0, 1.0,
            0.0, 0.0, 1.0,  0.0, 1.0, 1.0,  1.0, 1.0, 1.0
        ]);
        
        // UV mapping data for all triangles
        this.uv = new Float32Array([
            // Front face
            0.0, 0.0,  1.0, 1.0,  1.0, 0.0,
            0.0, 0.0,  0.0, 1.0,  1.0, 1.0,
            // Top face
            0.0, 0.0,  0.0, 1.0,  1.0, 1.0,
            0.0, 0.0,  1.0, 1.0,  1.0, 0.0,
            // Bottom face
            0.0, 1.0,  0.0, 0.0,  1.0, 1.0,
            1.0, 1.0,  1.0, 0.0,  0.0, 0.0,
            // Left face
            1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
            0.0, 1.0,  1.0, 0.0,  0.0, 0.0,
            // Right face
            0.0, 0.0,  0.0, 1.0,  1.0, 1.0,
            1.0, 1.0,  0.0, 0.0,  1.0, 0.0,
            // Back face
            0.0, 0.0,  1.0, 1.0,  1.0, 0.0,
            0.0, 0.0,  0.0, 1.0,  1.0, 1.0
        ]);
        
        // Initialize buffers
        this.vertexBuffer = null;
        this.uvBuffer = null;
        this.hasInitBuffers = false;
    }
    
    // Initialize all the buffers just once
    initBuffers() {
        if (this.hasInitBuffers) return;
        
        // Vertex buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vert, gl.STATIC_DRAW);
        
        // UV buffer
        this.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.uv, gl.STATIC_DRAW);
        
        this.hasInitBuffers = true;
    }
    
    render(color) {
        // Use the optimized renderFast method
        this.renderFast(color);
    }

    renderFast(color) {
        // Initialize buffers if not done yet
        this.initBuffers();
        
        var rgba = color || this.color;
        
        // Set the texture and model matrix just once
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        
        // Set the fragment color
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        
        // Bind vertex buffer and set attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        
        // Bind UV buffer and set attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);
        
        // If using textured rendering, we don't need per-face colors
        if (this.textureNum >= 0) {
            // Draw all triangles in one call
            gl.drawArrays(gl.TRIANGLES, 0, 36);
        } else {
            // Apply colors per face when not using textures
            
            // Front face - original color
            gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            
            // Top face - 90% brightness
            gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);
            gl.drawArrays(gl.TRIANGLES, 6, 6);
            
            // Bottom face - 80% brightness
            gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
            gl.drawArrays(gl.TRIANGLES, 12, 6);
            
            // Left face - 40% brightness
            gl.uniform4f(u_FragColor, rgba[0]*0.4, rgba[1]*0.4, rgba[2]*0.4, rgba[3]);
            gl.drawArrays(gl.TRIANGLES, 18, 6);
            
            // Right face - 70% brightness
            gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
            gl.drawArrays(gl.TRIANGLES, 24, 6);
            
            // Back face - 60% brightness
            gl.uniform4f(u_FragColor, rgba[0]*0.6, rgba[1]*0.6, rgba[2]*0.6, rgba[3]);
            gl.drawArrays(gl.TRIANGLES, 30, 6);
        }
    }
}