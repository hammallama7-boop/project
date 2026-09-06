require("dotenv").config({ path: __dirname + "/../.env" });
require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const path = require("path");
const { ethers } = require("ethers");

const app = express();
const PORT = process.env.PORT || 80;
const PUBLIC_BASE = process.env.PUBLIC_BASE;                     // e.g. https://xxxx.ngrok-free.app
const CONTRACT = process.env.BASE_CONTRACT || null; // set explicitly for Base
const PRICE_WEI = process.env.PRICE_WEI || String(ethers.parseEther("0.0003"));
const CHAIN_ID = process.env.CHAIN_ID || "eip155:8453";
const STATIC_ROOT = process.env.STATIC_ROOT || path.join(__dirname, "..");

const PAID_MINT_ABI = [
  { name: "paidMint", type: "function", stateMutability: "payable",
    inputs: [], outputs: [{ type: "uint256" }] }
];
const calldata = new ethers.Interface(PAID_MINT_ABI).encodeFunctionData("paidMint", []);

app.use(express.json());

// --- CORS (Frames POST is cross-origin) ---
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// --- Root serves the Base Farcaster frame page (instead of the cat viewer) ---
// Registered BEFORE express.static so it wins for "/".
app.get("/", (req, res) => {
  const framePage = path.join(STATIC_ROOT, "magic-internet-artworks", "frame-base", "index.html");
  res.sendFile(framePage);
});

// --- Static files (viewer, artwork, frame pages, everything in repo) ---
app.use(express.static(STATIC_ROOT));

// --- Frames tx endpoint ---
app.post("/api/tx", async (req, res) => {
  try {
    const untrusted = req.body.untrustedData || {};
    const trusted   = req.body.trustedData   || {};

    // --- TX-STATUS CALLBACK (wallet submitted the tx) ---
    if (untrusted.transactionId) {
      if (!PUBLIC_BASE) return res.status(503).json({ error: "PUBLIC_BASE not set" });
      // Return a simple frame HTML with the success state
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Magic Internet Artworks — Minted</title>
<meta property="fc:frame" content="vNext">
<meta property="fc:frame:image" content="https://hammallama7-boop.github.io/project/magic-internet-artworks/frame/frame-banner.png">
<meta property="fc:frame:image:aspect_ratio" content="1.91:1">
<meta property="og:image" content="https://hammallama7-boop.github.io/project/magic-internet-artworks/frame/frame-banner.png">
<meta property="fc:frame:button:1" content="View on Explorer">
<meta property="fc:frame:button:1:action" content="link">
<meta property="fc:frame:button:1:target" content="https://basescan.org/tx/${untrusted.transactionId}">
</head><body><p>Minted successfully.</p></body></html>`);
    }

    // --- BEST-EFFORT HUB VALIDATION (non-fatal) ---
    if (trusted.messageBytes) {
      try {
        const b64 = Buffer.from(trusted.messageBytes, "base64url").toString("base64");
        const hubRes = await fetch("https://hub.pinax.network/v1/frame-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageBytes: b64 })
        });
        if (!hubRes.ok) console.warn("[tx] hub validation failed:", hubRes.status);
        else            console.log("[tx] hub validation OK");
      } catch (e) { console.warn("[tx] hub validation skipped:", e.message); }
    }

    // --- TX PAYLOAD ---
    if (!CONTRACT)  return res.status(503).json({ error: "CONTRACT_ADDRESS not configured" });
    if (!PUBLIC_BASE) return res.status(503).json({ error: "PUBLIC_BASE not configured" });

    console.log("[tx] returning tx payload for contract:", CONTRACT, "price:", PRICE_WEI);
    res.json({
      chainId: CHAIN_ID,
      method: "eth_sendTransaction",
      params: {
        to: CONTRACT,
        abi: PAID_MINT_ABI,
        value: PRICE_WEI,
        data: calldata,
      }
    });
  } catch (e) {
    console.error("[tx] error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`[server] listening on :${PORT}`);
  console.log(`[server] contract:  ${CONTRACT || "(not set)"}`);
  console.log(`[server] price:     ${PRICE_WEI} wei`);
  console.log(`[server] PUBLIC_BASE: ${PUBLIC_BASE || "(set PUBLIC_BASE env to your ngrok URL)"}`);
});