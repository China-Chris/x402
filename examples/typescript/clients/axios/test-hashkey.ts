import axios from "axios";
import { config } from "dotenv";
import { withPaymentInterceptor, decodeXPaymentResponse, createSigner, type Hex } from "x402-axios";

config();

const privateKey = process.env.PRIVATE_KEY as Hex | string;
const resourceURL = process.env.RESOURCE_SERVER_URL || "http://localhost:4021";
const endpoint = process.env.ENDPOINT_PATH || "/weather";
const network = process.env.NETWORK || "hashkey-testnet";

if (!privateKey) {
  console.error("Missing PRIVATE_KEY environment variable");
  process.exit(1);
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🧪 HashKey Chain x402 客户端测试");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`📍 网络: ${network}`);
console.log(`🌐 资源服务器: ${resourceURL}`);
console.log(`📡 端点: ${endpoint}`);
console.log("");

async function main(): Promise<void> {
  try {
    console.log("1️⃣  创建签名器...");
    const signer = await createSigner(network as any, privateKey);
    console.log("✅ 签名器已创建");
    console.log("");

    console.log("2️⃣  配置 axios 拦截器...");
    const api = withPaymentInterceptor(
      axios.create({
        baseURL: resourceURL,
      }),
      signer,
    );
    console.log("✅ 拦截器已配置");
    console.log("");

    console.log("3️⃣  发送请求...");
    const response = await api.get(endpoint);
    console.log("✅ 请求成功！");
    console.log("");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📦 响应数据:");
    console.log(JSON.stringify(response.data, null, 2));
    console.log("");

    const paymentResponse = decodeXPaymentResponse(response.headers["x-payment-response"]);
    if (paymentResponse) {
      console.log("💳 支付信息:");
      console.log(JSON.stringify(paymentResponse, null, 2));
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    console.log("🎉 测试成功！");
  } catch (error: any) {
    console.error("");
    console.error("❌ 测试失败:");
    console.error(error.message);
    if (error.response) {
      console.error("响应状态:", error.response.status);
      console.error("响应数据:", error.response.data);
    }
    process.exit(1);
  }
}

main();
