import { parseShader } from "./parse";

type TypedArray =
	| Int8Array
	| Uint8Array
	| Int16Array
	| Uint16Array
	| Int32Array
	| Uint32Array
	| Float16Array
	| Float32Array;

interface AttributeObject {
	buffer: WebGLBuffer;
	data: number[];
	type: "i8" | "u8" | "i16" | "u16" | "i32" | "u32" | "f16" | "f32";
	normalize: boolean;
	stride: number;
	offset: number;
}

type UniformData = boolean | number | number[] | WebGLTexture;

function setUniform(
	gl: WebGL2RenderingContext,
	data: UniformData,
	uniformState: {
		type: string;
		loc: WebGLUniformLocation;
	},
) {
	if (!uniformState) {
		return;
	}

	switch (uniformState.type) {
		case "bool":
			gl.uniform1i(uniformState.loc, (data as boolean) ? 1 : 0);
			break;
		case "int":
			gl.uniform1i(uniformState.loc, data as number);
			break;
		case "uint":
			gl.uniform1ui(uniformState.loc, data as number);
			break;
		case "float":
			gl.uniform1f(uniformState.loc, data as number);
			break;
		case "vec2":
			gl.uniform2fv(uniformState.loc, data as number[]);
			break;
		case "vec3":
			gl.uniform3fv(uniformState.loc, data as number[]);
			break;
		case "vec4":
			gl.uniform4fv(uniformState.loc, data as number[]);
			break;
		case "bvec2":
			gl.uniform2fv(uniformState.loc, data as number[]);
			break;
		case "bvec3":
			gl.uniform3fv(uniformState.loc, data as number[]);
			break;
		case "bvec4":
			gl.uniform4fv(uniformState.loc, data as number[]);
			break;
		case "ivec2":
			gl.uniform2iv(uniformState.loc, data as number[]);
			break;
		case "ivec3":
			gl.uniform3iv(uniformState.loc, data as number[]);
			break;
		case "ivec4":
			gl.uniform4iv(uniformState.loc, data as number[]);
			break;
		case "uvec2":
			gl.uniform2uiv(uniformState.loc, data as number[]);
			break;
		case "uvec3":
			gl.uniform3uiv(uniformState.loc, data as number[]);
			break;
		case "uvec4":
			gl.uniform4uiv(uniformState.loc, data as number[]);
			break;
		case "mat2":
			gl.uniformMatrix2fv(uniformState.loc, false, data as number[]);
			break;
		case "mat3":
			gl.uniformMatrix3fv(uniformState.loc, false, data as number[]);
			break;
		case "mat4":
			gl.uniformMatrix4fv(uniformState.loc, false, data as number[]);
			break;
		case "mat2x2":
			gl.uniformMatrix2fv(uniformState.loc, false, data as number[]);
			break;
		case "mat2x3":
			gl.uniformMatrix2x3fv(uniformState.loc, false, data as number[]);
			break;
		case "mat2x4":
			gl.uniformMatrix2x4fv(uniformState.loc, false, data as number[]);
			break;
		case "mat3x2":
			gl.uniformMatrix3x2fv(uniformState.loc, false, data as number[]);
			break;
		case "mat3x3":
			gl.uniformMatrix3fv(uniformState.loc, false, data as number[]);
			break;
		case "mat3x4":
			gl.uniformMatrix3x4fv(uniformState.loc, false, data as number[]);
			break;
		case "mat4x2":
			gl.uniformMatrix4x2fv(uniformState.loc, false, data as number[]);
			break;
		case "mat4x3":
			gl.uniformMatrix4x3fv(uniformState.loc, false, data as number[]);
			break;
		case "mat4x4":
			gl.uniformMatrix4fv(uniformState.loc, false, data as number[]);
			break;
		case "sampler2D":
			break;
	}
}

function setUniforms(
	gl: WebGL2RenderingContext,
	uniforms: Record<string, UniformData>,
	uniformState: Record<string, { type: string; loc: WebGLUniformLocation }>,
) {
	for (const key in uniforms) {
		// biome-ignore lint/style/noNonNullAssertion: _
		setUniform(gl, uniforms[key]!, uniformState[key]!);
	}
}

function parseUniformState(
	gl: WebGL2RenderingContext,
	program: WebGLProgram,
	parsedShaders: {
		vertex: Record<string, string>;
		fragment: Record<string, string>;
	},
) {
	const uniforms: Record<string, { type: string; loc: WebGLUniformLocation }> =
		{};

	const vertex = parsedShaders.vertex;
	const fragment = parsedShaders.fragment;
	const keys = [...Object.keys(vertex), ...Object.keys(fragment)];

	for (const key of keys) {
		const type = vertex[key] || fragment[key];
		if (!type) {
			throw new Error(`unable to infer the type of '${key}' from shader`);
		}

		const loc = gl.getUniformLocation(program, key);
		if (loc === null) {
			console.warn(`uniform '${key}' not found`);
			continue;
		}

		uniforms[key] = { type, loc };
	}

	return uniforms;
}

