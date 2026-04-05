// ===== FIREBASE CONFIGURATION =====
// IMPORTANT: Replace this with your actual Firebase Project config!
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "agripredict-demo.firebaseapp.com",
    projectId: "agripredict-demo",
    storageBucket: "agripredict-demo.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
let auth;
try {
    const app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
} catch (e) {
    console.error("Firebase Initialization Failed (Likely using dummy config)");
    // We will fallback to LocalStorage mock auth if Firebase isn't configured for this demo
}

// ===== AUTH MOCKING (For MVP without actual DB setup) =====
// If the user hasn't put in their real firebase keys, we still want the UI to work!
const useMockAuth = firebaseConfig.apiKey === "YOUR_FIREBASE_API_KEY";

// ===== DOM ELEMENTS =====
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loadingOverlay = document.getElementById('auth-loading');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');

function showLoading(show) {
    if(loadingOverlay) loadingOverlay.style.display = show ? 'flex' : 'none';
}

function showError(element, message) {
    element.innerText = message;
    element.style.display = 'block';
    setTimeout(() => { element.style.display = 'none'; }, 5000);
}

// ===== LOGIN LOGIC =====
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        showLoading(true);
        
        if (useMockAuth) {
            // MOCK AUTH
            // LOCAL DB MVP AUTH
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if(res.ok) {
                    const userData = await res.json();
                    localStorage.setItem('agri_current_user', JSON.stringify({
                        id: userData.id,
                        name: userData.firstName + ' ' + userData.lastName,
                        email: userData.email,
                        role: userData.role,
                        testPassed: userData.testPassed
                    }));
                    if (userData.role === 'admin') {
                        window.location.href = '/admin.html';
                    } else if (userData.role === 'guider') {
                        window.location.href = userData.testPassed ? '/guider.html' : '/guider-test.html';
                    } else {
                        window.location.href = '/dashboard.html';
                    }
                } else {
                    const errObj = await res.json();
                    showLoading(false);
                    showError(loginError, errObj.message || "Invalid credentials.");
                }
            } catch(e) {
                showLoading(false);
                showError(loginError, "Could not connect to database.");
            }
        } else {
            // REAL FIREBASE AUTH
            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                // Auth state observer handles redirect
                window.location.href = '/dashboard.html';
            } catch (error) {
                showLoading(false);
                showError(loginError, error.message);
            }
        }
    });
}

// ===== REGISTER LOGIC =====
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;
        
        showLoading(true);
        
        if (useMockAuth) {
            // MOCK AUTH
            // LOCAL DB MVP AUTH
            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, role })
                });

                if(res.ok) {
                    const userData = await res.json();
                    localStorage.setItem('agri_current_user', JSON.stringify({
                        id: userData.id,
                        name: userData.firstName + ' ' + userData.lastName,
                        email: userData.email,
                        role: userData.role,
                        testPassed: userData.testPassed
                    }));
                    if (userData.role === 'admin') {
                        window.location.href = '/admin.html';
                    } else if (userData.role === 'guider') {
                        window.location.href = userData.testPassed ? '/guider.html' : '/guider-test.html';
                    } else {
                        window.location.href = '/dashboard.html';
                    }
                } else {
                    showLoading(false);
                    showError(registerError, "Registration failed on server.");
                }
            } catch(e) {
                showLoading(false);
                showError(registerError, "Could not connect to database.");
            }
        } else {
            // REAL FIREBASE AUTH
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                
                // Update Firebase Profile with Name
                await userCredential.user.updateProfile({ displayName: name });
                
                // Note: In a real app, you would now send `userCredential.user.uid` and `role` to your MySQL backend here!
                console.log("Firebase user created. Next step: Save role to MySQL backend.");
                
                window.location.href = '/dashboard.html';
            } catch (error) {
                showLoading(false);
                showError(registerError, error.message);
            }
        }
    });
}

// ===== LOGOUT FUNCTION =====
window.logout = function() {
    if (useMockAuth) {
        localStorage.removeItem('agri_current_user');
        window.location.href = '/';
    } else {
        auth.signOut().then(() => {
            window.location.href = '/';
        }).catch((error) => {
            console.error(error);
        });
    }
}
