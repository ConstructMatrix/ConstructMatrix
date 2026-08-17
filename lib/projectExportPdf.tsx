import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 16 },
  headerRow: { flexDirection: "row", backgroundColor: "#f5f5f5", padding: 6, fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", paddingVertical: 5, borderBottom: 0.5, borderColor: "#eee" },
  colWorker: { width: "28%" },
  colEmail: { width: "28%" },
  colCompany: { width: "22%" },
  colDocs: { width: "12%" },
  colStatus: { width: "10%", textTransform: "capitalize" },
});

export interface ProjectExportRow {
  worker: string;
  email: string;
  company: string;
  docsLabel: string;
  status: string;
}

export async function renderProjectExportPdf(projectName: string, rows: ProjectExportRow[]): Promise<Buffer> {
  const doc = (
    <Document>
      <Page size="LETTER" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>{projectName} — Roster Export</Text>
        <Text style={styles.subtitle}>Generated {new Date().toLocaleString()} · {rows.length} worker(s)</Text>
        <View style={styles.headerRow}>
          <Text style={styles.colWorker}>Worker</Text>
          <Text style={styles.colEmail}>Email</Text>
          <Text style={styles.colCompany}>Company</Text>
          <Text style={styles.colDocs}>Documents</Text>
          <Text style={styles.colStatus}>Status</Text>
        </View>
        {rows.map((r, i) => (
          <View style={styles.row} key={i}>
            <Text style={styles.colWorker}>{r.worker}</Text>
            <Text style={styles.colEmail}>{r.email}</Text>
            <Text style={styles.colCompany}>{r.company || "—"}</Text>
            <Text style={styles.colDocs}>{r.docsLabel}</Text>
            <Text style={styles.colStatus}>{r.status}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}