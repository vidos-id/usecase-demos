const STORAGE_KEY = "ticket-agent-bookings";

export function addBookingId(id: string): void {
	const ids = getBookingIds();
	if (!ids.includes(id)) {
		ids.unshift(id);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, 20)));
	}
}

export function getBookingIds(): string[] {
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
	} catch {
		return [];
	}
}
