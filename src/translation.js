export const translation = {
    en:{
    Slogan: "Where your vision meets our design and your website comes to life",
    getStarted: "Get Started",
    accountCreation: "Account creation ",
    firstName: "First name",
    lastName: "Last name",
    emailAddress: "Email adress",
    creationSuccess: "Account creation successfull!",
    descriptionSF: "At ScriptFuse, we turn your ideas into custom websites that reflect your business. We bring thoughtful design and technical know-how to every project, creating a modern, easy-to-use site that helps visitors discover what you offer and connect with you."
    },

    fr:{
    firstName: "Prénom",
    lastName: "Nom",
    emailAddress: "Courriel",  
    creationSuccess: "Votre compte à été créé avec succès!", 
    Slogan: "Là où votre vision rencontre notre savoir-faire et où votre site prend vie.",
    getStarted: "Commencer",
    accountCreation: "Création d'un nouveau compte ",
    descriptionSF: "Chez ScriptFuse, nous transformons vos idées en sites web sur mesure qui reflètent votre entreprise. Nous allions créativité et savoir-faire technique pour concevoir un site moderne et facile à utiliser, qui permet à vos visiteurs de découvrir ce que vous proposez et d’entrer en contact avec vous.",
    }}

let currentLanguage = "en";
const languageToggle = document.getElementById("lang-toggle");

function applyLanguage(language) {
    currentLanguage = language;
    document.documentElement.lang = language;

    document.querySelectorAll("[data-key]").forEach((element) => {
        const key = element.dataset.key;
        const text = translation[language][key];

        if (text) {
            element.textContent = text;
        }
    });

    languageToggle.textContent = language === "en" ? "FR" : "EN";
    languageToggle.setAttribute(
        "aria-label",
        `Switch to ${language === "en" ? "French" : "English"}`
    );
}

applyLanguage(currentLanguage);
languageToggle.addEventListener("click", () => {
    applyLanguage(currentLanguage === "en" ? "fr" : "en");
});