(() => {
  'use strict';

  const state = {
    supabase: null,
    loading: false,
  };

  const dom = {
    loading: document.getElementById('loading'),
    alert: document.getElementById('alert'),
    authView: document.getElementById('auth-view'),
    dashboardView: document.getElementById('dashboard-view'),
    authForm: document.getElementById('auth-form'),
    email: document.getElementById('email'),
    password: document.getElementById('password'),
    loginBtn: document.getElementById('login-btn'),
    registerBtn: document.getElementById('register-btn'),
    magicLinkBtn: document.getElementById('magic-link-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    userInfo: document.getElementById('user-info'),
  };

  function setLoading(isLoading, text = 'Lade…') {
    state.loading = isLoading;
    dom.loading.textContent = text;
    dom.loading.classList.toggle('hidden', !isLoading);

    [dom.loginBtn, dom.registerBtn, dom.magicLinkBtn, dom.logoutBtn].forEach((btn) => {
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

  function showAuthView() {
    dom.authView.classList.remove('hidden');
    dom.dashboardView.classList.add('hidden');
  }

  function showDashboardView(user) {
    dom.authView.classList.add('hidden');
    dom.dashboardView.classList.remove('hidden');
    dom.userInfo.textContent = user?.email ? `Eingeloggt als ${user.email}` : '';
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
    } catch (error) {
      throw new Error('Konfigurationsdatei konnte nicht geladen werden. Läuft die App über einen lokalen Webserver?');
    }

    if (!response.ok) {
      throw new Error(`supabase-config.json nicht gefunden (HTTP ${response.status}).`);
    }

    try {
      return await response.json();
    } catch (error) {
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

  function getFormValues() {
    return {
      email: dom.email.value.trim(),
      password: dom.password.value,
    };
  }

  async function login() {
    const { email, password } = getFormValues();
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
    const { email, password } = getFormValues();
    hideAlert();

    if (!email || !password) {
      showAlert('error', 'Bitte E-Mail und Passwort für die Registrierung eingeben.');
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

  async function sendMagicLink() {
    const email = dom.email.value.trim();
    hideAlert();

    if (!email) {
      showAlert('error', 'Bitte zuerst eine E-Mail-Adresse eingeben.');
      return;
    }

    setLoading(true, 'Sende Magic Link…');
    const { error } = await state.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname,
      },
    });
    setLoading(false);

    if (error) {
      showAlert('error', `Magic Link konnte nicht gesendet werden: ${error.message}`);
      return;
    }

    showAlert('success', 'Magic Link wurde gesendet. Prüfe dein E-Mail-Postfach.');
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
      if (!state.supabase || state.loading) return;
      register();
    });

    dom.magicLinkBtn.addEventListener('click', () => {
      if (!state.supabase || state.loading) return;
      sendMagicLink();
    });

    dom.logoutBtn.addEventListener('click', () => {
      if (!state.supabase || state.loading) return;
      logout();
    });
  }

  registerEventHandlers();
  initializeSupabase();
})();
