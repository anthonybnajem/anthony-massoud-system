"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, Download, Share2 } from "lucide-react";
import { format } from "date-fns";
import type { Sale } from "./pos-data-provider";
import type { Product } from "@/lib/db";
import { formatQuantityWithLabel } from "@/lib/product-measurements";
import { useToast } from "@/components/ui/use-toast";
import {
  ReceiptSettingsProvider,
  useReceiptSettings,
} from "@/components/receipt-settings-provider";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
interface InvoicePrintProps {
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoicePrint({ sale, isOpen, onClose }: InvoicePrintProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { settings } = useReceiptSettings();
  const [receiptNumber, setReceiptNumber] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Generate a receipt number based on the sale ID and date
    if (sale) {
      const dateStr = format(new Date(sale.date), "yyMMdd");
      const shortId = sale.id.slice(0, 4);
      setReceiptNumber(`${dateStr}-${shortId}`);
    }
  }, [sale]);

  // Auto-print if settings specify
  useEffect(() => {
    if (isOpen && settings?.printAutomatically) {
      setTimeout(() => {
        handlePrint();
      }, 500);
    }
  }, [isOpen, settings?.printAutomatically]);

  const buildPrintStyles = () => {
    const {
      fontFamily = "Arial",
      fontSize = 12,
      receiptWidth = 300,
    } = settings || {};

    return `
      * {
        box-sizing: border-box;
      }
      body {
        font-family: ${fontFamily}, sans-serif;
        font-size: ${fontSize}px;
        background: #ffffff;
        padding: 24px;
      }
      .receipt-preview {
        width: ${receiptWidth}px;
        margin: 0 auto;
        padding: 0;
      }
      .receipt-header {
        text-align: center;
        margin-bottom: 16px;
      }
      .receipt-header h2 {
        margin: 8px 0;
        font-size: ${fontSize * 1.5}px;
      }
      .receipt-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        font-size: ${fontSize * 0.9}px;
      }
      .receipt-grid .text-right {
        text-align: right;
      }
      .receipt-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 16px;
        font-size: ${fontSize}px;
      }
      .receipt-table th {
        text-align: left;
        font-weight: 600;
        padding: 8px;
        border-bottom: 1px solid #e5e7eb;
      }
      .receipt-table td {
        padding: 8px;
        border-bottom: 1px dashed #e5e7eb;
      }
      .receipt-table th:last-child,
      .receipt-table td:last-child {
        text-align: right;
      }
      .receipt-summary {
        margin-top: 16px;
        border-top: 1px solid #e5e7eb;
        padding-top: 12px;
        font-size: ${fontSize}px;
      }
      .receipt-summary .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
      }
      .receipt-summary .total-row {
        font-size: ${fontSize * 1.2}px;
        font-weight: 600;
        margin-top: 12px;
      }
      .receipt-footer {
        text-align: center;
        margin-top: 24px;
        color: #4b5563;
        font-size: ${fontSize * 0.85}px;
      }
      .text-muted-foreground {
        color: #6b7280;
      }
      .font-medium {
        font-weight: 500;
      }
      .text-right {
        text-align: right;
      }
      .text-center {
        text-align: center;
      }
      .text-sm {
        font-size: ${fontSize * 0.9}px;
      }
      .text-xs {
        font-size: ${fontSize * 0.8}px;
      }
      img {
        max-width: 120px;
        display: block;
        margin: 0 auto 8px;
      }
      @media print {
        body {
          padding: 0;
        }
        @page {
          size: auto;
          margin: 10mm;
        }
      }
    `;
  };

  const handlePrint = () => {
    const printContent = invoiceRef.current?.outerHTML; // Ensure outerHTML is used to capture the full receipt content
    if (!printContent) {
      toast({
        title: "Print Error",
        description: "No content available to print.",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Print Error",
        description:
          "Could not open print window. Please check your browser settings.",
        variant: "destructive",
      });
      return;
    }

    const printStyles = buildPrintStyles();
    const printableContent = invoiceRef.current?.outerHTML;
    if (!printableContent) {
      toast({
        title: "Print Error",
        description: "No content available to print.",
        variant: "destructive",
      });
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt #${receiptNumber}</title>
          <style>${printStyles}</style>
        </head>
        <body>
          ${printableContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    toast({
      title: "Receipt Printed",
      description: "The receipt has been sent to the printer.",
    });
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) {
      toast({
        title: "Download Failed",
        description: "No receipt content available to download.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDownloading(true);
      toast({
        title: "Preparing PDF",
        description: "Generating a printable receipt preview...",
      });

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 32;
      const renderWidth = pageWidth - margin * 2;
      const renderHeight = (canvas.height * renderWidth) / canvas.width;

      let heightLeft = renderHeight;
      let position = margin;

      pdf.addImage(
        imageData,
        "PNG",
        margin,
        position,
        renderWidth,
        renderHeight
      );

      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - heightLeft;
        pdf.addImage(
          imageData,
          "PNG",
          margin,
          position,
          renderWidth,
          renderHeight
        );
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save(`receipt-${receiptNumber || "download"}.pdf`);
      toast({
        title: "Download Ready",
        description: "Your receipt PDF has been saved.",
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast({
        title: "Download Failed",
        description: "Unable to generate the receipt PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt #${receiptNumber}`,
          text: `Receipt for purchase on ${format(
            new Date(sale.date),
            "MMM dd, yyyy"
          )}`,
          // In a real implementation, this would be a URL to a shareable receipt
          url: window.location.href,
        });
        toast({
          title: "Receipt Shared",
          description: "The receipt has been shared successfully.",
        });
      } catch (error) {
        console.error("Error sharing:", error);
        toast({
          title: "Share Failed",
          description: "Failed to share the receipt.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Share Not Supported",
        description: "Your browser does not support the Web Share API.",
        variant: "destructive",
      });
    }
  };

  const renderOriginalTable = () => {
    const subtotal = sale.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const taxRate = settings?.taxRate || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    return (
      <div className="p-4 border rounded-lg bg-white shadow-md">
        <h3 className="text-lg font-bold mb-4">Original Receipt Table</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Item</th>
              <th className="text-center py-2">Qty</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="py-2">{item.product.name}</td>
                <td className="text-center py-2">
                  {formatQuantityWithLabel(item.product as Product, item.quantity)}
                </td>
                <td className="text-right py-2">
                  {settings?.currencySymbol || "$"}
                  {item.product.price.toFixed(2)}
                </td>
                <td className="text-right py-2">
                  {settings?.currencySymbol || "$"}
                  {(item.product.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>
              {settings?.currencySymbol || "$"}
              {subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({taxRate}%):</span>
            <span>
              {settings?.currencySymbol || "$"}
              {tax.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span>
              {settings?.currencySymbol || "$"}
              {total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderReceiptPreview = () => {
    const {
      fontFamily = "Arial",
      fontSize = 12,
      receiptWidth = 300,
      storeName = "Carnico",
      storeAddress,
      storePhone,
      storeEmail,
      storeWebsite,
      storeLogo,
      showLogo = true,
      thankYouMessage,
      returnPolicy,
      footerText,
      headerText,
      showTax = true,
      taxRate = 10,
      currencySymbol = "$",
    } = settings || {};

    const subtotal = sale.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const tax = showTax ? subtotal * (taxRate / 100) : 0;
    const total = subtotal + tax;

    return (
      <div
        ref={invoiceRef}
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          width: `${receiptWidth}px`,
          margin: "0 auto",
        }}
        className="receipt-preview space-y-4"
      >
        <div className="receipt-header text-center">
          {showLogo && storeLogo && (
            <img
              src={storeLogo || "/placeholder.svg"}
              alt="Store Logo"
              className="receipt-logo mb-2"
              style={{ maxWidth: "100px", maxHeight: "100px" }}
            />
          )}
          <h2 className="text-2xl font-bold">{storeName}</h2>
          {storeAddress && <p>{storeAddress}</p>}
          {storePhone && <p>Phone: {storePhone}</p>}
          {storeEmail && <p>Email: {storeEmail}</p>}
          {storeWebsite && <p>Web: {storeWebsite}</p>}
          {headerText && <p>{headerText}</p>}
        </div>

        <div className="receipt-info my-4">
          <div className="receipt-grid grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="font-medium">Receipt #: {receiptNumber}</p>
              <p>Date: {format(new Date(sale.date), "MMM dd, yyyy")}</p>
              <p>Time: {format(new Date(sale.date), "hh:mm a")}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">Customer:</p>
              <p>{sale.customerName || "Walk-in Customer"}</p>
              <p>
                Payment Method:{" "}
                {sale.paymentMethod === "credit"
                  ? "Credit Card"
                  : sale.paymentMethod === "cash"
                  ? "Cash"
                  : "Mobile Payment"}
              </p>
            </div>
          </div>
        </div>

        <div className="receipt-summary my-4 border-t border-b py-2">
          <table className="receipt-table receipt-items w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Item</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => (
                <tr key={index} className="border-b border-dashed">
                  <td className="py-2">{item.product.name}</td>
                  <td className="text-center py-2">
                    {formatQuantityWithLabel(
                      item.product as Product,
                      item.quantity
                    )}
                  </td>
                  <td className="text-right py-2">
                    {currencySymbol}
                    {item.product.price.toFixed(2)}
                  </td>
                  <td className="text-right py-2">
                    {currencySymbol}
                    {(item.product.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="receipt-summary text-sm space-y-1">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>
              {currencySymbol}
              {subtotal.toFixed(2)}
            </span>
          </div>

          {showTax && (
            <div className="summary-row">
              <span>Tax ({taxRate}%):</span>
              <span>
                {currencySymbol}
                {tax.toFixed(2)}
              </span>
            </div>
          )}

          <div className="summary-row total-row font-bold text-base pt-1">
            <span>Total:</span>
            <span>
              {currencySymbol}
              {total.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="receipt-footer text-center text-sm mt-8">
          {thankYouMessage && <p>{thankYouMessage}</p>}
          {returnPolicy && <p className="text-xs mt-1">{returnPolicy}</p>}
          {footerText && <p className="text-xs mt-2">{footerText}</p>}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Receipt #{receiptNumber}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mt-4">
          {/* Left Side: Original Receipt Table */}
          <div className="flex-1 overflow-auto">{renderOriginalTable()}</div>

          {/* Right Side: Receipt Preview */}
          <div className="flex-1 overflow-auto">{renderReceiptPreview()}</div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? "Preparing..." : "Download PDF"}
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
