(function () {
  const STORAGE_KEY = 'inventory_user';

  window.Auth = {
    getCurrentUser() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },

    setCurrentUser(user) {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    },

    isLoggedIn() {
      return !!this.getCurrentUser();
    },

    requireAuth() {
      if (!this.isLoggedIn()) {
        window.location.href = 'index.html';
        return false;
      }
      return true;
    },

    redirectIfLoggedIn() {
      if (this.isLoggedIn()) {
        window.location.href = 'dashboard.html';
        return true;
      }
      return false;
    },

    logout() {
      this.setCurrentUser(null);
      window.location.href = 'index.html';
    }
  };
})();
