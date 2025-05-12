class Camera{
    constructor(){
       this.eye = new Vector3([0, 0, 3]);  
        this.at = new Vector3([0, 0, -1]);
        this.up = new Vector3([0, 1, 0]);
        this.fov = 60;
        this.speed = 0.1;
        this.aspect = canvas.width / canvas.height;
        this.near = 0.1;
        this.far = 100;

        this.yaw = -90;   // Facing -Z
        this.pitch = 0;   // Looking straight
        this.forward = new Vector3([0, 0, -1]);
        this.right = new Vector3([1, 0, 0]);
        this.worldUp = new Vector3([0, 1, 0]);

        this.rotationAngle = 0;
        this.heightDiff = this.at.elements[1] - this.eye.elements[1];

        this.updateCameraVectors();

    }
   // Update matrices after any camera movement
    updateMatrices() {
        this.viewMatrix.setLookAt(
            this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2]
        );
    }
    
    moveForward() {
        // Compute forward vector f = at - eye
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        f.normalize();
        f.mul(this.speed);
        
        // Add forward vector to both eye and at points
        this.eye.add(f);
        this.at.add(f);
        
        this.updateMatrices();
    }
    
    moveBackwards() {
        // Compute backward vector b = eye - at
        let b = new Vector3();
        b.set(this.eye);
        b.sub(this.at);
        b.normalize();
        b.mul(this.speed);
        
        // Add backward vector to both eye and at points
        this.eye.add(b);
        this.at.add(b);
        
        this.updateMatrices();
    }
    
    moveLeft() {
        // Compute forward vector
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        
        // Compute side vector s = up × f (cross product)
        let s = new Vector3();
        s = Vector3.cross(this.up, f);
        s.normalize();
        s.mul(this.speed);
        
        // Add side vector to both eye and at
        this.eye.add(s);
        this.at.add(s);
        
        this.updateMatrices();
    }
    
    moveRight() {
        // Compute forward vector
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        
        // Compute side vector s = f × up (opposite of left)
        let s = new Vector3();
        s = Vector3.cross(f, this.up);
        s.normalize();
        s.mul(this.speed);
        
        // Add side vector to both eye and at
        this.eye.add(s);
        this.at.add(s);
        
        this.updateMatrices();
    }
    
    panLeft() {
        this.yaw -= 5;
        this.updateCameraVectors();
    }
    
    panRight() {
        this.yaw += 5;
        this.updateCameraVectors();
    }  
}
Camera.prototype.updateCameraVectors = function() {
    // Convert yaw and pitch to direction vector
    const radYaw = this.yaw * Math.PI / 180;
    const radPitch = this.pitch * Math.PI / 180;

    const x = Math.cos(radPitch) * Math.cos(radYaw);
    const y = Math.sin(radPitch);
    const z = Math.cos(radPitch) * Math.sin(radYaw);

    this.forward = new Vector3([x, y, z]).normalize();

    // Recalculate right and up vectors
    this.right = Vector3.cross(this.forward, this.worldUp).normalize();
    this.up = Vector3.cross(this.right, this.forward).normalize();

    // Update the 'at' position
    this.at.set(this.eye);
    this.at.add(this.forward);
};

