/* =========================================================
   OVERLAY BOOTSTRAP — FINAL FULL WITH REAL UPLOAD
========================================================= */

(() => {
  if (window.__OVERLAY_FINAL__) return;
  window.__OVERLAY_FINAL__ = true;

  const state = { edit: false, activeId: null };

  /* ================= PUBLIC API FOR CONTROLS ================= */

  window.__overlaySetEditMode = (v) => {
    state.edit = v;
    applyEditMode();
  };
  window.__overlayCreateInstruction = createInstruction;
  window.__overlayOpenModules = openModules;

  /* ================= FETCH OVERRIDE ================= */

  const nativeFetch = window.fetch;
  window.fetch = async (url, opts) => {
    if (url.includes("instructions.json")) {
      const cached = localStorage.getItem("overlay_instructions");
      if (cached) return new Response(cached);
    }
    if (url.includes("modules.json")) {
      const cached = localStorage.getItem("overlay_modules");
      if (cached) return new Response(cached);
    }
    return nativeFetch(url, opts);
  };

  /* ================= EDIT MODE ================= */

  function applyEditMode() {
    document.querySelectorAll(".instruction-card").forEach((card) => {
      card.classList.toggle("overlay-outline", state.edit);

      card.onclick = () => {
        if (state.edit) state.activeId = card.dataset.id;
      };

      let x = card.querySelector(".overlay-x");

      if (state.edit && !x) {
        x = document.createElement("div");
        x.className = "overlay-x";
        x.textContent = "✕";
        x.onclick = (e) => {
          e.stopPropagation();
          if (!confirm("Удалить?")) return;

          fetch("data/instructions.json")
            .then((r) => r.json())
            .then((list) => {
              localStorage.setItem(
                "overlay_instructions",
                JSON.stringify(list.filter((i) => i.id !== card.dataset.id))
              );
              location.reload();
            });
        };
        card.appendChild(x);
      }

      if (!state.edit && x) x.remove();
    });
  }

  setInterval(() => state.edit && applyEditMode(), 400);

  /* ================= CREATE INSTRUCTION ================= */

  function createInstruction() {
    Promise.all([
      fetch("data/instructions.json").then((r) => r.json()),
      fetch("data/modules.json").then((r) => r.json()),
    ]).then(([list, modules]) => {
      list.push({
        id: "i_" + Date.now(),
        title: "Новая инструкция",
        transactionCode: "",
        moduleId: modules[0]?.id || "",
        steps: [],
        notes: "",
        media: [],
      });
      localStorage.setItem("overlay_instructions", JSON.stringify(list));
      location.reload();
    });
  }

  /* ================= CORE MODAL OBSERVER ================= */

  new MutationObserver(() => {
    if (!state.edit || !state.activeId) return;

    const modal = document.querySelector(".modal-window");
    if (!modal || modal.dataset.overlayBound) return;
    modal.dataset.overlayBound = "1";

    modal
      .querySelectorAll("#modalTitle,#modalTransaction")
      .forEach((el) => (el.contentEditable = "true"));

    const header = modal.querySelector(".modal-header");
    if (!header) return;

    injectBtn(header, "Шаги", openSteps);
    injectBtn(header, "Примечание", openNotes);
    injectBtn(header, "Файлы", openFiles);
    injectBtn(header, "Сохранить", saveMain);

    injectModuleSelect(header);
  }).observe(document.body, { childList: true, subtree: true });

  function injectBtn(h, t, fn) {
    if ([...h.children].some((b) => b.textContent === t)) return;
    const b = document.createElement("button");
    b.className = "secondary";
    b.textContent = t;
    b.onclick = fn;
    h.appendChild(b);
  }

  /* ================= SAVE MAIN ================= */

  function saveMain() {
    fetch("data/instructions.json")
      .then((r) => r.json())
      .then((list) => {
        const inst = list.find((i) => i.id === state.activeId);
        const modal = document.querySelector(".modal-window");

        inst.title =
          modal.querySelector("#modalTitle")?.innerText || inst.title;
        inst.transactionCode =
          modal.querySelector("#modalTransaction")?.innerText ||
          inst.transactionCode;

        localStorage.setItem("overlay_instructions", JSON.stringify(list));
        location.reload();
      });
  }

  /* ================= MODULE SELECT ================= */

  function injectModuleSelect(header) {
    if (header.querySelector(".overlay-module-select")) return;

    Promise.all([
      fetch("data/instructions.json").then((r) => r.json()),
      fetch("data/modules.json").then((r) => r.json()),
    ]).then(([insts, modules]) => {
      const inst = insts.find((i) => i.id === state.activeId);

      const sel = document.createElement("select");
      sel.className = "overlay-module-select";

      modules.forEach((m) => {
        const o = document.createElement("option");
        o.value = m.id;
        o.textContent = m.code || m.name;
        if (m.id === inst.moduleId) o.selected = true;
        sel.appendChild(o);
      });

      sel.onchange = () => {
        inst.moduleId = sel.value;
        localStorage.setItem("overlay_instructions", JSON.stringify(insts));
      };

      header.appendChild(sel);
    });
  }

  /* ================= GENERIC OVERLAY ================= */

  function openOverlay(title, values, onSave, single = false) {
    const bg = document.createElement("div");
    bg.className = "overlay-modal-bg";

    const box = document.createElement("div");
    box.className = "overlay-modal";

    const h = document.createElement("h3");
    h.textContent = title;

    const body = document.createElement("div");
    const rows = [];

    (values || []).forEach((v) => addRow(body, v, rows, single));

    if (!single) {
      const add = document.createElement("button");
      add.className = "secondary";
      add.textContent = "+ Добавить";
      add.onclick = () => addRow(body, "", rows, single);
      body.appendChild(add);
    }

    const save = document.createElement("button");
    save.className = "secondary";
    save.textContent = "Сохранить";
    save.onclick = () => {
      onSave(rows.map((r) => r.value).filter(Boolean));
      bg.remove();
    };

    box.append(h, body, save);
    bg.appendChild(box);
    document.body.appendChild(bg);
  }

  function addRow(c, v, rows, single) {
    const r = document.createElement("div");
    r.className = "overlay-row";
    const ta = document.createElement("textarea");
    ta.value = v || "";
    rows.push(ta);
    r.appendChild(ta);

    if (!single) {
      const d = document.createElement("button");
      d.className = "secondary";
      d.textContent = "✕";
      d.onclick = () => r.remove();
      r.appendChild(d);
    }
    c.appendChild(r);
  }

  /* ================= STEPS / NOTES ================= */

  function openSteps() {
    fetch("data/instructions.json")
      .then((r) => r.json())
      .then((list) => {
        const inst = list.find((i) => i.id === state.activeId);
        openOverlay("Шаги", inst.steps, (v) => {
          inst.steps = v;
          localStorage.setItem("overlay_instructions", JSON.stringify(list));
        });
      });
  }

  function openNotes() {
    fetch("data/instructions.json")
      .then((r) => r.json())
      .then((list) => {
        const inst = list.find((i) => i.id === state.activeId);
        openOverlay(
          "Примечание",
          [inst.notes],
          (v) => {
            inst.notes = v.join("\n");
            localStorage.setItem("overlay_instructions", JSON.stringify(list));
          },
          true
        );
      });
  }

  /* ================= FILES ================= */

  function openFiles() {
    fetch("data/instructions.json")
      .then((r) => r.json())
      .then((list) => {
        const inst = list.find((i) => i.id === state.activeId);
        inst.media ||= [];

        const bg = document.createElement("div");
        bg.className = "overlay-modal-bg";

        const box = document.createElement("div");
        box.className = "overlay-modal";

        const h = document.createElement("h3");
        h.textContent = "Файлы";

        const body = document.createElement("div");

        function render() {
          body.innerHTML = "";
          inst.media.forEach((f, idx) => {
            const r = document.createElement("div");
            r.className = "overlay-row";

            const i = document.createElement("input");
            i.value = f.filename || "";
            i.oninput = () => (f.filename = i.value);

            const d = document.createElement("button");
            d.className = "secondary";
            d.textContent = "✕";
            d.onclick = async () => {
              await fetch("/delete-file", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: f.url }),
              });
              inst.media.splice(idx, 1);
              render();
            };

            r.append(i, d);
            body.appendChild(r);
          });
        }

        render();

        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;

        input.onchange = async () => {
          const fd = new FormData();
          [...input.files].forEach((f) => fd.append("files", f));
          const res = await fetch("/upload", { method: "POST", body: fd });
          const uploaded = await res.json();
          uploaded.forEach((f) => inst.media.push(f));
          input.value = "";
          render();
        };

        const add = document.createElement("button");
        add.className = "secondary";
        add.textContent = "Добавить файл";
        add.onclick = () => input.click();

        const save = document.createElement("button");
        save.className = "secondary";
        save.textContent = "Сохранить";
        save.onclick = () => {
          localStorage.setItem("overlay_instructions", JSON.stringify(list));
          bg.remove();
        };

        box.append(h, body, add, save, input);
        bg.appendChild(box);
        document.body.appendChild(bg);
      });
  }

  /* ================= MODULES ================= */

  function openModules() {
    fetch("data/modules.json")
      .then((r) => r.json())
      .then((mods) => {
        const bg = document.createElement("div");
        bg.className = "overlay-modal-bg";

        const box = document.createElement("div");
        box.className = "overlay-modal";

        const h = document.createElement("h3");
        h.textContent = "Модули";

        const body = document.createElement("div");

        function render() {
          body.innerHTML = "";
          mods.forEach((m, i) => {
            const r = document.createElement("div");
            r.className = "overlay-row";

            const n = document.createElement("input");
            n.value = m.code || "";
            n.oninput = () => (m.code = m.name = n.value);

            const c = document.createElement("input");
            c.type = "color";
            c.value = m.color || "#ccc";
            c.oninput = () => (m.color = c.value);

            const d = document.createElement("button");
            d.className = "secondary";
            d.textContent = "✕";
            d.onclick = () => {
              mods.splice(i, 1);
              render();
            };

            r.append(n, c, d);
            body.appendChild(r);
          });
        }

        render();

        const add = document.createElement("button");
        add.className = "secondary";
        add.textContent = "Добавить модуль";
        add.onclick = () => {
          mods.push({
            id: "m_" + Date.now(),
            code: "Новый модуль",
            name: "Новый модуль",
            color: "#ccc",
          });
          render();
        };

        const save = document.createElement("button");
        save.className = "secondary";
        save.textContent = "Сохранить";
        save.onclick = () => {
          localStorage.setItem("overlay_modules", JSON.stringify(mods));
          location.reload();
        };

        box.append(h, body, add, save);
        bg.appendChild(box);
        document.body.appendChild(bg);
      });
  }
})();
