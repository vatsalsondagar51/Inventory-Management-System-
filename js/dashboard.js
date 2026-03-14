(function () {
  if (!Auth.requireAuth()) return;

  const user = Auth.getCurrentUser();
  const emailEl = document.getElementById('sidebar-email');
  if (emailEl) emailEl.textContent = user.email;

  document.getElementById('logout-btn').addEventListener('click', function () {
    Auth.logout();
  });

  function runDashboard() {
  const products = Data.products;
  const orders = Data.orders;
  const deliveries = Data.deliveries;

  const lowStockThreshold = 5;
  const lowStockCount = products.filter(
    (p) => (p.lowStockThreshold != null ? p.quantity <= p.lowStockThreshold : p.quantity <= lowStockThreshold)
  ).length;

  const pendingOrders = orders.filter((o) => ['pending', 'confirmed', 'processing'].includes(o.status)).length;
  const inTransit = deliveries.filter((d) =>
    ['picked_up', 'in_transit', 'out_for_delivery'].includes(d.status)
  ).length;

  document.getElementById('stat-products').textContent = products.length;
  document.getElementById('stat-low-stock').textContent = lowStockCount;
  document.getElementById('stat-orders').textContent = pendingOrders;
  document.getElementById('stat-deliveries').textContent = inTransit;

  const activity = Data.activity;
  const listEl = document.getElementById('recent-activity');
  if (activity.length === 0) {
    listEl.innerHTML = '<p class="muted">No recent activity yet.</p>';
  } else {
    listEl.innerHTML = activity
      .slice(0, 10)
      .map(
        (a) =>
          `<li>${escapeHtml(a.message)}<span class="activity-time">${formatTime(a.time)}</span></li>`
      )
      .join('');
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function formatTime(iso) {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = now - d;
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
      if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
      return d.toLocaleDateString();
    } catch {
      return '';
    }
  }
  }

  if (Data.loadProducts && Data.loadOrders && Data.loadDeliveries && Data.loadActivity) {
    Promise.all([
      Data.loadProducts(),
      Data.loadOrders(),
      Data.loadDeliveries(),
      Data.loadActivity()
    ]).then(runDashboard);
  } else {
    runDashboard();
  }
})();
