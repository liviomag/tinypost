import { getSupabaseClient } from '../services/supabaseClient.js';

export async function isAuthenticated() {
  const supabase = await getSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();
  if (error) {
    return false;
  }

  return Boolean(user);
}
