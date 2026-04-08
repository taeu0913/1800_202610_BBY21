// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap';
import { auth, db } from "./firebaseConfig.js";
import { collection, query, doc, where, getDoc, getDocs, orderBy, limit } from "firebase/firestore";

// const locationsRef = collection(db, "Places");
// const postsRef = collection(db, "posts");
// const usersRef = collection(db, "users");

document.getElementById("tab-all").onclick = () => {
  setActiveTab("all");
  renderAllPosts();
};

document.getElementById("tab-saved").onclick = () => {
  setActiveTab("saved");
  renderSavedPosts();
};

function setActiveTab(tab) {
  document.getElementById("tab-all").classList.toggle("active", tab === "all");
  document.getElementById("tab-saved").classList.toggle("active", tab === "saved");
}

async function renderPostToFeed(post, feed) {
  const data = post.data();

  const user_doc = await getDoc(doc(db, "users", data.user_id));
  const user_data = user_doc.data();

  const loc_doc = await getDoc(doc(db, "Places", data.location_id));
  const loc_data = loc_doc.data();

  // votes
  const votesSnap = await getDocs(collection(db, "posts", post.id, "votes"));
  let upvotes = 0, total = 0;
  votesSnap.forEach(v => {
    const vote = v.data().vote;
    if (vote === 1) upvotes++;
    total++;
  });

  feed.insertAdjacentHTML("beforeend", `
    <div class="post">
      <div class="user">
        <img src="images/${user_data.profile_img}" alt="profile-picture"/>
        <p class="user-name">${user_data.name}</p>
        <div class="timestamp">
          <small>${data.timestamp.toDate().toLocaleString()}</small>
        </div>
        <b class="location">
          <a href="map.html?lat=${loc_data.Latitude}&lng=${loc_data.Longitude}">
            ${loc_data.Names}
          </a>
        </b>
      </div>
      <div class="post-content">
        <img src="data:image/png;base64,${data.img}"/>
        <div class="rating">
          <p style="font-size: 16px;"><b>Description: </b> "${data.caption}"</p>
          <br/>
          Estimate: ${data.headcount_estimate} people
          <br/>
          <p>${upvotes} of ${total} people agree (${(upvotes / total * 100 || 0).toFixed(0)}%)</p>
        </div>
      </div>
    </div>
  `);
}

async function renderAllPosts() {
  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  const posts_q = query(
    collection(db, "posts"),
    orderBy("timestamp", "desc"),
    limit(20)
  );

  const postsSnap = await getDocs(posts_q);

  for (const post of postsSnap.docs) {
    renderPostToFeed(post, feed);
  }
}

async function getSavedLocationIds(uid) {
  const savedRef = collection(db, "users", uid, "savedLocations");
  const savedSnap = await getDocs(savedRef);
  return savedSnap.docs.map(doc => doc.id); // array of location IDs
}

async function renderSavedPosts() {
  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  const uid = auth.currentUser.uid;

  // 1. Get saved location documents
  const savedRef = collection(db, "users", uid, "savedLocations");
  const savedSnap = await getDocs(savedRef);

  // 2. Extract the REAL location IDs from the field, not the doc ID
  const savedIds = savedSnap.docs
    .map(doc => doc.data().locationId)  // <-- THIS is what matches posts.location_id
    .filter(id => !!id);

  console.log("Saved location IDs:", savedIds);

  if (savedIds.length === 0) {
    feed.innerHTML = "<p>No saved locations yet.</p>";
    return;
  }

  // 3. Firebase 'in' queries allow max 10 items
  const chunks = [];
  for (let i = 0; i < savedIds.length; i += 10) {
    chunks.push(savedIds.slice(i, i + 10));
  }

  let posts = [];

  // 4. Query posts for each chunk
  for (const chunk of chunks) {
    const q = query(
      collection(db, "posts"),
      where("location_id", "in", chunk),   // <-- matches posts.location_id
      orderBy("timestamp", "desc")
    );

    const snap = await getDocs(q);
    posts.push(...snap.docs);
  }

  // 5. Sort all posts by timestamp
  posts.sort((a, b) => b.data().timestamp.seconds - a.data().timestamp.seconds);

  console.log("Filtered posts:", posts.map(p => p.id));

  // 6. Render
  if (posts.length === 0) {
    feed.innerHTML = "<p>No posts from your saved locations yet.</p>";
    return;
  }

  for (const post of posts) {
    renderPostToFeed(post, feed);
  }
}

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
  for (const post of posts.docs) {
    let data = post.data();
    const user_doc = await getDoc(doc(usersRef, data.user_id));
    const user_data = user_doc.data();
    const loc_doc = await getDoc(doc(locationsRef, data.location_id));
    const loc_data = loc_doc.data();

    // count upvotes and total votes
    const votesSnap = await getDocs(collection(db, "posts", post.id, "votes"));
    let upvotes = 0
    let total = 0;
    votesSnap.forEach(doc => {
      const v = doc.data().vote;
      if (v === 1) upvotes++;
      total++;
    });
    // console.log("user data: " + user_data);
    feed.insertAdjacentHTML("beforeend", `
      <div class="post">
        <div class="user">
          <img src="images/${user_data.profile_img}" alt="profile-picture"/>
          <p class="user-name">${user_data.name}</p>
          <div class="timestamp">
            <small>${data.timestamp.toDate().toLocaleString()}</small>
          </div>
          <b class="location">
            <a href="map.html?lat=${loc_data.Latitude}&lng=${loc_data.Longitude}">
              ${loc_data.Names}
            </a>
          </b>
        </div>
        <div class="post-content">
          <img src="data:image/png;base64,${data.img}"/>
          <div class="rating">
            <p class="estimate">
            <p style="font-size: 16px;"><b>Description: </b> "${data.caption}"</p>
            <br/>
            Estimate: ${data.headcount_estimate} people
            </p>
            <br/>
            <p>${upvotes} of ${total} people agree (${upvotes / total * 100 || 0}%)</p>
          </div>
        </div>
      </div>
    `);

  }
}

document.addEventListener("DOMContentLoaded", () => {
  setActiveTab("all");
  renderAllPosts();
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

