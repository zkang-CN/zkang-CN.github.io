(async function () {
  "use strict";

  const root = document.getElementById("page-root");
  const savedLanguage = localStorage.getItem("academic-site-language");

  try {
    const response = await fetch("site-data.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Unable to load site-data.json (${response.status})`);
    }

    const data = await response.json();
    SiteRenderer.renderDetailPage(data, {
      target: root,
      page: root.dataset.page
    });
    SiteRenderer.setLanguage(savedLanguage || "en");
  } catch (error) {
    root.classList.remove("site-loading");
    root.replaceChildren();
    const message = document.createElement("p");
    const isFilePreview = window.location.protocol === "file:";
    message.className = "load-error";
    message.textContent = isFilePreview
      ? "请不要直接双击 HTML 文件打开网页。浏览器会阻止读取 site-data.json，请通过本地服务器预览，或部署到 GitHub Pages 后访问。"
      : "site-data.json could not be loaded. 请检查 JSON 格式，并确认正在通过本地服务器或 GitHub Pages 访问网页。";
    root.append(message);
    console.error(error);
  }
})();
