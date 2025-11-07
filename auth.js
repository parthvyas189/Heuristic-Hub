// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Get DOM Elements ---
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form'); // Assumes you add a signup form
    const btnLogin = document.getElementById('btn-login');
    const btnSignup = document.getElementById('btn-signup'); // Assumes you add a signup button
    const btnGoogleLogin = document.getElementById('btn-google-login');
    const toggleToSignup = document.getElementById('toggle-to-signup');
    const toggleToLogin = document.getElementById('toggle-to-login'); // Assumes you add this
    const statusMessage = document.getElementById('status-message'); // Assumes you add this

    // --- Toggle Forms ---
    // (This is an example, you'd build out the signup form in HTML)
    
    // For now, let's find the signup form in your AuthPage.html
    // I'll assume you have an ID 'signup-form' and 'login-form'
    const loginFormContainer = document.getElementById('login-form');
    // Let's create a dynamic signup form for simplicity
    
    // We need to handle the case where elements might not exist.
    // Let's assume you've updated your AuthPage.html to have two forms.
    // For this example, I'll provide the logic assuming two forms.
    
    // --- THIS IS A MOCKUP of how you'd switch forms ---
    // You'd have to build the HTML for the signup-form yourself.
    /*
    toggleToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.style.display = 'none';
        // signupFormContainer.style.display = 'block'; // Show signup form
    });

    toggleToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.style.display = 'block';
        // signupFormContainer.style.display = 'none'; // Hide signup form
    });
    */

    // --- Sign Up with Email ---
    // You would have a separate signup form for this.
    // Let's assume you add one with ID 'signup-form'
    
    // This is a placeholder for your eventual signup form
    /* if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const username = document.getElementById('signup-username').value; // Username field

            if (!username) {
                alert("Please enter a username.");
                return;
            }

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Signed in 
                    const user = userCredential.user;
                    
                    // --- Create user document in Firestore ---
                    db.collection('users').doc(user.uid).set({
                        email: user.email,
                        username: username,
                        // --- INITIALIZE NEW STATS ---
                        dp_wins: 0,
                        dp_losses: 0,
                        dp_total_games: 0,
                        dp_win_rate: 0
                    })
                    .then(() => {
                        window.location.href = 'index.html'; // Redirect to home
                    })
                    .catch((error) => {
                        console.error("Error writing user document: ", error);
                        alert(error.message);
                    });
                })
                .catch((error) => {
                    alert(error.message);
                });
        });
    }
    */
    
    // --- Sign In with Email ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Signed in
                    window.location.href = 'index.html'; // Redirect to home
                })
                .catch((error) => {
                    alert(error.message);
                });
        });
    }

    // --- Sign In with Google ---
    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then((result) => {
                    const user = result.user;
                    
                    // Check if this is a new user
                    if (result.additionalUserInfo.isNewUser) {
                        // Create their user document in Firestore
                        const username = user.email.split('@')[0]; // Default username
                        
                        db.collection('users').doc(user.uid).set({
                            email: user.email,
                            username: username,
                            // --- INITIALIZE NEW STATS ---
                            dp_wins: 0,
                            dp_losses: 0,
                            dp_total_games: 0,
                            dp_win_rate: 0
                        })
                        .then(() => {
                            window.location.href = 'index.html'; // Redirect to home
                        })
                        .catch((error) => {
                            console.error("Error writing user document: ", error);
                            alert(error.message);
                        });
                    } else {
                        // Existing user, just redirect
                        window.location.href = 'index.html';
                    }
                })
                .catch((error) => {
                    alert(error.message);
                });
        });
    }

    // This is a simple fix for your current auth page, which only has login.
    // If you want a full signup flow, you'll need to create the HTML for it.
    // For now, let's assume Google Sign-in is the main way new users get stats.
    // And let's add a "Sign Up" button logic, assuming you add it.

    // A simple hack for your current page: If login fails, offer signup.
    // This is not good UI, but demonstrates the logic.
    // A better way is to have separate Login/Signup forms.
    
    // Let's just focus on the Google Sign-in, which correctly adds new users
    // with the stats.
});