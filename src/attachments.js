import { getStorage, ref, uploadBytesResumable, getBlob } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function selectedImages(form) {
    const images = [];
    for (const [field, maximum] of [["logoFile", 1], ["galleryFiles", 20]]) {
        const files = Array.from(form.elements.namedItem(field).files);
        if (files.length > maximum) throw new Error("attachmentLimits");
        for (const file of files) {
            if (!imageTypes.has(file.type) || file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
                throw new Error("attachmentLimits");
            }
            images.push({ field, file, id: crypto.randomUUID() });
        }
    }
    return images;
}

export async function uploadImages(app, uid, orderId, images, progress) {
    const storage = getStorage(app);
    const total = images.reduce((sum, image) => sum + image.file.size, 0);
    let completed = 0;
    const attachments = [];
    for (const image of images) {
        const path = `briefs/${uid}/${orderId}/${image.id}`;
        // Keep successful uploads when retrying a failed submission.
        if (image.uploadedPath !== path) {
            const task = uploadBytesResumable(ref(storage, path), image.file, { contentType: image.file.type });
            await new Promise((resolve, reject) => {
                task.on("state_changed", snapshot => {
                    progress(Math.floor(100 * (completed + snapshot.bytesTransferred) / total));
                }, reject, resolve);
            });
            image.uploadedPath = path;
        }
        completed += image.file.size;
        progress(Math.floor(100 * completed / total));
        attachments.push({ field: image.field, name: image.file.name, path, size: image.file.size, contentType: image.file.type });
    }
    return attachments;
}

export async function downloadImage(app, attachment, uid, orderId) {
    const prefix = `briefs/${uid}/${orderId}/`;
    if (typeof attachment.path !== "string" || !attachment.path.startsWith(prefix)
        || !/^[a-f0-9-]{36}$/.test(attachment.path.slice(prefix.length))) {
        throw new Error("Invalid attachment path");
    }
    const blob = await getBlob(ref(getStorage(app), attachment.path), MAX_IMAGE_BYTES);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}
