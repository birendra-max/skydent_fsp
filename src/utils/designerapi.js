import { logoutUser } from "./designerauth";

let isLoggingOut = false;

export async function fetchWithAuth(endpoint, options = {}, timeout = 15000) {
    let token = localStorage.getItem("skydent_designer_token");
    let base_url = localStorage.getItem("skydent_designer_base_url");

    if (!token || token === "null" || token === "undefined" || token.trim() === "") {
        token = null;
    }

    if (!base_url || base_url === "null" || base_url === "undefined" || base_url.trim() === "") {
        throw new Error("Base URL missing");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "X-Tenant": "skydent",
        ...options.headers,
    };

    try {
        const response = await fetch(base_url + endpoint, {
            ...options,
            headers,
            signal: controller.signal,
        });

        if (response.status === 401 || response.status === 403) {
            if (!isLoggingOut) {
                isLoggingOut = true;
                alert("Session expired. Please log in again.");
                logoutUser();
            }
            return null;
        }

        return await response.json();
    } catch (err) {
        if (err.name === "AbortError") {
            console.warn("Request timed out:", endpoint);
            return null;
        }

        console.error("API error:", err);
        return null;
    } finally {
        clearTimeout(timer);
    }
}
