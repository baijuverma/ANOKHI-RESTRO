
"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { OrdersReportPDF } from "./OrdersReportPDF";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import React from "react";

interface DownloadReportButtonProps {
    orders: any[];
    fromDate?: string;
    toDate?: string;
}

export default function DownloadReportButton({ orders, fromDate, toDate }: DownloadReportButtonProps) {
    if (!orders || orders.length === 0) {
        return <Button disabled variant="outline" className="w-[180px]">No Data to Export</Button>;
    }

    return (
        <PDFDownloadLink
            document={<OrdersReportPDF orders={orders} fromDate={fromDate} toDate={toDate} />}
            fileName="orders-report.pdf"
        >
            {({ blob, url, loading, error }) =>
                loading ? (
                    <Button disabled variant="outline" className="w-[180px]">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating PDF...
                    </Button>
                ) : (
                    <Button variant="outline" className="w-[180px] bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF Report
                    </Button>
                )
            }
        </PDFDownloadLink>
    );
}
