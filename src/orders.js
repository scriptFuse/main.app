import { auth, db } from "./firebase.js";
import { translation } from "./translation.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { collection, doc, getDoc, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const language = () => document.documentElement.lang === "fr" ? "fr" : "en";
const text = (key) => translation[language()][key] || key;
function keyed(element, key) {
    element.dataset.key = key;
    element.textContent = text(key);
}
function status(element, key) {
    keyed(element, key);
    element.hidden = false;
}
const orderId = new URLSearchParams(location.search).get("order");
const validId = orderId && /^[^/]{1,1500}$/.test(orderId);
const orderUrl = (page, id) => `${page}.html?order=${encodeURIComponent(id)}`;
const orderName = (data) => data.preferredDomain || data.companyName || text("unnamedOrder");
let stopOrders;
let stopMessages;
let activeOrder;
let formTemplate;
let messageDocs = [];
let orderDocs = [];
let generation = 0;
let sending = false;
let messagesReady = false;
let teamRole = null;

function renderOrders() {
    const list = document.getElementById("ordersList");
    if (!list) return;
    list.replaceChildren();
    const current = teamRole
        ? orderDocs
        : orderDocs.filter((item) => !["completed", "cancelled", "archived"].includes(item.data().status));
    current.sort((a, b) => (b.data().createdAt?.toMillis() || 0) - (a.data().createdAt?.toMillis() || 0));
    const ordersStatus = document.getElementById("ordersStatus");
    ordersStatus.hidden = current.length > 0;
    if (!current.length) status(ordersStatus, teamRole ? "allOrdersEmpty" : "ordersEmpty");
    for (const item of current) {
        const order = item.data();
        const card = document.createElement("article");
        card.className = "order-card";
        const heading = document.createElement("h2");
        const link = document.createElement("a");
        link.href = orderUrl("orderDetails", item.id);
        link.textContent = orderName(order);
        heading.append(link);
        const messages = document.createElement("a");
        messages.href = orderUrl("orderMessages", item.id);
        keyed(messages, "orderMessages");
        card.append(heading, messages);
        if (teamRole) {
            if (order.userEmail) {
                const customer = document.createElement("p");
                customer.textContent = `${text("orderCustomer")}: ${order.userEmail}`;
                card.append(customer);
            }
            if (order.status) {
                const orderStatus = document.createElement("p");
                orderStatus.textContent = `${text("orderStatus")}: ${order.status}`;
                card.append(orderStatus);
            }
        }
        list.append(card);
    }
}

function renderDetails() {
    if (!activeOrder || !formTemplate) return;
    const details = document.getElementById("savedOrderDetails");
    details.replaceChildren();
    // Use the brief's own labels and option keys so old and new orders match confirmation.
    for (const [name, rawValue] of Object.entries(activeOrder)) {
        const controls = Array.from(formTemplate.elements).filter((control) => control.name === name);
        const control = controls[0];
        if (!control || control.type === "file" || rawValue == null) continue;
        const values = Array.isArray(rawValue) ? rawValue : [rawValue];
        if (!values.some((value) => String(value).trim() && String(value).toLowerCase() !== "n/a")) continue;
        const label = control.type === "checkbox"
            ? control.closest("fieldset")?.querySelector("legend") : control.labels?.[0];
        const term = document.createElement("dt");
        term.textContent = label?.dataset.key ? text(label.dataset.key) : label?.textContent || name;
        const description = document.createElement("dd");
        description.textContent = values.map((value) => {
            let choice;
            if (control.tagName === "SELECT") choice = Array.from(control.options).find((option) => option.value === value);
            if (control.type === "checkbox") {
                const selected = controls.find((input) => input.value === value);
                choice = selected?.labels?.[0]?.querySelector("[data-key]") || selected?.labels?.[0];
            }
            return choice?.dataset.key ? text(choice.dataset.key) : choice?.textContent || String(value);
        }).join(", ");
        details.append(term, description);
    }
}

function renderMessages() {
    const thread = document.getElementById("messageThread");
    if (!thread) return;
    thread.replaceChildren();
    document.getElementById("messagesStatus").hidden = messageDocs.length > 0;
    if (!messageDocs.length) status(document.getElementById("messagesStatus"), "messagesEmpty");
    for (const item of messageDocs) {
        const message = item.data();
        const team = ["admin", "developer"].includes(message.senderRole);
        const box = document.createElement("article");
        box.className = team ? "message message-team" : "message";
        const sender = document.createElement("strong");
        keyed(sender, team ? "messageTeam" : "messageYou");
        const body = document.createElement("p");
        body.textContent = message.text;
        box.append(sender);
        const date = message.createdAt?.toDate();
        if (date) {
            const time = document.createElement("time");
            time.dateTime = date.toISOString();
            time.textContent = new Intl.DateTimeFormat(language(), { dateStyle: "medium", timeStyle: "short" }).format(date);
            box.append(time);
        }
        box.append(body);
        thread.append(box);
    }
}

