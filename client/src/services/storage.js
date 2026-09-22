// API service connecting frontend to Express server & MongoDB database

// Helper to get HTTP headers including JWT auth token
const getAuthHeaders = () => {
  const jwt = localStorage.getItem("jwt");
  return {
    "Content-Type": "application/json",
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
  };
};

export const storage = {
  // --- AUTHENTICATION ---
  register: async (name, email, password) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    return data;
  },

  login: async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    // Store JWT token for subsequent backend API calls
    if (data.jwt) {
      localStorage.setItem("jwt", data.jwt);
    }
    if (data.user) {
      localStorage.setItem("token_sys_session", JSON.stringify(data.user));
    }
    return data;
  },

  getCurrentUser: () => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) return null;
    try {
      return JSON.parse(localStorage.getItem("token_sys_session")) || { jwt };
    } catch (e) {
      return { jwt };
    }
  },

  logout: () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("token_sys_session");
  },

  // --- EVENTS ---
  getEvents: async () => {
    const res = await fetch("/api/events", {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch events");
    return data;
  },

  getEvent: async (id) => {
    const res = await fetch(`/api/events/${id}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch event");
    return data;
  },

  getPublicEvent: async (id, titleFallback = "") => {
    try {
      const res = await fetch(`/api/public/events/${id}`);
      const data = await res.json();
      if (!res.ok) return { title: titleFallback || "Queue Event", _id: id };
      return data;
    } catch (e) {
      return { title: titleFallback || "Queue Event", _id: id };
    }
  },

  createEvent: async (eventPayload) => {
    const body = typeof eventPayload === "string" ? { title: eventPayload } : eventPayload;
    const res = await fetch("/api/events", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create event");
    return data;
  },

  updateEvent: async (id, eventPayload) => {
    const body = typeof eventPayload === "string" ? { title: eventPayload } : eventPayload;
    const res = await fetch(`/api/events/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update event");
    return data;
  },

  deleteEvent: async (id) => {
    const res = await fetch(`/api/events/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete event");
    return data;
  },

  // --- TOKENS (Stored permanently in MongoDB) ---
  getTokens: async (eventId) => {
    const res = await fetch(`/api/tokens?eventId=${eventId}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch tokens");
    return data;
  },

  joinEvent: async (eventId, attendeeName) => {
    const res = await fetch(`/api/public/events/${eventId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: attendeeName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to request token");
    return data;
  },

  updateTokenStatus: async (tokenId, status) => {
    const res = await fetch(`/api/tokens/${tokenId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update token status");
    return data;
  },

  markTokenDone: async (tokenId) => {
    return storage.updateTokenStatus(tokenId, "completed");
  },
};
