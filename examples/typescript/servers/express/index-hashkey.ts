import { config } from "dotenv";
import express from "express";
import { paymentMiddleware, Resource, type SolanaAddress } from "x402-express";
config();

const facilitatorUrl = process.env.FACILITATOR_URL as Resource;
const payTo = process.env.ADDRESS as `0x${string}` | SolanaAddress;
const network = (process.env.NETWORK || "hashkey-testnet") as any;
const usdcAddress = process.env.USDC_ADDRESS as `0x${string}`;

if (!facilitatorUrl || !payTo || !usdcAddress) {
  console.error("Missing required environment variables:");
  console.error("- FACILITATOR_URL:", facilitatorUrl);
  console.error("- ADDRESS:", payTo);
  console.error("- USDC_ADDRESS:", usdcAddress);
  process.exit(1);
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🚀 x402 Express Facilitator for HashKey Chain");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`📍 Network: ${network}`);
console.log(`💰 Pay To: ${payTo}`);
console.log(`💵 USDC: ${usdcAddress}`);
console.log(`🌐 Facilitator URL: ${facilitatorUrl}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("");

const app = express();

app.use(
  paymentMiddleware(
    payTo,
    {
      "GET /weather": {
        // USDC amount in dollars
        price: "$0.001",
        network: network,
      },
      "/premium/*": {
        // Define atomic amounts in any EIP-3009 token
        price: {
          amount: "100000",
          asset: {
            address: usdcAddress,
            decimals: 6,
            eip712: {
              name: "USD Coin",
              version: "2",
            },
          },
        },
        network: network,
      },
    },
    {
      url: facilitatorUrl,
    },
  ),
);

app.get("/weather", (req, res) => {
  res.send({
    report: {
      weather: "sunny on HashKey Chain",
      temperature: 70,
      network: network,
      timestamp: new Date().toISOString(),
    },
  });
});

app.get("/premium/content", (req, res) => {
  res.send({
    content: "This is premium content on HashKey Chain",
    network: network,
  });
});

const PORT = 4021;
app.listen(PORT, () => {
  console.log(`✅ Server listening at http://localhost:${PORT}`);
  console.log(`📡 Test endpoint: http://localhost:${PORT}/weather`);
  console.log("");
});
