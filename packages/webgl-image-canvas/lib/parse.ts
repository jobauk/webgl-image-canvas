export function parseShader(shader: string) {
	const attributes: Record<string, string> = {};
	const uniforms: Record<string, string> = {};

	let scope = 0;
	let pos = 0;

	function nextToken() {
		// skip leading ws
		while (true) {
			const c = shader[pos]?.charCodeAt(0);

			if (c === 32 || c === 9 || c === 10 || c === 12 || c === 13) {
				pos++;
				continue;
			}

			break;
		}

		for (let i = pos; i < shader.length; i++) {
			const c = shader[i]?.charCodeAt(0);

			if (!c) {
				continue;
			}

			// A-Z
			if (c >= 65 && c <= 90) {
				continue;
			}

			// a-z
			if (c >= 97 && c <= 122) {
				continue;
			}

			// 0-9
			if (c >= 48 && c <= 57) {
				continue;
			}

			// @#$_
			if (c === 64 || c === 35 || c === 36 || c === 95) {
				continue;
			}

			const start = pos;
			const end = i;
			const token = shader.slice(start, end);

			pos = end;
			return token;
		}

		throw new Error("unable to parse shader");
	}

	for (; pos < shader.length; pos++) {
		switch (shader[pos]) {
			case "i":
				if (scope > 0) {
					continue;
				}

				if (shader[pos + 1] === "n" && shader[pos + 2] === " ") {
					pos += 3;
					const type = nextToken();
					const ident = nextToken();
					attributes[ident] = type;
				}
				break;
			case "u":
				if (scope > 0) {
					continue;
				}

				if (
					shader.slice(pos, pos + 7) === "uniform" &&
					shader[pos + 7] === " "
				) {
					pos += 8;
					const type = nextToken();
					const ident = nextToken();
					uniforms[ident] = type;
				}
				break;
			case "{":
				scope++;
				break;
			case "}":
				scope--;
		}
	}

	return { attributes, uniforms };
}
