import { config } from "dotenv";
import express, { Request, Response } from "express";
import { verify, settle } from "x402/facilitator";
import {
  PaymentRequirementsSchema,
  type PaymentRequirements,
  type PaymentPayload,
  PaymentPayloadSchema,
  createConnectedClient,
  createSigner,
  SupportedEVMNetworks,
  SupportedSVMNetworks,
  Signer,
  ConnectedClient,
  SupportedPaymentKind,
  type X402Config,
} from "x402/types";

config();

const EVM_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.EVM_PRIVATE_KEY || "";
const NETWORK = (process.env.NETWORK || "hashkey-testnet") as any;

if (!EVM_PRIVATE_KEY) {
  console.error("Missing required environment variable: PRIVATE_KEY or EVM_PRIVATE_KEY");
  process.exit(1);
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🏦 x402 Facilitator for HashKey Chain");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`📍 Network: ${NETWORK}`);
console.log(`🔑 Private Key: ${EVM_PRIVATE_KEY.substring(0, 10)}...`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("");

const app = express();
app.use(express.json());

type VerifyRequest = {
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
};

type SettleRequest = {
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
};

app.get("/verify", (req: Request, res: Response) => {
  res.json({
    endpoint: "/verify",
    description: "POST to verify x402 payments",
    body: {
      paymentPayload: "PaymentPayload",
      paymentRequirements: "PaymentRequirements",
    },
  });
});

app.post("/verify", async (req: Request, res: Response) => {
  try {
    console.log("📥 Received verify request");
    const body: VerifyRequest = req.body;
    const paymentRequirements = PaymentRequirementsSchema.parse(body.paymentRequirements);
    const paymentPayload = PaymentPayloadSchema.parse(body.paymentPayload);

    console.log(`   Network: ${paymentRequirements.network}`);
    console.log(`   Scheme: ${paymentRequirements.scheme}`);

    // use the correct client/signer based on the requested network
    let client: Signer | ConnectedClient;
    if (SupportedEVMNetworks.includes(paymentRequirements.network)) {
      client = createConnectedClient(paymentRequirements.network);
    } else {
      throw new Error(`Unsupported network: ${paymentRequirements.network}`);
    }

    // verify
    const valid = await verify(client, paymentPayload, paymentRequirements);
    console.log(`   ✅ Verification result: ${valid.valid}`);
    res.json(valid);
  } catch (error: any) {
    console.error("   ❌ Verification error:", error.message);
    res.status(400).json({ error: `Invalid request: ${error.message}` });
  }
});

app.get("/settle", (req: Request, res: Response) => {
  res.json({
    endpoint: "/settle",
    description: "POST to settle x402 payments",
    body: {
      paymentPayload: "PaymentPayload",
      paymentRequirements: "PaymentRequirements",
    },
  });
});

app.get("/supported", async (req: Request, res: Response) => {
  const kinds: SupportedPaymentKind[] = [
    {
      x402Version: 1,
      scheme: "exact",
      network: NETWORK,
    },
  ];
  
  console.log("📋 Supported networks:", kinds);
  res.json({ kinds });
});

app.post("/settle", async (req: Request, res: Response) => {
  try {
    console.log("📥 Received settle request");
    const body: SettleRequest = req.body;
    const paymentRequirements = PaymentRequirementsSchema.parse(body.paymentRequirements);
    const paymentPayload = PaymentPayloadSchema.parse(body.paymentPayload);

    console.log(`   Network: ${paymentRequirements.network}`);
    console.log(`   Amount: ${paymentRequirements.maxAmountRequired}`);

    // use the correct private key based on the requested network
    let signer: Signer;
    if (SupportedEVMNetworks.includes(paymentRequirements.network)) {
      signer = await createSigner(paymentRequirements.network, EVM_PRIVATE_KEY);
    } else {
      throw new Error(`Unsupported network: ${paymentRequirements.network}`);
    }

    // settle
    console.log("   📤 Submitting transaction...");
    const response = await settle(signer, paymentPayload, paymentRequirements);
    console.log(`   ✅ Transaction submitted: ${response.txHash}`);
    res.json(response);
  } catch (error: any) {
    console.error("   ❌ Settlement error:", error.message);
    res.status(400).json({ error: `Invalid request: ${error.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Facilitator listening at http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET  /supported`);
  console.log(`   POST /verify`);
  console.log(`   POST /settle`);
  console.log("");
});
