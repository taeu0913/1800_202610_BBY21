
// Create FOOTER
class realFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
    <footer class="fixed-bottom py-3">
		<div class="container d-flex justify-content-around">
        
      <span class="material-icons">
        <a href="map.html">
          <img src="images/maps-and-flags.png" alt="map"/> 
        </a>
      </span>

				<span class="material-icons"><img src="images/document.png" alt="feed"/> </span>
				<span class="material-icons"><img src="images/plus-sign-in-a-black-circle.png" alt="contribute"/> </span>
		 </div>
  </footer>
    `;
  }
}
// Register the custom element
customElements.define("real-footer", realFooter);