export const packages = Object.freeze({
    quickScript: Object.freeze({ label: "quickScript", briefTitle: "basicWebsiteTitle", price: "quickPrice" }),
    booking: Object.freeze({ label: "bookingWebsite", briefTitle: "bookingRequirementsTitle", price: "bookingPrice" }),
    custom: Object.freeze({ label: "customWebsite", briefTitle: "customRequirementsTitle", price: "customPrice" })
});

export function packageFromSearch(search) {
    const id = new URLSearchParams(search).get("package") || "quickScript";
    return Object.hasOwn(packages, id) ? id : null;
}

export function configurePackageFields(form, packageId) {
    for (const section of form.querySelectorAll("[data-package-fields]")) {
        const active = section.dataset.packageFields === packageId;
        section.hidden = !active;
        for (const control of section.querySelectorAll("input, select, textarea")) {
            control.disabled = !active;
        }
    }
}
