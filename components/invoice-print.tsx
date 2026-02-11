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
import { useReceiptSettings } from "@/components/receipt-settings-provider";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ReceiptContent } from "./receipt-content";
import { getReceiptStyles, openReceiptPrintWindow } from "@/lib/receipt-print";

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
    if (sale) {
      const dateStr = format(new Date(sale.date), "yyMMdd");
      const shortId = sale.id.slice(0, 4);
      setReceiptNumber(`${dateStr}-${shortId}`);
    }
  }, [sale]);

  useEffect(() => {
    if (isOpen && settings?.printAutomatically) {
      const t = setTimeout(() => handlePrint(), 500);
      return () => clearTimeout(t);
    }
  }, [isOpen, settings?.printAutomatically]);

  const handlePrint = () => {
    const printableContent = invoiceRef.current?.outerHTML;
    if (!printableContent) {
      toast({
        title: "Print Error",
        description: "No content available to print.",
        variant: "destructive",
      });
      return;
    }

    // const printWindow = window.open("", "_blank");
    // if (!printWindow) {
    //   toast({
    //     title: "Print Error",
    //     description:
    //       "Could not open print window. Please check your browser settings.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    const success = openReceiptPrintWindow(
      printableContent,
      `Receipt #${receiptNumber}`,
      settings
    );

    if (!success) {
      toast({
        title: "Print Error",
        description: "Unable to prepare the print preview.",
        variant: "destructive",
      });
    }

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

    let receiptContainer: HTMLDivElement | null = null;

    try {
      setIsDownloading(true);
      toast({
        title: "Preparing PDF",
        description: "Generating a printable receipt preview...",
      });

      const originalReceipt = invoiceRef.current;
      const receiptClone = originalReceipt.cloneNode(true) as HTMLElement;

      receiptContainer = document.createElement("div");
      const measuredWidth =
        originalReceipt.getBoundingClientRect().width ||
        originalReceipt.offsetWidth ||
        originalReceipt.scrollWidth ||
        0;

      receiptContainer.style.position = "fixed";
      receiptContainer.style.left = "0";
      receiptContainer.style.top = "0";
      receiptContainer.style.width = `${measuredWidth}px`;
      receiptContainer.style.zIndex = "-1";
      receiptContainer.style.pointerEvents = "none";
      receiptContainer.style.opacity = "0";
      receiptContainer.style.backgroundColor = "#ffffff";
      receiptContainer.style.margin = "0";
      receiptContainer.style.padding = "0";

      receiptClone.style.maxHeight = "none";
      receiptClone.style.height = "auto";
      receiptClone.style.overflow = "visible";
      receiptClone.style.width = "100%";
      receiptClone.style.margin = "0 auto";

      const captureStyles = document.createElement("style");
      captureStyles.textContent = getReceiptStyles(settings, ".pdf-capture");

      receiptContainer.classList.add("pdf-capture");
      receiptContainer.appendChild(captureStyles);
      receiptContainer.appendChild(receiptClone);
      document.body.appendChild(receiptContainer);

      const canvas = await html2canvas(receiptClone, {
        scale: 2,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: -window.scrollY,
        useCORS: true,
        windowWidth: receiptClone.scrollWidth,
        windowHeight: receiptClone.scrollHeight,
      });

      const imageData = canvas.toDataURL("image/png");
      const pxToPt = (px: number) => (px * 72) / 96;
      const contentWidth = pxToPt(canvas.width);
      const contentHeight = pxToPt(canvas.height);
      const marginPx = 18;
      const margin = pxToPt(marginPx);
      const pageWidth = contentWidth + margin * 2;
      const pageHeight = contentHeight + margin * 2;
      const orientation = pageWidth > pageHeight ? "landscape" : "portrait";

      const pdf = new jsPDF({
        orientation,
        unit: "pt",
        format: [pageWidth, pageHeight],
      });

      pdf.addImage(
        imageData,
        "PNG",
        margin,
        margin,
        contentWidth,
        contentHeight,
        undefined,
        "FAST"
      );

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
      if (receiptContainer?.parentNode) {
        receiptContainer.parentNode.removeChild(receiptContainer);
      }
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
                  {formatQuantityWithLabel(
                    item.product as Product,
                    item.quantity
                  )}
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
      logoSize = 100,
      showLogo = true,
      thankYouMessage,
      returnPolicy,
      footerText,
      headerText,
      showTax = true,
      taxRate = 10,
      currencySymbol = "$",
      showBarcode = false,
      showInstagramQr = false,
      instagramUrl,
    } = settings || {};

    const subtotal = sale.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const tax = showTax ? subtotal * (taxRate / 100) : 0;
    const total = subtotal + tax;

    const receiptItems = sale.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      quantityDisplay: formatQuantityWithLabel(
        item.product as Product,
        item.quantity
      ),
      price: item.product.price,
      total: item.product.price * item.quantity,
    }));

    const receiptData = {
      showLogo,
      storeLogo,
      storeName,
      fontSize,
      logoSize,
      headerText,
      storeAddress,
      storePhone,
      storeEmail,
      storeWebsite,
      currencySymbol,
      showTax,
      taxRate,
      thankYouMessage,
      returnPolicy,
      footerText,
      showBarcode,
      showInstagramQr,
      instagramUrl,
    };

    const meta = {
      date: format(new Date(sale.date), "MMM dd, yyyy"),
      time: format(new Date(sale.date), "hh:mm a"),
      customerName: sale.customerName || "Walk-in Customer",
      paymentMethod:
        sale.paymentMethod === "credit"
          ? "Credit Card"
          : sale.paymentMethod === "cash"
          ? "Cash"
          : "Mobile Payment",
    };

    return (
      <div
        ref={invoiceRef}
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          width: `${receiptWidth}px`,
          margin: "0 auto",
        }}
        className="receipt-preview"
      >
        <ReceiptContent
          data={receiptData}
          item={receiptItems}
          receiptId={receiptNumber}
          subtotal={subtotal}
          tax={tax}
          total={total}
          meta={meta}
        />
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
          <div className="flex-1 overflow-auto">{renderOriginalTable()}</div>

          <div className="flex-1 overflow-auto flex justify-center">
            {renderReceiptPreview()}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 no-print">
          <Button variant="outline" onClick={handleShare} disabled>
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
