import { logoutUser } from "./designerauth";

let isLoggingOut = false; // 🔒 Prevent multiple logouts overlapping

export async function fetchWithAuth(endpoint, options = {}) {
    let token = localStorage.getItem("token");
    let base_url = localStorage.getItem('base_url');
    // 🛡️ Ensure token is valid before using it
    if (!token || token === "null" || token === "undefined" || token.trim() === "") {
        console.warn("Invalid token found in localStorage:", token);
        token = null;
    }

    if (!base_url || base_url === "null" || base_url === "undefined" || base_url.trim() === "") {
        console.warn("Invalid base Url not found in localStorage:", base_url);
        base_url = null;
    }

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Tenant': 'skydent',
        ...options.headers,
    };

    try {
        const response = await fetch(base_url + endpoint, {
            ...options,
            headers,
        });

        // Token expired or unauthorized
        if (response.status === 401 || response.status === 403) {
            if (!isLoggingOut) {
                isLoggingOut = true;
                alert("Session expired. Please log in again.");
                logoutUser();
            }
            return null;
        }

        // Safely parse JSON
        const data = await response.json().catch(() => null);

        if (
            data?.error &&
            (data.error === "Invalid or expired token" ||
                data.message === "Token expired")
        ) {
            if (!isLoggingOut) {
                isLoggingOut = true;
                alert("Invalid or expired token. Please log in again.");
                logoutUser();
            }
            return null;
        }

        return data;
    } catch (err) {
        console.error("API error:", err);
        if (!isLoggingOut) {
            isLoggingOut = true;
            logoutUser();
        }
        return null;
    } finally {
        // 🧹 Destroy headers after every request (important)
        for (let key in headers) {
            delete headers[key];
        }
    }
}
