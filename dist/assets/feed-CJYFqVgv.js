import"./FooterTemplate-Yp1uJiHZ.js";import{q as b,l as $,o as h,f as r,b as c,h as m,e as I,w,m as f,d as y}from"./firebaseConfig-Be6_9DBH.js";document.getElementById("tab-all").onclick=()=>{v("all"),E()};document.getElementById("tab-saved").onclick=()=>{v("saved"),B()};function v(t){document.getElementById("tab-all").classList.toggle("active",t==="all"),document.getElementById("tab-saved").classList.toggle("active",t==="saved")}async function L(t,d){const s=t.data(),a=(await f(y(c,"users",s.user_id))).data(),o=(await f(y(c,"Places",s.location_id))).data(),e=await m(r(c,"posts",t.id,"votes"));let n=0,i=0;e.forEach(_=>{_.data().vote===1&&n++,i++}),d.insertAdjacentHTML("beforeend",`
    <div class="post">
      <div class="user">
        <img src="images/${a.profile_img}" alt="profile-picture"/>
        <p class="user-name">${a.name}</p>
        <div class="timestamp">
          <small>${s.timestamp.toDate().toLocaleString()}</small>
        </div>
        <b class="location">
          <a href="map.html?lat=${o.Latitude}&lng=${o.Longitude}">
            ${o.Names}
          </a>
        </b>
      </div>
      <div class="post-content">
        <img src="data:image/png;base64,${s.img}"/>
        <div class="rating">
          <p style="font-size: 16px;"><b>Description: </b> "${s.caption}"</p>
          <br/>
          Estimate: ${s.headcount_estimate} people
          <br/>
          <p>${n} of ${i} people agree (${(n/i*100||0).toFixed(0)}%)</p>
        </div>
      </div>
    </div>
  `)}async function E(){const t=document.getElementById("feed");t.innerHTML="";const d=b(r(c,"posts"),h("timestamp","desc"),$(20)),s=await m(d);for(const p of s.docs)L(p,t)}async function B(){const t=document.getElementById("feed");t.innerHTML="";const d=I.currentUser.uid,s=r(c,"users",d,"savedLocations"),a=(await m(s)).docs.map(e=>e.data().locationId).filter(e=>!!e);if(console.log("Saved location IDs:",a),a.length===0){t.innerHTML="<p>No saved locations yet.</p>";return}const u=[];for(let e=0;e<a.length;e+=10)u.push(a.slice(e,e+10));let o=[];for(const e of u){const n=b(r(c,"posts"),w("location_id","in",e),h("timestamp","desc")),i=await m(n);o.push(...i.docs)}if(o.sort((e,n)=>n.data().timestamp.seconds-e.data().timestamp.seconds),console.log("Filtered posts:",o.map(e=>e.id)),o.length===0){t.innerHTML="<p>No posts from your saved locations yet.</p>";return}for(const e of o)L(e,t)}document.addEventListener("DOMContentLoaded",()=>{v("all"),E()});const g=document.getElementById("hamburger"),l=document.getElementById("menu");g&&l&&(g.addEventListener("click",t=>{t.stopPropagation(),l.style.display=l.style.display==="block"?"none":"block"}),window.addEventListener("click",t=>{!g.contains(t.target)&&!l.contains(t.target)&&(l.style.display="none")}));
