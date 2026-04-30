"use client";

import { useState, useMemo } from "react";
import { Restaurant } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { INVOICE_TEMPLATES } from "@/components/invoices";

interface SettingsFormProps {
    initialData: Restaurant | null;
    userId: string;
}

export function SettingsForm({ initialData, userId }: SettingsFormProps) {
    const [data, setData] = useState<Restaurant>(initialData || {
        id: "",
        name: "",
        address: "",
        phone: "",
        gst_number: "",
        gst_enabled: false,
        gst_percentage: 5,
        printer_size: '80mm',
        invoice_template: 'classic',
        owner_id: userId,
        created_at: ""
    });

    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const configured = isSupabaseConfigured();
    const supabase = useMemo(() => configured ? createClient() : null, [configured]);

    const handleSave = async () => {
        setLoading(true);
        try {
            if (supabase) {
                // Real Supabase mode
                if (initialData) {
                    const { error } = await supabase
                        .from("restaurants")
                        .update({
                            name: data.name,
                            address: data.address,
                            phone: data.phone,
                            gst_number: data.gst_number,
                            gst_enabled: data.gst_enabled,
                            gst_percentage: data.gst_percentage,
                            printer_size: data.printer_size,
                            invoice_template: data.invoice_template
                        })
                        .eq("id", initialData.id);

                    if (error) {
                        console.error("Update error:", error);
                        throw error;
                    }
                    toast.success("Settings updated");
                    router.refresh(); // Refresh server data
                } else {
                    const { data: newRest, error } = await supabase
                        .from("restaurants")
                        .insert({
                            name: data.name,
                            address: data.address,
                            phone: data.phone,
                            gst_number: data.gst_number,
                            gst_enabled: data.gst_enabled,
                            gst_percentage: data.gst_percentage,
                            printer_size: data.printer_size,
                            invoice_template: data.invoice_template,
                            owner_id: userId
                        })
                        .select()
                        .single();

                    if (error) throw error;
                    await supabase.from("users").update({ restaurant_id: newRest.id }).eq("id", userId);
                    toast.success("Restaurant created");
                    router.refresh();
                }
            } else {
                // Demo mode - just show success
                toast.success("Settings saved (Demo Mode - changes are temporary)");
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">


            <Card>
                <CardHeader>
                    <CardTitle>Restaurant Details</CardTitle>
                    <CardDescription>Manage your business information and billing preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Restaurant Name</Label>
                        <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Address</Label>
                        <Input value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Phone</Label>
                        <Input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} />
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h3 className="font-semibold mb-2">GST Settings</h3>
                        <div className="flex items-center space-x-2 mb-4">
                            <input
                                type="checkbox"
                                id="gst_enabled"
                                checked={data.gst_enabled}
                                onChange={(e) => setData({ ...data, gst_enabled: e.target.checked })}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="gst_enabled">Enable GST Billing</Label>
                        </div>

                        {data.gst_enabled && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>GST Number</Label>
                                    <Input value={data.gst_number || ''} onChange={(e) => setData({ ...data, gst_number: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>GST Percentage (%)</Label>
                                    <Input
                                        type="number"
                                        value={data.gst_percentage}
                                        onChange={(e) => setData({ ...data, gst_percentage: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h3 className="font-semibold mb-2">Printer Settings</h3>
                        <div className="grid gap-2">
                            <Label>Paper Size</Label>
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={data.printer_size}
                                onChange={(e) => setData({ ...data, printer_size: e.target.value as '58mm' | '80mm' | 'A4' })}
                            >
                                <option value="A4">A4</option>
                                <option value="80mm">80mm (Standard Thermal)</option>
                                <option value="58mm">58mm (Small Thermal)</option>
                            </select>
                        </div>
                    </div>

                    {data.printer_size === 'A4' && (
                        <div className="border-t pt-4 mt-4">
                            <h3 className="font-semibold mb-4">A4 Invoice Template</h3>
                            <p className="text-sm text-muted-foreground mb-4">Choose your preferred invoice design</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Classic Template */}
                                <div
                                    className={`border-2 rounded-lg cursor-pointer transition-all overflow-hidden ${data.invoice_template === 'classic'
                                        ? 'border-blue-500 ring-2 ring-blue-200'
                                        : 'border-slate-200 hover:border-blue-300'
                                        }`}
                                    onClick={() => setData({ ...data, invoice_template: 'classic' })}
                                >
                                    <div className="bg-blue-600 text-white p-3 text-center font-bold">
                                        INVOICE
                                    </div>
                                    <div className="p-3 bg-white">
                                        <div className="text-xs font-semibold mb-2">Classic</div>
                                        <div className="space-y-1">
                                            <div className="h-2 bg-blue-100 rounded w-3/4"></div>
                                            <div className="h-2 bg-blue-50 rounded w-1/2"></div>
                                        </div>
                                        <div className="mt-3 space-y-1">
                                            <div className="h-1.5 bg-slate-100 rounded"></div>
                                            <div className="h-1.5 bg-slate-100 rounded"></div>
                                        </div>
                                        <div className="mt-2 bg-blue-600 h-6 rounded flex items-center justify-center text-white text-xs font-bold">
                                            TOTAL
                                        </div>
                                    </div>
                                    <div className="p-2 bg-slate-50 text-center">
                                        <input
                                            type="radio"
                                            name="invoice_template"
                                            checked={data.invoice_template === 'classic'}
                                            onChange={() => setData({ ...data, invoice_template: 'classic' })}
                                            className="mr-2"
                                        />
                                        <span className="text-xs">Traditional Blue</span>
                                    </div>
                                </div>

                                {/* Modern Template */}
                                <div
                                    className={`border-2 rounded-lg cursor-pointer transition-all overflow-hidden ${data.invoice_template === 'modern'
                                        ? 'border-green-500 ring-2 ring-green-200'
                                        : 'border-slate-200 hover:border-green-300'
                                        }`}
                                    onClick={() => setData({ ...data, invoice_template: 'modern' })}
                                >
                                    <div className="h-2 bg-green-500"></div>
                                    <div className="p-3 bg-white">
                                        <div className="text-xs font-semibold mb-2 text-green-600">Modern</div>
                                        <div className="space-y-1">
                                            <div className="h-2 bg-green-100 rounded w-3/4"></div>
                                            <div className="h-2 bg-green-50 rounded w-1/2"></div>
                                        </div>
                                        <div className="mt-3 space-y-1">
                                            <div className="h-1.5 bg-slate-50 rounded"></div>
                                            <div className="h-1.5 bg-slate-100 rounded"></div>
                                            <div className="h-1.5 bg-slate-50 rounded"></div>
                                        </div>
                                        <div className="mt-2 bg-green-500 h-6 rounded flex items-center justify-center text-white text-xs font-bold">
                                            TOTAL
                                        </div>
                                    </div>
                                    <div className="p-2 bg-slate-50 text-center">
                                        <input
                                            type="radio"
                                            name="invoice_template"
                                            checked={data.invoice_template === 'modern'}
                                            onChange={() => setData({ ...data, invoice_template: 'modern' })}
                                            className="mr-2"
                                        />
                                        <span className="text-xs">Contemporary Green</span>
                                    </div>
                                </div>

                                {/* Minimal Template */}
                                <div
                                    className={`border-2 rounded-lg cursor-pointer transition-all overflow-hidden ${data.invoice_template === 'minimal'
                                        ? 'border-slate-700 ring-2 ring-slate-300'
                                        : 'border-slate-200 hover:border-slate-400'
                                        }`}
                                    onClick={() => setData({ ...data, invoice_template: 'minimal' })}
                                >
                                    <div className="p-3 bg-white border-b-2 border-black">
                                        <div className="text-xs font-bold mb-2">Minimal</div>
                                        <div className="space-y-1">
                                            <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                                            <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white">
                                        <div className="space-y-1">
                                            <div className="h-1.5 bg-slate-100 rounded"></div>
                                            <div className="h-1.5 bg-slate-100 rounded"></div>
                                            <div className="h-1.5 bg-slate-100 rounded"></div>
                                        </div>
                                        <div className="mt-2 border-t-2 border-black pt-2">
                                            <div className="h-5 bg-slate-100 rounded flex items-center justify-center text-xs font-bold">
                                                Total
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-slate-50 text-center">
                                        <input
                                            type="radio"
                                            name="invoice_template"
                                            checked={data.invoice_template === 'minimal'}
                                            onChange={() => setData({ ...data, invoice_template: 'minimal' })}
                                            className="mr-2"
                                        />
                                        <span className="text-xs">Clean & Simple</span>
                                    </div>
                                </div>

                                {/* Elegant Template */}
                                <div
                                    className={`border-2 rounded-lg cursor-pointer transition-all overflow-hidden ${data.invoice_template === 'elegant'
                                        ? 'border-purple-500 ring-2 ring-purple-200'
                                        : 'border-slate-200 hover:border-purple-300'
                                        }`}
                                    onClick={() => setData({ ...data, invoice_template: 'elegant' })}
                                >
                                    <div className="bg-purple-600 text-white p-3 text-center font-bold text-sm">
                                        INVOICE
                                    </div>
                                    <div className="p-3 bg-purple-50/30">
                                        <div className="text-xs font-semibold mb-2 text-purple-600">Elegant</div>
                                        <div className="space-y-1">
                                            <div className="h-2 bg-purple-100 rounded w-3/4"></div>
                                            <div className="h-2 bg-purple-50 rounded w-1/2"></div>
                                        </div>
                                        <div className="mt-3 space-y-1 bg-white p-2 rounded">
                                            <div className="h-1.5 bg-purple-50 rounded"></div>
                                            <div className="h-1.5 bg-purple-50 rounded"></div>
                                        </div>
                                        <div className="mt-2 bg-purple-600 h-6 rounded flex items-center justify-center text-white text-xs font-bold">
                                            TOTAL
                                        </div>
                                    </div>
                                    <div className="p-2 bg-slate-50 text-center">
                                        <input
                                            type="radio"
                                            name="invoice_template"
                                            checked={data.invoice_template === 'elegant'}
                                            onChange={() => setData({ ...data, invoice_template: 'elegant' })}
                                            className="mr-2"
                                        />
                                        <span className="text-xs">Sophisticated Purple</span>
                                    </div>
                                </div>

                                {/* Professional Template */}
                                <div
                                    className={`border-2 rounded-lg cursor-pointer transition-all overflow-hidden ${data.invoice_template === 'professional'
                                        ? 'border-slate-700 ring-2 ring-slate-300'
                                        : 'border-slate-200 hover:border-slate-400'
                                        }`}
                                    onClick={() => setData({ ...data, invoice_template: 'professional' })}
                                >
                                    <div className="bg-slate-800 text-white p-3">
                                        <div className="text-xs font-bold mb-1">Professional</div>
                                        <div className="text-[10px] text-slate-300">TAX INVOICE</div>
                                    </div>
                                    <div className="p-3 bg-white">
                                        <div className="space-y-1 mb-2">
                                            <div className="h-2 bg-slate-100 rounded w-3/4"></div>
                                            <div className="h-2 bg-slate-50 rounded w-1/2"></div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-1.5 bg-slate-100 rounded"></div>
                                            <div className="h-1.5 bg-slate-100 rounded"></div>
                                        </div>
                                        <div className="mt-2 bg-slate-800 h-6 rounded flex items-center justify-center text-white text-xs font-bold">
                                            GRAND TOTAL
                                        </div>
                                    </div>
                                    <div className="p-2 bg-slate-50 text-center">
                                        <input
                                            type="radio"
                                            name="invoice_template"
                                            checked={data.invoice_template === 'professional'}
                                            onChange={() => setData({ ...data, invoice_template: 'professional' })}
                                            className="mr-2"
                                        />
                                        <span className="text-xs">Corporate Dark</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
