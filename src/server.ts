import { registerAuthRoutes } from "./auth.js";
import { registerAdminRoutes } from "./admin.js";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import QRCode from "qrcode";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

/* =========================================================
   CORS
========================================================= */

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, apikey, x-orderi-webhook-secret"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

/* =========================================================
   BODY PARSING
========================================================= */

app.use(express.json({ limit: "35mb" }));
app.use(express.urlencoded({ extended: true, limit: "35mb" }));

/* =========================================================
   SUPABASE
========================================================= */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecret = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecret) {
  console.warn(
    "[Orderi] SUPABASE_URL / SUPABASE_SECRET_KEY not configured."
  );
}

const db: SupabaseClient | null =
  supabaseUrl && supabaseSecret
    ? createClient(supabaseUrl, supabaseSecret, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    : null;
registerAuthRoutes(app, db);
registerAdminRoutes(app, db);
/* =========================================================
   SSE CLIENTS
========================================================= */

const sseClients = new Set<Response>();

/* =========================================================
   WHATSAPP SESSION
========================================================= */

type Session = {
  status: "disconnected" | "qr_ready" | "connecting" | "connected";
  qrCodeDataUrl: string;
  pairingCode: string;
  connectedPhone: string | null;
  connectedAt: string | null;
  deviceName: string;
  batteryLevel: number;
  groupsMonitoredCount: number;
  privateChatsMonitoredCount: number;
  totalOrdersCaptured: number;
  lastSyncAt: string | null;
  listenerServiceActive: boolean;
};

let session: Session = {
  status: "disconnected",
  qrCodeDataUrl: "",
  pairingCode: "",
  connectedPhone: null,
  connectedAt: null,
  deviceName: "Orderi Radar Gateway",
  batteryLevel: 100,
  groupsMonitoredCount: 0,
  privateChatsMonitoredCount: 0,
  totalOrdersCaptured: 0,
  lastSyncAt: null,
  listenerServiceActive: true
};

/* =========================================================
   DATABASE HELPER
========================================================= */

function requireDb(res: Response): SupabaseClient | null {
  if (!db) {
    res.status(503).json({
      success: false,
      error: "Supabase is not configured on the server."
    });

    return null;
  }

  return db;
}

/* =========================================================
   BROADCAST
========================================================= */

function broadcast(payload: unknown) {
  const event = `data: ${JSON.stringify(payload)}\n\n`;

  for (const client of [...sseClients]) {
    try {
      client.write(event);
    } catch {
      sseClients.delete(client);
    }
  }
}

/* =========================================================
   SERVER EVENTS
========================================================= */

async function persistEvent(type: string, payload: unknown) {
  if (!db) return;

  await db.from("server_events").insert({
    event_type: type,
    payload
  });
}

/* =========================================================
   WHATSAPP QR
========================================================= */

async function generateQR() {
  const token = `ORDERI-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

  session.pairingCode = `ORD-973-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  session.qrCodeDataUrl = await QRCode.toDataURL(token, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 280
  });

  session.status = "qr_ready";

  await saveSession();
}

/* =========================================================
   SAVE WHATSAPP SESSION
========================================================= */

async function saveSession() {
  if (!db) return;

  await db.from("whatsapp_sessions").upsert({
    id: "default",
    status: session.status,
    qr_code_data_url: session.qrCodeDataUrl,
    pairing_code: session.pairingCode,
    connected_phone: session.connectedPhone,
    connected_at: session.connectedAt,
    device_name: session.deviceName,
    battery_level: session.batteryLevel,
    groups_monitored_count: session.groupsMonitoredCount,
    private_chats_monitored_count:
      session.privateChatsMonitoredCount,
    total_orders_captured: session.totalOrdersCaptured,
    last_sync_at: session.lastSyncAt,
    listener_service_active: session.listenerServiceActive
  });
}

/* =========================================================
   LOAD WHATSAPP SESSION
========================================================= */

