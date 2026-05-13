import { loadConfig } from '../configLoader.js';

let client;

export async function getSupabaseClient() {
  if (client) {
    return client;
  }

  const { supabaseUrl, supabaseAnonKey } = await loadConfig('../../config/supabase.json');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase-Konfiguration ist unvollständig.');
  }

  if (!window.supabase?.createClient) {
    throw new Error('Supabase SDK wurde nicht geladen.');
  }

  client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  return client;
}
