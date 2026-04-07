# Crowd/Source


## Overview
Crowd/Source is a client-side JavaScript web application that helps users discover and explore vancouvers tourist destinations. The app displays a map full of markers, all of which containing their own posts, each with details such as name, location, crowdsize and rating. Users can browse the map and mark their favorite locations for easy access later.

Developed for the COMP 1800 course, this project applies User-Centred Design practices and agile project management, and demonstrates integration with Firebase backend services for storing user favorites.

---


## Features

- Browse a map full of markers of vancouvers favorite locations.
- Mark and unmark locations as favorites
- View a personalized list of favorite locations
- Responsive design for desktop and mobile
- Rate your favorite places.
- Let others know how many people there are in a location.

---


## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Backend**: Firebase for hosting
- **Database**: Firestore

---


## Usage

To run the application locally:

1.  **Clone** the repository.
2.  **Install dependencies** by running `npm install` or `npm i` in the project root directory.
3.  **Start the development server** by running the command: `npm run dev`.
4.  Open your browser and visit the local address shown in your terminal (usually `http://localhost:5173` or similar).

Once the application is running:

1.  Browse the map of locations displayed on the map page.
2.  Click the bookmark to mark a location as a favorite.
3.  View your favorite hikes in the profile section.

---


## Project Structure

```
elmo-hikes/
├── src/
│   ├── components/
│   │   ├── FooterTemplate.js
│   │   ├── legalModals.js
│   │   └── NavBarTemplete.js
│   ├── main.js
│   ├── authentication.js
│   ├── feed.js
│   ├── firebaseConfig.js
│   ├── loginSignup.js
│   ├── map.js
│   ├── profile.js
│   ├── rate.js
│   ├── saved.js
│   ├── settings.js
│   └── utils.js
├── styles/
│   └── style.css
├── images/
│   ├── account.png
│   ├── document.png
│   ├── map.png
│   ├── maps-and-flags.png
│   ├── marker.png
│   ├── person.png
│   ├── plus-sign-in-a-black-circle.png
│   ├── search-icon-png-9965.png
│   ├── thumb-down.png
│   ├── thumb-up.png
│   ├── AM01.jpg
│   ├── BBY01.jpg
│   ├── elmo.jpg
│   ├── hike1.jpg
│   ├── hike2.jpg
│   ├── hike3.jpg
│   ├── logo.jpg
│   └── NV01.jpg
├── index.html
├── feed.html
├── login.html
├── map.html
├── profile.html
├── rate.html
├── settings.html
├── skeleton.html
├── package.json
├── package-lock.json
└── README.md
```

---


## Contributors
- **Adam Olszewski** - BCIT CST Student with a passion for INDOOR!!!! adventures and user-friendly applications. Fun fact: Loves solving Rubik's Cubes in under a minute.
- **Taeu Gim** - BCIT CST Student, Frontend enthusiast with a knack for creative design. Fun fact: Has a collection of over 50 houseplants.
- **Megan Chow** - BCIT CST Student with an interest in web and game development. Also loves eating noodles.

---


## Acknowledgments

- leaflet
- opentilemaps
- Trail data and images are for demonstration purposes only.
- Code snippets were adapted from resources such as [Stack Overflow](https://stackoverflow.com/) and [MDN Web Docs](https://developer.mozilla.org/).
- Icons sourced from [FontAwesome](https://fontawesome.com/) and images from [Unsplash](https://unsplash.com/).
- Icons sourced from FlatIcon:
    - https://www.flaticon.com/free-icon/like_309524
    - https://www.flaticon.com/free-icon/thumb-down_1634070

---


## Limitations and Future Work
### Limitations

- Limited location details (e.g., no users, no data).
- Accessibility features can be further improved.
- UX could be further improved.

### Future Work

- none.

---
