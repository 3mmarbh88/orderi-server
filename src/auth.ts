import crypto from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import { Request, Response, Express } from "express";

type AuthUser = {
  id: string;
  username: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
};

function normalizePhone(value: unknown): string {
  let phone = String(value || "").replace(/\D/g, "");

  if (phone.startsWith("00973")) {
    phone = phone.substring(5);
  }

  if (phone.startsWith("973")) {
    phone = phone.substring(3);
  }

  return phone;
}

function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

function getUserFromCaptain(captain: any): AuthUser {
  return {
    id: captain.id,
    username: captain.phone,
    phone: captain.phone,
    is_active:
      captain.is_active !== false,
    created_at: captain.created_at
  };
}

async function getCaptainById(
  db: SupabaseClient,
  id: string
) {
  const { data, error } = await db
    .from("captains")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getAuthenticatedCaptain(
  req: Request,
  db: SupabaseClient
) {
  const header =
    req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  const token =
    header.substring(7).trim();

  if (!token) {
    return null;
  }

  const { data: session, error } =
    await db
      .from("auth_sessions")
      .select("*")
      .eq("token", token)
      .maybeSingle();

  if (error || !session) {
    return null;
  }

  if (
    new Date(session.expires_at).getTime() <=
    Date.now()
  ) {
    await db
      .from("auth_sessions")
      .delete()
      .eq("token", token);

    return null;
  }

  const captain =
    await getCaptainById(
      db,
      session.captain_id
    );

  if (!captain) {
    await db
      .from("auth_sessions")
      .delete()
      .eq("token", token);

    return null;
  }

  if (captain.is_active === false) {
    return null;
  }

  return {
    captain,
    token
  };
}

async function requireAuth(
  req: Request,
  res: Response,
  db: SupabaseClient
) {
  const auth =
    await getAuthenticatedCaptain(req, db);

  if (!auth) {
    res.status(401).json({
      success: false,
      error: "غير مصرح. يرجى تسجيل الدخول."
    });

    return null;
  }

  return auth;
}

export function registerAuthRoutes(
  app: Express,
  db: SupabaseClient | null
) {
  /*
   * REGISTER
   */
  app.post(
    "/api/auth/register",
    async (req: Request, res: Response) => {
      if (!db) {
        return res.status(503).json({
          success: false,
          error:
            "Supabase is not configured."
        });
      }

      try {
        const {
          username,
          password,
          phone,
          name,
          vehicleType
        } = req.body || {};

        const normalizedPhone =
          normalizePhone(
            phone || username
          );

        if (!normalizedPhone) {
          return res.status(400).json({
            success: false,
            error:
              "رقم الهاتف مطلوب."
          });
        }

        if (
          !password ||
          String(password).length < 6
        ) {
          return res.status(400).json({
            success: false,
            error:
              "كلمة المرور يجب أن تكون 6 أحرف على الأقل."
          });
        }

        const { data: existing, error: findError } =
          await db
            .from("captains")
            .select("id")
            .eq("phone", normalizedPhone)
            .maybeSingle();

        if (findError) {
          return res.status(500).json({
            success: false,
            error: findError.message
          });
        }

        if (existing) {
          return res.status(409).json({
            success: false,
            error:
              "رقم الهاتف مسجل مسبقاً."
          });
        }

        const captainName =
          String(
            name ||
            normalizedPhone
          ).trim();

        const { data: captain, error } =
          await db
            .from("captains")
            .insert({
              phone:
                normalizedPhone,

              name:
                captainName,

              password_hash:
                hashPassword(
                  String(password)
                ),

              vehicle_type:
                vehicleType ||
                "car",

              is_activated:
                false,

              license_plan:
                "بانتظار كود التفعيل",

              biometrics_enabled:
                true
            })
            .select("*")
            .single();

        if (error || !captain) {
          return res.status(500).json({
            success: false,
            error:
              error?.message ||
              "تعذر إنشاء الحساب."
          });
        }

        const user =
          getUserFromCaptain(
            captain
          );

        return res.status(201).json({
          success: true,
          message:
            "تم إنشاء الحساب بنجاح.",
          user
        });
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          error:
            error?.message ||
            "Registration error."
        });
      }
    }
  );

  /*
   * LOGIN
   */
  app.post(
    "/api/auth/login",
    async (req: Request, res: Response) => {
      if (!db) {
        return res.status(503).json({
          success: false,
          error:
            "Supabase is not configured."
        });
      }

      try {
        const {
          username,
          password,
          phone
        } = req.body || {};

        const normalizedPhone =
          normalizePhone(
            phone || username
          );

        if (
          !normalizedPhone ||
          !password
        ) {
          return res.status(400).json({
            success: false,
            error:
              "رقم الهاتف وكلمة المرور مطلوبان."
          });
        }

        const { data: captain, error } =
          await db
            .from("captains")
            .select("*")
            .eq("phone", normalizedPhone)
            .maybeSingle();

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message
          });
        }

        if (!captain) {
          return res.status(401).json({
            success: false,
            error:
              "رقم الهاتف أو كلمة المرور غير صحيحة."
          });
        }

        if (
          captain.is_active === false
        ) {
          return res.status(403).json({
            success: false,
            error:
              "الحساب غير مفعل."
          });
        }

        const passwordHash =
          hashPassword(
            String(password)
          );

        if (
          passwordHash !==
          captain.password_hash
        ) {
          return res.status(401).json({
            success: false,
            error:
              "رقم الهاتف أو كلمة المرور غير صحيحة."
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

        const { error: sessionError } =
          await db
            .from("auth_sessions")
            .insert({
              token,
              captain_id:
                captain.id,
              expires_at:
                expiresAt
            });

        if (sessionError) {
          return res.status(500).json({
            success: false,
            error:
              sessionError.message
          });
        }

        const user =
          getUserFromCaptain(
            captain
          );

        return res.json({
          success: true,
          token,
          expires_at:
            expiresAt,
          user
        });
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          error:
            error?.message ||
            "Login error."
        });
      }
    }
  );

  /*
   * CURRENT USER
   */
  app.get(
    "/api/auth/me",
    async (req: Request, res: Response) => {
      if (!db) {
        return res.status(503).json({
          success: false,
          error:
            "Supabase is not configured."
        });
      }

      try {
        const auth =
          await requireAuth(
            req,
            res,
            db
          );

        if (!auth) return;

        return res.json({
          success: true,
          user:
            getUserFromCaptain(
              auth.captain
            )
        });
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          error:
            error?.message ||
            "Authentication error."
        });
      }
    }
  );

  /*
   * SUBSCRIPTION
   */
  app.get(
    "/api/auth/subscription",
    async (
      req: Request,
      res: Response
    ) => {
      if (!db) {
        return res.status(503).json({
          success: false,
          error:
            "Supabase is not configured."
        });
      }

      try {
        const auth =
          await requireAuth(
            req,
            res,
            db
          );

        if (!auth) return;

        const captain =
          auth.captain;

        let activationCodeId:
          string | null = null;

        if (captain.activation_code) {
          const { data: code } =
            await db
              .from(
                "activation_codes"
              )
              .select("id")
              .eq(
                "code",
                captain.activation_code
              )
              .maybeSingle();

          activationCodeId =
            code?.id || null;
        }

        const expiresAt =
          captain.expires_at;

        const active =
          Boolean(
            captain.is_activated &&
            expiresAt &&
            new Date(
              expiresAt
            ).getTime() >
              Date.now()
          );

        const subscription = {
          id:
            captain.id,

          user_id:
            captain.id,

          activation_code_id:
            activationCodeId,

          starts_at:
            captain.activated_at ||
            captain.created_at,

          expires_at:
            captain.expires_at,

          is_active:
            active,

          created_at:
            captain.created_at,

          updated_at:
            captain.updated_at
        };

        return res.json({
          success: true,
          active,
          expires_at:
            captain.expires_at,
          subscription
        });
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          error:
            error?.message ||
            "Subscription error."
        });
      }
    }
  );

  /*
   * ACTIVATE CODE
   */
  app.post(
  "/api/auth/activate",
  async (
    req: Request,
    res: Response
  ) => {
    if (!db) {
      return res.status(503).json({
        success: false,
        error: "Supabase is not configured."
      });
    }

    try {
      const auth = await requireAuth(
        req,
        res,
        db
      );

      if (!auth) return;

      const code = String(
        req.body?.code || ""
      )
        .trim()
        .toUpperCase();

      if (!code) {
        return res.status(400).json({
          success: false,
          error: "كود التفعيل مطلوب."
        });
      }

      const {
        data: activationCode,
        error: codeError
      } = await db
        .from("activation_codes")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (codeError) {
        return res.status(500).json({
          success: false,
          error: codeError.message
        });
      }

      if (!activationCode) {
        return res.status(404).json({
          success: false,
          error: "كود التفعيل غير موجود."
        });
      }

      // الكود مستخدم بالفعل
      if (
        activationCode.is_used === true ||
        activationCode.used_by
      ) {
        return res.status(409).json({
          success: false,
          error: "كود التفعيل مستخدم مسبقاً."
        });
      }

      // تاريخ انتهاء الكود نفسه
      if (
        activationCode.expires_at &&
        new Date(
          activationCode.expires_at
        ).getTime() <= Date.now()
      ) {
        return res.status(410).json({
          success: false,
          error: "كود التفعيل منتهي الصلاحية."
        });
      }

      const now = new Date();

      const durationDays =
        Number(
          activationCode.duration_days || 30
        );

      const subscriptionExpires =
        new Date(
          now.getTime() +
            durationDays *
              24 *
              60 *
              60 *
              1000
        );

      /*
       * Claim activation code atomically.
       *
       * Both conditions are required:
       * 1. is_used = false
       * 2. used_by IS NULL
       *
       * This prevents the same code from being
       * successfully claimed by another captain.
       */
      const {
        data: claimedCode,
        error: claimError
      } = await db
        .from("activation_codes")
        .update({
          is_used: true,
          used_by: auth.captain.id,
          used_at: now.toISOString()
        })
        .eq("id", activationCode.id)
        .eq("is_used", false)
        .is("used_by", null)
        .select("*")
        .maybeSingle();

      if (
        claimError ||
        !claimedCode
      ) {
        return res.status(409).json({
          success: false,
          error:
            "تعذر استخدام الكود. ربما تم استخدامه من مستخدم آخر."
        });
      }

      /*
       * Update captain subscription information.
       *
       * Do not use plan_name because the current
       * activation_codes table does not contain it.
       */
      const {
        data: updatedCaptain,
        error: captainError
      } = await db
        .from("captains")
        .update({
          is_activated: true,
          activation_code: code,
          license_plan: "30 يوم",
          activated_at:
            now.toISOString(),
          expires_at:
            subscriptionExpires.toISOString()
        })
        .eq(
          "id",
          auth.captain.id
        )
        .select("*")
        .single();

      if (
        captainError ||
        !updatedCaptain
      ) {
        /*
         * The code has already been claimed.
         * Return an error rather than silently
         * activating an inconsistent account.
         */
        return res.status(500).json({
          success: false,
          error:
            captainError?.message ||
            "تعذر تفعيل الاشتراك."
        });
      }

      /*
       * Create or update the subscription record.
       */
      const {
        data: existingSubscription,
        error: subscriptionReadError
      } = await db
        .from("user_subscriptions")
        .select("*")
        .eq(
          "user_id",
          auth.captain.id
        )
        .maybeSingle();

      if (subscriptionReadError) {
        return res.status(500).json({
          success: false,
          error:
            subscriptionReadError.message
        });
      }

      let subscription;

      if (existingSubscription) {
        const {
          data: updatedSubscription,
          error:
            subscriptionUpdateError
        } = await db
          .from("user_subscriptions")
          .update({
            activation_code_id:
              activationCode.id,
            starts_at:
              now.toISOString(),
            expires_at:
              subscriptionExpires.toISOString(),
            is_active: true,
            updated_at:
              now.toISOString()
          })
          .eq(
            "id",
            existingSubscription.id
          )
          .select("*")
          .single();

        if (
          subscriptionUpdateError ||
          !updatedSubscription
        ) {
          return res.status(500).json({
            success: false,
            error:
              subscriptionUpdateError?.message ||
              "تعذر تحديث الاشتراك."
          });
        }

        subscription =
          updatedSubscription;
      } else {
        const {
          data: newSubscription,
          error:
            subscriptionInsertError
        } = await db
          .from("user_subscriptions")
          .insert({
            user_id:
              auth.captain.id,
            activation_code_id:
              activationCode.id,
            starts_at:
              now.toISOString(),
            expires_at:
              subscriptionExpires.toISOString(),
            is_active: true,
            created_at:
              now.toISOString(),
            updated_at:
              now.toISOString()
          })
          .select("*")
          .single();

        if (
          subscriptionInsertError ||
          !newSubscription
        ) {
          return res.status(500).json({
            success: false,
            error:
              subscriptionInsertError?.message ||
              "تعذر إنشاء الاشتراك."
          });
        }

        subscription =
          newSubscription;
      }

      return res.json({
        success: true,
        message:
          "تم تفعيل الاشتراك بنجاح.",

        user:
          getUserFromCaptain(
            updatedCaptain
          ),

        subscription: {
          id:
            subscription.id,

          user_id:
            subscription.user_id,

          activation_code_id:
            subscription.activation_code_id,

          starts_at:
            subscription.starts_at,

          expires_at:
            subscription.expires_at,

          is_active:
            subscription.is_active
        }
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error:
          error?.message ||
          "Activation error."
      });
    }
  }
);  /*
   * LOGOUT
   */
  app.post(
    "/api/auth/logout",
    async (
      req: Request,
      res: Response
    ) => {
      if (!db) {
        return res.status(503).json({
          success: false,
          error:
            "Supabase is not configured."
        });
      }

      try {
        const header =
          req.headers.authorization ||
          "";

        if (
          header.startsWith(
            "Bearer "
          )
        ) {
          const token =
            header
              .substring(7)
              .trim();

          if (token) {
            await db
              .from(
                "auth_sessions"
              )
              .delete()
              .eq(
                "token",
                token
              );
          }
        }

        return res.json({
          success: true,
          message:
            "تم تسجيل الخروج."
        });
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          error:
            error?.message ||
            "Logout error."
        });
      }
    }
  );
}