function setAttribute(
	gl: WebGL2RenderingContext,
	attribute: AttributeObject,
	attributeState: { loc: number; type: string },
) {
	const { buffer, data, normalize, stride, offset } = attribute;
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

	const size = {
		bool: 1,
		int: 1,
		uint: 1,
		float: 1,
		vec2: 2,
		vec3: 3,
		vec4: 4,
		bvec2: 2,
		bvec3: 3,
		bvec4: 4,
		ivec2: 2,
		ivec3: 3,
		ivec4: 4,
		uvec2: 2,
		uvec3: 3,
		uvec4: 4,
	}[attributeState.type];
	if (!size) {
		throw new Error(`'${attributeState.type}' is not a valid attribute type`);
	}

	let bufferType: GLenum;
	let bufferData: TypedArray;
	switch (attribute.type) {
		case "i8":
			bufferType = gl.BYTE;
			bufferData = new Int8Array(data);
			break;
		case "u8":
			bufferType = gl.UNSIGNED_BYTE;
			bufferData = new Uint8Array(data);
			break;
		case "i16":
			bufferType = gl.SHORT;
			bufferData = new Int16Array(data);
			break;
		case "u16":
			bufferType = gl.UNSIGNED_SHORT;
			bufferData = new Uint16Array(data);
			break;
		case "i32":
			bufferType = gl.INT;
			bufferData = new Int32Array(data);
			break;
		case "u32":
			bufferType = gl.UNSIGNED_INT;
			bufferData = new Uint32Array(data);
			break;
		case "f16":
			bufferType = gl.HALF_FLOAT;
			bufferData = new Float16Array(data);
			break;
		case "f32":
			bufferType = gl.FLOAT;
			bufferData = new Float32Array(data);
			break;
	}

	gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);
	gl.enableVertexAttribArray(attributeState.loc);
	gl.vertexAttribPointer(
		attributeState.loc,
		size,
		bufferType,
		normalize,
		stride,
		offset,
	);
}

function setAttributes(
	gl: WebGL2RenderingContext,
	attributes: Record<string, AttributeObject>,
	attributeState: Record<string, { loc: number; type: string }>,
) {
	for (const key in attributes) {
		// biome-ignore lint/style/noNonNullAssertion: _
		setAttribute(gl, attributes[key]!, attributeState[key]!);
	}
}

function parseAttributeState(
	gl: WebGL2RenderingContext,
	program: WebGLProgram,
	vertex: Record<string, string>,
) {
	const attributes: Record<string, { type: string; loc: number }> = {};
	const keys = Object.keys(vertex);

	for (const key of keys) {
		const type = vertex[key];
		if (!type) {
			throw new Error(`unable to infer the type of '${key}' from shader`);
		}

		const loc = gl.getAttribLocation(program, key);
		attributes[key] = { type, loc };
	}

	return attributes;
}

