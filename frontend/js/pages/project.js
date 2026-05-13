import { requireAuth } from '../auth/guards.js';
import { getSupabaseClient } from '../services/supabaseClient.js';

const title = document.querySelector('[data-project-title]');
const subtitle = document.querySelector('[data-project-subtitle]');
const params = new URLSearchParams(window.location.search);
const projectId = params.get('id');

const navButtons = Array.from(document.querySelectorAll('[data-project-nav]'));
const sections = Array.from(document.querySelectorAll('[data-project-section]'));

const scheduleStatus = document.querySelector('[data-schedule-status]');
const scheduleForm = document.querySelector('[data-schedule-form]');
const addScheduleItemButton = document.querySelector('[data-add-schedule-item]');
const cancelScheduleItemButton = document.querySelector('[data-cancel-schedule-item]');
const ganttPrevButton = document.querySelector('[data-gantt-prev]');
const ganttNextButton = document.querySelector('[data-gantt-next]');
const ganttRange = document.querySelector('[data-gantt-range]');
const ganttGrid = document.querySelector('[data-gantt-grid]');

let supabase = null;
let scheduleItems = [];
let visibleStartDate = getStartOfIsoWeek(addDays(new Date(), -7));

await requireAuth();

initNavigation();

if (!projectId) {
  subtitle.textContent = 'Keine Projekt-ID übergeben.';
} else {
  supabase = await getSupabaseClient();
  await Promise.all([loadProject(), loadScheduleItems()]);
}

addScheduleItemButton?.addEventListener('click', () => {
  scheduleForm?.classList.remove('is-hidden');
  scheduleStatus.textContent = '';
});

cancelScheduleItemButton?.addEventListener('click', () => {
  scheduleForm?.reset();
  scheduleForm?.classList.add('is-hidden');
  scheduleStatus.textContent = '';
});

scheduleForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(scheduleForm);
  const titleValue = String(formData.get('title') || '').trim();
  const startDate = String(formData.get('startDate') || '');
  const endDate = String(formData.get('endDate') || '');

  if (!titleValue || !startDate || !endDate) {
    scheduleStatus.textContent = 'Bitte alle Felder ausfüllen.';
    return;
  }

  if (new Date(endDate) < new Date(startDate)) {
    scheduleStatus.textContent = 'Enddatum darf nicht vor Startdatum liegen.';
    return;
  }

  scheduleStatus.textContent = 'Speichere Eintrag ...';

  const { error } = await supabase.from('project_schedule_items').insert({
    project_id: projectId,
    title: titleValue,
    start_date: startDate,
    end_date: endDate,
  });

  if (error) {
    scheduleStatus.textContent = `Fehler beim Speichern: ${error.message}`;
    return;
  }

  scheduleStatus.textContent = 'Eintrag gespeichert.';
  scheduleForm.reset();
  scheduleForm.classList.add('is-hidden');
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

function initNavigation() {
  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-project-nav');
      setActiveSection(target);
    });
  });
}

function setActiveSection(sectionName) {
  navButtons.forEach((button) => {
    button.classList.toggle('is-active', button.getAttribute('data-project-nav') === sectionName);
  });

  sections.forEach((section) => {
    section.classList.toggle('is-hidden', section.getAttribute('data-project-section') !== sectionName);
  });
}

async function loadProject() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, kommissionsnummer, projektname, created_at')
    .eq('id', projectId)
    .single();

  if (error || !data) {
    subtitle.textContent = error?.message || 'Projekt konnte nicht geladen werden.';
    return;
  }

  title.textContent = data.projektname;
  subtitle.textContent = `Kommissionsnummer ${data.kommissionsnummer} · Erstellt am ${new Date(data.created_at).toLocaleDateString('de-DE')}`;
}

async function loadScheduleItems() {
  scheduleStatus.textContent = 'Lade Ablauf-Einträge ...';

  const { data, error } = await supabase
    .from('project_schedule_items')
    .select('id, title, start_date, end_date, created_at')
    .eq('project_id', projectId)
    .order('start_date', { ascending: true });

  if (error) {
    scheduleStatus.textContent = `Fehler beim Laden: ${error.message}`;
    scheduleItems = [];
    renderGantt();
    return;
  }

  scheduleItems = data || [];
  scheduleStatus.textContent = scheduleItems.length ? `${scheduleItems.length} Einträge geladen.` : 'Noch keine Einträge vorhanden.';
  renderGantt();
}

function renderGantt() {
  if (!ganttGrid) {
    return;
  }

  const visibleEndDate = addDays(visibleStartDate, 34);
  const weeks = [];

  for (let week = 0; week < 5; week += 1) {
    const weekStart = addDays(visibleStartDate, week * 7);
    weeks.push({
      label: `KW ${getIsoWeekNumber(weekStart)}`,
      start: weekStart,
    });
  }

  ganttRange.textContent = `${formatDate(visibleStartDate)} – ${formatDate(visibleEndDate)}`;

  const headerCells = weeks
    .map(
      (week) => `<div class="gantt-week-header" style="grid-column: span 7;">${week.label}<span>${formatDate(week.start)}</span></div>`,
    )
    .join('');

  const dayCells = Array.from({ length: 35 })
    .map((_, index) => {
      const day = addDays(visibleStartDate, index);
      return `<div class="gantt-day-cell">${day.toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2)}<span>${day.getDate()}</span></div>`;
    })
    .join('');

  const visibleItems = scheduleItems.filter((item) => {
    const itemStart = parseDateString(item.start_date);
    const itemEnd = parseDateString(item.end_date);
    return itemEnd >= visibleStartDate && itemStart <= visibleEndDate;
  });

  const rows = visibleItems
    .map((item) => {
      const itemStart = parseDateString(item.start_date);
      const itemEnd = parseDateString(item.end_date);
      const clampedStart = itemStart < visibleStartDate ? visibleStartDate : itemStart;
      const clampedEnd = itemEnd > visibleEndDate ? visibleEndDate : itemEnd;
      const startOffsetDays = diffInDays(visibleStartDate, clampedStart);
      const endOffsetDays = diffInDays(visibleStartDate, clampedEnd);
      const spanDays = endOffsetDays - startOffsetDays + 1;

      return `
        <div class="gantt-row">
          <div class="gantt-row-title">${escapeHtml(item.title)}</div>
          <div class="gantt-row-track">
            <div class="gantt-row-bar" style="left: calc(${startOffsetDays} * (100% / 35)); width: calc(${spanDays} * (100% / 35));"></div>
          </div>
        </div>
      `;
    })
    .join('');

  ganttGrid.innerHTML = `
    <div class="gantt-grid-head">${headerCells}</div>
    <div class="gantt-grid-days">${dayCells}</div>
    <div class="gantt-rows">${rows || '<p class="table-empty">Keine Einträge im sichtbaren Zeitraum.</p>'}</div>
  `;
}

function parseDateString(value) {
  return new Date(`${value}T00:00:00`);
}

function getStartOfIsoWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getIsoWeekNumber(date) {
  const target = new Date(date.valueOf());
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const week1 = new Date(target.getFullYear(), 0, 4);
  return 1 + Math.round(((target - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function diffInDays(fromDate, toDate) {
  return Math.floor((toDate - fromDate) / 86400000);
}

function formatDate(date) {
  return date.toLocaleDateString('de-DE');
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
