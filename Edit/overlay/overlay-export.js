/* =========================================================
   OVERLAY EXPORT — MODULES & INSTRUCTIONS
   Изолированная надстройка
========================================================= */

(() => {
  if (window.__OVERLAY_EXPORT__) return;
  window.__OVERLAY_EXPORT__ = true;

  /* ---------- helpers ---------- */

  function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function getData(key, fallbackUrl) {
    const cached = localStorage.getItem(key);
    if (cached) return Promise.resolve(JSON.parse(cached));
    return fetch(fallbackUrl).then((r) => r.json());
  }

  /* ---------- buttons ---------- */

  setInterval(() => {
    const tools = document.querySelector(".workspace-tools");
    if (!tools || tools.dataset.exportReady) return;
    tools.dataset.exportReady = "1";

    const makeBtn = (label) => {
      const b = document.createElement("button");
      b.className = "secondary overlay-export-btn";
      b.textContent = label;
      return b;
    };

    const btnInst = makeBtn("Экспорт инструкций");
    const btnMods = makeBtn("Экспорт модулей");

    btnInst.onclick = async () => {
      const data = await getData(
        "overlay_instructions",
        "data/instructions.json"
      );
      downloadJSON(data, "instructions.json");
    };

    btnMods.onclick = async () => {
      const data = await getData("overlay_modules", "data/modules.json");
      downloadJSON(data, "modules.json");
    };

    tools.append(btnInst, btnMods);
  }, 300);
})();
