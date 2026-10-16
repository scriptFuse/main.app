const closedStatuses = new Set(["completed", "declined", "cancelled", "archived"]);

export function filterOrders(orders, view, team) {
    return orders.filter(item => {
        const status = item.data().status;
        if (view === "new") return status === "submitted";
        if (view === "past") return closedStatuses.has(status);
        if (view === "requested") return status === "awaiting-info";
        return team || !closedStatuses.has(status);
    });
}
