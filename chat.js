// Import Firebase SDKs
import { getFirestore, collection, query, orderBy, addDoc, getDocs, onSnapshot, doc, where, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";

// Firebase Config
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
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser;
let selectedUserId = null;
let selectedUserName = "";
let currentChatUnsubscribe = null;

// DOM Elements
const elements = {
    hamburger: document.getElementById("hamburger"),
    navMenu: document.getElementById("nav-menu"),
    userList: document.getElementById("userList"),
    chatHeader: document.getElementById("chatHeader"),
    messages: document.getElementById("messages"),
    sendBtn: document.getElementById("sendBtn"),
    messageInput: document.getElementById("messageInput"),
    searchInput: document.getElementById("searchInput")
};

// Check user authentication status
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log("User authenticated:", currentUser.uid);
        await loadRecentConversations();
    } else {
        console.log("No user logged in. Redirecting to login.");
        window.location.href = "index.html";
    }
});

// Initialize event listeners
function initEventListeners() {
    // Mobile menu toggle
    if (elements.hamburger && elements.navMenu) {
        elements.hamburger.addEventListener("click", () => {
            elements.navMenu.classList.toggle("active");
            elements.hamburger.classList.toggle("open");
        });
    }

    // Send message button
    elements.sendBtn.addEventListener("click", sendMessage);

    // Send message on Enter key
    elements.messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });

    // User search
    elements.searchInput.addEventListener("input", debounce(searchUsers, 300));
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Load recent conversations
async function loadRecentConversations() {
    if (!elements.userList) return;
    
    elements.userList.innerHTML = "<div class='loading'>Loading chats...</div>";
    
    try {
        const userConversationsRef = collection(db, "userConversations", currentUser.uid, "conversations");
        const conversationsSnapshot = await getDocs(userConversationsRef);
        
        if (conversationsSnapshot.empty) {
            elements.userList.innerHTML = "<div class='info'>No recent chats. Search for a user to start one.</div>";
            return;
        }

        elements.userList.innerHTML = "";
        
        const conversations = [];
        
        for (const docSnap of conversationsSnapshot.docs) {
            const conversationData = docSnap.data();
            const otherUserId = conversationData?.otherUserId;
            
            if (otherUserId) {
                const userDoc = await getDoc(doc(db, "users", otherUserId));
                if (userDoc.exists()) {
                    const user = userDoc.data();
                    conversations.push({
                        id: otherUserId,
                        name: `${user.firstName} ${user.lastName}`,
                        lastMessage: conversationData.lastMessage || "",
                        timestamp: conversationData.lastMessageTimestamp?.toDate() || new Date(0)
                    });
                }
            }
        }
        
        // Sort conversations by most recent
        conversations.sort((a, b) => b.timestamp - a.timestamp);
        
        // Display conversations
        conversations.forEach(conversation => {
            const userDiv = document.createElement("div");
            userDiv.className = "user-item";
            userDiv.innerHTML = `
                <div class="user-name">${conversation.name}</div>
                <div class="last-message">${conversation.lastMessage || "No messages yet"}</div>
            `;
            userDiv.addEventListener("click", () => openChat(conversation.id, conversation.name));
            elements.userList.appendChild(userDiv);
        });
        
    } catch (error) {
        console.error("Error loading conversations:", error);
        elements.userList.innerHTML = "<div class='error'>Failed to load chats. Please refresh.</div>";
    }
}

// Open chat with selected user
async function openChat(partnerId, partnerName) {
    selectedUserId = partnerId;
    selectedUserName = partnerName;
    
    elements.chatHeader.textContent = `Chat with ${selectedUserName}`;
    elements.messages.innerHTML = "<div class='loading'>Loading messages...</div>";

    // Unsubscribe from previous chat listener
    if (currentChatUnsubscribe) {
        currentChatUnsubscribe();
        currentChatUnsubscribe = null;
    }

    // Update conversation in userConversations
    await updateUserConversation(partnerId, partnerName);
    
    listenForMessages();
}

// Update user conversation document
async function updateUserConversation(partnerId, partnerName) {
    try {
        const conversationId = [currentUser.uid, partnerId].sort().join("_");
        const conversationRef = doc(db, "userConversations", currentUser.uid, "conversations", conversationId);
        
        await setDoc(conversationRef, {
            otherUserId: partnerId,
            otherUserName: partnerName,
            updatedAt: new Date()
        }, { merge: true });
        
    } catch (error) {
        console.error("Error updating conversation:", error);
    }
}

