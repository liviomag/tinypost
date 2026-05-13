import { isAuthenticated } from './session.js';

export async function requireGuest() {
  const loggedIn = await isAuthenticated();
  if (loggedIn) {
    window.location.href = './projects.html';
  }
}

export async function requireAuth() {
  const loggedIn = await isAuthenticated();
  if (!loggedIn) {
    window.location.href = './login.html';
  }
}
