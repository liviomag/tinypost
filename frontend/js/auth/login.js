import { getSupabaseClient } from '../services/supabaseClient.js';
import { requireGuest } from './guards.js';

const form = document.querySelector('[data-auth-login-form]');
const message = document.querySelector('[data-auth-message]');

function setMessage(text, type = '') {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

async function onSubmit(event) {
  event.preventDefault();

  const formData = new FormData(form);
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '').trim();

  if (!email || !password) {
    setMessage('Bitte E-Mail und Passwort eingeben.', 'error');
    return;
  }

  setMessage('Einloggen ...');

  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    window.location.href = './projects.html';
  } catch (error) {
    setMessage(error.message || 'Login fehlgeschlagen.', 'error');
  }
}

await requireGuest();
form?.addEventListener('submit', onSubmit);
