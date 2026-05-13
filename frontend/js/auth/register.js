import { getSupabaseClient } from '../services/supabaseClient.js';
import { requireGuest } from './guards.js';

const form = document.querySelector('[data-auth-register-form]');
const message = document.querySelector('[data-auth-message]');

function setMessage(text, type = '') {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

async function onSubmit(event) {
  event.preventDefault();

  const formData = new FormData(form);
  const email = String(formData.get('email') || '').trim();
  const firstName = String(formData.get('firstName') || '').trim();
  const lastName = String(formData.get('lastName') || '').trim();
  const password = String(formData.get('password') || '').trim();
  const passwordRepeat = String(formData.get('passwordRepeat') || '').trim();

  if (!email || !firstName || !lastName || !password || !passwordRepeat) {
    setMessage('Bitte alle Felder ausfüllen.', 'error');
    return;
  }

  if (password !== passwordRepeat) {
    setMessage('Passwörter stimmen nicht überein.', 'error');
    return;
  }

  setMessage('Registrierung läuft ...');

  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName
        }
      }
    });

    if (error) throw error;
    setMessage('Registrierung erfolgreich. Bitte E-Mail bestätigen.', 'success');
    form.reset();
  } catch (error) {
    setMessage(error.message || 'Registrierung fehlgeschlagen.', 'error');
  }
}

await requireGuest();
form?.addEventListener('submit', onSubmit);
