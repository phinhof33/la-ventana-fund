"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function completeProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const first_name = String(formData.get("first_name") || "").trim();
  const last_initial = String(formData.get("last_initial") || "").trim().slice(0, 1);
  if (!first_name) throw new Error("First name can't be empty.");

  const updates: Record<string, unknown> = { first_name, last_initial };

  const avatar = formData.get("avatar") as File | null;
  if (avatar && avatar.size > 0) {
    const ext = avatar.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const bytes = new Uint8Array(await avatar.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, bytes, { upsert: true, contentType: avatar.type || "image/jpeg" });
    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
    // Cache-bust so the new photo shows immediately instead of a stale cached one.
    updates.avatar_url = `${publicUrl.publicUrl}?t=${Date.now()}`;
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/ledger");
}

export async function nominate(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const estimated_cost = formData.get("estimated_cost")
    ? Number(formData.get("estimated_cost"))
    : null;

  if (!title) throw new Error("A title is required.");

  const { error } = await supabase.from("nominations").insert({
    member_id: user.id,
    title,
    description,
    estimated_cost,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function nominateFromCatalog(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const catalog_item_id = String(formData.get("catalog_item_id"));

  const { data: item } = await supabase
    .from("catalog_items")
    .select("*")
    .eq("id", catalog_item_id)
    .single();
  if (!item) throw new Error("That catalog item couldn't be found.");

  // Avoid duplicate open nominations for the same catalog item splitting the vote.
  const { data: existing } = await supabase
    .from("nominations")
    .select("id")
    .eq("catalog_item_id", catalog_item_id)
    .eq("status", "open")
    .maybeSingle();
  if (existing) return; // already nominated and still open — nothing to do

  const { error } = await supabase.from("nominations").insert({
    member_id: user.id,
    catalog_item_id,
    title: item.title,
    description: item.description,
    estimated_cost: item.price_high,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/catalog");
}
export async function castVote(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const cycle_id = String(formData.get("cycle_id"));
  const nomination_id = String(formData.get("nomination_id"));

  // Upsert-style: remove any existing vote in this cycle, then cast the new one,
  // so members can change their mind while the round is still open.
  await supabase.from("votes").delete().eq("cycle_id", cycle_id).eq("member_id", user.id);

  const { error } = await supabase.from("votes").insert({
    cycle_id,
    member_id: user.id,
    nomination_id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}
