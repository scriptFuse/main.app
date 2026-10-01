import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBrSbHqKRuHiihQ71oNx4dm5lHT05t7gAI",
    authDomain: "scriptfuse-81798.firebaseapp.com",
    projectId: "scriptfuse-81798",
    storageBucket: "scriptfuse-81798.firebasestorage.app",
    messagingSenderId: "783941432251",
    appId: "1:783941432251:web:d46cb739dfcca9fc340a9e",
    measurementId: "G-GPHS8GKSKC",
};

export const app = initializeApp(firebaseConfig);

export const analytics = isSupported().then((supported) =>
    supported ? getAnalytics(app) : null
);

export const auth = getAuth(app);
const accountCreationForm = document.getElementById("accountCreationForm");

if (accountCreationForm) {
    const submitButton = document.getElementById("createAccntBtn");
    const statusMessage = document.getElementById("accountCreationStatus");
    const messages = {
        en: {
            mismatch: "Passwords do not match.",
            creating: "Creating your account...",
            emailInUse: "An account already exists for this email.",
            invalidEmail: "Enter a valid email address.",
            weakPassword: "Choose a password with at least 6 characters.",
            providerDisabled: "Email and password sign-up is not enabled for this project.",
            networkError: "Network error. Check your connection and try again.",
            generic: "Could not create your account. Please try again."
        },
        fr: {
            mismatch: "Les mots de passe ne correspondent pas.",
            creating: "Création du compte...",
            emailInUse: "Un compte existe déjà pour cette adresse courriel.",
            invalidEmail: "Saisissez une adresse courriel valide.",
            weakPassword: "Choisissez un mot de passe d'au moins 6 caractères.",
            providerDisabled: "L'inscription par courriel et mot de passe n'est pas activée pour ce projet.",
            networkError: "Erreur réseau. Vérifiez votre connexion et réessayez.",
            generic: "Impossible de créer le compte. Veuillez réessayer."
        }
    };

    accountCreationForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const language = document.documentElement.lang === "fr" ? "fr" : "en";
        const text = messages[language];
        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const email = document.getElementById("emailAddress").value.trim();
        const password = document.getElementById("passWord").value;
        const confirmPassword = document.getElementById("ConfirmPW").value;

        if (password !== confirmPassword) {
            statusMessage.textContent = text.mismatch;
            return;
        }

        submitButton.disabled = true;
        statusMessage.textContent = text.creating;

        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            try {
                await updateProfile(credential.user, {
                    displayName: `${firstName} ${lastName}`
                });
            } catch (profileError) {
                console.error("Account created, but the profile name could not be saved.", profileError);
            }
            window.location.assign("acConfirmation.html");
        } catch (error) {
            const errorMessages = {
                "auth/email-already-in-use": text.emailInUse,
                "auth/invalid-email": text.invalidEmail,
                "auth/weak-password": text.weakPassword,
                "auth/operation-not-allowed": text.providerDisabled,
                "auth/network-request-failed": text.networkError
            };
            statusMessage.textContent = errorMessages[error.code] || text.generic;
            submitButton.disabled = false;
        }
    });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    const submitButton = document.getElementById("loginBtn");
    const statusMessage = document.getElementById("loginStatus");
    const messages = {
        en: {
            signingIn: "Signing in...",
            invalidCredentials: "Email or password is incorrect.",
            providerDisabled: "Email and password sign-in is not enabled for this project.",
            tooManyRequests: "Too many attempts. Try again later.",
            networkError: "Network error. Check your connection and try again.",
            generic: "Could not sign in. Please try again."
        },
        fr: {
            signingIn: "Connexion...",
            invalidCredentials: "L'adresse courriel ou le mot de passe est incorrect.",
            providerDisabled: "La connexion par courriel et mot de passe n'est pas activée pour ce projet.",
            tooManyRequests: "Trop de tentatives. Réessayez plus tard.",
            networkError: "Erreur réseau. Vérifiez votre connexion et réessayez.",
            generic: "Impossible de se connecter. Veuillez réessayer."
        }
    };

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const language = document.documentElement.lang === "fr" ? "fr" : "en";
        const text = messages[language];
        const email = document.getElementById("emailAddress").value.trim();
        const password = document.getElementById("passWord").value;

        submitButton.disabled = true;
        statusMessage.textContent = text.signingIn;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.assign("userDashboard.html");
        } catch (error) {
            const errorMessages = {
                "auth/invalid-credential": text.invalidCredentials,
                "auth/invalid-email": text.invalidCredentials,
                "auth/user-disabled": text.invalidCredentials,
                "auth/user-not-found": text.invalidCredentials,
                "auth/wrong-password": text.invalidCredentials,
                "auth/operation-not-allowed": text.providerDisabled,
                "auth/too-many-requests": text.tooManyRequests,
                "auth/network-request-failed": text.networkError
            };
            statusMessage.textContent = errorMessages[error.code] || text.generic;
            submitButton.disabled = false;
        }
    });
}

const dashboardUserName = document.getElementById("dashboardUserName");
const logoutButton = document.getElementById("logoutBtn");

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;

        try {
            await signOut(auth);
            window.location.assign("login.html");
        } catch (error) {
            console.error("Could not sign out.", error);
            logoutButton.disabled = false;
        }
    });
}

if (dashboardUserName) {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.replace("login.html");
            return;
        }

        const displayName = user?.displayName?.trim()
            || user?.email?.split("@")[0]
            || "there";
        dashboardUserName.textContent = displayName.split(/\s+/)[0];
    });
}