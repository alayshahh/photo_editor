// https://www.youtube.com/watch?v=IEvLyMwh1k8

import { CanvasContextProps } from "../components/image_preview/canvas_context";

// initialize webGL



export class WebGLProcessor {

    private readonly VERTEX_SHADER_SOURCE: string =
        `#version 300 es // the version to use (we are on WebGL2)
    in vec2 a_position; // xy coordinates of a corner of the Quad (2 triangles used to make our image)
    in vec2 a_texCoord; // the u,v texture coordinates of the same corner, where to sample input texture from
    out vec2 v_texCoord; // passes uv texture to the fragment shader 
    void main() {
        gl_Position = vec4(a_position, 0, 1); // final position of vertex on screen
        _texCoord = a_texCoord; // passes texture to fragment shader
    }`;


    private readonly FRAGMENT_SHADER_SOURCE =
        `#version 300 es
        precision highp float; // sets the precision for calcualtions (need high for image qual)
        in vec2 v_texCoord; // from v shader -> tells the f shader the exact location of it on the image
        out vec4 outColor; // final color for the pixel

        uniform sampler2D u_image; // input data -> in this case this is my binary brightness mask
        uniform float u_resolution;  // image resolution
        uniform float u_radius; // blur radius
        uniform vec2 u_direction; // direction of blur, since we do a 2 pass will either be vertical or horizontal

        void main() {
            vec4 sum = vec4(0.0);
    
            // Calculate the normalized step size (based on image size and blur direction)
            // We sample further apart as the radius increases.
            vec2 texelStep = u_direction / u_resolution; 
    
            // --- 5-Tap Gaussian Kernel ---
            // The coefficients (0.05, 0.25, 0.4, 0.25, 0.05) are fixed Gaussian weights.
    
            sum += texture(u_image, v_texCoord - 2.0 * texelStep * u_radius) * 0.05;
            sum += texture(u_image, v_texCoord - 1.0 * texelStep * u_radius) * 0.25;
            sum += texture(u_image, v_texCoord) * 0.4;
            sum += texture(u_image, v_texCoord + 1.0 * texelStep * u_radius) * 0.25;
            sum += texture(u_image, v_texCoord + 2.0 * texelStep * u_radius) * 0.05;
    
            outColor = sum;
        }`;


    private gl: WebGL2RenderingContext | null = null;
    private program: WebGLProgram | null = null;
    private frameBufferObj: WebGLFramebuffer | null = null;
    private frameBufferObjTexture: WebGLTexture | null = null;

    private width: number = 0;
    private height: number = 0;
    private a_position: number = -1;
    private a_texCoord: number = -1;
    private u_image: WebGLUniformLocation | null = null;
    private u_resolution: WebGLUniformLocation | null = null;
    private u_radius: WebGLUniformLocation | null = null;
    private u_direction: WebGLUniformLocation | null = null;

    public init(width: number, height: number) {
        const webgl_canvas = document.createElement('canvas')
        this.gl = webgl_canvas.getContext("webgl2")

        if (!this.gl) {
            console.error("WebGL2 not supported. Failing.");
            return false;
        }
        if (!this.createProgram()) return false;
        this.getLocations();
        this.setupBuffers();
        this.setupFBO();
    }

    public applyBlur(inputData: ImageData, radius: number): ImageData | null {
        const gl = this.gl;
        if (!gl || !this.program || !this.frameBufferObj || !this.frameBufferObjTexture) return null;

        // 1. Create the input texture from the WASM-generated mask
        const inputTexture = this.createTextureFromData(inputData.data);
        if (!inputTexture) return null;

        gl.useProgram(this.program);
        gl.viewport(0, 0, this.width, this.height);
        
        // Set Uniforms (variables used by the shader)
        gl.uniform1i(this.u_image, 0); // Use Texture unit 0
        gl.uniform1f(this.u_resolution, this.width);
        gl.uniform1f(this.u_radius, radius); // The variable blur amount


        // --- PASS 2a: Horizontal Blur (Render to FBO) ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBufferObj); // Output to the off-screen cache
        gl.bindTexture(gl.TEXTURE_2D, inputTexture); // Input is the raw mask
        gl.uniform2f(this.u_direction, 1.0, 0.0); // Direction: X-axis
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // Draw the quad

        // Clean up the initial texture; it's now copied to the FBO texture
        gl.deleteTexture(inputTexture); 


        // --- PASS 2b: Vertical Blur (Render to Main Read Buffer) ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Output to the main hidden canvas buffer
        gl.bindTexture(gl.TEXTURE_2D, this.frameBufferObjTexture); // Input is the result of the horizontal pass
        gl.uniform2f(this.u_direction, 0.0, 1.0); // Direction: Y-axis
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // Draw the quad

        // 3. Read the final pixel data back from the GPU to the CPU
        const outputBuffer = new Uint8Array(this.width * this.height * 4);
        gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, outputBuffer);

