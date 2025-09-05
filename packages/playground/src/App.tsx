import { useRef, type ChangeEvent } from "react";
import { ImageCanvas, type ImageCanvasRef } from "~/components/image-canvas";
import { Input } from "~/components/ui/input";
import { Slider } from "./components/ui/slider";

export default function App() {
	const canvas = useRef<ImageCanvasRef>(null);

	function setImage(e: ChangeEvent<HTMLInputElement>) {
		const files = e.currentTarget.files;
		if (!files) {
			return;
		}
		const file = files.item(0);
		if (file) {
			canvas.current?.setImage(URL.createObjectURL(file));
		}
	}

	return (
		<div className="flex justify-center items-center p-8 size-full gap-12">
			<div className="size-full flex flex-col gap-6">
				<Input type="file" className="max-w-xs" onChange={setImage} />

				<ImageCanvas ref={canvas} />
			</div>
			<div className="min-w-2xs *:flex *:gap-3 *:flex-col flex flex-col gap-10">
				<div>
					<p>Rotation</p>
					<Slider
						min={-45}
						max={45}
						defaultValue={[0]}
						onValueChange={(v) => canvas.current?.setRotation(v[0])}
					/>
				</div>

				<div>
					<p>Brightness</p>
					<Slider
						min={-0.1}
						max={0.1}
						defaultValue={[0]}
						step={0.001}
						onValueChange={(v) => canvas.current?.setBrightness(v[0])}
					/>
				</div>

				<div>
					<p>Contrast</p>
					<Slider
						min={0.5}
						max={1.5}
						defaultValue={[1]}
						step={0.01}
						onValueChange={(v) => canvas.current?.setContrast(v[0])}
					/>
				</div>

				<div>
					<p>Exposure</p>
					<Slider
						min={-1}
						max={1}
						defaultValue={[0]}
						step={0.01}
						onValueChange={(v) => canvas.current?.setExposure(v[0])}
					/>
				</div>
			</div>
		</div>
	);
}
