import dotenv from "dotenv";
dotenv.config({ override: true });
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Request } from "express";

export interface AppUser {
  id: string;
  username: string;
  password_hash: string;
  phone: string | null;
  is_active: boolean;
  bound_device_id: string | null;
  last_login_at: string | null;
  last_seen_at: string | null;
  created_at: string;
}

export interface DeviceRecord {
  id: string;
  device_id: string;
  user_id: string;
  username: string;
  device_name: string;
  app_version: string;
  is_blocked: boolean;
  last_active_at: string;
  created_at: string;
}

export interface ActivationCode {
  id: string;
  code: string;
  plan_name: string;
  duration_days: number;
  is_vip: boolean;
  features: string[];
  is_used: boolean;
  used_by: string | null;
  used_by_username: string | null;
  used_at: string | null;
  expires_at: string | null;
  is_cancelled: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  username: string;
  activation_code_id: string | null;
  plan_name: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  updated_at: string;
}

export interface OrderRecord {
  id: string;
  captain_id: string | null;
  from_area: string;
  to_area: string;
  pickup_area: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  destination: string | null;
  price: number | null;
  distance_km: number | null;
  raw_text: string | null;
  source: string;
  source_group: string | null;
  status: string;
  created_at: string;
  received_at: string;
}

export interface SystemLog {
  id: string;
  action: string;
  user_id: string | null;
  username: string | null;
  details: string;
  ip: string | null;
  status: "success" | "warning" | "error";
  created_at: string;
}

export interface SystemAlert {
  id: string;
  type: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  is_read: boolean;
  metadata?: any;
  created_at: string;
}

export interface BiometricCredential {
  id: string;
  credential_id: string;
  device_name: string;
  username: string;
  created_at: string;
}

export interface WhatsAppSessionRecord {
  id: string;
  status: string;
  qr_code_data_url: string | null;
  pairing_code: string | null;
  connected_phone: string | null;
  connected_at: string | null;
  device_name: string;
  battery_level: number;
  groups_monitored_count: number;
  private_chats_monitored_count: number;
  total_orders_captured: number;
  last_sync_at: string | null;
  listener_service_active: boolean;
  updated_at: string;
}

export interface AdminAccount {
  username: string;
  password_hash: string;
  updated_at: string;
}

export function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export function generateActivationCode(): string {
  const part = () => crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${part()}-${part()}`;
}

export function normalizeUsername(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

/* =========================================================
   REAL PRODUCTION STORE (NO HARDCODED MOCKS / SEED DEMOS)
========================================================= */

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "orderi_store.json");

export const memoryStore = {
  admin_credentials: {
    username: process.env.ADMIN_USERNAME || "admin",
    password_hash: hash(process.env.ADMIN_PASSWORD || "OrderiAdmin2026!"),
    updated_at: new Date().toISOString(),
  } as AdminAccount,

  // Real data collections - start completely empty for actual operational use
  app_users: [] as AppUser[],
  devices: [] as DeviceRecord[],
  activation_codes: [] as ActivationCode[],
  user_subscriptions: [] as UserSubscription[],
  orders: [] as OrderRecord[],
  system_logs: [] as SystemLog[],
  system_alerts: [] as SystemAlert[],
  admin_biometrics: [] as BiometricCredential[],

  whatsapp_session: {
    id: "wa-primary-session",
    status: "idle",
    qr_code_data_url: null,
    pairing_code: "882-194",
    connected_phone: null,
    connected_at: null,
    device_name: "Orderi Server Radar",
    battery_level: 100,
    groups_monitored_count: 0,
    private_chats_monitored_count: 0,
    total_orders_captured: 0,
    last_sync_at: null,
    listener_service_active: true,
    updated_at: new Date().toISOString(),
  } as WhatsAppSessionRecord,

  get whatsapp_sessions(): WhatsAppSessionRecord[] {
    return [this.whatsapp_session];
  },
};

/* =========================================================
   DISK PERSISTENCE FOR REAL RELIABLE STORAGE
========================================================= */

export function saveStoreToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryStore, null, 2), "utf8");
  } catch (err) {
    console.error("[Orderi Store] Error persisting data to disk:", err);
  }
}

export function loadStoreFromDisk(): void {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      const loaded = JSON.parse(raw);
      if (loaded && typeof loaded === "object") {
        if (loaded.admin_credentials) memoryStore.admin_credentials = loaded.admin_credentials;
        if (Array.isArray(loaded.app_users)) memoryStore.app_users = loaded.app_users;
        if (Array.isArray(loaded.devices)) memoryStore.devices = loaded.devices;
        if (Array.isArray(loaded.activation_codes)) memoryStore.activation_codes = loaded.activation_codes;
        if (Array.isArray(loaded.user_subscriptions)) memoryStore.user_subscriptions = loaded.user_subscriptions;
        if (Array.isArray(loaded.orders)) memoryStore.orders = loaded.orders;
        if (Array.isArray(loaded.system_logs)) memoryStore.system_logs = loaded.system_logs;
        if (Array.isArray(loaded.system_alerts)) memoryStore.system_alerts = loaded.system_alerts;
        if (Array.isArray(loaded.admin_biometrics)) memoryStore.admin_biometrics = loaded.admin_biometrics;
        if (loaded.whatsapp_session) memoryStore.whatsapp_session = loaded.whatsapp_session;
        console.log("[Orderi Store] Loaded persistent operational data successfully");
      }
    }
  } catch (err) {
    console.error("[Orderi Store] Error loading data from disk:", err);
  }
}

// Initial load on import
loadStoreFromDisk();

/* =========================================================
   Event Logging & Alert Helpers
========================================================= */

export function logEvent(
  action: string,
  username: string | null,
  details: string,
  status: "success" | "warning" | "error" = "success",
  userId: string | null = null,
  req?: Request
) {
  const ip = req?.ip || req?.headers["x-forwarded-for"]?.toString() || "127.0.0.1";
  const entry: SystemLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action,
    user_id: userId,
    username,
    details,
    ip,
    status,
    created_at: new Date().toISOString(),
  };

  memoryStore.system_logs.unshift(entry);
  if (memoryStore.system_logs.length > 500) {
    memoryStore.system_logs.pop();
  }
  saveStoreToDisk();
  return entry;
}

export function createAlert(
  type: string,
  severity: "critical" | "warning" | "info",
  title: string,
  message: string,
  metadata?: any
) {
  const alert: SystemAlert = {
    id: `alt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    severity,
    title,
    message,
    is_read: false,
    metadata,
    created_at: new Date().toISOString(),
  };

  memoryStore.system_alerts.unshift(alert);
  if (memoryStore.system_alerts.length > 100) {
    memoryStore.system_alerts.pop();
  }
  saveStoreToDisk();
  return alert;
}

