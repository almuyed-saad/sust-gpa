import crypto from "crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, withRetry } from "@workspace/db";
import {
  clearSession,
  getSessionId,
  createSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function getCallbackUrl(req: Request): string {
  if (process.env.APP_URL) {
    return `${process.env.APP_URL}/api/auth/google/callback`;
  }
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}/api/auth/google/callback`;
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function getSafeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

async function upsertUser(profile: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  picture: string | null;
}) {
  const [user] = await db
    .insert(usersTable)
    .values({
      id: `google:${profile.id}`,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      profileImageUrl: profile.picture,
    })
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        profileImageUrl: profile.picture,
        updatedAt: new Date(),
      },
    })
    .returning();
  return user;
}

// Get current logged-in user
router.get("/auth/user", (req: Request, res: Response) => {
  res.json({ user: req.isAuthenticated() ? req.user : null });
});

// Start Google OAuth flow
router.get("/auth/google", (req: Request, res: Response) => {
  const state = crypto.randomBytes(16).toString("hex");
  const returnTo = getSafeReturnTo(req.query.returnTo);

  res.cookie("oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 10 * 60 * 1000 });
  res.cookie("return_to", returnTo, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 10 * 60 * 1000 });

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: getCallbackUrl(req),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  res.redirect(`${GOOGLE_AUTH_URL}?${params}`);
});

// Handle Google OAuth callback
router.get("/auth/google/callback", async (req: Request, res: Response) => {
  const { code, state, error } = req.query;
  const expectedState = req.cookies?.oauth_state;
  const returnTo = getSafeReturnTo(req.cookies?.return_to);

  res.clearCookie("oauth_state", { path: "/" });
  res.clearCookie("return_to", { path: "/" });

  if (error) {
    console.error("Google OAuth error param:", error);
    res.redirect(`/?error=auth_failed&reason=${encodeURIComponent(String(error))}`);
    return;
  }
  if (!code || !state) {
    console.error("Missing code or state. code:", !!code, "state:", !!state);
    res.redirect("/?error=auth_failed&reason=missing_params");
    return;
  }
  if (state !== expectedState) {
    console.error("State mismatch. expected:", expectedState, "got:", state);
    res.redirect("/?error=auth_failed&reason=state_mismatch");
    return;
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: getCallbackUrl(req),
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json() as { access_token: string; error?: string };
    if (!tokenRes.ok || tokens.error) {
      console.error("Token exchange failed:", tokens.error, "status:", tokenRes.status);
      res.redirect(`/?error=auth_failed&reason=token_exchange_${tokens.error || tokenRes.status}`);
      return;
    }

    // Get user info from Google
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await userRes.json() as {
      sub: string;
      email: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
    };

    if (!profile.sub) {
      console.error("No profile.sub in Google response:", profile);
      res.redirect("/?error=auth_failed&reason=no_profile");
      return;
    }

    const dbUser = await withRetry(() => upsertUser({
      id: profile.sub,
      email: profile.email,
      firstName: profile.given_name || null,
      lastName: profile.family_name || null,
      picture: profile.picture || null,
    }));

    const sessionData: SessionData = {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        profileImageUrl: dbUser.profileImageUrl,
      },
    };

    const sid = await withRetry(() => createSession(sessionData));
    setSessionCookie(res, sid);
    res.redirect(returnTo);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    const reason = encodeURIComponent(msg.slice(0, 300));
    res.redirect(`/?error=auth_failed&reason=${reason}`);
  }
});

// Logout
router.get("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.redirect("/");
});

// Legacy redirect support
router.get("/login", (_req: Request, res: Response) => {
  res.redirect("/api/auth/google");
});

router.get("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.redirect("/");
});

export default router;
