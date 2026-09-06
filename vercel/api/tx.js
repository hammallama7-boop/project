// Vercel serverless function: Farcaster frame tx action for Magic Internet
// Artworks on Base mainnet (chain 8453).
// Returns an eth_sendTransaction payload the Farcaster wallet will sign.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const CONTRACT = process.env.BASE_CONTRACT || "0x001d50Fc09F34691C1EE71FF8ED411a81d2d70ba";
  const PRICE_WEI = process.env.PRICE_WEI || "300000000000000"; // 0.0003 ETH
  const CHAIN_ID = "eip155:8453";

  const calldata = "0xf0238a11"; // paidMint()

  // TX-STATUS callback (wallet submitted tx) -> simple HTML frame with explorer link
  const untrusted = req.body?.untrustedData || {};
  if (untrusted.transactionId) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Magic Internet Artworks - Minted</title>
<meta property="fc:frame" content="vNext">
<meta property="fc:frame:image" content="https://hammallama7-boop.github.io/project/magic-internet-artworks/frame/frame-banner.png">
<meta property="fc:frame:image:aspect_ratio" content="1.91:1">
<meta property="og:image" content="https://hammallama7-boop.github.io/project/magic-internet-artworks/frame/frame-banner.png">
<meta property="fc:frame:button:1" content="View on Explorer">
<meta property="fc:frame:button:1:action" content="link">
<meta property="fc:frame:button:1:target" content="https://basescan.org/tx/${untrusted.transactionId}">
</head><body><p>Minted successfully.</p></body></html>`);
  }

  // Return the tx payload
  return res.json({
    chainId: CHAIN_ID,
    method: "eth_sendTransaction",
    params: {
      to: CONTRACT,
      data: calldata,
      value: PRICE_WEI,
      abi: [
        { name: "paidMint", type: "function", stateMutability: "payable", inputs: [], outputs: [{ type: "uint256" }] }
      ]
    }
  });
};