        // 4. Return the result as ImageData
        return new ImageData(
            new Uint8ClampedArray(outputBuffer.buffer), 
            this.width, 
            this.height
        );
    }

    private compileShader(source: string, type: number): WebGLShader | null {
        const gl = this.gl;
        if (!gl) return null
        // create the shader obj, then input the source, then compile the source
        const shader = gl.createShader(type);
        if (!shader) return null
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;

    }

    private createProgram(): WebGLProgram | null {
        
        const gl = this.gl;
        if (!gl) return false;
        /* a web gl program contains 2 compiled shaders within it. 
         it links the shaders so they can work together to reder objects
         the program is the unit that the GPU executes, containing the shaders as well as the context

         Gemini says:
         In essence, individual shaders are like source code files, while the program object is the compiled 
         and linked executable that the GPU can understand and run. 
         You need the program object to bring your shaders to life and perform any actual rendering in WebGL. 
        */
        const program = gl.createProgram();
        if (!program) return false;

        // a vertex shader handles the geometry of the object (in our cse the flat 2d image)
        const vertexShader = this.compileShader(this.VERTEX_SHADER_SOURCE, gl.VERTEX_SHADER)

        // the fragment shader runs for every pixel : responsible for the coloring
        // in our case since the geometry is simple, the fragment shader will be the more important one i think
        const fragmentShader = this.compileShader(this.FRAGMENT_SHADER_SOURCE, gl.FRAGMENT_SHADER)

        if (!vertexShader || !fragmentShader) return false;
        // connect shaders to program
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        // link program to gl
        gl.linkProgram(program);


        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.log(gl.getShaderInfoLog(vertexShader));
            console.log(gl.getShaderInfoLog(fragmentShader));
            console.error('Program link error:', gl.getProgramInfoLog(program));
            gl.deleteProgram(this.program);
            this.program = null;
            return false;
        }

        this.program = program;

        return true;
    }

    private getLocations() {
        const gl = this.gl;
        const program = this.program;
        if (!gl || !program) return;
        // Attributes (Inputs from CPU buffers) -> sent to the vertex shader
        this.a_position = gl.getAttribLocation(program, 'a_position');
        this.a_texCoord = gl.getAttribLocation(program, 'a_texCoord');

        // Uniforms (Inputs from JS variables/settings) -> used in the fragment shader
        this.u_image = gl.getUniformLocation(program, 'u_image');
        this.u_resolution = gl.getUniformLocation(program, 'u_resolution');
        this.u_radius = gl.getUniformLocation(program, 'u_radius');
        this.u_direction = gl.getUniformLocation(program, 'u_direction');

    }

    private setupBuffers() {
        const gl = this.gl;
        if (!gl) return;
        
        // Positions for a screen-filling quad (-1 to 1)
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,  // bottom-left
             1, -1,  // bottom-right
            -1,  1,  // top-left
             1,  1,  // top-right
        ]), gl.STATIC_DRAW);
        
        // Texture coordinates (0 to 1)
        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            1, 1,
        ]), gl.STATIC_DRAW);
        
        // Configure Attributes
        gl.useProgram(this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.a_position);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.vertexAttribPointer(this.a_texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.a_texCoord);
    }
    // creates gpu cache for the first and second pass
    private setupFBO() {
        const gl = this.gl;
        if (!gl) return;

        // 1. Create Frame Buffer Object (FBO) - Our GPU-side cache
        this.frameBufferObj = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBufferObj);

        // 2. Create the Texture to store the result of the Horizontal pass
        this.frameBufferObjTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.frameBufferObjTexture);
        
        // Allocate space for the texture with the correct size
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // 3. Attach the texture to the FBO
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.frameBufferObjTexture, 0);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    
    // Takes in the binary mask and creates a texture
    private createTextureFromData(data: Uint8ClampedArray): WebGLTexture | null {
        const gl = this.gl;
        if (!gl) return null;
        
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // This uploads the WASM-generated mask data to the GPU
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        
        // Set standard texture parameters for filtering and edge handling
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // so theres no "edge" and you dont need to worry about edge handling
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        gl.bindTexture(gl.TEXTURE_2D, null); // clean up
        return texture;
    }

    
}

export const webGLProcessor = new WebGLProcessor();

export function initWebGLProcessor(context: CanvasContextProps) {
    if (!context.originalImageData) {
        // ensure we dont fall in a weird space
        context.setIsWebGLLoaded(false)
        return
    }
    if (!context.isWebGLLoaded) {
        if (webGLProcessor.init(context.originalImageData.width, context.originalImageData.height)){
            context.setIsWebGLLoaded(true);
        } else {
            console.error("Failed to initialize webGL :( ")
        }
    }

}
