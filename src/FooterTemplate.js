
// Create FOOTER
class realFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
    <footer>
      <div id="bottom-navbar">
        <span class="navbar-link">
          <a href="map.html">
            <img src="images/maps-and-flags.png" alt="map"/>
            <p class="icon-name">Map</p>
          </a>
        </span>
        <span class="navbar-link">
          <img src="images/document.png" alt="feed"/>
          <p class="icon-name">Feed</p>
        </span>
        <span class="navbar-link">
          <img src="images/plus-sign-in-a-black-circle.png" alt="rate"/>
          <p class="icon-name">Rate</p>
        </span>
        <span class="navbar-link">
          <img src="images/account.png" alt="profile"/>
          <p class="icon-name">Profile</p>
        </span>
      </div>
  </footer>
    `;
  }
}
// Register the custom element
customElements.define("real-footer", realFooter);