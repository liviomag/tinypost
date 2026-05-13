import { loadConfig } from '../configLoader.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import { requireGuest } from './guards.js';

const form = document.querySelector('[data-auth-forgot-form]');
const message = document.querySelector('[data-auth-message]');

function setMessage(text, type = '') {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

async function onSubmit(event) {
  event.preventDefault();

  const formData = new FormData(form);
  const email = String(formData.get('email') || '').trim();

  if (!email) {
    setMessage('Bitte E-Mail eingeben.', 'error');
    return;
  }

  setMessage('Link wird angefordert ...');

  try {
    const [{ magicLinkRedirectUrl }, supabase] = await Promise.all([
      loadConfig('../../config/auth.json'),
      getSupabaseClient()
    ]);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: magicLinkRedirectUrl
    });

    if (error) throw error;
    setMessage('Wenn die E-Mail existiert, wurde ein Recovery-Link gesendet.', 'success');
    form.reset();
  } catch (error) {
    setMessage(error.message || 'Link konnte nicht gesendet werden.', 'error');
  }
}

await requireGuest();
form?.addEventListener('submit', onSubmit);
