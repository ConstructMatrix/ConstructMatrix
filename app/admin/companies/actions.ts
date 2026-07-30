"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function createCompany(formData: FormData) {
  const supabase = createServiceRoleClient();

  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const phone = formData.get("phone") as string;
  const tradesRaw = formData.get("trades") as string;

  const { data: company, error } = await supabase
    .from("companies")
    .insert({ name, address: address || null, phone: phone || null })
    .select()
    .single();

  if (error || !company) {
    throw new Error(error?.message || "Failed to create company");
  }

  const trades = (tradesRaw || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (trades.length > 0) {
    await supabase
      .from("company_trades")
      .insert(trades.map((trade_name) => ({ company_id: company.id, trade_name })));
  }

  redirect(`/admin/companies/${company.id}`);
}