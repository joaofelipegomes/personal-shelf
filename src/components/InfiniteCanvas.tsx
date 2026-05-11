import {
	AnimatePresence,
	animate,
	motion,
	useDragControls,
	useMotionValue,
	useMotionValueEvent,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { ItemType, ShelfItem } from "../types/item";
import { AddItemModal } from "./AddItemModal";
import { ConfirmModal } from "./ConfirmModal";
import { LoadingScreen } from "./LoadingScreen";
import { PasswordModal } from "./PasswordModal";
import { PlusIcon } from "./PlusIcon";
import { ProjectCard } from "./ProjectCard";
import { SettingsModal } from "./SettingsModal";
import { ShareFrame } from "./ShareFrame";
import type { ToastType } from "./Toast";
import { Toast } from "./Toast";

const CANVAS_SIZE = 5000;
const ORIGIN_X = CANVAS_SIZE / 2;
const ORIGIN_Y = CANVAS_SIZE / 2;

interface InfiniteCanvasProps {
	username?: string;
}

const getVibrantColor = (hex: string) => {
	if (hex.toLowerCase() === "#f0f0f0") return "#000000";
	hex = hex.replace("#", "");
	let r = parseInt(hex.substring(0, 2), 16);
	let g = parseInt(hex.substring(2, 4), 16);
	let b = parseInt(hex.substring(4, 6), 16);
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	let h = 0,
		s,
		l = (max + min) / 2;
	if (max === min) {
		h = s = 0;
	} else {
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
	}
	s = Math.min(s + 0.4, 0.9);
	l = Math.max(l - 0.2, 0.4);
	const hslToRgb = (h: number, s: number, l: number) => {
		let r, g, b;
		if (s === 0) {
			r = g = b = l;
		} else {
			const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			const hue2rgb = (p: number, q: number, t: number) => {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1 / 6) return p + (q - p) * 6 * t;
				if (t < 1 / 2) return q;
				if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
				return p;
			};
			r = hue2rgb(p, q, h + 1 / 3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1 / 3);
		}
		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	};
	const [finalR, finalG, finalB] = hslToRgb(h, s, l);
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

export const InfiniteCanvas = ({ username }: InfiniteCanvasProps) => {
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	const scale = useMotionValue(1);
	const [zoomDisplay, setZoomDisplay] = useState(100);
	const containerRef = useRef<HTMLDivElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const lastTouchDistance = useRef<number | null>(null);
	const navigate = useNavigate();
	const canvasDragControls = useDragControls();

	const [items, setItems] = useState<ShelfItem[]>([]);
	const [loading, setLoading] = useState(true);
	const isCurrentlyLoading = useRef(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isAccountDeleteModalOpen, setIsAccountDeleteModalOpen] =
		useState(false);
	const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
	const [maxZIndex, setMaxZIndex] = useState(10);
	const [hasInteracted, setHasInteracted] = useState(() => {
		return localStorage.getItem("shelf_has_interacted") === "true";
	});
	const [isOwner, setIsOwner] = useState(false);

	useEffect(() => {
		if (hasInteracted) {
			localStorage.setItem("shelf_has_interacted", "true");
		}
	}, [hasInteracted]);

	// Qualquer toque ou clique na tela marca como interagido
	useEffect(() => {
		if (hasInteracted) return;
		const markInteracted = () => setHasInteracted(true);
		window.addEventListener("pointerdown", markInteracted);
		return () => window.removeEventListener("pointerdown", markInteracted);
	}, [hasInteracted]);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [notFound, setNotFound] = useState(false);
	const [profileData, setProfileData] = useState<{
		id: string;
		username: string;
		full_name: string | null;
		bg_color?: string;
		avatar_url?: string | null;
	} | null>(null);
	const [editingItem, setEditingItem] = useState<ShelfItem | null>(null);
	const [modalDefaultType, setModalDefaultType] = useState<ItemType>("image");

	const [toast, setToast] = useState<{
		message: string;
		type: ToastType;
		x?: number;
		y?: number;
	} | null>(null);
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
	const [previewColor, setPreviewColor] = useState<string | null>(null);
	const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
	const [interactionMenuId, setInteractionMenuId] = useState<string | null>(
		null,
	);
	const [isFrameMode, setIsFrameMode] = useState(false);
	const [isPinching, setIsPinching] = useState(false);
	const lastClickPos = useRef({ x: 0, y: 0 });

	useEffect(() => {
		const handleGlobalClick = (e: MouseEvent) => {
			lastClickPos.current = { x: e.clientX, y: e.clientY };
		};
		window.addEventListener("click", handleGlobalClick, true);
		return () => window.removeEventListener("click", handleGlobalClick, true);
	}, []);

	const showToast = (message: string, type: ToastType) => {
		setToast({
			message,
			type,
			x: lastClickPos.current.x,
			y: lastClickPos.current.y,
		});
	};

	const handleEditItem = (item: ShelfItem) => {
		if (!isOwner) return;
		setEditingItem(item);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingItem(null);
		setModalDefaultType("image");
	};

	useMotionValueEvent(scale, "change", (latest) => {
		setZoomDisplay(Math.round(latest * 100));
	});

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false);
			}
		};
		if (isMenuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isMenuOpen]);

	useEffect(() => {
		const zoomTowardsPoint = (
			clientX: number,
			clientY: number,
			newScale: number,
		) => {
			const currentX = x.get();
			const currentY = y.get();
			const currentScale = scale.get();

			const offsetX = clientX - currentX - ORIGIN_X;
			const offsetY = clientY - currentY - ORIGIN_Y;

			const newX = clientX - ORIGIN_X - (offsetX / currentScale) * newScale;
			const newY = clientY - ORIGIN_Y - (offsetY / currentScale) * newScale;

			x.set(newX);
			y.set(newY);
			scale.set(newScale);
		};

		const handleWheel = (e: WheelEvent) => {
			if (
				(e.target as HTMLElement).closest(".z-50") ||
				(e.target as HTMLElement).closest(".z-\\[2001\\]") ||
				(e.target as HTMLElement).closest(".z-\\[5001\\]")
			) {
				return;
			}
			e.preventDefault();
			const delta = -e.deltaY;
			const zoomSpeed = 0.002;
			const currentScale = scale.get();
			const factor = 1 + delta * zoomSpeed;
			const newScale = Math.min(Math.max(currentScale * factor, 0.1), 3);

			zoomTowardsPoint(e.clientX, e.clientY, newScale);
		};

		const getDistance = (touches: React.TouchList | TouchList) => {
			return Math.sqrt(
				(touches[0].clientX - touches[1].clientX) ** 2 +
					(touches[0].clientY - touches[1].clientY) ** 2,
			);
		};

		const handleTouchStart = (e: TouchEvent) => {
			if (e.touches.length === 2) {
				setIsPinching(true);
				lastTouchDistance.current = getDistance(e.touches);
			}
		};

		const handleTouchMove = (e: TouchEvent) => {
			if (e.touches.length === 2 && lastTouchDistance.current !== null) {
				if (
					(e.target as HTMLElement).closest(".z-50") ||
					(e.target as HTMLElement).closest(".z-\\[2001\\]") ||
					(e.target as HTMLElement).closest(".z-\\[5001\\]")
				) {
					return;
				}
				e.preventDefault();
				const distance = getDistance(e.touches);
				const factor = distance / lastTouchDistance.current;
				const currentScale = scale.get();
				const newScale = Math.min(Math.max(currentScale * factor, 0.1), 3);

				const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
				const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

				zoomTowardsPoint(centerX, centerY, newScale);
				lastTouchDistance.current = distance;
			}
		};

		const handleTouchEnd = (e: TouchEvent) => {
			if (e.touches.length < 2) {
				setIsPinching(false);
				lastTouchDistance.current = null;
			}
		};

		window.addEventListener("wheel", handleWheel, { passive: false });
		window.addEventListener("touchstart", handleTouchStart);
		window.addEventListener("touchmove", handleTouchMove, { passive: false });
		window.addEventListener("touchend", handleTouchEnd);

		return () => {
			window.removeEventListener("wheel", handleWheel);
			window.removeEventListener("touchstart", handleTouchStart);
			window.removeEventListener("touchmove", handleTouchMove);
			window.removeEventListener("touchend", handleTouchEnd);
		};
	}, [scale, x, y]);

	const loadShelf = useCallback(
		async (isBackground = false) => {
			if (isCurrentlyLoading.current && !isBackground) return;

			console.log("Canvas: Loading shelf for:", username);
			if (!username) {
				if (!isBackground) setLoading(false);
				return;
			}

			let timeout: any;
			if (!isBackground) {
				isCurrentlyLoading.current = true;
				setLoading(true);
				setNotFound(false);
				timeout = setTimeout(() => {
					console.warn("Canvas: Load shelf timeout");
					setLoading(false);
					isCurrentlyLoading.current = false;
				}, 12000); // Aumentado para 12s para dar mais margem
			}

			try {
				console.log("Canvas: 1. Fetching session and profile...");

				const timeoutPromise = new Promise((_, reject) =>
					setTimeout(() => reject(new Error("Timeout")), 10000),
				);

				const profilePromise = supabase
					.from("profiles")
					.select("id, username, full_name, bg_color, avatar_url")
					.eq("username", username.toLowerCase())
					.single();

				const [sessionResult, profileResult] = await Promise.all([
					supabase.auth.getSession(),
					Promise.race([profilePromise, timeoutPromise]) as Promise<any>,
				]);

				const authSession = sessionResult.data?.session;
				const uid = authSession?.user?.id || null;
				setCurrentUserId(uid);

				const { data: profile, error: profileError } = profileResult;

				if (profileError || !profile) {
					console.error("Canvas: Profile error:", profileError);
					if (!isBackground) {
						setNotFound(true);
						setLoading(false);
					}
					return;
				}

				console.log("Canvas: Profile found:", profile.id);
				setProfileData(profile);

				// 2. Fetch items (sequencial ao perfil mas rápido)
				console.log("Canvas: 2. Fetching items...");
				const { data: shelfItems, error: shelfError } = await supabase
					.from("shelf_items")
					.select("*")
					.eq("user_id", profile.id);

				if (shelfError) {
					console.error("Canvas: Shelf items error:", shelfError);
				}

				if (shelfItems) {
					// Busca todas as curtidas para os itens desta prateleira
					const { data: allLikes } = await supabase
						.from("likes")
						.select("item_id")
						.in(
							"item_id",
							shelfItems.map((i: any) => i.id),
						);

					const likesCountMap: Record<string, number> = {};
					allLikes?.forEach((l: any) => {
						likesCountMap[l.item_id] = (likesCountMap[l.item_id] || 0) + 1;
					});

					const mappedItems = shelfItems.map((i: any) => ({
						...i,
						type: i.type || "image",
						fontFamily: i.font_family || "sans",
						imagemUrl: i.imagem_url,
						zIndex: i.z_index,
						likesCount: likesCountMap[i.id] || 0,
					}));

					setItems(mappedItems);
					const maxZ =
						shelfItems.length > 0
							? Math.max(...shelfItems.map((i: any) => i.z_index || 1), 10)
							: 10;
					setMaxZIndex(maxZ);
				}

				console.log("Auth check complete. User ID:", uid);
				setIsOwner(uid === profile.id);

				if (uid) {
					console.log("Fetching user likes...");
					const { data: likes } = await supabase
						.from("likes")
						.select("item_id")
						.eq("user_id", uid);
					if (likes) {
						setLikedItems(new Set(likes.map((l: any) => l.item_id)));
					}
				}
			} catch (err) {
				console.error("Canvas: Erro ao carregar prateleira:", err);
				if (!isBackground) setNotFound(true);
			} finally {
				console.log("Canvas: Finished loading shelf");
				if (timeout) clearTimeout(timeout);
				if (!isBackground) {
					setLoading(false);
					isCurrentlyLoading.current = false;
				}
			}
		},
		[username],
	);

	useEffect(() => {
		loadShelf();
	}, [loadShelf]);

	useEffect(() => {
		if (!profileData?.id) return;

		const channel = new BroadcastChannel("shelf_updates");

		channel.onmessage = (event) => {
			if (
				event.data.type === "card_saved" &&
				event.data.userId === profileData.id
			) {
				loadShelf(true);
			}
		};

		return () => {
			channel.close();
		};
	}, [profileData?.id, loadShelf]);

	const handleLogout = async () => {
		await supabase.auth.signOut();
		setIsMenuOpen(false);
		setCurrentUserId(null);
		setLikedItems(new Set());
		navigate("/");
	};

	const handleDeleteAccount = async () => {
		if (!profileData) return;
		try {
			// Chama a função RPC no banco de dados que apaga tudo de uma vez (incluindo auth.users)
			const { error } = await supabase.rpc("delete_user_account");

			if (error) throw error;

			await supabase.auth.signOut();
			window.location.href = "/";
		} catch (error: any) {
			showToast("Erro ao excluir conta: " + error.message, "error");
		}
	};

	const handleDeleteClick = (id: string) => {
		setConfirmDelete(id);
		setIsModalOpen(false);
		setEditingItem(null);
	};

	const deleteItem = async (id: string) => {
		if (!isOwner) return;
		const { error } = await supabase.from("shelf_items").delete().eq("id", id);
		if (!error) {
			setItems((prev) => prev.filter((item) => item.id !== id));
			showToast("Item removido", "success");
			setConfirmDelete(null);
		} else {
			showToast("Erro ao deletar: " + error.message, "error");
		}
	};

	const savePosition = async (id: string, updates: Partial<ShelfItem>) => {
		if (!isOwner) return;
		await supabase
			.from("shelf_items")
			.update({
				x: updates.x,
				y: updates.y,
				rotation: updates.rotation,
				z_index: updates.zIndex,
			})
			.eq("id", id);
	};

	const handlePositionChange = (id: string, newX: number, newY: number) => {
		setItems((prev) =>
			prev.map((item) =>
				item.id === id ? { ...item, x: newX, y: newY } : item,
			),
		);
		const item = items.find((i) => i.id === id);
		if (item && isOwner)
			savePosition(id, {
				x: newX,
				y: newY,
				rotation: item.rotation,
				zIndex: item.zIndex,
			});
		setHasInteracted(true);
	};

	const bringToFront = (id: string) => {
		const newZ = maxZIndex + 1;
		setMaxZIndex(newZ);
		setItems((prev) =>
			prev.map((item) => (item.id === id ? { ...item, zIndex: newZ } : item)),
		);
		const item = items.find((i) => i.id === id);
		if (item && isOwner)
			savePosition(id, {
				x: item.x,
				y: item.y,
				rotation: item.rotation,
				zIndex: newZ,
			});
		setHasInteracted(true);
	};

	const addItem = async (data: any) => {
		if (!currentUserId || !isOwner) return;

		let rotation = 0;
		if (data.isAutoRotation) {
			rotation = Math.random() * 10 - 5;
		} else {
			if (data.rotationType === "left") rotation = -8;
			else if (data.rotationType === "right") rotation = 8;
			else rotation = 0;
		}

		if (editingItem) {
			const updateData = {
				titulo: data.titulo,
				nota: data.nota,
				imagem_url: data.imagemUrl,
				type: data.type,
				font_family: data.fontFamily,
				rotation: rotation,
			};
			const { error } = await supabase
				.from("shelf_items")
				.update(updateData)
				.eq("id", editingItem.id);
			if (error) {
				showToast("Erro ao atualizar: " + error.message, "error");
			} else {
				setItems((prev) =>
					prev.map((item) =>
						item.id === editingItem.id
							? {
									...item,
									...updateData,
									imagemUrl: data.imagemUrl,
									fontFamily: data.fontFamily,
								}
							: item,
					),
				);
				showToast("Item atualizado", "success");
			}
			return;
		}

		const newZ = maxZIndex + 1;
		setMaxZIndex(newZ);
		const currentScale = scale.get();
		const containerWidth =
			containerRef.current?.clientWidth || window.innerWidth;
		const containerHeight =
			containerRef.current?.clientHeight || window.innerHeight;
		const viewportCenterX =
			ORIGIN_X + (containerWidth / 2 - x.get() - ORIGIN_X) / currentScale;
		const viewportCenterY =
			ORIGIN_Y + (containerHeight / 2 - y.get() - ORIGIN_Y) / currentScale;
		const cardWidth = 180;
		const cardHeight = 250;

		const newItemData = {
			user_id: currentUserId,
			type: data.type,
			titulo: data.titulo,
			nota: data.nota,
			imagem_url: data.imagemUrl,
			font_family: data.fontFamily,
			x: viewportCenterX - cardWidth / 2,
			y: viewportCenterY - cardHeight / 2,
			rotation: rotation,
			z_index: newZ,
		};
		const { data: savedItem, error } = await supabase
			.from("shelf_items")
			.insert([newItemData])
			.select()
			.single();
		if (error) {
			showToast("Erro ao salvar item: " + error.message, "error");
		} else if (savedItem) {
			setItems((prev) => [
				...prev,
				{
					...savedItem,
					type: savedItem.type,
					fontFamily: savedItem.font_family,
					imagemUrl: savedItem.imagem_url,
					zIndex: savedItem.z_index,
				} as ShelfItem,
			]);
			showToast("Item adicionado", "success");
		}
	};

	const updateProfile = (newData: any) => {
		setProfileData((prev) => (prev ? { ...prev, ...newData } : null));
		if (newData.username !== username) navigate(`/${newData.username}`);
	};

	useEffect(() => {
		x.set(-(ORIGIN_X - window.innerWidth / 2));
		y.set(-(ORIGIN_Y - window.innerHeight / 2));
	}, [x, y]);

	const displayName = profileData?.full_name
		? profileData.full_name.split(" ")[0]
		: profileData?.username || username;
	const currentBgColor = previewColor || profileData?.bg_color || "#f0f0f0";
	const buttonColor = getVibrantColor(currentBgColor);
	const buttonTextColor = getContrastColor(buttonColor);

	useEffect(() => {
		document.documentElement.style.backgroundColor = currentBgColor;
		document.body.style.backgroundColor = currentBgColor;
		document.documentElement.style.setProperty(
			"--color-canvas-bg",
			currentBgColor,
		);
		const themeMeta = document.querySelector('meta[name="theme-color"]');
		if (themeMeta) {
			themeMeta.setAttribute("content", currentBgColor);
		}
	}, [currentBgColor]);

	if (loading) return <LoadingScreen bgColor={currentBgColor} />;
	if (notFound)
		return (
			<div className="flex flex-col justify-center items-center bg-[#f0f0f0] p-6 w-full h-[100dvh] text-center">
				<h2 className="font-bold text-black text-2xl">
					Prateleira não encontrada
				</h2>
				<p className="mt-2 text-gray-500">
					O usuário @{username} ainda não criou sua prateleira.
				</p>
				<button
					onClick={() => navigate("/")}
					className="bg-black mt-6 px-6 py-3 rounded-2xl font-bold text-white hover:scale-105 transition-transform cursor-pointer"
				>
					Ir para o Início
				</button>
			</div>
		);

	const handleToggleLike = async (item: ShelfItem) => {
		if (!currentUserId) {
			showToast("Faça login para curtir", "error");
			return;
		}

		const isLiked = likedItems.has(item.id);
		const newLikedItems = new Set(likedItems);

		try {
			if (isLiked) {
				const { error } = await supabase
					.from("likes")
					.delete()
					.eq("user_id", currentUserId)
					.eq("item_id", item.id);
				if (error) throw error;
				newLikedItems.delete(item.id);
				showToast("Curtida removida", "success");
			} else {
				const { error } = await supabase
					.from("likes")
					.insert([{ user_id: currentUserId, item_id: item.id }]);
				if (error) throw error;
				newLikedItems.add(item.id);
				showToast("Curtiu!", "success");
			}
			setLikedItems(newLikedItems);
			setItems((prev) =>
				prev.map((i) => {
					if (i.id === item.id) {
						return {
							...i,
							likesCount: (i.likesCount || 0) + (isLiked ? -1 : 1),
						};
					}
					return i;
				}),
			);
		} catch (err) {
			console.error("Erro ao curtir:", err);
			showToast("Erro ao processar curtida", "error");
		}
	};

	const handleSaveToMyShelf = async (item: ShelfItem) => {
		if (!currentUserId) {
			showToast("Faça login para salvar na sua prateleira", "error");
			return;
		}

		try {
			const { error } = await supabase.from("shelf_items").insert([
				{
					titulo: item.titulo,
					nota: item.nota,
					imagem_url: item.imagemUrl,
					type: item.type,
					font_family: item.fontFamily,
					x: ORIGIN_X,
					y: ORIGIN_Y,
					rotation: item.rotation,
					z_index: 1,
					user_id: currentUserId,
				},
			]);

			if (error) throw error;
			showToast("Salvo na sua prateleira!", "success");

			const channel = new BroadcastChannel("shelf_updates");
			channel.postMessage({ type: "card_saved", userId: currentUserId });
			channel.close();
		} catch (err: any) {
			console.error("Erro ao salvar:", err);
			showToast("Erro ao salvar item", "error");
		}
	};

	return (
		<div
			ref={containerRef}
			className="fixed inset-0 w-full h-full transition-colors duration-500 touch-none"
			style={{ backgroundColor: currentBgColor }}
		>
			<AnimatePresence>
				{toast && (
					<Toast
						message={toast.message}
						type={toast.type}
						x={toast.x}
						y={toast.y}
						bgColor={buttonColor}
						textColor={buttonTextColor}
						onClose={() => setToast(null)}
					/>
				)}
			</AnimatePresence>

			<ConfirmModal
				isOpen={!!confirmDelete}
				title="Excluir item"
				message="Tem certeza que deseja remover este item da sua coleção? Essa ação não pode ser desfeita."
				onConfirm={() => confirmDelete && deleteItem(confirmDelete)}
				onCancel={() => setConfirmDelete(null)}
			/>

			<ConfirmModal
				isOpen={isAccountDeleteModalOpen}
				title="Excluir minha conta"
				message="Tem certeza? Essa ação é irreversível e excluirá todos os seus dados e cards."
				onConfirm={() => {
					setIsAccountDeleteModalOpen(false);
					handleDeleteAccount();
				}}
				onCancel={() => setIsAccountDeleteModalOpen(false)}
			/>

			{isFrameMode && (
				<ShareFrame
					containerRef={containerRef}
					onClose={() => setIsFrameMode(false)}
				/>
			)}

			{profileData && (
				<SettingsModal
					isOpen={isSettingsOpen}
					onClose={() => {
						setIsSettingsOpen(false);
						setPreviewColor(null);
					}}
					currentProfile={profileData as any}
					onUpdate={updateProfile}
					onPreviewColorChange={setPreviewColor}
					showToast={showToast}
					onChangePassword={() => setIsPasswordModalOpen(true)}
				/>
			)}

			<PasswordModal
				isOpen={isPasswordModalOpen}
				onClose={() => setIsPasswordModalOpen(false)}
				showToast={showToast}
				buttonColor={buttonColor}
				buttonTextColor={buttonTextColor}
			/>

			{/* Barra de Ferramentas Superior */}
			<div className="top-[max(1.5rem,env(safe-area-inset-top))] right-[max(1.5rem,env(safe-area-inset-right))] left-[max(1.5rem,env(safe-area-inset-left))] z-50 fixed flex justify-between items-start pointer-events-none main-ui-layer">
				<AnimatePresence>
					{!isFrameMode && (
						<>
							{/* Lado Esquerdo: Menu do Perfil */}
							<motion.div
								initial={{ x: -100, opacity: 0 }}
								animate={{ x: 0, opacity: 1 }}
								exit={{ x: -100, opacity: 0 }}
								transition={{ type: "spring", stiffness: 300, damping: 25 }}
								ref={menuRef}
								className="flex flex-col items-start gap-2 pointer-events-auto"
							>
								<button
									onClick={() => isOwner && setIsMenuOpen(!isMenuOpen)}
									className={`bg-white/80 backdrop-blur-md px-4 h-10 rounded-2xl shadow-sm border border-black/5 flex items-center justify-center gap-2 transition-all ${isOwner ? "hover:bg-gray-50 cursor-pointer active:scale-95" : "cursor-default"}`}
								>
									{profileData?.avatar_url ? (
										<img
											src={profileData.avatar_url}
											alt={displayName}
											className="w-6 h-6 rounded-full object-cover shadow-sm border border-black/10"
										/>
									) : (
										<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
									)}
									<span className="font-bold text-black text-sm uppercase tracking-tight">
										{displayName}
									</span>
								</button>

								<AnimatePresence>
									{isMenuOpen && isOwner && (
										<motion.div
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: -20 }}
											className="flex flex-col items-start gap-2"
										>
											<button
												onClick={() => {
													setIsSettingsOpen(true);
													setIsMenuOpen(false);
												}}
												className="flex items-center gap-2 bg-white/80 hover:bg-gray-50 shadow-sm backdrop-blur-md px-4 py-2 border border-black/5 rounded-2xl font-bold text-black text-sm whitespace-nowrap active:scale-95 transition-all cursor-pointer"
											>
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
												>
													<path
														fillRule="evenodd"
														clipRule="evenodd"
														d="M15.8964 2.30109C15.3763 2.24998 14.7443 2.24999 13.9741 2.25H13.9741L10.0259 2.25H10.0259C9.25571 2.24999 8.62365 2.24998 8.10357 2.30109C7.55891 2.35461 7.07864 2.46829 6.62404 2.72984C6.16937 2.99144 5.82995 3.34942 5.51044 3.79326C5.20544 4.21693 4.88869 4.76293 4.50285 5.42801L2.54214 8.80762L2.54214 8.80762C2.15475 9.47532 1.83673 10.0235 1.61974 10.5002C1.39243 10.9996 1.25 11.4737 1.25 12C1.25 12.5263 1.39243 13.0004 1.61974 13.4998C1.83673 13.9766 2.15475 14.5247 2.54214 15.1924L4.50282 18.5719C4.88867 19.237 5.20543 19.7831 5.51044 20.2067C5.82995 20.6506 6.16937 21.0086 6.62404 21.2702C7.07864 21.5317 7.55891 21.6454 8.10357 21.6989C8.62366 21.75 9.25573 21.75 10.026 21.75L13.974 21.75C14.7443 21.75 15.3763 21.75 15.8964 21.6989C16.4411 21.6454 16.9214 21.5317 17.376 21.2702C17.8306 21.0086 18.17 20.6506 18.4896 20.2067C18.7945 19.7831 19.1113 19.2371 19.4971 18.5721L19.4971 18.572L21.4579 15.1924L21.4579 15.1923C21.8453 14.5246 22.1633 13.9765 22.3803 13.4998C22.6076 13.0004 22.75 12.5263 22.75 12C22.75 11.4737 22.6076 10.9996 22.3803 10.5002C22.1633 10.0235 21.8453 9.47535 21.4579 8.80767L19.4972 5.42801C19.1113 4.76293 18.7946 4.21694 18.4896 3.79326C18.1701 3.34942 17.8306 2.99144 17.376 2.72984C16.9214 2.46829 16.4411 2.35461 15.8964 2.30109ZM12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z"
														fill="currentColor"
													/>
												</svg>
												Ajustes
											</button>

											<button
												onClick={() => {
													setIsPasswordModalOpen(true);
													setIsMenuOpen(false);
												}}
												className="flex items-center gap-2 bg-white/80 hover:bg-gray-50 shadow-sm backdrop-blur-md px-4 py-2 border border-black/5 rounded-2xl font-bold text-black text-sm whitespace-nowrap active:scale-95 transition-all cursor-pointer"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
												>
													<path
														fillRule="evenodd"
														clipRule="evenodd"
														d="M12 3.25C10.067 3.25 8.49999 4.817 8.49999 6.75V8.31016C9.61772 8.27048 10.7654 8.25 12 8.25C13.2346 8.25 14.3823 8.27048 15.5 8.31016V6.75C15.5 4.817 13.933 3.25 12 3.25ZM6.49999 6.75V8.52712C4.93232 9.00686 3.74924 10.3861 3.52451 12.0552C3.37635 13.1556 3.24999 14.3118 3.24999 15.5C3.24999 16.6882 3.37636 17.8444 3.52451 18.9448C3.79608 20.9618 5.46715 22.5555 7.52521 22.6501C8.95364 22.7158 10.4042 22.75 12 22.75C13.5958 22.75 15.0464 22.7158 16.4748 22.6501C18.5328 22.5555 20.2039 20.9618 20.4755 18.9448C20.6236 17.8444 20.75 16.6882 20.75 15.5C20.75 14.3118 20.6236 13.1556 20.4755 12.0552C20.2507 10.3861 19.0677 9.00686 17.5 8.52712V6.75C17.5 3.71243 15.0376 1.25 12 1.25C8.96243 1.25 6.49999 3.71243 6.49999 6.75ZM13 14.5C13 13.9477 12.5523 13.5 12 13.5C11.4477 13.5 11 13.9477 11 14.5V16.5C11 17.0523 11.4477 17.5 12 17.5C12.5523 17.5 13 17.0523 13 16.5V14.5Z"
														fill="currentColor"
													></path>
												</svg>
												Senha
											</button>
											<button
												onClick={async () => {
													const url = window.location.href;
													const shareData = {
														title: `Prateleira de ${profileData?.full_name || username}`,
														text: "Dê uma olhada na minha prateleira pessoal!",
														url: url,
													};

													if (
														navigator.share &&
														navigator.canShare &&
														navigator.canShare(shareData)
													) {
														try {
															await navigator.share(shareData);
														} catch (err) {
															console.error("Erro ao compartilhar", err);
														}
													} else {
														navigator.clipboard.writeText(url);
														showToast("Link copiado", "success");
													}
													setIsMenuOpen(false);
												}}
												className="flex items-center gap-2 bg-white/80 hover:bg-gray-50 shadow-sm backdrop-blur-md px-4 py-2 border border-black/5 rounded-2xl font-bold text-black text-sm whitespace-nowrap active:scale-95 transition-all cursor-pointer"
											>
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
												>
													<path
														d="M21.5973 2.54257C21.1299 2.03918 20.397 1.85063 19.6968 1.78314C18.9611 1.71223 18.08 1.75939 17.1313 1.88382C15.2288 2.13337 12.9302 2.71102 10.7222 3.42176C8.51281 4.13295 6.35914 4.98865 4.74626 5.80847C3.94355 6.21648 3.24734 6.62932 2.74121 7.02586C2.48919 7.22331 2.25922 7.436 2.08623 7.66237C1.92123 7.87829 1.74764 8.18549 1.75002 8.55582C1.75629 9.5279 2.41829 10.2149 3.12327 10.676C3.84284 11.1467 4.77998 11.5014 5.71161 11.7792C6.65324 12.06 7.64346 12.2776 8.49473 12.454C8.55052 12.4655 8.66203 12.4886 8.79867 12.5168C9.31323 12.6231 9.57051 12.6763 9.81237 12.6039C10.0542 12.5315 10.2402 12.3456 10.612 11.9737L14.2929 8.29289C14.6834 7.90237 15.3166 7.90237 15.7071 8.29289C16.0976 8.68342 16.0976 9.31659 15.7071 9.70711L12.2745 13.1397C11.8954 13.5188 11.7059 13.7083 11.6342 13.9543C11.5624 14.2003 11.6203 14.4614 11.736 14.9837C12.1844 17.0084 12.5738 18.6815 12.9623 19.8071C13.1892 20.4645 13.4445 21.0336 13.7678 21.4533C14.1052 21.8913 14.5642 22.2222 15.1683 22.2489C15.5444 22.2655 15.8571 22.0938 16.0715 21.9344C16.2975 21.7666 16.51 21.5414 16.7071 21.2953C17.1031 20.8005 17.5192 20.1159 17.9332 19.3247C18.7652 17.7347 19.6462 15.6028 20.3917 13.4096C21.1368 11.2173 21.7577 8.9306 22.0568 7.0301C22.206 6.0823 22.2798 5.20207 22.2388 4.46477C22.1999 3.76556 22.0509 3.03106 21.5973 2.54257Z"
														fill="currentColor"
													/>
												</svg>
												Compartilhar
											</button>
											<button
												onClick={handleLogout}
												className="flex items-center gap-2 bg-white/80 hover:bg-gray-50 shadow-sm backdrop-blur-md px-4 py-2 border border-black/5 rounded-2xl font-bold text-black text-sm whitespace-nowrap active:scale-95 transition-all cursor-pointer"
											>
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
												>
													<path
														fillRule="evenodd"
														clipRule="evenodd"
														d="M12.8047 1.25403C13.5272 1.22641 14.1992 1.33335 14.7617 1.80189L14.8633 1.89271C15.3521 2.35212 15.5566 2.95757 15.6523 3.62806C15.75 4.31254 15.75 5.19262 15.75 6.25696V17.7443C15.75 18.8083 15.75 19.6878 15.6523 20.3722C15.5566 21.0427 15.3521 21.6481 14.8633 22.1076L14.7617 22.1984C14.1991 22.667 13.5272 22.7738 12.8047 22.7462C12.2782 22.7261 11.6504 22.6298 10.918 22.5011L10.1504 22.3634L7.15039 21.8185L7.10742 21.8107C6.36019 21.6751 5.73189 21.5611 5.23633 21.4064C4.77688 21.2629 4.36492 21.0658 4.02832 20.7306L3.88867 20.5792C3.52921 20.1493 3.38117 19.6519 3.31348 19.1066C3.24994 18.5947 3.24997 17.9609 3.25 17.2081V6.79212C3.24997 6.03933 3.24993 5.40562 3.31348 4.89368C3.38118 4.34837 3.52919 3.85098 3.88867 3.42103L4.02832 3.26966C4.36491 2.93446 4.77689 2.73732 5.23633 2.59388C5.73188 2.43917 6.36022 2.32517 7.10742 2.18958L7.15039 2.18177L10.1504 1.63685L10.918 1.49915C11.6504 1.37043 12.2782 1.27418 12.8047 1.25403ZM12 11.0001C11.4477 11.0001 11 11.4478 11 12.0001V12.0099L11.0049 12.1124C11.0561 12.6167 11.4822 13.0099 12 13.0099C12.5178 13.0099 12.9439 12.6167 12.9951 12.1124L13 12.0099V12.0001C13 11.4478 12.5523 11.0001 12 11.0001Z"
														fill="currentColor"
													/>
													<path
														d="M18.75 17.7499V6.24974C18.75 5.73206 18.3567 5.30595 17.8525 5.25462L17.6475 5.24486C17.1433 5.19352 16.75 4.76742 16.75 4.24974C16.75 3.69745 17.1977 3.24974 17.75 3.24974C19.4069 3.24974 20.75 4.59288 20.75 6.24974V17.7499C20.75 19.4067 19.4069 20.7499 17.75 20.7499C17.1977 20.7499 16.75 20.3022 16.75 19.7499C16.75 19.2322 17.1433 18.8061 17.6475 18.7548L17.8525 18.745C18.3567 18.6937 18.75 18.2675 18.75 17.7499Z"
														fill="currentColor"
													/>
												</svg>
												Sair
											</button>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>

							{/* Lado Direito: Botão de Compartilhar */}
							<motion.div
								initial={{ x: 100, opacity: 0 }}
								animate={{ x: 0, opacity: 1 }}
								exit={{ x: 100, opacity: 0 }}
								transition={{ type: "spring", stiffness: 300, damping: 25 }}
								className="pointer-events-auto"
							>
								{isOwner && (
									<button
										onClick={() => {
											setIsFrameMode(true);
										}}
										className="flex justify-center items-center bg-white/80 hover:bg-white shadow-sm backdrop-blur-md border border-black/5 rounded-2xl w-9 h-9 active:scale-90 transition-all cursor-pointer"
										title="Capturar Prateleira"
									>
										<svg
											width="16"
											height="16"
											viewBox="0 0 24 24"
											fill="none"
											className="text-black"
										>
											<path
												d="M12.75 4.69635C12.75 3.89755 13.3976 3.25 14.1963 3.25C14.5985 3.25 14.9826 3.41746 15.2562 3.71218L21.2094 10.1233C21.5569 10.4975 21.75 10.9893 21.75 11.5C21.75 12.0107 21.5569 12.5025 21.2094 12.8767L15.2562 19.2878C14.9826 19.5825 14.5985 19.75 14.1963 19.75C13.3976 19.75 12.75 19.1024 12.75 18.3037V15.2768C8.06858 15.6137 5.50309 19.0374 4.82196 20.0917C4.56902 20.4832 4.12931 20.75 3.6275 20.75C2.86673 20.75 2.25 20.1333 2.25 19.3725V18.5C2.25 12.6465 6.92842 7.8857 12.75 7.75285V4.69635Z"
												fill="currentColor"
											/>
										</svg>
									</button>
								)}
							</motion.div>
						</>
					)}
				</AnimatePresence>
			</div>

			<motion.div
				drag
				dragControls={canvasDragControls}
				dragListener={false}
				dragMomentum={true}
				dragTransition={{ power: 0.2, timeConstant: 200 }}
				onPointerDown={(e) => {
					// Só permite arrastar o canvas se NÃO clicou em um card ou botão
					if (
						!isModalOpen &&
						!isSettingsOpen &&
						!isPinching &&
						!(e.target as HTMLElement).closest(".card-draggable") &&
						!(e.target as HTMLElement).closest("button")
					) {
						setInteractionMenuId(null);
						canvasDragControls.start(e);
						setHasInteracted(true);
					}
				}}
				onDragStart={() => {
					setHasInteracted(true);
				}}
				onDragEnd={() => {}}
				style={{ x, y }}
				className="absolute w-[5000px] h-[5000px] cursor-grab active:cursor-grabbing"
			>
				<motion.div
					style={{
						position: "absolute",
						inset: 0,
						scale,
						transformOrigin: `${ORIGIN_X}px ${ORIGIN_Y}px`,
					}}
				>
					<div
						className="absolute inset-0 pointer-events-none"
						style={{
							backgroundImage:
								"radial-gradient(circle, rgba(0,0,0,0.08) 1.5px, transparent 1.5px)",
							backgroundSize: "40px 40px",
						}}
					/>

					{/* <AnimatePresence>
            {!hasInteracted && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                exit={{ opacity: 0 }}
                transition={{ 
                  opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="absolute flex items-center gap-3 text-black pointer-events-none select-none"
                style={{ 
                  left: ORIGIN_X, 
                  top: ORIGIN_Y, 
                  transform: 'translate(-50%, -50%)' 
                }}
              >
                <MoveIcon />
                <p className="font-semibold text-base uppercase tracking-tight whitespace-nowrap">
                  Arraste para mover
                </p>
              </motion.div>
            )}
          </AnimatePresence> */}

					<AnimatePresence>
						{interactionMenuId && (
							<motion.div
								key="interaction-overlay"
								initial={{ opacity: 0 }}
								animate={{ opacity: 0.8 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.4 }}
								onPointerDown={(e) => {
									e.stopPropagation();
									setInteractionMenuId(null);
								}}
								className="absolute inset-[-10000px] z-[9998] cursor-default"
								style={{ backgroundColor: currentBgColor }}
							/>
						)}
					</AnimatePresence>

					{items.map((item) => (
						<ProjectCard
							key={item.id}
							project={item}
							onPositionChange={handlePositionChange}
							zIndex={item.zIndex || 1}
							onDragStart={() => bringToFront(item.id)}
							onEdit={isOwner && !isFrameMode ? handleEditItem : undefined}
							isOwner={isOwner}
							canvasScale={scale.get()}
							isBlocked={isModalOpen || isSettingsOpen || isFrameMode}
							onPointerDown={() => setInteractionMenuId(null)}
							onDoubleClick={!isFrameMode ? handleToggleLike : undefined}
							onLongPress={
								!isFrameMode
									? (item) => setInteractionMenuId(item.id)
									: undefined
							}
							isLiked={likedItems.has(item.id)}
							isMenuOpen={interactionMenuId === item.id}
							isDimmed={
								interactionMenuId !== null && interactionMenuId !== item.id
							}
							onCloseMenu={() => setInteractionMenuId(null)}
							onSave={handleSaveToMyShelf}
						/>
					))}
				</motion.div>
			</motion.div>

			<div className="left-[max(1.5rem,env(safe-area-inset-left))] bottom-[max(2rem,env(safe-area-inset-bottom))] z-[1000] fixed flex flex-col items-start gap-3 pointer-events-none main-ui-layer">
				<AnimatePresence>
					{!isFrameMode && (
						<motion.div
							initial={{ x: -100, opacity: 0 }}
							animate={{ x: 0, opacity: 1 }}
							exit={{ x: -100, opacity: 0 }}
							transition={{ type: "spring", stiffness: 300, damping: 25 }}
							className="flex flex-col items-start gap-3"
						>
							<AnimatePresence mode="popLayout">
								{isMenuOpen && isOwner && (
									<motion.div
										layout
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -20 }}
										className="pointer-events-auto"
									>
										<button
											onClick={() => setIsAccountDeleteModalOpen(true)}
											className="flex items-center gap-2 bg-white/80 hover:bg-red-50 shadow-sm backdrop-blur-md px-4 py-2 border border-black/5 rounded-2xl font-bold text-red-500 text-sm whitespace-nowrap active:scale-95 transition-all cursor-pointer"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="14"
												height="14"
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
											Excluir conta
										</button>
									</motion.div>
								)}
							</AnimatePresence>

							<AnimatePresence mode="popLayout">
								{zoomDisplay !== 100 && (
									<motion.button
										layout
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.8 }}
										onClick={() => {
											animate(scale, 1, {
												type: "spring",
												bounce: 0,
												duration: 0.5,
											});
										}}
										className="bg-white/80 hover:bg-white shadow-sm backdrop-blur-md px-3 py-1.5 border border-black/5 rounded-full font-bold text-[10px] text-black/60 hover:text-black active:scale-90 transition-all cursor-pointer pointer-events-auto select-none"
									>
										{zoomDisplay}%
									</motion.button>
								)}
							</AnimatePresence>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<div className="right-[max(2rem,env(safe-area-inset-right))] bottom-[max(2rem,env(safe-area-inset-bottom))] z-[1000] fixed flex flex-col items-end gap-3 main-ui-layer pointer-events-none">
				<AnimatePresence>
					{!isFrameMode && (
						<motion.div
							initial={{ x: 100, opacity: 0 }}
							animate={{ x: 0, opacity: 1 }}
							exit={{ x: 100, opacity: 0 }}
							transition={{ type: "spring", stiffness: 300, damping: 25 }}
							className="flex flex-col items-end gap-3 pointer-events-auto"
						>
							{isOwner && (
								<button
									onClick={() => {
										setModalDefaultType("text");
										setIsModalOpen(true);
									}}
									className="flex justify-center items-center bg-white shadow-sm shadow-xl border border-black/5 rounded-full w-12 h-12 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
									title="Adicionar Texto"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
									>
										<path
											fill-rule="evenodd"
											clip-rule="evenodd"
											d="M8 21C8 20.4477 8.44772 20 9 20H15C15.5523 20 16 20.4477 16 21C16 21.5523 15.5523 22 15 22H9C8.44772 22 8 21.5523 8 21Z"
											fill="black"
										></path>
										<path
											fill-rule="evenodd"
											clip-rule="evenodd"
											d="M12 2C12.5523 2 13 2.44772 13 3V21C13 21.5523 12.5523 22 12 22C11.4477 22 11 21.5523 11 21V3C11 2.44772 11.4477 2 12 2Z"
											fill="black"
										></path>
										<path
											d="M12 4C10.6663 4 8.92636 4.14259 7.51324 4.28698C6.85362 4.35437 6.72441 4.37712 6.62291 4.41844C6.35293 4.52836 6.12217 4.78389 6.04027 5.06365C6.00973 5.16796 5.99998 5.30827 5.99998 6C5.99998 6.55228 5.55227 7 4.99998 7C4.4477 7 3.99998 6.55228 3.99998 6L3.9999 5.89007C3.99931 5.37184 3.99879 4.91856 4.12084 4.50169C4.3741 3.63663 5.03392 2.90596 5.86877 2.56607C6.2709 2.40235 6.70914 2.35808 7.20685 2.30779L7.30995 2.29733C8.73455 2.15178 10.5589 2 12 2C13.441 2 15.2654 2.15178 16.69 2.29733L16.7931 2.30779C17.2908 2.35808 17.7291 2.40235 18.1312 2.56607C18.966 2.90596 19.6259 3.63663 19.8791 4.50169C20.0012 4.91856 20.0007 5.37184 20.0001 5.89007L20 6C20 6.55228 19.5523 7 19 7C18.4477 7 18 6.55228 18 6C18 5.30827 17.9902 5.16796 17.9597 5.06365C17.8778 4.78389 17.647 4.52836 17.3771 4.41844C17.2756 4.37712 17.1463 4.35437 16.4867 4.28698C15.0736 4.14259 13.3337 4 12 4Z"
											fill="black"
										></path>
									</svg>
								</button>
							)}

							<button
								onClick={() => (isOwner ? setIsModalOpen(true) : navigate("/"))}
								className="flex justify-center items-center shadow-sm shadow-xl border border-black/5 rounded-full w-14 h-14 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
								style={{ backgroundColor: buttonColor, color: buttonTextColor }}
							>
								<PlusIcon size={22} />
							</button>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{isOwner && (
				<AddItemModal
					isOpen={isModalOpen}
					onClose={handleCloseModal}
					onAdd={addItem}
					onDelete={handleDeleteClick}
					initialData={editingItem}
					buttonColor={buttonColor}
					defaultType={modalDefaultType}
				/>
			)}
		</div>
	);
};
