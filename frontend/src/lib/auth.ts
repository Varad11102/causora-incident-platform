export type Account = {
  id: string;
  email: string;
  displayName: string;
  role: "VIEWER" | "OPERATOR" | "ADMIN";
  createdAt: string;
  lastLoginAt: string | null;
};

type CsrfToken = {
  token: string;
  headerName: string;
  parameterName: string;
};

export async function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(path, { ...init, credentials: "include" });
}

export async function csrfFetch(path: string, init: RequestInit = {}) {
  const csrfResponse = await apiFetch("/api/v1/auth/csrf", { cache: "no-store" });
  if (!csrfResponse.ok) throw new Error("Could not initialize a secure request.");
  const csrf = await csrfResponse.json() as CsrfToken;
  const headers = new Headers(init.headers);
  headers.set(csrf.headerName, csrf.token);
  return apiFetch(path, { ...init, headers });
}

export async function readApiError(response: Response, fallback: string) {
  try {
    const body = await response.json() as { detail?: string; message?: string; error?: string };
    return body.detail ?? body.message ?? (body.error === "authentication_required" ? "Please sign in to continue." : undefined) ?? fallback;
  } catch {
    return fallback;
  }
}

export function accountInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "CU";
}
