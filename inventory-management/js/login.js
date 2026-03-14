(function () {
  if (Auth.redirectIfLoggedIn()) return;

  const form = document.getElementById('login-form');
  const emailEl = document.getElementById('login-email');
  const passwordEl = document.getElementById('login-password');
  const errorEl = document.getElementById('login-error');

  function hashPassword(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return String(h);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorEl.textContent = '';
    const email = (emailEl.value || '').trim();
    const password = passwordEl.value || '';

    if (!email || !password) {
      errorEl.textContent = 'Please enter email and password.';
      return;
    }

    if (window.API_BASE) {
      fetch(window.API_BASE + (window.API_BASE.endsWith('/') ? '' : '/') + 'login.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(data.error || 'Login failed');
          return data;
        });
      }).then(function (data) {
        Auth.setCurrentUser(data.user);
        window.location.href = 'dashboard.html';
      }).catch(function (err) {
        errorEl.textContent = err.message || 'Login failed.';
      });
      return;
    }

    const user = Data.findUserByEmail(email);
    if (!user) {
      errorEl.textContent = 'No account found with this email.';
      return;
    }

    const hash = hashPassword(password);
    if (user.passwordHash !== hash) {
      errorEl.textContent = 'Incorrect password.';
      return;
    }

    Auth.setCurrentUser({ id: user.id, name: user.name, email: user.email });
    window.location.href = 'dashboard.html';
  });
})();
