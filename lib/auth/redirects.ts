/** Only same-application paths; protocol-relative, backslash and encoded bypasses fail closed. */
export function safeNext(value: unknown, fallback = "/account"): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\x00-\x1f]/.test(value)
  )
    return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || decoded.includes("\\") || /[\x00-\x1f]/.test(decoded))
      return fallback;
    const url = new URL(value, "https://up17.invalid");
    const allowedAuthPaths = new Set(["/auth/update-password", "/auth/verify-email"]);
    if (
      url.origin !== "https://up17.invalid" ||
      (url.pathname.startsWith("/auth/") && !allowedAuthPaths.has(url.pathname)) ||
      url.pathname.startsWith("/api/")
    )
      return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function sameOrigin(request: Request): boolean {
  const raw = request.headers.get("origin");
  if (!raw) return false;
  try {
    const origin = new URL(raw);
    const host = request.headers.get("host");
    const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const protocol =
      forwarded === "https" || forwarded === "http"
        ? `${forwarded}:`
        : new URL(request.url).protocol;
    return Boolean(
      host &&
      origin.host === host &&
      origin.protocol === protocol &&
      (protocol === "https:" || protocol === "http:") &&
      !origin.username &&
      !origin.password &&
      origin.pathname === "/" &&
      !origin.search &&
      !origin.hash,
    );
  } catch {
    return false;
  }
}
