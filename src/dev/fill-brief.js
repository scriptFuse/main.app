/*
 * Open a package brief while signed in, then run in the browser console:
 * await import('./dev/fill-brief.js');
 *
 * Refill/replace values and optionally attach generated test PNGs:
 * await fillScriptFuseBrief({ overwrite: true, images: true });
 * This script fills fields only; it never clicks Submit or Confirm.
 */
(() => {
    const values = {
        companyName: 'TEST - Maple Studio',
        companyType: 'consulting',
        businessDescription: 'Fictional business used to test the ScriptFuse order form.',
        productsServices: 'Design consultations and branding workshops.',
        companyAddress: '123 Example Street, Toronto, ON',
        displayContact: 'Show the business email and phone number on the contact page.',
        phoneNumber: '416-555-0100',
        publicEmail: 'hello@example.com',
        websiteGoal: 'leads',
        visitorAction: 'Request a quote or book a consultation.',
        typicalCustomers: 'Small businesses and independent professionals.',
        targetAudience: 'Businesses in Ontario and Quebec.',
        requestedPages: ['home', 'about', 'services', 'contact', 'gallery'],
        pageContentDetails: 'Home: introduction. About: team. Services: offers. Contact: details. Gallery: sample work.',
        contentReadiness: 'write-for-me',
        aiContent: 'approval-required',
        hasLogo: 'no',
        hasBrandColors: 'yes',
        preferredColors: 'Blue and purple',
        excludedColors: 'Neon green',
        brandingGuidelines: 'Clear headings, accessible contrast, and a simple layout.',
        designPreference: 'modern',
        inspirationWebsite1: 'https://example.com',
        inspirationDetails: 'Simple navigation and clear page hierarchy.',
        dislikedDesign: 'Avoid flashing animations and crowded layouts.',
        aiDesign: 'approval-required',
        hasOwnImages: 'no',
        stockImages: 'approval-required',
        aiImages: 'decline',
        hasWebsite: 'no',
        preferredDomain: 'maple-studio.example',
        domainStatus: 'register',
        websiteLanguages: 'en-fr',
        aiRestrictions: 'Obtain approval before using AI-generated text or design. No AI-generated images.',
        additionalRequirements: 'TEST REQUEST - fictional data. Please do not treat this as a real customer order.',
        bookingRequirements: '30-minute consultations and 60-minute workshops, two staff members, Monday to Friday from 9 to 5.',
        bookingTool: 'No existing booking platform.',
        bookingPayments: 'No online payments initially. Allow cancellation up to 24 hours before the appointment.',
        customRequirements: 'A searchable portfolio, a quote request form, and newsletter signup integration.',
        customBudget: 'CAD 2000 to 3000'
    };

    window.fillScriptFuseBrief = async function ({ overwrite = false, images = false } = {}) {
        const form = document.getElementById('quickScriptForm');
        if (!form || form.hidden) {
            throw new Error('Open a valid package brief. If reviewing, click Edit first.');
        }
        const dispatch = control => {
            control.dispatchEvent(new Event('input', { bubbles: true }));
            control.dispatchEvent(new Event('change', { bubbles: true }));
        };
        for (const [name, value] of Object.entries(values)) {
            const controls = Array.from(form.elements).filter(control => control.name === name && !control.disabled);
            if (!controls.length) continue;
            if (Array.isArray(value)) {
                // Preserve the whole existing checkbox group unless replacing explicitly.
                if (!overwrite && controls.some(control => control.checked)) continue;
                for (const control of controls) {
                    control.checked = value.includes(control.value);
                    dispatch(control);
                }
            } else {
                const control = controls[0];
                if (!overwrite && control.value) continue;
                control.value = value;
                dispatch(control);
            }
        }
        const date = form.elements.namedItem('targetLaunchDate');
        if (date && !date.disabled && (overwrite || !date.value)) {
            const future = new Date();
            future.setDate(future.getDate() + 60);
            date.value = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
            dispatch(date);
        }
        if (images) {
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 180;
            const context = canvas.getContext('2d');
            context.fillStyle = '#674b9b';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#ffffff';
            context.font = '24px sans-serif';
            context.fillText('ScriptFuse TEST', 50, 100);
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error('Could not generate the test image.');
            for (const [name, filename, flag] of [['logoFile', 'test-logo.png', 'hasLogo'], ['galleryFiles', 'test-gallery.png', 'hasOwnImages']]) {
                const control = form.elements.namedItem(name);
                if (!control || control.disabled || (!overwrite && control.files.length)) continue;
                const transfer = new DataTransfer();
                transfer.items.add(new File([blob], filename, { type: 'image/png' }));
                control.files = transfer.files;
                dispatch(control);
                form.elements.namedItem(flag).value = 'yes';
                dispatch(form.elements.namedItem(flag));
            }
        }
        const invalid = Array.from(form.elements).filter(control => control.willValidate && !control.validity.valid);
        if (invalid.length) {
            console.warn('Fields still requiring attention:', invalid.map(control => control.name));
            form.reportValidity();
        } else {
            console.info('Test brief filled. Review the values, then submit manually when ready.');
        }
        return { valid: invalid.length === 0, invalidFields: invalid.map(control => control.name) };
    };
    window.fillScriptFuseBrief().catch(console.error);
})();
