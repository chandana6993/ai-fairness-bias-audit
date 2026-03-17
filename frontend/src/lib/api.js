const BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === "localhost" ? "http://localhost:8000" : "");

// ─── Token helpers ───────────────────────────
export const getToken = () => localStorage.getItem("token");
export const setToken = (t) => localStorage.setItem("token", t);
export const removeToken = () => localStorage.removeItem("token");
export const getUser = () => JSON.parse(localStorage.getItem("user") || "null");
export const setUser = (u) => localStorage.setItem("user", JSON.stringify(u));
export const removeUser = () => localStorage.removeItem("user");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

// ─── Auth ─────────────────────────────────────
export async function register(name, email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse(res);
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function getMe() {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ─── Audit ────────────────────────────────────
export async function uploadDataset(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve({});
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.detail || "Upload failed"));
        } catch {
          reject(new Error("Upload failed"));
        }
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));

    xhr.open("POST", `${BASE_URL}/api/audit/upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${getToken()}`);
    xhr.send(formData);
  });
}

export async function getReports() {
  const res = await fetch(`${BASE_URL}/api/audit/reports`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getReport(id) {
  const res = await fetch(`${BASE_URL}/api/audit/reports/${id}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}
