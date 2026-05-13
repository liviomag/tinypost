import { requireAuth } from '../auth/guards.js';
import { getSupabaseClient } from '../services/supabaseClient.js';

const form = document.querySelector('[data-project-form]');
const message = document.querySelector('[data-project-message]');
const tableBody = document.querySelector('[data-project-table-body]');
const emptyState = document.querySelector('[data-project-empty]');
const submitButton = document.querySelector('[data-submit-button]');
const projectModal = document.querySelector('[data-project-modal]');
const openModalButton = document.querySelector('[data-open-project-modal]');
const closeModalButton = document.querySelector('[data-cancel-project-modal]');

let supabase;
let currentUser;

function setMessage(text, type = '') {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('de-DE', { dateStyle: 'medium' });
}

function renderProjects(projects) {
  tableBody.innerHTML = '';
  emptyState.hidden = projects.length > 0;

  for (const project of projects) {
    const row = document.createElement('tr');
    row.dataset.projectId = project.id;
    row.innerHTML = `
      <td>${project.kommissionsnummer}</td>
      <td>${project.projektname}</td>
      <td>${formatDate(project.created_at)}</td>
      <td>
        <div class="actions">
          <button type="button" class="action-btn" data-action="edit">Bearbeiten</button>
          <button type="button" class="action-btn danger" data-action="delete">Löschen</button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  }
}

async function loadProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, kommissionsnummer, projektname, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  renderProjects(data || []);
}

async function createProject(event) {
  event.preventDefault();
  const formData = new FormData(form);
  const kommissionsnummer = String(formData.get('kommissionsnummer') || '').trim();
  const projektname = String(formData.get('projektname') || '').trim();

  if (!kommissionsnummer || !projektname) {
    setMessage('Bitte beide Felder ausfüllen.', 'error');
    return;
  }

  submitButton.disabled = true;
  setMessage('Projekt wird gespeichert ...');

  const { error } = await supabase.from('projects').insert({
    owner_id: currentUser.id,
    kommissionsnummer,
    projektname
  });

  submitButton.disabled = false;

  if (error) {
    setMessage(error.message || 'Projekt konnte nicht gespeichert werden.', 'error');
    return;
  }

  form.reset();
  projectModal?.close();
  await loadProjects();
  setMessage('Projekt erfolgreich erfasst.', 'success');
}

async function handleTableClick(event) {
  const actionButton = event.target.closest('[data-action]');
  const row = event.target.closest('tr[data-project-id]');
  if (!row) return;
  const projectId = row.dataset.projectId;

  if (!actionButton) {
    window.location.href = `./project.html?id=${encodeURIComponent(projectId)}`;
    return;
  }

  event.stopPropagation();
  const action = actionButton.dataset.action;

  if (action === 'edit') {
    const currentKommission = row.children[0].textContent.trim();
    const currentName = row.children[1].textContent.trim();
    const newKommission = window.prompt('Neue Kommissionsnummer', currentKommission);
    if (newKommission === null) return;
    const newName = window.prompt('Neuer Projektname', currentName);
    if (newName === null) return;

    const { error } = await supabase
      .from('projects')
      .update({ kommissionsnummer: newKommission.trim(), projektname: newName.trim() })
      .eq('id', projectId)
      .eq('owner_id', currentUser.id);

    if (error) {
      setMessage(error.message || 'Projekt konnte nicht aktualisiert werden.', 'error');
      return;
    }

    await loadProjects();
    setMessage('Projekt erfolgreich aktualisiert.', 'success');
  }

  if (action === 'delete') {
    if (!window.confirm('Projekt wirklich löschen?')) return;

    const { error } = await supabase.from('projects').delete().eq('id', projectId).eq('owner_id', currentUser.id);

    if (error) {
      setMessage(error.message || 'Projekt konnte nicht gelöscht werden.', 'error');
      return;
    }

    await loadProjects();
    setMessage('Projekt wurde gelöscht.', 'success');
  }
}

await requireAuth();
supabase = await getSupabaseClient();
const { data } = await supabase.auth.getUser();
currentUser = data.user;

if (!currentUser) {
  window.location.href = './login.html';
  throw new Error('Nicht authentifiziert.');
}

form?.addEventListener('submit', createProject);
openModalButton?.addEventListener('click', openCreateModal);
closeModalButton?.addEventListener('click', closeCreateModal);
tableBody?.addEventListener('click', handleTableClick);

try {
  await loadProjects();
  setMessage('');
} catch (error) {
  setMessage(error.message || 'Projekte konnten nicht geladen werden.', 'error');
}

function openCreateModal() {
  projectModal?.showModal();
}

function closeCreateModal() {
  projectModal?.close();
}
