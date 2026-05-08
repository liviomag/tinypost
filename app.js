(() => {
  'use strict';

  const GANTT_STORAGE_KEY = 'ganttEntries';

  const state = {
    supabase: null,
    loading: false,
    authScreen: 'login',
    ganttEntries: [],
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
    ganttModal: document.getElementById('gantt-modal'),
    ganttOpenModalBtn: document.getElementById('gantt-open-modal-btn'),
    ganttCloseModalBtn: document.getElementById('gantt-close-modal-btn'),
    ganttCancelBtn: document.getElementById('gantt-cancel-btn'),
  };

  function setLoading(isLoading, text = 'Lade…') {
    state.loading = isLoading;
    dom.loading.textContent = text;
    dom.loading.classList.toggle('hidden', !isLoading);

    [
      dom.loginBtn,
      dom.registerBtn,
      dom.registerSubmitBtn,
      dom.backToLoginBtn,
      dom.forgotPasswordBtn,
      dom.logoutBtn,
    ].forEach((btn) => {
      if (btn) btn.disabled = isLoading;
    });
  }

  function showAlert(type, message) {
    dom.alert.className = `alert ${type}`;
    dom.alert.textContent = message;
    dom.alert.classList.remove('hidden');
  }

  function hideAlert() {
    dom.alert.classList.add('hidden');
    dom.alert.textContent = '';
  }

  function setAuthScreen(screen) {
    state.authScreen = screen;
    dom.loginScreen.classList.toggle('hidden', screen !== 'login');
    dom.registerScreen.classList.toggle('hidden', screen !== 'register');
  }

  function showAuthView() {
    dom.authView.classList.remove('hidden');
    dom.dashboardView.classList.add('hidden');
    setAuthScreen('login');
  }

  function showDashboardView(user) {
    dom.authView.classList.add('hidden');
    dom.dashboardView.classList.remove('hidden');
    dom.dashboardView.classList.add('dashboard-expanded');
    dom.userInfo.textContent = user?.email ? `Eingeloggt als ${user.email}` : '';
    renderGanttChart();
  }

  function openGanttModal() {
    dom.ganttModal.classList.remove('hidden');
  }

  function closeGanttModal() {
    dom.ganttModal.classList.add('hidden');
    dom.ganttForm.reset();
  }

  function loadGanttEntries() {
    try {
      const raw = localStorage.getItem(GANTT_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function saveGanttEntries() {
    localStorage.setItem(GANTT_STORAGE_KEY, JSON.stringify(state.ganttEntries));
  }

  function getISOWeek(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);
    return { year: utcDate.getUTCFullYear(), week };
  }

  function getStartOfISOWeek(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay() || 7;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - day + 1);
    return d;
  }

  function generateCalendarWeeks(count = 12) {
    const weeks = [];
    const currentWeekStart = getStartOfISOWeek(new Date());
    for (let i = 0; i < count; i += 1) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() + i * 7);
      const { year, week } = getISOWeek(weekStart.toISOString().slice(0, 10));
      weeks.push({ year, week, key: `${year}-KW${week}` });
    }
    return weeks;
  }

  function getWeekIndex(weeks, dateString) {
    const target = getISOWeek(dateString);
    return weeks.findIndex((w) => w.year === target.year && w.week === target.week);
  }

  function addGanttEntry(entry) {
    state.ganttEntries.push(entry);
    saveGanttEntries();
    renderGanttChart();
  }

  function deleteGanttEntry(id) {
    state.ganttEntries = state.ganttEntries.filter((entry) => entry.id !== id);
    saveGanttEntries();
    renderGanttChart();
  }

  function renderGanttChart() {
    if (!dom.ganttChart || !dom.ganttEmpty) return;

    const weeks = generateCalendarWeeks(12);
    dom.ganttChart.innerHTML = '';

    if (!state.ganttEntries.length) {
      dom.ganttEmpty.classList.remove('hidden');
      return;
    }

    dom.ganttEmpty.classList.add('hidden');

    const header = document.createElement('div');
    header.className = 'gantt-grid gantt-header';

    const headLabel = document.createElement('div');
    headLabel.className = 'gantt-row-label';
    headLabel.textContent = 'Eintrag';
    header.appendChild(headLabel);

    weeks.forEach((week, idx) => {
      const cell = document.createElement('div');
      cell.className = 'gantt-week-cell';
      if ((idx + 1) % 4 === 0) cell.classList.add('week-block-end');
      cell.textContent = `KW ${week.week}`;
      header.appendChild(cell);
    });

    dom.ganttChart.appendChild(header);

    state.ganttEntries.forEach((entry) => {
      const row = document.createElement('div');
      row.className = 'gantt-grid gantt-row';

      const label = document.createElement('div');
      label.className = 'gantt-row-label';

      const name = document.createElement('span');
      name.textContent = entry.name;
      label.appendChild(name);

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'btn gantt-delete-btn';
      deleteButton.textContent = 'Löschen';
      deleteButton.addEventListener('click', () => deleteGanttEntry(entry.id));
      label.appendChild(deleteButton);

      row.appendChild(label);

      const startIndex = getWeekIndex(weeks, entry.startDate);
      const endIndex = getWeekIndex(weeks, entry.endDate);

      weeks.forEach((_, idx) => {
        const slot = document.createElement('div');
        slot.className = 'gantt-week-slot';
        if ((idx + 1) % 4 === 0) slot.classList.add('week-block-end');

        if (startIndex !== -1 && endIndex !== -1 && idx >= startIndex && idx <= endIndex) {
          const bar = document.createElement('div');
          bar.className = 'gantt-bar';
          if (idx === startIndex) bar.textContent = entry.name;
          slot.appendChild(bar);
        }

        row.appendChild(slot);
      });

      dom.ganttChart.appendChild(row);
    });
  }

  function getCredentialsFromConfig(configData) {
    const url = configData?.SUPABASE_URL;
    const anonKey = configData?.SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error('SUPABASE_URL oder SUPABASE_ANON_KEY fehlt in supabase-config.json.');
    }

    return { url, anonKey };
  }

  async function loadConfig() {
    let response;
    try {
      response = await fetch('./supabase-config.json', { cache: 'no-store' });
    } catch (_error) {
      throw new Error('Konfigurationsdatei konnte nicht geladen werden. Läuft die App über einen lokalen Webserver?');
    }

    if (!response.ok) {
      throw new Error(`supabase-config.json nicht gefunden (HTTP ${response.status}).`);
    }

    try {
      return await response.json();
    } catch (_error) {
      throw new Error('supabase-config.json enthält ungültiges JSON.');
    }
  }

  async function initializeSupabase() {
    setLoading(true, 'Initialisiere Supabase…');
    hideAlert();

    try {
      const config = await loadConfig();
      const { url, anonKey } = getCredentialsFromConfig(config);

      if (!window.supabase || !window.supabase.createClient) {
        throw new Error('Supabase Library wurde nicht geladen. Prüfe die CDN-Einbindung in index.html.');
      }

      state.supabase = window.supabase.createClient(url, anonKey);

      const { data, error } = await state.supabase.auth.getSession();
      if (error) throw error;

      if (data.session?.user) {
        showDashboardView(data.session.user);
      } else {
        showAuthView();
      }

      state.supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          showDashboardView(session.user);
        } else {
          showAuthView();
        }
      });
    } catch (error) {
      showAuthView();
      showAlert('error', `Initialisierung fehlgeschlagen: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function getLoginValues() {
    return {
      email: dom.email.value.trim(),
      password: dom.password.value,
    };
  }

  function getRegisterValues() {
    return {
      email: dom.registerEmail.value.trim(),
      password: dom.registerPassword.value,
      passwordRepeat: dom.registerPasswordRepeat.value,
    };
  }

  async function login() {
    const { email, password } = getLoginValues();
    hideAlert();

    if (!email || !password) {
      showAlert('error', 'Bitte E-Mail und Passwort eingeben.');
      return;
    }

    setLoading(true, 'Login läuft…');
    const { error } = await state.supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      showAlert('error', `Login fehlgeschlagen: ${error.message}`);
      return;
    }

    showAlert('success', 'Login erfolgreich.');
  }

  async function register() {
    const { email, password, passwordRepeat } = getRegisterValues();
    hideAlert();

    if (!email || !password || !passwordRepeat) {
      showAlert('error', 'Bitte E-Mail, Passwort und Passwort wiederholen ausfüllen.');
      return;
    }

    if (password !== passwordRepeat) {
      showAlert('error', 'Die eingegebenen Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true, 'Registrierung läuft…');
    const { error } = await state.supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      showAlert('error', `Registrierung fehlgeschlagen: ${error.message}`);
      return;
    }

    showAlert('success', 'Registrierung gestartet. Prüfe dein Postfach für die Bestätigung.');
  }

  async function sendPasswordReset() {
    const email = dom.email.value.trim();
    hideAlert();

    if (!email) {
      showAlert('error', 'Bitte zuerst eine E-Mail-Adresse eingeben.');
      return;
    }

    setLoading(true, 'Passwort vergessen wird vorbereitet…');
    const { error } = await state.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname,
      },
    });
    setLoading(false);

    if (error) {
      showAlert('error', `Passwort vergessen konnte nicht gestartet werden: ${error.message}`);
      return;
    }

    showAlert('success', 'E-Mail zum Zurücksetzen wurde gesendet. Prüfe dein E-Mail-Postfach.');
  }

  async function logout() {
    hideAlert();
    setLoading(true, 'Logout läuft…');
    const { error } = await state.supabase.auth.signOut();
    setLoading(false);

    if (error) {
      showAlert('error', `Logout fehlgeschlagen: ${error.message}`);
      return;
    }

    showAlert('success', 'Du wurdest ausgeloggt.');
  }

  function registerEventHandlers() {
    dom.authForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!state.supabase || state.loading) return;
      login();
    });

    dom.registerBtn.addEventListener('click', () => {
      if (state.loading) return;
      hideAlert();
      setAuthScreen('register');
      dom.registerEmail.value = dom.email.value.trim();
    });

    dom.registerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!state.supabase || state.loading) return;
      register();
    });

    dom.backToLoginBtn.addEventListener('click', () => {
      if (state.loading) return;
      hideAlert();
      setAuthScreen('login');
      dom.email.value = dom.registerEmail.value.trim();
    });

    dom.forgotPasswordBtn.addEventListener('click', () => {
      if (!state.supabase || state.loading) return;
      sendPasswordReset();
    });

    dom.logoutBtn.addEventListener('click', () => {
      if (!state.supabase || state.loading) return;
      logout();
    });

    dom.ganttOpenModalBtn.addEventListener('click', () => {
      if (state.loading) return;
      openGanttModal();
    });

    dom.ganttCloseModalBtn.addEventListener('click', closeGanttModal);
    dom.ganttCancelBtn.addEventListener('click', closeGanttModal);

    dom.ganttModal.addEventListener('click', (event) => {
      if (event.target === dom.ganttModal) closeGanttModal();
    });

    dom.ganttForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = dom.ganttName.value.trim();
      const startDate = dom.ganttStart.value;
      const endDate = dom.ganttEnd.value;

      if (!name || !startDate || !endDate) {
        showAlert('error', 'Bitte Name, Startdatum und Enddatum für den Gantt-Eintrag ausfüllen.');
        return;
      }

      if (startDate > endDate) {
        showAlert('error', 'Das Enddatum darf nicht vor dem Startdatum liegen.');
        return;
      }

      addGanttEntry({ id: crypto.randomUUID(), name, startDate, endDate });
      closeGanttModal();
      showAlert('success', 'Gantt-Eintrag wurde lokal gespeichert.');
    });
  }

  state.ganttEntries = loadGanttEntries();
  registerEventHandlers();
  initializeSupabase();
})();
