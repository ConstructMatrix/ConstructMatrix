"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function assignTradeAndRole(formData: FormData) {
  const employeeCompanyId = formData.get("employeeCompanyId") as string;
  const trade = formData.get("trade") as string;
  const employeeType = formData.get("employeeType") as string;
  const employeeId = formData.get("employeeId") as string;
  const projectId = formData.get("projectId") as string;

  const supabase = createServiceRoleClient();

  await supabase
    .from("employee_companies")
    .update({
      trade: trade || null,
      employee_type: employeeType || null,
    })
    .eq("id", employeeCompanyId);

  revalidatePath(`/admin/employees/${employeeId}`);
}