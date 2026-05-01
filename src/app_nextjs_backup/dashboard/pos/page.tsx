
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server";
import { PosInterface } from "@/components/pos/PosInterface";
import { Item, Restaurant } from "@/types";

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

const DEMO_RESTAURANT: Restaurant = {
    id: "demo",
    name: "Demo Restaurant",
    gst_number: "29AABCU9603R1ZJ",
    gst_percentage: 18,
    address: "123 Demo Street, New Delhi",
    phone: "9876543210",
    created_at: new Date().toISOString(),
    owner_id: "demo"
};

export default async function PosPage() {
    const isConfigured = isServerSupabaseConfigured();
    let items: Item[] = [];
    let restaurant: Restaurant | null = null;

    if (isConfigured) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data: userProfile } = await supabase
                .from("users")
                .select("restaurant_id")
                .eq("id", user.id)
                .maybeSingle();

            const restaurantId = userProfile?.restaurant_id;

            if (restaurantId) {
                // Fetch active items
                const { data: activeItems } = await supabase
                    .from("items")
                    .select("*")
                    .eq("restaurant_id", restaurantId)
                    .eq("is_active", true)
                    .order("name");

                items = activeItems as Item[] || [];

                // Fetch restaurant
                const { data: restData } = await supabase
                    .from("restaurants")
                    .select("*")
                    .eq("id", restaurantId)
                    .single();

                restaurant = restData;
            }
        }
    } else {
        items = DEMO_ITEMS;
        restaurant = DEMO_RESTAURANT;
    }

    return (
        <div className="h-[calc(100vh-4rem)]">
            <PosInterface
                initialItems={items}
                restaurant={restaurant}
            />
        </div>
    );
}
