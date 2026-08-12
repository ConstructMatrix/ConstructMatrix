"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function createCompany(formData: FormData) {
  const supabase = createServiceRoleClient();

  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const phone = formData.get("phone") as string;
  const trades = formData.getAll("trades") as string[];

  let companyId: string;

  try {
    const { data: company, error } = await supabase
      .from("companies")
      .insert({ name, address: address || null, phone: phone || null })
      .select()
      .single();

    if (error || !company) {
      redirect(`/admin/companies/new?error=${encodeURIComponent(error?.message || "Failed to create company")}`);
    }

    companyId = company!.id;

    if (trades.length > 0) {
      const { error: tradesError } = await supabase
        .from("company_trades")
        .insert(trades.map((trade_name) => ({ company_id: companyId, trade_name })));

      if (tradesError) {
        redirect(`/admin/companies/new?error=${encodeURIComponent("Company created, but trades failed: " + tradesError.message)}`);
      }
    }
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    redirect(`/admin/companies/new?error=${encodeURIComponent(err?.message || "Unknown error")}`);
  }

  redirect(`/admin/companies/${companyId}`);
}