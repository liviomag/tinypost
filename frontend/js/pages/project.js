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
const titleField = document.querySelector('[data-title-field]');
const resourceField = document.querySelector('[data-resource-field]');
const resourceSelect = document.querySelector('[data-resource-select]');
const addSelectedResourceButton = document.querySelector('[data-add-selected-resource]');
const resourceSelected = document.querySelector('[data-resource-selected]');
const cancelScheduleItemButton = document.querySelector('[data-cancel-schedule-item]');
const removeScheduleItemButton = document.querySelector('[data-remove-schedule-item]');
const ganttPrevButton = document.querySelector('[data-gantt-prev]');
const ganttNextButton = document.querySelector('[data-gantt-next]');
const ganttRange = document.querySelector('[data-gantt-range]');
const ganttGrid = document.querySelector('[data-gantt-grid]');
const ganttHistoryList = document.querySelector('[data-gantt-history-list]');
const linkedInformationList = document.querySelector('[data-linked-information-list]');

const teamStatus = document.querySelector('[data-team-status]');
const teamTableBody = document.querySelector('[data-team-table-body]');
const addTeamMemberButton = document.querySelector('[data-add-team-member]');
const teamDialog = document.querySelector('[data-team-dialog]');
const teamForm = document.querySelector('[data-team-form]');
const cancelTeamMemberButton = document.querySelector('[data-cancel-team-member]');
const teamDialogTitle = document.querySelector('[data-team-dialog-title]');
const teamSubmitButton = document.querySelector('[data-team-submit]');
const deleteTeamMemberButton = document.querySelector('[data-delete-team-member]');
const informationStatus = document.querySelector('[data-information-status]');
const informationTableBody = document.querySelector('[data-information-table-body]');
const informationPrevButton = document.querySelector('[data-information-prev]');
const informationNextButton = document.querySelector('[data-information-next]');
const informationPageLabel = document.querySelector('[data-information-page-label]');
const addInformationButton = document.querySelector('[data-add-information]');
const informationDialog = document.querySelector('[data-information-dialog]');
const informationForm = document.querySelector('[data-information-form]');
const informationDialogTitle = document.querySelector('[data-information-dialog-title]');
const informationSubmitButton = document.querySelector('[data-information-submit]');
const cancelInformationButton = document.querySelector('[data-cancel-information]');
const informationGanttLinkTypeSelect = document.querySelector('[data-information-gantt-link-type]');
const informationGanttSelect = document.querySelector('[data-information-gantt-select]');
const informationDetailDialog = document.querySelector('[data-information-detail-dialog]');
const informationDetailMeta = document.querySelector('[data-information-detail-meta]');
const informationDetailText = document.querySelector('[data-information-detail-text]');
const informationDetailDocuments = document.querySelector('[data-information-detail-documents]');
const closeInformationDetailButton = document.querySelector('[data-close-information-detail]');

let supabase = null;
let scheduleItems = [];
let availableResources = [];
let selectedResources = [];
let visibleStartDate = getStartOfIsoWeek(addDays(new Date(), -7));
let editingItemId = null;
let isResourceMode = false;
let informationPage = 0;
const informationPageSize = 20;
let hasMoreInformation = false;
const GANTT_WINDOW_DAYS = 35;

await requireAuth();
initNavigation();

if (!projectId) {
  subtitle.textContent = 'Keine Projekt-ID übergeben.';
} else {
  supabase = await getSupabaseClient();
  await Promise.all([loadProject(), loadScheduleItems(), loadTeamMembers(), loadInformationItems()]);
}

