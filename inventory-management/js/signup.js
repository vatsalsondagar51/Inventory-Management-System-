(function () {
  if (Auth.redirectIfLoggedIn()) return;

  const form = document.getElementById('signup-form');
  const nameEl = document.getElementById('signup-name');
  const emailEl = document.getElementById('signup-email');
  const passwordEl = document.getElementById('signup-password');
  const confirmEl = document.getElementById('signup-confirm');
  const errorEl = document.getElementById('signup-error');

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

    const name = (nameEl.value || '').trim();
    const email = (emailEl.value || '').trim();
    const password = passwordEl.value || '';
    const confirm = confirmEl.value || '';

    if (!name) {
      errorEl.textContent = 'Please enter your name.';
      return;
    }
    if (!email) {
      errorEl.textContent = 'Please enter your email.';
      return;
    }
    if (password.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters.';
      return;
    }
    if (password !== confirm) {
      errorEl.textContent = 'Passwords do not match.';
      return;
    }

    if (window.API_BASE) {
      fetch(window.API_BASE + (window.API_BASE.endsWith('/') ? '' : '/') + 'signup.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, password: password })
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(data.error || 'Sign up failed');
          return data;
        });
      }).then(function (data) {
        Auth.setCurrentUser(data.user);
        window.location.href = 'dashboard.html';
      }).catch(function (err) {
        errorEl.textContent = err.message || 'Could not create account.';
      });
      return;
    }

    if (Data.findUserByEmail(email)) {
      errorEl.textContent = 'An account with this email already exists.';
      return;
    }

    const user = Data.createUser(name, email, hashPassword(password));
    if (!user) {
      errorEl.textContent = 'Could not create account.';
      return;
    }

    Auth.setCurrentUser(user);
    window.location.href = 'dashboard.html';
  });
})();
