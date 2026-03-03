// Create navbar
class NavBar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <nav class="custom-navbar">
        <div class="nav-left">
          <span class="logo">Crowd/Source</span>
        </div>

        <div class="nav-right">
          <a href="login.html" class="nav-link signup">Log in/Sign Up</a>
          <button class="hamburger" id="hamburger">
            ☰
          </button>
        </div>
      </nav>
    `;

  }
}
// Register the custom element
customElements.define("nav-bar", NavBar);