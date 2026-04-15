(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))r(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const n of t.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&r(n)}).observe(document,{childList:!0,subtree:!0});function c(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function r(e){if(e.ep)return;e.ep=!0;const t=c(e);fetch(e.href,t)}})();const o=localStorage.getItem("theme");o&&document.documentElement.setAttribute("data-theme",o);const i=document.getElementById("darkModeBtn"),l=document.getElementById("lightModeBtn");i&&i.addEventListener("click",()=>{localStorage.setItem("theme","dark"),document.documentElement.setAttribute("data-theme","dark")});l&&l.addEventListener("click",()=>{localStorage.setItem("theme","light"),document.documentElement.setAttribute("data-theme","light")});class d extends HTMLElement{connectedCallback(){this.innerHTML=`
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
    `}}customElements.define("nav-bar",d);class m extends HTMLElement{connectedCallback(){this.innerHTML=`
    <footer>
      <div id="bottom-navbar">
        <span class="navbar-link">
          <a href="map.html">
            <img src="/images/maps-and-flags.png" alt="map"/>
            <p class="icon-name">Map</p>
          </a>
        </span>
        <span class="navbar-link">
          <a href="feed.html">
            <img src="/images/document.png" alt="feed"/>
            <p class="icon-name">Feed</p>
          </a>
        </span>
        <span class="navbar-link">
          <a href="rate.html">
            <img src="/images/plus-sign-in-a-black-circle.png" alt="rate"/>
            <p class="icon-name">Rate</p>
          </a>
        </span>
        <span class="navbar-link">
          <a href="profile.html">
            <img src="/images/account.png" alt="profile"/>
           <p class="icon-name">Profile</p>
          </a>
        </span>
      </div>
  </footer>
    `}}customElements.define("real-footer",m);
