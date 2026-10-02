import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import { createUserWithEmailAndPassword, EmailAuthProvider, getAuth, onAuthStateChanged, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, updateEmail, updatePassword, updateProfile } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { translation } from "./translation.js";
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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
const homeGuestActions = document.getElementById("homeGuestActions");
const homeDashboardButton = document.getElementById("homeDashboardBtn");

if (homeGuestActions && homeDashboardButton) {
    onAuthStateChanged(auth, (user) => {
        homeGuestActions.hidden = Boolean(user);
        homeDashboardButton.hidden = !user;
    });
}

export const db = getFirestore(app);

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
const dashboardUserRole = document.getElementById("dashboardUserRole");
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
    let dashboardAuthGeneration = 0;
    onAuthStateChanged(auth, async (user) => {
        const generation = ++dashboardAuthGeneration;
        if (!user) {
            window.location.replace("login.html");
            return;
        }

        const displayName = user?.displayName?.trim()
            || user?.email?.split("@")[0]
            || "there";
        const firstName = displayName.split(/\s+/)[0];
        dashboardUserName.textContent = firstName.charAt(0).toUpperCase() + firstName.slice(1);

        dashboardUserRole.hidden = true;
        dashboardUserRole.textContent = "";
        delete dashboardUserRole.dataset.key;
        try {
            const [userDoc, tokenResult] = await Promise.all([
                getDoc(doc(db, "users", user.uid)),
                user.getIdTokenResult(true)
            ]);
            const userData = userDoc.exists() ? userDoc.data() : {};
            if (generation !== dashboardAuthGeneration) return;
            if (userData.role === "admin" || tokenResult.claims.admin === true) {
                const language = document.documentElement.lang === "fr" ? "fr" : "en";
                const newOrderLink = document.getElementById("newOrder");
                newOrderLink.href = "newOrders.html";
                newOrderLink.dataset.key = "adminNewOrders";
                newOrderLink.textContent = translation[language].adminNewOrders;
            }
            const role = userData.role === "admin"
                ? "adminRole"
                : userData.role === "developer"
                    ? "developerRole"
                    : null;
            if (role) {
                const language = document.documentElement.lang === "fr" ? "fr" : "en";
                dashboardUserRole.dataset.key = role;
                dashboardUserRole.textContent = ` (${translation[language][role]})`;
                dashboardUserRole.hidden = false;
            }
        } catch (error) {
            if (generation !== dashboardAuthGeneration) return;
            console.error("Could not load the user's role from Firebase.", error);
        }
    });
}

const profileDialog = document.getElementById("profileDialog");
const profileForm = document.getElementById("profileForm");

