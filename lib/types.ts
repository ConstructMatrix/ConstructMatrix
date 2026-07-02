export type UserRole = "admin" | "manager" | "employee" | "contractor" | "subcontractor";

export type ProjectStatus = "pending" | "in_progress" | "blocked" | "cleared";

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  position: string | null;
  company: string | null;
  employee_type: "employee" | "contractor" | "subcontractor" | null;
  photo_url: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  admin_id: string;
  slug: string;
  created_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  status: ProjectStatus;
  joined_at: string;
}

export interface ProjectDocumentConfig {
  id: string;
  project_id: string;
  document_type: string;
  is_mandatory: boolean;
  description: string | null;
  sort_order: number;
}

export interface ChecklistItem {
  text: string;
  required: boolean;
}

export interface ChecklistSectionConfig {
  id: string;
  project_id: string;
  section_name: string;
  section_order: number;
  items: ChecklistItem[];
}

export interface AiCredentialData {
  credential_type: string | null;
  holder_name: string | null;
  issuing_body: string | null;
  issue_date: string | null;
  expiry_date: string | null;
}

export interface EmployeeDocument {
  id: string;
  user_id: string;
  project_id: string;
  document_type: string;
  photo_url: string;
  ai_data: AiCredentialData | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  expiry_date: string | null;
  is_mandatory: boolean;
  created_at: string;
}

export type ChecklistResponseValue = "yes" | "no" | "na" | null;

export interface ChecklistSubmission {
  id: string;
  user_id: string;
  project_id: string;
  submitted_at: string;
  responses: Record<string, ChecklistResponseValue>;
  signature_url: string;
  exported_pdf_url: string | null;
  worker_name: string;
  company: string;
  union_trade: string | null;
}

export interface ExpiryAlert {
  id: string;
  document_id: string;
  alert_threshold_days: number;
  last_sent_at: string | null;
  recipient_user_id: string;
}
