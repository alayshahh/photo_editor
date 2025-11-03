// https://www.youtube.com/watch?v=IEvLyMwh1k8

import { CanvasContextProps } from "../components/image_preview/canvas_context";


export class WebGLProcessor {

    // --- SHADER SOURCES ---
    private readonly VERTEX_SHADER_SRC = `#version 300 es
            layout(location=0) in vec4 aPosition;
            layout(location=1) in vec2 aTexCoord;
            out vec2 vTexCoord;
            void main() {
                gl_Position = aPosition;
                vTexCoord = aTexCoord;
            }`;

    private readonly FRAGMENT_SHADER_SRC = `#version 300 es
    #pragma vscode_glsllint_stage: frag
            precision mediump float;
            uniform sampler2D sampler;
            uniform vec2 uvStride;
            uniform vec2[128] offsetAndScale;
            uniform int kernelWidth;
            in vec2 vTexCoord;
            out vec4 fragColor;
            void main() {
                fragColor = vec4(0.0);
                for (int i = 0; i < kernelWidth; i++) {
                    fragColor += texture(sampler, vTexCoord + offsetAndScale[i].x * uvStride) * offsetAndScale[i].y;
                }
            }`;

    private gl: WebGL2RenderingContext | null = null;
    private program: WebGLProgram | null = null;
    private blurVAO: WebGLVertexArrayObject | null = null;
    private ctx2d: CanvasRenderingContext2D | null = null;

    // WebGL Resources
    private inputTexture: WebGLTexture | null = null;
    private intermediateTexture: WebGLTexture | null = null;
    private intermediateFbo: WebGLFramebuffer | null = null;;
    private outputTexture: WebGLTexture | null = null;
    private outputFbo: WebGLFramebuffer | null = null;

    // Uniform Locations
    private uniforms: {
        uvStride: WebGLUniformLocation | null;
        offsetAndScale: WebGLUniformLocation | null;
        kernelWidth: WebGLUniformLocation | null;
        sampler: WebGLUniformLocation | null;
    } = {
            uvStride: null,
            offsetAndScale: null,
            kernelWidth: null,
            sampler: null
        };

    // Cached Kernel Data and Dimensions
    private offsetsAndScales: Float32Array | null = null;
    private width: number = 0;
    private height: number = 0;

    /**
     * Initializes or resizes the GPU resources (Context, Textures, and FBOs)
     * based on the image size. This must be called before applyBlur.
     * @param width The width of the image.
     * @param height The height of the image.
     * @returns True if initialization was successful, false otherwise.
     */
    public init(width: number, height: number): boolean {

        const webgl_canvas = document.createElement('canvas')
        const gl = webgl_canvas.getContext("webgl2");
        if (!gl) {
            console.error("WebGL 2 not supported.");
            return false;
        }
        console.log("inited gl");
        this.gl = gl;
        this.ctx2d = document.createElement('canvas').getContext('2d');
        if (!this.ctx2d) return false;
        console.log("loaded 2d ctx")
        this.offsetsAndScales = new Float32Array(256);

        // Program and VAO are static and size-independent
        if (!this.createProgram() || !this.program) return false;
        if (!this.setupVAO()) return false;

        console.log("set up program and vao");

        // Create initial resource placeholders
        this.inputTexture = gl.createTexture()!;
        this.intermediateTexture = gl.createTexture()!;
        this.intermediateFbo = gl.createFramebuffer()!;
        this.outputTexture = gl.createTexture()!;
        this.outputFbo = gl.createFramebuffer()!;

        this.width = width;
        this.height = height;
        webgl_canvas.width = width;
        webgl_canvas.height = height;
        gl.viewport(0, 0, width, height);

        // Configure the three FBO chains (Intermediate and Output)
        if (!this.configureResource(this.intermediateTexture, this.intermediateFbo)) return false;
        if (!this.configureResource(this.outputTexture, this.outputFbo)) return false;

        console.log("configured resources")

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        return true;
    }

