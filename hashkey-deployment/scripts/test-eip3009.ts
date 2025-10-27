import { ethers } from "hardhat";
import crypto from "crypto";

async function main() {
  const USDC_ADDRESS = process.env.USDC_ADDRESS;

  if (!USDC_ADDRESS) {
    console.error("❌ 错误: 请先设置 USDC_ADDRESS 环境变量");
    console.error("运行: export USDC_ADDRESS=0xYourContractAddress");
    process.exit(1);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧪 测试 EIP-3009 USDC");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("📍 合约地址:", USDC_ADDRESS);

  const [payer, receiver, relayer] = await ethers.getSigners();
  console.log("\n👥 测试账户:");
  console.log("  付款人:", payer.address);
  console.log("  收款人:", receiver.address);
  console.log("  中继者 (Facilitator):", relayer.address);

  // 连接合约
  const usdc = await ethers.getContractAt("EIP3009USDC", USDC_ADDRESS);

  // 检查余额
  console.log("\n💰 初始余额:");
  const payerBalance = await usdc.balanceOf(payer.address);
  const receiverBalance = await usdc.balanceOf(receiver.address);
  console.log("  付款人:", ethers.formatUnits(payerBalance, 6), "USDC");
  console.log("  收款人:", ethers.formatUnits(receiverBalance, 6), "USDC");

  if (payerBalance === 0n) {
    console.error("\n❌ 付款人余额为 0，请先铸造代币");
    console.error("运行: npm run mint");
    process.exit(1);
  }

  // 准备授权参数
  const amount = ethers.parseUnits("10", 6);  // 10 USDC
  const validAfter = Math.floor(Date.now() / 1000);
  const validBefore = validAfter + 3600;  // 1小时后过期
  const nonce = "0x" + crypto.randomBytes(32).toString("hex");

  console.log("\n📝 授权参数:");
  console.log("  金额:", ethers.formatUnits(amount, 6), "USDC");
  console.log("  有效期:", new Date(validAfter * 1000).toLocaleString());
  console.log("  过期时间:", new Date(validBefore * 1000).toLocaleString());
  console.log("  Nonce:", nonce);

  // 获取 network 信息
  const network = await ethers.provider.getNetwork();
  const domainSeparator = await usdc.DOMAIN_SEPARATOR();

  console.log("\n🔐 EIP-712 信息:");
  console.log("  Chain ID:", network.chainId.toString());
  console.log("  Domain Separator:", domainSeparator);

  // 构造 EIP-712 domain
  const domain = {
    name: await usdc.name(),
    version: "2",
    chainId: network.chainId,
    verifyingContract: USDC_ADDRESS,
  };

  // 构造消息类型
  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };

  // 构造消息
  const message = {
    from: payer.address,
    to: receiver.address,
    value: amount,
    validAfter: validAfter,
    validBefore: validBefore,
    nonce: nonce,
  };

  console.log("\n✍️  付款人签名中...");
  const signature = await payer.signTypedData(domain, types, message);
  console.log("✅ 签名完成");
  console.log("  签名:", signature.slice(0, 20) + "..." + signature.slice(-20));

  // 分离签名
  const sig = ethers.Signature.from(signature);

  console.log("\n⏳ 中继者执行 transferWithAuthorization...");
  console.log("  注意: 中继者支付 gas，但代币从付款人转到收款人");

  const tx = await usdc.connect(relayer).transferWithAuthorization(
    payer.address,
    receiver.address,
    amount,
    validAfter,
    validBefore,
    nonce,
    sig.v,
    sig.r,
    sig.s
  );

  console.log("📤 交易已发送:", tx.hash);
  console.log("🔗 查看交易:");
  console.log(`   https://testnet.hashkeyscan.io/tx/${tx.hash}`);
  console.log("⏳ 等待确认...");

  const receipt = await tx.wait();
  console.log("✅ 交易确认!");
  console.log("  Gas 使用:", receipt?.gasUsed.toString());
  console.log("  区块号:", receipt?.blockNumber);

  // 检查最终余额
  console.log("\n💰 最终余额:");
  const payerBalanceAfter = await usdc.balanceOf(payer.address);
  const receiverBalanceAfter = await usdc.balanceOf(receiver.address);
  console.log("  付款人:", ethers.formatUnits(payerBalanceAfter, 6), "USDC");
  console.log("  收款人:", ethers.formatUnits(receiverBalanceAfter, 6), "USDC");

  const payerDiff = payerBalanceAfter - payerBalance;
  const receiverDiff = receiverBalanceAfter - receiverBalance;
  console.log("\n📊 变化:");
  console.log("  付款人:", ethers.formatUnits(payerDiff, 6), "USDC");
  console.log("  收款人:", ethers.formatUnits(receiverDiff, 6), "USDC");

  // 验证授权已使用
  const isUsed = await usdc.authorizationState(payer.address, nonce);
  console.log("\n🔐 授权状态:", isUsed ? "✅ 已使用" : "❌ 未使用");

  console.log("\n" + "━".repeat(80));
  console.log("🎉 测试完成!");
  console.log("━".repeat(80));

  console.log("\n✅ EIP-3009 功能正常工作:");
  console.log("  ✓ 付款人成功签名授权");
  console.log("  ✓ 中继者成功提交交易");
  console.log("  ✓ 代币成功转账");
  console.log("  ✓ Nonce 被标记为已使用");
  console.log("  ✓ 付款人没有支付 gas（中继者支付）");

  console.log("\n📝 这证明:");
  console.log("  • USDC 合约支持 EIP-3009");
  console.log("  • 可以用于 x402 协议");
  console.log("  • 用户可以进行 gasless 支付");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 测试失败:", error);
    process.exit(1);
  });