async function loadSession() {
  if (!db) return;

  const { data } = await db
    .from("whatsapp_sessions")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (!data) {
    await generateQR();
    return;
  }

  session = {
    status: data.status,
    qrCodeDataUrl: data.qr_code_data_url || "",
    pairingCode: data.pairing_code || "",
    connectedPhone: data.connected_phone,
    connectedAt: data.connected_at,
    deviceName:
      data.device_name || "Orderi Radar Gateway",
    batteryLevel: data.battery_level ?? 100,
    groupsMonitoredCount:
      data.groups_monitored_count ?? 0,
    privateChatsMonitoredCount:
      data.private_chats_monitored_count ?? 0,
    totalOrdersCaptured:
      data.total_orders_captured ?? 0,
    lastSyncAt: data.last_sync_at,
    listenerServiceActive:
      data.listener_service_active ?? true
  };

  if (!session.qrCodeDataUrl) {
    await generateQR();
  }
}

/* =========================================================
   WHATSAPP GROUP INVITE LINKS
========================================================= */

function extractInviteLinks(text: string) {
  const found = new Set<string>();

  const re =
    /(?:https?:\/\/)?(?:chat\.whatsapp\.com|wa\.me\/join)\/([A-Za-z0-9_-]{20,26})/gi;

  for (const m of text.matchAll(re)) {
    found.add(m[1]);
  }

  return [...found];
}

/* =========================================================
   ORDER PARSER
========================================================= */

function parseOrderText(text: string) {
  const priceMatch = text.match(
    /(\d+(?:\.\d+)?)\s*(?:د\.?\s*ب|دينار|BHD|bd)/i
  );

  const phoneMatch = text.match(
    /(?:\+?973[\s-]?)?([3567]\d{7})\b/
  );

  const arrow = text.match(
    /(.{2,40})\s*(?:إلى|الى|->|→)\s*(.{2,40})/
  );

  const from =
    arrow?.[1]
      ?.replace(/^.*?(?:من|from)\s*/i, "")
      .trim() || "";

  const to = arrow?.[2]?.trim() || "";

  return {
    from,
    to,
    price: priceMatch ? Number(priceMatch[1]) : 0,
    phone: phoneMatch ? phoneMatch[1] : "",
    confidence: arrow || priceMatch ? 80 : 45
  };
}

/* =========================================================
   SAVE ORDER
========================================================= */

async function saveOrder(order: any) {
  if (!db) return;

  const now =
    order.receivedAt ||
    new Date().toISOString();

  const { error } = await db
    .from("orders")
    .insert({
      source: order.source || "webhook_auto",

      source_group:
        order.groupName || null,

      pickup_area:
        order.from || "البحرين",

      pickup_lat:
        order.pickupLat ?? null,

      pickup_lng:
        order.pickupLng ?? null,

      destination:
        order.to || null,

      price:
        Number(order.price) || 0,

      distance_km:
        order.distanceKm ?? null,

      raw_text:
        order.rawText || null,

      status:
        order.status || "pending",

      created_at:
        now,

      updated_at:
        now,

      received_at:
        now,

      captain_id:
        order.captainId || null,

      from_area:
        order.from || "البحرين",

      to_area:
        order.to || "البحرين",

      group_name:
        order.groupName || null,

      sender_name:
        order.senderName || null,

      sender_phone:
        order.senderPhone || null
    });

  if (error) {
    console.error(
      "[Orderi] Failed to save order:",
      error
    );

    throw error;
  }
}
/* =========================================================
   SAVE DISCOVERED GROUP LINK
========================================================= */

async function saveGroupLink(link: any) {
  if (!db) return;

  await db.from("discovered_group_links").upsert(
    {
      id: link.id,
      invite_code: link.inviteCode,
      url: link.url,
      title: link.title,
      sender_name: link.senderName,
      sender_phone: link.senderPhone,
      source_group: link.sourceGroup,
      raw_text: link.rawText,
      captured_at: link.capturedAt,
      status: link.status,
      is_monitored: link.isMonitored
    },
    {
      onConflict: "invite_code"
    }
  );
}

/* =========================================================
   CAPTURE INCOMING MESSAGE
========================================================= */

