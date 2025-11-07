document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const btnLogin = document.getElementById('btn-login');
    const btnGoogleLogin = document.getElementById('btn-google-login');
    const toggleLink = document.getElementById('toggle-to-signup');

    let isLoginMode = true;

    // --- Toggle between Login and Sign Up ---
    toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            btnLogin.textContent = 'Sign In';
            toggleLink.textContent = 'Sign Up';
        } else {
            btnLogin.textContent = 'Sign Up';
            toggleLink.textContent = 'Sign In';
        }
    });

    // --- Email/Password Login or Sign Up ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginEmail.value;
        const password = loginPassword.value;

        if (isLoginMode) {
            // --- Sign In ---
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Signed in
                    console.log('User signed in:', userCredential.user);
                    window.location.href = './index.html'; // Redirect to home
                })
                .catch((error) => {
                    alert(`Error: ${error.message}`);
                });
        } else {
            // --- Sign Up ---
            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Signed up
                    console.log('User created:', userCredential.user);
                    // Also create a user doc in Firestore
                    db.collection('users').doc(userCredential.user.uid).set({
                        email: userCredential.user.email,
                        username: userCredential.user.email.split('@')[0] // Default username
                    })
                    .then(() => {
                        window.location.href = './index.html'; // Redirect to home
                    });
                })
                .catch((error) => {
                    alert(`Error: ${error.message}`);
                });
        }
    });

    // --- Google Sign-In ---
    btnGoogleLogin.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then((result) => {
                // This gives you a Google Access Token.
                const user = result.user;
                console.log('Google user signed in:', user);
                
                // Check if this is a new user
                if (result.additionalUserInfo.isNewUser) {
                    // Create their user doc
                    db.collection('users').doc(user.uid).set({
                        email: user.email,
                        username: user.displayName || user.email.split('@')[0]
                    })
                    .then(() => {
                        window.location.href = './index.html';
                    });
                } else {
                    window.location.href = './index.html';
                }
            }).catch((error) => {
                alert(`Error: ${error.message}`);
            });
    });
});