    private configureResource(texture: WebGLTexture, fbo: WebGLFramebuffer) {
        const gl = this.gl;
        if (!gl) return false;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('FBO incomplete after resizing to', this.width, this.height);
            return false;
        }
        return true;
    };

    private setupVAO(): boolean {
        const gl = this.gl;
        const program = this.program;
        if (!gl || !program) return false;
        gl.useProgram(program);
        this.uniforms = {
            uvStride: gl.getUniformLocation(program, 'uvStride'),
            offsetAndScale: gl.getUniformLocation(program, 'offsetAndScale'),
            kernelWidth: gl.getUniformLocation(program, 'kernelWidth'),
            sampler: gl.getUniformLocation(program, 'sampler')
        };
        gl.uniform1i(this.uniforms.sampler, 0);

        // --- QUAD VAO/BUFFER SETUP ---
        const blurQuadData = new Float32Array([
            -1, 1, 0, 1, -1, -1, 0, 0, 1, 1, 1, 1, 1, -1, 1, 0,
        ]);

        this.blurVAO = gl.createVertexArray()!;
        gl.bindVertexArray(this.blurVAO);

        const blurBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, blurBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, blurQuadData, gl.STATIC_DRAW);

        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.bindVertexArray(null);
        return true;
    }

    // --- PRIVATE HELPER METHODS (Kernel logic, etc., remain the same) ---

    private createProgram(): boolean {

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
        const vertexShader = this.compileShader(this.VERTEX_SHADER_SRC, gl.VERTEX_SHADER)

        // the fragment shader runs for every pixel : responsible for the coloring
        // in our case since the geometry is simple, the fragment shader will be the more important one i think
        const fragmentShader = this.compileShader(this.FRAGMENT_SHADER_SRC, gl.FRAGMENT_SHADER)

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

    private generate1DKernel(width: number): number[] {
        if ((width & 1) !== 1) throw new Error('Only odd guassian kernel sizes are accepted');

        const smallKernelLerps = [
            [1.0], [0.25, 0.5, 0.25], [0.0625, 0.25, 0.375, 0.25, 0.0625],
            [0.03125, 0.109375, 0.21875, 0.28125, 0.21875, 0.109375, 0.03125],
        ];
        if (width < 9) return smallKernelLerps[(width - 1) >> 1];

        const kernel: number[] = [];
        const sigma = width / 6;
        const radius = (width - 1) / 2;
        let sum = 0;

        for (let i = 0; i < width; i++) {
            const offset = i - radius;
            const coefficient = 1 / (sigma * Math.sqrt(2 * Math.PI));
            const exponent = -(offset * offset) / (2 * (sigma * sigma));
            const value = coefficient * Math.exp(exponent);
            sum += value;
            kernel.push(value);
        }

        for (let i = 0; i < width; i++) {
            kernel[i] /= sum;
        }
        return kernel;
    }

    private convertKernelToOffsetsAndScales(kernel: number[]): number[] {
        if ((kernel.length & 1) === 0) throw new Error('Only odd kernel sizes can be lerped');

        const radius = Math.ceil(kernel.length / 2);
        const data: number[] = [];

        let offset = -radius + 1;
        let scale = kernel[0];
        data.push(offset, scale);

        const total = kernel.reduce((c, v) => c + v);

        for (let i = 1; i < kernel.length; i += 2) {
            const a = kernel[i];
            const b = kernel[i + 1];

            offset = -radius + 1 + i + (b / (a + b));
            scale = (a + b) / total;
            data.push(offset, scale);
        }
        return data
    }

    private setKernel(radius: number) {
        const gl = this.gl;
        if (!gl) {
            console.error("failure during setting kernel")
            return
        }
        let width = radius * 2 + 1;
        if (width > 255) width = 255;
        if ((width % 2) === 0) width += 1;

        const kernel1D = this.generate1DKernel(width);
        const lerpKernel = this.convertKernelToOffsetsAndScales(kernel1D);
        const numberOfOffsetsAndScales = lerpKernel.length / 2;

        this.offsetsAndScales!.fill(0);
        this.offsetsAndScales!.set(lerpKernel);

        gl.uniform2fv(this.uniforms.offsetAndScale, this.offsetsAndScales!);
        gl.uniform1i(this.uniforms.kernelWidth, numberOfOffsetsAndScales);
    }

    private _drawUnidirectionalBlur(sourceTexture: WebGLTexture, destinationFBO: WebGLFramebuffer | null, uvStride: [number, number]) {
        const gl = this.gl;
        if (!gl){
            console.error('gl is null')
            return 
        }

        gl.bindVertexArray(this.blurVAO);
        gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, destinationFBO);

        gl.uniform2fv(this.uniforms.uvStride, uvStride);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    public updateInputMask(data: ImageData){
        const gl = this.gl;
        if (!gl) {
            console.log("GL not initialized !")
            return;
        }
        gl.bindTexture(gl.TEXTURE_2D, this.inputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    /**
     * Applies the two-pass Gaussian blur to the given image data and returns a new ImageData object.
     */
    public applyBlur(radius: number): ImageData | null {
        const gl = this.gl as WebGL2RenderingContext;
        const uvStrideWidth = 1 / this.width;
        const uvStrideHeight = 1 / this.height;
        

        // 2. Set the blur kernel based on the radius
        gl.useProgram(this.program);
        this.setKernel(radius);

        if (!this.inputTexture || !this.intermediateTexture){
            console.error("null input texture or intermediate texture")
            return null;
        }


        // 3. FIRST PASS: Horizontal Blur (Input -> Intermediate FBO)
        this._drawUnidirectionalBlur(this.inputTexture, this.intermediateFbo, [uvStrideWidth, 0]);

        // 4. SECOND PASS: Vertical Blur (Intermediate -> OUTPUT FBO)
        this._drawUnidirectionalBlur(this.intermediateTexture!, this.outputFbo, [0, uvStrideHeight]);

        // 5. READ PIXELS BACK FROM the OUTPUT FBO
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.outputFbo);
        const pixelData = new Uint8Array(this.width * this.height * 4);
        gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // 6. Create and return a new ImageData object
        const imageDataResult = this.ctx2d!.createImageData(this.width, this.height);
        imageDataResult.data.set(pixelData);
        console.log(imageDataResult)

        return imageDataResult;
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
        if (webGLProcessor.init(context.originalImageData.width, context.originalImageData.height)) {
            context.setIsWebGLLoaded(true);
        } else {
            console.error("Failed to initialize webGL :( ")
        }
    }

}
