require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT = process.env.PORT || 3000;

if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL is missing");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health
app.get("/api/health", async (req, res) => {
  res.json({
    status: "ok",
    service: "orderi-server",
    version: "1.0.0",
    database: "supabase"
  });
});

// Test Supabase connection
app.get("/api/db-health", async (req, res) => {
  try {
    const { error } = await supabase
      .from("orders")
      .select("id")
      .limit(1);

    if (error) {
      return res.status(500).json({
        status: "error",
        database: "supabase",
        message: error.message
      });
    }

    res.json({
      status: "ok",
      database: "supabase"
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

// Get orders
app.get("/api/orders", async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;

    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Math.min(Number(limit) || 100, 500));

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    res.json({
      success: true,
      count: data.length,
      orders: data
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Get one order
app.get("/api/orders/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) {
    return res.status(404).json({
      error: error.message
    });
  }

  res.json({
    success: true,
    order: data
  });
});

// Create order
app.post("/api/orders", async (req, res) => {
  try {
    const {
      source,
      source_group,
      pickup_area,
      pickup_lat,
      pickup_lng,
      destination,
      price,
      distance_km,
      raw_text,
      status
    } = req.body;

    if (!pickup_area) {
      return res.status(400).json({
        error: "pickup_area is required"
      });
    }

    const { data, error } = await supabase
      .from("orders")
      .insert({
        source: source || "whatsapp",
        source_group: source_group || null,
        pickup_area,
        pickup_lat: pickup_lat ?? null,
        pickup_lng: pickup_lng ?? null,
        destination: destination || null,
        price: price ?? null,
        distance_km: distance_km ?? null,
        raw_text: raw_text || null,
        status: status || "new"
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      order: data
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Update order
app.patch("/api/orders/:id", async (req, res) => {
  try {
    const allowed = [
      "pickup_area",
      "pickup_lat",
      "pickup_lng",
      "destination",
      "price",
      "distance_km",
      "status"
    ];

    const updates = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    res.json({
      success: true,
      order: data
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Delete order
app.delete("/api/orders/:id", async (req, res) => {
  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", req.params.id);

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json({
    success: true
  });
});


/**
 * Per-captain closure vocabulary sync. Only phrase/category/meaning are stored;
 * raw WhatsApp source messages are intentionally never accepted or persisted.
 */
const closureCategories = new Set(["taken", "completion", "gratitude", "emoji"]);

app.get("/api/closure-expressions", async (req, res) => {
  const captainPhone = String(req.query.captainPhone || "").replace(/[^0-9]/g, "").slice(-15);
  if (!captainPhone) return res.status(400).json({ error: "captainPhone is required" });

  try {
    const { data, error } = await supabase
      .from("closure_expressions")
      .select("id, phrase, category, meaning, confidence, learned_at, is_ai_learned")
      .eq("captain_phone", captainPhone)
      .order("updated_at", { ascending: false })
      .limit(500);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, expressions: data || [] });
  } catch (error) {
    res.status(500).json({ error: "Unable to load closure expressions" });
  }
});

app.post("/api/closure-expressions", async (req, res) => {
  const body = req.body || {};
  const captainPhone = String(body.captainPhone || "").replace(/[^0-9]/g, "").slice(-15);
  const phrase = typeof body.phrase === "string" ? body.phrase.trim().slice(0, 80) : "";
  const category = String(body.category || "");
  const meaning = typeof body.meaning === "string" ? body.meaning.trim().slice(0, 240) : "";
  const confidence = Math.max(0, Math.min(100, Number(body.confidence) || 0));

  if (!captainPhone || !phrase || !closureCategories.has(category)) {
    return res.status(400).json({ error: "captainPhone, phrase and a valid category are required" });
  }

  try {
    const { data, error } = await supabase
      .from("closure_expressions")
      .upsert({
        captain_phone: captainPhone,
        phrase,
        category,
        meaning,
        confidence,
        learned_at: typeof body.learnedAt === "string" ? body.learnedAt : new Date().toISOString(),
        is_ai_learned: Boolean(body.isAiLearned),
        updated_at: new Date().toISOString()
      }, { onConflict: "captain_phone,phrase" })
      .select("id, phrase, category, meaning, confidence, learned_at, is_ai_learned")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, expression: data });
  } catch (error) {
    res.status(500).json({ error: "Unable to save closure expression" });
  }
});

app.delete("/api/closure-expressions", async (req, res) => {
  const captainPhone = String(req.query.captainPhone || "").replace(/[^0-9]/g, "").slice(-15);
  const phrase = typeof req.query.phrase === "string" ? req.query.phrase.trim().slice(0, 80) : "";
  if (!captainPhone || !phrase) return res.status(400).json({ error: "captainPhone and phrase are required" });

  try {
    const { error } = await supabase
      .from("closure_expressions")
      .delete()
      .eq("captain_phone", captainPhone)
      .eq("phrase", phrase);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Unable to delete closure expression" });
  }
});

app.get("/", (req, res) => {
  res.json({
    service: "Orderi Server",
    status: "online"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Orderi Server running on port ${PORT}`);
});