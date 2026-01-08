/* =========================================================
   OVERLAY LINKS — DIRECTION AWARE CUBE (PROJECT STYLE)
========================================================= */

(() => {
  if (window.__OVERLAY_LINKS__) return;
  window.__OVERLAY_LINKS__ = true;

  const LINKS = [
    {
      title: "GitHub",
      subtitle: "Profile",
      url: "https://github.com/example",
      type: "github",
    },
    {
      title: "Repository",
      subtitle: "Project",
      url: "https://github.com/example/project",
      type: "repo",
    },
  ];

  function init() {
    if (document.querySelector(".overlay-direction")) return;

    const wrap = document.createElement("div");
    wrap.className = "overlay-direction";

    const ul = document.createElement("ul");

    LINKS.forEach((l) => {
      const li = document.createElement("li");

      li.innerHTML = `
        <div class="dir-link">
          <a href="${l.url}" target="_blank"></a>
          <a href="${l.url}" target="_blank"></a>
          <a href="${l.url}" target="_blank"></a>
          <a href="${l.url}" target="_blank"></a>

          <div class="cube ${l.type}">
            <div></div>
            <div></div>
            <div></div>
            <div></div>

            <div class="face-front">
              ${l.type === "github" ? githubIcon() : repoIcon()}
              <span>${l.title}</span>
            </div>

            <div class="face-back">${l.subtitle}</div>
          </div>
        </div>
      `;

      ul.appendChild(li);
    });

    wrap.appendChild(ul);
    document.body.appendChild(wrap);
  }

  function githubIcon() {
    return `
      <svg viewBox="0 0 24 24">
        <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.43 7.86 10.96.58.11.79-.25.79-.56v-2.1c-3.2.7-3.88-1.38-3.88-1.38-.53-1.35-1.3-1.7-1.3-1.7-1.06-.73.08-.72.08-.72 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.74 1.27 3.41.97.11-.76.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.3-.52-1.5.11-3.13 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.18-1.18 3.18-1.18.63 1.63.23 2.83.11 3.13.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.42.36.8 1.08.8 2.18v3.24c0 .31.21.68.8.56A11.53 11.53 0 0 0 23.5 12C23.5 5.74 18.27.5 12 .5z"/>
      </svg>
    `;
  }

  function repoIcon() {
    return `
      <svg viewBox="0 0 24 24">
        <path d="M4 3h13a1 1 0 0 1 1 1v15.5a.5.5 0 0 1-.8.4L12 16l-5.2 3.9a.5.5 0 0 1-.8-.4V4a1 1 0 0 1 1-1zm2 2v12.6l4-3 4 3V5H6z"/>
      </svg>
    `;
  }

  setInterval(init, 300);
})();
