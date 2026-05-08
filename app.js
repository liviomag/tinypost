(() => {
  'use strict';

  const dom = {
    statusCard: document.getElementById('status-card'),
    loading: document.getElementById('loading'),
    alert: document.getElementById('alert'),
    breadcrumb: document.getElementById('breadcrumb'),
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
    registerBtn: document.getElementById('register-btn'),
    backToLoginBtn: document.getElementById('back-to-login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
  };

  let supabase;

  function setLoading(isLoading, text = 'Lade…') {
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
    dom.loginScreen.classList.toggle('hidden', screen !== 'login');
    dom.registerScreen.classList.toggle('hidden', screen !== 'register');
    dom.breadcrumb.textContent = screen === 'login' ? 'Login' : 'Registrieren';
  }

  function showAuthView() {
    dom.authView.classList.remove('hidden');
    dom.dashboardView.classList.add('hidden');
    dom.statusCard.classList.remove('dashboard-fullscreen');
    setAuthScreen('login');
  }

  function showDashboardView() {
    dom.authView.classList.add('hidden');
    dom.dashboardView.classList.remove('hidden');
    dom.statusCard.classList.add('dashboard-fullscreen');
    dom.breadcrumb.textContent = 'Screen';
  }

  async function login() {
    hideAlert();
    setLoading(true, 'Login läuft…');
    const email = dom.email.value.trim();
    const password = dom.password.value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      showAlert('error', `Login fehlgeschlagen: ${error.message}`);
      return;
    }

    dom.authForm.reset();
    showDashboardView();
  }

  async function register() {
    hideAlert();
    const email = dom.registerEmail.value.trim();
    const password = dom.registerPassword.value;
    const passwordRepeat = dom.registerPasswordRepeat.value;

    if (password !== passwordRepeat) {
      showAlert('error', 'Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true, 'Registrierung läuft…');
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      showAlert('error', `Registrierung fehlgeschlagen: ${error.message}`);
      return;
    }

    dom.registerForm.reset();
    setAuthScreen('login');
    showAlert('success', 'Registrierung erfolgreich. Bitte einloggen.');
  }

  async function logout() {
    hideAlert();
    const { error } = await supabase.auth.signOut();
    if (error) {
      showAlert('error', `Logout fehlgeschlagen: ${error.message}`);
      return;
    }
    showAuthView();
  }

  async function init() {
    try {
      const configResponse = await fetch('./supabase-config.json', { cache: 'no-store' });
      if (!configResponse.ok) throw new Error('supabase-config.json konnte nicht geladen werden.');
      const config = await configResponse.json();

      supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

      dom.authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        login();
      });
      dom.registerBtn.addEventListener('click', () => setAuthScreen('register'));
      dom.registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        register();
      });
      dom.backToLoginBtn.addEventListener('click', () => setAuthScreen('login'));
      dom.logoutBtn.addEventListener('click', logout);

      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (data.session?.user) {
        showDashboardView();
      } else {
        showAuthView();
      }
    } catch (error) {
      showAlert('error', `Initialisierung fehlgeschlagen: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  init();
})();
