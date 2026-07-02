import type { ProjectStatus } from "@/lib/types";

const LABEL: Record<ProjectStatus, string> = {
  cleared: "Cleared",
  pending: "Pending",
  in_progress: "In progress",
  blocked: "Action needed",
};

const CLASS: Record<ProjectStatus, string> = {
  cleared: "pill-ok",
  pending: "pill-warn",
  in_progress: "pill-warn",
  blocked: "pill-block",
};

export default function StatusPill({ status }: { status: ProjectStatus }) {
  return <span className={`pill ${CLASS[status]}`}>{LABEL[status]}</span>;
}
