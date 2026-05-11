import { motion } from "framer-motion";
import { domToCanvas } from "modern-screenshot";
import { useEffect, useRef, useState } from "react";

interface ShareFrameProps {
	containerRef: React.RefObject<HTMLDivElement | null>;
	onClose: () => void;
}

type AspectRatio = "4:5" | "9:16" | "1:1";

export const ShareFrame = ({ containerRef, onClose }: ShareFrameProps) => {
	const [ratio, setRatio] = useState<AspectRatio>("9:16");
	const [isCapturing, setIsCapturing] = useState(false);
	const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
	const frameRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth < 1024);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const handleCapture = async () => {
		if (!containerRef.current || !frameRef.current) return;

		setIsCapturing(true);
		document.body.classList.add("hide-shadows-for-capture");
		containerRef.current?.classList.add("hide-shadows-for-capture");
		try {
			const SCALE = 4;
			const containerRect = containerRef.current.getBoundingClientRect();
			const frameRect = frameRef.current.getBoundingClientRect();

			const canvas = await domToCanvas(containerRef.current, {
				scale: SCALE,
				width: containerRect.width,
				height: containerRect.height,
				style: {
					width: `${containerRect.width}px`,
					height: `${containerRect.height}px`,
				},
				filter: (node: Node) => {
					const el = node as Element;
					if (el.classList?.contains("share-frame-overlay")) return false;
					if (el.classList?.contains("z-[1000]")) return false;
					if (el.classList?.contains("main-ui-layer")) return false;
					return true;
				},
				fetch: {
					bypassingCache: true,
				},
			});

			const x = (frameRect.left - containerRect.left) * SCALE;
			const y = (frameRect.top - containerRect.top) * SCALE;
			const width = frameRect.width * SCALE;
			const height = frameRect.height * SCALE;

			const cropCanvas = document.createElement("canvas");
			cropCanvas.width = width;
			cropCanvas.height = height;
			const ctx = cropCanvas.getContext("2d");

			if (ctx) {
				const radius = 6 * SCALE;
				ctx.beginPath();
				ctx.moveTo(radius, 0);
				ctx.lineTo(width - radius, 0);
				ctx.quadraticCurveTo(width, 0, width, radius);
				ctx.lineTo(width, height - radius);
				ctx.quadraticCurveTo(width, height, width - radius, height);
				ctx.lineTo(radius, height);
				ctx.quadraticCurveTo(0, height, 0, height - radius);
				ctx.lineTo(0, radius);
				ctx.quadraticCurveTo(0, 0, radius, 0);
				ctx.closePath();
				ctx.clip();

				ctx.drawImage(canvas, x, y, width, height, 0, 0, width, height);

				cropCanvas.toBlob(
					async (blob) => {
						if (!blob) return;
						const file = new File([blob], `personal-shelf-${Date.now()}.png`, {
							type: "image/png",
						});

						if (
							navigator.share &&
							navigator.canShare &&
							navigator.canShare({ files: [file] })
						) {
							try {
								await navigator.share({
									files: [file],
									title: "Minha Prateleira",
									text: "Olha só a minha coleção na Prateleira!",
								});
								onClose();
							} catch (err: any) {
								console.error("Erro ao compartilhar:", err);
								if (err.name !== "AbortError") {
									downloadFile(file);
								}
								onClose();
							}
						} else {
							downloadFile(file);
							onClose();
						}
					},
					"image/png",
					1.0,
				);
			}
		} catch (err) {
			console.error("Erro na captura:", err);
		} finally {
			document.body.classList.remove("hide-shadows-for-capture");
			containerRef.current?.classList.remove("hide-shadows-for-capture");
			setIsCapturing(false);
		}
	};

	const downloadFile = (file: File) => {
		const url = URL.createObjectURL(file);
		const a = document.createElement("a");
		a.href = url;
		a.download = file.name;
		a.click();
		URL.revokeObjectURL(url);
	};

	const getFrameDimensions = () => {
		const screenW = window.innerWidth;
		const screenH = window.innerHeight;

		const maxWidth = isMobile ? screenW * 0.96 : screenW * 0.85;
		const maxHeight = isMobile ? screenH * 0.82 : screenH * 0.85;

		switch (ratio) {
			case "1:1": {
				const size = Math.min(maxWidth, maxHeight);
				return { width: size, height: size };
			}
			case "9:16": {
				let h = maxHeight;
				let w = h * (9 / 16);
				if (w > maxWidth) {
					w = maxWidth;
					h = w * (16 / 9);
				}
				return { width: w, height: h };
			}
			case "4:5": {
				let h = maxHeight;
				let w = h * (4 / 5);
				if (w > maxWidth) {
					w = maxWidth;
					h = w * (5 / 4);
				}
				return { width: w, height: h };
			}
		}
	};

	const dims = getFrameDimensions();

	return (
		<div className="fixed inset-0 z-[10000] share-frame-overlay pointer-events-none overflow-hidden">
			{/* Close Button (X) - Standard size used in modals */}
			<div className="absolute top-6 right-6 z-[10005] pointer-events-auto">
				<button
					onClick={onClose}
					className="p-2 rounded-full bg-white/80 hover:bg-white backdrop-blur-md text-gray-500 shadow-sm border border-black/5 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			{/* Frame Layer - Centered */}
			<div className="absolute inset-0 flex items-center justify-center">
				<div className="relative">
					{/* Mask */}
					<motion.div
						animate={{
							width: dims.width,
							height: dims.height,
						}}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
						className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 shadow-[0_0_0_10000px_rgba(0,0,0,0.6)] rounded-md pointer-events-none"
					/>

					{/* The Frame */}
					<motion.div
						ref={frameRef}
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{
							scale: 1,
							opacity: 1,
							width: dims.width,
							height: dims.height,
						}}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
						className="relative z-10 border-2 border-white/50 rounded-md"
					>
						<div className="absolute inset-0 border border-white/20 rounded-lg pointer-events-none" />

						{/* Controls centered inside the frame */}
						<div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-5 pointer-events-auto w-[90%] max-w-[300px]">
							<div className="flex items-center justify-center gap-1 w-auto bg-black/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
								{(["1:1", "9:16", "4:5"] as AspectRatio[]).map((r) => (
									<button
										key={r}
										onClick={() => setRatio(r)}
										className={`px-5 py-2 rounded-xl text-[11px] font-bold transition-all ${
											ratio === r
												? "bg-white text-black shadow-lg"
												: "text-white/60 hover:text-white"
										}`}
									>
										{r}
									</button>
								))}
							</div>

							<button
								onClick={handleCapture}
								disabled={isCapturing}
								className="cursor-pointer px-16 py-3.5 bg-white text-black rounded-2xl font-bold text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2"
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
									<path
										fillRule="evenodd"
										clipRule="evenodd"
										d="M15.3994 2.75003C15.9794 2.75003 16.4268 2.74213 16.8467 2.87113C17.1099 2.95201 17.3594 3.07258 17.5869 3.22757C17.9499 3.47488 18.2236 3.8284 18.5859 4.28128L19.1309 4.96292C19.2759 5.1442 19.4954 5.2499 19.7275 5.25003C21.3965 5.25003 22.7499 6.60353 22.75 8.27249V14.5645C22.75 15.9275 22.75 17.0267 22.6338 17.8916C22.5128 18.7917 22.2533 19.5495 21.6514 20.1514C21.0495 20.7533 20.2917 21.0128 19.3916 21.1338C18.5267 21.2501 17.4275 21.2501 16.0645 21.25H7.93555C6.57249 21.2501 5.47331 21.2501 4.6084 21.1338C3.7083 21.0128 2.95055 20.7533 2.34863 20.1514C1.74675 19.5495 1.48722 18.7917 1.36621 17.8916C1.24996 17.0267 1.24997 15.9275 1.25 14.5645V11.9356C1.24997 10.5726 1.24995 9.47333 1.36621 8.60843C1.48723 7.70837 1.74674 6.95056 2.34863 6.34867C2.95054 5.74678 3.70831 5.48726 4.6084 5.36624C5.47331 5.24998 6.57249 5.25001 7.93555 5.25003H8.39942C9.07227 5.25003 9.25209 5.24271 9.40625 5.19535C9.52573 5.15861 9.63886 5.10359 9.74219 5.03324C9.87547 4.94244 9.99368 4.80677 10.4141 4.28128C10.7764 3.8284 11.0501 3.47488 11.4131 3.22757C11.6406 3.07258 11.8901 2.95201 12.1533 2.87113C12.5732 2.74213 13.0206 2.75003 13.6006 2.75003H15.3994ZM18.4121 13.8731C18.066 13.6459 17.6005 13.742 17.373 14.0879C16.6919 15.1244 15.6415 15.75 14.5 15.75C13.3586 15.7499 12.3081 15.1244 11.627 14.0879C11.3994 13.7421 10.9339 13.6457 10.5879 13.8731C10.2419 14.1005 10.1458 14.5661 10.373 14.9121C11.2881 16.3044 12.7792 17.2499 14.5 17.25C16.2209 17.25 17.7119 16.3045 18.627 14.9121C18.8544 14.566 18.7582 14.1006 18.4121 13.8731ZM11.5 9.50003C10.9477 9.50003 10.5 9.94775 10.5 10.5V10.5098C10.5 11.0621 10.9477 11.5098 11.5 11.5098C12.0523 11.5098 12.5 11.0621 12.5 10.5098V10.5C12.5 9.94775 12.0523 9.50003 11.5 9.50003ZM17.5 9.49222C16.9477 9.49222 16.5 9.93994 16.5 10.4922V10.502C16.5 11.0543 16.9477 11.502 17.5 11.502C18.0523 11.502 18.5 11.0543 18.5 10.502V10.4922C18.5 9.93994 18.0523 9.49222 17.5 9.49222ZM5 8.00003C4.44772 8.00003 4 8.44775 4 9.00003C4 9.55232 4.44772 10 5 10H7C7.55229 10 8 9.55232 8 9.00003C8 8.44775 7.55229 8.00003 7 8.00003H5Z"
										fill="currentColor"
									/>
								</svg>
								Capturar
							</button>
						</div>
					</motion.div>
				</div>
			</div>
		</div>
	);
};
