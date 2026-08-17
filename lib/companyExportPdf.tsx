import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 16 },
  headerRow: { flexDirection: "row", backgroundColor: "#f5f5f5", padding: 6, fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", paddingVertical: 5, borderBottom: 0.5, borderColor: "#eee" },
  colWorker: { width: "28%" },
  colEmail: { width: "26%" },
  colTrade: { width: "16%" },
  colType: { width: "14%" },
  colProject: { width: "16%" },
});

export interface CompanyExportRow {
  worker: string;
  email: string;
  trade: string;
  type: string;
  project: string;
}

export async function renderCompanyExportPdf(companyName: string, rows: CompanyExportRow[]): Promise<Buffer> {
  const doc = (
    <Document>
      <Page size="LETTER" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>{companyName} — Worker Export</Text>
        <Text style={styles.subtitle}>Generated {new Date().toLocaleString()} · {rows.length} worker(s)</Text>
        <View style={styles.headerRow}>
          <Text style={styles.colWorker}>Worker</Text>
          <Text style={styles.colEmail}>Email</Text>
          <Text style={styles.colTrade}>Trade</Text>
          <Text style={styles.colType}>Worker Type</Text>
          <Text style={styles.colProject}>Project</Text>
        </View>
        {rows.map((r, i) => (
          <View style={styles.row} key={i}>
            <Text style={styles.colWorker}>{r.worker}</Text>
            <Text style={styles.colEmail}>{r.email}</Text>
            <Text style={styles.colTrade}>{r.trade || "—"}</Text>
            <Text style={styles.colType}>{r.type || "—"}</Text>
            <Text style={styles.colProject}>{r.project || "—"}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}