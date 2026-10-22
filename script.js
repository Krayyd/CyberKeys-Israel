(() => {
  const TELEGRAM_USER = "Zero_IDD";
  const WHATSAPP_NUMBER = "972507601327";

  const PLATFORM_ICONS = {
    Steam: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a3.4 3.4 0 0 1 1.912-.59q.094.002.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911q.003.078.004.159a3.39 3.39 0 0 1-3.39 3.396 3.37 3.37 0 0 1-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0M7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375a2.37 2.37 0 0 0 .005-1.949 2.37 2.37 0 0 0-1.377-1.383 2.3 2.3 0 0 0-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.455 1.012m11.415-9.303a3.015 3.015 0 0 0-3.015-3.015 3.015 3.015 0 0 0 0 6.03 3.015 3.015 0 0 0 3.015-3.015m-5.273-.005a2.266 2.266 0 1 1 2.266 2.265 2.266 2.266 0 0 1-2.266-2.265"/></svg>`,
    Epic: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><rect x="1" y="1" width="12" height="2.2" rx="1"/><rect x="1" y="5.9" width="9" height="2.2" rx="1"/><rect x="1" y="10.8" width="6.2" height="2.2" rx="1"/></svg>`,
    EA: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="14" viewBox="0 4 24 14" fill="currentColor" aria-hidden="true"><path d="M16.635 6.162l-5.928 9.377H4.24l1.508-2.3h4.024l1.474-2.335H2.264L.79 13.239h2.156L0 17.84h12.072l4.563-7.259 1.652 2.66h-1.401l-1.473 2.299h4.347l1.473 2.3H24zm-11.461.107L3.7 8.604l9.52-.035 1.474-2.3z"/></svg>`,
    Rockstar: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 3h10.2c3.5 0 5.6 1.8 5.6 4.7 0 2.2-1.2 3.8-3.3 4.4l3.7 5.9h-4.1l-3.2-5.3H7v5.3H3V3zm4 3.2v3.9h5.6c1.4 0 2.2-.7 2.2-1.9 0-1.3-.8-2-2.2-2H7zm11.2 8.2 1.1 2.3 2.5.4-1.8 1.8.4 2.5-2.2-1.2-2.2 1.2.4-2.5-1.8-1.8 2.5-.4 1.1-2.3z"/></svg>`,
  };

  const CATEGORY_LABELS_HE = {
    Action: "Action · פעולה",
    RPG: "RPG · תפקידים",
    Horror: "Horror · אימה",
    Shooter: "Shooter · יריות",
    Survival: "Survival · הישרדות",
    Adventure: "Adventure · הרפתקאות",
    Simulation: "Simulation · סימולציה",
    Strategy: "Strategy · אסטרטגיה",
    Sports: "Sports · ספורט",
    Racing: "Racing · מרוצים",
  };

  const searchInputs = [document.querySelector("#search"), document.querySelector("#search-mobile")].filter(Boolean);
  const categorySelects = [
    document.querySelector("#category-select"),
    document.querySelector("#category-select-mobile"),
  ].filter(Boolean);
  const platformFilters = document.querySelector("#platform-filters");
  const gameGrid = document.querySelector("#game-grid");
  const emptyState = document.querySelector("#empty-state");
  const catalogError = document.querySelector("#catalog-error");
  const resultsCount = document.querySelector("#results-count");
  const maxSave = document.querySelector("[data-max-save]");
  const cardTemplate = document.querySelector("#card-template");
  const chipTemplate = document.querySelector("#chip-template");
  const menuToggle = document.querySelector("#menu-toggle");
  const mobileMenu = document.querySelector("#mobile-menu");

  let games = [];
  let activePlatform = "all";
  let activeCategory = "all";
  let searchQuery = "";

  function ils(value) {
    const amount = Math.round(Number(value));
    if (!Number.isFinite(amount)) return "₪—";
    return `₪${amount.toLocaleString("he-IL")}`;
  }

  function safeUrl(url) {
    if (typeof url !== "string" || !url.trim() || url.trim() === "#") return "";
    try {
      const parsed = new URL(url, window.location.href);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.href;
    } catch {
      return "";
    }
    return "";
  }

  function deriveHeaderFallback(coverUrl) {
    const match = String(coverUrl || "").match(/\/steam\/apps\/(\d+)\//);
    return match ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${match[1]}/header.jpg` : "";
  }

  function normalize(data) {
    const list = Array.isArray(data) ? data : data && Array.isArray(data.games) ? data.games : null;
    if (!list) throw new Error("games.json must be an array");
    return list.filter(
      (game) => game && typeof game.title === "string" && game.title.trim() && Number.isFinite(Number(game.cyberkeysPrice))
    );
  }

  function setPlatformIcon(container, platform) {
    container.replaceChildren();
    const svg = PLATFORM_ICONS[platform];
    if (svg) {
      container.innerHTML = svg;
      return;
    }
    const fallback = document.createElement("span");
    fallback.className = "platform-fallback";
    fallback.textContent = String(platform || "?").slice(0, 2).toUpperCase();
    container.append(fallback);
  }

  function createCard(game) {
    const node = cardTemplate.content.firstElementChild.cloneNode(true);
    const official = Number(game.officialPrice);
    const price = Number(game.cyberkeysPrice);
    const saved = Number.isFinite(official) ? Math.round(official - price) : 0;
    const percent = official > 0 ? Math.round((saved / official) * 100) : 0;

    const cover = node.querySelector("[data-cover]");
    const fallback = node.querySelector("[data-fallback]");
    const coverUrl = safeUrl(game.cover);
    const fallbackCoverUrl = safeUrl(game.fallbackCover) || deriveHeaderFallback(coverUrl);
    cover.alt = game.title;
    cover.loading = "lazy";

    if (coverUrl) {
      cover.src = coverUrl;
      let triedFallbackCover = false;
      cover.addEventListener("error", () => {
        if (!triedFallbackCover && fallbackCoverUrl && fallbackCoverUrl !== coverUrl) {
          triedFallbackCover = true;
          cover.src = fallbackCoverUrl;
          return;
        }
        cover.classList.add("hidden");
        fallback.classList.add("is-shown");
        fallback.textContent = game.title;
      });
    } else {
      cover.classList.add("hidden");
      fallback.classList.add("is-shown");
      fallback.textContent = game.title;
    }

    node.querySelector("[data-title]").textContent = game.title;
    node.querySelector("[data-platform-name]").textContent = game.platform || "Steam";
    setPlatformIcon(node.querySelector("[data-platform-icon]"), game.platform);

    const categoryBadge = node.querySelector("[data-category-badge]");
    if (game.category) {
      categoryBadge.textContent = game.category;
    } else {
      categoryBadge.remove();
    }

    const discount = node.querySelector("[data-discount]");
    if (percent > 0) discount.textContent = `-${percent}%`;
    else discount.remove();

    node.querySelector("[data-official]").textContent = ils(official);
    node.querySelector("[data-price]").textContent = ils(price);

    const save = node.querySelector("[data-save]");
    if (saved > 0) {
      const amount = document.createElement("span");
      amount.dir = "ltr";
      amount.textContent = ils(saved);
      save.append("חסכת ", amount, "!");
    } else {
      save.remove();
    }

    const roundedPrice = Math.round(price);
    const message = `היי, אני רוצה לקנות את המשחק ${game.title} ב-${roundedPrice}₪`;
    const encodedMessage = encodeURIComponent(message);

    const buyTelegram = node.querySelector("[data-buy-telegram]");
    buyTelegram.href = `https://t.me/${TELEGRAM_USER}?text=${encodedMessage}`;
    buyTelegram.setAttribute("aria-label", `רכישה ב-Telegram של ${game.title} ב-${roundedPrice}₪`);

    const buyWhatsapp = node.querySelector("[data-buy-whatsapp]");
    buyWhatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    buyWhatsapp.setAttribute("aria-label", `רכישה ב-WhatsApp של ${game.title} ב-${roundedPrice}₪`);

    const steam = node.querySelector("[data-steam]");
    const steamUrl = safeUrl(game.steamUrl);
    if (steamUrl) {
      steam.href = steamUrl;
      steam.setAttribute("aria-label", `עמוד רשמי של ${game.title}`);
    } else {
      steam.remove();
    }

    return node;
  }

  function renderCategoryOptions() {
    const categories = [...new Set(games.map((game) => game.category).filter(Boolean))];
    categorySelects.forEach((selectEl) => {
      selectEl.replaceChildren();

      const allOption = document.createElement("option");
      allOption.value = "all";
      allOption.textContent = `כל הקטגוריות (${games.length})`;
      selectEl.append(allOption);

      categories.forEach((cat) => {
        const count = games.filter((g) => g.category === cat).length;
        const option = document.createElement("option");
        option.value = cat;
        const label = CATEGORY_LABELS_HE[cat] || cat;
        option.textContent = `${label} (${count})`;
        selectEl.append(option);
      });

      selectEl.value = activeCategory;
    });
  }

  function renderFilters() {
    const platforms = [...new Set(games.map((game) => game.platform).filter(Boolean))];
    if (activePlatform !== "all" && !platforms.includes(activePlatform)) activePlatform = "all";
    platformFilters.replaceChildren();
    ["all", ...platforms].forEach((platform) => {
      const chip = chipTemplate.content.firstElementChild.cloneNode(true);
      chip.dataset.platform = platform;
      chip.textContent = platform === "all" ? "כל הפלטפורמות" : platform;
      if (platform !== "all") chip.setAttribute("dir", "ltr");
      const selected = platform === activePlatform;
      chip.classList.toggle("is-active", selected);
      chip.setAttribute("aria-pressed", selected ? "true" : "false");
      platformFilters.append(chip);
    });
  }

  function render() {
    const query = searchQuery.trim().toLowerCase();
    const visible = games.filter((game) => {
      const matchesTitle = !query || game.title.toLowerCase().includes(query);
      const matchesCategory = activeCategory === "all" || game.category === activeCategory;
      const matchesPlatform = activePlatform === "all" || game.platform === activePlatform;
      return matchesTitle && matchesCategory && matchesPlatform;
    });

    resultsCount.textContent =
      visible.length === 1 ? "משחק אחד" : visible.length === 0 ? "אין משחקים" : `${visible.length} משחקים`;
    gameGrid.replaceChildren();

    if (!visible.length) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    const fragment = document.createDocumentFragment();
    visible.forEach((game) => fragment.append(createCard(game)));
    gameGrid.append(fragment);
  }

  function updateHeroStat() {
    const percents = games.map((game) => {
      const official = Number(game.officialPrice);
      const price = Number(game.cyberkeysPrice);
      if (!official || official <= 0) return 0;
      return Math.round(((official - price) / official) * 100);
    });
    const maxPercent = Math.max(0, ...percents);
    if (maxPercent > 0 && maxSave) maxSave.textContent = `עד ${maxPercent}%`;
  }

  async function loadGames() {
    try {
      const response = await fetch("games.json", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      games = normalize(await response.json());
      updateHeroStat();
      renderCategoryOptions();
      renderFilters();
      render();
    } catch (error) {
      console.error(error);
      gameGrid.replaceChildren();
      resultsCount.textContent = "";
      catalogError.classList.remove("hidden");
    }
  }

  function closeMenu() {
    mobileMenu.classList.add("hidden");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  menuToggle.addEventListener("click", () => {
    const willOpen = mobileMenu.classList.contains("hidden");
    mobileMenu.classList.toggle("hidden", !willOpen);
    menuToggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  searchInputs.forEach((inputEl) => {
    inputEl.addEventListener("input", () => {
      searchQuery = inputEl.value;
      searchInputs.forEach((other) => {
        if (other !== inputEl) other.value = searchQuery;
      });
      if (games.length) render();
    });
  });

  categorySelects.forEach((selectEl) => {
    selectEl.addEventListener("change", () => {
      activeCategory = selectEl.value;
      categorySelects.forEach((other) => {
        if (other !== selectEl) other.value = activeCategory;
      });
      render();
    });
  });

  platformFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-platform]");
    if (!button || !platformFilters.contains(button)) return;
    activePlatform = button.dataset.platform;
    platformFilters.querySelectorAll("[data-platform]").forEach((chip) => {
      const selected = chip === button;
      chip.classList.toggle("is-active", selected);
      chip.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    render();
  });

  loadGames();
})();
