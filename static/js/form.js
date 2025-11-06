document.addEventListener("DOMContentLoaded", () => {
  setupFileNumberCheck();
  setupDisabilityToggle();
  setupAssistanceControls();
  setupPersonSearch();
});

function setupFileNumberCheck() {
  const input = document.getElementById("file_no");
  const status = document.getElementById("file-no-status");
  const feedback = document.getElementById("file-no-feedback");
  if (!input || !status) return;

  const checkUrl = input.dataset.checkUrl;
  const initial = (input.dataset.initial || "").trim();
  let debounceTimer;

  const setState = (state) => {
    status.classList.remove("text-success", "text-danger", "text-warning");
    feedback?.classList.add("d-none");
    switch (state) {
      case "checking":
        status.textContent = "…";
        status.classList.add("text-warning");
        break;
      case "available":
        status.textContent = "✓";
        status.classList.add("text-success");
        break;
      case "exists":
        status.textContent = "!";
        status.classList.add("text-danger");
        feedback?.classList.remove("d-none");
        break;
      case "self":
        status.textContent = "✓";
        status.classList.add("text-success");
        break;
      default:
        status.textContent = "";
    }
  };

  const check = () => {
    const value = input.value.trim();
    if (!value) {
      setState("idle");
      return;
    }
    if (!checkUrl) return;
    if (value === initial) {
      setState("self");
      return;
    }
    setState("checking");
    fetch(`${checkUrl}?file_no=${encodeURIComponent(value)}`)
      .then((response) => response.json())
      .then((data) => {
        setState(data.exists ? "exists" : "available");
      })
      .catch(() => setState("idle"));
  };

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(check, 400);
  });
  input.addEventListener("blur", check);
}

function setupDisabilityToggle() {
  const select = document.getElementById("disability_status");
  const group = document.getElementById("disability-rate-group");
  if (!select || !group) return;

  const update = () => {
    const value = select.value;
    if (value === "Var") {
      group.classList.remove("d-none");
    } else {
      group.classList.add("d-none");
      const rateInput = group.querySelector("input");
      if (rateInput) rateInput.value = "";
    }
  };

  update();
  select.addEventListener("change", update);
}

function setupAssistanceControls() {
  const list = document.getElementById("assistance-list");
  const addButton = document.querySelector('[data-action="add-assistance"]');
  if (!list || !addButton) return;

  let options = [];
  try {
    options = JSON.parse(list.dataset.options || "[]");
  } catch {
    options = [];
  }

  const buildRow = () => {
    const wrapper = document.createElement("div");
    wrapper.className = "row g-2 assistance-item align-items-end";
    const optionsMarkup = [
      '<option value="">Seçiniz</option>',
      ...options.map((option) => `<option value="${option}">${option}</option>`),
    ].join("");
    wrapper.innerHTML = `
      <div class="col-md-4">
          <label class="form-label">Yardım Türü</label>
          <select name="assistance_type[]" class="form-select">
              ${optionsMarkup}
          </select>
      </div>
      <div class="col-md-3">
          <label class="form-label">Yardım Tarihi</label>
          <input type="date" name="assistance_date[]" class="form-control">
      </div>
      <div class="col-md-3">
          <label class="form-label">Yardım Miktarı</label>
          <input type="text" name="assistance_amount[]" class="form-control" placeholder="0.00">
      </div>
      <div class="col-md-2 text-end">
          <button type="button" class="btn btn-light border remove-assistance w-100">Sil</button>
      </div>
    `;
    return wrapper;
  };

  addButton.addEventListener("click", () => {
    const row = buildRow();
    list.appendChild(row);
    row.querySelector("select")?.focus();
  });

  list.addEventListener("click", (event) => {
    const btn = event.target.closest(".remove-assistance");
    if (!btn) return;
    const row = btn.closest(".assistance-item");
    if (row) {
      row.remove();
    }
    if (!list.querySelector(".assistance-item")) {
      list.appendChild(buildRow());
    }
  });
}

function setupPersonSearch() {
  const tableBody = document.getElementById("person-table-body");
  const fileInput = document.getElementById("search-file-no");
  const nameInput = document.getElementById("search-full-name");
  if (!tableBody || (!fileInput && !nameInput)) return;

  const searchUrl = fileInput?.dataset.searchUrl;
  if (!searchUrl) return;

  const emptyText = tableBody.dataset.emptyText || "Sonuç bulunamadı.";
  const loadingMarkup =
    '<tr class="table-loading"><td colspan="7" class="text-center text-muted py-4">Aranıyor...</td></tr>';

  let activeController = null;
  let debounceTimer = null;

  const escapeHtml = (value) =>
    (value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const renderRows = (persons) => {
    if (!Array.isArray(persons) || persons.length === 0) {
      tableBody.innerHTML = `<tr class="table-empty"><td colspan="7" class="text-center text-muted py-4">${escapeHtml(
        emptyText
      )}</td></tr>`;
      return;
    }

    const html = persons
      .map((person) => {
        const editUrl = escapeHtml(person.edit_url || "");
        const deleteUrl = escapeHtml(person.delete_url || "");
        return `
          <tr>
              <td class="fw-semibold">${escapeHtml(person.file_no)}</td>
              <td>${escapeHtml(person.full_name)}</td>
              <td>${escapeHtml(person.phone)}</td>
              <td>${escapeHtml(person.social_security)}</td>
              <td>${escapeHtml(person.created_at)}</td>
              <td>${escapeHtml(person.updated_at)}</td>
              <td class="text-end">
                  <div class="btn-group btn-group-sm" role="group">
                      <a href="${editUrl}" class="btn btn-outline-secondary">Düzenle</a>
                      <form method="post" action="${deleteUrl}" onsubmit="return confirm('Kaydı silmek istediğinize emin misiniz?');">
                          <button type="submit" class="btn btn-outline-danger">Sil</button>
                      </form>
                  </div>
              </td>
          </tr>
        `;
      })
      .join("");

    tableBody.innerHTML = html;
  };

  const performSearch = () => {
    const fileValue = fileInput?.value.trim() || "";
    const nameValue = nameInput?.value.trim() || "";

    const params = new URLSearchParams();
    if (fileValue) {
      params.append("file_no", fileValue);
    }
    if (nameValue) {
      params.append("full_name", nameValue);
    }

    if (activeController) {
      activeController.abort();
    }
    activeController = new AbortController();
    const signal = activeController.signal;

    const url = params.toString() ? `${searchUrl}?${params.toString()}` : searchUrl;
    tableBody.innerHTML = loadingMarkup;

    fetch(url, { signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Arama başarısız oldu.");
        }
        return response.json();
      })
      .then((data) => {
        renderRows(data.persons || []);
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }
        tableBody.innerHTML = `<tr class="table-error"><td colspan="7" class="text-center text-danger py-4">Arama sırasında bir hata oluştu.</td></tr>`;
      });
  };

  const scheduleSearch = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(performSearch, 350);
  };

  fileInput?.addEventListener("input", scheduleSearch);
  nameInput?.addEventListener("input", scheduleSearch);
}
