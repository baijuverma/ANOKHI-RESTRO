import { createSignal } from "solid-js";

const STORAGE_KEY = "item_images";

function loadFromStorage(): Record<string, string> {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

const [itemImages, setItemImagesRaw] = createSignal<Record<string, string>>(loadFromStorage());

export function setItemImage(itemId: string, base64: string) {
    const updated = { ...itemImages(), [itemId]: base64 };
    setItemImagesRaw(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function removeItemImage(itemId: string) {
    const updated = { ...itemImages() };
    delete updated[itemId];
    setItemImagesRaw(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getItemImage(itemId: string): string | undefined {
    return itemImages()[itemId];
}

export { itemImages };
