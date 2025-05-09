// Function to filter quests based on the search input
function searchQuests() {
    const searchQuery = document.getElementById('search-bar').value.toLowerCase(); // Get search query
    const quests = document.querySelectorAll('.quest'); // Get all quest elements

    quests.forEach(quest => {
        const title = quest.querySelector('h3').textContent.toLowerCase(); // Get the quest title
        const description = quest.querySelector('p').textContent.toLowerCase(); // Get the quest description

        // If search query matches either title or description, show the quest
        if (title.includes(searchQuery) || description.includes(searchQuery)) {
            quest.style.display = 'block';
        } else {
            quest.style.display = 'none';
        }
    });
}

// Make searchQuests available globally by adding it to window
window.searchQuests = searchQuests;

// Firebase config and initialization (leave this as it is)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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

// Load categories into the nav bar
async function loadCategories() {
  const categoriesRef = collection(db, "categories");
  const querySnapshot = await getDocs(categoriesRef);
  const categoryList = document.getElementById("category-list");

  // Clear existing categories
  categoryList.innerHTML = '';

  // Add "All" option for showing all categories
  const allCategoryOption = document.createElement("li");
  allCategoryOption.textContent = "All";
  allCategoryOption.classList.add("category-item");
  categoryList.appendChild(allCategoryOption);

  querySnapshot.forEach((doc) => {
    const category = doc.data();
    const li = document.createElement("li");
    li.textContent = category.name;
    li.classList.add("category-item");
    categoryList.appendChild(li);

    // Add category click handler to filter quests
    li.addEventListener('click', () => filterByCategory(category.name));
  });

  // Add event listener for "All" category
  allCategoryOption.addEventListener('click', () => filterByCategory("All"));
}

// Load quests into the page
async function loadQuests() {
  const questsRef = collection(db, "quests");
  const querySnapshot = await getDocs(questsRef);
  const questsList = document.getElementById("quests-list");

  // Clear existing quests
  questsList.innerHTML = '';

  querySnapshot.forEach((doc) => {
    const quest = doc.data();
    const questElement = document.createElement("div");
    questElement.classList.add("quest");
    questElement.setAttribute("data-category", quest.category);

    // Format the completion date (Check if it's a valid Firestore Timestamp)
    let completionDate = "N/A";
    if (quest.completionDate && quest.completionDate.seconds) {
      const date = new Date(quest.completionDate.seconds * 1000);
      completionDate = date.toLocaleDateString(); // Format date
    }

    // Format the creation date (posted date)
    let postedDate = "N/A";
    if (quest.createdAt && quest.createdAt.seconds) {
      const date = new Date(quest.createdAt.seconds * 1000);
      postedDate = date.toLocaleDateString(); // Format the posted date
    }

    // Build the quest HTML
    questElement.innerHTML = `
      <h3>${quest.title}</h3>
      <p><strong>Description:</strong> ${quest.description}</p>
      <p><strong>Location:</strong> ${quest.location}</p>
      <p><strong>Duration:</strong> ${quest.duration} hours</p>
      <p><strong>Completion Date:</strong> ${completionDate}</p>
      <p><strong>Posted On:</strong> ${postedDate}</p> <!-- Display the posted date -->
      <button class="ask-question-btn">Ask a Question</button>
      <button class="make-offer-btn">Make an Offer</button>
    `;

    questsList.appendChild(questElement);
  });
}

// Handle quest category filtering
function filterByCategory(category) {
  const quests = document.querySelectorAll(".quest");
  quests.forEach((quest) => {
    const questCategory = quest.getAttribute("data-category");
    if (category === "All" || questCategory === category) {
      quest.style.display = "block";
    } else {
      quest.style.display = "none";
    }
  });
}

// Toggle hamburger menu
const hamburger = document.getElementById("hamburger");
const navMenu = document.querySelector("nav ul");

hamburger.addEventListener("click", () => {
  navMenu.classList.toggle("show");
});


// Load categories and quests on page load
window.onload = () => {
  loadCategories();
  loadQuests();
};
const urlParams = new URLSearchParams(window.location.search);
const userIdFromURL = urlParams.get('uid');

onAuthStateChanged(auth, async (user) => {
    const userId = userIdFromURL || user?.uid;

    if (!userId) {
        window.location.href = "index.html";
        return;
    }

    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
        const data = userDoc.data();
        document.getElementById('loggedUserFName').innerText = data.firstName || "";
        document.getElementById('loggedUserLName').innerText = data.lastName || "";
        document.getElementById('loggedUserEmail').innerText = data.email || "";
    } else {
        console.log("User not found.");
    }

    // Optional: Hide editing tools if viewing someone else’s profile
    if (userIdFromURL && userIdFromURL !== user.uid) {
        document.querySelector('#about').style.display = 'none';
        document.querySelector('#logout').style.display = 'none';
    }
});
























