import crypto from "crypto";
import { Express, Request, Response } from "express";
import { SupabaseClient } from "@supabase/supabase-js";

/* =========================================================
   TYPES
========================================================= */

type AdminAccount = {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AuthenticatedAdmin = {
  admin: AdminAccount;
  token: string;
};

/* =========================================================
   HELPERS
========================================================= */

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");

  const derivedKey = crypto.scryptSync(
    password,
    salt,
    64
  );

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

function verifyPassword(
  password: string,
  storedHash: string
): boolean {
  try {
    const parts = String(storedHash || "").split(":");

    if (
      parts.length !== 3 ||
      parts[0] !== "scrypt"
    ) {
      return false;
    }

    const salt = parts[1];
    const storedKey = Buffer.from(
      parts[2],
      "hex"
    );

    const derivedKey = crypto.scryptSync(
      password,
      salt,
      storedKey.length
    );

    if (
      storedKey.length !==
      derivedKey.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      storedKey,
      derivedKey
    );
  } catch {
    return false;
  }
}

function normalizeUsername(
  value: unknown
): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getBearerToken(
  req: Request
): string {
  const header =
    req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header
    .substring(7)
    .trim();
}

function getClientIp(
  req: Request
): string {
  const forwarded =
    req.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return forwarded
      .split(",")[0]
      .trim();
  }

  return (
    req.socket.remoteAddress ||
    ""
  );
}

/* =========================================================
   LOGGING
========================================================= */

async function writeLog(
  db: SupabaseClient,
  eventType: string,
  username: string | null,
  userId: string | null,
  message: string,
  level: string,
  req?: Request
) {
  try {
    await db
      .from("system_logs")
      .insert({
        event_type: eventType,
        username,
        user_id: userId,
        message,
        level,
        ip_address: req
          ? getClientIp(req)
          : null,
        user_agent: req
          ? String(
              req.headers["user-agent"] ||
                ""
            )
          : null,
      });
  } catch (error) {
    console.error(
      "[Orderi] log error:",
      error
    );
  }
}

async function createAlert(
  db: SupabaseClient,
  type: string,
  title: string,
  message: string,
  username: string | null = null,
  userId: string | null = null
) {
  try {
    await db
      .from("system_alerts")
      .insert({
        type,
        title,
        message,
        username,
        user_id: userId,
        is_read: false,
      });
  } catch (error) {
    console.error(
      "[Orderi] alert error:",
      error
    );
  }
}

/* =========================================================
   ADMIN AUTH
========================================================= */

async function getAuthenticatedAdmin(
  req: Request,
  db: SupabaseClient
): Promise<AuthenticatedAdmin | null> {
  const token = getBearerToken(req);

  if (!token) {
    return null;
  }

  const {
    data: session,
    error: sessionError,
  } = await db
    .from("admin_sessions")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (
    sessionError ||
    !session
  ) {
    return null;
  }

  if (
    !session.expires_at ||
    new Date(
      session.expires_at
    ).getTime() <= Date.now()
  ) {
    await db
      .from("admin_sessions")
      .delete()
      .eq("token", token);

    return null;
  }

  const {
    data: admin,
    error: adminError,
  } = await db
    .from("admin_accounts")
    .select("*")
    .eq("id", session.admin_id)
    .maybeSingle();

  if (
    adminError ||
    !admin ||
    admin.is_active === false
  ) {
    await db
      .from("admin_sessions")
      .delete()
      .eq("token", token);

    return null;
  }

  return {
    admin,
    token,
  };
}

function requireAdmin(
  db: SupabaseClient,
  handler: (
  req: Request,
  res: Response,
  auth: AuthenticatedAdmin
) => Promise<any>
) {
  return async (
    req: Request,
    res: Response
  ) => {
    try {
      const auth =
        await getAuthenticatedAdmin(
          req,
          db
        );

      if (!auth) {
        return res.status(401).json({
          success: false,
          error:
            "غير مصرح. يرجى تسجيل دخول المسؤول.",
        });
      }

      await handler(
        req,
        res,
        auth
      );
    } catch (error: any) {
      console.error(
        "[Orderi] Admin API error:",
        error
      );

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error:
            error?.message ||
            "Internal server error.",
        });
      }
    }
  };
}

/* =========================================================
   ADMIN ROUTES
========================================================= */

