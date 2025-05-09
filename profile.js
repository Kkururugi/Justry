import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  getDoc,
  doc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCbLK26irLxdz03rDCMVHnqHYfDgBjn10g",
  authDomain: "questwalker-5c547.firebaseapp.com",
  projectId: "questwalker-5c547",
  storageBucket: "questwalker-5c547.appspot.com",
  messagingSenderId: "1058097550838",
  appId: "1:1058097550838:web:7bdbb645be374c93e4e3d7",
  measurementId: "G-NNQV9FQRV0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Hamburger toggle
document.getElementById("hamburger").addEventListener("click", () => {
  document.querySelector("nav ul").classList.toggle("show");
});

// Load user profile
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User logged in:", user.uid);
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`;
      document.getElementById("user-name").textContent = fullName;
      document.getElementById("profilePic").src = userData.profilePic || "profile-placeholder.png";
      document.getElementById("aboutMeInput").value = userData.aboutMe || "";
    } else {
      console.log("User document not found");
    }
  } else {
    console.log("User not signed in");
    window.location.href = "index.html";
  }
});

// Save "About Me"
document.getElementById("saveAboutMe").addEventListener("click", async () => {
  const user = auth.currentUser;
  const aboutMe = document.getElementById("aboutMeInput").value;
  if (user) {
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { aboutMe });
      console.log("About Me updated");
      alert("About Me updated!");
    } catch (error) {
      console.error("Error updating About Me:", error);
    }
  }
});

// Logout button
document.getElementById("logout-btn").addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      console.log("User logged out");
      window.location.href = "index.html";
    })
    .catch((error) => {
      console.error("Logout error:", error);
    });
});

// Load and display reviews
async function loadReviews(userId) {
  const reviewsContainer = document.getElementById("review-list");
  reviewsContainer.innerHTML = "Loading...";

  const reviewsRef = collection(db, "users", userId, "reviews");
  onSnapshot(reviewsRef, (snapshot) => {
    reviewsContainer.innerHTML = "";
    let total = 0;
    let count = 0;

    snapshot.forEach((doc) => {
      const review = doc.data();
      const item = document.createElement("div");
      item.innerHTML = `
        <strong>${review.reviewerName}</strong>
        <div>Rating: ${review.rating} ★</div>
        <p>${review.comment}</p>
      `;
      reviewsContainer.appendChild(item);
      total += review.rating;
      count++;
    });

    const avg = count ? (total / count).toFixed(1) : "No";
    document.getElementById("average-rating").innerText = `${avg} ★`;
  }, (error) => {
    console.error("Error loading reviews:", error);
  });
}

// Submit a new review
document.getElementById("submit-review").addEventListener("click", async () => {
  try {
    const rating = parseInt(document.getElementById("rating").value);
    const comment = document.getElementById("review").value;

    const user = auth.currentUser;
    if (!user) {
      console.error("User not logged in");
      return;
    }

    const reviewedUserId = document.getElementById("reviewed-user-id").value;
    const reviewerData = await getDoc(doc(db, "users", user.uid));

    if (!reviewerData.exists()) {
      console.error("Reviewer data not found");
      return;
    }

    await addDoc(collection(db, "users", reviewedUserId, "reviews"), {
      reviewerId: user.uid,
      reviewerName: reviewerData.data().firstName || "Anonymous",
      rating,
      comment
    });

    console.log("Review submitted");
    document.getElementById("rating").value = "";
    document.getElementById("review").value = "";
  } catch (error) {
    console.error("Error submitting review:", error);
  }
});





