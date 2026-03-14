(function () {
  if (!Auth.requireAuth()) return;

  const user = Auth.getCurrentUser();
  const emailEl = document.getElementById('sidebar-email');
  if (emailEl) emailEl.textContent = user.email;

  document.getElementById('logout-btn').addEventListener('click', function () {
    Auth.logout();
  });

  const modal = document.getElementById('delivery-modal');
  const form = document.getElementById('delivery-form');
  const statusModal = document.getElementById('delivery-status-modal');
  const statusForm = document.getElementById('delivery-status-form');
  const tbody = document.getElementById('delivery-tbody');
  const filterEl = document.getElementById('delivery-filter');
  const searchEl = document.getElementById('delivery-search');

  function openModal(delivery = null) {
    document.getElementById('delivery-modal-title').textContent = delivery ? 'Edit delivery' : 'New delivery';
    document.getElementById('delivery-id').value = delivery ? delivery.id : '';
    const orderSelect = document.getElementById('delivery-order');
    const orders = Data.orders.filter(function (o) { return !['cancelled'].includes(o.status); });
    orderSelect.innerHTML = '<option value="">Select an order</option>' +
      orders.map(function (o) {
        return '<option value="' + o.id + '"' + (delivery && delivery.orderId === o.id ? ' selected' : '') + '>Order #' + o.id + ' – ' + escapeHtml(o.party) + '</option>';
      }).join('');
    document.getElementById('delivery-tracking').value = delivery ? delivery.tracking : '';
    document.getElementById('delivery-carrier').value = delivery ? delivery.carrier : '';
    document.getElementById('delivery-estimated').value = delivery && delivery.estimatedDate ? delivery.estimatedDate.slice(0, 10) : '';
    document.getElementById('delivery-address').value = delivery ? delivery.address : '';
    if (!delivery) orderSelect.focus();
    modal.hidden = false;
  }

  function openStatusModal(delivery) {
    document.getElementById('status-delivery-id').value = delivery.id;
    document.getElementById('status-select').value = delivery.status || 'pending';
    statusModal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
  }

  function closeStatusModal() {
    statusModal.hidden = true;
  }

  modal.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });
  statusModal.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', closeStatusModal);
  });

  document.getElementById('add-delivery-btn').addEventListener('click', function () {
    openModal();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const id = document.getElementById('delivery-id').value;
    const orderId = document.getElementById('delivery-order').value;
    if (!orderId) return;
    const payload = {
      orderId: Number(orderId),
      tracking: document.getElementById('delivery-tracking').value.trim(),
      carrier: document.getElementById('delivery-carrier').value.trim(),
      estimatedDate: document.getElementById('delivery-estimated').value || null,
      address: document.getElementById('delivery-address').value.trim()
    };
    var done = function () { closeModal(); render(); };
    if (id) {
      const result = Data.updateDelivery(Number(id), payload);
      if (result && result.then) result.then(done); else done();
    } else {
      const result = Data.createDelivery(payload);
      if (result && result.then) result.then(done); else done();
    }
  });

  statusForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const id = Number(document.getElementById('status-delivery-id').value);
    const status = document.getElementById('status-select').value;
    const result = Data.updateDelivery(id, { status });
    var done = function () { closeStatusModal(); render(); };
    if (result && result.then) result.then(done); else done();
  });

  function getOrderLabel(orderId) {
    const o = Data.orders.find(function (x) { return x.id === orderId; });
    return o ? '#' + o.id + ' ' + (o.party || '') : '#' + orderId;
  }

  function render() {
    let list = Data.deliveries;
    const statusFilter = filterEl && filterEl.value;
    if (statusFilter) list = list.filter(function (d) { return d.status === statusFilter; });
    const q = (searchEl && searchEl.value || '').trim().toLowerCase();
    if (q) {
      list = list.filter(function (d) {
        return (d.tracking && d.tracking.toLowerCase().includes(q)) ||
          getOrderLabel(d.orderId).toLowerCase().includes(q);
      });
    }

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="muted">No deliveries yet.</td></tr>';
      return;
    }
    tbody.innerHTML = list
      .map(function (d) {
        const status = (d.status || 'pending').replace(/_/g, ' ');
        const est = d.estimatedDate ? new Date(d.estimatedDate).toLocaleDateString() : '—';
        return (
          '<tr>' +
          '<td><code>' + escapeHtml(d.tracking || '—') + '</code></td>' +
          '<td>' + escapeHtml(getOrderLabel(d.orderId)) + '</td>' +
          '<td>' + escapeHtml(d.carrier || '—') + '</td>' +
          '<td><span class="badge badge-' + (d.status || 'pending') + '">' + status + '</span></td>' +
          '<td>' + est + '</td>' +
          '<td class="actions">' +
          '<button type="button" class="btn btn-ghost btn-sm" data-status="' + d.id + '">Update status</button>' +
          '</td></tr>'
        );
      })
      .join('');

    tbody.querySelectorAll('[data-status]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const d = Data.deliveries.find(function (x) { return x.id === Number(btn.getAttribute('data-status')); });
        if (d) openStatusModal(d);
      });
    });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  if (filterEl) filterEl.addEventListener('change', render);
  if (searchEl) searchEl.addEventListener('input', render);
  if (Data.loadOrders && Data.loadDeliveries) {
    Promise.all([Data.loadOrders(), Data.loadDeliveries()]).then(render);
  } else {
    render();
  }
})();