// Listen for messages in current chat
// Listen for messages in current chat
function listenForMessages() {
    if (!selectedUserId || !currentUser?.uid) return;

    const conversationId = [currentUser.uid, selectedUserId].sort().join('_');
    console.log("Listening for messages in conversation:", conversationId);

    const q = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId),
        orderBy("timestamp", "asc")
    );

    currentChatUnsubscribe = onSnapshot(q, (snapshot) => {
        elements.messages.innerHTML = "";
        
        if (snapshot.empty) {
            elements.messages.innerHTML = "<div class='empty-state'>No messages yet</div>";
            return;
        }

        snapshot.forEach((doc) => {
            displayMessage(doc.data());
        });
        
        elements.messages.scrollTop = elements.messages.scrollHeight;
    }, (error) => {
        console.error("Listen error:", error);
    });
}

// Display a single message
function displayMessage(msg) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${msg.senderId === currentUser.uid ? 'me' : 'them'}`;
    
    const senderName = msg.senderId === currentUser.uid ? "You" : selectedUserName;
    const time = msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="sender">${senderName}</span>
            <span class="time">${time}</span>
        </div>
        <div class="message-content">${msg.text}</div>
    `;
    
    elements.messages.appendChild(messageDiv);
}

// Send a message
async function sendMessage() {
    const text = elements.messageInput.value.trim();
    
    if (!text || !selectedUserId || !currentUser?.uid) return;

    try {
        const participants = [currentUser.uid, selectedUserId].sort();
        const conversationId = participants.join("_");
        
        await addDoc(collection(db, "messages"), {
            text,
            senderId: currentUser.uid,
            receiverId: selectedUserId,
            participants,
            conversationId, // Make sure this is included
            timestamp: new Date()
        });

        elements.messageInput.value = "";
    } catch (error) {
        console.error("Send message error:", error);
        alert(`Failed to send: ${error.message}`);
    }
}

// Temporary debug function - run in browser console
async function debugMessages() {
  const convId = [currentUser.uid, selectedUserId].sort().join("_");
  console.log("Checking for conversationId:", convId);
  
  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", convId)
  );
  
  const snapshot = await getDocs(q);
  console.log(`Found ${snapshot.size} messages`);
  snapshot.forEach(doc => console.log(doc.id, doc.data()));
}

// Update conversation for both users
async function updateConversationForBothUsers(lastMessage, timestamp) {
    try {
        const conversationId = [currentUser.uid, selectedUserId].sort().join("_");
        
        // Update current user's conversation
        const currentUserRef = doc(db, "userConversations", currentUser.uid, "conversations", conversationId);
        await setDoc(currentUserRef, {
            lastMessage,
            lastMessageTimestamp: timestamp,
            updatedAt: timestamp
        }, { merge: true });
        
        // Update partner's conversation
        const partnerRef = doc(db, "userConversations", selectedUserId, "conversations", conversationId);
        await setDoc(partnerRef, {
            otherUserId: currentUser.uid,
            otherUserName: `${currentUser.displayName || "User"}`,
            lastMessage,
            lastMessageTimestamp: timestamp,
            updatedAt: timestamp
        }, { merge: true });
        
    } catch (error) {
        console.error("Error updating conversations:", error);
    }
}

// Search users
async function searchUsers(event) {
    const searchQuery = event.target.value.toLowerCase().trim();
    
    if (!searchQuery) {
        await loadRecentConversations();
        return;
    }

    elements.userList.innerHTML = "<div class='loading'>Searching users...</div>";
    
    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        elements.userList.innerHTML = "";
        let foundUsers = false;
        
        usersSnapshot.forEach((docSnap) => {
            if (docSnap.id !== currentUser.uid) {
                const user = docSnap.data();
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
                
                if (fullName.includes(searchQuery)) {
                    foundUsers = true;
                    const userDiv = document.createElement("div");
                    userDiv.className = "user-item";
                    userDiv.innerHTML = `
                        <div class="user-name">${user.firstName} ${user.lastName}</div>
                        <div class="user-email">${user.email || ''}</div>
                    `;
                    userDiv.addEventListener("click", () => openChat(docSnap.id, `${user.firstName} ${user.lastName}`));
                    elements.userList.appendChild(userDiv);
                }
            }
        });
        
        if (!foundUsers) {
            elements.userList.innerHTML = "<div class='empty-state'>No users found</div>";
        }
    } catch (error) {
        console.error("Error searching users:", error);
        elements.userList.innerHTML = "<div class='error'>Search failed. Please try again.</div>";
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    
    // If page is refreshed with an active chat, restore it
    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('chat');
    
    if (chatId) {
        // You would need to fetch the user details for this chatId
        // For now, we'll just clear the parameter
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});
