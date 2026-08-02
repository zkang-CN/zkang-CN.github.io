(function () {
  "use strict";

  const DEFAULT_LANGUAGE = "en";
  const DEFAULT_SECTION_ORDER = ["about", "news", "research", "publications", "projects", "education", "service", "contact"];
  const DEFAULT_NAVIGATION_LABELS = {
    about: { en: "About", zh: "简介" },
    news: { en: "News", zh: "动态" },
    research: { en: "Research", zh: "研究" },
    publications: { en: "Publications", zh: "论文" },
    projects: { en: "Projects", zh: "项目" },
    education: { en: "Education", zh: "教育" },
    service: { en: "Service", zh: "服务" },
    contact: { en: "Contact", zh: "联系" }
  };
  let currentData = null;

  function resolveTarget(target) {
    if (!target) {
      return document.getElementById("site-root");
    }
    if (typeof target === "string") {
      return document.querySelector(target);
    }
    return target;
  }

  function textFor(value, language) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (Object.prototype.hasOwnProperty.call(value, language)) {
        return value[language] || "";
      }
      if (Object.prototype.hasOwnProperty.call(value, "en")) {
        return value.en || "";
      }
      if (Object.prototype.hasOwnProperty.call(value, "zh")) {
        return value.zh || "";
      }
      return "";
    }
    return value || "";
  }

  function el(tag, attrs, children) {
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
      } else if (key.startsWith("data")) {
        const dataKey = key.slice(4).replace(/^[A-Z]/, (letter) => letter.toLowerCase());
        node.dataset[dataKey] = value;
      } else {
        node.setAttribute(key, value);
      }
    });

    (Array.isArray(children) ? children : [children]).filter(Boolean).forEach((child) => {
      node.append(child);
    });
    return node;
  }

  function localized(tag, className, value) {
    const wrapper = document.createDocumentFragment();
    ["en", "zh"].forEach((language) => {
      wrapper.append(
        el(tag, {
          className,
          dataLang: language,
          text: textFor(value, language)
        })
      );
    });
    return wrapper;
  }

  function sectionTitle(id, title, action) {
    const children = [el("h2", { id }, localized("span", "", title))];
    if (action) {
      children.push(
        el("a", { className: "section-action", href: action.href }, localized("span", "", action.label))
      );
    }
    children.push(el("span", { className: "section-rule", "aria-hidden": "true" }));
    return el("div", { className: "section-heading" }, children);
  }

  function bilingualValue(enValue, zhValue) {
    if (enValue && typeof enValue === "object" && !Array.isArray(enValue)) {
      return enValue;
    }
    return {
      en: enValue || "",
      zh: zhValue || enValue || ""
    };
  }

  function renderTag(tag, className) {
    const wrapper = document.createDocumentFragment();
    ["en", "zh"].forEach((language) => {
      const text = textFor(tag, language);
      if (!text) {
        return;
      }
      wrapper.append(el("span", { className, dataLang: language, text }));
    });
    return wrapper;
  }

  function getSectionOrder(data) {
    const requestedOrder = Array.isArray(data.sectionOrder) ? data.sectionOrder : DEFAULT_SECTION_ORDER;
    const seen = new Set();
    const ordered = requestedOrder.filter((id) => {
      const isKnown = DEFAULT_SECTION_ORDER.includes(id);
      const isNew = !seen.has(id);
      if (isKnown && isNew) {
        seen.add(id);
        return true;
      }
      return false;
    });
    DEFAULT_SECTION_ORDER.forEach((id) => {
      if (!seen.has(id)) {
        ordered.push(id);
      }
    });
    return ordered;
  }

  function getNavigationItem(data, id) {
    return (data.navigation || []).find((item) => item.id === id) || {
      id,
      label: DEFAULT_NAVIGATION_LABELS[id] || { en: id, zh: id }
    };
  }

  function getHomepageLimit(data, key) {
    const fallback = key === "publicationCount" ? 5 : 3;
    const value = Number(data.homepage && data.homepage[key]);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
  }

  function sectionHref(id, basePath) {
    return basePath ? `${basePath}#${id}` : `#${id}`;
  }

  function renderHeader(data, options) {
    const basePath = options && options.basePath ? options.basePath : "";
    const nameNode = document.getElementById("site-name");
    const navNode = document.getElementById("site-nav");
    const switchNode = document.getElementById("language-switch");

    if (nameNode) {
      nameNode.textContent = `${textFor(data.profile.name, "en")} / ${textFor(data.profile.name, "zh")}`;
      nameNode.href = sectionHref("about", basePath);
    }

    if (navNode) {
      const orderedNavigation = getSectionOrder(data).map((id) => getNavigationItem(data, id));
      navNode.replaceChildren(
        ...orderedNavigation.map((item) =>
          el("a", { href: sectionHref(item.id, basePath) }, localized("span", "", item.label))
        )
      );
    }

    if (switchNode) {
      const english = el("button", {
        type: "button",
        className: "language-button",
        dataLanguage: "en",
        text: "EN"
      });
      const chinese = el("button", {
        type: "button",
        className: "language-button",
        dataLanguage: "zh",
        text: "中文"
      });
      switchNode.replaceChildren(english, chinese);
      switchNode.querySelectorAll("[data-language]").forEach((button) => {
        button.addEventListener("click", () => setLanguage(button.dataset.language));
      });
    }
  }

  function renderProfile(data) {
    const profile = data.profile;
    const details = (profile.details || []).map((item) =>
      el("li", {}, [
        el("span", { className: "detail-label" }, localized("span", "", item.label)),
        el("span", { className: "detail-value" }, localized("span", "", item.value))
      ])
    );

    const tags = (profile.tags || []).map((tag) => renderTag(tag, "tag"));
    const links = (profile.links || []).map((link) =>
      el("a", { className: "text-link", href: link.href, target: link.href.startsWith("http") ? "_blank" : undefined, rel: "noreferrer" }, localized("span", "", link.label))
    );

    return el("aside", { className: "profile-sidebar" }, [
      el("figure", { className: "profile-photo" }, [
        el("img", {
          src: profile.photo,
          alt: textFor(profile.photoAlt, "en"),
          loading: "eager"
        })
      ]),
      el("div", { className: "profile-copy" }, [
        el("p", { className: "eyebrow" }, localized("span", "", profile.subtitle)),
        el("h1", {}, localized("span", "", profile.name)),
        el("p", { className: "role" }, localized("span", "", profile.role)),
        el("p", { className: "location" }, localized("span", "", profile.location)),
        el("div", { className: "profile-links" }, links),
        el("ul", { className: "profile-details" }, details),
        el("div", { className: "tag-list" }, tags)
      ])
    ]);
  }

  function renderAbout(data) {
    return el("section", { className: "section-block", id: "about" }, [
      sectionTitle("about-heading", data.about.heading),
      el("p", { className: "lead" }, localized("span", "", data.about.body))
    ]);
  }

  function renderNews(data) {
    return el("section", { className: "section-block", id: "news" }, [
      sectionTitle("news-heading", { en: "News", zh: "近期动态" }),
      el(
        "ol",
        { className: "timeline-list" },
        (data.news || []).map((item) =>
          el("li", {}, [
            el("time", { text: item.date }),
            el("p", {}, localized("span", "", item.text))
          ])
        )
      )
    ]);
  }

  function renderResearch(data) {
    return el("section", { className: "section-block", id: "research" }, [
      sectionTitle("research-heading", { en: "Research Interests", zh: "研究方向" }),
      el(
        "div",
        { className: "research-list" },
        (data.researchInterests || []).map((item) =>
          el("article", { className: "research-item" }, [
            el("h3", {}, localized("span", "", bilingualValue(item.title, item.titleZh))),
            el("p", {}, localized("span", "", item.body))
          ])
        )
      )
    ]);
  }

  function renderPublications(data) {
    const publications = data.publications || [];
    const visiblePublications = publications.slice(0, getHomepageLimit(data, "publicationCount"));
    return el("section", { className: "section-block", id: "publications" }, [
      sectionTitle("publications-heading", { en: "Selected Publications", zh: "代表性论文" }, {
        href: "publications.html",
        label: { en: "All Publications", zh: "全部论文" }
      }),
      renderPublicationList(visiblePublications)
    ]);
  }

  function renderPublicationList(items) {
    return el(
      "ol",
      { className: "publication-list" },
      (items || []).map((item) => {
        const children = [
          el("p", { className: "publication-title", text: item.title }),
          el("p", { className: "publication-meta", text: `${item.authors}. ${item.venue}, ${item.year}.` }),
          el(
            "div",
            { className: "publication-tags" },
            (item.tags || []).map((tag) => renderTag(tag, "tag subtle"))
          )
        ];
        if (item.doi) {
          children.push(el("a", { className: "text-link publication-doi", href: `https://doi.org/${item.doi}`, target: "_blank", rel: "noreferrer", text: `doi: ${item.doi}` }));
        }
        return el("li", {}, children);
      })
    );
  }

  function renderProjects(data) {
    const projects = data.projects || [];
    const visibleProjects = projects.slice(0, getHomepageLimit(data, "projectCount"));
    return el("section", { className: "section-block", id: "projects" }, [
      sectionTitle("projects-heading", { en: "Selected Projects", zh: "代表性项目" }, {
        href: "projects.html",
        label: { en: "All Projects", zh: "全部项目" }
      }),
      renderProjectList(visibleProjects)
    ]);
  }

  function renderProjectList(items) {
    return el(
      "div",
      { className: "entry-list" },
      (items || []).map((item) =>
        el("article", { className: "entry-item" }, [
          el("time", { text: item.period }),
          el("div", {}, [
            el("h3", {}, localized("span", "", item.title)),
            el("p", {}, localized("span", "", item.body))
          ])
        ])
      )
    );
  }

  function renderEducation(data) {
    return el("section", { className: "section-block", id: "education" }, [
      sectionTitle("education-heading", { en: "Education", zh: "教育经历" }),
      el(
        "div",
        { className: "entry-list compact" },
        (data.education || []).map((item) =>
          el("article", { className: "entry-item" }, [
            el("time", { text: item.period }),
            el("div", {}, [
              el("h3", {}, localized("span", "", item.institution)),
              el("p", {}, localized("span", "", item.body))
            ])
          ])
        )
      )
    ]);
  }

  function renderService(data) {
    return el("section", { className: "section-block", id: "service" }, [
      sectionTitle("service-heading", { en: "Academic Service", zh: "学术服务" }),
      el(
        "ul",
        { className: "plain-list" },
        (data.service || []).map((item) => el("li", {}, localized("span", "", item.text)))
      )
    ]);
  }

  function renderContact(data) {
    return el("section", { className: "section-block", id: "contact" }, [
      sectionTitle("contact-heading", data.contact.heading),
      el("p", {}, localized("span", "", data.contact.body)),
      el("a", { className: "text-link contact-link", href: `mailto:${data.profile.email}`, text: data.profile.email })
    ]);
  }

  function detailHeading(title, body) {
    return el("section", { className: "detail-hero" }, [
      el("a", { className: "text-link back-link", href: "index.html#about" }, localized("span", "", { en: "Back to profile", zh: "返回主页" })),
      el("h1", {}, localized("span", "", title)),
      el("p", {}, localized("span", "", body))
    ]);
  }

  function renderAllPublicationsPage(data) {
    return el("div", { className: "detail-page" }, [
      detailHeading(
        { en: "All Publications", zh: "全部论文" },
        { en: "A complete list of publications maintained from site-data.json.", zh: "以下论文列表由 site-data.json 统一维护。" }
      ),
      el("section", { className: "section-block detail-list-block" }, [
        sectionTitle("all-publications-heading", { en: "Publications", zh: "论文列表" }),
        renderPublicationList(data.publications || [])
      ])
    ]);
  }

  function renderAllProjectsPage(data) {
    return el("div", { className: "detail-page" }, [
      detailHeading(
        { en: "All Projects", zh: "全部项目" },
        { en: "A complete list of project experience maintained from site-data.json.", zh: "以下项目经历由 site-data.json 统一维护。" }
      ),
      el("section", { className: "section-block detail-list-block" }, [
        sectionTitle("all-projects-heading", { en: "Projects", zh: "项目列表" }),
        renderProjectList(data.projects || [])
      ])
    ]);
  }

  const sectionRenderers = {
    about: renderAbout,
    news: renderNews,
    research: renderResearch,
    publications: renderPublications,
    projects: renderProjects,
    education: renderEducation,
    service: renderService,
    contact: renderContact
  };

  function renderAcademicSite(data, options) {
    currentData = data;
    const target = resolveTarget(options && options.target);
    if (!target) {
      return;
    }

    renderHeader(data);
    target.classList.remove("site-loading");
    const orderedSections = getSectionOrder(data)
      .map((id) => sectionRenderers[id])
      .filter(Boolean)
      .map((renderer) => renderer(data));
    target.replaceChildren(
      el("div", { className: "academic-layout" }, [
        renderProfile(data),
        el("div", { className: "content-column" }, orderedSections)
      ])
    );
  }

  function renderDetailPage(data, options) {
    currentData = data;
    const target = resolveTarget(options && options.target);
    if (!target) {
      return;
    }

    const page = options && options.page === "projects" ? "projects" : "publications";
    renderHeader(data, { basePath: "index.html" });
    target.classList.remove("site-loading");
    target.replaceChildren(
      page === "projects" ? renderAllProjectsPage(data) : renderAllPublicationsPage(data)
    );
  }

  function setLanguage(language, options) {
    const nextLanguage = language === "zh" ? "zh" : DEFAULT_LANGUAGE;
    document.documentElement.lang = nextLanguage === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-lang]").forEach((node) => {
      node.hidden = node.dataset.lang !== nextLanguage;
    });
    document.querySelectorAll("[data-language]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.language === nextLanguage);
      button.setAttribute("aria-pressed", String(button.dataset.language === nextLanguage));
    });
    if (currentData && currentData.meta) {
      document.title = textFor(currentData.meta.title, nextLanguage);
      const description = document.querySelector('meta[name="description"]');
      if (description) {
        description.content = textFor(currentData.meta.description, nextLanguage);
      }
    }
    if (!options || options.persist !== false) {
      localStorage.setItem("academic-site-language", nextLanguage);
    }
  }

  window.SiteRenderer = {
    renderAcademicSite,
    renderDetailPage,
    setLanguage,
    getSectionOrder,
    getHomepageLimit,
    textFor
  };
})();
