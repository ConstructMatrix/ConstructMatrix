import React from "react";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { ChecklistResponseValue, ChecklistSectionConfig } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 16 },
  headerGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, borderBottom: 1, borderColor: "#ddd", paddingBottom: 8 },
  headerField: { width: "33%", marginBottom: 6 },
  headerLabel: { fontSize: 8, color: "#888", textTransform: "uppercase" },
  headerValue: { fontSize: 11 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 6, backgroundColor: "#f5f5f5", padding: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottom: 0.5, borderColor: "#eee" },
  itemText: { width: "75%" },
  itemResponse: { width: "20%", textAlign: "right", textTransform: "uppercase" },
  sigBlock: { marginTop: 24 },
  sigLabel: { fontSize: 8, color: "#888", marginBottom: 4 },
  sigImage: { width: 220, height: 60, borderBottom: 1, borderColor: "#333" },
});

const responseLabel = (v: ChecklistResponseValue) => (v === "yes" ? "Yes" : v === "no" ? "No" : v === "na" ? "N/A" : "—");

export interface ChecklistPdfProps {
  projectName: string;
  workerName: string;
  company: string;
  email: string;
  submittedAt: string;
  sections: ChecklistSectionConfig[];
  responses: Record<string, ChecklistResponseValue>;
  signatureDataUrl: string;
}

function ChecklistPdfDocument(props: ChecklistPdfProps) {
  const { projectName, workerName, company, email, submittedAt, sections, responses, signatureDataUrl } = props;
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Construction Site Checklist</Text>
        <Text style={styles.subtitle}>{projectName} · Submitted {new Date(submittedAt).toLocaleString()}</Text>

        <View style={styles.headerGrid}>
          <View style={styles.headerField}><Text style={styles.headerLabel}>Worker&apos;s Name</Text><Text style={styles.headerValue}>{workerName}</Text></View>
          <View style={styles.headerField}><Text style={styles.headerLabel}>Company</Text><Text style={styles.headerValue}>{company}</Text></View>
          <View style={styles.headerField}><Text style={styles.headerLabel}>Email</Text><Text style={styles.headerValue}>{email || "—"}</Text></View>
          <View style={styles.headerField}><Text style={styles.headerLabel}>Date</Text><Text style={styles.headerValue}>{new Date(submittedAt).toLocaleDateString()}</Text></View>
        </View>
        {/* ...rest unchanged */}

        {sections.map((section) => (
          <View key={section.id} wrap={false}>
            <Text style={styles.sectionTitle}>{section.section_name}</Text>
            {section.items.map((item, index) => {
              const key = `${section.id}:${index}`;
              return (
                <View style={styles.row} key={key}>
                  <Text style={styles.itemText}>{index + 1}. {item.text}{item.required ? " (required)" : ""}</Text>
                  <Text style={styles.itemResponse}>{responseLabel(responses[key] ?? null)}</Text>
                </View>
              );
            })}
          </View>
        ))}

        <View style={styles.sigBlock}>
          <Text style={styles.sigLabel}>Worker&apos;s Signature</Text>
          {signatureDataUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- this is @react-pdf/renderer's Image, not an <img>
            <Image src={signatureDataUrl} style={styles.sigImage} />
          ) : null}a
        </View>
      </Page>
    </Document>
  );
}

export async function renderChecklistPdf(props: ChecklistPdfProps): Promise<Buffer> {
  return renderToBuffer(<ChecklistPdfDocument {...props} />);
}