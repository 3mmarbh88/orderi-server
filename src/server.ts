import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const app = express();

const PORT = Number(process.env.PORT || 10000);
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("[Orderi] Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

function hash(value: string): string {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

function generateActivationCode(): string {
  const part = () =>
    crypto.randomBytes(3).toString("hex").toUpperCase();

  return `ORD-${part()}-${part()}`;
}

function normalizeUsername(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization || "";

  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.substring(7).trim() || null;
}

async function getUserFromRequest(req: Request) {
  const token = getBearerToken(req);

  if (!token) {
    return null;
  }

  const tokenHash = hash(token);

  const { data, error } = await supabase
    .from("auth_sessions")
    .select(`
      id,
      user_id,
      expires_at,
      app_users (
        id,
        username,
        phone,
        is_active
      )
    `)
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data || !data.app_users) {
    return null;
  }

  const user = Array.isArray(data.app_users)
    ? data.app_users[0]
    : data.app_users;

  if (!user || !user.is_active) {
    return null;
  }

  await supabase
    .from("auth_sessions")
    .update({
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  return {
    sessionId: data.id,
    user,
  };
}

function requireAuth(
  handler: (req: Request, res: Response) => Promise<any>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = await getUserFromRequest(req);

      if (!auth) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      (req as any).auth = auth;

      await handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}

/* =========================
   ROOT
========================= */

app.get("/", (_req, res) => {
  res.json({
    service: "Orderi License Server",
    status: "online",
    database: "/api/health",
    version: "1.0.0",
  });
});

/* =========================
   HEALTH
========================= */

app.get("/api/health", async (_req, res) => {
  try {
    const { error } = await supabase
      .from("app_users")
      .select("id", { count: "exact", head: true });

    if (error) {
      return res.status(503).json({
        status: "error",
        service: "orderi-server",
        database: false,
        error: error.message,
      });
    }

    res.json({
      status: "ok",
      service: "orderi-server",
      timestamp: new Date().toISOString(),
      database: true,
      liveConnections: 0,
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      service: "orderi-server",
      database: false,
    });
  }
});

/* =========================
   REGISTER
========================= */

app.post("/api/auth/register", async (req, res) => {
  try {
    const username = normalizeUsername(req.body?.username);
    const password = String(req.body?.password || "");
    const phone = String(req.body?.phone || "").trim();

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required",
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        error: "Username must be at least 3 characters",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    const { data: existing } = await supabase
      .from("app_users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Username already exists",
      });
    }

    const { data: user, error } = await supabase
      .from("app_users")
      .insert({
        username,
        password_hash: hash(password),
        phone: phone || null,
      })
      .select("id, username, phone, is_active, created_at")
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user,
    });
  } catch (error) {
    console.error("[Register]", error);

    res.status(500).json({
      success: false,
      error: "Registration failed",
    });
  }
});

/* =========================
   LOGIN
========================= */

app.post("/api/auth/login", async (req, res) => {
  try {
    const username = normalizeUsername(req.body?.username);
    const password = String(req.body?.password || "");

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required",
      });
    }

    const { data: user, error } = await supabase
      .from("app_users")
      .select("id, username, phone, is_active, password_hash")
      .eq("username", username)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password",
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: "Account disabled",
      });
    }

    if (hash(password) !== user.password_hash) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password",
      });
    }

    const token = generateToken();
    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );

    const { error: sessionError } = await supabase
      .from("auth_sessions")
      .insert({
        user_id: user.id,
        token_hash: hash(token),
        expires_at: expiresAt.toISOString(),
        last_seen_at: new Date().toISOString(),
      });

    if (sessionError) {
      return res.status(500).json({
        success: false,
        error: sessionError.message,
      });
    }

    delete (user as any).password_hash;

    res.json({
      success: true,
      token,
      expires_at: expiresAt.toISOString(),
      user,
    });
  } catch (error) {
    console.error("[Login]", error);

    res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
});

/* =========================
   ME
========================= */

app.get(
  "/api/auth/me",
  requireAuth(async (req, res) => {
    const auth = (req as any).auth;

    res.json({
      success: true,
      user: auth.user,
    });
  })
);

/* =========================
   ACTIVATE
========================= */

