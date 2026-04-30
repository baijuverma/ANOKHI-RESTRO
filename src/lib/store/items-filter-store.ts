import { createSignal } from "solid-js";

const [itemSearch, setItemSearch] = createSignal("");
const [itemFilterCat, setItemFilterCat] = createSignal<string[]>([]);
const [itemCategories, setItemCategories] = createSignal<string[]>([]);
const [itemCount, setItemCount] = createSignal(0);
const [itemCategoryCounts, setItemCategoryCounts] = createSignal<Record<string, number>>({});

export function useItemsFilter() {
    return { itemSearch, setItemSearch, itemFilterCat, setItemFilterCat, itemCategories, setItemCategories, itemCount, setItemCount, itemCategoryCounts, setItemCategoryCounts };
}
