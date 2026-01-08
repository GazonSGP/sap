/* =========================================================
   OVERLAY CONTROLS
   Toggle Edit + Action Menu
========================================================= */

(() => {
  if (window.__OVERLAY_CONTROLS__) return;
  window.__OVERLAY_CONTROLS__ = true;

  const EDIT_KEY = "overlay_edit_mode";

  function isEdit() {
    return localStorage.getItem(EDIT_KEY) === "true";
  }

  function setEdit(v) {
    localStorage.setItem(EDIT_KEY, v ? "true" : "false");
    window.__overlaySetEditMode?.(v);
  }

  setInterval(() => {
    const tools = document.querySelector(".workspace-tools");
    if (!tools || tools.dataset.controlsReady) return;
    tools.dataset.controlsReady = "1";

    /* ---------- Toggle ---------- */

    const toggle = document.createElement("label");
    toggle.className = "overlay-toggle";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = isEdit();

    const slider = document.createElement("span");

    checkbox.onchange = () => setEdit(checkbox.checked);

    toggle.append(checkbox, slider);

    /* ---------- Menu ---------- */

    const wrap = document.createElement("div");
    wrap.className = "overlay-menu-wrap";

    const btn = document.createElement("button");
    btn.className = "secondary";
    btn.textContent = "☰";

    const menu = document.createElement("div");
    menu.className = "overlay-menu";

    function item(label, fn) {
      const i = document.createElement("div");
      i.textContent = label;
      i.onclick = () => {
        menu.classList.remove("open");
        fn();
      };
      return i;
    }

    menu.append(
      item("➕ Инструкция", () => window.__overlayCreateInstruction?.()),
      item("🧩 Модули", () => window.__overlayOpenModules?.()),
      item("📤 Экспорт инструкций", () =>
        document.querySelector(".overlay-export-btn")?.click()
      ),
      item("📤 Экспорт модулей", () =>
        document.querySelectorAll(".overlay-export-btn")[1]?.click()
      ),
      item("📥 Импорт инструкций", () =>
        document.querySelector(".overlay-import-btn")?.click()
      ),
      item("📥 Импорт модулей", () =>
        document.querySelectorAll(".overlay-import-btn")[1]?.click()
      )
    );

    btn.onclick = () => menu.classList.toggle("open");

    wrap.append(btn, menu);

    tools.append(toggle, wrap);

    /* ---------- Init state ---------- */

    setEdit(isEdit());
  }, 300);
})();