app.post(
  "/api/auth/activate",
  requireAuth(async (req, res) => {
    const auth = (req as any).auth;
    const code = String(req.body?.code || "").trim().toUpperCase();

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Activation code is required",
      });
    }

    const { data: activation, error } = await supabase
      .from("activation_codes")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    if (!activation) {
      return res.status(404).json({
        success: false,
        error: "Invalid activation code",
      });
    }

    if (activation.is_used) {
      return res.status(409).json({
        success: false,
        error: "Activation code already used",
      });
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() +
      Number(activation.duration_days || 30) *
      24 *
      60 *
      60 *
      1000
    );

    const { error: codeError } = await supabase
      .from("activation_codes")
      .update({
        is_used: true,
        used_by: auth.user.id,
        used_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", activation.id)
      .eq("is_used", false);

    if (codeError) {
      return res.status(500).json({
        success: false,
        error: codeError.message,
      });
    }

    const { data: subscription, error: subscriptionError } =
      await supabase
        .from("user_subscriptions")
        .upsert(
          {
            user_id: auth.user.id,
            activation_code_id: activation.id,
            starts_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            is_active: true,
            updated_at: now.toISOString(),
          },
          {
            onConflict: "user_id",
          }
        )
        .select("*")
        .single();

    if (subscriptionError) {
      return res.status(500).json({
        success: false,
        error: subscriptionError.message,
      });
    }

    res.json({
      success: true,
      message: "Activation successful",
      subscription,
    });
  })
);

/* =========================
   SUBSCRIPTION
========================= */

app.get(
  "/api/auth/subscription",
  requireAuth(async (req, res) => {
    const auth = (req as any).auth;

    const { data: subscription, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    if (!subscription) {
      return res.json({
        success: true,
        active: false,
        subscription: null,
      });
    }

    const active =
      Boolean(subscription.is_active) &&
      new Date(subscription.expires_at).getTime() > Date.now();

    if (!active && subscription.is_active) {
      await supabase
        .from("user_subscriptions")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);
    }

    res.json({
      success: true,
      active,
      subscription: {
        ...subscription,
        is_active: active,
      },
    });
  })
);

/* =========================
   LOGOUT
========================= */

app.post(
  "/api/auth/logout",
  requireAuth(async (req, res) => {
    const auth = (req as any).auth;

    await supabase
      .from("auth_sessions")
      .delete()
      .eq("id", auth.sessionId);

    res.json({
      success: true,
      message: "Logged out",
    });
  })
);

/* =========================
   ADMIN AUTH
========================= */

function requireAdmin(
  handler: (req: Request, res: Response) => Promise<any>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = String(req.headers["x-admin-token"] || "");

      if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
        return res.status(401).json({
          success: false,
          error: "Invalid admin token",
        });
      }

      await handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}

/* =========================
   CREATE ACTIVATION CODE
========================= */

app.post(
  "/api/admin/activation-codes",
  requireAdmin(async (req, res) => {
    const durationDays = Math.max(
      1,
      Number(req.body?.duration_days || 30)
    );

    let code = "";

    for (let i = 0; i < 5; i++) {
      const candidate = generateActivationCode();

      const { data: existing } = await supabase
        .from("activation_codes")
        .select("id")
        .eq("code", candidate)
        .maybeSingle();

      if (!existing) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      return res.status(500).json({
        success: false,
        error: "Could not generate unique code",
      });
    }

    const { data, error } = await supabase
      .from("activation_codes")
      .insert({
        code,
        duration_days: durationDays,
      })
      .select("*")
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    res.status(201).json({
      success: true,
      activation_code: data,
    });
  })
);

/* =========================
   LIST ACTIVATION CODES
========================= */

app.get(
  "/api/admin/activation-codes",
  requireAdmin(async (_req, res) => {
    const { data, error } = await supabase
      .from("activation_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      activation_codes: data,
    });
  })
);

/* =========================
   ERROR HANDLER
========================= */

app.use(
  (
    error: any,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error("[Server Error]", error);

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
);

/* =========================
   START
========================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Orderi] License Server listening on 0.0.0.0:${PORT}`);
  console.log("[Orderi] Supabase: configured");
  console.log("[Orderi] Authentication + Activation server ready.");
});
