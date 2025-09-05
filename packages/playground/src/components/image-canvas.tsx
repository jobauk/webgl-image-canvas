import {
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
	type RefObject,
} from "react";
import { WebGL2ImageCanvas } from "webgl-image-canvas";

type ClassMethods<T> = {
	[K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: T[K];
};

interface ImageCanvasProps {
	ref?: RefObject<ImageCanvasRef | null>;
	src?: string;
}

export type ImageCanvasRef = Omit<ClassMethods<WebGL2ImageCanvas>, "resize">;

export function ImageCanvas({ ref }: ImageCanvasProps) {
	const container = useRef<HTMLDivElement>(null);
	const [editor] = useState(() => new WebGL2ImageCanvas());

	useEffect(() => {
		if (!container.current || container.current.hasChildNodes()) {
			return;
		}

		editor.resize(
			container.current.clientWidth,
			container.current.clientHeight,
		);

		container.current.appendChild(editor.canvas);
	}, []);

	useImperativeHandle(ref, () => {
		return {
			setImage(src: string) {
				editor.setImage(src);
			},
			setRotation(deg: number) {
				editor.setRotation(deg);
			},
			setBrightness(value: number) {
				editor.setBrightness(value);
			},
			setContrast(value: number) {
				editor.setContrast(value);
			},
			setExposure(value: number) {
				editor.setExposure(value);
			},
		};
	});

	return (
		<div
			ref={container}
			className="size-full *:bg-secondary *:border-secondary *:border-2 flex justify-center items-center"
		/>
	);
}
