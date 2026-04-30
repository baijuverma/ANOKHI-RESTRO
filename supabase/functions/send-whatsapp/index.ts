
// Follow this guide to deploy the Edge Function:
// 1. Install Supabase CLI
// 2. Run `supabase functions new send-whatsapp`
// 3. Paste this code into `supabase/functions/send-whatsapp/index.ts`
// 4. Run `supabase functions deploy send-whatsapp --no-verify-jwt`
// 5. Set secrets: `supabase secrets set WHATSAPP_ACCESS_TOKEN=... WHATSAPP_PHONE_NUMBER_ID=...`

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;

serve(async (req) => {
    try {
        const { phone, pdfUrl, customerName, restaurantName, totalAmount } = await req.json();

        if (!phone) {
            return new Response(JSON.stringify({ error: 'Phone number is required' }), { status: 400 });
        }

        // Format phone number (ensure country code, default to 91 for India)
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.length === 10) formattedPhone = '91' + formattedPhone;

        // Send Message with Document
        // Needs a template setup in Meta or use direct message if within 24h window (but utility templates are safer)
        // For simplicity, we'll send a text message with the link, or attempt to send a media message.
        // Note: To send a media message (PDF), you usually need to upload it first to WhatsApp Media API to get an ID.
        // However, sending a link is reliability easiest without complex setup.
        // If you want to send the actual file, you need to use the "document" type.

        // Sending as a document link (if using template) or direct document message
        const response = await fetch(
            `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: formattedPhone,
                    type: "template",
                    template: {
                        name: "bill_notification", // You must create this template in Meta Dashboard
                        language: { code: "en" },
                        components: [
                            {
                                type: "header",
                                parameters: [
                                    {
                                        type: "document",
                                        document: {
                                            link: pdfUrl,
                                            filename: "Bill.pdf"
                                        }
                                    }
                                ]
                            },
                            {
                                type: "body",
                                parameters: [
                                    { type: "text", text: customerName || "Customer" },
                                    { type: "text", text: restaurantName },
                                    { type: "text", text: totalAmount }
                                ]
                            }
                        ]
                    }
                }),
            }
        );

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
