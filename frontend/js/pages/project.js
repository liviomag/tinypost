import { requireAuth } from '../auth/guards.js';
import { getSupabaseClient } from '../services/supabaseClient.js';

const title = document.querySelector('[data-project-title]');
const subtitle = document.querySelector('[data-project-subtitle]');
const params = new URLSearchParams(window.location.search);
const projectId = params.get('id');

await requireAuth();

if (!projectId) {
  subtitle.textContent = 'Keine Projekt-ID übergeben.';
} else {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select('id, kommissionsnummer, projektname, created_at')
    .eq('id', projectId)
    .single();

  if (error || !data) {
    subtitle.textContent = error?.message || 'Projekt konnte nicht geladen werden.';
  } else {
    title.textContent = data.projektname;
    subtitle.textContent = `Kommissionsnummer ${data.kommissionsnummer} · Erstellt am ${new Date(data.created_at).toLocaleDateString('de-DE')}`;
  }
}
