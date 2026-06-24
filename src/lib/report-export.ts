import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ReportPayload = {
  title: string;
  generatedLabel: string;
  rangeLabel: string;
  filtersLabel: string;
  kpi: { label: string; value: string; hint?: string }[];
  sections: { title: string; head: string[]; rows: (string | number)[][] }[];
};

function csvEscape(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportReportCSV(payload: ReportPayload, filename: string) {
  const lines: string[] = [];
  lines.push(csvEscape(payload.title));
  lines.push(`${csvEscape(payload.generatedLabel)}`);
  lines.push(`${csvEscape(payload.rangeLabel)}`);
  lines.push(`${csvEscape(payload.filtersLabel)}`);
  lines.push("");
  lines.push(["Metric", "Value", "Hint"].map(csvEscape).join(","));
  for (const k of payload.kpi)
    lines.push([k.label, k.value, k.hint ?? ""].map(csvEscape).join(","));
  for (const s of payload.sections) {
    lines.push("");
    lines.push(csvEscape(s.title));
    lines.push(s.head.map(csvEscape).join(","));
    for (const r of s.rows) lines.push(r.map(csvEscape).join(","));
  }
  download(filename, new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
}

export function exportReportPDF(payload: ReportPayload, filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(payload.title, 40, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(payload.generatedLabel, 40, y);
  y += 14;
  doc.text(payload.rangeLabel, 40, y);
  y += 14;
  doc.text(payload.filtersLabel, 40, y);
  y += 8;
  doc.setTextColor(0);

  autoTable(doc, {
    startY: y + 8,
    head: [["Metric", "Value", "Hint"]],
    body: payload.kpi.map((k) => [k.label, k.value, k.hint ?? ""]),
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    margin: { left: 40, right: 40 },
    tableWidth: W - 80,
  });

  for (const s of payload.sections) {
    const prev = (doc as any).lastAutoTable?.finalY ?? y;
    const titleY = prev + 28;
    if (titleY > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
    }
    const ty =
      (doc as any).lastAutoTable?.finalY && titleY <= doc.internal.pageSize.getHeight() - 60
        ? titleY
        : 48;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(s.title, 40, ty);
    autoTable(doc, {
      startY: ty + 8,
      head: [s.head],
      body: s.rows.map((r) => r.map((c) => String(c))),
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [34, 211, 238], textColor: 15 },
      margin: { left: 40, right: 40 },
      tableWidth: W - 80,
    });
  }

  doc.save(filename);
}
