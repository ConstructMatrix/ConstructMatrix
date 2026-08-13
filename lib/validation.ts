import type {
  ChecklistItem,
  ChecklistResponseValue,
  ChecklistSectionConfig,
  EmployeeDocument,
  ProjectDocumentConfig,
  ProjectStatus,
} from "@/lib/types";

export interface ClearanceInput {
  documentConfigs: ProjectDocumentConfig[];
  employeeDocuments: EmployeeDocument[];
  hasChecklistSubmission: boolean;
}

export interface ClearanceResult {
  status: ProjectStatus;
  blockingReasons: string[];
}

const isExpired = (expiryDate: string | null) =>
  !!expiryDate && new Date(expiryDate) < new Date(new Date().toDateString());

/**
 * The clearance engine from SRS 5.4. Re-run on every document upload,
 * confirmation, and checklist submission.
 */
export function computeClearance({
  documentConfigs,
  employeeDocuments,
  hasChecklistSubmission,
}: ClearanceInput): ClearanceResult {
  const reasons: string[] = [];
  const mandatoryConfigs = documentConfigs.filter((c) => c.is_mandatory);

  for (const config of mandatoryConfigs) {
    const doc = employeeDocuments
      .filter((d) => d.document_type === config.document_type)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (!doc) {
      reasons.push(`Missing: ${config.document_type}`);
      continue;
    }
    if (!doc.confirmed_at) {
      reasons.push(`Unverified: ${config.document_type}`);
      continue;
    }
    if (isExpired(doc.expiry_date)) {
      reasons.push(`Expired: ${config.document_type}`);
    }
  }

  if (!hasChecklistSubmission) {
    reasons.push("Onboarding checklist not submitted");
  }

  if (reasons.length === 0) {
    return { status: "cleared", blockingReasons: [] };
  }

  const onlyMissingChecklist = reasons.length === 1 && !hasChecklistSubmission;
  return {
    status: onlyMissingChecklist ? "in_progress" : "blocked",
    blockingReasons: reasons,
  };
}

export interface ChecklistValidationError {
  sectionId: string;
  itemIndex: number;
  message: string;
}

/**
 * Validation Gate (SRS FR14/FR34): required items must be answered Yes or N/A.
 * Returns an empty array when the checklist is submittable.
 */
export function validateChecklistResponses(
  sections: ChecklistSectionConfig[],
  responses: Record<string, ChecklistResponseValue>,
): ChecklistValidationError[] {
  const errors: ChecklistValidationError[] = [];

  for (const section of sections) {
    section.items.forEach((item: ChecklistItem, index: number) => {
      if (!item.required) return;
      const key = `${section.id}:${index}`;
      const value = responses[key];
      const type = item.response_type || "yes_no_na";

      let isAnswered = false;
      if (type === "yes_no_na") {
        isAnswered = value === "yes" || value === "na";
      } else if (type === "pass_fail") {
        isAnswered = value === "pass" || value === "fail";
      } else {
        isAnswered = typeof value === "string" && value.trim().length > 0;
      }

      if (!isAnswered) {
        errors.push({
          sectionId: section.id,
          itemIndex: index,
          message: `"${item.text}" is required.`,
        });
      }
    });
  }

  return errors;
}
