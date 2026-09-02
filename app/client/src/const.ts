export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Send the visitor to the login page. Supabase Auth handles the actual
// sign-in there (see pages/Login.tsx); on success the callback page exchanges
// the Supabase access token for DropWatch's own session cookie.
export const startLogin = () => {
  if (window.location.pathname === "/login" || window.location.pathname === "/auth/callback") return;
  window.location.href = "/login";
};