export function webglUtilities(gl: WebGL2RenderingContext) {
	return {
		program(vertex: WebGLShader, fragment: WebGLShader) {
			const program = gl.createProgram();
			gl.attachShader(program, vertex);
			gl.attachShader(program, fragment);
			gl.linkProgram(program);
			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				const infoLog = gl.getProgramInfoLog(program);
				gl.deleteProgram(program);
				throw new Error(`failed to create program\n\n${infoLog}`);
			}

			const parsedVertex = parseShader((vertex as { source: string }).source);
			const parsedFragment = parseShader(
				(fragment as { source: string }).source,
			);

			const attributeState = parseAttributeState(
				gl,
				program,
				parsedVertex.attributes,
			);
			const uniformState = parseUniformState(gl, program, {
				vertex: parsedVertex.uniforms,
				fragment: parsedFragment.uniforms,
			});

			// biome-ignore lint/suspicious/noExplicitAny: _
			(program as any).setAttributes = (
				attributes: Record<string, AttributeObject>,
			) => {
				setAttributes(gl, attributes, attributeState);
			};
			// biome-ignore lint/suspicious/noExplicitAny: _
			(program as any).setUniforms = (
				uniforms: Record<string, UniformData>,
			) => {
				setUniforms(gl, uniforms, uniformState);
			};
			// biome-ignore lint/suspicious/noExplicitAny: _
			(program as any).setUniform = (name: string, data: UniformData) => {
				if (uniformState[name]) {
					setUniform(gl, data, uniformState[name]);
				}
			};

			return program as ExtendedWebGLProgram;
		},
		shader(source: string, type: "vertex" | "fragment") {
			const shaderType =
				type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;
			const shader = gl.createShader(shaderType);
			if (!shader) {
				throw new Error(`failed to create ${type} shader`);
			}
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				const infoLog = gl.getShaderInfoLog(shader);
				gl.deleteShader(shader);
				throw new Error(`failed to compile ${type} shader\n\n${infoLog}`);
			}
			(shader as { source: string }).source = source;
			return shader;
		},
		buffer(
			data: number[] | number[][],
			options?: Partial<Omit<AttributeObject, "buffer" | "data">>,
		) {
			const buffer = gl.createBuffer();

			return {
				buffer,
				data: data.flat(),
				type: options?.type || "f32",
				normalize: options?.normalize || false,
				stride: options?.stride || 0,
				offset: options?.offset || 0,
			};
		},
		frameBuffer(options?: { texture?: WebGLTexture | null }) {
			const fbo = gl.createFramebuffer();

			if (options?.texture) {
				gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
				gl.framebufferTexture2D(
					gl.FRAMEBUFFER,
					gl.COLOR_ATTACHMENT0,
					gl.TEXTURE_2D,
					options.texture,
					0,
				);
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			}

			return fbo;
		},
		texture(
			options: (
				| {
						source: TexImageSource;
						width?: never;
						height?: never;
						pixels?: never;
				  }
				| {
						source?: never;
						width: number;
						height: number;
						pixels: ArrayBufferView<ArrayBufferLike> | null;
				  }
			) & {
				mag?: "linear" | "nearest";
				min?:
					| "linear"
					| "nearest"
					| "nearest_mipmap_nearest"
					| "linear_mipmap_nearest"
					| "nearest_mipmap_linear"
					| "linear_mipmap_linear";
				wrapS?: "repeat" | "clamp_to_edge" | "mirrored_repeat";
				wrapT?: "repeat" | "clamp_to_edge" | "mirrored_repeat";
			},
		) {
			const texture = gl.createTexture();

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);

			const valueMag = {
				linear: gl.LINEAR,
				nearest: gl.NEAREST,
			}[options.mag || "nearest"];
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, valueMag);

			const valueMin = {
				linear: gl.LINEAR,
				nearest: gl.NEAREST,
				nearest_mipmap_nearest: gl.NEAREST_MIPMAP_NEAREST,
				linear_mipmap_nearest: gl.LINEAR_MIPMAP_NEAREST,
				nearest_mipmap_linear: gl.NEAREST_MIPMAP_LINEAR,
				linear_mipmap_linear: gl.LINEAR_MIPMAP_LINEAR,
			}[options.min || "nearest"];
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, valueMin);

			const valueWrapS = {
				repeat: gl.REPEAT,
				clamp_to_edge: gl.CLAMP_TO_EDGE,
				mirrored_repeat: gl.MIRRORED_REPEAT,
			}[options.wrapS || "clamp_to_edge"];
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, valueWrapS);

			const valueWrapT = {
				repeat: gl.REPEAT,
				clamp_to_edge: gl.CLAMP_TO_EDGE,
				mirrored_repeat: gl.MIRRORED_REPEAT,
			}[options.wrapT || "clamp_to_edge"];
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, valueWrapT);

			if (options.source) {
				gl.texImage2D(
					gl.TEXTURE_2D,
					0,
					gl.RGBA,
					gl.RGBA,
					gl.UNSIGNED_BYTE,
					options.source,
				);
			} else {
				gl.texImage2D(
					gl.TEXTURE_2D,
					0,
					gl.RGBA,
					options.width,
					options.height,
					0,
					gl.RGBA,
					gl.UNSIGNED_BYTE,
					options.pixels,
				);
			}

			// biome-ignore lint/suspicious/noExplicitAny: _
			(texture as any).replace = (
				options:
					| {
							source: TexImageSource;
							width?: never;
							height?: never;
							pixels?: never;
					  }
					| {
							source?: never;
							width: number;
							height: number;
							pixels: ArrayBufferView<ArrayBufferLike> | null;
					  },
			) => {
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, texture);
				if (options.source) {
					gl.texImage2D(
						gl.TEXTURE_2D,
						0,
						gl.RGBA,
						gl.RGBA,
						gl.UNSIGNED_BYTE,
						options.source,
					);
				} else {
					gl.texImage2D(
						gl.TEXTURE_2D,
						0,
						gl.RGBA,
						options.width,
						options.height,
						0,
						gl.RGBA,
						gl.UNSIGNED_BYTE,
						options.pixels,
					);
				}
			};

			return texture as ExtendedWebGLTexture;
		},
		clear(options: {
			color: [number, number, number, number];
			mask: GLbitfield;
		}) {
			gl.clearColor(...options.color);
			gl.clear(options.mask);
		},
	};
}

export type WebGL2Utils = ReturnType<typeof webglUtilities>;

export type ExtendedWebGLProgram = WebGLProgram & {
	setAttributes(attributes: Record<string, AttributeObject>): void;
	setUniforms(uniforms: Record<string, UniformData>): void;
	setUniform(name: string, data: UniformData): void;
};

export type ExtendedWebGLTexture = WebGLTexture & {
	replace(
		options:
			| {
					source: TexImageSource;
					width?: never;
					height?: never;
					pixels?: never;
			  }
			| {
					source?: never;
					width: number;
					height: number;
					pixels: ArrayBufferView<ArrayBufferLike> | null;
			  },
	): void;
};
