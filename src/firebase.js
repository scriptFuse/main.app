import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";

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