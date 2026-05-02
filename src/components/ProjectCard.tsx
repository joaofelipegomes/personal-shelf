import { motion } from "framer-motion";
import { useRef } from "react";
import type { ShelfItem } from "../types/item";
import { StarIcon } from "./StarIcon";

interface ProjectCardProps {
	project: ShelfItem;
	onPositionChange: (id: string, x: number, y: number) => void;
	zIndex: number;
	onDragStart: () => void;
	onEdit?: (item: ShelfItem) => void;
	isOwner?: boolean;
	canvasScale?: number;
	isBlocked?: boolean;
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
}: ProjectCardProps) => {
	const dragStartPos = useRef({ x: project.x, y: project.y });
	const isDragging = useRef(false);

	return (
		<motion.div
			drag={!isBlocked}
			dragPropagation={false}
			dragMomentum={false}
			dragElastic={0}
			onPointerDown={(e) => {
				// Impede que o canvas comece a arrastar quando clicamos no card
				e.stopPropagation();

				if (!isBlocked && !(e.target as HTMLElement).closest("button")) {
					onDragStart();
				}
			}}
			onDragStart={() => {
				isDragging.current = true;
				dragStartPos.current = { x: project.x, y: project.y };
			}}
			onDragEnd={(_, info) => {
				setTimeout(() => {
					isDragging.current = false;
				}, 100);

				const newX = dragStartPos.current.x + info.offset.x / canvasScale;
				const newY = dragStartPos.current.y + info.offset.y / canvasScale;
				onPositionChange(project.id, newX, newY);
			}}
			initial={{ opacity: 0, scale: 0.8 }}
			whileInView={{ opacity: 1, scale: 1 }}
			viewport={{ once: true }}
			whileHover={{ scale: 1.02 }}
			style={{
				position: "absolute",
				left: 0,
				top: 0,
				x: project.x,
				y: project.y,
				rotate: project.rotation,
				zIndex: zIndex,
			}}
			className={`${project.type === "text" ? "w-fit min-w-[100px]" : "w-32.5 sm:w-37.5 md:w-45"} cursor-grab active:cursor-grabbing group card-draggable`}
		>
			{isOwner && onEdit && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onEdit(project);
					}}
					onPointerDown={(e) => {
						// MUITO IMPORTANTE: Impede que o card (e o canvas) comece a arrastar
						e.stopPropagation();
					}}
					onPointerUp={(e) => e.stopPropagation()}
					className="-top-2 -right-2 z-10 absolute flex justify-center items-center bg-white opacity-0 group-hover:opacity-100 shadow-md border border-black/5 rounded-full w-9 h-9 text-black transition-all cursor-pointer hover:scale-110 active:scale-90"
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

			{project.type === "text" ? (
				<div className="flex flex-col justify-center items-center px-8 py-4 text-center transition-all duration-300 group-hover:scale-110">
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
					<img
						src={project.imagemUrl}
						alt={project.titulo}
						className="block shadow-lg rounded-sm w-full h-auto pointer-events-none transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.02]"
					/>

					<div className="mt-2 pointer-events-none transition-transform duration-300 group-hover:translate-y-1">
						<h3 className="font-medium text-[13px] text-black leading-tight">
							{project.titulo}
						</h3>
						<div className="flex items-center gap-1 mt-1">
							<StarIcon />
							<span className="font-medium text-[11px] text-gray-500">
								{project.nota}
							</span>
						</div>
					</div>
				</>
			)}
		</motion.div>
	);
};
