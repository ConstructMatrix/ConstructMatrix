import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
} from "docx";
import type { ChecklistResponseValue, ChecklistSectionConfig } from "@/lib/types";
import type { ChecklistPdfProps } from "@/lib/pdf";

const responseLabel = (v: ChecklistResponseValue) =>
  v === "yes" ? "Yes" : v === "no" ? "No" : v === "na" ? "N/A" : "—";

function cell(text: string, width: number) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph(text)],
  });
}

export async function renderChecklistDocx(
  props: ChecklistPdfProps & { signatureBuffer?: Buffer },
): Promise<Buffer> {
  const { projectName, workerName, company, submittedAt, sections, responses } = props;

  const children: (Paragraph | Table)[] = [
    new Paragraph({ text: "Construction Site Checklist", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: `${projectName} — Submitted ${new Date(submittedAt).toLocaleString()}` }),
    new Paragraph({ text: `Worker's Name: ${workerName}` }),
    new Paragraph({ text: `Company: ${company}` }),
    new Paragraph({ text: "" }),
  ];

  for (const section of sections as ChecklistSectionConfig[]) {
    children.push(new Paragraph({ text: section.section_name, heading: HeadingLevel.HEADING_2 }));
    const rows = section.items.map((item, index) => {
      const key = `${section.id}:${index}`;
      return new TableRow({
        children: [
          cell(`${index + 1}. ${item.text}${item.required ? " (required)" : ""}`, 75),
          cell(responseLabel(responses[key] ?? null), 25),
        ],
      });
    });
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
  }

  children.push(new Paragraph({ text: "" }));
  children.push(new Paragraph({ text: "Worker's Signature:" }));
  if (props.signatureBuffer) {
    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: props.signatureBuffer,
            transformation: { width: 220, height: 60 },
            type: "png",
          }),
        ],
      }),
    );
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}