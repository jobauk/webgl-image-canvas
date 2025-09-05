export type Mat3 = [
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
];

export namespace mat3 {
	export const IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1];

	export function create() {
		const out = new Array(9) as Mat3;
		out[0] = 1;
		out[1] = 0;
		out[2] = 0;
		out[3] = 0;
		out[4] = 1;
		out[5] = 0;
		out[6] = 0;
		out[7] = 0;
		out[8] = 1;
		return out;
	}
}
