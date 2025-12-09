const API_BASE = '';

function getToken() {
  return localStorage.getItem('adminToken');
}

function setToken(token) {
  localStorage.setItem('adminToken', token);
}

function clearToken() {
  localStorage.removeItem('adminToken');
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = options.headers || {};
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  const res = await fetch(API_BASE + url, { ...options, headers });
  if (res.status === 401) {
    if (window.location.pathname.endsWith('admin.html')) {
      clearToken();
      window.location.href = 'login.html';
    }
  }
  return res;
}

// login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const body = {
      username: form.username.value,
      password: form.password.value
    };
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const errorEl = document.getElementById('loginError');
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      errorEl.textContent = data.message || 'Ошибка входа';
      errorEl.style.display = 'block';
      return;
    }
    const data = await res.json();
    setToken(data.token);
    window.location.href = 'admin.html';
  });
}

// logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    clearToken();
    window.location.href = 'login.html';
  });
}