if (profileDialog && profileForm) {
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const currentPassword = document.getElementById("profileCurrentPassword");
    const newPassword = document.getElementById("profileNewPassword");
    const confirmPassword = document.getElementById("profileConfirmPassword");
    const profileStatus = document.getElementById("profileStatus");
    const saveProfileButton = document.getElementById("saveProfileBtn");
    const profileText = (key) => {
        const language = document.documentElement.lang === "fr" ? "fr" : "en";
        return translation[language][key] || key;
    };

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.replace("login.html");
            return;
        }
        profileName.value = user.displayName || "";
        profileEmail.value = user.email || "";
    });

    document.getElementById("editProfileBtn").addEventListener("click", () => {
        profileStatus.hidden = true;
        const user = auth.currentUser;
        profileName.value = user?.displayName || "";
        profileEmail.value = user?.email || "";
        currentPassword.value = "";
        newPassword.value = "";
        confirmPassword.value = "";
        profileDialog.showModal();
        profileName.focus();
    });

    document.getElementById("closeProfileDialog").addEventListener("click", () => {
        profileDialog.close();
    });

    document.getElementById("closeProfileDialogX").addEventListener("click", () => {
        profileDialog.close();
    });

    profileDialog.addEventListener("close", () => {
        profileForm.reset();
        profileStatus.hidden = true;
    });

    profileForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const user = auth.currentUser;
        if (!user) {
            window.location.replace("login.html");
            return;
        }

        const displayName = profileName.value.trim();
        const email = profileEmail.value.trim();
        const password = newPassword.value;
        const emailChanged = email !== (user.email || "");
        const passwordChanged = password.length > 0;
        const nameChanged = displayName !== (user.displayName || "");

        if ((passwordChanged || confirmPassword.value) && password !== confirmPassword.value) {
            profileStatus.textContent = profileText("profilePasswordMismatch");
            profileStatus.hidden = false;
            return;
        }

        if (!emailChanged && !passwordChanged && !nameChanged) {
            profileStatus.textContent = profileText("profileNoChanges");
            profileStatus.hidden = false;
            return;
        }

        saveProfileButton.disabled = true;
        profileStatus.hidden = true;
        let completedChanges = 0;

        try {
            if (emailChanged || passwordChanged) {
                const supportsPasswordAuth = user.providerData.some(
                    (provider) => provider.providerId === EmailAuthProvider.PROVIDER_ID
                );
                if (!supportsPasswordAuth || !user.email) {
                    throw new Error("profilePasswordProviderRequired");
                }
                if (!currentPassword.value) {
                    throw new Error("profileCurrentPasswordRequired");
                }

                const credential = EmailAuthProvider.credential(user.email, currentPassword.value);
                await reauthenticateWithCredential(user, credential);

                if (emailChanged) {
                    await updateEmail(user, email);
                    completedChanges += 1;
                }
                if (passwordChanged) {
                    await updatePassword(user, password);
                    completedChanges += 1;
                }
            }

            if (nameChanged) {
                await updateProfile(user, { displayName });
                completedChanges += 1;
            }

            const firstName = displayName.split(/\s+/)[0];
            dashboardUserName.textContent = firstName.charAt(0).toUpperCase() + firstName.slice(1);
            profileEmail.value = user.email || email;
            profileName.value = user.displayName || displayName;
            currentPassword.value = "";
            newPassword.value = "";
            confirmPassword.value = "";
            profileStatus.textContent = profileText("profileSaved");
            profileStatus.hidden = false;
        } catch (error) {
            console.error("Could not update the user's profile.", error);
            const errorKey = error.message === "profilePasswordProviderRequired"
                ? error.message
                : error.message === "profileCurrentPasswordRequired"
                    ? error.message
                    : error.code === "auth/invalid-credential" || error.code === "auth/wrong-password"
                        ? "profileIncorrectPassword"
                        : error.code === "auth/email-already-in-use"
                            ? "profileEmailInUse"
                            : error.code === "auth/invalid-email"
                                ? "profileInvalidEmail"
                                : error.code === "auth/weak-password"
                                    ? "profileWeakPassword"
                                    : error.code === "auth/network-request-failed"
                                        ? "profileNetworkError"
                                        : error.code === "auth/requires-recent-login"
                                            ? "profileReauthRequired"
                                            : "profileUpdateError";
            const message = profileText(errorKey);
            profileStatus.textContent = completedChanges
                ? `${profileText("profilePartialUpdate")} ${message}`
                : message;
            profileStatus.hidden = false;
        } finally {
            saveProfileButton.disabled = false;
        }
    });
}

document.querySelectorAll("[data-dropzone]").forEach((dropzone) => {
    const fileInput = dropzone.querySelector('input[type="file"]');
    const fileNameList = dropzone.querySelector(".file-name-list");

    if (!fileInput || !fileNameList) {
        return;
    }

    const displayFileNames = () => {
        fileNameList.textContent = Array.from(fileInput.files, (file) => file.name).join(", ");
    };

    fileInput.addEventListener("change", displayFileNames);
    dropzone.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropzone.classList.add("is-dragging");
    });
    dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("is-dragging");
    });
    dropzone.addEventListener("drop", (event) => {
        event.preventDefault();
        dropzone.classList.remove("is-dragging");

        if (event.dataTransfer?.files) {
            fileInput.files = event.dataTransfer.files;
            fileInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
    });
});
// WEBSITE BRIEF SUBMISSION
const quickScriptForm = document.getElementById("quickScriptForm");

