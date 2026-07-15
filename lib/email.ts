import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL ?? "Construct Matrix <noreply@atconstructmatrix.com>";

function resend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendExpiryAlert(params: {
  to: string;
  workerName: string;
  documentType: string;
  expiryDate: string;
  daysRemaining: number;
  projectName: string;
}) {
  const { to, workerName, documentType, expiryDate, daysRemaining, projectName } = params;
  const subject =
    daysRemaining <= 0
      ? `${documentType} has expired — ${projectName}`
      : `${documentType} expires in ${daysRemaining} days — ${projectName}`;

  return resend().emails.send({
    from: FROM,
    to,
    subject,
    html: `
      <p>Hi ${workerName},</p>
      <p>Your <strong>${documentType}</strong> for <strong>${projectName}</strong>
      ${daysRemaining <= 0 ? "expired on" : "expires on"} <strong>${expiryDate}</strong>.</p>
      <p>Please upload a renewed copy as soon as possible to remain cleared for site access.</p>
      <p>— Construct Matrix</p>
    `,
  });
}

export async function sendAdminExpiryAlert(params: {
  to: string;
  workerName: string;
  documentType: string;
  expiryDate: string;
  daysRemaining: number;
  projectName: string;
}) {
  const { to, workerName, documentType, expiryDate, daysRemaining, projectName } = params;
  const subject =
    daysRemaining <= 0
      ? `${workerName}: ${documentType} expired — ${projectName}`
      : `${workerName}: ${documentType} expires in ${daysRemaining} days — ${projectName}`;

  return resend().emails.send({
    from: FROM,
    to,
    subject,
    html: `
      <p>${workerName}'s <strong>${documentType}</strong> on project <strong>${projectName}</strong>
      ${daysRemaining <= 0 ? "expired on" : "expires on"} <strong>${expiryDate}</strong>.</p>
      <p>Their clearance status will be downgraded to Blocked until this is renewed and re-verified.</p>
    `,
  });
}

export async function sendChecklistSubmittedNotice(params: {
  to: string;
  workerName: string;
  projectName: string;
}) {
  return resend().emails.send({
    from: FROM,
    to: params.to,
    subject: `${params.workerName} submitted their onboarding checklist — ${params.projectName}`,
    html: `<p>${params.workerName} just completed and signed their onboarding checklist for <strong>${params.projectName}</strong>. Review it in the admin dashboard.</p>`,
  });
}