async function captureIncoming(
  body: any,
  query: any = {}
) {
  const rawText = String(
    body.text ??
      body.message ??
      body.body ??
      body.content ??
      body.notificationText ??
      body.data ??
      query.text ??
      query.message ??
      ""
  ).trim();

  if (!rawText) {
    throw new Error("نص الرسالة فارغ.");
  }

  const sender = String(
    body.sender ??
      body.senderName ??
      body.title ??
      body.from_user ??
      body.notificationTitle ??
      body.from ??
      query.sender ??
      "تاجر واتساب"
  );

  const group = String(
    body.group ??
      body.groupName ??
      body.subText ??
      body.notificationSubText ??
      body.chat ??
      query.group ??
      ""
  );

  const phone = String(
    body.phone ??
      body.senderPhone ??
      body.phoneNumber ??
      query.phone ??
      ""
  );

  const parsed = parseOrderText(rawText);

  /* -------------------------------------------------------
     GROUP INVITE LINKS
  ------------------------------------------------------- */

  const links = [];

  for (const code of extractInviteLinks(rawText)) {
    const link = {
      id: `grp-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,

      url: `https://chat.whatsapp.com/${code}`,

      inviteCode: code,

      title: `قروب توصيل جديد (من ${
        sender || group
      })`,

      senderName: sender,

      senderPhone: phone,

      sourceGroup: group || "قروب واتساب",

      rawText,

      capturedAt: new Date().toISOString(),

      status: "new",

      isMonitored: false
    };

    await saveGroupLink(link);

    links.push(link);

    broadcast({
      type: "GROUP_LINK_DETECTED",
      groupLink: link
    });
  }

  /* -------------------------------------------------------
     ORDER
  ------------------------------------------------------- */

  const isDirect =
    !group ||
    group === sender ||
    /خاص|private|direct/i.test(group);

  const order = {
    id: `ord-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`,

    from: parsed.from || "البحرين",

    to: parsed.to || "البحرين",

    price: parsed.price || 0,

    rawText,

    groupName: isDirect
      ? "محادثة خاصة / تاجر مباشر 👤"
      : group,

    senderName: sender,

    senderPhone: phone || parsed.phone,

    receivedAt: new Date().toISOString(),

    confidence: parsed.confidence,

    type: isDirect
      ? "طلب مباشر (خاص)"
      : "طلب قروب واتساب",

    notes: "تم التقاطه عبر Orderi Server",

    status: "pending",

    source:
      body.source || "webhook_auto",

    isDirectPrivate: isDirect
  };

  /* -------------------------------------------------------
     SAVE ORDER
  ------------------------------------------------------- */

  if (
    parsed.from ||
    parsed.to ||
    parsed.price
  ) {
    await saveOrder(order);

    session.totalOrdersCaptured += 1;

    session.lastSyncAt =
      new Date().toISOString();

    await saveSession();

    broadcast({
      type: "NEW_ORDER",
      order
    });

    await persistEvent(
      "NEW_ORDER",
      order
    );
  }

  return {
    order,
    groupLinks: links
  };
}

/* =========================================================
   HEALTH
========================================================= */

app.get(
  "/api/health",
  async (_req, res) => {
    let database = false;

    if (db) {
      const { error } = await db
        .from("whatsapp_sessions")
        .select("id")
        .limit(1);

      database = !error;
    }

    res.json({
      status: "ok",
      service: "orderi-server",
      timestamp:
        new Date().toISOString(),
      database,
      liveConnections:
        sseClients.size
    });
  }
);

/* =========================================================
   WHATSAPP SSE STREAM
========================================================= */

