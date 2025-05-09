import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCbLK26irLxdz03rDCMVHnqHYfDgBjn10g",
  authDomain: "questwalker-5c547.firebaseapp.com",
  projectId: "questwalker-5c547",
  storageBucket: "questwalker-5c547.appspot.com",
  messagingSenderId: "1058097550838",
  appId: "1:1058097550838:web:7bdbb645be374c93e4e3d7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Load reports
async function loadReports() {
  const reportsList = document.getElementById("reports-list");
  const reportsRef = collection(db, "reports");
  const snapshot = await getDocs(reportsRef);

  reportsList.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const report = docSnap.data();
    const reportDiv = document.createElement("div");
    reportDiv.classList.add("report");

    reportDiv.innerHTML = `
      <h3>Quest Title: ${report.questTitle}</h3>
      <p><strong>Reason:</strong> ${report.reason}</p>
      <p><strong>Reported By:</strong> ${report.reportedBy}</p>
      <p><strong>Quest ID:</strong> ${report.questId}</p>
      <p><strong>User ID:</strong> ${report.userId}</p>
      <button onclick="removeQuest('${report.questId}')">Remove Quest</button>
      <button onclick="banUser('${report.userId}')">Ban User</button>
    `;

    reportsList.appendChild(reportDiv);
  });
}

// Remove quest
window.removeQuest = async function(questId) {
  await deleteDoc(doc(db, "quests", questId));
  alert("Quest removed.");
  loadReports();
};

// Ban user
window.banUser = async function(userId) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { banned: true });
  alert("User has been banned.");
  loadReports();
};

// Load reports on page load
window.onload = loadReports;

