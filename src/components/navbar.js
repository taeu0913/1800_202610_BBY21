// Import specific functions from the Firebase Auth SDK
import {onAuthStateChanged} from "firebase/auth";     //Detect login state
import { auth } from '/src/firebaseConfig.js';        //Firebase authentication connection
import { logoutUser } from '/src/authentication.js';  //Perform logout action

class SiteNavbar extends HTMLElement {
    constructor() {
        super();
        this.renderNavbar();
        this.renderAuthControls();
    }

    renderNavbar() {
        this.innerHTML = `
            <!-- Navbar: single source of truth -->
            <nav class="custom-navbar">
                <div class="nav-left">
                <span class="logo">Crowd/Source</span>
                </div>

                <div class="nav-right">
                <a href="#" class="nav-link">Log In</a>
                <a href="#" class="nav-link signup">Sign Up</a>
                <button class="hamburger" id="hamburger">
                    ☰
                </button>
                </div>
            </nav>
        `;
    }
    renderAuthControls() {
        const authControls = this.querySelector('#authControls');

        // Initialize with invisible placeholder to maintain layout space
        authControls.innerHTML = `<div class="btn btn-outline-light" style="visibility: hidden; min-width: 80px;">Log out</div>`;

        onAuthStateChanged(auth, (user) => {
            let updatedAuthControl;
            if (user) {
                updatedAuthControl = `<button class="btn btn-outline-light" id="signOutBtn" type="button" style="min-width: 80px;">Log out</button>`;
                authControls.innerHTML = updatedAuthControl;
                const signOutBtn = authControls.querySelector('#signOutBtn');
                signOutBtn?.addEventListener('click', logoutUser);
            } else {
                updatedAuthControl = `<a class="btn btn-outline-light" id="loginBtn" href="/login.html" style="min-width: 80px;">Log in</a>`;
                authControls.innerHTML = updatedAuthControl;
            }
        });
    }    
}

customElements.define('site-navbar', SiteNavbar);