app.get(
  "/api/whatsapp/stream",
  async (req, res) => {
    res.setHeader(
      "Content-Type",
      "text/event-stream"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    res.setHeader(
      "X-Accel-Buffering",
      "no"
    );

    res.flushHeaders();

    sseClients.add(res);

    let recentOrders: any[] = [];

    if (db) {
      const { data } = await db
        .from("orders")
        .select("*")
        .order("received_at", {
          ascending: false
        })
        .limit(10);

      recentOrders = (data || []).map(
        (o: any) => ({
          id: o.id,
          from: o.from_area,
          to: o.to_area,
          price: Number(o.price),
          rawText: o.raw_text,
          groupName: o.group_name,
          senderName: o.sender_name,
          senderPhone: o.sender_phone,
          receivedAt: o.received_at,
          confidence: o.confidence,
          type: o.type,
          notes: o.notes,
          status: o.status,
          source: o.source,
          isDirectPrivate:
            o.is_direct_private
        })
      );
    }

    res.write(
      `data: ${JSON.stringify({
        type: "CONNECTED",
        connectedAt:
          new Date().toISOString(),
        clientsCount:
          sseClients.size,
        recentOrders
      })}\n\n`
    );

    const heartbeat =
      setInterval(() => {
        try {
          res.write(
            `: ping ${Date.now()}\n\n`
          );
        } catch {
          clearInterval(heartbeat);
          sseClients.delete(res);
        }
      }, 20000);

    req.on("close", () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  }
);

/* =========================================================
   WEBHOOK
========================================================= */

async function handleWebhook(
  req: Request,
  res: Response
) {
  const expected =
    process.env.ORDERI_WEBHOOK_SECRET;

  if (
    expected &&
    req.headers[
      "x-orderi-webhook-secret"
    ] !== expected
  ) {
    return res.status(401).json({
      success: false,
      error: "Invalid webhook secret"
    });
  }

  try {
    const result =
      await captureIncoming(
        req.body || {},
        req.query || {}
      );

    res.json({
      success: true,
      message:
        "تم استلام الرسالة ومعالجتها",
      ...result,
      clientsNotified:
        sseClients.size
    });
  } catch (e: any) {
    res.status(400).json({
      success: false,
      error:
        e?.message ||
        "Webhook error"
    });
  }
}

app.post(
  "/api/whatsapp/webhook",
  handleWebhook
);

app.post(
  "/api/orders/webhook",
  handleWebhook
);

app.get(
  "/api/whatsapp/webhook",
  handleWebhook
);

/* =========================================================
   ANDROID NOTIFICATION LISTENER
========================================================= */

app.post(
  "/api/android/notifications",
  async (req, res) => {
    req.body = {
      ...req.body,
      source:
        "android_notification_listener"
    };

    return handleWebhook(req, res);
  }
);

/* =========================================================
   ANDROID LISTENER CONFIG
========================================================= */

app.get(
  "/api/android/listener-config",
  (req, res) => {
    const protocol =
      req.headers[
        "x-forwarded-proto"
      ] === "https"
        ? "https"
        : req.protocol;

    const host =
      req.get("host") ||
      `localhost:${PORT}`;

    const endpointUrl =
      `${protocol}://${host}/api/android/notifications`;

    res.json({
      appName:
        "Orderi Radar Android Bridge",

      targetPackage:
        "com.whatsapp",

      targetPackageBusiness:
        "com.whatsapp.w4b",

      endpointUrl,

      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      }
    });
  }
);

/* =========================================================
   WHATSAPP STATUS
========================================================= */

app.get(
  "/api/whatsapp/status",
  async (_req, res) => {
    let count = 0;

    if (db) {
      const { count: c } =
        await db
          .from("orders")
          .select("*", {
            count: "exact",
            head: true
          });

      count = c || 0;
    }

    res.json({
      status: "active",

      session:
        session.status,

      liveConnections:
        sseClients.size,

      recentWebhookOrdersCount:
        count,

      timestamp:
        new Date().toISOString()
    });
  }
);

/* =========================================================
   RECENT ORDERS
========================================================= */

app.get(
  "/api/whatsapp/recent",
  async (_req, res) => {
    const database =
      requireDb(res);

    if (!database) return;

    const { data, error } =
      await database
        .from("orders")
        .select("*")
        .order("received_at", {
          ascending: false
        })
        .limit(50);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,

      orders: (data || []).map(
        (o: any) => ({
          id: o.id,
          from: o.from_area,
          to: o.to_area,
          price: Number(o.price),
          rawText: o.raw_text,
          groupName: o.group_name,
          senderName: o.sender_name,
          senderPhone:
            o.sender_phone,
          receivedAt:
            o.received_at,
          confidence:
            o.confidence,
          type: o.type,
          notes: o.notes,
          status: o.status,
          source: o.source,
          isDirectPrivate:
            o.is_direct_private
        })
      )
    });
  }
);

/* =========================================================
   DISCOVERED WHATSAPP GROUPS
========================================================= */

app.get(
  "/api/whatsapp/discovered-groups",
  async (_req, res) => {
    const database =
      requireDb(res);

    if (!database) return;

    const { data, error } =
      await database
        .from("discovered_group_links")
        .select("*")
        .order("captured_at", {
          ascending: false
        })
        .limit(100);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,

      groupLinks: (data || []).map(
        (g: any) => ({
          id: g.id,
          url: g.url,
          inviteCode:
            g.invite_code,
          title: g.title,
          senderName:
            g.sender_name,
          senderPhone:
            g.sender_phone,
          sourceGroup:
            g.source_group,
          rawText:
            g.raw_text,
          capturedAt:
            g.captured_at,
          status:
            g.status,
          isMonitored:
            g.is_monitored
        })
      )
    });
  }
);

