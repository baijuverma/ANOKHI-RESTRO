
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";

export default async function PrintBillPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (*)
    `)
    .eq("id", params.id)
    .single();

  if (!order) {
    notFound();
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", order.restaurant_id)
    .single();

  const printerWidth = restaurant?.printer_size || '80mm';

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @page {
            margin: 0;
            size: auto; 
          }
          .print-bill-container {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            width: ${printerWidth};
            margin: 0 auto;
            padding: 10px;
            background: white;
            color: black;
          }
          .print-header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px dashed black;
            padding-bottom: 5px;
          }
          .print-header h1 {
            font-size: 16px;
            margin: 0;
            text-transform: uppercase;
          }
          .print-header p {
            margin: 2px 0;
          }
          .print-bill-details {
            margin-bottom: 10px;
            border-bottom: 1px dashed black;
            padding-bottom: 5px;
          }
          .print-items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }
          .print-items-table th {
            text-align: left;
            border-bottom: 1px solid black;
          }
          .print-items-table td {
            text-align: left;
            padding: 2px 0;
          }
          .print-items-table .qty {
            width: 30px;
          }
          .print-items-table .price {
            text-align: right;
          }
          .print-totals {
            margin-top: 10px;
            border-top: 1px dashed black;
            padding-top: 5px;
          }
          .print-totals .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .print-totals .total-row {
            font-weight: bold;
            font-size: 14px;
            margin-top: 5px;
            border-top: 1px solid black;
            padding-top: 5px;
          }
          .print-footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
          }
          @media print {
            body * { visibility: hidden; }
            .print-bill-container, .print-bill-container * { visibility: visible; }
            .print-bill-container { position: absolute; left: 0; top: 0; }
            .no-print { display: none !important; }
          }
        `}} />
      <div className="print-bill-container">
        <div className="print-header">
          <h1>{restaurant?.name}</h1>
          <p>{restaurant?.address}</p>
          <p>Phone: {restaurant?.phone}</p>
          {restaurant?.gst_number && <p>GSTIN: {restaurant?.gst_number}</p>}
        </div>

        <div className="print-bill-details">
          <p>Bill No: {order.bill_number}</p>
          <p>Date: {formatDate(order.created_at)}</p>
          {order.customer_name && <p>Customer: {order.customer_name}</p>}
        </div>

        <table className="print-items-table">
          <thead>
            <tr>
              <th className="qty">Qty</th>
              <th>Item</th>
              <th className="price">Price</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item: any) => (
              <tr key={item.id}>
                <td className="qty">{item.quantity}</td>
                <td>{item.item_name}</td>
                <td className="price">{formatCurrency(item.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="print-totals">
          <div className="row">
            <span>Subtotal:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.gst_enabled && (
            <div className="row">
              <span>GST ({restaurant?.gst_percentage}%):</span>
              <span>{formatCurrency(order.gst_amount)}</span>
            </div>
          )}
          <div className="row total-row">
            <span>Total:</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        <div className="print-footer">
          <p>Thank you for visiting!</p>
          <p>Powered by Billing Tool</p>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `window.onload = function() { window.print(); }` }} />
    </>
  );
}

