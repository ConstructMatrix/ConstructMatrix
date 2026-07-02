import type { SupabaseClient } from "@supabase/supabase-js";

export async function signedUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string | null | undefined,
  expiresIn = 3600,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  return data?.signedUrl || null;
}
