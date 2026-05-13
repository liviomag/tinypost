import { requireAuth } from '../auth/guards.js';
import { getSupabaseClient } from '../services/supabaseClient.js';

const title = document.querySelector('[data-project-title]');
const subtitle = document.querySelector('[data-project-subtitle]');
const params = new URLSearchParams(window.location.search);
const projectId = params.get('id');

const navButtons = Array.from(document.querySelectorAll('[data-project-nav]'));
const sections = Array.from(document.querySelectorAll('[data-project-section]'));

const scheduleStatus = document.querySelector('[data-schedule-status]');
const scheduleDialog = document.querySelector('[data-schedule-dialog]');
const scheduleForm = document.querySelector('[data-schedule-form]');
const scheduleDialogTitle = document.querySelector('[data-schedule-dialog-title]');
const scheduleSubmitButton = document.querySelector('[data-schedule-submit]');
const addScheduleItemButton = document.querySelector('[data-add-schedule-item]');
const addResourceItemButton = document.querySelector('[data-add-resource-item]');
const colorField = document.querySelector('[data-color-field]');
const resourceField = document.querySelector('[data-resource-field]');
const resourceSearchInput = document.querySelector('[data-resource-search]');
const resourceSuggestions = document.querySelector('[data-resource-suggestions]');
const resourceSelected = document.querySelector('[data-resource-selected]');
const cancelScheduleItemButton = document.querySelector('[data-cancel-schedule-item]');
const removeScheduleItemButton = document.querySelector('[data-remove-schedule-item]');
const ganttPrevButton = document.querySelector('[data-gantt-prev]');
const ganttNextButton = document.querySelector('[data-gantt-next]');
const ganttRange = document.querySelector('[data-gantt-range]');
const ganttGrid = document.querySelector('[data-gantt-grid]');

let supabase = null;
let scheduleItems = [];
let availableResources = [];
let selectedResources = [];
let visibleStartDate = getStartOfIsoWeek(addDays(new Date(), -7));
let editingItemId = null;
let isResourceMode = false;

await requireAuth();
initNavigation();

if (!projectId) {
  subtitle.textContent = 'Keine Projekt-ID übergeben.';
} else {
  supabase = await getSupabaseClient();
  await Promise.all([loadProject(), loadScheduleItems(), loadResources()]);
}

addScheduleItemButton?.addEventListener('click', () => openScheduleDialog(null, false));
addResourceItemButton?.addEventListener('click', () => openScheduleDialog(null, true));
cancelScheduleItemButton?.addEventListener('click', closeScheduleDialog);
resourceSearchInput?.addEventListener('input', renderResourceSuggestions);

scheduleForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(scheduleForm);
  const titleValue = String(formData.get('title') || '').trim();
  const startDate = String(formData.get('startDate') || '');
  const endDate = String(formData.get('endDate') || '');
  const colorValue = String(formData.get('color') || '');

  if (!titleValue || !startDate || !endDate || (!isResourceMode && !colorValue)) {
    scheduleStatus.textContent = 'Bitte alle Felder ausfüllen.';
    return;
  }
  if (new Date(endDate) < new Date(startDate)) {
    scheduleStatus.textContent = 'Enddatum darf nicht vor Startdatum liegen.';
    return;
  }
  if (isResourceMode && selectedResources.length === 0) {
    scheduleStatus.textContent = 'Bitte mindestens eine Ressource auswählen.';
    return;
  }

  const payload = {
    title: titleValue,
    start_date: startDate,
    end_date: endDate,
    resources: isResourceMode,
    resource_assignments: isResourceMode ? selectedResources : [],
    color: isResourceMode ? '#111111' : colorValue,
  };

  const operation = editingItemId
    ? supabase.from('project_schedule_items').update(payload).eq('id', editingItemId).eq('project_id', projectId)
    : supabase.from('project_schedule_items').insert({ project_id: projectId, ...payload });

  const { error } = await operation;
  if (error) {
    scheduleStatus.textContent = `Fehler beim Speichern: ${error.message}`;
    return;
  }

  scheduleStatus.textContent = editingItemId ? 'Eintrag aktualisiert.' : 'Eintrag gespeichert.';
  closeScheduleDialog();
  await loadScheduleItems();
});

removeScheduleItemButton?.addEventListener('click', async () => {
  if (!editingItemId) return;
  const item = scheduleItems.find((entry) => entry.id === editingItemId);
  if (!item) return;
  if (!window.confirm(`Möchtest du das Item „${item.title}“ wirklich löschen?`)) return;
  const { error } = await supabase.from('project_schedule_items').delete().eq('id', editingItemId).eq('project_id', projectId);
  if (error) return (scheduleStatus.textContent = `Fehler beim Löschen: ${error.message}`);
  scheduleStatus.textContent = `Eintrag „${item.title}“ wurde gelöscht.`;
  closeScheduleDialog();
  await loadScheduleItems();
});

