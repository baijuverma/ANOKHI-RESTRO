import { createSignal } from "solid-js";

const [totalRevenue, setTotalRevenue] = createSignal(0);
const [totalExpenses, setTotalExpenses] = createSignal(0);

export function useExpenseStats() {
    return {
        totalRevenue,
        totalExpenses,
        setStats: (revenue: number, expenses: number) => {
            setTotalRevenue(revenue);
            setTotalExpenses(expenses);
        }
    };
}