/* =========================================================
   BROADCAST REPLY
========================================================= */

app.post(
  "/api/whatsapp/broadcast-reply",
  async (req, res) => {
    const {
      broadcastId,
      replyText,
      targetGroups = [],
      originalText = ""
    } = req.body || {};

    if (!replyText?.trim()) {
      return res.status(400).json({
        success: false,
        error: "نص الرد فارغ."
      });
    }

    const payload = {
      type:
        "BROADCAST_REPLY_SENT",

      broadcastId:
        broadcastId ||
        `bcast-${Date.now()}`,

      replyText:
        replyText.trim(),

      targetGroups:
        Array.isArray(targetGroups)
          ? targetGroups
          : [targetGroups],

      originalText,

      sentAt:
        new Date().toISOString(),

      isGatewayConnected:
        session.status ===
        "connected"
    };

    if (db) {
      await db
        .from("broadcasts")
        .upsert({
          id:
            payload.broadcastId,

          reply_text:
            payload.replyText,

          target_groups:
            payload.targetGroups,

          original_text:
            payload.originalText,

          sent_at:
            payload.sentAt
        });
    }

    broadcast(payload);

    await persistEvent(
      "BROADCAST_REPLY_SENT",
      payload
    );

    res.json({
      success: true,

      message:
        session.status === "connected"
          ? "تم تجهيز الرد عبر جلسة واتساب المتصلة."
          : "تم حفظ الرد وإرساله إلى عملاء Orderi المتصلين.",

      ...payload,

      clientsNotified:
        sseClients.size
    });
  }
);

/* =========================================================
   WHATSAPP SESSION
========================================================= */

app.get(
  "/api/whatsapp/session",
  async (_req, res) => {
    if (!session.qrCodeDataUrl) {
      await generateQR();
    }

    res.json({
      success: true,

      session: {
        ...session,
        liveClients:
          sseClients.size
      }
    });
  }
);

/* =========================================================
   REFRESH QR
========================================================= */

app.post(
  "/api/whatsapp/session/refresh-qr",
  async (_req, res) => {
    await generateQR();

    broadcast({
      type:
        "SESSION_QR_REFRESHED",
      session
    });

    res.json({
      success: true,
      message:
        "تم توليد QR جديد",
      session
    });
  }
);

/* =========================================================
   PAIR WHATSAPP SESSION
========================================================= */

app.post(
  "/api/whatsapp/session/pair",
  async (req, res) => {
    session.status =
      "connected";

    session.connectedPhone =
      req.body?.phoneNumber ||
      null;

    session.connectedAt =
      new Date().toISOString();

    session.deviceName =
      req.body?.deviceName ||
      "Orderi Radar Gateway";

    session.lastSyncAt =
      new Date().toISOString();

    await saveSession();

    const payload = {
      type:
        "SESSION_CONNECTED",
      session
    };

    broadcast(payload);

    res.json({
      success: true,

      message:
        "تم تسجيل حالة الجلسة كمتصلة.",

      session
    });
  }
);

/* =========================================================
   DISCONNECT WHATSAPP
========================================================= */

app.post(
  "/api/whatsapp/session/disconnect",
  async (_req, res) => {
    session.status =
      "disconnected";

    session.connectedPhone =
      null;

    session.connectedAt =
      null;

    await generateQR();

    broadcast({
      type:
        "SESSION_DISCONNECTED",
      session
    });

    res.json({
      success: true,

      message:
        "تم فصل الجلسة وتوليد QR جديد.",

      session
    });
  }
);

/* =========================================================
   AI ORDER MATCHING
========================================================= */

