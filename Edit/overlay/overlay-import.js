/* =========================================================
   OVERLAY IMPORT — MODULES & INSTRUCTIONS (MERGE)
========================================================= */

(() => {
  if (window.__OVERLAY_IMPORT__) return;
  window.__OVERLAY_IMPORT__ = true;

  function readJSON(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        try {
          resolve(JSON.parse(r.result));
        } catch (e) {
          reject("Невалидный JSON");
        }
      };
      r.onerror = () => reject("Ошибка чтения файла");
      r.readAsText(file);
    });
  }

  function mergeById(current, incoming) {
    const map = new Map(current.map((i) => [i.id, i]));
    incoming.forEach((i) => {
      if (!map.has(i.id)) map.set(i.id, i);
    });
    return Array.from(map.values());
  }

  function load(key, fallbackUrl) {
    const cached = localStorage.getItem(key);
    if (cached) return Promise.resolve(JSON.parse(cached));
    return fetch(fallbackUrl).then((r) => r.json());
  }

  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  /* ---------- UI ---------- */

  setInterval(() => {
    const tools = document.querySelector(".workspace-tools");
    if (!tools || tools.dataset.importReady) return;
    tools.dataset.importReady = "1";

    const makeBtn = (label) => {
      const b = document.createElement("button");
      b.className = "secondary overlay-import-btn";
      b.textContent = label;
      return b;
    };

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    let mode = null;

    const btnInst = makeBtn("Импорт инструкций");
    const btnMods = makeBtn("Импорт модулей");

    btnInst.onclick = () => {
      mode = "instructions";
      fileInput.click();
    };

    btnMods.onclick = () => {
      mode = "modules";
      fileInput.click();
    };

    fileInput.onchange = async () => {
      const file = fileInput.files[0];
      fileInput.value = "";
      if (!file || !mode) return;

      try {
        const incoming = await readJSON(file);
        if (!Array.isArray(incoming)) {
          alert("Формат файла неверный");
          return;
        }

        if (mode === "instructions") {
          const current = await load(
            "overlay_instructions",
            "data/instructions.json"
          );
          const merged = mergeById(current, incoming);
          save("overlay_instructions", merged);
        }

        if (mode === "modules") {
          const current = await load("overlay_modules", "data/modules.json");
          const merged = mergeById(current, incoming);
          save("overlay_modules", merged);
        }

        alert("Импорт завершён");
        location.reload();
      } catch (e) {
        alert(e);
      }
    };

    tools.append(btnInst, btnMods);
  }, 300);
})();