export function registerAdminRoutes(
  app: Express,
  db: SupabaseClient | null
) {
  if (!db) {
    console.warn(
      "[Orderi] Admin routes disabled: Supabase is not configured."
    );

    return;
  }

  /* =======================================================
     ADMIN LOGIN
  ======================================================= */

  app.post(
    "/api/admin/login",
    async (
      req: Request,
      res: Response
    ) => {
      try {
        const username =
          normalizeUsername(
            req.body?.username
          );

        const password =
          String(
            req.body?.password || ""
          );

        if (
          !username ||
          !password
        ) {
          return res.status(400).json({
            success: false,
            error:
              "اسم المستخدم وكلمة المرور مطلوبان.",
          });
        }

        const {
          data: admin,
          error,
        } = await db
          .from("admin_accounts")
          .select("*")
          .eq("username", username)
          .maybeSingle();

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        if (
          !admin ||
          admin.is_active === false
        ) {
          await writeLog(
            db,
            "ADMIN_LOGIN_FAILED",
            username,
            null,
            "محاولة دخول Admin غير ناجحة",
            "warning",
            req
          );

          return res.status(401).json({
            success: false,
            error:
              "بيانات الدخول غير صحيحة.",
          });
        }

        if (
          !verifyPassword(
            password,
            admin.password_hash
          )
        ) {
          await writeLog(
            db,
            "ADMIN_LOGIN_FAILED",
            username,
            null,
            "كلمة مرور Admin غير صحيحة",
            "warning",
            req
          );

          return res.status(401).json({
            success: false,
            error:
              "بيانات الدخول غير صحيحة.",
          });
        }

        const token =
          generateToken();

        const expiresAt =
          new Date(
            Date.now() +
              30 *
                24 *
                60 *
                60 *
                1000
          ).toISOString();

        const {
          error: sessionError,
        } = await db
          .from("admin_sessions")
          .insert({
            token,
            admin_id:
              admin.id,
            expires_at:
              expiresAt,
          });

        if (sessionError) {
          return res.status(500).json({
            success: false,
            error:
              sessionError.message,
          });
        }

        await writeLog(
          db,
          "ADMIN_LOGIN",
          admin.username,
          null,
          "تم تسجيل دخول مسؤول النظام",
          "success",
          req
        );

        return res.json({
          success: true,
          token,
          expires_at:
            expiresAt,
          admin: {
            id: admin.id,
            username:
              admin.username,
            name: admin.name,
            role: admin.role,
          },
        });
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          error:
            error?.message ||
            "Admin login error.",
        });
      }
    }
  );

  /* =======================================================
     ADMIN LOGOUT
  ======================================================= */

  app.post(
    "/api/admin/logout",
    requireAdmin(
      db,
      async (
        req,
        res,
        auth
      ) => {
        await db
          .from("admin_sessions")
          .delete()
          .eq(
            "token",
            auth.token
          );

        await writeLog(
          db,
          "ADMIN_LOGOUT",
          auth.admin.username,
          null,
          "تم تسجيل خروج مسؤول النظام",
          "info",
          req
        );

        res.json({
          success: true,
          message:
            "تم تسجيل الخروج بنجاح.",
        });
      }
    )
  );

  /* =======================================================
     CURRENT ADMIN
  ======================================================= */

  app.get(
    "/api/admin/me",
    requireAdmin(
      db,
      async (
        _req,
        res,
        auth
      ) => {
        res.json({
          success: true,
          admin: {
            id: auth.admin.id,
            username:
              auth.admin.username,
            name: auth.admin.name,
            role: auth.admin.role,
            is_active:
              auth.admin.is_active,
          },
        });
      }
    )
  );

  /* =======================================================
     DASHBOARD STATS
  ======================================================= */

  app.get(
    "/api/admin/dashboard/stats",
    requireAdmin(
      db,
      async (
        _req,
        res
      ) => {
        const [
          captainsResult,
          activeCaptainsResult,
          activatedResult,
          codesResult,
          usedCodesResult,
          devicesResult,
          blockedDevicesResult,
          subscriptionsResult,
          activeSubscriptionsResult,
          unreadAlertsResult,
        ] = await Promise.all([
          db
            .from("captains")
            .select(
              "id",
              {
                count:
                  "exact",
                head: true,
              }
            ),

          db
            .from("captains")
            .select(
              "id",
              {
                count:
                  "exact",
                head: true,
              }
            )
            .eq(
              "is_active",
              true
            ),

          db
            .from("captains")
            .select(
              "id",
              {
                count:
                  "exact",
                head: true,
              }
            )
            .eq(
              "is_activated",
              true
            ),

          db
            .from(
              "activation_codes"
            )
            .select(
              "id",
              {
                count:
                  "exact",
                head: true,
              }
            ),

          db
            .from(
              "activation_codes"
            )
            .select(
              "id",
              {
                count:
                  "exact",
                head: true,
              }
            )
            .eq(
              "is_used",
              true
            ),

          db
            .from("devices")
            .select(
              "id",
              {
                count:
                  "exact",
                head: true,
              }
            ),

          db
            .from("devices")
            .select(
              "id",
              {
                count:
                  "exact",
                head: true,
              }
            )
            .eq(
              "is_blocked",
              true
            ),

          db
            .from(
              "user_subscriptions"
            )
            .select(
              "id",
              {
                count:
                  "exact",
                head: true,
              }
            ),

          db
            .from(
              "user_subscriptions"
            )
            .select(
              "id",
              {
                count:
                  "exact",
                head: true,
              }
            )
            .eq(
              "is_active",
              true
            ),

          db
            .from(
              "system_alerts"
            )
            .select(
              "id",
              {
                count:
                  "exact",
                head: true,
              }
            )
            .eq(
              "is_read",
              false
            ),
        ]);

        res.json({
          success: true,
          stats: {
            total_users:
              captainsResult.count ||
              0,

            active_users:
              activeCaptainsResult.count ||
              0,

            activated_users:
              activatedResult.count ||
              0,

            total_activation_codes:
              codesResult.count ||
              0,

            used_activation_codes:
              usedCodesResult.count ||
              0,

            total_devices:
              devicesResult.count ||
              0,

            blocked_devices:
              blockedDevicesResult.count ||
              0,

            total_subscriptions:
              subscriptionsResult.count ||
              0,

            active_subscriptions:
              activeSubscriptionsResult.count ||
              0,

            unread_alerts:
              unreadAlertsResult.count ||
              0,
          },
        });
      }
    )
  );

  /* =======================================================
     USERS
  ======================================================= */

  app.get(
    "/api/admin/users",
    requireAdmin(
      db,
      async (
        _req,
        res
      ) => {
        const {
          data: users,
          error,
        } = await db
          .from("captains")
          .select("*")
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        const userIds =
          (users || []).map(
            (u: any) =>
              u.id
          );

        let subscriptions: any[] =
          [];

        let devices: any[] = [];

        if (userIds.length) {
          const [
            subscriptionResult,
            deviceResult,
          ] = await Promise.all([
            db
              .from(
                "user_subscriptions"
              )
              .select("*")
              .in(
                "user_id",
                userIds
              ),

            db
              .from("devices")
              .select("*")
              .in(
                "user_id",
                userIds
              ),
          ]);

          subscriptions =
            subscriptionResult.data ||
            [];

          devices =
            deviceResult.data ||
            [];
        }

        const result =
          (users || []).map(
            (user: any) => ({
              ...user,

              password_hash:
                undefined,

              subscription:
                subscriptions.find(
                  (s) =>
                    s.user_id ===
                    user.id
                ) ||
                null,

              device:
                devices.find(
                  (d) =>
                    d.user_id ===
                    user.id
                ) ||
                null,
            })
          );

        res.json({
          success: true,
          users: result,
        });
      }
    )
  );

  /* =======================================================
     GET SINGLE USER
  ======================================================= */

  app.get(
    "/api/admin/users/:id",
    requireAdmin(
      db,
      async (
        req,
        res
      ) => {
        const userId =
          String(
            req.params.id
          );

        const {
          data: user,
          error,
        } = await db
          .from("captains")
          .select("*")
          .eq(
            "id",
            userId
          )
          .maybeSingle();

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            error:
              "User not found",
          });
        }

        const [
          subscriptionResult,
          deviceResult,
        ] = await Promise.all([
          db
            .from(
              "user_subscriptions"
            )
            .select("*")
            .eq(
              "user_id",
              userId
            )
            .maybeSingle(),

          db
            .from("devices")
            .select("*")
            .eq(
              "user_id",
              userId
            ),
        ]);

        const safeUser = {
          ...user,
          password_hash:
            undefined,
          subscription:
            subscriptionResult.data ||
            null,
          devices:
            deviceResult.data ||
            [],
        };

        res.json({
          success: true,
          user: safeUser,
        });
      }
    )
  );

  /* =======================================================
     USER STATUS
  ======================================================= */

  app.patch(
    "/api/admin/users/:id/status",
    requireAdmin(
      db,
      async (
        req,
        res,
        auth
      ) => {
        const userId =
          String(
            req.params.id
          );

        const isActive =
          Boolean(
            req.body?.is_active
          );

        const {
          data: user,
          error,
        } = await db
          .from("captains")
          .update({
            is_active:
              isActive,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            userId
          )
          .select("*")
          .maybeSingle();

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            error:
              "User not found",
          });
        }

        await writeLog(
          db,
          "USER_STATUS_CHANGED",
          user.phone,
          user.id,
          `تم تغيير حالة المستخدم إلى ${
            isActive
              ? "نشط"
              : "غير نشط"
          } بواسطة ${auth.admin.username}`,
          isActive
            ? "success"
            : "warning",
          req
        );

        res.json({
          success: true,
          user,
        });
      }
    )
  );

  /* =======================================================
     EXTEND SUBSCRIPTION
  ======================================================= */

  app.post(
    "/api/admin/users/:id/extend-subscription",
    requireAdmin(
      db,
      async (
        req,
        res,
        auth
      ) => {
        const userId =
          String(
            req.params.id
          );

        const days = Math.max(
          1,
          Number(
            req.body?.days || 30
          )
        );

        const {
          data: user,
          error: userError,
        } = await db
          .from("captains")
          .select("*")
          .eq(
            "id",
            userId
          )
          .maybeSingle();

        if (
          userError ||
          !user
        ) {
          return res.status(404).json({
            success: false,
            error:
              userError?.message ||
              "User not found",
          });
        }

        const now =
          new Date();

        const currentExpiry =
          user.expires_at
            ? new Date(
                user.expires_at
              )
            : now;

        const baseDate =
          currentExpiry.getTime() >
          now.getTime()
            ? currentExpiry
            : now;

        const newExpiry =
          new Date(
            baseDate.getTime() +
              days *
                24 *
                60 *
                60 *
                1000
          );

        const {
          data: updatedUser,
          error:
            updateUserError,
        } = await db
          .from("captains")
          .update({
            is_activated:
              true,
            expires_at:
              newExpiry.toISOString(),
            license_plan:
              `${days} يوم إضافي`,
            updated_at:
              now.toISOString(),
          })
          .eq(
            "id",
            userId
          )
          .select("*")
          .single();

        if (
          updateUserError ||
          !updatedUser
        ) {
          return res.status(500).json({
            success: false,
            error:
              updateUserError?.message ||
              "Failed to update subscription.",
          });
        }

        const {
          data: existingSubscription,
        } = await db
          .from(
            "user_subscriptions"
          )
          .select("*")
          .eq(
            "user_id",
            userId
          )
          .maybeSingle();

        if (
          existingSubscription
        ) {
          await db
            .from(
              "user_subscriptions"
            )
            .update({
              expires_at:
                newExpiry.toISOString(),
              is_active: true,
              updated_at:
                now.toISOString(),
            })
            .eq(
              "id",
              existingSubscription.id
            );
        } else {
          await db
            .from(
              "user_subscriptions"
            )
            .insert({
              user_id:
                userId,
              starts_at:
                now.toISOString(),
              expires_at:
                newExpiry.toISOString(),
              is_active:
                true,
              created_at:
                now.toISOString(),
              updated_at:
                now.toISOString(),
            });
        }

        await writeLog(
          db,
          "SUBSCRIPTION_EXTENDED",
          updatedUser.phone,
          updatedUser.id,
          `تم تمديد الاشتراك ${days} يوم بواسطة ${auth.admin.username}`,
          "success",
          req
        );

        res.json({
          success: true,
          user: updatedUser,
          expires_at:
            newExpiry.toISOString(),
        });
      }
    )
  );

  /* =======================================================
     UNLINK USER DEVICE
  ======================================================= */

  app.post(
    "/api/admin/users/:id/unlink-device",
    requireAdmin(
      db,
      async (
        req,
        res,
        auth
      ) => {
        const userId =
          String(
            req.params.id
          );

        const {
          data: devices,
        } = await db
          .from("devices")
          .select("*")
          .eq(
            "user_id",
            userId
          );

        if (
          devices &&
          devices.length
        ) {
          await db
            .from("devices")
            .delete()
            .eq(
              "user_id",
              userId
            );
        }

        await writeLog(
          db,
          "DEVICE_UNLINKED",
          null,
          userId,
          `تم فصل جهاز المستخدم بواسطة ${auth.admin.username}`,
          "warning",
          req
        );

        res.json({
          success: true,
          message:
            "تم فصل الجهاز بنجاح.",
        });
      }
    )
  );

  /* =======================================================
     DELETE USER
  ======================================================= */

  app.delete(
    "/api/admin/users/:id",
    requireAdmin(
      db,
      async (
        req,
        res,
        auth
      ) => {
        const userId =
          String(
            req.params.id
          );

        const {
          data: user,
        } = await db
          .from("captains")
          .select(
            "id,phone,name"
          )
          .eq(
            "id",
            userId
          )
          .maybeSingle();

        if (!user) {
          return res.status(404).json({
            success: false,
            error:
              "User not found",
          });
        }

        const {
          error,
        } = await db
          .from("captains")
          .delete()
          .eq(
            "id",
            userId
          );

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        await writeLog(
          db,
          "USER_DELETED",
          user.phone,
          user.id,
          `تم حذف المستخدم بواسطة ${auth.admin.username}`,
          "warning",
          req
        );

        res.json({
          success: true,
          message:
            "تم حذف المستخدم.",
        });
      }
    )
  );

  /* =======================================================
     ACTIVATION CODES - LIST
  ======================================================= */

  app.get(
    "/api/admin/activation-codes",
    requireAdmin(
      db,
      async (
        _req,
        res
      ) => {
        const {
          data,
          error,
        } = await db
          .from(
            "activation_codes"
          )
          .select("*")
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        res.json({
          success: true,
          activation_codes:
            data || [],
        });
      }
    )
  );

  /* =======================================================
     GENERATE ACTIVATION CODE
  ======================================================= */

  app.post(
    "/api/admin/activation-codes",
    requireAdmin(
      db,
      async (
        req,
        res,
        auth
      ) => {
        const durationDays =
          Math.max(
            1,
            Number(
              req.body?.duration_days ||
                30
            )
          );

        const planName =
          String(
            req.body?.plan_name ||
              `${durationDays} يوم`
          );

        const isVip =
          Boolean(
            req.body?.is_vip
          );

        const features =
          Array.isArray(
            req.body?.features
          )
            ? req.body.features
            : isVip
            ? [
                "radar",
                "instant_alerts",
                "auto_accept",
              ]
            : ["radar"];

        const code =
          String(
            req.body?.code ||
              `ORDERI-${crypto
                .randomBytes(4)
                .toString("hex")
                .toUpperCase()}-${crypto
                .randomBytes(3)
                .toString("hex")
                .toUpperCase()}`
          )
            .trim()
            .toUpperCase();

        const {
          data,
          error,
        } = await db
          .from(
            "activation_codes"
          )
          .insert({
            code,
            duration_days:
              durationDays,
            is_used: false,
            used_by: null,
            used_at: null,
            expires_at: null,
            plan_name:
              planName,
            is_vip:
              isVip,
            features,
            is_cancelled:
              false,
          })
          .select("*")
          .single();

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        await writeLog(
          db,
          "ACTIVATION_CODE_CREATED",
          auth.admin.username,
          null,
          `تم إنشاء كود تفعيل ${code}`,
          "success",
          req
        );

        res.status(201).json({
          success: true,
          activation_code:
            data,
        });
      }
    )
  );

  /* =======================================================
     BULK ACTIVATION CODES
  ======================================================= */

  app.post(
    "/api/admin/activation-codes/bulk",
    requireAdmin(
      db,
      async (
        req,
        res,
        auth
      ) => {
        const count = Math.min(
          100,
          Math.max(
            1,
            Number(
              req.body?.count || 1
            )
          )
        );

        const durationDays =
          Math.max(
            1,
            Number(
              req.body?.duration_days ||
                30
            )
          );

        const planName =
          String(
            req.body?.plan_name ||
              `${durationDays} يوم`
          );

        const isVip =
          Boolean(
            req.body?.is_vip
          );

        const features =
          Array.isArray(
            req.body?.features
          )
            ? req.body.features
            : isVip
            ? [
                "radar",
                "instant_alerts",
                "auto_accept",
              ]
            : ["radar"];

        const rows =
          Array.from(
            {
              length: count,
            },
            () => ({
              code: `ORDERI-${crypto
                .randomBytes(4)
                .toString("hex")
                .toUpperCase()}-${crypto
                .randomBytes(3)
                .toString("hex")
                .toUpperCase()}`,

              duration_days:
                durationDays,

              is_used: false,

              used_by: null,

              used_at: null,

              expires_at: null,

              plan_name:
                planName,

              is_vip:
                isVip,

              features,

              is_cancelled:
                false,
            })
          );

        const {
          data,
          error,
        } = await db
          .from(
            "activation_codes"
          )
          .insert(rows)
          .select("*");

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        await writeLog(
          db,
          "BULK_CODES_GENERATED",
          auth.admin.username,
          null,
          `تم توليد ${data?.length || 0} كود تفعيل`,
          "success",
          req
        );

        res.status(201).json({
          success: true,
          count:
            data?.length || 0,
          activation_codes:
            data || [],
        });
      }
    )
  );

  /* =======================================================
     CANCEL ACTIVATION CODE
  ======================================================= */

  app.patch(
    "/api/admin/activation-codes/:id/cancel",
    requireAdmin(
      db,
      async (
        req,
        res,
        auth
      ) => {
        const id =
          String(
            req.params.id
          );

        const {
          data: code,
          error:
            findError,
        } = await db
          .from(
            "activation_codes"
          )
          .select("*")
          .eq(
            "id",
            id
          )
          .maybeSingle();

        if (findError) {
          return res.status(500).json({
            success: false,
            error:
              findError.message,
          });
        }

        if (!code) {
          return res.status(404).json({
            success: false,
            error:
              "Activation code not found",
          });
        }

        const {
          data: updated,
          error,
        } = await db
          .from(
            "activation_codes"
          )
          .update({
            is_cancelled:
              true,
          })
          .eq(
            "id",
            id
          )
          .select("*")
          .single();

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        await writeLog(
          db,
          "ACTIVATION_CODE_CANCELLED",
          auth.admin.username,
          null,
          `تم إلغاء كود التفعيل ${code.code}`,
          "warning",
          req
        );

        res.json({
          success: true,
          message:
            "Code cancelled",
          activation_code:
            updated,
        });
      }
    )
  );

  /* =======================================================
     DEVICES
  ======================================================= */

  app.get(
    "/api/admin/devices",
    requireAdmin(
      db,
      async (
        _req,
        res
      ) => {
        const {
          data,
          error,
        } = await db
          .from("devices")
          .select("*")
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        res.json({
          success: true,
          devices:
            data || [],
        });
      }
    )
  );

  /* =======================================================
     BLOCK DEVICE
  ======================================================= */

  app.post(
    "/api/admin/devices/:id/block",
    requireAdmin(
      db,
      async (
        req,
        res,
        auth
      ) => {
        const id =
          String(
            req.params.id
          );

        const {
          data: device,
          error,
        } = await db
          .from("devices")
          .update({
            is_blocked:
              true,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            id
          )
          .select("*")
          .maybeSingle();

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        if (!device) {
          return res.status(404).json({
            success: false,
            error:
              "Device not found",
          });
        }

        await writeLog(
          db,
          "DEVICE_BLOCKED",
          device.username ||
            device.phone ||
            null,
          device.user_id,
          `تم حظر الجهاز ${device.device_name || device.device_id} بواسطة ${auth.admin.username}`,
          "warning",
          req
        );

        res.json({
          success: true,
          device,
        });
      }
    )
  );

  /* =======================================================
     UNBLOCK DEVICE
  ======================================================= */

  app.post(
    "/api/admin/devices/:id/unblock",
    requireAdmin(
      db,
      async (
        req,
        res,
        auth
      ) => {
        const id =
          String(
            req.params.id
          );

        const {
          data: device,
          error,
        } = await db
          .from("devices")
          .update({
            is_blocked:
              false,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            id
          )
          .select("*")
          .maybeSingle();

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        if (!device) {
          return res.status(404).json({
            success: false,
            error:
              "Device not found",
          });
        }

        await writeLog(
          db,
          "DEVICE_UNBLOCKED",
          device.username ||
            device.phone ||
            null,
          device.user_id,
          `تم إلغاء حظر الجهاز بواسطة ${auth.admin.username}`,
          "success",
          req
        );

        res.json({
          success: true,
          device,
        });
      }
    )
  );

  /* =======================================================
     UNLINK DEVICE
  ======================================================= */

  app.delete(
    "/api/admin/devices/:id/unlink",
    requireAdmin(
      db,
      async (
        req,
        res,
        auth
      ) => {
        const id =
          String(
            req.params.id
          );

        const {
          data: device,
          error:
            findError,
        } = await db
          .from("devices")
          .select("*")
          .eq(
            "id",
            id
          )
          .maybeSingle();

        if (findError) {
          return res.status(500).json({
            success: false,
            error:
              findError.message,
          });
        }

        if (!device) {
          return res.status(404).json({
            success: false,
            error:
              "Device not found",
          });
        }

        const {
          error,
        } = await db
          .from("devices")
          .delete()
          .eq(
            "id",
            id
          );

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        await writeLog(
          db,
          "DEVICE_REMOVED",
          device.username ||
            device.phone ||
            null,
          device.user_id,
          `تم إزالة الجهاز بواسطة ${auth.admin.username}`,
          "warning",
          req
        );

        res.json({
          success: true,
          message:
            "Device unlinked and removed",
        });
      }
    )
  );

  /* =======================================================
     SUBSCRIPTIONS
  ======================================================= */

  app.get(
    "/api/admin/subscriptions",
    requireAdmin(
      db,
      async (
        _req,
        res
      ) => {
        const {
          data,
          error,
        } = await db
          .from(
            "user_subscriptions"
          )
          .select(
            `
              *,
              captains (
                id,
                phone,
                name,
                vehicle_type,
                is_activated,
                license_plan,
                expires_at
              )
            `
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        res.json({
          success: true,
          subscriptions:
            data || [],
        });
      }
    )
  );

  /* =======================================================
     LOGS
  ======================================================= */

  app.get(
    "/api/admin/logs",
    requireAdmin(
      db,
      async (
        req,
        res
      ) => {
        const limit = Math.min(
          500,
          Math.max(
            1,
            Number(
              req.query.limit ||
                200
            )
          )
        );

        const {
          data,
          error,
        } = await db
          .from(
            "system_logs"
          )
          .select("*")
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(limit);

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        res.json({
          success: true,
          logs:
            data || [],
        });
      }
    )
  );

  /* =======================================================
     ALERTS
  ======================================================= */

  app.get(
    "/api/admin/alerts",
    requireAdmin(
      db,
      async (
        _req,
        res
      ) => {
        const {
          data,
          error,
        } = await db
          .from(
            "system_alerts"
          )
          .select("*")
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(500);

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        res.json({
          success: true,
          alerts:
            data || [],
        });
      }
    )
  );

  /* =======================================================
     MARK ALERT READ
  ======================================================= */

  app.patch(
    "/api/admin/alerts/:id/read",
    requireAdmin(
      db,
      async (
        req,
        res
      ) => {
        const id =
          String(
            req.params.id
          );

        const {
          error,
        } = await db
          .from(
            "system_alerts"
          )
          .update({
            is_read:
              true,
          })
          .eq(
            "id",
            id
          );

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        res.json({
          success: true,
        });
      }
    )
  );

  /* =======================================================
     CLEAR ALL ALERTS
  ======================================================= */

  app.post(
    "/api/admin/alerts/clear-all",
    requireAdmin(
      db,
      async (
        _req,
        res
      ) => {
        const {
          error,
        } = await db
          .from(
            "system_alerts"
          )
          .update({
            is_read:
              true,
          })
          .eq(
            "is_read",
            false
          );

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        res.json({
          success: true,
        });
      }
    )
  );

  /* =======================================================
     CHANGE ADMIN CREDENTIALS
  ======================================================= */

  app.post(
    "/api/admin/change-credentials",
    requireAdmin(
      db,
      async (
        req,
        res,
        auth
      ) => {
        const newUsername =
          normalizeUsername(
            req.body?.username ||
              auth.admin.username
          );

        const newPassword =
          String(
            req.body?.password ||
              ""
          );

        if (
          !newUsername ||
          !newPassword
        ) {
          return res.status(400).json({
            success: false,
            error:
              "اسم المستخدم وكلمة المرور مطلوبان.",
          });
        }

        if (
          newPassword.length < 8
        ) {
          return res.status(400).json({
            success: false,
            error:
              "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
          });
        }

        const {
          data: existing,
        } = await db
          .from(
            "admin_accounts"
          )
          .select("id")
          .eq(
            "username",
            newUsername
          )
          .neq(
            "id",
            auth.admin.id
          )
          .maybeSingle();

        if (existing) {
          return res.status(409).json({
            success: false,
            error:
              "اسم المستخدم مستخدم بالفعل.",
          });
        }

        const {
          data: updated,
          error,
        } = await db
          .from(
            "admin_accounts"
          )
          .update({
            username:
              newUsername,
            password_hash:
              hashPassword(
                newPassword
              ),
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            auth.admin.id
          )
          .select("*")
          .single();

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        /*
         * Invalidate all previous sessions.
         */
        await db
          .from(
            "admin_sessions"
          )
          .delete()
          .eq(
            "admin_id",
            auth.admin.id
          );

        await writeLog(
          db,
          "ADMIN_CREDENTIALS_CHANGED",
          updated.username,
          null,
          "تم تغيير بيانات مسؤول النظام",
          "warning",
          req
        );

        res.json({
          success: true,
          message:
            "تم تغيير بيانات الدخول. يرجى تسجيل الدخول مرة أخرى.",
        });
      }
    )
  );

  /* =======================================================
     REGISTER ADMIN
     Used only when explicitly called by a valid Admin.
  ======================================================= */

  app.post(
    "/api/admin/accounts",
    requireAdmin(
      db,
      async (
        req,
        res,
        auth
      ) => {
        /*
         * Only SuperAdmin can create another Admin.
         */
        if (
          auth.admin.role !==
          "SuperAdmin"
        ) {
          return res.status(403).json({
            success: false,
            error:
              "غير مصرح.",
          });
        }

        const username =
          normalizeUsername(
            req.body?.username
          );

        const password =
          String(
            req.body?.password ||
              ""
          );

        const name =
          String(
            req.body?.name ||
              username
          ).trim();

        const role =
          String(
            req.body?.role ||
              "Admin"
          );

        if (
          !username ||
          !password
        ) {
          return res.status(400).json({
            success: false,
            error:
              "اسم المستخدم وكلمة المرور مطلوبان.",
          });
        }

        if (
          password.length < 8
        ) {
          return res.status(400).json({
            success: false,
            error:
              "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
          });
        }

        const {
          data: existing,
        } = await db
          .from(
            "admin_accounts"
          )
          .select("id")
          .eq(
            "username",
            username
          )
          .maybeSingle();

        if (existing) {
          return res.status(409).json({
            success: false,
            error:
              "اسم المستخدم مستخدم بالفعل.",
          });
        }

        const {
          data: admin,
          error,
        } = await db
          .from(
            "admin_accounts"
          )
          .insert({
            username,
            password_hash:
              hashPassword(
                password
              ),
            name,
            role,
            is_active:
              true,
          })
          .select(
            "id,username,name,role,is_active,created_at,updated_at"
          )
          .single();

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        await writeLog(
          db,
          "ADMIN_CREATED",
          admin.username,
          null,
          `تم إنشاء مسؤول جديد بواسطة ${auth.admin.username}`,
          "success",
          req
        );

        res.status(201).json({
          success: true,
          admin,
        });
      }
    )
  );

  /* =======================================================
     ADMIN ACCOUNTS LIST
  ======================================================= */

  app.get(
    "/api/admin/accounts",
    requireAdmin(
      db,
      async (
        _req,
        res,
        auth
      ) => {
        if (
          auth.admin.role !==
          "SuperAdmin"
        ) {
          return res.status(403).json({
            success: false,
            error:
              "غير مصرح.",
          });
        }

        const {
          data,
          error,
        } = await db
          .from(
            "admin_accounts"
          )
          .select(
            "id,username,name,role,is_active,created_at,updated_at"
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        res.json({
          success: true,
          admins:
            data || [],
        });
      }
    )
  );

  console.log(
    "[Orderi] Admin routes registered."
  );
}