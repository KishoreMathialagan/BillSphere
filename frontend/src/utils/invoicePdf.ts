import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateInvoicePDF = (invoiceData: any, customer: any, tenant: any) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.text(tenant?.name || 'BillSphere Tenant', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Invoice No: ${invoiceData.invoice_number}`, 14, 30);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 35);
  doc.text(`Status: ${invoiceData.status}`, 14, 40);

  // Bill To
  if (customer) {
    doc.setFontSize(12);
    doc.text('Bill To:', 120, 22);
    doc.setFontSize(10);
    doc.text(`Name: ${customer.name}`, 120, 28);
    if (customer.phone) doc.text(`Phone: ${customer.phone}`, 120, 33);
    if (customer.gst_number) doc.text(`GSTIN: ${customer.gst_number}`, 120, 38);
  } else {
    doc.setFontSize(12);
    doc.text('Walk-In Customer', 120, 22);
  }

  // Table
  const tableColumn = ["Item", "Qty", "Unit Price", "Discount", "Tax", "Subtotal"];
  const tableRows: any[] = [];

  invoiceData.items.forEach((item: any) => {
    const row = [
      item.product_name,
      item.quantity,
      `$${item.unit_price.toFixed(2)}`,
      `$${item.discount_amount.toFixed(2)}`,
      `$${item.tax_amount.toFixed(2)}`,
      `$${item.subtotal.toFixed(2)}`
    ];
    tableRows.push(row);
  });

  (doc as any).autoTable({
    startY: 50,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 50;

  // Totals
  doc.setFontSize(11);
  doc.text(`Total Tax: $${invoiceData.total_tax.toFixed(2)}`, 140, finalY + 10);
  doc.text(`Total Discount: $${invoiceData.total_discount.toFixed(2)}`, 140, finalY + 16);
  doc.setFontSize(14);
  doc.text(`Grand Total: $${invoiceData.total_amount.toFixed(2)}`, 140, finalY + 26);
  
  doc.save(`Invoice_${invoiceData.invoice_number}.pdf`);
};