/* =========================================================
   Dashboard Stats Computation
========================================================= */

export function getDashboardStats() {
  const totalUsers = memoryStore.app_users.length;
  const activeUsers = memoryStore.app_users.filter((u) => u.is_active).length;
  const suspendedUsers = totalUsers - activeUsers;

  const nowTime = Date.now();
  const sevenDaysLater = nowTime + 7 * 24 * 60 * 60 * 1000;

  let expiredSubscriptions = 0;
  let expiringSoon = 0;

  for (const sub of memoryStore.user_subscriptions) {
    const exp = new Date(sub.expires_at).getTime();
    if (exp <= nowTime) {
      expiredSubscriptions++;
    } else if (exp <= sevenDaysLater) {
      expiringSoon++;
    }
  }

  const totalDevices = memoryStore.devices.length;
  const activeDevices = memoryStore.devices.filter((d) => !d.is_blocked).length;
  const blockedDevices = totalDevices - activeDevices;

  const codesTotal = memoryStore.activation_codes.length;
  const codesUsed = memoryStore.activation_codes.filter((c) => c.is_used).length;
  const codesAvailable = memoryStore.activation_codes.filter((c) => !c.is_used && !c.is_cancelled).length;

  const unreadAlerts = memoryStore.system_alerts.filter((a) => !a.is_read).length;
  const totalOrders = memoryStore.orders.length;

  const recentLogins = memoryStore.app_users
    .filter((u) => u.last_login_at)
    .sort((a, b) => new Date(b.last_login_at!).getTime() - new Date(a.last_login_at!).getTime())
    .slice(0, 5)
    .map((u) => ({
      username: u.username,
      phone: u.phone,
      last_login_at: u.last_login_at,
      bound_device_id: u.bound_device_id,
      is_active: u.is_active,
    }));

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      suspended: suspendedUsers,
    },
    subscriptions: {
      total: memoryStore.user_subscriptions.length,
      expired: expiredSubscriptions,
      expiringSoon,
    },
    devices: {
      total: totalDevices,
      active: activeDevices,
      blocked: blockedDevices,
    },
    activationCodes: {
      total: codesTotal,
      used: codesUsed,
      available: codesAvailable,
    },
    orders: {
      total: totalOrders,
    },
    alerts: {
      unread: unreadAlerts,
    },
    recentLogins,
  };
}
