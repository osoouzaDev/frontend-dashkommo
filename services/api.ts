const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://backend-dashkommo.onrender.com";

export const api = {
  baseURL: API_URL,
};

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
};

export async function apiFetch(
  endpoint: string,
  options: ApiFetchOptions = {}
) {
  const { auth = true, headers, body, ...rest } = options;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const isFormData = body instanceof FormData;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    body,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (response.status === 401 || response.status === 403) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "/login";
    }

    throw new Error("Não autorizado");
  }

  const contentType = response.headers.get("content-type");

  const data =
    contentType && contentType.includes("application/json")
      ? await response.json()
      : await response.text();

  if (!response.ok) {
    throw new Error(
      typeof data === "object" && (data as any)?.message
        ? (data as any).message
        : "Erro na requisição"
    );
  }

  return data;
}