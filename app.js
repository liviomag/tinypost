(() => {
  'use strict';

  const GANTT_STORAGE_KEY = 'ganttEntries';
  const VISIBLE_WEEKS = 6;
  const DAYS_PER_WEEK = 7;

  const state = {
    supabase: null,
    loading: false,
    authScreen: 'login',
    ganttEntries: [],
    weekOffset: 0,
  };

  const dom = {
    loading: document.getElementById('loading'),
    alert: document.getElementById('alert'),
    authView: document.getElementById('auth-view'),
    loginScreen: document.getElementById('login-screen'),
    registerScreen: document.getElementById('register-screen'),
    dashboardView: document.getElementById('dashboard-view'),
    authForm: document.getElementById('auth-form'),
    registerForm: document.getElementById('register-form'),
    email: document.getElementById('email'),
    password: document.getElementById('password'),
    registerEmail: document.getElementById('register-email'),
    registerPassword: document.getElementById('register-password'),
    registerPasswordRepeat: document.getElementById('register-password-repeat'),
    loginBtn: document.getElementById('login-btn'),
    registerBtn: document.getElementById('register-btn'),
    registerSubmitBtn: document.getElementById('register-submit-btn'),
    backToLoginBtn: document.getElementById('back-to-login-btn'),
    forgotPasswordBtn: document.getElementById('forgot-password-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    userInfo: document.getElementById('user-info'),
    ganttForm: document.getElementById('gantt-form'),
    ganttName: document.getElementById('gantt-name'),
    ganttStart: document.getElementById('gantt-start'),
    ganttEnd: document.getElementById('gantt-end'),
    ganttChart: document.getElementById('gantt-chart'),
    ganttEmpty: document.getElementById('gantt-empty'),
    openGanttModalBtn: document.getElementById('open-gantt-modal-btn'),
    closeGanttModalBtn: document.getElementById('close-gantt-modal-btn'),
    ganttModal: document.getElementById('gantt-modal'),
    ganttPrevWeekBtn: document.getElementById('gantt-prev-week-btn'),
    ganttNextWeekBtn: document.getElementById('gantt-next-week-btn'),
  };

  const DAY_MS = 86400000;
  const toIsoDate = (date) => date.toISOString().slice(0, 10);

  function parseDate(dateString) {
    return new Date(`${dateString}T00:00:00`);
  }

  function addDays(date, days) {
    const clone = new Date(date);
    clone.setDate(clone.getDate() + days);
    return clone;
  }

  function startOfISOWeek(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return d;
  }

  function getISOWeekInfo(date) {
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((utcDate - yearStart) / DAY_MS) + 1) / 7);
    return { year: utcDate.getUTCFullYear(), week };
  }

  function getVisibleTimeline() {
    const currentWeekStart = startOfISOWeek(new Date());
    const timelineStart = addDays(currentWeekStart, (state.weekOffset - 1) * DAYS_PER_WEEK);
    const weeks = [];
    for (let i = 0; i < VISIBLE_WEEKS; i += 1) {
      const weekStart = addDays(timelineStart, i * DAYS_PER_WEEK);
      const info = getISOWeekInfo(weekStart);
      weeks.push({ ...info, weekStart });
    }
    return { weeks, timelineStart, timelineEnd: addDays(timelineStart, VISIBLE_WEEKS * DAYS_PER_WEEK - 1) };
  }

  function diffInDaysInclusive(fromDate, toDate) {
    return Math.floor((toDate - fromDate) / DAY_MS) + 1;
  }

  function setLoading(isLoading, text = 'Lade…') { /* unchanged */
    state.loading = isLoading;
    dom.loading.textContent = text;
    dom.loading.classList.toggle('hidden', !isLoading);
    [dom.loginBtn,dom.registerBtn,dom.registerSubmitBtn,dom.backToLoginBtn,dom.forgotPasswordBtn,dom.logoutBtn,dom.openGanttModalBtn,dom.closeGanttModalBtn,dom.ganttPrevWeekBtn,dom.ganttNextWeekBtn].forEach((btn)=>{ if (btn) btn.disabled = isLoading;});
  }
  function showAlert(type, message) { dom.alert.className = `alert ${type}`; dom.alert.textContent = message; dom.alert.classList.remove('hidden'); }
  function hideAlert() { dom.alert.classList.add('hidden'); dom.alert.textContent = ''; }
  function setAuthScreen(screen) { state.authScreen = screen; dom.loginScreen.classList.toggle('hidden', screen !== 'login'); dom.registerScreen.classList.toggle('hidden', screen !== 'register'); }
  function showAuthView() { dom.authView.classList.remove('hidden'); dom.dashboardView.classList.add('hidden'); closeGanttModal(); setAuthScreen('login'); }
  function showDashboardView(user) { dom.authView.classList.add('hidden'); dom.dashboardView.classList.remove('hidden'); dom.userInfo.textContent = user?.email ? `Eingeloggt als ${user.email}` : ''; renderGanttChart(); }

  function openGanttModal() { dom.ganttModal.classList.remove('hidden'); }
  function closeGanttModal() { dom.ganttModal.classList.add('hidden'); }

  function loadGanttEntries() { try { const raw = localStorage.getItem(GANTT_STORAGE_KEY); if (!raw) return []; const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
  function saveGanttEntries() { localStorage.setItem(GANTT_STORAGE_KEY, JSON.stringify(state.ganttEntries)); }
  function addGanttEntry(entry) { state.ganttEntries.push(entry); saveGanttEntries(); renderGanttChart(); }
  function deleteGanttEntry(id) { state.ganttEntries = state.ganttEntries.filter((entry) => entry.id !== id); saveGanttEntries(); renderGanttChart(); }

  function renderGanttChart() {
    const { weeks, timelineStart, timelineEnd } = getVisibleTimeline();
    dom.ganttChart.innerHTML = '';
    if (!state.ganttEntries.length) { dom.ganttEmpty.classList.remove('hidden'); return; }
    dom.ganttEmpty.classList.add('hidden');

    const grid = document.createElement('div');
    grid.className = 'gantt-timeline-grid';
    grid.style.gridTemplateColumns = `220px repeat(${VISIBLE_WEEKS * DAYS_PER_WEEK}, minmax(18px, 1fr))`;

    const headerLabel = document.createElement('div');
    headerLabel.className = 'gantt-row-label gantt-header-label';
    headerLabel.textContent = 'Eintrag';
    grid.appendChild(headerLabel);

    weeks.forEach((week) => {
      const cell = document.createElement('div');
      cell.className = 'gantt-week-cell';
      cell.style.gridColumn = `span ${DAYS_PER_WEEK}`;
      cell.textContent = `KW ${week.week}`;
      grid.appendChild(cell);
    });

    state.ganttEntries.forEach((entry) => {
      const entryStart = parseDate(entry.startDate);
      const entryEnd = parseDate(entry.endDate);
      if (entryEnd < timelineStart || entryStart > timelineEnd) return;

      const clippedStart = entryStart < timelineStart ? timelineStart : entryStart;
      const clippedEnd = entryEnd > timelineEnd ? timelineEnd : entryEnd;
      const startOffset = Math.max(0, diffInDaysInclusive(timelineStart, clippedStart) - 1);
      const spanDays = diffInDaysInclusive(clippedStart, clippedEnd);

      const label = document.createElement('div');
      label.className = 'gantt-row-label';
      label.innerHTML = `<span>${entry.name}</span>`;
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button'; deleteButton.className = 'btn gantt-delete-btn'; deleteButton.textContent = 'Löschen';
      deleteButton.addEventListener('click', () => deleteGanttEntry(entry.id));
      label.appendChild(deleteButton);
      grid.appendChild(label);

      const track = document.createElement('div');
      track.className = 'gantt-track';
      track.style.gridColumn = `2 / span ${VISIBLE_WEEKS * DAYS_PER_WEEK}`;

      const bar = document.createElement('div');
      bar.className = 'gantt-bar';
      bar.style.left = `calc(${(startOffset / (VISIBLE_WEEKS * DAYS_PER_WEEK)) * 100}% + 1px)`;
      bar.style.width = `calc(${(spanDays / (VISIBLE_WEEKS * DAYS_PER_WEEK)) * 100}% - 2px)`;
      bar.textContent = entry.name;

      track.appendChild(bar);
      grid.appendChild(track);
    });

    dom.ganttChart.appendChild(grid);
  }

  function getCredentialsFromConfig(configData) { const url = configData?.SUPABASE_URL; const anonKey = configData?.SUPABASE_ANON_KEY; if (!url || !anonKey) throw new Error('SUPABASE_URL oder SUPABASE_ANON_KEY fehlt in supabase-config.json.'); return { url, anonKey }; }
  async function loadConfig() { let response; try { response = await fetch('./supabase-config.json', { cache: 'no-store' }); } catch { throw new Error('Konfigurationsdatei konnte nicht geladen werden. Läuft die App über einen lokalen Webserver?'); } if (!response.ok) throw new Error(`supabase-config.json nicht gefunden (HTTP ${response.status}).`); try { return await response.json(); } catch { throw new Error('supabase-config.json enthält ungültiges JSON.'); } }
  async function initializeSupabase() { setLoading(true, 'Initialisiere Supabase…'); hideAlert(); try { const config = await loadConfig(); const { url, anonKey } = getCredentialsFromConfig(config); if (!window.supabase || !window.supabase.createClient) throw new Error('Supabase Library wurde nicht geladen. Prüfe die CDN-Einbindung in index.html.'); state.supabase = window.supabase.createClient(url, anonKey); const { data, error } = await state.supabase.auth.getSession(); if (error) throw error; if (data.session?.user) { showDashboardView(data.session.user); } else { showAuthView(); } state.supabase.auth.onAuthStateChange((_event, session) => { if (session?.user) { showDashboardView(session.user); } else { showAuthView(); } }); } catch (error) { showAuthView(); showAlert('error', `Initialisierung fehlgeschlagen: ${error.message}`); } finally { setLoading(false); } }
  function getLoginValues() { return { email: dom.email.value.trim(), password: dom.password.value }; }
  function getRegisterValues() { return { email: dom.registerEmail.value.trim(), password: dom.registerPassword.value, passwordRepeat: dom.registerPasswordRepeat.value }; }
  async function login() { const { email, password } = getLoginValues(); hideAlert(); if (!email || !password) { showAlert('error', 'Bitte E-Mail und Passwort eingeben.'); return; } setLoading(true, 'Login läuft…'); const { error } = await state.supabase.auth.signInWithPassword({ email, password }); setLoading(false); if (error) { showAlert('error', `Login fehlgeschlagen: ${error.message}`); return; } showAlert('success', 'Login erfolgreich.'); }
  async function register() { const { email, password, passwordRepeat } = getRegisterValues(); hideAlert(); if (!email || !password || !passwordRepeat) { showAlert('error', 'Bitte E-Mail, Passwort und Passwort wiederholen ausfüllen.'); return; } if (password !== passwordRepeat) { showAlert('error', 'Die eingegebenen Passwörter stimmen nicht überein.'); return; } setLoading(true, 'Registrierung läuft…'); const { error } = await state.supabase.auth.signUp({ email, password }); setLoading(false); if (error) { showAlert('error', `Registrierung fehlgeschlagen: ${error.message}`); return; } showAlert('success', 'Registrierung gestartet. Prüfe dein Postfach für die Bestätigung.'); }
  async function sendPasswordReset() { const email = dom.email.value.trim(); hideAlert(); if (!email) { showAlert('error', 'Bitte zuerst eine E-Mail-Adresse eingeben.'); return; } setLoading(true, 'Passwort vergessen wird vorbereitet…'); const { error } = await state.supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + window.location.pathname } }); setLoading(false); if (error) { showAlert('error', `Passwort vergessen konnte nicht gestartet werden: ${error.message}`); return; } showAlert('success', 'E-Mail zum Zurücksetzen wurde gesendet. Prüfe dein E-Mail-Postfach.'); }
  async function logout() { hideAlert(); setLoading(true, 'Logout läuft…'); const { error } = await state.supabase.auth.signOut(); setLoading(false); if (error) { showAlert('error', `Logout fehlgeschlagen: ${error.message}`); return; } showAlert('success', 'Du wurdest ausgeloggt.'); }

  function registerEventHandlers() {
    dom.authForm.addEventListener('submit', (event) => { event.preventDefault(); if (!state.supabase || state.loading) return; login(); });
    dom.registerBtn.addEventListener('click', () => { if (state.loading) return; hideAlert(); setAuthScreen('register'); dom.registerEmail.value = dom.email.value.trim(); });
    dom.registerForm.addEventListener('submit', (event) => { event.preventDefault(); if (!state.supabase || state.loading) return; register(); });
    dom.backToLoginBtn.addEventListener('click', () => { if (state.loading) return; hideAlert(); setAuthScreen('login'); dom.email.value = dom.registerEmail.value.trim(); });
    dom.forgotPasswordBtn.addEventListener('click', () => { if (!state.supabase || state.loading) return; sendPasswordReset(); });
    dom.logoutBtn.addEventListener('click', () => { if (!state.supabase || state.loading) return; logout(); });
    dom.openGanttModalBtn.addEventListener('click', () => openGanttModal());
    dom.closeGanttModalBtn.addEventListener('click', () => closeGanttModal());
    dom.ganttModal.addEventListener('click', (event) => { if (event.target === dom.ganttModal) closeGanttModal(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !dom.ganttModal.classList.contains('hidden')) closeGanttModal(); });
    dom.ganttPrevWeekBtn.addEventListener('click', () => { state.weekOffset -= 1; renderGanttChart(); });
    dom.ganttNextWeekBtn.addEventListener('click', () => { state.weekOffset += 1; renderGanttChart(); });

    dom.ganttForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = dom.ganttName.value.trim();
      const startDate = dom.ganttStart.value;
      const endDate = dom.ganttEnd.value;
      if (!name || !startDate || !endDate) { showAlert('error', 'Bitte Name, Startdatum und Enddatum für den Gantt-Eintrag ausfüllen.'); return; }
      if (startDate > endDate) { showAlert('error', 'Das Enddatum darf nicht vor dem Startdatum liegen.'); return; }
      addGanttEntry({ id: crypto.randomUUID(), name, startDate, endDate });
      dom.ganttForm.reset();
      closeGanttModal();
      showAlert('success', 'Gantt-Eintrag wurde lokal gespeichert.');
    });
  }

  state.ganttEntries = loadGanttEntries();
  registerEventHandlers();
  initializeSupabase();
})();