onAuthStateChanged(auth, async (user) => {
    const version = ++generation;
    stopOrders?.();
    stopMessages?.();
    activeOrder = null;
    messagesReady = false;
    teamRole = null;
    if (!user) {
        location.replace("login.html");
        return;
    }
    let claims;
    try {
        ({ claims } = await user.getIdTokenResult(true));
    } catch (error) {
        console.error("Could not verify the user's team role.", error);
        const ordersStatus = document.getElementById("ordersStatus");
        if (ordersStatus) status(ordersStatus, "ordersError");
        const orderStatus = document.getElementById("orderStatus");
        if (orderStatus) status(orderStatus, "orderUnavailable");
        return;
    }
    if (version !== generation) return;
    teamRole = claims.admin === true ? "admin" : claims.developer === true ? "developer" : null;
    if (document.getElementById("ordersList")) {
        if (teamRole) {
            keyed(document.querySelector("h1[data-key='currentOrders']"), "allOrders");
        }
        const projectsQuery = teamRole
            ? query(collection(db, "projects"))
            : query(collection(db, "projects"), where("userId", "==", user.uid));
        stopOrders = onSnapshot(projectsQuery, (snapshot) => {
            orderDocs = snapshot.docs;
            renderOrders();
        }, () => status(document.getElementById("ordersStatus"), "ordersError"));
        return;
    }
    const orderStatus = document.getElementById("orderStatus");
    document.getElementById("savedOrder").hidden = true;
    if (!validId) {
        status(orderStatus, "orderUnavailable");
        return;
    }
    try {
        const snapshot = await getDoc(doc(db, "projects", orderId));
        if (version !== generation) return;
        if (!snapshot.exists() || (snapshot.data().userId !== user.uid && !teamRole)) {
            status(orderStatus, "orderUnavailable");
            return;
        }
        activeOrder = snapshot.data();
        document.getElementById("orderName").textContent = orderName(activeOrder);
        if (document.getElementById("savedOrderDetails")) {
            const response = await fetch("quickScriptPackage.html");
            if (!response.ok) throw new Error("Could not load order labels.");
            const html = await response.text();
            if (version !== generation) return;
            formTemplate = new DOMParser().parseFromString(html, "text/html").getElementById("quickScriptForm");
            if (!formTemplate) throw new Error("Missing order labels.");
            renderDetails();
            document.getElementById("orderMessagesLink").href = orderUrl("orderMessages", orderId);
        } else {
            document.getElementById("orderDetailsLink").href = orderUrl("orderDetails", orderId);
            if (teamRole) {
                keyed(document.querySelector("#messageForm label[for='messageText']"), "adminMessageLabel");
            }
            stopMessages = onSnapshot(query(collection(db, "projects", orderId, "messages"), orderBy("createdAt", "asc")), (snapshot) => {
                messageDocs = snapshot.docs;
                renderMessages();
                messagesReady = true;
                document.getElementById("sendMessage").disabled = sending;
            }, () => {
                messagesReady = false;
                document.getElementById("sendMessage").disabled = true;
                status(document.getElementById("messagesStatus"), "messagesError");
            });
        }
        orderStatus.hidden = true;
        document.getElementById("savedOrder").hidden = false;
    } catch {
        if (version === generation) status(orderStatus, "orderUnavailable");
    }
});

document.getElementById("messageForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.getElementById("messageText");
    const message = input.value.trim();
    const user = auth.currentUser;
    if (sending || !messagesReady || !message || message.length > 5000 || !user || (!teamRole && activeOrder?.userId !== user.uid)) return;
    const button = document.getElementById("sendMessage");
    const sendStatus = document.getElementById("sendStatus");
    button.disabled = true;
    sending = true;
    sendStatus.hidden = true;
    try {
        await addDoc(collection(db, "projects", orderId, "messages"), {
            text: message,
            senderId: user.uid,
            senderRole: teamRole || "customer",
            createdAt: serverTimestamp()
        });
        input.value = "";
        status(sendStatus, "messageSent");
    } catch {
        status(sendStatus, "messageError");
    } finally {
        sending = false;
        button.disabled = !messagesReady;
    }
});

document.addEventListener("languagechange", () => {
    if (document.getElementById("ordersList")) {
        if (teamRole) keyed(document.querySelector("h1[data-key]"), "allOrders");
        renderOrders();
    }
    if (activeOrder) {
        document.getElementById("orderName").textContent = orderName(activeOrder);
        if (formTemplate) renderDetails();
        if (teamRole && document.getElementById("messageForm")) {
            keyed(document.querySelector("#messageForm label[for='messageText']"), "adminMessageLabel");
        }
        if (document.getElementById("messageThread") && messagesReady) renderMessages();
    }
});
window.addEventListener("pagehide", () => { stopOrders?.(); stopMessages?.(); });
