class Cylinder {
    constructor() {
        this.color = [1.0, 1.0, 1.0, 1.0];  // [r, g, b, a]
        this.matrix = new Matrix4();
        this.segments = 12;  // Number of segments around the cylinder

        this.vertexBuffer = gl.createBuffer();
        this.sideVertices = null;
        this.topVertices = null;
        this.bottomVertices = null;

        this.initVertices();
    }

    initVertices() {
        const segments = this.segments;
        const angleStep = 360 / segments;
        
        // Arrays to store all vertices for different parts
        let sideVerticesArray = [];
        let topVerticesArray = [];
        let bottomVerticesArray = [];
        
        // Generate all the vertices once
        for (let i = 0; i < segments; i++) {
            const angle1 = i * angleStep;
            const angle2 = ((i + 1) % segments) * angleStep;
            
            const x1 = 0.5 * Math.cos(angle1 * Math.PI / 180);
            const z1 = 0.5 * Math.sin(angle1 * Math.PI / 180);
            const x2 = 0.5 * Math.cos(angle2 * Math.PI / 180);
            const z2 = 0.5 * Math.sin(angle2 * Math.PI / 180);
            
            // Side vertices (two triangles per segment)
            sideVerticesArray.push(
                // First triangle
                x1, 0.0, z1,
                x2, 0.0, z2,
                x1, 1.0, z1,
                
                // Second triangle
                x1, 1.0, z1,
                x2, 0.0, z2,
                x2, 1.0, z2
            );
            
            // Top circle vertices
            topVerticesArray.push(
                0.0, 1.0, 0.0,
                x1, 1.0, z1,
                x2, 1.0, z2
            );
            
            // Bottom circle vertices
            bottomVerticesArray.push(
                0.0, 0.0, 0.0,
                x1, 0.0, z1,
                x2, 0.0, z2
            );
        }
        
        // Convert arrays to Float32Array for WebGL
        this.sideVertices = new Float32Array(sideVerticesArray);
        this.topVertices = new Float32Array(topVerticesArray);
        this.bottomVertices = new Float32Array(bottomVerticesArray);
    }
    
    render(color) {
        var rgba = color || this.color;
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        
        // Bind the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        
        // Draw the sides
        gl.bufferData(gl.ARRAY_BUFFER, this.sideVertices, gl.STATIC_DRAW);
        for (let i = 0; i < this.segments; i++) {
            // Apply shading based on segment position
            const angle = i * (360 / this.segments);
            const shadeFactor = 0.7 + 0.3 * Math.abs(Math.cos(angle * Math.PI / 180));
            gl.uniform4f(u_FragColor, rgba[0] * shadeFactor, rgba[1] * shadeFactor, rgba[2] * shadeFactor, rgba[3]);
            
            // Draw two triangles per segment (6 vertices)
            gl.drawArrays(gl.TRIANGLES, i * 6, 6);
        }
        
        // Draw the top circle
        gl.bufferData(gl.ARRAY_BUFFER, this.topVertices, gl.STATIC_DRAW);
        gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);
        gl.drawArrays(gl.TRIANGLES, 0, this.segments * 3);
        
        // Draw the bottom circle
        gl.bufferData(gl.ARRAY_BUFFER, this.bottomVertices, gl.STATIC_DRAW);
        gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1] * 0.8, rgba[2] * 0.8, rgba[3]);
        gl.drawArrays(gl.TRIANGLES, 0, this.segments * 3);
    }
}