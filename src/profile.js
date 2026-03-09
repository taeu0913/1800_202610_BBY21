//Profile Page: saved locations + more btn

const savedListEl = document.getElementById("savedLocationsList");
const savedEmptyEl = document.getElementById("savedEmptyText");
const savedMoreBtn = document.getElementById("savedMoreBtn");

// Only run on profile page (where these IDs exist)
if (savedListEl && savedEmptyEl && savedMoreBtn) {
  const PROFILE_KEY = "cs_profile_state_saved_v1";
  const SAVED_PAGE_SIZE = 4;
  let savedVisibleCount = SAVED_PAGE_SIZE;

  const defaultState = {
    savedLocations: [] // array of { title: "...", note: "..." }
  };

  function loadState() {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : structuredClone(defaultState);
  }

  function saveState(state) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(state));
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderSavedLocations() {
    
    const state = loadState();
    const saved = state.savedLocations || [];

    savedListEl.innerHTML = "";

    // Empty state: show message + hide More
    if (saved.length === 0) {
      savedEmptyEl.classList.remove("hidden");
      savedMoreBtn.classList.add("hidden");
      return;
    }

    savedEmptyEl.classList.add("hidden");

    // Show only some items
    const toShow = saved.slice(0, savedVisibleCount);

    toShow.forEach((loc) => {
      const li = document.createElement("li");
      li.className = "saved-li";
      li.innerHTML = `
        <p class="saved-li-title">${escapeHtml(loc.title)}</p>
        <p class="saved-li-sub">${escapeHtml(loc.note || "")}</p>
      `;
      savedListEl.appendChild(li);
    });

    // Hide More if nothing more to show
    if (savedVisibleCount >= saved.length) {
      savedMoreBtn.classList.add("hidden");
    } else {
      savedMoreBtn.classList.remove("hidden");
    }
  }

  // "More" button shows more items (same page)
  savedMoreBtn.addEventListener("click", () => {
    savedVisibleCount += SAVED_PAGE_SIZE;
    renderSavedLocations();
  });


  // Optional: demo button support if you have #addSavedBtn
  const addSavedBtn = document.getElementById("addSavedBtn");
  if (addSavedBtn) {
    addSavedBtn.addEventListener("click", () => {
      const state = loadState();
      const n = (state.savedLocations?.length || 0) + 1;

      state.savedLocations = state.savedLocations || [];
      state.savedLocations.push({
        title: `Saved Location #${n}`,
        note: "Demo item (replace with real saved data)"
      });

      saveState(state);

      // reset to initial page size so user sees newest items
      savedVisibleCount = SAVED_PAGE_SIZE;
      renderSavedLocations();
    });
  }
  const clearBtn = document.getElementById("clearSavedBtn");

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    const state = loadState();
    state.savedLocations = [];
    saveState(state);

    renderSavedLocations(); // refresh the list
  });
}

  // Initial render
  renderSavedLocations();
}

document.addEventListener("DOMContentLoaded", () => {
  function wireModal(openBtnId, modalId) {
    const modal = document.getElementById(modalId);
    const openBtn = document.getElementById(openBtnId);

    if (!modal || !openBtn) return;

    // open
    openBtn.addEventListener("click", () => {
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");
    });

    // close (X or backdrop)
    modal.querySelectorAll('[data-close="true"]').forEach((el) => {
      el.addEventListener("click", () => {
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");
      });
    });
  }

  wireModal("termsBtn", "termsModal");
  wireModal("privacyBtn", "privacyModal");
  wireModal("statBtn", "statModal"); 

  // optional: ESC closes both
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    ["termsModal", "privacyModal","statModal"].forEach((id) => {
      const m = document.getElementById(id);
      if (m) m.classList.add("hidden");
    });
  });
});