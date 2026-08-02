(function () {
  "use strict";

  const editorRoot = document.getElementById("editor-root");
  const previewRoot = document.getElementById("preview-root");
  const exportButton = document.getElementById("export-json");
  const importBox = document.getElementById("import-json");
  const applyJsonButton = document.getElementById("apply-json");
  const previewEnglish = document.getElementById("preview-en");
  const previewChinese = document.getElementById("preview-zh");

  const SIDEBAR_DETAILS_PATH = "profile.details";
  const DEFAULT_SECTION_ORDER = ["about", "news", "research", "publications", "projects", "education", "service", "contact"];
  const SECTION_LABELS = {
    about: "About / 简介",
    news: "News / 动态",
    research: "Research / 研究",
    publications: "Publications / 论文",
    projects: "Projects / 项目",
    education: "Education / 教育",
    service: "Service / 学术服务",
    contact: "Contact / 联系"
  };

  let currentData = null;
  let previewLanguage = "en";

  const fieldGroups = [
    {
      title: "Profile / 个人信息",
      fields: [
        ["profile.name.en", "Name EN"],
        ["profile.name.zh", "姓名中文"],
        ["profile.role.en", "Role EN", "textarea"],
        ["profile.role.zh", "身份中文", "textarea"],
        ["profile.subtitle.en", "Subtitle EN"],
        ["profile.subtitle.zh", "副标题中文"],
        ["profile.photo", "Photo path"],
        ["profile.photoAlt.en", "Photo alt EN"],
        ["profile.photoAlt.zh", "照片说明中文"],
        ["profile.cv", "CV path"],
        ["profile.email", "Email"],
        ["profile.location.en", "Location EN"],
        ["profile.location.zh", "所在地中文"],
        ["profile.tags", "Tags", "list"]
      ]
    },
    {
      title: "Homepage Display / 首页展示",
      fields: [
        ["homepage.publicationCount", "Homepage publication count", "number"],
        ["homepage.projectCount", "Homepage project count", "number"]
      ]
    },
    {
      title: "About & Contact / 简介与联系",
      fields: [
        ["about.body.en", "About EN", "textarea"],
        ["about.body.zh", "简介中文", "textarea"],
        ["contact.body.en", "Contact EN", "textarea"],
        ["contact.body.zh", "联系中文", "textarea"]
      ]
    }
  ];

  const collectionGroups = [
    {
      key: "news",
      title: "News / 动态",
      hint: "date | English text | 中文内容"
    },
    {
      key: "researchInterests",
      title: "Research / 研究方向",
      hint: "English title | 中文标题 | English description | 中文描述"
    },
    {
      key: "publications",
      title: "Publications / 论文",
      hint: "year | title | authors | venue | English tag / 中文标签, tag2 | doi"
    },
    {
      key: "projects",
      title: "Projects / 项目",
      hint: "period | English title | 中文标题 | English description | 中文描述"
    },
    {
      key: "education",
      title: "Education / 教育",
      hint: "period | English institution | 中文机构 | English description | 中文描述"
    },
    {
      key: "service",
      title: "Service / 学术服务",
      hint: "English text | 中文内容"
    }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getByPath(source, path) {
    return path.split(".").reduce((node, key) => (node ? node[key] : undefined), source);
  }

  function setByPath(source, path, value) {
    const keys = path.split(".");
    const finalKey = keys.pop();
    const node = keys.reduce((current, key) => {
      current[key] = current[key] || {};
      return current[key];
    }, source);
    node[finalKey] = value;
  }

  function makeNode(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === false) {
        return;
      }
      if (key === "className") {
        node.className = value;
      } else if (key === "text") {
        node.textContent = value;
      } else if (key === "htmlFor") {
        node.htmlFor = value;
      } else if (key.startsWith("on") && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        node.setAttribute(key, value);
      }
    });
    (Array.isArray(children) ? children : [children]).filter(Boolean).forEach((child) => node.append(child));
    return node;
  }

  function normalizeSectionOrder(data) {
    const requestedOrder = Array.isArray(data.sectionOrder) ? data.sectionOrder : DEFAULT_SECTION_ORDER;
    const seen = new Set();
    const order = requestedOrder.filter((id) => {
      if (!DEFAULT_SECTION_ORDER.includes(id) || seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
    DEFAULT_SECTION_ORDER.forEach((id) => {
      if (!seen.has(id)) {
        order.push(id);
      }
    });
    data.sectionOrder = order;
  }

  function normalizeData(data) {
    data.profile = data.profile || {};
    data.profile.details = data.profile.details || [];
    data.profile.tags = data.profile.tags || [];
    data.homepage = data.homepage || {};
    data.homepage.publicationCount = Math.max(1, Number.parseInt(data.homepage.publicationCount, 10) || 5);
    data.homepage.projectCount = Math.max(1, Number.parseInt(data.homepage.projectCount, 10) || 3);
    normalizeSectionOrder(data);
  }

  function serializeSidebarDetails(items) {
    return (items || [])
      .map((item) => [
        item.label && item.label.en ? item.label.en : "",
        item.label && item.label.zh ? item.label.zh : "",
        item.value && item.value.en ? item.value.en : "",
        item.value && item.value.zh ? item.value.zh : ""
      ].join(" | "))
      .join("\n");
  }

  function parseSidebarDetails(value) {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split("|").map((part) => part.trim()))
      .map((parts) => ({
        label: {
          en: parts[0] || "",
          zh: parts[1] || ""
        },
        value: {
          en: parts[2] || "",
          zh: parts[3] || ""
        }
      }));
  }

  function formatTagForEditor(tag) {
    if (tag && typeof tag === "object" && !Array.isArray(tag)) {
      if (tag.en !== undefined || tag.zh !== undefined) {
        if (tag.en !== tag.zh) {
          return `${tag.en || ""} / ${tag.zh || ""}`;
        }
        return tag.en || tag.zh || "";
      }
      return "";
    }
    return tag || "";
  }

  function parseTagFromEditor(value) {
    const tag = value.trim();
    if (!tag) {
      return "";
    }
    const parts = tag.split(/\s*\/\s*/).map((part) => part.trim());
    if (parts.length >= 2) {
      return {
        en: parts[0],
        zh: parts.slice(1).join(" / ")
      };
    }
    return tag;
  }

  function serializeCollection(key, items) {
    if (key === "news") {
      return items.map((item) => [item.date, item.text.en, item.text.zh].join(" | ")).join("\n");
    }
    if (key === "researchInterests") {
      return items.map((item) => [item.title.en || item.title, item.title.zh || item.titleZh, item.body.en, item.body.zh].join(" | ")).join("\n");
    }
    if (key === "publications") {
      return items
        .map((item) => [item.year, item.title, item.authors, item.venue, (item.tags || []).map(formatTagForEditor).join(", "), item.doi || ""].join(" | "))
        .join("\n");
    }
    if (key === "projects") {
      return items.map((item) => [item.period, item.title.en, item.title.zh, item.body.en, item.body.zh].join(" | ")).join("\n");
    }
    if (key === "education") {
      return items
        .map((item) => [item.period, item.institution.en, item.institution.zh, item.body.en, item.body.zh].join(" | "))
        .join("\n");
    }
    return items.map((item) => [item.text.en, item.text.zh].join(" | ")).join("\n");
  }

  function parseCollection(key, value) {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split("|").map((part) => part.trim()))
      .map((parts) => {
        if (key === "news") {
          return { date: parts[0] || "", text: { en: parts[1] || "", zh: parts[2] || "" } };
        }
        if (key === "researchInterests") {
          return { title: parts[0] || "", titleZh: parts[1] || "", body: { en: parts[2] || "", zh: parts[3] || "" } };
        }
        if (key === "publications") {
          return {
            year: parts[0] || "",
            title: parts[1] || "",
            authors: parts[2] || "",
            venue: parts[3] || "",
            tags: (parts[4] || "").split(",").map(parseTagFromEditor).filter(Boolean),
            doi: parts[5] || ""
          };
        }
        if (key === "projects") {
          return { period: parts[0] || "", title: { en: parts[1] || "", zh: parts[2] || "" }, body: { en: parts[3] || "", zh: parts[4] || "" } };
        }
        if (key === "education") {
          return { period: parts[0] || "", institution: { en: parts[1] || "", zh: parts[2] || "" }, body: { en: parts[3] || "", zh: parts[4] || "" } };
        }
        return { text: { en: parts[0] || "", zh: parts[1] || "" } };
      });
  }

  function renderInputField(path, label, type) {
    const id = `field-${path.replace(/\./g, "-")}`;
    const value = getByPath(currentData, path);
    const control =
      type === "textarea"
        ? makeNode("textarea", { id, rows: "4", spellcheck: "false" })
        : makeNode("input", { id, type: type === "number" ? "number" : "text", min: type === "number" ? "1" : undefined, step: type === "number" ? "1" : undefined });
    control.value = type === "list" ? (value || []).join(", ") : value || "";
    control.addEventListener("input", () => {
      const nextValue = type === "list"
        ? control.value.split(",").map((item) => item.trim()).filter(Boolean)
        : type === "number"
          ? Math.max(1, Number.parseInt(control.value, 10) || 1)
          : control.value;
      setByPath(currentData, path, nextValue);
      renderPreview();
    });

    const children = [makeNode("span", { text: label }), control];
    if (path === "profile.photo") {
      children.push(renderImageChooser(control));
    }

    return makeNode("label", { className: "field-row", htmlFor: id }, children);
  }

  function renderImageChooser(photoInput) {
    const chooser = makeNode("input", {
      className: "image-file-input",
      type: "file",
      accept: "image/*",
      "aria-label": "Choose image"
    });
    chooser.addEventListener("change", () => {
      const file = chooser.files && chooser.files[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        currentData.profile.photo = reader.result;
        photoInput.value = "embedded image selected";
        renderPreview();
      });
      reader.readAsDataURL(file);
    });

    return makeNode("div", { className: "image-picker" }, [
      makeNode("span", { className: "editor-hint", text: "Choose image for instant preview, or keep a path such as assets/profile.jpg." }),
      chooser
    ]);
  }

  function renderSidebarDetailsEditor() {
    const textarea = makeNode("textarea", { id: "profile-details-editor", rows: "5", spellcheck: "false" });
    textarea.value = serializeSidebarDetails(getByPath(currentData, SIDEBAR_DETAILS_PATH));
    textarea.addEventListener("input", () => {
      setByPath(currentData, SIDEBAR_DETAILS_PATH, parseSidebarDetails(textarea.value));
      renderPreview();
    });

    return makeNode("section", { className: "editor-section" }, [
      makeNode("h2", { text: "Sidebar Details / 左侧信息" }),
      makeNode("p", { className: "editor-hint", text: "label EN | label ZH | value EN | value ZH" }),
      textarea
    ]);
  }

  function moveSection(sectionId, direction) {
    const order = currentData.sectionOrder || DEFAULT_SECTION_ORDER.slice();
    const index = order.indexOf(sectionId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= order.length) {
      return;
    }
    [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
    currentData.sectionOrder = order;
    renderFields();
    renderPreview();
  }

  function renderSectionOrderEditor() {
    return makeNode("section", { className: "editor-section" }, [
      makeNode("h2", { text: "Section Order / 板块顺序" }),
      makeNode("p", { className: "editor-hint", text: "Use Up and Down to change public page and navigation order." }),
      makeNode(
        "div",
        { className: "section-order-list" },
        (currentData.sectionOrder || DEFAULT_SECTION_ORDER).map((sectionId, index, order) =>
          makeNode("div", { className: "section-order-item" }, [
            makeNode("span", { text: SECTION_LABELS[sectionId] || sectionId }),
            makeNode("div", { className: "order-actions" }, [
              makeNode("button", {
                type: "button",
                className: "secondary-button order-button",
                text: "Up",
                disabled: index === 0,
                onclick: () => moveSection(sectionId, -1)
              }),
              makeNode("button", {
                type: "button",
                className: "secondary-button order-button",
                text: "Down",
                disabled: index === order.length - 1,
                onclick: () => moveSection(sectionId, 1)
              })
            ])
          ])
        )
      )
    ]);
  }

  function renderFields() {
    editorRoot.replaceChildren();

    fieldGroups.forEach((group, groupIndex) => {
      const section = makeNode("section", { className: "editor-section" }, [
        makeNode("h2", { text: group.title })
      ]);

      group.fields.forEach(([path, label, type]) => {
        section.append(renderInputField(path, label, type));
      });

      editorRoot.append(section);
      if (groupIndex === 0) {
        editorRoot.append(renderSidebarDetailsEditor());
        editorRoot.append(renderSectionOrderEditor());
      }
    });

    collectionGroups.forEach((group) => {
      const id = `collection-${group.key}`;
      const textarea = makeNode("textarea", { id, rows: "7", spellcheck: "false" });
      textarea.value = serializeCollection(group.key, currentData[group.key] || []);
      textarea.addEventListener("input", () => {
        currentData[group.key] = parseCollection(group.key, textarea.value);
        renderPreview();
      });
      editorRoot.append(makeNode("section", { className: "editor-section" }, [
        makeNode("h2", { text: group.title }),
        makeNode("p", { className: "editor-hint", text: group.hint }),
        textarea
      ]));
    });
  }

  function renderPreview() {
    SiteRenderer.renderAcademicSite(currentData, { target: previewRoot });
    SiteRenderer.setLanguage(previewLanguage, { persist: false });
  }

  function exportJson() {
    const payload = JSON.stringify(currentData, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "site-data.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function applyImportedJson() {
    try {
      const parsed = JSON.parse(importBox.value);
      normalizeData(parsed);
      currentData = parsed;
      renderFields();
      renderPreview();
    } catch (error) {
      alert("JSON format is invalid. Please check commas, quotation marks, and brackets.");
      console.error(error);
    }
  }

  function setPreviewLanguage(language) {
    previewLanguage = language;
    previewEnglish.classList.toggle("is-active", language === "en");
    previewChinese.classList.toggle("is-active", language === "zh");
    renderPreview();
  }

  async function init() {
    const response = await fetch("site-data.json", { cache: "no-store" });
    currentData = clone(await response.json());
    normalizeData(currentData);
    renderFields();
    renderPreview();
  }

  exportButton.addEventListener("click", exportJson);
  applyJsonButton.addEventListener("click", applyImportedJson);
  previewEnglish.addEventListener("click", () => setPreviewLanguage("en"));
  previewChinese.addEventListener("click", () => setPreviewLanguage("zh"));
  init().catch((error) => {
    editorRoot.textContent = "Unable to load site-data.json. Please open this page through a local web server.";
    console.error(error);
  });
})();
