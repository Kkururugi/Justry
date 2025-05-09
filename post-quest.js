import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCbLK26irLxdz03rDCMVHnqHYfDgBjn10g",
  authDomain: "questwalker-5c547.firebaseapp.com",
  projectId: "questwalker-5c547",
  storageBucket: "questwalker-5c547.appspot.com",
  messagingSenderId: "1058097550838",
  appId: "1:1058097550838:web:7bdbb645be374c93e4e3d7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Load categories into the select element dynamically
async function loadCategories() {
    const categoriesRef = collection(db, "categories");
    const querySnapshot = await getDocs(categoriesRef);
    const categorySelect = document.getElementById("questCategory");

    // Clear existing options
    categorySelect.innerHTML = "<option value='' disabled selected>Select a Category</option>";

    querySnapshot.forEach(doc => {
        const category = doc.data();
        const option = document.createElement("option");
        option.value = category.name;
        option.innerText = category.name;
        categorySelect.appendChild(option);
    });
}

// Handle form submission to post a quest
document.getElementById("questForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("questTitle").value.trim();
    const description = document.getElementById("questDescription").value.trim();
    const location = document.getElementById("questLocation").value.trim();
    const category = document.getElementById("questCategory").value;
    const completionDate = document.getElementById("questCompletionDate").value;
    const duration = document.getElementById("questDuration").value;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                // Add quest to Firestore with the current timestamp
                await addDoc(collection(db, "quests"), {
                    title,
                    description,
                    location,
                    category,
                    completionDate,
                    duration,
                    createdAt: serverTimestamp(), // Automatically add the timestamp when posting
                    userId: user.uid
                });

                alert("Quest posted successfully!");
                window.location.href = "homepage.html"; // Redirect to homepage after posting
            } catch (error) {
                console.error("Error posting quest:", error);
                alert("There was an error posting the quest. Please try again.");
            }
        } else {
            alert("You must be logged in to post a quest.");
        }
    });
});

// Toggle hamburger menu
const hamburger = document.getElementById("hamburger");
const navMenu = document.querySelector("nav ul");

hamburger.addEventListener("click", () => {
  navMenu.classList.toggle("show");
});

// Load categories on page load
window.onload = () => {
    loadCategories();
};









