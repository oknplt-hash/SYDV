document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".agenda-entry-form").forEach(setupAgendaEntryForm);
});

function setupAgendaEntryForm(form) {
  const lookupUrl = form.dataset.lookupUrl;
  if (lookupUrl) {
    form.querySelectorAll("[data-person-target]").forEach((input) => {
      let debounceTimer;

      const runLookup = () => {
        const value = input.value.trim();
        const target = getTargetElement(form, input.dataset.personTarget);
        if (!target) return;

        if (!value) {
          renderLookupResult(target, { state: "empty" });
          return;
        }

        renderLookupResult(target, { state: "loading" });
        fetch(`${lookupUrl}?file_no=${encodeURIComponent(value)}`)
          .then((response) => response.json())
          .then((data) => {
            if (data.found && data.person) {
              renderLookupResult(target, {
                state: "found",
                person: data.person,
              });
            } else {
              renderLookupResult(target, { state: "not_found", fileNo: value });
            }
          })
          .catch(() => renderLookupResult(target, { state: "error" }));
      };

      input.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(runLookup, 400);
      });

      input.addEventListener("blur", runLookup);

      if (input.value.trim()) {
        runLookup();
      }
    });
  }

  setupAgendaAssistanceList(form);
}

function getTargetElement(form, selector) {
  if (!selector) return null;
  try {
    if (selector.startsWith("#")) {
      return document.querySelector(selector);
    }
    return form.querySelector(selector);
  } catch {
    return null;
  }
}

function renderLookupResult(target, payload) {
  if (!target) return;
  target.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.className = "small";

  switch (payload.state) {
    case "loading":
      wrapper.textContent = "Kayıt aranıyor…";
      wrapper.classList.add("text-muted");
      break;
    case "found": {
      const person = payload.person;
      wrapper.innerHTML = `
        <div><strong>${sanitize(person.full_name)}</strong></div>
        <div class="text-muted">Telefon: ${sanitize(person.phone) || "—"}</div>
        <div class="text-muted">Adres: ${sanitize(person.address) || "—"}</div>
        <div class="text-muted">Sosyal Güvence: ${sanitize(
          person.social_security
        ) || "—"}</div>
      `;
      break;
    }
    case "not_found":
      wrapper.textContent = `Dosya no bulunamadı: ${payload.fileNo}`;
      wrapper.classList.add("text-danger");
      break;
    case "error":
      wrapper.textContent = "Arama sırasında hata oluştu.";
      wrapper.classList.add("text-danger");
      break;
    case "empty":
    default:
      wrapper.textContent = "Dosya numarası girildiğinde kişi bilgisi burada görünecek.";
      wrapper.classList.add("text-muted");
      break;
  }

  target.appendChild(wrapper);
}

function sanitize(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setupAgendaAssistanceList(form) {
  const list = form.querySelector(".agenda-assistance-list");
  if (!list) return;
  const addButton = form.querySelector('[data-action="add-assistance-entry"]');
  const template = list.querySelector(".assistance-item");
  if (!template) return;

  const cloneTemplate = () => template.cloneNode(true);

  const resetItem = (item, data = {}) => {
    const { application_date = "", assistance_type = "", notes = "" } = data;
    item.querySelectorAll('input[type="date"]').forEach((field) => {
      field.value = application_date;
    });
    item.querySelectorAll("textarea").forEach((field) => {
      field.value = notes;
    });
    item.querySelectorAll("select").forEach((select) => {
      Array.from(select.options).forEach((option) => {
        option.selected = option.value === assistance_type;
      });
    });
    item.querySelectorAll(".remove-assistance-entry").forEach((btn) => {
      btn.disabled = false;
      btn.classList.remove("disabled");
    });
  };

  const updateRemoveButtons = () => {
    const items = list.querySelectorAll(".assistance-item");
    items.forEach((item) => {
      const btn = item.querySelector(".remove-assistance-entry");
      if (!btn) return;
      if (items.length <= 1) {
        btn.disabled = true;
        btn.classList.add("disabled");
      } else {
        btn.disabled = false;
        btn.classList.remove("disabled");
      }
    });
  };

  const addItem = (data = {}) => {
    const item = cloneTemplate();
    resetItem(item, data);
    list.appendChild(item);
    updateRemoveButtons();
  };

  // Ensure the initial template is cleaned and usable.
  if (list.children.length === 1) {
    resetItem(template);
  }
  updateRemoveButtons();

  addButton?.addEventListener("click", (event) => {
    event.preventDefault();
    addItem();
  });

  list.addEventListener("click", (event) => {
    const btn = event.target.closest(".remove-assistance-entry");
    if (!btn) return;
    event.preventDefault();
    const item = btn.closest(".assistance-item");
    if (!item) return;
    const items = list.querySelectorAll(".assistance-item");
    if (items.length <= 1) {
      resetItem(item);
      updateRemoveButtons();
      return;
    }
    item.remove();
    updateRemoveButtons();
  });
}
