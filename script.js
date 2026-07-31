(async function () {
  "use strict";

  const root = document.getElementById("site-root");
  const savedLanguage = localStorage.getItem("academic-site-language");

  try {
    const response = await fetch("site-data.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Unable to load site-data.json (${response.status})`);
    }

    const data = await response.json();
    SiteRenderer.renderAcademicSite(data, { target: root });
    SiteRenderer.setLanguage(savedLanguage || "en");
  } catch (error) {
    root.classList.remove("site-loading");
    root.replaceChildren();
    const message = document.createElement("p");
    const isFilePreview = window.location.protocol === "file:";
    message.className = "load-error";
    message.textContent = isFilePreview
      ? "请不要直接双击 index.html 打开网页。浏览器会阻止读取 site-data.json，请通过本地服务器预览，例如 http://127.0.0.1:8123/index.html，或部署到 GitHub Pages 后访问。"
      : "site-data.json could not be loaded. 请检查 JSON 格式，并确认正在通过本地服务器或 GitHub Pages 访问网页。";
    root.append(message);
    console.error(error);
  }
})();