ganttPrevButton?.addEventListener('click', () => {
  visibleStartDate = addDays(visibleStartDate, -35);
  renderGantt();
});
ganttNextButton?.addEventListener('click', () => {
  visibleStartDate = addDays(visibleStartDate, 35);
  renderGantt();
});

function initNavigation() { navButtons.forEach((button) => button.addEventListener('click', () => setActiveSection(button.getAttribute('data-project-nav')))); }
function setActiveSection(sectionName) {
  navButtons.forEach((button) => button.classList.toggle('is-active', button.getAttribute('data-project-nav') === sectionName));
  sections.forEach((section) => section.classList.toggle('is-hidden', section.getAttribute('data-project-section') !== sectionName));
}
async function loadProject() {
  const { data, error } = await supabase.from('projects').select('id, kommissionsnummer, projektname, created_at').eq('id', projectId).single();
  if (error || !data) return (subtitle.textContent = error?.message || 'Projekt konnte nicht geladen werden.');
  title.textContent = data.projektname;
  subtitle.textContent = `Kommissionsnummer ${data.kommissionsnummer} · Erstellt am ${new Date(data.created_at).toLocaleDateString('de-DE')}`;
}
async function loadResources() {
  const { data } = await supabase.from('profiles').select('id, first_name, last_name, email').order('first_name', { ascending: true });
  availableResources = data || [];
}
async function loadScheduleItems() {
  scheduleStatus.textContent = 'Lade Ablauf-Einträge ...';
  const { data, error } = await supabase.from('project_schedule_items').select('id, title, start_date, end_date, color, resources, resource_assignments, created_at').eq('project_id', projectId).order('start_date', { ascending: true });
  if (error) {
    scheduleItems = [];
    scheduleStatus.textContent = `Fehler beim Laden: ${error.message}`;
    return renderGantt();
  }
  scheduleItems = data || [];
  scheduleStatus.textContent = scheduleItems.length ? `${scheduleItems.length} Einträge geladen.` : 'Noch keine Einträge vorhanden.';
  renderGantt();
}
function renderGantt() {
  const visibleEndDate = addDays(visibleStartDate, 34);
  const weeks = Array.from({ length: 5 }).map((_, week) => ({ label: `KW ${getIsoWeekNumber(addDays(visibleStartDate, week * 7))}`, start: addDays(visibleStartDate, week * 7) }));
  ganttRange.textContent = `${formatDate(visibleStartDate)} – ${formatDate(visibleEndDate)}`;
  const headerCells = weeks.map((week) => `<div class="gantt-week-header" style="grid-column: span 7;">${week.label}<span>${formatDate(week.start)}</span></div>`).join('');
  const dayCells = Array.from({ length: 35 }).map((_, index) => `<div class="gantt-day-cell">${getWeekdayLabel(addDays(visibleStartDate, index))}</div>`).join('');

  const rows = scheduleItems.filter((item) => parseDateString(item.end_date) >= visibleStartDate && parseDateString(item.start_date) <= visibleEndDate).map((item) => {
    const itemStart = parseDateString(item.start_date);
    const itemEnd = parseDateString(item.end_date);
    const clampedStart = itemStart < visibleStartDate ? visibleStartDate : itemStart;
    const clampedEnd = itemEnd > visibleEndDate ? visibleEndDate : itemEnd;
    const startOffsetDays = diffInDays(visibleStartDate, clampedStart);
    const spanDays = diffInDays(visibleStartDate, clampedEnd) - startOffsetDays + 1;
    const resourceText = item.resources ? (item.resource_assignments || []).map((entry) => `${entry.first_name || ''} ${entry.last_name || ''}`.trim()).filter(Boolean).join(', ') : '';
    const barColor = item.resources ? '#111111' : item.color || '#D6E2E9';
    return `<div class="gantt-row"><div class="gantt-row-title">${escapeHtml(item.title)}${resourceText ? `<span class="gantt-resource-label">${escapeHtml(resourceText)}</span>` : ''}</div><div class="gantt-row-track"><button type="button" class="gantt-row-bar${item.resources ? ' is-resource-bar' : ''}" data-edit-item="${item.id}" style="left: calc(${startOffsetDays} * (100% / 35)); width: calc(${spanDays} * (100% / 35)); background: ${escapeHtml(barColor)};" aria-label="Eintrag ${escapeHtml(item.title)} bearbeiten"></button></div></div>`;
  }).join('');

  ganttGrid.innerHTML = `<div class="gantt-timeline"><div class="gantt-grid-head">${headerCells}</div><div class="gantt-grid-days">${dayCells}</div></div><div class="gantt-rows">${rows || '<p class="table-empty">Keine Einträge im sichtbaren Zeitraum.</p>'}</div>`;
  Array.from(ganttGrid.querySelectorAll('[data-edit-item]')).forEach((button) => button.addEventListener('click', () => openScheduleDialog(scheduleItems.find((entry) => entry.id === button.getAttribute('data-edit-item')) || null)));
}
function openScheduleDialog(item = null, forceResource = null) {
  editingItemId = item?.id || null;
  isResourceMode = forceResource === null ? Boolean(item?.resources) : forceResource;
  selectedResources = item?.resources ? [...(item.resource_assignments || [])] : [];
  scheduleForm.reset();
  colorField?.classList.toggle('is-hidden', isResourceMode);
  resourceField?.classList.toggle('is-hidden', !isResourceMode);
  if (isResourceMode) {
    scheduleDialogTitle.textContent = item ? 'Ressourcen-Eintrag bearbeiten' : 'Ressourcen-Eintrag erstellen';
  } else {
    scheduleDialogTitle.textContent = item ? 'Eintrag bearbeiten' : 'Eintrag erstellen';
  }
  scheduleSubmitButton.textContent = item ? 'Änderungen speichern' : 'Speichern';
  removeScheduleItemButton?.classList.toggle('is-hidden', !item);
  if (item) {
    scheduleForm.elements.title.value = item.title;
    scheduleForm.elements.startDate.value = item.start_date;
    scheduleForm.elements.endDate.value = item.end_date;
    scheduleForm.elements.color.value = item.color || '#D6E2E9';
  } else {
    scheduleForm.elements.color.value = '#D6E2E9';
  }
  renderSelectedResources();
  renderResourceSuggestions();
  scheduleDialog?.showModal();
}
function renderResourceSuggestions() {
  if (!resourceSuggestions || !isResourceMode) return;
  const query = String(resourceSearchInput?.value || '').trim().toLowerCase();
  const matches = query.length < 1 ? [] : availableResources.filter((profile) => {
    const email = String(profile.email || '').toLowerCase();
    return email.includes(query);
  }).filter((profile) => !selectedResources.some((selected) => selected.uid === profile.id)).slice(0, 6);
  resourceSuggestions.innerHTML = matches.map((profile) => {
    const email = String(profile.email || '').trim();
    const label = email || 'Keine E-Mail hinterlegt';
    return `<button type="button" class="resource-suggestion" data-resource-id="${profile.id}">${escapeHtml(label)}</button>`;
  }).join('');
  Array.from(resourceSuggestions.querySelectorAll('[data-resource-id]')).forEach((button) => button.addEventListener('click', () => {
    const profile = availableResources.find((entry) => entry.id === button.getAttribute('data-resource-id'));
    if (!profile) return;
    selectedResources.push({ uid: profile.id, first_name: profile.first_name || '', last_name: profile.last_name || '', email: profile.email || '' });
    resourceSearchInput.value = '';
    renderSelectedResources();
    renderResourceSuggestions();
  }));
}
function renderSelectedResources() {
  resourceSelected.innerHTML = selectedResources.map((entry) => {
    const label = String(entry.email || '').trim() || `${entry.first_name || ''} ${entry.last_name || ''}`.trim() || 'Keine E-Mail hinterlegt';
    return `<span class="resource-chip">${escapeHtml(label)}<button type="button" data-remove-resource="${entry.uid}">×</button></span>`;
  }).join('');
  Array.from(resourceSelected.querySelectorAll('[data-remove-resource]')).forEach((button) => button.addEventListener('click', () => {
    selectedResources = selectedResources.filter((entry) => entry.uid !== button.getAttribute('data-remove-resource'));
    renderSelectedResources();
    renderResourceSuggestions();
  }));
}
function closeScheduleDialog() { editingItemId = null; isResourceMode = false; selectedResources = []; scheduleForm?.reset(); scheduleDialog?.close(); }
function parseDateString(value) { return new Date(`${value}T00:00:00`); }
function getWeekdayLabel(date) { return ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'][date.getDay()] || ''; }
function getStartOfIsoWeek(date) { const copy = new Date(date); const day = copy.getDay() || 7; copy.setDate(copy.getDate() - day + 1); copy.setHours(0, 0, 0, 0); return copy; }
function getIsoWeekNumber(date) { const target = new Date(date.valueOf()); target.setHours(0, 0, 0, 0); target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7)); const week1 = new Date(target.getFullYear(), 0, 4); return 1 + Math.round(((target - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7); }
function addDays(date, days) { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy; }
function diffInDays(fromDate, toDate) { return Math.floor((toDate - fromDate) / 86400000); }
function formatDate(date) { return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date); }
function escapeHtml(value) { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
