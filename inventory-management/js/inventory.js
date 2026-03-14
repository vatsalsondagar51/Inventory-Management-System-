(function () {
  if (!Auth.requireAuth()) return;

  const user = Auth.getCurrentUser();
  const emailEl = document.getElementById('sidebar-email');
  if (emailEl) emailEl.textContent = user.email;

  document.getElementById('logout-btn').addEventListener('click', function () {
    Auth.logout();
  });

  const modal = document.getElementById('product-modal');
  const form = document.getElementById('product-form');
  const tbody = document.getElementById('inventory-tbody');
  const searchEl = document.getElementById('inventory-search');

  function openModal(product = null) {
    document.getElementById('product-modal-title').textContent = product ? 'Edit product' : 'Add product';
    document.getElementById('product-id').value = product ? product.id : '';
    document.getElementById('product-name').value = product ? product.name : '';
    document.getElementById('product-sku').value = product ? product.sku : '';
    document.getElementById('product-category').value = product ? product.category : '';
    document.getElementById('product-quantity').value = product ? product.quantity : 0;
    document.getElementById('product-unit').value = product ? product.unit : 'pcs';
    document.getElementById('product-threshold').value = product ? (product.lowStockThreshold ?? 5) : 5;
    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
  }

  modal.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });

  document.getElementById('add-product-btn').addEventListener('click', function () {
    openModal();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const id = document.getElementById('product-id').value;
    const payload = {
      name: document.getElementById('product-name').value.trim(),
      sku: document.getElementById('product-sku').value.trim(),
      category: document.getElementById('product-category').value.trim(),
      quantity: Number(document.getElementById('product-quantity').value) || 0,
      unit: document.getElementById('product-unit').value,
      lowStockThreshold: Number(document.getElementById('product-threshold').value) || 5
    };
    const done = function () {
      closeModal();
      render();
    };
    if (id) {
      const result = Data.updateProduct(Number(id), payload);
      if (result && result.then) result.then(done); else done();
    } else {
      const result = Data.createProduct(payload);
      if (result && result.then) result.then(done); else done();
    }
  });

  function getStatus(product) {
    const threshold = product.lowStockThreshold != null ? product.lowStockThreshold : 5;
    return product.quantity <= threshold ? 'low' : 'ok';
  }

  function render() {
    let list = Data.products;
    const q = (searchEl && searchEl.value || '').trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="muted">No products yet. Add your first product.</td></tr>';
      return;
    }
    tbody.innerHTML = list
      .map(function (p) {
        const status = getStatus(p);
        return (
          '<tr>' +
          '<td>' + escapeHtml(p.name) + '</td>' +
          '<td><code>' + escapeHtml(p.sku || '—') + '</code></td>' +
          '<td>' + escapeHtml(p.category || '—') + '</td>' +
          '<td>' + p.quantity + '</td>' +
          '<td>' + escapeHtml(p.unit) + '</td>' +
          '<td><span class="badge badge-' + status + '">' + (status === 'low' ? 'Low stock' : 'OK') + '</span></td>' +
          '<td class="actions">' +
          '<button type="button" class="btn btn-ghost btn-sm" data-edit="' + p.id + '">Edit</button>' +
          '<button type="button" class="btn btn-danger btn-sm" data-delete="' + p.id + '">Delete</button>' +
          '</td></tr>'
        );
      })
      .join('');

    tbody.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = Number(btn.getAttribute('data-edit'));
        const product = Data.products.find(function (p) { return p.id === id; });
        if (product) openModal(product);
      });
    });
    tbody.querySelectorAll('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (confirm('Delete this product?')) {
          const result = Data.deleteProduct(Number(btn.getAttribute('data-delete')));
          var done = function () { render(); };
          if (result && result.then) result.then(done); else done();
        }
      });
    });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  if (searchEl) searchEl.addEventListener('input', render);
  if (Data.loadProducts) {
    Data.loadProducts().then(render);
  } else {
    render();
  }
})();
