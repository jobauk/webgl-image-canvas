import { type Mat3, mat3 } from "./math";
import fragmentShaderSource from "./shaders/lanczos.glsl?raw";
import vertexShaderSource from "./shaders/vertex.glsl?raw";
import {
	type ExtendedWebGLProgram,
	type ExtendedWebGLTexture,
	type WebGL2Utils,
	webglUtilities,
} from "./util";

export class WebGL2ImageCanvas {
	public canvas: HTMLCanvasElement;
	private gl: WebGL2RenderingContext;
	private program: ExtendedWebGLProgram;
	private w: WebGL2Utils;

	private texture: ExtendedWebGLTexture;
	private intermediateTexture: ExtendedWebGLTexture;
	private fbo: WebGLFramebuffer;

	private maxWidth = 0;
	private maxHeight = 0;
	private width = 0;
	private height = 0;

	// uniforms
	private transformationMatrix: Mat3;
	private brightness: number = 0;
	private contrast: number = 1;
	private exposure: number = 0;

	private needsRedraw = true;

	constructor() {
		const canvas = document.createElement("canvas");
		const gl = canvas.getContext("webgl2");
		if (!gl) {
			throw new Error("webgl2 not supported");
		}

		canvas.style.width = '100%';
		canvas.style.height = '100%';

		const w = webglUtilities(gl);

		const program = w.program(
			w.shader(vertexShaderSource, "vertex"),
			w.shader(fragmentShaderSource, "fragment"),
		);
		gl.useProgram(program);

		const vao = gl.createVertexArray();
		gl.bindVertexArray(vao);

		const texture = w.texture({
			width: 500,
			height: 500,
			pixels: null,
		});
		const intermediateTexture = w.texture({
			width: 500,
			height: 500,
			pixels: null,
		});
		const fbo = w.frameBuffer({
			texture: intermediateTexture,
		});

		program.setUniforms({
			u_matrix: mat3.IDENTITY,
			u_resolution: [gl.canvas.width, gl.canvas.height],
			u_image: 0,
			u_flipY: -1,
			u_horizontal: false,
			u_brightness: this.brightness,
			u_contrast: this.contrast,
			u_exposure: this.exposure,
		});

		this.canvas = canvas;
		this.gl = gl;
		this.program = program;
		this.w = w;
		this.texture = texture;
		this.intermediateTexture = intermediateTexture;
		this.fbo = fbo;
		this.transformationMatrix = mat3.create() as Mat3;

		this.draw();
	}

	private draw() {
		self.requestAnimationFrame(() => {
			if (this.needsRedraw) {
				console.log("draw");

				const gl = this.gl;
				const program = this.program;
				const texture = this.texture;
				const intermediateTexture = this.intermediateTexture;
				const fbo = this.fbo;

				program.setUniforms({
					u_brightness: this.brightness,
					u_contrast: this.contrast,
					u_exposure: this.exposure,
				});

				gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
				gl.bindTexture(gl.TEXTURE_2D, texture);
				program.setUniforms({
					u_matrix: mat3.IDENTITY,
					u_flipY: -1,
					u_horizontal: true,
				});
				gl.drawArrays(gl.TRIANGLES, 0, 6);

				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				gl.bindTexture(gl.TEXTURE_2D, intermediateTexture);
				program.setUniforms({
					u_matrix: this.transformationMatrix,
					u_flipY: 1,
					u_horizontal: false,
				});
				gl.drawArrays(gl.TRIANGLES, 0, 6);

				this.needsRedraw = false;
			}

			this.draw();
		});
	}

	public resize(width: number, height: number) {
		this.maxWidth = width;
		this.maxHeight = height;
	}

	public setImage(src: string) {
		fetch(src)
			.then((res) => res.blob())
			.then(createImageBitmap)
			.then((image) => {
				const scaleX = this.maxWidth / image.width;
				const scaleY = this.maxHeight / image.height;
				const scale = Math.min(scaleX, scaleY);

				this.width=image.width * scale;
				this.height = image.height * scale;
				this.canvas.style.width = `${image.width * scale}px`;
				this.canvas.style.height = `${image.height * scale}px`;

				this.gl.canvas.width = image.width;
				this.gl.canvas.height = image.height;

				this.gl.viewport(0, 0, image.width, image.height);

				this.program.setAttributes({
					a_position: this.w.buffer([
						[0, 0],
						[this.gl.canvas.width, 0],
						[this.gl.canvas.width, this.gl.canvas.height],
						[this.gl.canvas.width, this.gl.canvas.height],
						[0, this.gl.canvas.height],
						[0, 0],
					]),
				});

				this.program.setUniforms({
					u_resolution: [this.gl.canvas.width, this.gl.canvas.height],
				});

				this.texture.replace({
					source: image,
				});
				this.intermediateTexture.replace({
					width: image.width,
					height: image.height,
					pixels: null,
				});

				this.needsRedraw = true;
			});
	}

	public setRotation(deg: number) {
		const radians = (deg * Math.PI) / 180;
		const c = Math.cos(radians);
		const s = Math.sin(radians);

		const w = this.width;
		const h = this.height;
		const scale =
			1 /
			Math.max(
				(w * Math.abs(c) + h * Math.abs(s)) / w,
				(w * Math.abs(s) + h * Math.abs(c)) / h,
			);

		const tx = this.canvas.width / 2;
		const ty = this.canvas.height / 2;

		this.transformationMatrix[0] = c * scale;
		this.transformationMatrix[1] = -s * scale;
		this.transformationMatrix[2] = 0;
		this.transformationMatrix[3] = s * scale;
		this.transformationMatrix[4] = c * scale;
		this.transformationMatrix[5] = 0;
		this.transformationMatrix[6] = tx * (1 - c * scale) - ty * s * scale;
		this.transformationMatrix[7] = ty * (1 - c * scale) + tx * s * scale;
		this.transformationMatrix[8] = 1;

		this.needsRedraw = true;
	}

	public setBrightness(value: number) {
		this.brightness = value;
		this.needsRedraw = true;
	}

	public setContrast(value: number) {
		this.contrast = value;
		this.needsRedraw = true;
	}

	public setExposure(value: number) {
		this.exposure = value;
		this.needsRedraw = true;
	}
}
