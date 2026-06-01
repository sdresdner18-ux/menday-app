import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function prepareInvoiceClone(element: HTMLElement) {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.background = "#ffffff";
  clone.style.color = "#111827";
  clone.style.width = `${element.offsetWidth}px`;
  clone.style.position = "fixed";
  clone.style.left = "-10000px";
  clone.style.top = "0";
  clone.style.boxShadow = "none";
  clone.style.border = "1px solid #e5e7eb";

  document.body.appendChild(clone);
  return clone;
}

export async function generateInvoicePdf(
  element: HTMLElement
): Promise<Blob> {
  const clone = prepareInvoiceClone(element);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 0.92);

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output("blob");
  } finally {
    document.body.removeChild(clone);
  }
}

export function downloadPdfBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function sharePdfBlob(blob: Blob, filename: string, title: string) {
  const file = new File([blob], filename, { type: "application/pdf" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title,
      text: title,
    });
    return true;
  }

  return false;
}

export function invoiceFilename(invoiceNumber: string) {
  return `Mendy-Invoice-${invoiceNumber}.pdf`;
}
