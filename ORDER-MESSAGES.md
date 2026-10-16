Order messages setup
====================

Current orders reads the signed-in customer's `projects` documents. Website names
link to `orderDetails.html?order=PROJECT_ID`, which shows the submitted brief.
Messages link to `orderMessages.html?order=PROJECT_ID`.

Before using this feature against the live Firebase project, merge `firestore.rules`
with the project's existing rules and publish them in the Firebase console. This
repository previously had no rules or deployment configuration; no live rules have
been changed. Review existing rules before replacing them, since other services
may depend on them.

Each conversation is stored in `projects/PROJECT_ID/messages`. A message contains:

- `text`: string, 1–5000 characters
- `senderId`: authenticated sender's Firebase UID
- `senderRole`: `customer`, `admin`, or `developer`
- `createdAt`: Firestore server timestamp

Customer messages are written by the messages page. Admins and developers can
reply from the same page; replies appear live. Team access is recognized from
Firebase Authentication custom claims (`admin: true` or `developer: true`) or a
trusted `users/{uid}.role` value of `admin` or `developer`. Assign claims only
from a trusted Admin SDK environment, and never allow customers to write their
own team role.

Admins can see all projects in Current orders and all submitted requests in New
orders. Developers and customers do not have access to the New orders view.
Customers see only their own active projects. Completed, cancelled, and archived
projects are omitted from customers' Current orders. Submitted briefs remain
accessible by their saved link to the owning customer.

Manual verification with two test accounts after publishing rules:

1. Submit a brief and open its website link on confirmation.
2. As an admin, open New orders and verify requests from all customers appear.
3. Open Current orders; check the same website opens the same submitted details.
4. Open Messages, send a reply, reload, and confirm it remains.
5. Switch EN/FR on each page and check labels and selected brief choices.
6. As the second customer, try the first customer's order URL and message path:
   reads and writes must be denied. Customer writes with a team role must fail.

Firebase references:
https://firebase.google.com/docs/firestore/security/rules-query
https://firebase.google.com/docs/firestore/query-data/listen
https://firebase.google.com/docs/rules/basics


Order history and information requests
--------------------------------------

The dashboard now links to `pastOrders.html` and `requestedInfo.html`.
Past orders lists completed, declined, cancelled, and archived projects.
Requested info lists projects whose status is `awaiting-info`; these also remain
in the customer's Current orders. Both pages use the existing owner-scoped query
for customers and team access for admins/developers. No new rules or composite
indexes are required by these views.

To request information, a team member opens order details, changes the status to
Awaiting information, and sends the question through Messages. The customer opens
Requested info, follows Messages, and replies. The team reviews the reply and
updates the status to resume work. Sending a reply does not change status
automatically. Existing orders are not inferred to need information from their
message text.

Verification:
- Check both dashboard destinations with no orders and in English/French.
- Mark an order awaiting-info as a team member; confirm it appears live in the
  owner's Requested info and still appears in Current orders. Read/reply using
  Messages, then change the status to in-progress and confirm it leaves the list.
- Mark orders completed, declined, cancelled, or archived; confirm they appear in
  Past orders and disappear from the customer's Current orders. Check details
  and message links continue to open the same saved order.
- Verify another customer cannot see those orders, and signed-out visits redirect
  to login. Team headings must remain Past orders/Requested info on language changes.
- Simulate a read failure and switch language; the error must remain an error.

Run filtering checks with Node:
`node --test --test-isolation=none tests/orderFilters.test.mjs`


Package requests
----------------

All three package cards link to the shared brief page. The `package` query
parameter accepts `quickScript` (also the default without a parameter), `booking`,
or `custom`. Unknown package IDs show an error and a link to choose a package.
Booking asks for booking requirements, an existing platform, and payment or
cancellation requirements. Custom asks for required features/integrations and an
optional budget; the final quote follows review. Inactive package fields are
hidden and disabled so their values and validation do not affect another package.

The selected package is shown above the brief through review/confirmation, saved
in `projects.package`, and displayed in order details. All package-specific answers
reuse the shared review and saved-detail rendering, plus the existing image flow.

Publish the updated local `firestore.rules` package allowlist before accepting
booking/custom submissions in the live project. No deployed rules were changed.

Check each package card in EN/FR, fill its required fields, review, edit, confirm,
and reload order details to verify its package and answers. Check Quick Script
still submits without the booking/custom questions. Verify an unknown package URL
cannot submit, and the other customer's order access remains denied.

Run package/filter checks:
`node --test --test-isolation=none tests/packages.test.mjs tests/orderFilters.test.mjs`
