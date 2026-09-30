import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import { createUserWithEmailAndPassword, getAuth, updateProfile } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

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

const auth = getAuth(app);
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