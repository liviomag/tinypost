import { getSupabaseClient } from '../services/supabaseClient.js';

export async function isAuthenticated() {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  return Boolean(data.session);
}
