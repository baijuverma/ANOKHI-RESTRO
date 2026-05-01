
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server";
import { ItemsManagement } from "@/components/items/ItemsManagement";
import { Item } from "@/types";

// Demo items for when Supabase is not configured
const DEMO_ITEMS: Item[] = [
    { id: "1", name: "Butter Chicken", price: 350, category: "Main Course", is_active: true, restaurant_id: "demo", created_at: new Date().toISOString() },
    { id: "2", name: "Paneer Tikka", price: 280, category: "Starters", is_active: true, restaurant_id: "demo", created_at: new Date().toISOString() },
    { id: "3", name: "Dal Makhani", price: 220, category: "Main Course", is_active: true, restaurant_id: "demo", created_at: new Date().toISOString() },
    { id: "4", name: "Naan", price: 50, category: "Breads", is_active: true, restaurant_id: "demo", created_at: new Date().toISOString() },
    { id: "5", name: "Tandoori Roti", price: 30, category: "Breads", is_active: true, restaurant_id: "demo", created_at: new Date().toISOString() },
    { id: "6", name: "Biryani", price: 300, category: "Rice", is_active: true, restaurant_id: "demo", created_at: new Date().toISOString() },
    { id: "7", name: "Gulab Jamun", price: 100, category: "Desserts", is_active: true, restaurant_id: "demo", created_at: new Date().toISOString() },
    { id: "8", name: "Masala Chai", price: 40, category: "Beverages", is_active: true, restaurant_id: "demo", created_at: new Date().toISOString() },
    { id: "9", name: "Cold Coffee", price: 120, category: "Beverages", is_active: true, restaurant_id: "demo", created_at: new Date().toISOString() },
    { id: "10", name: "Chicken Tikka", price: 320, category: "Starters", is_active: true, restaurant_id: "demo", created_at: new Date().toISOString() },
];

export default async function ItemsPage() {
    const isConfigured = isServerSupabaseConfigured();
    let items: Item[] = [];
    let restaurantId = "demo";

    if (isConfigured) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data: userProfile } = await supabase
                .from("users")
                .select("restaurant_id")
                .eq("id", user.id)
                .maybeSingle();

            restaurantId = userProfile?.restaurant_id || "demo";

            if (restaurantId !== "demo") {
                const { data: itemsData } = await supabase
                    .from("items")
                    .select("*")
                    .eq("restaurant_id", restaurantId)
                    .order("created_at", { ascending: false });

                items = itemsData as Item[] || [];
            }
        }
    } else {
        items = DEMO_ITEMS;
    }

    return <ItemsManagement initialItems={items} restaurantId={restaurantId} />;
}
