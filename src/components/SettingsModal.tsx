import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import type { ToastType } from "./Toast";

const getVibrantColor = (hex: string) => {
	if (hex.toLowerCase() === "#f0f0f0") return "#000000";
	hex = hex.replace("#", "");
	const r = parseInt(hex.substring(0, 2), 16) / 255;
	const g = parseInt(hex.substring(2, 4), 16) / 255;
	const b = parseInt(hex.substring(4, 6), 16) / 255;

	const max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	let h = 0,
		s,
		l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	} else {
		s = 0;
	}

	s = Math.min(s + 0.4, 0.9);
	l = Math.max(l - 0.2, 0.4);

	const hue2rgb = (p: number, q: number, t: number) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};

	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;

	const finalR = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
	const finalG = Math.round(hue2rgb(p, q, h) * 255);
	const finalB = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

	const toHex = (c: number) => c.toString(16).padStart(2, "0");
	return `#${toHex(finalR)}${toHex(finalG)}${toHex(finalB)}`;
};

const getContrastColor = (hex: string) => {
	hex = hex.replace("#", "");
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);
	const brightness = (r * 299 + g * 587 + b * 114) / 1000;
	return brightness > 128 ? "#000000" : "#ffffff";
};

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentProfile: {
		id: string;
		username: string;
		full_name: string | null;
		bg_color?: string;
		avatar_url?: string | null;
	};
	onUpdate: (newData: {
		username: string;
		full_name: string;
		bg_color: string;
		avatar_url: string | null;
	}) => void;
	onPreviewColorChange?: (color: string) => void;
	showToast: (message: string, type: ToastType) => void;
	onChangePassword: () => void;
}

const PASTEL_COLORS = [
	{ name: "Cinza", value: "#f0f0f0" },
	{ name: "Areia", value: "#f5f5dc" },
	{ name: "Céu", value: "#e0f2f7" },
	{ name: "Rosa", value: "#fce4ec" },
	{ name: "Menta", value: "#e8f5e9" },
	{ name: "Lavanda", value: "#f3e5f5" },
	{ name: "Pêssego", value: "#fff3e0" },
];