addScheduleItemButton?.addEventListener('click', () => openScheduleDialog(null, false));
addResourceItemButton?.addEventListener('click', () => openScheduleDialog(null, true));
cancelScheduleItemButton?.addEventListener('click', closeScheduleDialog);
addSelectedResourceButton?.addEventListener('click', addSelectedResource);
addTeamMemberButton?.addEventListener('click', () => openTeamDialog(null));
cancelTeamMemberButton?.addEventListener('click', closeTeamDialog);
addInformationButton?.addEventListener('click', () => openInformationDialog());
cancelInformationButton?.addEventListener('click', closeInformationDialog);
closeInformationDetailButton?.addEventListener('click', () => informationDetailDialog?.close());
informationPrevButton?.addEventListener('click', async () => {
  if (informationPage === 0) return;
  informationPage -= 1;
  await loadInformationItems();
});
informationNextButton?.addEventListener('click', async () => {
  if (!hasMoreInformation) return;
  informationPage += 1;
  await loadInformationItems();
});
informationGanttLinkTypeSelect?.addEventListener('change', () => {
  populateGanttSelectByType(informationGanttLinkTypeSelect.value || '');
});

teamForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(teamForm);
  const firstName = String(formData.get('firstName') || '').trim();
  const lastName = String(formData.get('lastName') || '').trim();
  const role = String(formData.get('role') || '').trim();
  const regieansatz = String(formData.get('regieansatz') || '').trim();
  const sollerloes = String(formData.get('sollerloes') || '').trim();
  const regieNummer = String(formData.get('regieNummer') || '').trim();
  const memberId = String(formData.get('memberId') || '').trim();

  if (!firstName || !lastName || !role) {
    teamStatus.textContent = 'Bitte alle Felder ausfüllen.';
    return;
  }

  const payload = { project_id: projectId, first_name: firstName, last_name: lastName, role, regieansatz, sollerloes, regie_nummer: regieNummer };
  const operation = memberId
    ? supabase.from('project_team_members').update(payload).eq('id', memberId).eq('project_id', projectId)
    : supabase.from('project_team_members').insert(payload);
  const { error } = await operation;

  if (error) {
    teamStatus.textContent = `Fehler beim Hinzufügen: ${error.message}`;
    return;
  }

  teamStatus.textContent = memberId ? 'Teammitglied aktualisiert.' : 'Teammitglied hinzugefügt.';
  closeTeamDialog();
  await loadTeamMembers();
});

deleteTeamMemberButton?.addEventListener('click', async () => {
  const memberId = String(teamForm?.elements.memberId?.value || '').trim();
  if (!memberId) return;
  if (!window.confirm('Möchtest du diese Person wirklich löschen?')) return;
  const { error } = await supabase.from('project_team_members').delete().eq('id', memberId).eq('project_id', projectId);
  if (error) {
    teamStatus.textContent = `Fehler beim Löschen: ${error.message}`;
    return;
  }
  teamStatus.textContent = 'Teammitglied gelöscht.';
  closeTeamDialog();
  await loadTeamMembers();
});

scheduleForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(scheduleForm);
  const titleValue = String(formData.get('title') || '').trim();
  const startDate = String(formData.get('startDate') || '');
  const endDate = String(formData.get('endDate') || '');
  const colorValue = String(formData.get('color') || '');

  if ((!isResourceMode && !titleValue) || !startDate || !endDate || (!isResourceMode && !colorValue)) {
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

  const resourceTitle = selectedResources.map((entry) => `${entry.first_name || ''} ${entry.last_name || ''}`.trim()).filter(Boolean).join(', ');
  const payload = {
    title: isResourceMode ? (editingItemId ? (scheduleItems.find((entry) => entry.id === editingItemId)?.title || resourceTitle || 'Ressource') : (resourceTitle || 'Ressource')) : titleValue,
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
  visibleStartDate = addDays(visibleStartDate, -GANTT_WINDOW_DAYS);
  renderGantt();
});
ganttNextButton?.addEventListener('click', () => {
  visibleStartDate = addDays(visibleStartDate, GANTT_WINDOW_DAYS);
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
async function loadTeamMembers() {
  teamStatus.textContent = 'Lade Team ...';
  const { data, error } = await supabase.from('project_team_members').select('id, first_name, last_name, role, regieansatz, sollerloes, regie_nummer').eq('project_id', projectId).order('first_name', { ascending: true });
  if (error) {
    teamStatus.textContent = `Fehler beim Laden: ${error.message}`;
    return;
  }
  availableResources = data || [];
  renderTeamTable();
  renderResourceOptions();
  teamStatus.textContent = availableResources.length ? `${availableResources.length} Teammitglieder geladen.` : 'Noch keine Teammitglieder vorhanden.';
}
function renderTeamTable() {
  if (!teamTableBody) return;
  if (!availableResources.length) {
    teamTableBody.innerHTML = '<tr><td colspan="7" class="table-empty">Noch keine Teammitglieder vorhanden.</td></tr>';
    return;
  }
  teamTableBody.innerHTML = availableResources.map((member) => `<tr><td>${escapeHtml(member.first_name || '')}</td><td>${escapeHtml(member.last_name || '')}</td><td>${escapeHtml(member.role || '')}</td><td>${escapeHtml(member.regieansatz || '')}</td><td>${escapeHtml(member.sollerloes || '')}</td><td>${escapeHtml(member.regie_nummer || '')}</td><td><div class="actions"><button type="button" class="action-btn" data-edit-member="${member.id}">Bearbeiten</button></div></td></tr>`).join('');
  Array.from(teamTableBody.querySelectorAll('[data-edit-member]')).forEach((button) => button.addEventListener('click', () => {
    const member = availableResources.find((entry) => entry.id === button.getAttribute('data-edit-member'));
    if (member) openTeamDialog(member);
  }));
}
function renderResourceOptions() {
  if (!resourceSelect) return;
  const remaining = availableResources.filter((member) => !selectedResources.some((selected) => selected.uid === member.id));
  resourceSelect.innerHTML = ['<option value="">Person auswählen</option>', ...remaining.map((member) => `<option value="${member.id}">${escapeHtml(`${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Ohne Namen')}</option>`)].join('');
}
function addSelectedResource() {
  const resourceId = resourceSelect?.value;
  if (!resourceId) return;
  const member = availableResources.find((entry) => entry.id === resourceId);
  if (!member) return;
  selectedResources.push({ uid: member.id, first_name: member.first_name || '', last_name: member.last_name || '', role: member.role || '' });
  renderSelectedResources();
  renderResourceOptions();
}
async function loadScheduleItems() {
  scheduleStatus.textContent = 'Lade Ablauf-Einträge ...';
  const { data, error } = await supabase.from('project_schedule_items').select('id, title, start_date, end_date, color, resources, resource_assignments, created_at, updated_at, history').eq('project_id', projectId).order('start_date', { ascending: true });
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
  const visibleEndDate = addDays(visibleStartDate, GANTT_WINDOW_DAYS - 1);
  const weeks = Array.from({ length: 5 }).map((_, week) => ({ label: `KW ${getIsoWeekNumber(addDays(visibleStartDate, week * 7))}`, start: addDays(visibleStartDate, week * 7) }));
  ganttRange.textContent = `${formatDate(visibleStartDate)} – ${formatDate(visibleEndDate)}`;
  const headerCells = weeks.map((week) => `<div class="gantt-week-header" style="grid-column: span 7;">${week.label}<span>${formatDate(week.start)}</span></div>`).join('');
  const dayCells = Array.from({ length: GANTT_WINDOW_DAYS }).map((_, index) => `<div class="gantt-day-cell">${getWeekdayLabel(addDays(visibleStartDate, index))}</div>`).join('');

  const visibleItems = scheduleItems
    .filter((item) => parseDateString(item.end_date) >= visibleStartDate && parseDateString(item.start_date) <= visibleEndDate)
    .sort((a, b) => {
      if (Boolean(a.resources) !== Boolean(b.resources)) return a.resources ? -1 : 1;
      return parseDateString(a.start_date) - parseDateString(b.start_date);
    });

  const rows = visibleItems.map((item) => {
    const itemStart = parseDateString(item.start_date);
    const itemEnd = parseDateString(item.end_date);
    const clampedStart = itemStart < visibleStartDate ? visibleStartDate : itemStart;
    const clampedEnd = itemEnd > visibleEndDate ? visibleEndDate : itemEnd;
    const startOffsetDays = diffInDays(visibleStartDate, clampedStart);
    const spanDays = diffInDays(visibleStartDate, clampedEnd) - startOffsetDays + 1;
    const resourceText = item.resources ? (item.resource_assignments || []).map((entry) => `${entry.first_name || ''} ${entry.last_name || ''}`.trim()).filter(Boolean).join(', ') : '';
    const barColor = item.resources ? '#111111' : item.color || '#D6E2E9';
    const resizeHandles = item.resources
      ? `<span class="gantt-resize-handle is-left" data-resize-item="${item.id}" data-resize-edge="left" aria-hidden="true"></span><span class="gantt-resize-handle is-right" data-resize-item="${item.id}" data-resize-edge="right" aria-hidden="true"></span>`
      : '';

    return `<div class="gantt-row"><div class="gantt-row-title">${escapeHtml(item.title)}${resourceText ? `<span class="gantt-resource-label">${escapeHtml(resourceText)}</span>` : ''}</div><div class="gantt-row-track"><button type="button" class="gantt-row-bar${item.resources ? ' is-resource-bar is-draggable-resource' : ''}" data-edit-item="${item.id}" data-item-id="${item.id}" style="left: calc(${startOffsetDays} * (100% / ${GANTT_WINDOW_DAYS})); width: calc(${spanDays} * (100% / ${GANTT_WINDOW_DAYS})); background: ${escapeHtml(barColor)};" aria-label="Eintrag ${escapeHtml(item.title)} bearbeiten">${resizeHandles}</button></div></div>`;
  }).join('');

  ganttGrid.innerHTML = `<div class="gantt-timeline"><div class="gantt-grid-head">${headerCells}</div><div class="gantt-grid-days">${dayCells}</div></div><div class="gantt-rows">${rows || '<p class="table-empty">Keine Einträge im sichtbaren Zeitraum.</p>'}</div>`;

  Array.from(ganttGrid.querySelectorAll('[data-edit-item]')).forEach((button) => {
    const item = scheduleItems.find((entry) => entry.id === button.getAttribute('data-edit-item'));
    if (!item) return;
    button.addEventListener('click', () => openScheduleDialog(item || null));
    if (item.resources) {
      button.addEventListener('pointerdown', (event) => startResourceDrag(event, item));
    }
  });
  attachResizeHandleEvents();
}

function startResourceDrag(event, item) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.closest('[data-resize-item]')) return;
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  const bar = event.currentTarget;
  if (!(bar instanceof HTMLElement)) return;
  const track = bar.parentElement;
  if (!(track instanceof HTMLElement)) return;

  const startDate = parseDateString(item.start_date);
  const endDate = parseDateString(item.end_date);
  const duration = diffInDays(startDate, endDate);
  const startX = event.clientX;
  const startIndex = diffInDays(visibleStartDate, startDate);

  const onMove = (moveEvent) => {
    const deltaDays = pixelDeltaToDays(moveEvent.clientX - startX, track);
    const nextStartIndex = startIndex + deltaDays;
    const nextEndIndex = nextStartIndex + duration;
    updateBarPreview(bar, nextStartIndex, nextEndIndex);
  };

  const onUp = async (upEvent) => {
    cleanup();
    const deltaDays = pixelDeltaToDays(upEvent.clientX - startX, track);
    if (!deltaDays) return;
    await persistResourceDates(item, addDays(startDate, deltaDays), addDays(endDate, deltaDays));
  };

  const cleanup = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', cleanup);
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', cleanup);
}

function pixelDeltaToDays(pixelDelta, trackElement) {
  const dayWidth = trackElement.clientWidth / GANTT_WINDOW_DAYS;
  if (!dayWidth) return 0;
  return Math.round(pixelDelta / dayWidth);
}

function updateBarPreview(bar, startIndex, endIndex) {
  const clampedStart = Math.max(-2, startIndex);
  const clampedEnd = Math.min(GANTT_WINDOW_DAYS + 1, endIndex);
  const span = clampedEnd - clampedStart + 1;
  bar.style.left = `calc(${clampedStart} * (100% / ${GANTT_WINDOW_DAYS}))`;
  bar.style.width = `calc(${Math.max(1, span)} * (100% / ${GANTT_WINDOW_DAYS}))`;
}

async function persistResourceDates(item, nextStartDate, nextEndDate) {
  const payload = {
    start_date: toDateString(nextStartDate),
    end_date: toDateString(nextEndDate),
  };
  const { error } = await supabase.from('project_schedule_items').update(payload).eq('id', item.id).eq('project_id', projectId).eq('resources', true);
  if (error) {
    scheduleStatus.textContent = `Fehler beim Verschieben: ${error.message}`;
    renderGantt();
    return;
  }
  scheduleStatus.textContent = `Ressource „${item.title}“ wurde verschoben.`;
  await loadScheduleItems();
}

function openScheduleDialog(item = null, forceResource = null) {
  editingItemId = item?.id || null;
  isResourceMode = forceResource === null ? Boolean(item?.resources) : forceResource;
  selectedResources = item?.resources ? [...(item.resource_assignments || [])] : [];
  scheduleForm.reset();
  colorField?.classList.toggle('is-hidden', isResourceMode);
  resourceField?.classList.toggle('is-hidden', !isResourceMode);
  titleField?.classList.toggle('is-hidden', isResourceMode);
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
  renderGanttHistory(item);
  loadLinkedInformation(item?.id || null);
  renderSelectedResources();
  renderResourceOptions();
  scheduleDialog?.showModal();
}
async function loadInformationItems() {
  informationStatus.textContent = 'Lade Informationen ...';
  const from = informationPage * informationPageSize;
  const to = from + informationPageSize;
  const { data, error } = await supabase.from('project_information_items').select('id, text, information_date, documents').eq('project_id', projectId).is('gantt_item_id', null).order('information_date', { ascending: false }).range(from, to);
  if (error) return (informationStatus.textContent = `Fehler beim Laden: ${error.message}`);
  hasMoreInformation = (data || []).length > informationPageSize;
  renderInformationTable((data || []).slice(0, informationPageSize));
  informationPageLabel.textContent = `Seite ${informationPage + 1}`;
  informationPrevButton.disabled = informationPage === 0;
  informationNextButton.disabled = !hasMoreInformation;
  informationStatus.textContent = `${(data || []).slice(0, informationPageSize).length} Informationen geladen.`;
}
function renderInformationTable(items) {
  if (!items.length) {
    informationTableBody.innerHTML = '<tr><td colspan="4" class="table-empty">Keine offenen Informationen vorhanden.</td></tr>';
    return;
  }
  informationTableBody.innerHTML = items.map((item) => `<tr><td>${formatDate(parseDateString(item.information_date))}</td><td>${escapeHtml((item.text || '').slice(0, 120))}</td><td>${Array.isArray(item.documents) ? item.documents.length : 0}</td><td><button type="button" class="action-btn" data-open-information="${item.id}">Öffnen</button><button type="button" class="action-btn" data-edit-information="${item.id}">Bearbeiten</button></td></tr>`).join('');
  Array.from(informationTableBody.querySelectorAll('[data-open-information]')).forEach((button) => button.addEventListener('click', async () => openInformationDetail(button.getAttribute('data-open-information'))));
  Array.from(informationTableBody.querySelectorAll('[data-edit-information]')).forEach((button) => button.addEventListener('click', async () => openInformationDialog(button.getAttribute('data-edit-information'))));
}
informationForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(informationForm);
  const informationId = String(formData.get('informationId') || '').trim();
  const text = String(formData.get('text') || '').trim();
  const informationDate = String(formData.get('informationDate') || '');
  const ganttItemId = String(formData.get('ganttItemId') || '').trim();
  const files = Array.from(informationForm.elements.documents.files || []);
  if (!text || !informationDate) return;
  const existingDocuments = informationForm.dataset.documents ? JSON.parse(informationForm.dataset.documents) : [];
  const uploadedDocuments = [];
  for (const file of files) {
    const path = `${projectId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('project-information-documents').upload(path, file);
    if (uploadError) return (informationStatus.textContent = `Upload fehlgeschlagen: ${uploadError.message}`);
    uploadedDocuments.push({ path, filename: file.name, mime_type: file.type || 'application/octet-stream' });
  }
  const payload = { project_id: projectId, text, information_date: informationDate, gantt_item_id: ganttItemId || null, documents: [...existingDocuments, ...uploadedDocuments] };
  const { error } = informationId ? await supabase.from('project_information_items').update(payload).eq('id', informationId).eq('project_id', projectId) : await supabase.from('project_information_items').insert(payload);
  if (error) return (informationStatus.textContent = `Fehler beim Speichern: ${error.message}`);
  closeInformationDialog();
  await loadInformationItems();
  await loadLinkedInformation(editingItemId);
});
async function openInformationDialog(id = null) {
  informationForm.reset();
  informationForm.dataset.documents = '[]';
  informationDialogTitle.textContent = id ? 'Information bearbeiten' : 'Information erstellen';
  informationSubmitButton.textContent = id ? 'Aktualisieren' : 'Speichern';
  informationForm.elements.informationDate.value = toDateString(new Date());
  await populateGanttSelect();
  if (id) {
    const { data } = await supabase.from('project_information_items').select('id, text, information_date, gantt_item_id, documents').eq('id', id).eq('project_id', projectId).single();
    if (!data) return;
    informationForm.elements.informationId.value = data.id;
    informationForm.elements.text.value = data.text || '';
    informationForm.elements.informationDate.value = data.information_date;
    const linkedItem = scheduleItems.find((entry) => entry.id === data.gantt_item_id);
    informationForm.elements.ganttLinkType.value = linkedItem ? (linkedItem.resources ? 'resource' : 'schedule') : '';
    populateGanttSelectByType(informationForm.elements.ganttLinkType.value || '');
    informationForm.elements.ganttItemId.value = data.gantt_item_id || '';
    informationForm.dataset.documents = JSON.stringify(data.documents || []);
  } else {
    informationForm.elements.ganttLinkType.value = '';
    populateGanttSelectByType('');
  }
  informationDialog.showModal();
}
function closeInformationDialog() { informationForm?.reset(); informationDialog?.close(); }
async function populateGanttSelect() {
  populateGanttSelectByType(informationGanttLinkTypeSelect?.value || '');
}
function populateGanttSelectByType(linkType) {
  if (!informationGanttSelect) return;
  if (!linkType) {
    informationGanttSelect.innerHTML = '<option value="">Bitte zuerst Verknüpfungstyp wählen</option>';
    informationGanttSelect.disabled = true;
    informationGanttSelect.value = '';
    return;
  }
  const shouldBeResource = linkType === 'resource';
  const options = scheduleItems.filter((entry) => Boolean(entry.resources) === shouldBeResource);
  informationGanttSelect.innerHTML = ['<option value="">Item auswählen</option>', ...options.map((entry) => `<option value="${entry.id}">${escapeHtml(entry.title)}</option>`)].join('');
  informationGanttSelect.disabled = false;
}
function renderGanttHistory(item) {
  if (!item?.history?.length) return (ganttHistoryList.innerHTML = '<li class="table-empty">Keine Historie verfügbar.</li>');
  ganttHistoryList.innerHTML = item.history.slice().reverse().map((entry) => `<li>${formatDate(new Date(entry.changed_at || item.updated_at || item.created_at))} · ${escapeHtml(entry.title || item.title)}</li>`).join('');
}
async function loadLinkedInformation(ganttItemId) {
  if (!ganttItemId) return (linkedInformationList.innerHTML = '<p class="table-empty">Keine verlinkten Informationen.</p>');
  const { data, error } = await supabase.from('project_information_items').select('id, text, information_date, documents').eq('project_id', projectId).eq('gantt_item_id', ganttItemId).order('information_date', { ascending: false });
  if (error) return (linkedInformationList.innerHTML = `<p class="table-empty">Fehler: ${escapeHtml(error.message)}</p>`);
  if (!data?.length) return (linkedInformationList.innerHTML = '<p class="table-empty">Keine verlinkten Informationen.</p>');
  linkedInformationList.innerHTML = data.map((item) => `<button type="button" class="linked-information-item" data-open-linked-information="${item.id}"><span>${formatDate(parseDateString(item.information_date))}</span><strong>${escapeHtml((item.text || '').slice(0, 120))}</strong><small>${Array.isArray(item.documents) ? item.documents.length : 0} Dokument(e)</small></button>`).join('');
  Array.from(linkedInformationList.querySelectorAll('[data-open-linked-information]')).forEach((button) => button.addEventListener('click', () => openInformationDetail(button.getAttribute('data-open-linked-information'))));
}
async function openInformationDetail(id) {
  const { data } = await supabase.from('project_information_items').select('id, text, information_date, gantt_item_id, documents, project_id').eq('id', id).eq('project_id', projectId).single();
  if (!data) return;
  informationDetailMeta.textContent = `Datum: ${formatDate(parseDateString(data.information_date))} · Projekt: ${data.project_id}${data.gantt_item_id ? ` · Gantt-Item: ${data.gantt_item_id}` : ''}`;
  informationDetailText.textContent = data.text || '';
  informationDetailDocuments.innerHTML = (data.documents || []).map((doc) => `<p><a href="#" data-document-path="${escapeHtml(doc.path)}">${escapeHtml(doc.filename || doc.path)}</a></p>`).join('') || '<p class="table-empty">Keine Dokumente.</p>';
  Array.from(informationDetailDocuments.querySelectorAll('[data-document-path]')).forEach((link) => link.addEventListener('click', async (event) => {
    event.preventDefault();
    const path = link.getAttribute('data-document-path');
    const { data: signed } = await supabase.storage.from('project-information-documents').createSignedUrl(path, 300);
    if (signed?.signedUrl) window.open(signed.signedUrl, '_blank', 'noopener');
  }));
  informationDetailDialog.showModal();
}

function renderSelectedResources() {
  resourceSelected.innerHTML = selectedResources.map((entry) => {
    const label = `${entry.first_name || ''} ${entry.last_name || ''}`.trim() || 'Ohne Namen';
    return `<span class="resource-chip">${escapeHtml(label)}<button type="button" data-remove-resource="${entry.uid}">×</button></span>`;
  }).join('');
  Array.from(resourceSelected.querySelectorAll('[data-remove-resource]')).forEach((button) => button.addEventListener('click', () => {
    selectedResources = selectedResources.filter((entry) => entry.uid !== button.getAttribute('data-remove-resource'));
    renderSelectedResources();
    renderResourceOptions();
  }));
}
function attachResizeHandleEvents() {
  Array.from(ganttGrid.querySelectorAll('[data-resize-item]')).forEach((handle) => {
    handle.addEventListener('pointerdown', (event) => startResourceResize(event));
  });
}

function startResourceResize(event) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();

  const handle = event.currentTarget;
  if (!(handle instanceof HTMLElement)) return;
  const itemId = handle.getAttribute('data-resize-item');
  const edge = handle.getAttribute('data-resize-edge');
  const item = scheduleItems.find((entry) => entry.id === itemId && entry.resources);
  if (!item || !edge) return;

  const bar = handle.closest('.gantt-row-bar');
  const track = bar?.parentElement;
  if (!(bar instanceof HTMLElement) || !(track instanceof HTMLElement)) return;

  const startDate = parseDateString(item.start_date);
  const endDate = parseDateString(item.end_date);
  const startX = event.clientX;

  const onMove = (moveEvent) => {
    const deltaDays = pixelDeltaToDays(moveEvent.clientX - startX, track);
    let nextStartIndex = diffInDays(visibleStartDate, startDate);
    let nextEndIndex = diffInDays(visibleStartDate, endDate);
    if (edge === 'left') nextStartIndex += deltaDays;
    if (edge === 'right') nextEndIndex += deltaDays;
    if (nextEndIndex < nextStartIndex) return;
    updateBarPreview(bar, nextStartIndex, nextEndIndex);
  };

  const onUp = async (upEvent) => {
    cleanup();
    const deltaDays = pixelDeltaToDays(upEvent.clientX - startX, track);
    if (!deltaDays) return;
    const nextStartDate = edge === 'left' ? addDays(startDate, deltaDays) : startDate;
    const nextEndDate = edge === 'right' ? addDays(endDate, deltaDays) : endDate;
    if (nextEndDate < nextStartDate) return renderGantt();
    await persistResourceDates(item, nextStartDate, nextEndDate);
  };

  const cleanup = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', cleanup);
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', cleanup);
}

function toDateString(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function closeScheduleDialog() { editingItemId = null; isResourceMode = false; selectedResources = []; scheduleForm?.reset(); scheduleDialog?.close(); }
function openTeamDialog(member = null) {
  if (!teamForm) return;
  teamDialogTitle.textContent = member ? 'Teammitglied bearbeiten' : 'Teammitglied hinzufügen';
  teamSubmitButton.textContent = member ? 'Aktualisieren' : 'Hinzufügen';
  deleteTeamMemberButton?.classList.toggle('is-hidden', !member);
  teamForm.reset();
  teamForm.elements.memberId.value = member?.id || '';
  teamForm.elements.firstName.value = member?.first_name || '';
  teamForm.elements.lastName.value = member?.last_name || '';
  teamForm.elements.role.value = member?.role || 'Lehrling';
  teamForm.elements.regieansatz.value = member?.regieansatz || '';
  teamForm.elements.sollerloes.value = member?.sollerloes || '';
  teamForm.elements.regieNummer.value = member?.regie_nummer || '';
  teamDialog?.showModal();
}
function closeTeamDialog() {
  teamForm?.reset();
  if (teamForm?.elements?.memberId) teamForm.elements.memberId.value = '';
  teamDialog?.close();
}
function parseDateString(value) { return new Date(`${value}T00:00:00`); }
function getWeekdayLabel(date) { return ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'][date.getDay()] || ''; }
function getStartOfIsoWeek(date) { const copy = new Date(date); const day = copy.getDay() || 7; copy.setDate(copy.getDate() - day + 1); copy.setHours(0, 0, 0, 0); return copy; }
function getIsoWeekNumber(date) { const target = new Date(date.valueOf()); target.setHours(0, 0, 0, 0); target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7)); const week1 = new Date(target.getFullYear(), 0, 4); return 1 + Math.round(((target - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7); }
function addDays(date, days) { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy; }
function diffInDays(fromDate, toDate) { return Math.floor((toDate - fromDate) / 86400000); }
function formatDate(date) { return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date); }
function escapeHtml(value) { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
