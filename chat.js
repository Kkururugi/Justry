import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
  getFirestore, collection, query, orderBy, addDoc,
  getDocs, onSnapshot, doc, where
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbLK26irLxdz03rDCMVHnqHYfDgBjn10g",
  authDomain: "questwalker-5c547.firebaseapp.com",
  projectId: "questwalker-5c547",
  storageBucket: "questwalker-5c547.appspot.com",
  messagingSenderId: "1058097550838",
  appId: "1:1058097550838:web:7bdbb645be374c93e4e3d7",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

let currentUser;
let selectedUserId = null;
let selectedUserName = ""; // To hold the name of the person you're chatting with

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    loadUsers();
  } else {
    window.location.href = "index.html";
  }
});

async function loadUsers() {
  const userList = document.getElementById("userList");
  userList.innerHTML = ""; // Clear before adding

  const usersSnapshot = await getDocs(collection(db, "users"));
  usersSnapshot.forEach(docSnap => {
    if (docSnap.id !== currentUser.uid) {
      const user = docSnap.data();
      const userDiv = document.createElement("div");
      userDiv.textContent = `${user.firstName} ${user.lastName}`;
      userDiv.style.cursor = "pointer";
      userDiv.addEventListener("click", () => openChat(docSnap.id, `${user.firstName} ${user.lastName}`));
      userList.appendChild(userDiv);
    }
  });
}

// Function to open the chat and update the chat header
function openChat(partnerId, partnerName) {
  selectedUserId = partnerId;
  selectedUserName = partnerName; // Save the selected user's name

  const chatHeader = document.getElementById("chatHeader");
  chatHeader.textContent = `Chatting with: ${selectedUserName}`; // Update the chat header

  const messagesDiv = document.getElementById("messages");
  messagesDiv.innerHTML = "Loading messages...";

  // Query for messages between currentUser and selectedUserId
  const q = query(
    collection(db, "messages"),
    where("participants", "array-contains", currentUser.uid),
    orderBy("timestamp")
  );

  onSnapshot(q, (snapshot) => {
    messagesDiv.innerHTML = "";
    snapshot.forEach((doc) => {
      const msg = doc.data();
      if (
        (msg.senderId === currentUser.uid && msg.receiverId === selectedUserId) ||
        (msg.senderId === selectedUserId && msg.receiverId === currentUser.uid)
      ) {
        const div = document.createElement("div");
        div.textContent = `${msg.senderId === currentUser.uid ? "Me" : "Them"}: ${msg.text}`;
        messagesDiv.appendChild(div);
      }
    });
  });
}

// Send a message
document.getElementById("sendBtn").addEventListener("click", async () => {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text || !selectedUserId) return;

  await addDoc(collection(db, "messages"), {
    text,
    senderId: currentUser.uid,
    receiverId: selectedUserId,
    participants: [currentUser.uid, selectedUserId],
    timestamp: new Date()
  });

  input.value = "";
});

// Add a search bar for users
document.getElementById("searchInput").addEventListener("input", async (event) => {
  const searchQuery = event.target.value.toLowerCase();
  const userList = document.getElementById("userList");
  userList.innerHTML = ""; // Clear user list

  const usersSnapshot = await getDocs(collection(db, "users"));
  usersSnapshot.forEach(docSnap => {
    const user = docSnap.data();
    const fullName = `${user.firstName} ${user.lastName}`;
    if (fullName.toLowerCase().includes(searchQuery)) {
      if (docSnap.id !== currentUser.uid) {
        const userDiv = document.createElement("div");
        userDiv.textContent = fullName;
        userDiv.style.cursor = "pointer";
        userDiv.addEventListener("click", () => openChat(docSnap.id, fullName));
        userList.appendChild(userDiv);
      }
    }
  });
});







