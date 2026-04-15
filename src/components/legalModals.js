document.addEventListener("DOMContentLoaded", () => {

  function wireModal(openBtnId, modalId) {
    const modal = document.getElementById(modalId);
    const btn = document.getElementById(openBtnId);

    if (!modal || !btn) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      modal.classList.remove("hidden");
    });

    modal.querySelectorAll("[data-close='true']").forEach((el) => {
      el.addEventListener("click", () => {
        modal.classList.add("hidden");
      });
    });
  }

  wireModal("termsBtn","termsModal");
  wireModal("privacyBtn","privacyModal");
  wireModal("statBtn","statModal");

});