export const SettingsModal = ({
	isOpen,
	onClose,
	currentProfile,
	onUpdate,
	onPreviewColorChange,
	showToast,
	onChangePassword,
}: SettingsModalProps) => {
	const [formData, setFormData] = useState<{
		username: string;
		full_name: string;
		bg_color: string;
		avatar_url: string | null;
	}>({
		username: currentProfile.username,
		full_name: currentProfile.full_name || "",
		bg_color: currentProfile.bg_color || "#f0f0f0",
		avatar_url: currentProfile.avatar_url || null,
	});
	const [loading, setLoading] = useState(false);
	const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
		null,
	);
	const [checkingUsername, setCheckingUsername] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement("canvas");
				const MAX_SIZE = 256;
				let width = img.width;
				let height = img.height;

				if (width > height) {
					if (width > MAX_SIZE) {
						height *= MAX_SIZE / width;
						width = MAX_SIZE;
					}
				} else {
					if (height > MAX_SIZE) {
						width *= MAX_SIZE / height;
						height = MAX_SIZE;
					}
				}

				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext("2d");
				if (ctx) {
					ctx.drawImage(img, 0, 0, width, height);
					const base64 = canvas.toDataURL("image/jpeg", 0.8);
					setFormData((prev) => ({ ...prev, avatar_url: base64 }));
				}
			};
			if (event.target?.result) {
				img.src = event.target.result as string;
			}
		};
		reader.readAsDataURL(file);
	};

	useEffect(() => {
		if (onPreviewColorChange && isOpen) {
			onPreviewColorChange(formData.bg_color);
		}
	}, [formData.bg_color, isOpen, onPreviewColorChange]);

	useEffect(() => {
		if (isOpen) {
			setFormData({
				username: currentProfile.username,
				full_name: currentProfile.full_name || "",
				bg_color: currentProfile.bg_color || "#f0f0f0",
				avatar_url: currentProfile.avatar_url || null,
			});
			setUsernameAvailable(null);
		}
	}, [isOpen, currentProfile]);

	useEffect(() => {
		const trimmedUsername = formData.username.trim().toLowerCase();

		if (
			!isOpen ||
			!trimmedUsername ||
			trimmedUsername.length < 3 ||
			trimmedUsername === currentProfile.username.toLowerCase()
		) {
			setUsernameAvailable(null);
			return;
		}

		const checkAvailability = async () => {
			setCheckingUsername(true);
			try {
				const { data, error } = await supabase
					.from("profiles")
					.select("username")
					.eq("username", trimmedUsername)
					.maybeSingle();

				if (error) throw error;
				setUsernameAvailable(!data);
			} catch (err) {
				console.error("Error checking username:", err);
			} finally {
				setCheckingUsername(false);
			}
		};

		const debounce = setTimeout(checkAvailability, 500);
		return () => clearTimeout(debounce);
	}, [formData.username, isOpen, currentProfile.username]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const { error, data } = await supabase
				.from("profiles")
				.update({
					username: formData.username.toLowerCase().trim(),
					full_name: formData.full_name.trim(),
					bg_color: formData.bg_color,
					avatar_url: formData.avatar_url,
				})
				.eq("id", currentProfile.id)
				.select();

			if (error) {
				console.error("Erro detalhado do Supabase:", error);
				if (error.code === "23505")
					throw new Error("Este @username já está em uso.");
				throw error;
			}

			console.log("Dados atualizados com sucesso:", data);

			onUpdate({
				username: formData.username.toLowerCase().trim(),
				full_name: formData.full_name.trim(),
				bg_color: formData.bg_color,
				avatar_url: formData.avatar_url,
			});
			showToast("Perfil atualizado", "success");
			onClose();
		} catch (error: any) {
			showToast(error.message, "error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Overlay - Invisible but clickable */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="z-[5000] fixed inset-0 bg-black/40 cursor-default"
					/>
					<motion.div
						drag="y"
						dragConstraints={{ top: 0, bottom: 0 }}
						dragElastic={0.1}
						onDragEnd={(_, info) => {
							if (info.offset.y > 100 || info.velocity.y > 500) {
								onClose();
							}
						}}
						initial={{ y: "100%" }}
						animate={{ y: 0 }}
						exit={{ y: "100%" }}
						transition={{ type: "spring", damping: 25, stiffness: 200 }}
						className="bottom-3 left-2.5 right-2.5 sm:bottom-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[5001] fixed flex flex-col bg-white shadow-2xl border border-black/5 rounded-t-[32px] rounded-b-[48px] sm:rounded-t-[48px] sm:rounded-b-none w-auto sm:w-[500px] max-h-[92dvh] sm:max-h-[95dvh] overflow-hidden"
					>
						{/* Apple Sheet Handle */}
						<div className="flex justify-center pt-3 pb-1">
							<div className="bg-gray-200 rounded-full w-12 h-1.5" />
						</div>

						<div className="flex justify-between items-center p-6 pt-2 mb-2">
							<h2 className="font-bold text-black text-2xl">Ajustes</h2>
						</div>

						<form onSubmit={handleSubmit} className="space-y-6 px-8 pb-8">
							<div className="flex flex-col items-center gap-3 mb-6">
								<div className="relative group">
									{formData.avatar_url ? (
										<>
											<img
												src={formData.avatar_url}
												alt="Avatar"
												className="w-24 h-24 rounded-full object-cover shadow-sm border border-gray-200"
											/>
											<button
												type="button"
												onClick={() => {
													setFormData((prev) => ({
														...prev,
														avatar_url: null,
													}));
													if (fileInputRef.current)
														fileInputRef.current.value = "";
												}}
												className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
												title="Remover foto"
											>
												<div className="bg-white p-2.5 rounded-full shadow-md transform scale-75 group-hover:scale-100 transition-transform">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="20"
														height="20"
														viewBox="0 0 24 24"
														fill="none"
													>
														<path
															d="M19.5825 15.6564C19.5058 16.9096 19.4449 17.9041 19.3202 18.6984C19.1922 19.5131 18.9874 20.1915 18.5777 20.7849C18.2029 21.3278 17.7204 21.786 17.1608 22.1303C16.5491 22.5067 15.8661 22.6713 15.0531 22.75L8.92739 22.7499C8.1135 22.671 7.42972 22.5061 6.8176 22.129C6.25763 21.7841 5.77494 21.3251 5.40028 20.7813C4.99073 20.1869 4.78656 19.5075 4.65957 18.6917C4.53574 17.8962 4.47623 16.9003 4.40122 15.6453L3.75 4.75H20.25L19.5825 15.6564Z"
															fill="#ef4444"
														></path>
														<path
															fillRule="evenodd"
															clipRule="evenodd"
															d="M13.3473 1.28277C13.9124 1.33331 14.4435 1.50576 14.8996 1.84591C15.2369 2.09748 15.4712 2.40542 15.6714 2.73893C15.8569 3.04798 16.0437 3.4333 16.2555 3.8704L16.6823 4.7507H21C21.5523 4.7507 22 5.19842 22 5.7507C22 6.30299 21.5523 6.7507 21 6.7507C14.9998 6.7507 9.00019 6.7507 3 6.7507C2.44772 6.7507 2 6.30299 2 5.7507C2 5.19842 2.44772 4.7507 3 4.7507H7.40976L7.76556 3.97016C7.97212 3.51696 8.15403 3.11782 8.33676 2.79754C8.53387 2.45207 8.76721 2.13237 9.10861 1.87046C9.57032 1.51626 10.1121 1.33669 10.6899 1.28409C11.1249 1.24449 11.5634 1.24994 12 1.25064C12.5108 1.25146 12.97 1.24902 13.3473 1.28277ZM9.60776 4.7507H14.4597C14.233 4.28331 14.088 3.98707 13.9566 3.7682C13.7643 3.44787 13.5339 3.30745 13.1691 3.27482C12.9098 3.25163 12.5719 3.2507 12.0345 3.2507C11.4837 3.2507 11.137 3.25166 10.8712 3.27585C10.4971 3.30991 10.2639 3.45568 10.0739 3.78866C9.94941 4.00687 9.81387 4.29897 9.60776 4.7507Z"
															fill="#ef4444"
														></path>
													</svg>
												</div>
											</button>
										</>
									) : (
										<label className="w-24 h-24 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-400 border border-gray-200 cursor-pointer overflow-hidden group">
											<svg
												width="32"
												height="32"
												viewBox="0 0 24 24"
												fill="none"
												className="transform group-hover:scale-110 transition-transform"
											>
												<path
													d="M15.75 10C15.75 7.92893 14.0711 6.25 12 6.25C9.92893 6.25 8.25 7.92893 8.25 10C8.25 12.0711 9.92893 13.75 12 13.75C14.0711 13.75 15.75 12.0711 15.75 10Z"
													fill="currentColor"
												/>
												<path
													d="M20.7955 12C20.7955 7.1424 16.8576 3.20455 12 3.20455C7.1424 3.20455 3.20455 7.1424 3.20455 12C3.20455 16.8576 7.1424 20.7955 12 20.7955C16.8576 20.7955 20.7955 16.8576 20.7955 12ZM22.75 12C22.75 17.9371 17.9371 22.75 12 22.75C6.06294 22.75 1.25 17.9371 1.25 12C1.25 6.06294 6.06294 1.25 12 1.25C17.9371 1.25 22.75 6.06294 22.75 12Z"
													fill="currentColor"
												/>
												<path
													d="M18.75 20.001C18.75 16.2732 15.728 13.25 12 13.25C8.27196 13.25 5.25 16.2732 5.25 20.001C5.25008 20.2368 5.36127 20.459 5.5498 20.6006C7.3465 21.9501 9.58092 22.75 12 22.75C14.4191 22.75 16.6535 21.9501 18.4502 20.6006C18.6387 20.459 18.7499 20.2368 18.75 20.001Z"
													fill="currentColor"
												/>
											</svg>
											<input
												ref={fileInputRef}
												type="file"
												accept="image/*"
												className="hidden"
												onChange={handleImageUpload}
											/>
										</label>
									)}
								</div>
							</div>
							<div className="space-y-2">
								<input
									type="text"
									value={formData.full_name}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											full_name: e.target.value,
										}))
									}
									className="bg-gray-50 p-4 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black w-full transition-all text-sm font-medium"
									placeholder="Seu nome"
								/>
							</div>

							<div className="space-y-2">
								<div className="group relative">
									<input
										required
										type="text"
										value={formData.username}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												username: e.target.value.replace(/\s/g, ""),
											}))
										}
										className={`bg-gray-50 p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-black w-full transition-all text-sm font-medium ${
											usernameAvailable === false
												? "border-red-200"
												: "border-gray-100"
										}`}
										placeholder="Nome de usuário"
									/>
									<div className="top-1/2 right-4 absolute flex items-center gap-2 -translate-y-1/2 pointer-events-none">
										{checkingUsername ? (
											<div className="border-2 border-black/10 border-t-black rounded-full w-3 h-3 animate-spin" />
										) : (
											formData.username.trim().toLowerCase() !==
												currentProfile.username.toLowerCase() &&
											formData.username.length >= 3 &&
											(usernameAvailable === true ? (
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													className="text-green-500"
												>
													<path
														d="M20 6L9 17L4 12"
														stroke="currentColor"
														strokeWidth="3"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
											) : usernameAvailable === false ? (
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													className="text-red-500"
												>
													<path
														d="M18 6L6 18M6 6L18 18"
														stroke="currentColor"
														strokeWidth="3"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
											) : null)
										)}
										<span className="text-gray-300 text-xs">@</span>
									</div>
								</div>
								<AnimatePresence>
									{usernameAvailable === false && (
										<motion.p
											initial={{ opacity: 0, y: -10 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -10 }}
											className="px-1 font-medium text-red-500 text-xs"
										>
											Este nome de usuário já está em uso
										</motion.p>
									)}
								</AnimatePresence>
							</div>

							<div className="space-y-3">
								<span className="text-sm font-bold text-black px-1">
									Cor de fundo
								</span>
								<div className="flex flex-wrap justify-center gap-3 mt-1">
									{PASTEL_COLORS.map((color) => (
										<button
											key={color.value}
											type="button"
											onClick={() =>
												setFormData((prev) => ({
													...prev,
													bg_color: color.value,
												}))
											}
											className={`w-10 h-10 rounded-full border-2 transition-all cursor-pointer ${
												formData.bg_color === color.value
													? "border-black scale-110 shadow-md"
													: "border-transparent hover:scale-105"
											}`}
											style={{ backgroundColor: color.value }}
											title={color.name}
										/>
									))}
								</div>
							</div>

							<div className="space-y-3">
								<span className="text-sm font-bold text-black px-1">
									Segurança
								</span>
								<button
									type="button"
									onClick={onChangePassword}
									className="flex items-center gap-2 w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-100 transition-all text-sm font-medium text-gray-700"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										className="text-gray-400"
									>
										<path
											fillRule="evenodd"
											clipRule="evenodd"
											d="M12 3.25C10.067 3.25 8.49999 4.817 8.49999 6.75V8.31016C9.61772 8.27048 10.7654 8.25 12 8.25C13.2346 8.25 14.3823 8.27048 15.5 8.31016V6.75C15.5 4.817 13.933 3.25 12 3.25ZM6.49999 6.75V8.52712C4.93232 9.00686 3.74924 10.3861 3.52451 12.0552C3.37635 13.1556 3.24999 14.3118 3.24999 15.5C3.24999 16.6882 3.37636 17.8444 3.52451 18.9448C3.79608 20.9618 5.46715 22.5555 7.52521 22.6501C8.95364 22.7158 10.4042 22.75 12 22.75C13.5958 22.75 15.0464 22.7158 16.4748 22.6501C18.5328 22.5555 20.2039 20.9618 20.4755 18.9448C20.6236 17.8444 20.75 16.6882 20.75 15.5C20.75 14.3118 20.6236 13.1556 20.4755 12.0552C20.2507 10.3861 19.0677 9.00686 17.5 8.52712V6.75C17.5 3.71243 13.933 1.25 12 1.25V3.25Z"
											fill="currentColor"
										></path>
									</svg>
									Alterar senha da conta
								</button>
							</div>

							<button
								disabled={loading || usernameAvailable === false}
								className="w-full shadow-black/10 shadow-lg border border-black/5 mt-4 py-4 rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:bg-gray-400 disabled:opacity-50"
								style={{
									backgroundColor: getVibrantColor(formData.bg_color),
									color: getContrastColor(getVibrantColor(formData.bg_color)),
								}}
							>
								{loading ? "Salvando..." : "Salvar"}
							</button>
						</form>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
};
