export type Provider = "google" | "yandex" | "github";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

type Listener = (user: AuthUser | null) => void;

let currentUser: AuthUser | null = null;
const listeners = new Set<Listener>();

function notify() {
  for (const cb of listeners) {
    try {
      cb(currentUser);
    } catch (e) {
      console.warn("auth listener failed", e);
    }
  }
}

function mapUser(data: any): AuthUser | null {
  if (!data) return null;
  // допускаем форматы {user: {...}} или просто {...}
  const u = data.user ?? data;
  if (!u) return null;
  return {
    id: String(u.id ?? u._id ?? ""),
    email: u.email ?? undefined,
    name: u.name ?? u.username ?? undefined,
    avatarUrl: u.avatarUrl ?? u.avatar ?? undefined,
  } as AuthUser;
}

export async function initAuth(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) {
      currentUser = null;
      notify();
      return null;
    }
    const payload = await res.json().catch(() => ({}));
    currentUser = mapUser(payload);
  } catch {
    currentUser = null;
  }
  notify();
  return currentUser;
}

export function getCurrentUser(): AuthUser | null {
  return currentUser;
}

export function isAuthenticated(): boolean {
  return !!currentUser?.id;
}

export function addAuthChangeListener(cb: Listener): () => void {
  listeners.add(cb);
  // немедленно вызвать с текущим состоянием
  try {
    cb(currentUser);
  } catch {}
  return () => listeners.delete(cb);
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } finally {
    currentUser = null;
    notify();
  }
}

export function loginWithProvider(provider: Provider) {
  // Редирект на OAuth-провайдера
  window.location.href = `/api/auth/${provider}`;
}

export async function loginWithEmail(email: string, password: string): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error("Login failed");
  }
  const payload = await res.json().catch(() => ({}));
  currentUser = mapUser(payload);
  notify();
  return currentUser;
}

export async function registerWithEmail(email: string, password: string): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error("Registration failed");
  }
  const payload = await res.json().catch(() => ({}));
  currentUser = mapUser(payload);
  notify();
  return currentUser;
}