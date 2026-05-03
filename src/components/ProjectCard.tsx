import { motion, useMotionValue, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import type { ShelfItem } from "../types/item";
import { StarIcon } from "./StarIcon";

const HeartIcon = ({ solid = false, broken = false, size = 12 }: { solid?: boolean; broken?: boolean; size?: number }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill={solid || broken ? "currentColor" : "none"}>
		{broken ? (
			<path 
				d="M17 2.75003C20.3484 2.75003 22.7499 5.45205 22.75 8.69437C22.75 11.1531 21.1899 13.6241 19.4189 15.6602C17.8453 17.4695 16.0032 19.0501 14.6074 20.1348L14.0381 20.5684C12.8985 21.4204 11.3812 21.4741 10.1943 20.7285L9.96191 20.5684C8.5291 19.4969 6.37954 17.728 4.58105 15.6602C2.8101 13.6241 1.25 11.1531 1.25 8.69437C1.25005 5.45205 3.65156 2.75003 7 2.75003C8.53685 2.75003 10.0261 3.22916 11.8066 4.79398L13.1553 8.84183L10.9238 11.5205C10.6758 11.8185 10.6957 12.2561 10.9697 12.5303L12.5869 14.1475L11.8291 15.666C11.6444 16.0364 11.7947 16.4868 12.165 16.6719C12.5353 16.8566 12.9857 16.7061 13.1709 16.336L14.1709 14.336C14.3152 14.0474 14.2583 13.698 14.0303 13.4698L12.5146 11.9541L14.5762 9.48148C14.7424 9.28208 14.7938 9.01 14.7119 8.7637L13.1387 4.043C14.5176 3.07042 15.743 2.75003 17 2.75003Z" 
				fill="currentColor"
			/>
		) : solid ? (
			<path 
				d="M19.4189 15.6602C21.1899 13.624 22.75 11.153 22.75 8.69434C22.7499 5.45202 20.3484 2.75 17 2.75C15.4082 2.75 13.8662 3.26268 12 4.96484C10.1338 3.26268 8.59184 2.75 7 2.75C3.65156 2.75 1.25005 5.45202 1.25 8.69434C1.25 11.153 2.8101 13.624 4.58105 15.6602C6.37954 17.7279 8.5291 19.4969 9.96191 20.5684L10.1943 20.7285C11.3812 21.4741 12.8985 21.4204 14.0381 20.5684L14.6074 20.1348C16.0032 19.05 17.8453 17.4694 19.4189 15.6602Z" 
				fill="currentColor"
			/>
		) : (
			<path
				d="M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		)}
	</svg>
);

interface ProjectCardProps {
	project: ShelfItem;
	onPositionChange: (id: string, x: number, y: number) => void;
	zIndex: number;
	onDragStart: () => void;
	onEdit?: (item: ShelfItem) => void;
	isOwner?: boolean;
	canvasScale?: number;
	isBlocked?: boolean;
	onDoubleClick?: (item: ShelfItem) => void;
	onLongPress?: (item: ShelfItem, x: number, y: number) => void;
	isLiked?: boolean;
	isMenuOpen?: boolean;
	onCloseMenu?: () => void;
	onSave?: (item: ShelfItem) => void;
	onPointerDown?: () => void;
	isDimmed?: boolean;
}

export const ProjectCard = ({
	project,
	onPositionChange,
	zIndex,
	onDragStart,
	onEdit,
	isOwner = false,
	canvasScale = 1,
	isBlocked = false,
	onDoubleClick,
	onLongPress,
	isLiked = false,
	isMenuOpen = false,
	onCloseMenu,
	onSave,
	onPointerDown: onPointerDownProp,
	isDimmed = false,
}: ProjectCardProps) => {
	const isDragging = useRef(false);
	const x = useMotionValue(project.x);
	const y = useMotionValue(project.y);
	const cardRef = useRef<HTMLDivElement>(null);
	const mediaRef = useRef<HTMLDivElement>(null);
	const [corner, setCorner] = useState<"tr" | "br" | "bl" | "tl">("tr");
	const [displayZIndex, setDisplayZIndex] = useState(zIndex);
	const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const updateCorner = () => {
		if (!mediaRef.current || !cardRef.current) return;
		const rect = mediaRef.current.getBoundingClientRect();

		// Cantos para testar (com um pequeno offset para dentro)
		const testPoints = [
			{ id: "tr" as const, x: rect.right - 5, y: rect.top + 5 },
			{ id: "br" as const, x: rect.right - 5, y: rect.bottom - 5 },
			{ id: "bl" as const, x: rect.left + 5, y: rect.bottom - 5 },
			{ id: "tl" as const, x: rect.left + 5, y: rect.top + 5 },
		];

		for (const point of testPoints) {
			const element = document.elementFromPoint(point.x, point.y);
			if (!element) continue;

			// Se o elemento no topo for o nosso card ou um filho nosso, o canto está livre
			const isOurs = cardRef.current.contains(element) || element === cardRef.current;
			if (isOurs) {
				setCorner(point.id);
				return;
			}

			// Se o elemento no topo NÃO for outro card (ex: fundo do canvas), o canto também está livre
			const isAnotherCard = element.closest(".card-draggable") && !cardRef.current.contains(element);
			if (!isAnotherCard) {
				setCorner(point.id);
				return;
			}
		}
		
		// Fallback para o padrão
		setCorner("tr");
	};

	useEffect(() => {
		const timer = setTimeout(updateCorner, 500);
		return () => clearTimeout(timer);
	}, [project.x, project.y]);

	useEffect(() => {
		if (!isDragging.current) {
			x.set(project.x);
			y.set(project.y);
		}
	}, [project.x, project.y, x, y]);

	useEffect(() => {
		if (isMenuOpen) {
			setDisplayZIndex(9999);
		} else {
			const timer = setTimeout(() => {
				setDisplayZIndex(zIndex);
			}, 400);
			return () => clearTimeout(timer);
		}
	}, [isMenuOpen, zIndex]);

	return (
		<motion.div
			ref={cardRef}
			onMouseEnter={updateCorner}
			onPointerDown={(e) => {
				// Impede que o canvas comece a arrastar quando clicamos no card
				e.stopPropagation();
				if (onPointerDownProp) onPointerDownProp();
				updateCorner();

				if (!isBlocked && !(e.target as HTMLElement).closest("button")) {
					onDragStart();
					
					// Toque longo
					longPressTimer.current = setTimeout(() => {
						if (!isDragging.current && onLongPress) {
							onLongPress(project, e.clientX, e.clientY);
						}
					}, 600);
				}
			}}
			onPointerUp={() => {
				if (longPressTimer.current) clearTimeout(longPressTimer.current);
			}}
			onPointerCancel={() => {
				if (longPressTimer.current) clearTimeout(longPressTimer.current);
			}}
			onDoubleClick={(e) => {
				e.stopPropagation();
				if (onDoubleClick) onDoubleClick(project);
			}}
			onPanStart={(e) => {
				if (isBlocked || (e.target as HTMLElement).closest("button")) return;
				isDragging.current = true;
			}}
			onPan={(_, info) => {
				if (!isDragging.current) return;
				x.set(x.get() + info.delta.x / canvasScale);
				y.set(y.get() + info.delta.y / canvasScale);
			}}
			onPanEnd={() => {
				if (!isDragging.current) return;
				setTimeout(() => {
					isDragging.current = false;
				}, 100);
				onPositionChange(project.id, x.get(), y.get());
			}}
			initial={{ opacity: 0, scale: 0.8 }}
			whileInView={{ opacity: 1, scale: 1 }}
			viewport={{ once: true }}
			animate={{ 
				filter: 'brightness(1) grayscale(0)',
				opacity: 1,
				scale: isDimmed ? 0.98 : 1
			}}
			whileHover={!isDimmed ? { scale: 1.02 } : {}}
			style={{
				position: "absolute",
				left: 0,
				top: 0,
				x: x,
				y: y,
				rotate: project.rotation,
				zIndex: displayZIndex,
			}}
			className={`${project.type === "text" ? "w-fit min-w-[100px]" : "w-32.5 sm:w-37.5 md:w-45"} cursor-grab active:cursor-grabbing group card-draggable`}
		>
			{project.type === "text" ? (
				<div 
					ref={mediaRef}
					className="relative flex flex-col justify-center items-center px-8 py-4 text-center transition-all duration-300 group-hover:scale-110"
				>
					{isOwner && onEdit && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onEdit(project);
							}}
							onPointerDown={(e) => {
								e.stopPropagation();
							}}
							onPointerUp={(e) => e.stopPropagation()}
							className={`z-10 absolute flex justify-center items-center bg-white opacity-0 group-hover:opacity-100 shadow-md border border-black/5 rounded-full w-9 h-9 text-black transition-all cursor-pointer hover:scale-110 active:scale-90 ${
								corner === "tr"
									? "-top-2 -right-2"
									: corner === "br"
										? "-bottom-2 -right-2"
										: corner === "bl"
											? "-bottom-2 -left-2"
											: "-top-2 -left-2"
							}`}
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
								<path
									d="M18.799 3.0499C17.7324 1.98335 16.0032 1.98337 14.9366 3.04994L13.5236 4.46296L19.537 10.4763L20.9501 9.06321C22.0167 7.99665 22.0166 6.26746 20.9501 5.20092L18.799 3.0499Z"
									fill="currentColor"
								></path>
								<path
									d="M18.4764 11.537L12.463 5.52363L4.35808 13.6286C3.66361 14.3231 3.20349 15.2172 3.04202 16.1859L2.26021 20.8767C2.22039 21.1156 2.29841 21.3591 2.46968 21.5303C2.64095 21.7016 2.88439 21.7796 3.12331 21.7398L7.81417 20.958C8.78294 20.7965 9.67706 20.3364 10.3715 19.642L18.4764 11.537Z"
									fill="currentColor"
								></path>
							</svg>
						</button>
					)}
					<h3
						className={`font-bold text-lg md:text-2xl text-black tracking-tighter leading-none whitespace-nowrap drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)] ${
							project.fontFamily === "serif"
								? "font-[Cormorant_Garamond]"
								: project.fontFamily === "mono"
									? "font-[JetBrains_Mono]"
									: project.fontFamily === "display"
										? "font-[Bebas_Neue]"
										: "font-sans"
						}`}
					>
						{project.titulo}
					</h3>
				</div>
			) : (
				<>
					<div ref={mediaRef} className="relative group/media">
						{isOwner && onEdit && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onEdit(project);
								}}
								onPointerDown={(e) => {
									e.stopPropagation();
								}}
								onPointerUp={(e) => e.stopPropagation()}
								className={`z-10 absolute flex justify-center items-center bg-white opacity-0 group-hover:opacity-100 shadow-md border border-black/5 rounded-full w-9 h-9 text-black transition-all cursor-pointer hover:scale-110 active:scale-90 ${
									corner === "tr"
										? "-top-2 -right-2"
										: corner === "br"
											? "-bottom-2 -right-2"
											: corner === "bl"
												? "-bottom-2 -left-2"
												: "-top-2 -left-2"
								}`}
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
									<path
										d="M18.799 3.0499C17.7324 1.98335 16.0032 1.98337 14.9366 3.04994L13.5236 4.46296L19.537 10.4763L20.9501 9.06321C22.0167 7.99665 22.0166 6.26746 20.9501 5.20092L18.799 3.0499Z"
										fill="currentColor"
									></path>
									<path
										d="M18.4764 11.537L12.463 5.52363L4.35808 13.6286C3.66361 14.3231 3.20349 15.2172 3.04202 16.1859L2.26021 20.8767C2.22039 21.1156 2.29841 21.3591 2.46968 21.5303C2.64095 21.7016 2.88439 21.7796 3.12331 21.7398L7.81417 20.958C8.78294 20.7965 9.67706 20.3364 10.3715 19.642L18.4764 11.537Z"
										fill="currentColor"
									></path>
								</svg>
							</button>
						)}
						<img
							src={project.imagemUrl}
							alt={project.titulo}
							className="block shadow-lg rounded-sm w-full h-auto pointer-events-none transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.02]"
						/>
					</div>

					<div className="mt-2 pointer-events-none transition-transform duration-300 group-hover:translate-y-1">
						<h3 className="font-medium text-[13px] text-black leading-tight">
							{project.titulo}
						</h3>
						<div className="flex items-center gap-3 mt-1">
							<div className="flex items-center gap-1">
								<StarIcon />
								<span className="font-medium text-[11px] text-black">
									{project.nota}
								</span>
							</div>
							{(project.likesCount || 0) > 0 && (
								<div className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-black'}`}>
									<HeartIcon solid={isLiked} size={12} />
									<span className="font-medium text-[11px]">
										{project.likesCount}
									</span>
								</div>
							)}
						</div>
					</div>
				</>
			)}

			<AnimatePresence>
				{isMenuOpen && (
					<>
						<motion.div
							initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
							animate={{ 
								opacity: 1, 
								scale: 1, 
								x: corner === 'tr' || corner === 'br' ? 24 : -24,
								y: corner === 'tr' || corner === 'tl' ? -12 : 12 
							}}
							exit={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
							transition={{ type: "spring", damping: 20, stiffness: 300 }}
							className={`absolute z-[5001] flex flex-col gap-2 pointer-events-auto ${
								corner === "tr" || corner === "br" 
									? "left-full origin-left" 
									: "right-full origin-right"
							} ${
								corner === "tr" || corner === "tl"
									? "top-0"
									: "bottom-0"
							}`}
						>
							<motion.button 
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.9 }}
								onClick={(e) => {
									e.stopPropagation();
									if (onDoubleClick) onDoubleClick(project);
									if (onCloseMenu) onCloseMenu();
								}}
								className="flex items-center justify-center bg-white shadow-2xl border border-black/5 w-12 h-12 rounded-full transition-all cursor-pointer group"
								title={isLiked ? 'Descurtir' : 'Curtir'}
							>
								<div className={`${isLiked ? 'text-red-500' : 'text-black'} transition-colors`}>
									<HeartIcon solid={!isLiked} broken={isLiked} size={20} />
								</div>
							</motion.button>

							<motion.button 
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.9 }}
								onClick={(e) => {
									e.stopPropagation();
									if (onSave) onSave(project);
									if (onCloseMenu) onCloseMenu();
								}}
								className="flex items-center justify-center bg-white shadow-2xl border border-black/5 w-12 h-12 rounded-full transition-all cursor-pointer group"
								title="Salvar na minha prateleira"
							>
								<div className="text-black transition-colors">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
										<path fill-rule="evenodd" clip-rule="evenodd" d="M8.95711 15.0429C9.34763 15.4334 9.34763 16.0666 8.95711 16.4571L3.95711 21.4571C3.56658 21.8476 2.93342 21.8476 2.54289 21.4571C2.15237 21.0666 2.15237 20.4334 2.54289 20.0429L7.54289 15.0429C7.93342 14.6524 8.56658 14.6524 8.95711 15.0429Z" fill="currentColor"></path>
										<path d="M17.7093 2.55346C19.4569 3.18528 20.8147 4.54305 21.4465 6.29064C21.5536 6.58633 21.6798 6.93507 21.7258 7.24165C21.7801 7.60384 21.744 7.94519 21.608 8.32365C21.3168 9.13408 20.6643 9.49626 19.9452 9.89542L18.5273 10.6861C18.0145 10.9721 17.676 11.1618 17.4348 11.3286C17.2 11.4909 17.1333 11.582 17.1056 11.6358C17.0909 11.6641 17.0453 11.8022 17.0573 12.2506C17.0686 12.6742 17.1236 13.2487 17.2024 14.0663C17.3296 15.3845 17.1109 16.6904 16.3502 17.9068C16.2218 18.1123 16.0604 18.3708 15.88 18.563C15.6669 18.7901 15.4215 18.9506 15.1053 19.0787C14.7835 19.2091 14.4907 19.2619 14.1748 19.2478C13.906 19.2358 13.5974 19.1656 13.3398 19.107C11.3641 18.6584 9.47833 17.5121 7.98305 16.0169C6.48778 14.5216 5.34151 12.6359 4.89294 10.6602C4.83436 10.4027 4.76418 10.0941 4.75221 9.82535C4.73813 9.50941 4.79103 9.21658 4.92151 8.89474C5.04969 8.5786 5.21026 8.3331 5.43747 8.12006C5.62978 7.93974 5.88832 7.7784 6.09379 7.65019C7.29324 6.90084 8.58854 6.66967 9.89679 6.78538C10.7321 6.85926 11.321 6.91095 11.754 6.91998C11.968 6.92445 12.2391 6.94301 12.3803 6.86947C12.4326 6.84219 12.5235 6.7753 12.6865 6.53889C12.8534 6.29676 13.0438 5.95698 13.3302 5.44342L14.1046 4.05478C14.5037 3.33567 14.8659 2.68318 15.6763 2.39201C16.0548 2.25603 16.3961 2.2199 16.7583 2.27422C17.0649 2.32019 17.4136 2.44643 17.7093 2.55346Z" fill="currentColor"></path>
									</svg>
								</div>
							</motion.button>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</motion.div>
	);
};
