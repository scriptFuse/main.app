document.querySelectorAll("#accordionFAQ .accordion-button").forEach((button) => {
    const answer = document.getElementById(button.getAttribute("aria-controls"));

    button.addEventListener("click", () => {
        answer.hidden = !answer.hidden;
        button.setAttribute("aria-expanded", String(!answer.hidden));
    });
});
