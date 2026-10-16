# Brief image uploads

The brief uploads images to `briefs/USER_UID/ORDER_ID/IMAGE_UUID` before saving
its Firestore project. Project `attachments` store the name, field (`logoFile`
or `galleryFiles`), Storage path, byte size, and MIME type. No public download
URLs are stored. Order details downloads files using the signed-in user's access.

## Firebase setup before live use

1. Enable Cloud Storage for `scriptfuse-81798` and verify the bucket configured
   in `src/firebase.js` exists.
2. Merge `storage.rules` with any existing bucket rules and publish them in the
   Firebase console. Enable the requested cross-service permission for Storage
   rules to read Firestore. Team roles follow the same claims/user documents as
   the existing order rules. No live rules were changed by this implementation.
3. Configure bucket CORS to allow GET requests from the actual website origin
   (and your local development origin when testing). Authenticated browser
   downloads via `getBlob` require CORS; see Firebase's download guide:
   https://firebase.google.com/docs/storage/web/download-files#cors_configuration
4. Keep the existing project-create Firestore rules deployed. The browser writes
   the full brief and attachment references together after all uploads complete.

## Verify with customer and team test accounts

- Submit without images; confirm the order still saves.
- Submit one logo and multiple gallery images; check filenames in review,
  progress during upload, and downloads from order details after reloading.
- Reject empty files, unsupported types, files above 10 MiB, more than one logo,
  or more than 20 gallery images, including files dropped onto the input.
- Interrupt an upload, reconnect, and retry: completed uploads are reused.
  Confirm/Edit are disabled during submission; retries keep the same order ID.
- Check EN/FR labels and errors.
- Confirm another customer cannot read the images, and an admin/developer can.
- Confirm submitted images cannot be overwritten by the customer.

Uploads and Firestore writes cannot be atomic. Failed/abandoned submissions can
leave unreferenced files (including when the tab is closed or the brief is edited
after a failed attempt). A scheduled server cleanup should remove old Storage
order folders only when their corresponding project does not exist; do not use a
blanket age-based bucket deletion policy, which would also remove submitted files.

The size/type rules validate metadata, not file contents. Downloads are served as
files rather than embedding customer uploads in the page.
