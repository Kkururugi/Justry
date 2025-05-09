// Import Firebase SDKs
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";

// Firebase Config
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
const auth = getAuth(app);  // ✅ Pass app to get auth
const db = getFirestore(app);  // ✅ Pass app to get firestore
// Function to show messages
function showMessage(message, divId) {
    var messageDiv = document.getElementById(divId);
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;
    setTimeout(function() {
        messageDiv.style.opacity = 0;
    }, 5000);
}

// Toggle between SignUp and SignIn forms
const signUpButton = document.getElementById('signUpButton');
const signInButton = document.getElementById('signInButton');
const signUpContainer = document.getElementById('signup');
const signInContainer = document.getElementById('signIn');

// Display the Sign-Up form when 'Sign Up' button is clicked
signUpButton.addEventListener('click', () => {
    signInContainer.style.display = "none";
    signUpContainer.style.display = "block";
});

// Display the Sign-In form when 'Sign In' button is clicked
signInButton.addEventListener('click', () => {
    signUpContainer.style.display = "none";
    signInContainer.style.display = "block";
});

// Sign-Up Event
const signUp = document.getElementById('submitSignUp');
signUp.addEventListener('click', (event) => {
    event.preventDefault();
    const email = document.getElementById('rEmail').value;
    const password = document.getElementById('rPassword').value;
    const firstName = document.getElementById('fName').value;
    const lastName = document.getElementById('lName').value;

    if (!email || !password || !firstName || !lastName) {
        showMessage('Please fill out all fields.', 'signUpMessage');
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const userData = {
                email: email,
                firstName: firstName,
                lastName: lastName
            };
            showMessage('Account Created Successfully', 'signUpMessage');
            const docRef = doc(db, "users", user.uid);
            setDoc(docRef, userData)
                .then(() => {
                    window.location.href = 'index.html'; // Redirect to home
                })
                .catch((error) => {
                    console.error("Error writing document", error);
                    showMessage('Error saving user data', 'signUpMessage');
                });
        })
        .catch((error) => {
            const errorCode = error.code;
            console.error("Firebase Error: ", error);
            if (errorCode === 'auth/email-already-in-use') {
                showMessage('Email Address Already Exists!!!', 'signUpMessage');
            } else if (errorCode === 'auth/invalid-email') {
                showMessage('Invalid Email Address', 'signUpMessage');
            } else if (errorCode === 'auth/weak-password') {
                showMessage('Password is too weak. Please use a stronger password.', 'signUpMessage');
            } else {
                showMessage('Unable to create User. Please try again.', 'signUpMessage');
            }
        });
});

// Sign-In Event
const signIn = document.getElementById('submitSignIn');
signIn.addEventListener('click', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            showMessage('Login is successful', 'signInMessage');
            const user = userCredential.user;
            localStorage.setItem('loggedInUserId', user.uid);
            window.location.href = 'homepage.html';  // Redirect to homepage after login
        })
        .catch((error) => {
            const errorCode = error.code;
            console.error("Firebase Sign-In Error: ", error);
            if (errorCode === 'auth/invalid-credential') {
                showMessage('Incorrect Email or Password', 'signInMessage');
            } else {
                showMessage('Account does not Exist', 'signInMessage');
            }
        });
});



