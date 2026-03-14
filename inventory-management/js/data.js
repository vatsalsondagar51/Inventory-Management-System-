(function () {
  const KEYS = {
    users: 'inventory_users',
    products: 'inventory_products',
    orders: 'inventory_orders',
    deliveries: 'inventory_deliveries',
    suppliers: 'inventory_suppliers',
    activity: 'inventory_activity'
  };

  function load(key, defaultValue = []) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function nextId(list) {
    const ids = list.map((x) => x.id).filter(Boolean);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  function addActivity(message) {
    const list = load(KEYS.activity);
    list.unshift({
      id: nextId(list),
      message,
      time: new Date().toISOString()
    });
    save(KEYS.activity, list.slice(0, 50));
  }

  window.Data = {
    get users() {
      return load(KEYS.users);
    },
    set users(val) {
      save(KEYS.users, val);
    },

    get products() {
      return load(KEYS.products);
    },
    set products(val) {
      save(KEYS.products, val);
    },

    get orders() {
      return load(KEYS.orders);
    },
    set orders(val) {
      save(KEYS.orders, val);
    },

    get deliveries() {
      return load(KEYS.deliveries);
    },
    set deliveries(val) {
      save(KEYS.deliveries, val);
    },

    get suppliers() {
      return load(KEYS.suppliers);
    },
    set suppliers(val) {
      save(KEYS.suppliers, val);
    },

    get activity() {
      return load(KEYS.activity);
    },

    addActivity,

    findUserByEmail(email) {
      return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    },

    createUser(name, email, passwordHash) {
      const users = this.users;
      if (this.findUserByEmail(email)) return null;
      const user = {
        id: nextId(users),
        name,
        email: email.toLowerCase(),
        passwordHash,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      this.users = users;
      return { id: user.id, name: user.name, email: user.email };
    },

    createProduct(data) {
      const list = this.products;
      const product = {
        id: nextId(list),
        name: data.name || '',
        sku: data.sku || '',
        category: data.category || '',
        quantity: Number(data.quantity) || 0,
        unit: data.unit || 'pcs',
        lowStockThreshold: Number(data.lowStockThreshold) || 5,
        createdAt: new Date().toISOString()
      };
      list.push(product);
      this.products = list;
      addActivity(`Product added: ${product.name}`);
      return product;
    },

    updateProduct(id, data) {
      const list = this.products;
      const i = list.findIndex((p) => p.id === id);
      if (i === -1) return null;
      const p = list[i];
      Object.assign(p, {
        name: data.name ?? p.name,
        sku: data.sku ?? p.sku,
        category: data.category ?? p.category,
        quantity: data.quantity !== undefined ? Number(data.quantity) : p.quantity,
        unit: data.unit ?? p.unit,
        lowStockThreshold: data.lowStockThreshold !== undefined ? Number(data.lowStockThreshold) : p.lowStockThreshold
      });
      this.products = list;
      addActivity(`Product updated: ${p.name}`);
      return p;
    },

    deleteProduct(id) {
      const list = this.products.filter((p) => p.id !== id);
      this.products = list;
      addActivity('Product removed');
      return true;
    },

    createOrder(data) {
      const list = this.orders;
      const order = {
        id: nextId(list),
        type: data.type || 'purchase',
        party: data.party || '',
        items: Array.isArray(data.items) ? data.items : [],
        status: 'pending',
        notes: data.notes || '',
        createdAt: new Date().toISOString()
      };
      list.push(order);
      this.orders = list;
      addActivity(`Order #${order.id} created (${order.party})`);
      return order;
    },

    updateOrder(id, data) {
      const list = this.orders;
      const i = list.findIndex((o) => o.id === id);
      if (i === -1) return null;
      const o = list[i];
      if (data.status != null) o.status = data.status;
      if (data.party != null) o.party = data.party;
      if (data.items != null) o.items = data.items;
      if (data.notes != null) o.notes = data.notes;
      this.orders = list;
      addActivity(`Order #${o.id} updated`);
      return o;
    },

    createDelivery(data) {
      const list = this.deliveries;
      const delivery = {
        id: nextId(list),
        orderId: Number(data.orderId),
        tracking: data.tracking || '',
        carrier: data.carrier || '',
        status: 'pending',
        estimatedDate: data.estimatedDate || null,
        address: data.address || '',
        createdAt: new Date().toISOString()
      };
      list.push(delivery);
      this.deliveries = list;
      addActivity(`Delivery created for order #${delivery.orderId}`);
      return delivery;
    },

    updateDelivery(id, data) {
      const list = this.deliveries;
      const i = list.findIndex((d) => d.id === id);
      if (i === -1) return null;
      const d = list[i];
      if (data.status != null) d.status = data.status;
      if (data.tracking != null) d.tracking = data.tracking;
      if (data.carrier != null) d.carrier = data.carrier;
      if (data.estimatedDate != null) d.estimatedDate = data.estimatedDate;
      if (data.address != null) d.address = data.address;
      this.deliveries = list;
      addActivity(`Delivery #${d.id} status: ${d.status}`);
      return d;
    },

    createSupplier(data) {
      const list = this.suppliers;
      const supplier = {
        id: nextId(list),
        name: data.name || '',
        contact: data.contact || '',
        email: data.email || '',
        address: data.address || '',
        createdAt: new Date().toISOString()
      };
      list.push(supplier);
      this.suppliers = list;
      addActivity(`Supplier added: ${supplier.name}`);
      return supplier;
    },

    updateSupplier(id, data) {
      const list = this.suppliers;
      const i = list.findIndex((s) => s.id === id);
      if (i === -1) return null;
      Object.assign(list[i], data);
      this.suppliers = list;
      return list[i];
    },

    deleteSupplier(id) {
      this.suppliers = this.suppliers.filter((s) => s.id !== id);
      addActivity('Supplier removed');
      return true;
    }
  };
})();
