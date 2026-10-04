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

app.get("/", (req, res) => {
  res.json({
    service: "Orderi Server",
    status: "online"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Orderi Server running on port ${PORT}`);
});