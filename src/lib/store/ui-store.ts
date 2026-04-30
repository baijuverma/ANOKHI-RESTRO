import { createSignal } from "solid-js";

const [sidebarCollapsed, setSidebarCollapsed] = createSignal(false);
const [sidebarHovered, setSidebarHovered] = createSignal(false);

export const useUIStore = () => {
    const isEffectivelyCollapsed = () => sidebarCollapsed() && !sidebarHovered();

    return {
        sidebarCollapsed,
        setSidebarCollapsed,
        sidebarHovered,
        setSidebarHovered,
        isEffectivelyCollapsed
    };
};
