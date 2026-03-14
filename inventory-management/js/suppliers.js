(function () {
  if (!Auth.requireAuth()) return;

  const user = Auth.getCurrentUser();
  const emailEl = document.getElementById('sidebar-email');
  if (emailEl) emailEl.textContent = user.email;

  document.getElementById('logout-btn').addEventListener('click', function () {
    Auth.logout();
  });

  const modal = document.getElementById('supplier-modal');
  const form = document.getElementById('supplier-form');
  const tbody = document.getElementById('suppliers-tbody');

  function openModal(supplier = null) {
    document.getElementById('supplier-modal-title').textContent = supplier ? 'Edit supplier' : 'Add supplier';
    document.getElementById('supplier-id').value = supplier ? supplier.id : '';
    document.getElementById('supplier-name').value = supplier ? supplier.name : '';
    document.getElementById('supplier-contact').value = supplier ? supplier.contact : '';
    document.getElementById('supplier-email').value = supplier ? supplier.email : '';
    document.getElementById('supplier-address').value = supplier ? supplier.address : '';
    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
  }

  modal.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });

  document.getElementById('add-supplier-btn').addEventListener('click', function () {
    openModal();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const id = document.getElementById('supplier-id').value;
    const payload = {
      name: document.getElementById('supplier-name').value.trim(),
      contact: document.getElementById('supplier-contact').value.trim(),
      email: document.getElementById('supplier-email').value.trim(),
      address: document.getElementById('supplier-address').value.trim()
    };
    const done = function () {
      closeModal();
      render();
    };
    if (id) {
      const result = Data.updateSupplier(Number(id), payload);
      if (result && result.then) result.then(done); else done();
    } else {
      const result = Data.createSupplier(payload);
      if (result && result.then) result.then(done); else done();
    }
  });

  function render() {
    const list = Data.suppliers;
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="muted">No suppliers yet.</td></tr>';
      return;
    }
    tbody.innerHTML = list
      .map(function (s) {
        return (
          '<tr>' +
          '<td>' + escapeHtml(s.name) + '</td>' +
          '<td>' + escapeHtml(s.contact || '—') + '</td>' +
          '<td>' + escapeHtml(s.email || '—') + '</td>' +
          '<td class="actions">' +
          '<button type="button" class="btn btn-ghost btn-sm" data-edit="' + s.id + '">Edit</button>' +
          '<button type="button" class="btn btn-danger btn-sm" data-delete="' + s.id + '">Delete</button>' +
          '</td></tr>'
        );
      })
      .join('');

    tbody.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const s = Data.suppliers.find(function (x) { return x.id === Number(btn.getAttribute('data-edit')); });
        if (s) openModal(s);
      });
    });
    tbody.querySelectorAll('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (confirm('Remove this supplier?')) {
          const result = Data.deleteSupplier(Number(btn.getAttribute('data-delete')));
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

  if (Data.loadSuppliers) {
    Data.loadSuppliers().then(render);
  } else {
    render();
  }
})();
