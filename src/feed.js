// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap';
import { db } from "./firebaseConfig.js";
import { collection, query, doc, where, getDoc, getDocs, orderBy, limit } from "firebase/firestore";

// const locationsRef = collection(db, "Places");
// const postsRef = collection(db, "posts");
// const usersRef = collection(db, "users");


async function renderFeed() {
  const locationsRef = collection(db, "Places");
  const postsRef = collection(db, "posts");
  const usersRef = collection(db, "users");
  const posts_q = query(
    postsRef,
    orderBy("timestamp", "desc"),
    limit(20)
  );
  const posts = await getDocs(posts_q);

  let feed = document.getElementById("feed");
  feed.innerHTML = "";
  console.log(posts.docs);
  for (const post of posts.docs) {
    console.log("entering loop");
    let data = post.data();
    const user_doc = await getDoc(doc(usersRef, data.user_id));
    const user_data = user_doc.data();
    const loc_doc = await getDoc(doc(locationsRef, data.location_id));
    const loc_data = loc_doc.data();
    // console.log("user data: " + user_data);
    feed.insertAdjacentHTML("beforeend", `
      <div class="post">
        <div class="user">
          <img src="images/${user_data.profile_img}" alt="profile-picture"/>
          <p class="user-name">${user_data.name}</p>
          <div class="timestamp">
            <small>${data.timestamp.toDate().toLocaleString()}</small>
          </div>
          <b class="location">${loc_data.Names}</b>
        </div>
        <div class="post-content">
          <img src="data:image/png;base64,${data.img}"/>
          <div class="rating">
            <p class="estimate">
              Estimate: ${data.headcount_estimate} people
            </p>
            <small>Is this accurate?</small>
            <button class="vote-button">
              <img src="images/thumb-up.png"/>
            </button>
            <button class="vote-button">
              <img src="images/thumb-down.png"/>
            </button>
            <p>${data.num_likes} of ${data.num_votes} people agree (83%)</p>
          </div>
        </div>
      </div>
    `);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderFeed();
});
// If you have custom global styles, import them as well:
// import '../styles/style.css';
// document.addEventListener('DOMContentLoaded', sayHello);

const hamburger = document.getElementById("hamburger");
const menu = document.getElementById("menu");

if (hamburger && menu) {
  hamburger.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  });

  window.addEventListener("click", (e) => {
    if (!hamburger.contains(e.target) && !menu.contains(e.target)) {
      menu.style.display = "none";
    }
  });
}

