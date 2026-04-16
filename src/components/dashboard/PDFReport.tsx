import React from "react";
import jsPDF from "jspdf";
import { Sale, SalesSummary } from "../../hooks/useAccountingAPI";

export const generatePDFReport = async (
  summary: SalesSummary,
  sales: Sale[],
  filterInfo: string = "All Time",
  chartImageData?: string
) => {
  try {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 10;
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;

    // Helper functions
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      pdf.text(text, x, y, options);
    };

    const addSection = (title: string) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 10;
      }
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(255, 161, 7); // #2D6A4F
      addText(title, margin, yPosition);
      yPosition += 8;
      pdf.setDrawColor(255, 161, 7);
      pdf.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
      yPosition += 5;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
    };

    const addLine = (text: string, x: number = margin) => {
      if (yPosition > pageHeight - 10) {
        pdf.addPage();
        yPosition = 10;
      }
      pdf.setFontSize(10);
      pdf.text(text, x, yPosition);
      yPosition += 5;
    };

    // Header
    pdf.setFillColor(255, 161, 7);
    pdf.rect(0, 0, pageWidth, 15, "F");

    pdf.setFontSize(18);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(17, 17, 17);
    addText("🥚 NaijaBasket", margin, 8);

    pdf.setFontSize(10);
    pdf.setFont(undefined, "normal");
    addText("Sales Accounting Report", margin, 13);

    yPosition = 20;

    // Report Info
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(9);
    addText(`Report Period: ${filterInfo}`, margin, yPosition);
    yPosition += 4;
    addText(`Generated: ${new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`, margin, yPosition);
    yPosition += 8;

    // KPI Summary Section
    addSection("📊 Key Performance Indicators");

    // KPI Cards
    const cardHeight = 15;
    const cardWidth = (contentWidth - 6) / 2;
    const kpiData = [
      { label: "Total Revenue", value: `₦${summary.total_revenue.toLocaleString()}` },
      { label: "Total Transactions", value: String(summary.total_transactions) },
      { label: "Units Sold", value: String(summary.total_units_sold) },
      { label: "Avg Order Value", value: `₦${Math.round(summary.average_order_value).toLocaleString()}` },
    ];

    for (let i = 0; i < kpiData.length; i++) {
      const xPos = margin + (i % 2) * (cardWidth + 3);
      const yPos = yPosition + Math.floor(i / 2) * (cardHeight + 3);

      pdf.setFillColor(242, 242, 242);
      pdf.rect(xPos, yPos, cardWidth, cardHeight, "F");
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(xPos, yPos, cardWidth, cardHeight);

      pdf.setFontSize(9);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(255, 161, 7);
      addText(kpiData[i].label, xPos + 2, yPos + 5);

      pdf.setFontSize(11);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(0, 0, 0);
      addText(kpiData[i].value, xPos + 2, yPos + 11);
    }

    yPosition += 40;

    // Chart Section (if provided)
    if (chartImageData) {
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 10;
      }
      addSection("📈 Revenue Trend Chart");
      try {
        const imgHeight = 50;
        const imgWidth = contentWidth;
        pdf.addImage(chartImageData, "PNG", margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      } catch (error) {
        console.error("Failed to add chart image:", error);
      }
    }

    // Sales Table
    if (sales.length > 0) {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 10;
      }
      addSection("💳 Sales Transactions");

      const tableColumns = ["Invoice", "Customer", "Product", "Qty", "Total", "Status"];
      const tableData = sales.slice(0, 20).map((sale) => [
        sale.invoice_number,
        sale.customer_name || "N/A",
        sale.product_name.substring(0, 15),
        String(sale.quantity),
        `₦${sale.total_amount.toLocaleString()}`,
        sale.payment_status,
      ]);

      // Simple table rendering
      const colWidths = [25, 25, 20, 12, 25, 18];
      const rowHeight = 6;
      const startX = margin;
      let currentX = startX;

      // Header row
      pdf.setFillColor(255, 161, 7);
      pdf.setTextColor(17, 17, 17);
      pdf.setFont(undefined, "bold");
      pdf.setFontSize(8);

      let headerX = startX;
      tableColumns.forEach((col, i) => {
        pdf.text(col, headerX + 1, yPosition + 3);
        pdf.rect(headerX, yPosition - 2, colWidths[i], rowHeight);
        headerX += colWidths[i];
      });

      yPosition += rowHeight;

      // Data rows
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, "normal");
      pdf.setFontSize(7);

      tableData.forEach((row, idx) => {
        if (yPosition > pageHeight - 10) {
          pdf.addPage();
          yPosition = 10;
        }

        const bgColor = idx % 2 === 0 ? 245 : 255;
        pdf.setFillColor(bgColor, bgColor, bgColor);

        let cellX = startX;
        row.forEach((cell, i) => {
          pdf.rect(cellX, yPosition - 2, colWidths[i], rowHeight, "F");
          pdf.rect(cellX, yPosition - 2, colWidths[i], rowHeight);
          pdf.text(cell.substring(0, 12), cellX + 1, yPosition + 2);
          cellX += colWidths[i];
        });

        yPosition += rowHeight;
      });

      if (sales.length > 20) {
        yPosition += 5;
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        addLine(`... and ${sales.length - 20} more transactions`);
      }
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    const footerY = pageHeight - 5;
    pdf.text("NaijaBasket Accounting System • Audit-Ready Report", margin, footerY);

    // Save
    const filename = `sales-report-${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF report:", error);
    alert("Failed to generate PDF report. Please try again.");
  }
};

interface PDFReportButtonProps {
  summary: SalesSummary | null;
  sales: Sale[];
  loading: boolean;
  filterInfo?: string;
  chartImageData?: string;
}

export const PDFReportButton: React.FC<PDFReportButtonProps> = ({
  summary,
  sales,
  loading,
  filterInfo = "All Time",
  chartImageData,
}) => {
  const handleDownloadReport = async () => {
    if (!summary) {
      alert("No summary data available");
      return;
    }
    await generatePDFReport(summary, sales, filterInfo, chartImageData);
  };

  return (
    <button
      onClick={handleDownloadReport}
      disabled={loading || !summary}
      style={{
        background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "10px 20px",
        fontWeight: 700,
        fontSize: 13,
        cursor: loading || !summary ? "not-allowed" : "pointer",
        opacity: loading || !summary ? 0.5 : 1,
        transition: "all 0.3s ease",
      }}
    >
      {loading ? "Loading..." : "📥 Download Report (PDF)"}
    </button>
  );
};
