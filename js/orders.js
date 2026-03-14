(function () {
  if (!Auth.requireAuth()) return;

  const user = Auth.getCurrentUser();
  const emailEl = document.getElementById('sidebar-email');
  if (emailEl) emailEl.textContent = user.email;

  document.getElementById('logout-btn').addEventListener('click', function () {
    Auth.logout();
  });

  const modal = document.getElementById('order-modal');
  const form = document.getElementById('order-form');
  const tbody = document.getElementById('orders-tbody');
  const filterEl = document.getElementById('order-filter');
  const orderItemsList = document.getElementById('order-items-list');
  const addItemBtn = document.getElementById('add-order-item');
  let products = Data.products;

  let orderItemCount = 0;

  function openModal(order = null) {
    document.getElementById('order-modal-title').textContent = order ? 'Edit order' : 'New order';
    document.getElementById('order-id').value = order ? order.id : '';
    document.getElementById('order-type').value = order ? order.type : 'purchase';
    document.getElementById('order-party').value = order ? order.party : '';
    document.getElementById('order-notes').value = order ? order.notes : '';
    orderItemCount = 0;
    orderItemsList.innerHTML = '';
    if (order && order.items && order.items.length) {
      order.items.forEach(function (item) {
        addOrderItemRow(item);
      });
    } else {
      addOrderItemRow();
    }
    modal.hidden = false;
  }

  function addOrderItemRow(item) {
    orderItemCount += 1;
    const id = 'oi-' + orderItemCount;
    const row = document.createElement('div');
    row.className = 'order-item-row';
    const options = products
      .map(function (p) {
        return '<option value="' + p.id + '"' + (item && item.productId === p.id ? ' selected' : '') + '>' + escapeHtml(p.name) + '</option>';
      })
      .join('');
    row.innerHTML =
      '<select class="order-item-product" data-product required><option value="">Select product</option>' + options + '</select>' +
      '<input type="number" class="order-item-qty" min="1" value="' + (item ? item.quantity : 1) + '" placeholder="Qty" />' +
      '<button type="button" class="btn btn-ghost btn-sm order-item-remove">Remove</button>';
    row.querySelector('.order-item-remove').addEventListener('click', function () {
      row.remove();
    });
    orderItemsList.appendChild(row);
  }

  function closeModal() {
    modal.hidden = true;
  }

  modal.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });

  addItemBtn.addEventListener('click', function () {
    addOrderItemRow();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const id = document.getElementById('order-id').value;
    const rows = orderItemsList.querySelectorAll('.order-item-row');
    const items = [];
    rows.forEach(function (row) {
      const productId = row.querySelector('.order-item-product').value;
      const qty = Number(row.querySelector('.order-item-qty').value) || 1;
      if (productId) items.push({ productId: Number(productId), quantity: qty });
    });
    const payload = {
      type: document.getElementById('order-type').value,
      party: document.getElementById('order-party').value.trim(),
      items,
      notes: document.getElementById('order-notes').value.trim()
    };
    const done = function () {
      closeModal();
      render();
    };
    if (id) {
      const result = Data.updateOrder(Number(id), payload);
      if (result && result.then) result.then(done); else done();
    } else {
      const result = Data.createOrder(payload);
      if (result && result.then) result.then(done); else done();
    }
  });

  document.getElementById('add-order-btn').addEventListener('click', function () {
    openModal();
  });

  function getStatusClass(s) {
    return 'badge-' + (s || 'pending').toLowerCase().replace(' ', '_');
  }

  function render() {
    let list = Data.orders;
    const statusFilter = filterEl && filterEl.value;
    if (statusFilter) list = list.filter(function (o) { return o.status === statusFilter; });

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="muted">No orders yet.</td></tr>';
      return;
    }
    tbody.innerHTML = list
      .map(function (o) {
        const itemCount = (o.items && o.items.length) || 0;
        const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—';
        return (
          '<tr>' +
          '<td><code>#' + o.id + '</code></td>' +
          '<td>' + escapeHtml(o.party) + '</td>' +
          '<td>' + itemCount + ' item(s)</td>' +
          '<td>' + date + '</td>' +
          '<td><span class="badge ' + getStatusClass(o.status) + '">' + (o.status || 'pending') + '</span></td>' +
          '<td class="actions"><button type="button" class="btn btn-ghost btn-sm" data-edit="' + o.id + '">Edit</button></td>' +
          '</tr>'
        );
      })
      .join('');

    tbody.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const order = Data.orders.find(function (o) { return o.id === Number(btn.getAttribute('data-edit')); });
        if (order) openModal(order);
      });
    });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  if (filterEl) filterEl.addEventListener('change', render);

  function run() {
    products = Data.products;
    render();
  }
  if (Data.loadProducts && Data.loadOrders) {
    Promise.all([Data.loadProducts(), Data.loadOrders()]).then(run);
  } else {
    run();
  }
})();
