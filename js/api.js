/**
 * When window.API_BASE is set (e.g. 'api/'), this script overrides Auth and Data
 * to use the PHP API (session + MySQL) instead of localStorage.
 * Load after auth.js and data.js.
 */
(function () {
  if (!window.API_BASE) return;

  var base = window.API_BASE;
  if (!base.endsWith('/')) base += '/';

  function request(path, options) {
    var url = base + path;
    var opts = Object.assign({ credentials: 'include', headers: { 'Content-Type': 'application/json' } }, options);
    if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData) && typeof opts.body !== 'string') {
      opts.body = JSON.stringify(opts.body);
    }
    return fetch(url, opts).then(function (r) {
      var ct = r.headers.get('Content-Type') || '';
      var body = ct.indexOf('application/json') !== -1 ? r.json() : r.text();
      if (!r.ok) {
        return body.then(function (data) {
          var err = new Error(data && data.error ? data.error : 'Request failed');
          err.status = r.status;
          err.data = data;
          throw err;
        });
      }
      return body;
    });
  }

  // Override Auth: login/signup via API; keep localStorage for current user so UI works
  var STORAGE_KEY = 'inventory_user';
  window.Auth = {
    getCurrentUser: function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    setCurrentUser: function (user) {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    isLoggedIn: function () {
      return !!this.getCurrentUser();
    },
    requireAuth: function () {
      if (!this.isLoggedIn()) {
        window.location.href = 'index.html';
        return false;
      }
      return true;
    },
    redirectIfLoggedIn: function () {
      if (this.isLoggedIn()) {
        window.location.href = 'dashboard.html';
        return true;
      }
      return false;
    },
    logout: function () {
      request('logout.php', { method: 'POST' }).catch(function () {}).then(function () {
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = 'index.html';
      });
    }
  };

  // Cache for API data so existing sync code keeps working
  var cache = { products: null, orders: null, deliveries: null, suppliers: null, activity: null };

  function invalidate(key) {
    cache[key] = null;
  }

  window.Data = {
    get users() {
      return []; // Not used when API handles auth
    },
    set users(val) {},
    get products() {
      if (cache.products) return cache.products;
      return [];
    },
    set products(val) {
      cache.products = val;
    },
    get orders() {
      if (cache.orders) return cache.orders;
      return [];
    },
    set orders(val) {
      cache.orders = val;
    },
    get deliveries() {
      if (cache.deliveries) return cache.deliveries;
      return [];
    },
    set deliveries(val) {
      cache.deliveries = val;
    },
    get suppliers() {
      if (cache.suppliers) return cache.suppliers;
      return [];
    },
    set suppliers(val) {
      cache.suppliers = val;
    },
    get activity() {
      if (cache.activity) return cache.activity;
      return [];
    },
    addActivity: function () {},
    findUserByEmail: function () {
      return null;
    },
    createUser: function () {
      return null;
    },
    createProduct: function (data) {
      var self = this;
      return request('products.php', { method: 'POST', body: data }).then(function (p) {
        invalidate('products');
        return self.loadProducts().then(function () {
          return p;
        });
      });
    },
    updateProduct: function (id, data) {
      var self = this;
      return request('products.php?id=' + id, { method: 'PUT', body: data }).then(function (p) {
        invalidate('products');
        return self.loadProducts().then(function () {
          return p;
        });
      });
    },
    deleteProduct: function (id) {
      var self = this;
      return request('products.php?id=' + id, { method: 'DELETE' }).then(function () {
        invalidate('products');
        return self.loadProducts().then(function () {
          return true;
        });
      });
    },
    createOrder: function (data) {
      var self = this;
      return request('orders.php', { method: 'POST', body: data }).then(function (o) {
        invalidate('orders');
        return self.loadOrders().then(function () {
          return o;
        });
      });
    },
    updateOrder: function (id, data) {
      var self = this;
      return request('orders.php?id=' + id, { method: 'PUT', body: data }).then(function (o) {
        invalidate('orders');
        return self.loadOrders().then(function () {
          return o;
        });
      });
    },
    createDelivery: function (data) {
      var self = this;
      return request('deliveries.php', { method: 'POST', body: data }).then(function (d) {
        invalidate('deliveries');
        return self.loadDeliveries().then(function () {
          return d;
        });
      });
    },
    updateDelivery: function (id, data) {
      var self = this;
      return request('deliveries.php?id=' + id, { method: 'PUT', body: data }).then(function (d) {
        invalidate('deliveries');
        return self.loadDeliveries().then(function () {
          return d;
        });
      });
    },
    createSupplier: function (data) {
      var self = this;
      return request('suppliers.php', { method: 'POST', body: data }).then(function (s) {
        invalidate('suppliers');
        return self.loadSuppliers().then(function () {
          return s;
        });
      });
    },
    updateSupplier: function (id, data) {
      var self = this;
      return request('suppliers.php?id=' + id, { method: 'PUT', body: data }).then(function (s) {
        invalidate('suppliers');
        return self.loadSuppliers().then(function () {
          return s;
        });
      });
    },
    deleteSupplier: function (id) {
      var self = this;
      return request('suppliers.php?id=' + id, { method: 'DELETE' }).then(function () {
        invalidate('suppliers');
        return self.loadSuppliers().then(function () {
          return true;
        });
      });
    },
    loadProducts: function () {
      var self = this;
      return request('products.php').then(function (list) {
        cache.products = list;
        return list;
      });
    },
    loadOrders: function () {
      var self = this;
      return request('orders.php').then(function (list) {
        cache.orders = list;
        return list;
      });
    },
    loadDeliveries: function () {
      return request('deliveries.php').then(function (list) {
        cache.deliveries = list;
        return list;
      });
    },
    loadSuppliers: function () {
      return request('suppliers.php').then(function (list) {
        cache.suppliers = list;
        return list;
      });
    },
    loadActivity: function () {
      return request('activity.php').then(function (list) {
        cache.activity = list;
        return list;
      });
    }
  };
})();
