import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { FontFamily, ItemType, ShelfItem } from "../types/item";

const getContrastColor = (hex: string) => {
	hex = hex.replace("#", "");
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);
	const brightness = (r * 299 + g * 587 + b * 114) / 1000;
	return brightness > 128 ? "#000000" : "#ffffff";
};

const FONT_OPTIONS: { id: FontFamily; name: string; style: string }[] = [
	{ id: "sans", name: "Sans", style: "font-sans" },
	{ id: "serif", name: "Serif", style: "font-[Cormorant_Garamond]" },
	{ id: "mono", name: "Mono", style: "font-[JetBrains_Mono]" },
	{ id: "display", name: "Display", style: "font-[Bebas_Neue]" },
];

interface AddItemModalProps {
	isOpen: boolean;
	onClose: () => void;
	onAdd: (item: {
		type: ItemType;
		titulo: string;
		nota: number;
		imagemUrl?: string;
		fontFamily: FontFamily;
		isAutoRotation: boolean;
		rotationType: "left" | "center" | "right";
	}) => void;
	onDelete?: (id: string) => void;
	initialData?: ShelfItem | null;
	buttonColor?: string;
	defaultType?: ItemType;
}

export const AddItemModal = ({
	isOpen,
	onClose,
	onAdd,
	onDelete,
	initialData,
	buttonColor = "#000000",
	defaultType = "image",
}: AddItemModalProps) => {
	const [formData, setFormData] = useState({
		type: defaultType as ItemType,
		titulo: "",
		nota: 0,
		imagemUrl: "",
		fontFamily: "sans" as FontFamily,
		isAutoRotation: true,
		rotationType: "center" as "left" | "center" | "right",
	});

	const buttonTextColor = getContrastColor(buttonColor);
	const isEditMode = !!initialData;

	useEffect(() => {
		if (isOpen) {
			if (initialData) {
				let detectedRotation: "left" | "center" | "right" = "center";
				if (initialData.rotation < 0) detectedRotation = "left";
				else if (initialData.rotation > 0) detectedRotation = "right";

				setFormData({
					type: initialData.type || "image",
					titulo: initialData.titulo,
					nota: initialData.nota,
					imagemUrl: initialData.imagemUrl || "",
					fontFamily: initialData.fontFamily || "sans",
					isAutoRotation: false,
					rotationType: detectedRotation,
				});
			} else {
				setFormData({
					type: defaultType,
					titulo: "",
					nota: 0,
					imagemUrl: "",
					fontFamily: "sans",
					isAutoRotation: true,
					rotationType: "center",
				});
			}
		}
	}, [isOpen, initialData, defaultType]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setFormData((prev) => ({
					...prev,
					imagemUrl: reader.result as string,
				}));
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (formData.type === "image" && !formData.imagemUrl) {
			alert("Por favor, selecione uma imagem.");
			return;
		}
		if (!formData.titulo.trim()) {
			alert("Por favor, digite um título.");
			return;
		}
		onAdd(formData as any);
		handleClose();
	};

	const handleClose = () => {
		setFormData({
			type: "image",
			titulo: "",
			nota: 0,
			imagemUrl: "",
			fontFamily: "sans",
			isAutoRotation: true,
			rotationType: "center",
		});
		onClose();
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={handleClose}
						className="z-[2000] fixed inset-0 bg-black/40 cursor-default"
					/>
					<motion.div
						drag="y"
						dragConstraints={{ top: 0, bottom: 0 }}
						dragElastic={0.1}
						onDragEnd={(_, info) => {
							if (info.offset.y > 100 || info.velocity.y > 500) {
								handleClose();
							}
						}}
						initial={{ y: "100%" }}
						animate={{ y: 0 }}
						exit={{ y: "100%" }}
						transition={{ type: "spring", damping: 25, stiffness: 200 }}
						className="bottom-0 sm:bottom-6 left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 z-[2001] fixed flex flex-col bg-white shadow-2xl border border-black/5 rounded-t-[48px] sm:rounded-[48px] w-full sm:w-[500px] max-h-[92dvh] sm:max-h-[95dvh] overflow-hidden pb-[env(safe-area-inset-bottom)]"
					>
						{/* Apple Sheet Handle */}
						<div className="flex justify-center pt-3 pb-1">
							<div className="bg-gray-200 rounded-full w-12 h-1.5" />
						</div>

						<div className="flex justify-between items-center p-6 pt-2 pb-0">
							{!isEditMode ? (
								<div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
									<button
										onClick={() =>
											setFormData((prev) => ({ ...prev, type: "image" }))
										}
										className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${formData.type === "image" ? "bg-white shadow-sm text-black" : "text-gray-400 hover:text-gray-600"}`}
									>
										Capa
									</button>
									<button
										onClick={() =>
											setFormData((prev) => ({ ...prev, type: "text" }))
										}
										className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${formData.type === "text" ? "bg-white shadow-sm text-black" : "text-gray-400 hover:text-gray-600"}`}
									>
										Texto
									</button>
								</div>
							) : (
								<span className="font-bold text-black text-sm uppercase tracking-tight">
									Editar {formData.type === "image" ? "Capa" : "Texto"}
								</span>
							)}
						</div>

						<form
							onSubmit={handleSubmit}
							className="flex-1 space-y-8 p-6 pt-6 overflow-y-auto"
						>
							<div className="space-y-2">
								<div className="flex justify-between items-center px-1">
									<label className="text-gray-400 text-xs font-bold uppercase">
										{formData.type === "text" ? "Texto" : "Título"}
									</label>
									{formData.type === "text" && (
										<span
											className={`text-[10px] font-bold ${formData.titulo.length >= 25 ? "text-red-500" : "text-gray-400"}`}
										>
											{formData.titulo.length}/25
										</span>
									)}
								</div>
								<input
									required
									type="text"
									maxLength={formData.type === "text" ? 25 : undefined}
									value={formData.titulo}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, titulo: e.target.value }))
									}
									className={`bg-gray-50 p-4 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black w-full transition-all font-medium text-sm ${formData.type === "text" ? FONT_OPTIONS.find((f) => f.id === formData.fontFamily)?.style : ""}`}
									placeholder={
										formData.type === "text"
											? "O que você quer dizer?"
											: "O que você quer adicionar?"
									}
								/>
							</div>

							{formData.type === "text" && (
								<div className="space-y-4">
									<label className="text-gray-400 text-xs font-bold uppercase px-1">
										Fonte
									</label>
									<div className="grid grid-cols-2 gap-2">
										{FONT_OPTIONS.map((font) => (
											<button
												key={font.id}
												type="button"
												onClick={() =>
													setFormData((prev) => ({
														...prev,
														fontFamily: font.id,
													}))
												}
												className={`p-3 rounded-2xl border transition-all text-sm ${formData.fontFamily === font.id ? "border-black bg-black text-white shadow-lg" : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"}`}
											>
												<span className={font.style}>{font.name}</span>
											</button>
										))}
									</div>
								</div>
							)}

							{formData.type === "image" && (
								<>
									<div className="space-y-2">
										<div className="flex gap-1 mt-2">
											<svg width="0" height="0" className="absolute">
												<defs>
													<linearGradient id="half-star">
														<stop offset="50%" stopColor="#facd15" />
														<stop offset="50%" stopColor="#e5e7eb" />
													</linearGradient>
												</defs>
											</svg>
											{[1, 2, 3, 4, 5].map((star) => {
												const isFull = formData.nota >= star;
												const isHalf = formData.nota === star - 0.5;
												return (
													<button
														key={star}
														type="button"
														onClick={() => {
															const currentRating = formData.nota;
															let newRating = star;
															if (currentRating === star) {
																newRating = star - 0.5;
															} else if (currentRating === star - 0.5) {
																if (star === 1) newRating = 0;
																else newRating = star;
															} else if (currentRating === 0 && star === 1) {
																newRating = 1;
															}
															setFormData((prev) => ({
																...prev,
																nota: newRating,
															}));
														}}
														className="cursor-pointer transition-transform active:scale-90"
													>
														<svg
															width="24"
															height="24"
															viewBox="0 0 24 24"
															fill="none"
														>
															<path
																d="M11.996 1.25c1.05 0 1.876.793 2.403 1.862l1.763 3.553c.053.11.18.265.37.407.19.141.377.22.5.24l3.189.534c1.152.194 2.118.758 2.431 1.742.313.982-.146 2.004-.974 2.834h-.001l-2.478 2.499a1.272 1.272 0 00-.277.528 1.318 1.318 0 00-.044.604v.002l.71 3.09c.294 1.287.196 2.562-.71 3.23-.911.668-2.155.372-3.286-.301l-2.99-1.785c-.125-.075-.34-.136-.6-.136-.26 0-.48.06-.613.138l-.002.001-2.984 1.781c-1.129.676-2.371.967-3.282.297-.907-.667-1.009-1.94-.714-3.225l.709-3.09v-.002a1.318 1.318 0 00-.043-.604 1.272 1.272 0 00-.277-.528l-2.48-2.5c-.823-.83-1.28-1.85-.97-2.832.312-.984 1.275-1.55 2.428-1.743l3.187-.534h.001c.117-.02.3-.097.49-.24.19-.141.318-.297.371-.407l.003-.005 1.76-3.549V3.11c.533-1.069 1.362-1.86 2.41-1.86z"
																fill={
																	isFull
																		? "#facd15"
																		: isHalf
																			? "url(#half-star)"
																			: "#e5e7eb"
																}
															/>
														</svg>
													</button>
												);
											})}
											<span className="ml-2 font-bold text-black self-center text-sm">
												{formData.nota > 0 ? formData.nota : "Dar nota"}
											</span>
										</div>
									</div>
									<div className="space-y-2">
										<div className="group relative mt-3">
											<input
												required={!isEditMode}
												type="file"
												accept="image/*"
												onChange={handleFileChange}
												className="z-10 absolute inset-0 opacity-0 w-full h-full cursor-pointer"
											/>
											<div className="flex flex-col justify-center items-center bg-gray-50 group-hover:bg-gray-100 border-2 border-gray-200 group-hover:border-gray-300 border-dashed rounded-[24px] w-full h-40 overflow-hidden transition-all">
												{formData.imagemUrl ? (
													<img
														src={formData.imagemUrl}
														alt="Preview"
														className="w-full h-full object-cover"
													/>
												) : (
													<>
														<div className="p-3 bg-white rounded-2xl shadow-sm mb-2">
															<svg
																width="24"
																height="24"
																viewBox="0 0 24 24"
																fill="none"
																className="text-black"
															>
																<path
																	d="M2.25002 16.75C2.25002 16.1977 2.69774 15.75 3.25002 15.75C3.80231 15.75 4.25002 16.1977 4.25002 16.75C4.25002 17.7443 4.25882 18.0453 4.31838 18.2676C4.50332 18.9578 5.04226 19.4967 5.73244 19.6816C5.95472 19.7412 6.25567 19.75 7.25002 19.75H16.75L17.375 19.748C17.8899 19.7428 18.1009 19.7263 18.2676 19.6816C18.9578 19.4967 19.4967 18.9578 19.6817 18.2676C19.7412 18.0453 19.75 17.7443 19.75 16.75C19.75 16.1977 20.1977 15.75 20.75 15.75C21.3023 15.75 21.75 16.1977 21.75 16.75C21.75 17.6156 21.7582 18.2444 21.6133 18.7852C21.2434 20.1655 20.1655 21.2434 18.7852 21.6133C18.2445 21.7582 17.6156 21.75 16.75 21.75H7.25002C6.38444 21.75 5.75559 21.7582 5.21487 21.6133C3.8345 21.2434 2.75661 20.1655 2.38674 18.7852C2.24186 18.2444 2.25002 17.6156 2.25002 16.75Z"
																	fill="currentColor"
																></path>
																<path
																	d="M12 16.75C11.4477 16.75 11 16.3023 11 15.75V5.14066C10.6959 5.44576 10.3742 5.79408 10.0605 6.15531C9.5874 6.70024 9.14786 7.24867 8.82518 7.66215C8.66425 7.86837 8.39588 8.22335 8.30565 8.34281C7.97823 8.78739 7.35189 8.88288 6.90721 8.5557C6.46264 8.22829 6.36714 7.60194 6.69432 7.15726C6.78996 7.03063 7.07974 6.64733 7.24803 6.43168C7.58372 6.00152 8.04638 5.42459 8.54979 4.84476C9.04902 4.26976 9.60862 3.66902 10.1348 3.20414C10.3967 2.97271 10.6741 2.75342 10.9502 2.58695C11.1989 2.43706 11.5734 2.25003 12 2.25004C12.4266 2.25005 12.8011 2.43706 13.0498 2.58695C13.3259 2.75342 13.6033 2.97271 13.8652 3.20414C14.3913 3.66901 14.9509 4.26978 15.4502 4.84476C15.9536 5.42459 16.4162 6.00154 16.7519 6.43168C16.9202 6.64733 17.21 7.03064 17.3056 7.15726C17.6328 7.60191 17.5373 8.2273 17.0928 8.55473C16.6481 8.88224 16.0218 8.78751 15.6943 8.34281C15.6041 8.22335 15.3357 7.86837 15.1748 7.66215C14.8521 7.24868 14.4126 6.70024 13.9394 6.15531C13.6258 5.79408 13.3041 5.44576 13 5.14066V15.75C13 16.3023 12.5523 16.75 12 16.75Z"
																	fill="currentColor"
																></path>
															</svg>
														</div>
														<span className="font-bold text-black text-sm">
															Adicionar capa
														</span>
														<span className="text-gray-400 text-[11px] mt-1">
															PNG, JPG ou WEBP
														</span>
													</>
												)}
											</div>
										</div>
									</div>
								</>
							)}

							<div className="space-y-2">
								<div className="flex justify-between items-center mb-4 px-1">
									<span className="text-sm font-bold text-black">
										Ajustar posição
									</span>
									<div className="flex items-center gap-2">
										<span className="font-bold text-[10px] text-gray-400 uppercase">
											Auto
										</span>
										<button
											type="button"
											onClick={() =>
												setFormData((prev) => ({
													...prev,
													isAutoRotation: !prev.isAutoRotation,
												}))
											}
											className="relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none"
											style={{
												backgroundColor: formData.isAutoRotation
													? buttonColor
													: "#e5e7eb",
											}}
										>
											<div
												className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${formData.isAutoRotation ? "translate-x-5" : "translate-x-0"}`}
											/>
										</button>
									</div>
								</div>
								<AnimatePresence>
									{!formData.isAutoRotation && (
										<motion.div
											initial={{ opacity: 0, height: 0, scale: 0.95 }}
											animate={{ opacity: 1, height: "auto", scale: 1 }}
											exit={{ opacity: 0, height: 0, scale: 0.95 }}
											className="overflow-hidden"
										>
											<div className="flex justify-around items-end gap-4 bg-gray-50 mt-2 p-4 border border-gray-100 rounded-2xl">
												<button
													type="button"
													onClick={() =>
														setFormData((prev) => ({
															...prev,
															rotationType: "left",
														}))
													}
													className="group flex flex-col items-center gap-2 cursor-pointer"
												>
													<div
														className={`w-12 h-16 rounded-md border-2 transition-all ${formData.rotationType === "left" ? "border-black bg-white -rotate-6" : "border-gray-200 bg-gray-100 group-hover:border-gray-300"}`}
													/>
													<span
														className={`text-[10px] font-bold uppercase ${formData.rotationType === "left" ? "text-black" : "text-gray-400"}`}
													>
														Esq.
													</span>
												</button>
												<button
													type="button"
													onClick={() =>
														setFormData((prev) => ({
															...prev,
															rotationType: "center",
														}))
													}
													className="group flex flex-col items-center gap-2 cursor-pointer"
												>
													<div
														className={`w-12 h-16 rounded-md border-2 transition-all ${formData.rotationType === "center" ? "border-black bg-white" : "border-gray-200 bg-gray-100 group-hover:border-gray-300"}`}
													/>
													<span
														className={`text-[10px] font-bold uppercase ${formData.rotationType === "center" ? "text-black" : "text-gray-400"}`}
													>
														Centro
													</span>
												</button>
												<button
													type="button"
													onClick={() =>
														setFormData((prev) => ({
															...prev,
															rotationType: "right",
														}))
													}
													className="group flex flex-col items-center gap-2 cursor-pointer"
												>
													<div
														className={`w-12 h-16 rounded-md border-2 transition-all ${formData.rotationType === "right" ? "border-black bg-white rotate-6" : "border-gray-200 bg-gray-100 group-hover:border-gray-300"}`}
													/>
													<span
														className={`text-[10px] font-bold uppercase ${formData.rotationType === "right" ? "text-black" : "text-gray-400"}`}
													>
														Dir.
													</span>
												</button>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</form>

						<div className="flex gap-3 p-6 border-gray-100 border-t">
							{isEditMode && initialData && (
								<button
									type="button"
									onClick={() => {
										if (onDelete) onDelete(initialData.id);
									}}
									className="bg-red-50 hover:bg-red-100 w-[52px] rounded-xl flex items-center justify-center text-red-500 active:scale-[0.98] transition-all cursor-pointer"
									title="Excluir item"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
									>
										<path
											d="M19.5825 15.6564C19.5058 16.9096 19.4449 17.9041 19.3202 18.6984C19.1922 19.5131 18.9874 20.1915 18.5777 20.7849C18.2029 21.3278 17.7204 21.786 17.1608 22.1303C16.5491 22.5067 15.8661 22.6713 15.0531 22.75L8.92739 22.7499C8.1135 22.671 7.42972 22.5061 6.8176 22.129C6.25763 21.7841 5.77494 21.3251 5.40028 20.7813C4.99073 20.1869 4.78656 19.5075 4.65957 18.6917C4.53574 17.8962 4.47623 16.9003 4.40122 15.6453L3.75 4.75H20.25L19.5825 15.6564Z"
											fill="currentColor"
										></path>
										<path
											fillRule="evenodd"
											clipRule="evenodd"
											d="M13.3473 1.28277C13.9124 1.33331 14.4435 1.50576 14.8996 1.84591C15.2369 2.09748 15.4712 2.40542 15.6714 2.73893C15.8569 3.04798 16.0437 3.4333 16.2555 3.8704L16.6823 4.7507H21C21.5523 4.7507 22 5.19842 22 5.7507C22 6.30299 21.5523 6.7507 21 6.7507C14.9998 6.7507 9.00019 6.7507 3 6.7507C2.44772 6.7507 2 6.30299 2 5.7507C2 5.19842 2.44772 4.7507 3 4.7507H7.40976L7.76556 3.97016C7.97212 3.51696 8.15403 3.11782 8.33676 2.79754C8.53387 2.45207 8.76721 2.13237 9.10861 1.87046C9.57032 1.51626 10.1121 1.33669 10.6899 1.28409C11.1249 1.24449 11.5634 1.24994 12 1.25064C12.5108 1.25146 12.97 1.24902 13.3473 1.28277ZM9.60776 4.7507H14.4597C14.233 4.28331 14.088 3.98707 13.9566 3.7682C13.7643 3.44787 13.5339 3.30745 13.1691 3.27482C12.9098 3.25163 12.5719 3.2507 12.0345 3.2507C11.4837 3.2507 11.137 3.25166 10.8712 3.27585C10.4971 3.30991 10.2639 3.45568 10.0739 3.78866C9.94941 4.00687 9.81387 4.29897 9.60776 4.7507Z"
											fill="currentColor"
										></path>
									</svg>
								</button>
							)}
							<button
								type="submit"
								onClick={handleSubmit}
								className="flex-1 shadow-black/10 shadow-lg shadow-sm border border-black/5 py-4 rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
								style={{ backgroundColor: buttonColor, color: buttonTextColor }}
							>
								{isEditMode ? "Salvar" : "Adicionar"}
							</button>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
};