app.post(
  "/api/ai/evaluate-match",
  async (req, res) => {
    const b = req.body || {};

    const price =
      Number(b.price || 0);

    const filter =
      b.filter || {};

    const minPrice =
      Number(
        filter.minimumPrice ?? 2
      );

    const from =
      String(b.from || "");

    const to =
      String(b.to || "");

    const startAreas =
      Array.isArray(
        filter.startAreas
      )
        ? filter.startAreas
        : [];

    const destinations =
      Array.isArray(
        filter.destinations
      )
        ? filter.destinations
        : [];

    let score = 60;

    const matched: string[] = [];
    const unmatched: string[] = [];
    const redFlags: string[] = [];

    /* -------------------------------------------------------
       PRICE
    ------------------------------------------------------- */

    if (price >= minPrice) {
      score += 20;

      matched.push(
        `السعر ${price} د.ب يحقق الحد الأدنى ${minPrice} د.ب`
      );
    } else {
      score -= 20;

      unmatched.push(
        `السعر ${price} د.ب أقل من الحد الأدنى ${minPrice} د.ب`
      );
    }

    /* -------------------------------------------------------
       START AREA
    ------------------------------------------------------- */

    if (
      !startAreas.length ||
      startAreas.some(
        (x: string) =>
          from.includes(x) ||
          x.includes(from)
      )
    ) {
      score += 10;

      matched.push(
        "منطقة الاستلام متوافقة"
      );
    } else {
      unmatched.push(
        "منطقة الاستلام خارج التفضيلات"
      );
    }

    /* -------------------------------------------------------
       DESTINATION
    ------------------------------------------------------- */

    if (
      !destinations.length ||
      destinations.some(
        (x: string) =>
          to.includes(x) ||
          x.includes(to)
      )
    ) {
      score += 10;

      matched.push(
        "الوجهة متوافقة"
      );
    } else {
      unmatched.push(
        "الوجهة خارج التفضيلات"
      );
    }

    score = Math.max(
      0,
      Math.min(100, score)
    );

    const verdict =
      score >= 90
        ? "excellent"
        : score >= 75
        ? "good"
        : score >= 50
        ? "warning"
        : "rejected";

    res.json({
      success: true,

      data: {
        score,

        verdict,

        verdictLabel:
          verdict === "excellent"
            ? "مطابق ومربح جداً ⭐"
            : verdict === "good"
            ? "مطابق ومناسب ✓"
            : verdict === "warning"
            ? "مطابق جزئياً مع محاذير ⚠️"
            : "غير مطابق لشروطك ❌",

        summary:
          `تم تقييم الطلب بنسبة ${score}% بناءً على السعر والمناطق.`,

        matchedConditions:
          matched,

        unmatchedConditions:
          unmatched,

        redFlags,

        captainAdvice:
          score >= 75
            ? "الطلب مناسب للقبول."
            : "راجع السعر والمسافة قبل القبول.",

        detectedDetails: {
          itemType:
            "شحنة عامة",

          urgency:
            /عاجل|فوري|حالا|حالاً/.test(
              String(
                b.rawText || ""
              )
            )
              ? "فوري"
              : "اعتيادي",

          paymentMethod:
            /بنفت|BenefitPay/i.test(
              String(
                b.rawText || ""
              )
            )
              ? "BenefitPay"
              : /كاش|نقد/i.test(
                  String(
                    b.rawText || ""
                  )
                )
              ? "كاش"
              : "غير محدد",

          specialNotes: ""
        },

        analyzedAt:
          new Date().toISOString()
      }
    });
  }
);

/* =========================================================
   ROOT
========================================================= */

app.get(
  "/",
  (_req, res) => {
    res.type("html").send(`
      <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>Orderi Server</title>

          <style>
            body {
              font-family: Arial;
              background: #f7f7f7;
              padding: 40px;
            }

            code {
              background: #eee;
              padding: 4px 8px;
              border-radius: 6px;
            }
          </style>
        </head>

        <body>
          <h1>Orderi Server</h1>

          <p>
            الحالة:
            <b>Online</b>
          </p>

          <p>
            Database:
            <code>/api/health</code>
          </p>

          <p>
            SSE:
            <code>/api/whatsapp/stream</code>
          </p>
        </body>
      </html>
    `);
  }
);

/* =========================================================
   BOOT
========================================================= */

async function boot() {
  await loadSession();

  app.listen(
    PORT,
    "0.0.0.0",
    () => {
      console.log(
        `[Orderi] server listening on 0.0.0.0:${PORT}`
      );

      console.log(
        `[Orderi] Supabase: ${
          db
            ? "configured"
            : "NOT configured"
        }`
      );
    }
  );
}

boot().catch((err) => {
  console.error(err);
  process.exit(1);
});
