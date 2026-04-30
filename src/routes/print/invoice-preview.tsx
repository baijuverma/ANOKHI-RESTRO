import { Show } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import SimpleTemplate from "@/components/templates/simple";
import PremiumTemplate from "@/components/templates/premium";
import Template01 from "@/components/templates/template-01";
import Template02 from "@/components/templates/template-02";
import Template03 from "@/components/templates/template-03";
import Template04 from "@/components/templates/template-04";
import Template05 from "@/components/templates/template-05";
import Template06 from "@/components/templates/template-06";
import Template07 from "@/components/templates/template-07";
import ThermalInvoice from "@/components/templates/thermal-invoice";
import ProfessionalInvoice from "@/components/templates/professional-invoice";
import GSTInvoice from "@/components/templates/gst-invoice";

export default function InvoicePreviewPage() {
    const [searchParams] = useSearchParams();
    const template = searchParams.template || "simple";

    return (
        <div class="min-h-screen bg-slate-50 p-4">
            <div class="max-w-4xl mx-auto">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h1 class="text-2xl font-bold text-slate-800">Invoice Template Preview</h1>
                        <div class="text-sm text-slate-500">Template: <span class="font-bold text-primary">{template}</span></div>
                    </div>

                    <Show when={template === "simple"}>
                        <div class="flex justify-center">
                            <SimpleTemplate />
                        </div>
                    </Show>

                    <Show when={template === "premium"}>
                        <div class="flex justify-center">
                            <PremiumTemplate />
                        </div>
                    </Show>

                    <Show when={template === "template-01"}>
                        <div class="flex justify-center">
                            <Template01 />
                        </div>
                    </Show>

                    <Show when={template === "template-02"}>
                        <div class="flex justify-center">
                            <Template02 />
                        </div>
                    </Show>

                    <Show when={template === "template-03"}>
                        <div class="flex justify-center">
                            <Template03 />
                        </div>
                    </Show>

                    <Show when={template === "template-04"}>
                        <div class="flex justify-center">
                            <Template04 />
                        </div>
                    </Show>

                    <Show when={template === "template-05"}>
                        <div class="flex justify-center">
                            <Template05 />
                        </div>
                    </Show>

                    <Show when={template === "template-06"}>
                        <div class="flex justify-center">
                            <Template06 />
                        </div>
                    </Show>

                    <Show when={template === "template-07"}>
                        <div class="flex justify-center">
                            <Template07 />
                        </div>
                    </Show>

                    <Show when={template === "thermal-invoice"}>
                        <div class="flex justify-center">
                            <ThermalInvoice />
                        </div>
                    </Show>

                    <Show when={template === "professional-invoice"}>
                        <div class="flex justify-center">
                            <ProfessionalInvoice />
                        </div>
                    </Show>

                    <Show when={template === "gst-invoice"}>
                        <div class="flex justify-center">
                            <GSTInvoice />
                        </div>
                    </Show>

                    <div class="mt-6 text-center">
                        <button 
                            onclick={() => window.close()} 
                            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Close Preview
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
