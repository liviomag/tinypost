(() => {
  'use strict';

  const state = {
    supabase: null,
    loading: false,
    authScreen: 'login',
    currentUser: null,
    orders: [],
    selectedOrderId: null,
    selectedOrderName: null,
    ganttEntries: [],
  };

  const dom = {
    statusCard: document.getElementById('status-card'),
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
    orderList: document.getElementById('order-list'),
    orderEmpty: document.getElementById('order-empty'),
    orderForm: document.getElementById('order-form'),
    orderName: document.getElementById('order-name'),
    selectedOrderLabel: document.getElementById('selected-order-label'),
    ordersOverview: document.getElementById('orders-overview'),
    timelineDetail: document.getElementById('timeline-detail'),
    backToOrdersBtn: document.getElementById('back-to-orders-btn'),
  };

  function setLoading(isLoading, text = 'Lade…') {
    state.loading = isLoading;
    dom.loading.textContent = text;
    dom.loading.classList.toggle('hidden', !isLoading);
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
    dom.statusCard.classList.remove('dashboard-fullscreen');
    setAuthScreen('login');
  }

  function showDashboardView(user) {
    state.currentUser = user;
    dom.authView.classList.add('hidden');
    dom.dashboardView.classList.remove('hidden');
    dom.dashboardView.classList.add('dashboard-expanded');
    dom.statusCard.classList.add('dashboard-fullscreen');
  }

  function showOrdersOverview() {
    dom.ordersOverview.classList.remove('hidden');
    dom.timelineDetail.classList.add('hidden');
  }

  function showTimelineDetail() {
    dom.ordersOverview.classList.add('hidden');
    dom.timelineDetail.classList.remove('hidden');
  }

  function openGanttModal() { dom.ganttModal.classList.remove('hidden'); }
  function closeGanttModal() { dom.ganttModal.classList.add('hidden'); dom.ganttForm.reset(); }

  async function fetchOrders() {
    const { data, error } = await state.supabase
      .from('orders')
      .select('id,name,created_at,user_id')
      .order('created_at', { ascending: false });
    if (error) throw error;
    state.orders = data ?? [];
    if (!state.selectedOrderId || !state.orders.find((o) => o.id === state.selectedOrderId)) {
      state.selectedOrderId = state.orders[0]?.id ?? null;
    }
    renderOrderList();
  }

  async function fetchGanttEntries() {
    if (!state.selectedOrderId) {
      state.ganttEntries = [];
      renderGanttChart();
      return;
    }
    const { data, error } = await state.supabase
      .from('gantt_entries')
      .select('id,name,start_date,end_date')
      .eq('order_id', state.selectedOrderId)
      .order('start_date', { ascending: true });
    if (error) throw error;
    state.ganttEntries = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      startDate: row.start_date,
      endDate: row.end_date,
    }));
    renderGanttChart();
  }

  function renderOrderList() {
    dom.orderList.innerHTML = '';
    if (!state.orders.length) {
      dom.orderEmpty.classList.remove('hidden');
      dom.selectedOrderLabel.textContent = 'Kein Auftrag ausgewählt';
      return;
    }
    dom.orderEmpty.classList.add('hidden');

    state.orders.forEach((order) => {
      const row = document.createElement('tr');
      row.className = order.id === state.selectedOrderId ? 'order-row-active' : '';
      row.tabIndex = 0;

      const nameCell = document.createElement('td');
      nameCell.textContent = order.name;
      const createdAtCell = document.createElement('td');
      createdAtCell.textContent = new Date(order.created_at).toLocaleDateString('de-DE');
      const createdByCell = document.createElement('td');
      createdByCell.textContent = order.user_id;

      row.appendChild(nameCell);
      row.appendChild(createdAtCell);
      row.appendChild(createdByCell);

      const openOrder = async () => {
        state.selectedOrderId = order.id;
        state.selectedOrderName = order.name;
        renderOrderList();
        await fetchGanttEntries();
        showTimelineDetail();
      };
      row.addEventListener('click', openOrder);
      row.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openOrder();
        }
      });
      dom.orderList.appendChild(row);
    });

    const selected = state.orders.find((order) => order.id === state.selectedOrderId);
    dom.selectedOrderLabel.textContent = selected ? `Auftrag: ${selected.name}` : 'Kein Auftrag ausgewählt';
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
      weeks.push({ year, week });
    }
    return weeks;
  }

  function renderGanttChart() {
    const weeks = generateCalendarWeeks(12);
    dom.ganttChart.innerHTML = '';

    if (!state.selectedOrderId || !state.ganttEntries.length) {
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
    weeks.forEach((week) => {
      const cell = document.createElement('div');
      cell.className = 'gantt-week-cell';
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

      const start = new Date(`${entry.startDate}T00:00:00`);
      const end = new Date(`${entry.endDate}T23:59:59`);
      weeks.forEach((week) => {
        const slot = document.createElement('div');
        slot.className = 'gantt-week-slot';
        const weekStart = getStartOfISOWeek(new Date(Date.UTC(week.year, 0, 4 + (week.week - 1) * 7)));
        const monday = new Date(Date.UTC(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()));
        for (let dayIdx = 0; dayIdx < 7; dayIdx += 1) {
          const dayCell = document.createElement('div');
          dayCell.className = 'gantt-day-slot';
          const dayDate = new Date(monday);
          dayDate.setUTCDate(monday.getUTCDate() + dayIdx);
          const localDay = new Date(dayDate.getUTCFullYear(), dayDate.getUTCMonth(), dayDate.getUTCDate());
          if (localDay >= start && localDay <= end) dayCell.classList.add('active');
          slot.appendChild(dayCell);
        }
        row.appendChild(slot);
      });
      dom.ganttChart.appendChild(row);
    });
  }

  async function createOrder(name) {
    const { error } = await state.supabase.from('orders').insert({ name, user_id: state.currentUser.id });
    if (error) throw error;
    await fetchOrders();
    await fetchGanttEntries();
  }

  async function createGanttEntry(name, startDate, endDate) {
    const { error } = await state.supabase.from('gantt_entries').insert({
      order_id: state.selectedOrderId,
      user_id: state.currentUser.id,
      name,
      start_date: startDate,
      end_date: endDate,
    });
    if (error) throw error;
    await fetchGanttEntries();
  }

  async function deleteGanttEntry(id) {
    const { error } = await state.supabase.from('gantt_entries').delete().eq('id', id);
    if (error) {
      showAlert('error', `Löschen fehlgeschlagen: ${error.message}`);
      return;
    }
    await fetchGanttEntries();
  }

  function getCredentialsFromConfig(configData) {
    const url = configData?.SUPABASE_URL;
    const anonKey = configData?.SUPABASE_ANON_KEY;
    if (!url || !anonKey) throw new Error('SUPABASE_URL oder SUPABASE_ANON_KEY fehlt in supabase-config.json.');
    return { url, anonKey };
  }

  async function loadConfig() { const response = await fetch('./supabase-config.json', { cache: 'no-store' }); return response.json(); }

  async function initializeSupabase() {
    setLoading(true, 'Initialisiere Supabase…');
    try {
      const config = await loadConfig();
      const { url, anonKey } = getCredentialsFromConfig(config);
      state.supabase = window.supabase.createClient(url, anonKey);
      const { data } = await state.supabase.auth.getSession();
      if (data.session?.user) {
        showDashboardView(data.session.user);
        showOrdersOverview();
        await fetchOrders();
        await fetchGanttEntries();
      } else showAuthView();
      state.supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          showDashboardView(session.user);
          showOrdersOverview();
          await fetchOrders();
          await fetchGanttEntries();
        } else showAuthView();
      });
    } catch (error) {
      showAuthView();
      showAlert('error', `Initialisierung fehlgeschlagen: ${error.message}`);
    } finally { setLoading(false); }
  }

  async function login() { const { email, password } = { email: dom.email.value.trim(), password: dom.password.value }; const { error } = await state.supabase.auth.signInWithPassword({ email, password }); if (error) showAlert('error', error.message); }
  async function register() { const email = dom.registerEmail.value.trim(); const password = dom.registerPassword.value; const passwordRepeat = dom.registerPasswordRepeat.value; if (password !== passwordRepeat) return showAlert('error', 'Die eingegebenen Passwörter stimmen nicht überein.'); const { error } = await state.supabase.auth.signUp({ email, password }); if (error) showAlert('error', error.message); else showAlert('success', 'Registrierung gestartet.'); }
  async function logout() { await state.supabase.auth.signOut(); }

  function registerEventHandlers() {
    dom.authForm.addEventListener('submit', (e) => { e.preventDefault(); login(); });
    dom.registerBtn.addEventListener('click', () => setAuthScreen('register'));
    dom.registerForm.addEventListener('submit', (e) => { e.preventDefault(); register(); });
    dom.backToLoginBtn.addEventListener('click', () => setAuthScreen('login'));
    dom.logoutBtn.addEventListener('click', logout);
    dom.backToOrdersBtn.addEventListener('click', showOrdersOverview);

    dom.orderForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = dom.orderName.value.trim();
      if (!name) return;
      await createOrder(name);
      dom.orderForm.reset();
      showAlert('success', 'Auftrag erstellt.');
    });

    dom.ganttOpenModalBtn.addEventListener('click', () => {
      if (!state.selectedOrderId) return showAlert('error', 'Bitte zuerst einen Auftrag erstellen/auswählen.');
      openGanttModal();
    });
    dom.ganttCloseModalBtn.addEventListener('click', closeGanttModal);
    dom.ganttCancelBtn.addEventListener('click', closeGanttModal);
    dom.ganttForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = dom.ganttName.value.trim();
      const startDate = dom.ganttStart.value;
      const endDate = dom.ganttEnd.value;
      if (!name || !startDate || !endDate) return showAlert('error', 'Bitte alle Felder ausfüllen.');
      if (startDate > endDate) return showAlert('error', 'Enddatum darf nicht vor Startdatum liegen.');
      await createGanttEntry(name, startDate, endDate);
      closeGanttModal();
      showAlert('success', 'Gantt-Eintrag gespeichert.');
    });
  }

  registerEventHandlers();
  initializeSupabase();
})();
