export default function DashboardCharts({
  clearance,
  docStatus,
}: {
  clearance: { cleared: number; pending: number; blocked: number };
  docStatus: { verified: number; missing: number; expiring: number };
}) {
  const total = clearance.cleared + clearance.pending + clearance.blocked || 1;
  const clearedPct = (clearance.cleared / total) * 100;
  const pendingPct = (clearance.pending / total) * 100;
  const blockedPct = (clearance.blocked / total) * 100;

  const clearedDeg = (clearedPct / 100) * 360;
  const pendingDeg = (pendingPct / 100) * 360;

  const maxDoc = Math.max(docStatus.verified, docStatus.missing, docStatus.expiring, 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="card p-5">
        <div className="text-sm font-semibold mb-1">Clearance status</div>
        <div className="text-xs text-text-muted mb-4">Across selected projects</div>
        <div className="flex items-center gap-6">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e7e5e4" strokeWidth="16" />
            <circle
              cx="60" cy="60" r="50" fill="none" stroke="#15803d" strokeWidth="16"
              strokeDasharray={`${(clearedDeg / 360) * 314.159} 314.159`}
              transform="rotate(-90 60 60)"
            />
            <circle
              cx="60" cy="60" r="50" fill="none" stroke="#a16207" strokeWidth="16"
              strokeDasharray={`${(pendingDeg / 360) * 314.159} 314.159`}
              strokeDashoffset={`${-(clearedDeg / 360) * 314.159}`}
              transform="rotate(-90 60 60)"
            />
            <circle
              cx="60" cy="60" r="50" fill="none" stroke="#b91c1c" strokeWidth="16"
              strokeDasharray={`${(blockedPct / 100) * 314.159} 314.159`}
              strokeDashoffset={`${-((clearedDeg + pendingDeg) / 360) * 314.159}`}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="flex flex-col gap-2 text-sm">
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#15803d" }} />Cleared <b className="ml-auto font-medium">{clearance.cleared}</b></span>
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#a16207" }} />Pending <b className="ml-auto font-medium">{clearance.pending}</b></span>
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#b91c1c" }} />Blocked <b className="ml-auto font-medium">{clearance.blocked}</b></span>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="text-sm font-semibold mb-1">Documents by status</div>
        <div className="text-xs text-text-muted mb-4">All uploaded credentials</div>
        <div className="flex items-end gap-6 h-[140px] px-2">
          {[
            { label: "Verified", value: docStatus.verified, color: "#15803d" },
            { label: "Missing", value: docStatus.missing, color: "#b91c1c" },
            { label: "Expiring", value: docStatus.expiring, color: "#a16207" },
          ].map((bar) => (
            <div key={bar.label} className="flex flex-col items-center gap-2 flex-1">
              <div className="text-xs font-medium">{bar.value}</div>
              <div
                className="w-full rounded-t-md"
                style={{ height: `${(bar.value / maxDoc) * 100}px`, background: bar.color, minHeight: bar.value > 0 ? "4px" : "0" }}
              />
              <div className="text-xs text-text-muted">{bar.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}