import { createSignal } from "solid-js";

const getFirstDayOfMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 12);
    d.setDate(1);
    return d.toISOString().split("T")[0];
};
const getToday = () => new Date().toISOString().split("T")[0];

const [startDate, setStartDate] = createSignal(getFirstDayOfMonth());
const [endDate, setEndDate] = createSignal(getToday());

export function useExpenseDateFilter() {
    return { startDate, endDate, setStartDate, setEndDate };
}