if (quickScriptForm) {
    const briefReview = document.getElementById("briefReview");
    const briefReviewTitle = document.getElementById("briefReviewTitle");
    const briefSubmittedTitle = document.getElementById("briefSubmittedTitle");
    const briefReviewDetails = document.getElementById("briefReviewDetails");
    const briefReviewIntro = document.getElementById("briefReviewIntro");
    const briefReviewFollowup = document.getElementById("briefReviewFollowup");
    const briefReviewError = document.getElementById("briefReviewError");
    const briefReviewSuccess = document.getElementById("briefReviewSuccess");
    const briefReviewActions = document.getElementById("briefReviewActions");
    const briefReviewDashboard = document.getElementById("briefReviewDashboard");
    const editBriefButton = document.getElementById("editBrief");
    const confirmBriefButton = document.getElementById("confirmBrief");
    let briefData;

    const hasAnswer = (value) => {
        const normalized = String(value).trim();
        return normalized !== "" && normalized.toLowerCase() !== "n/a";
    };

    const getBriefData = () => {
        const formData = new FormData(quickScriptForm);
        const data = {};

        for (const [key, rawValue] of formData.entries()) {
            if (rawValue instanceof File) {
                continue;
            }

            const value = String(rawValue).trim();
            if (!hasAnswer(value)) {
                continue;
            }

            if (Object.prototype.hasOwnProperty.call(data, key)) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }

        return data;
    };

    const appendReviewValue = (container, value, key) => {
        const valueElement = document.createElement("span");
        valueElement.textContent = value;
        if (key) {
            valueElement.dataset.key = key;
        }
        container.appendChild(valueElement);
    };

    const renderBriefReview = () => {
        briefReviewDetails.replaceChildren();

        for (const [name, rawValue] of Object.entries(briefData)) {
            const values = Array.isArray(rawValue) ? rawValue : [rawValue];
            const controls = Array.from(quickScriptForm.elements)
                .filter((control) => control.name === name);
            const firstControl = controls[0];
            let label = firstControl?.labels?.[0];

            if (firstControl?.type === "checkbox") {
                label = firstControl.closest("fieldset")?.querySelector("legend") || label;
            }

            const labelText = label?.textContent.trim() || name;
            const term = document.createElement("dt");
            term.textContent = labelText;
            if (label?.dataset.key) {
                term.dataset.key = label.dataset.key;
            }

            const description = document.createElement("dd");
            const displayValues = firstControl?.type === "checkbox"
                ? controls.filter((control) => control.checked && values.includes(control.value))
                : values;

            displayValues.forEach((value, index) => {
                if (index > 0) {
                    description.appendChild(document.createTextNode(", "));
                }

                if (firstControl?.type === "checkbox") {
                    const choiceLabel = value.labels?.[0];
                    const choiceText = choiceLabel?.querySelector("[data-key]") || choiceLabel;
                    appendReviewValue(description, choiceText?.textContent.trim() || value.value, choiceText?.dataset.key);
                } else if (firstControl instanceof HTMLSelectElement) {
                    const selectedOption = firstControl.selectedOptions[0];
                    appendReviewValue(description, selectedOption?.textContent.trim() || value, selectedOption?.dataset.key);
                } else {
                    appendReviewValue(description, value);
                }
            });

            briefReviewDetails.append(term, description);
        }
    };

    quickScriptForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!auth.currentUser) {
            window.location.assign("login.html");
            return;
        }

        briefData = getBriefData();
        renderBriefReview();
        briefReviewError.hidden = true;
        quickScriptForm.hidden = true;
        briefReview.hidden = false;
        briefReviewTitle.focus();
    });

    editBriefButton.addEventListener("click", () => {
        briefReview.hidden = true;
        quickScriptForm.hidden = false;
        quickScriptForm.scrollIntoView({ behavior: "smooth" });
        document.getElementById("submitBrief").focus();
    });

    confirmBriefButton.addEventListener("click", async () => {
        const user = auth.currentUser;

        if (!user) {
            window.location.assign("login.html");
            return;
        }

        confirmBriefButton.disabled = true;
        briefReviewError.hidden = true;

        try {
            const docRef = await addDoc(
                collection(db, "projects"),
                {
                    ...briefData,
                    userId: user.uid,
                    userName: user.displayName?.trim() || "",
                    userEmail: user.email,
                    package: "quickScript",
                    status: "submitted",
                    createdAt: serverTimestamp()
                }
            );

            console.log("Project saved:", docRef.id);
            const submittedOrderLink = document.getElementById("submittedOrderLink");
            submittedOrderLink.href = `orderDetails.html?order=${encodeURIComponent(docRef.id)}`;
            submittedOrderLink.textContent = briefData.preferredDomain || briefData.companyName;
            delete submittedOrderLink.dataset.key;
            submittedOrderLink.hidden = false;
            briefReviewIntro.hidden = true;
            briefReviewFollowup.hidden = true;
            briefReviewActions.hidden = true;
            briefReviewTitle.hidden = true;
            briefSubmittedTitle.hidden = false;
            briefSubmittedTitle.focus();
            briefReviewSuccess.hidden = false;
            briefReviewDashboard.hidden = false;
        } catch (error) {
            console.error("Could not save website brief:", error);
            briefReviewError.hidden = false;
            confirmBriefButton.disabled = false;
        }
    });
}
