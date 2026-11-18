// One shared rule for "is this person a member right now?"
// Matches the is_active_member() function in Supabase.
type MemberFields = {
  subscription_status?: string | null;
  paid_through?: string | null;
} | null | undefined;

export function isMember(p: MemberFields): boolean {
  if (!p) return false;
  if (p.subscription_status === "active") return true;
  if (p.paid_through) {
    const today = new Date().toISOString().slice(0, 10);
    return p.paid_through >= today;
  }
  return false;
}
