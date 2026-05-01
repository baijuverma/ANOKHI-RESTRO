
"use client";

import { useState, useMemo, useEffect } from "react";
import { Item } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Check, X, Search, ArrowUpDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BIHAR_MENU_ITEMS } from "@/lib/menu-data";

interface ItemsManagementProps {
    initialItems: Item[];
    restaurantId: string;
}

export function ItemsManagement({ initialItems, restaurantId }: ItemsManagementProps) {
    const [items, setItems] = useState<Item[]>(initialItems);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);

    // Sort and Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [sortAsc, setSortAsc] = useState(true);

    // Sync items when initialItems prop updates
    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    // Derived state for filtered and sorted items
    const displayedItems = useMemo(() => {
        let result = [...items];

        // 1. Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query)
            );
        }

        // 2. Sort by name alphabetically
        result.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            if (nameA < nameB) return sortAsc ? -1 : 1;
            if (nameA > nameB) return sortAsc ? 1 : -1;
            return 0;
        });

        return result;
    }, [items, searchQuery, sortAsc]);

    // New Item State
    const [newItem, setNewItem] = useState({
        name: "",
        category: "",
        price: "",
        is_active: true
    });

    // Edit Item State
    const [editItem, setEditItem] = useState({
        name: "",
        category: "",
        price: "",
        is_active: true
    });

    const configured = isSupabaseConfigured();
    const supabase = useMemo(() => configured ? createClient() : null, [configured]);

    // Start editing an item
    const handleEditStart = (item: Item) => {
        setIsEditing(item.id);
        setEditItem({
            name: item.name,
            category: item.category,
            price: item.price.toString(),
            is_active: item.is_active
        });
    };

    // Cancel editing
    const handleEditCancel = () => {
        setIsEditing(null);
        setEditItem({ name: "", category: "", price: "", is_active: true });
    };

    // Save edited item
    const handleEditSave = async (id: string) => {
        if (!editItem.name || !editItem.price) {
            toast.error("Name and Price are required");
            return;
        }

        setLoading(true);
        try {
            const updatedFields = {
                name: editItem.name,
                category: editItem.category,
                price: parseFloat(editItem.price),
                is_active: editItem.is_active
            };

            if (supabase) {
                const { error } = await supabase
                    .from("items")
                    .update(updatedFields)
                    .eq("id", id);
                if (error) throw error;
            }

            setItems(items.map(item =>
                item.id === id ? { ...item, ...updatedFields } : item
            ));

            setIsEditing(null);
            setEditItem({ name: "", category: "", price: "", is_active: true });
            toast.success("Item updated successfully");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.price) {
            toast.error("Name and Price are required");
            return;
        }
        setLoading(true);
        try {
            if (supabase) {
                const { data, error } = await supabase
                    .from("items")
                    .insert({
                        restaurant_id: restaurantId,
                        name: newItem.name,
                        category: newItem.category,
                        price: parseFloat(newItem.price),
                        is_active: newItem.is_active
                    })
                    .select()
                    .single();

                if (error) throw error;
                setItems([data, ...items]);
            } else {
                const demoItem: Item = {
                    id: `demo-${Date.now()}`,
                    restaurant_id: restaurantId,
                    name: newItem.name,
                    category: newItem.category,
                    price: parseFloat(newItem.price),
                    is_active: newItem.is_active,
                    created_at: new Date().toISOString(),
                };
                setItems([demoItem, ...items]);
            }

            setNewItem({ name: "", category: "", price: "", is_active: true });
            setIsAdding(false);
            toast.success("Item added successfully");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (typeof window !== 'undefined' && !window.confirm("Are you sure?")) return;
        try {
            if (supabase) {
                const { error } = await supabase.from("items").delete().eq("id", id);
                if (error) throw error;
            }
            setItems(items.filter(i => i.id !== id));
            toast.success("Item deleted");
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleRemoveDuplicates = async () => {
        if (!confirm("This will remove all duplicate items (keeping the first one found). Continue?")) return;

        setLoading(true);
        try {
            const seen = new Set();
            const uniqueItems: Item[] = [];
            const duplicatesToRemove: string[] = [];

            // Identify duplicates
            items.forEach(item => {
                const normalizedName = item.name.trim().toLowerCase();
                if (seen.has(normalizedName)) {
                    duplicatesToRemove.push(item.id);
                } else {
                    seen.add(normalizedName);
                    uniqueItems.push(item);
                }
            });

            if (duplicatesToRemove.length === 0) {
                toast.info("No duplicates found!");
                setLoading(false);
                return;
            }

            // Remove from Supabase if connected
            if (supabase) {
                const { error } = await supabase
                    .from("items")
                    .delete()
                    .in("id", duplicatesToRemove);

                if (error) throw error;
            }

            // Update local state
            setItems(uniqueItems);
            toast.success(`Removed ${duplicatesToRemove.length} duplicate items!`);
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to remove duplicates: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadBiharMenu = async () => {
        if (typeof window !== 'undefined' && !window.confirm("This will add Bihar special items to your menu. Continue?")) return;

        setLoading(true);
        try {
            // Filter out items that already exist (by name comparison, case-insensitive)
            const existingNames = new Set(items.map(i => i.name.toLowerCase()));
            const newItemsToAdd = BIHAR_MENU_ITEMS.filter(bi => !existingNames.has(bi.name.toLowerCase()));

            if (newItemsToAdd.length === 0) {
                toast.info("All items from the Bihar menu are already added!");
                return;
            }

            if (supabase) {
                const itemsToInsert = newItemsToAdd.map(item => ({
                    restaurant_id: restaurantId,
                    name: item.name,
                    category: item.category,
                    price: item.price,
                    is_active: true
                }));

                const { data, error } = await supabase
                    .from("items")
                    .insert(itemsToInsert)
                    .select();

                if (error) throw error;

                const insertedItems = Array.isArray(data) ? data as Item[] : [];
                setItems([...insertedItems, ...items]);
                toast.success(`Added ${insertedItems.length} new items successfully!`);
            } else {
                const demoItems = newItemsToAdd.map((item, index) => ({
                    id: `demo-bihar-${Date.now()}-${index}`,
                    restaurant_id: restaurantId,
                    name: item.name,
                    category: item.category,
                    price: item.price,
                    is_active: true,
                    created_at: new Date().toISOString(),
                }));

                setItems([...demoItems, ...items]);
                toast.success(`Added ${demoItems.length} demo items!`);
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to add items: " + (error?.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Sticky Header Section */}
            <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 border-b shadow-sm -mx-3 px-3 -mt-3 pt-2 sm:-mx-4 sm:px-4 sm:-mt-4 sm:pt-2 lg:-mx-6 lg:px-6 lg:-mt-6 lg:pt-2 pb-4 mb-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search items..."
                                className="pl-8 bg-background"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={handleLoadBiharMenu} disabled={loading} className="whitespace-nowrap flex-1 sm:flex-none bg-background hover:bg-accent hover:text-accent-foreground dark:text-white dark:border-gray-700">
                            🍛 Load Bihar Menu
                        </Button>
                        <Button variant="outline" onClick={handleRemoveDuplicates} className="whitespace-nowrap flex-1 sm:flex-none bg-background text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 dark:border-red-900/50">
                            <Trash2 className="mr-2 h-4 w-4" /> Remove Duplicates
                        </Button>
                        <Button onClick={() => setIsAdding(!isAdding)} className="whitespace-nowrap flex-1 sm:flex-none">
                            <Plus className="mr-2 h-4 w-4" /> Add Item
                        </Button>
                    </div>
                </div>

                {/* Database Status Indicator */}
                <div className="text-xs mt-2">
                    {supabase ? (
                        <span className="text-green-600 flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-green-600" /> Database Connected
                        </span>
                    ) : (
                        <span className="text-orange-600 flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-orange-600" /> Demo Mode
                        </span>
                    )}
                </div>
            </div>

            {/* Add Item Form */}
            {isAdding && (
                <div className="bg-muted/50 p-4 rounded-lg border space-y-4 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-semibold">New Item</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label>Name</Label>
                            <Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Burger" />
                        </div>
                        <div>
                            <Label>Category</Label>
                            <Input value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} placeholder="Fast Food" />
                        </div>
                        <div>
                            <Label>Price</Label>
                            <Input type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} placeholder="0.00" />
                        </div>
                        <div className="flex items-end">
                            <Label className="flex items-center gap-2 pb-3 cursor-pointer">
                                <input type="checkbox" checked={newItem.is_active} onChange={(e) => setNewItem({ ...newItem, is_active: e.target.checked })} className="h-4 w-4" />
                                Active
                            </Label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                        <Button onClick={handleAddItem} disabled={loading}>Save Item</Button>
                    </div>
                </div>
            )}

            {/* Items Table */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">S.No</TableHead>
                            <TableHead className="w-[30%]">
                                <Button variant="ghost" onClick={() => setSortAsc(!sortAsc)} className="flex items-center gap-1 pl-0 hover:bg-transparent font-bold">
                                    Name <ArrowUpDown className="h-3 w-3" />
                                </Button>
                            </TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayedItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No items found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayedItems.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                                    {isEditing === item.id ? (
                                        <>
                                            <TableCell><Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} className="h-8" /></TableCell>
                                            <TableCell><Input value={editItem.category} onChange={(e) => setEditItem({ ...editItem, category: e.target.value })} className="h-8" /></TableCell>
                                            <TableCell><Input type="number" value={editItem.price} onChange={(e) => setEditItem({ ...editItem, price: e.target.value })} className="h-8 w-24" /></TableCell>
                                            <TableCell>
                                                <input type="checkbox" checked={editItem.is_active} onChange={(e) => setEditItem({ ...editItem, is_active: e.target.checked })} className="h-4 w-4" />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleEditSave(item.id)}><Check className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={handleEditCancel}><X className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </>
                                    ) : (
                                        <>
                                            <TableCell className="font-medium dark:text-white">{item.name}</TableCell>
                                            <TableCell className="dark:text-white">{item.category}</TableCell>
                                            <TableCell className="dark:text-white">{formatCurrency(item.price)}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.is_active ? "outline" : "secondary"} className={item.is_active ? "text-green-600 bg-green-50 border-green-200" : ""}>
                                                    {item.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="text-blue-600" onClick={() => handleEditStart(item)}><Edit2 className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
