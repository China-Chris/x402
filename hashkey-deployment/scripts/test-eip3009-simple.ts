import { ethers } from "hardhat";

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧪 测试 EIP-3009 transferWithAuthorization");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  const deployment = require("../deployment.json");
  const usdcAddress = deployment.contractAddress;
  
  // 直接使用 ABI
  const abi = [
    "function balanceOf(address) view returns (uint256)",
    "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)",
  ];
  
  const USDC = new ethers.Contract(usdcAddress, abi, ethers.provider);
  
  // 客户端账户
  const clientPrivateKey = "0x517197a0cd7d51ade08b4c79476071b6c5f885f5fa6a80d7515416fab3acbbdf";
  const clientWallet = new ethers.Wallet(clientPrivateKey);
  
  // 部署者账户
  const [deployer] = await ethers.getSigners();
  const USDCWithSigner = USDC.connect(deployer);
  
  console.log(`👤 From (客户端): ${clientWallet.address}`);
  console.log(`👤 To (资源服务器): ${deployer.address}`);
  console.log(`💵 Amount: 1000 (0.001 USDC)`);
  console.log("");

  // 检查余额
  const balance = await USDC.balanceOf(clientWallet.address);
  console.log(`💰 客户端余额: ${ethers.formatUnits(balance, 6)} USDC`);
  console.log("");

  // 准备 EIP-3009 授权
  const value = ethers.parseUnits("0.001", 6); // 1000 micro-USDC
  const validAfter = 0;
  const validBefore = Math.floor(Date.now() / 1000) + 3600;
  const nonce = ethers.hexlify(ethers.randomBytes(32));

  console.log("📝 准备授权参数...");
  console.log(`   Value: ${value.toString()}`);
  console.log(`   Nonce: ${nonce}`);
  console.log("");

  // 创建 EIP-712 消息
  const domain = {
    name: deployment.tokenName,
    version: "2",
    chainId: 133,
    verifyingContract: usdcAddress,
  };

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

  const message = {
    from: clientWallet.address,
    to: deployer.address,
    value: value,
    validAfter: validAfter,
    validBefore: validBefore,
    nonce: nonce,
  };

  console.log("✍️  签名授权...");
  const signature = await clientWallet.signTypedData(domain, types, message);
  console.log(`   Signature: ${signature}`);
  
  // 分离签名为 v, r, s
  const sig = ethers.Signature.from(signature);
  console.log(`   v: ${sig.v}`);
  console.log(`   r: ${sig.r}`);
  console.log(`   s: ${sig.s}`);
  console.log("");

  // 提交交易
  console.log("📤 提交 transferWithAuthorization...");
  try {
    const tx = await USDCWithSigner.transferWithAuthorization(
      clientWallet.address,
      deployer.address,
      value,
      validAfter,
      validBefore,
      nonce,
      sig.v,
      sig.r,
      sig.s
    );
    
    console.log(`   交易哈希: ${tx.hash}`);
    console.log(`   🔗 查看: https://testnet.hashkeyscan.io/tx/${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`   ✅ 交易确认！`);
    console.log("");

    // 检查新余额
    const newBalance = await USDC.balanceOf(clientWallet.address);
    const receiverBalance = await USDC.balanceOf(deployer.address);
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉🎉🎉 EIP-3009 测试成功！🎉🎉🎉");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`💰 客户端新余额: ${ethers.formatUnits(newBalance, 6)} USDC`);
    console.log(`💰 接收者余额: ${ethers.formatUnits(receiverBalance, 6)} USDC`);
    console.log("");
    console.log("✅ x402 在 HashKey Chain 上完全正常工作！");
    
  } catch (error: any) {
    console.error("");
    console.error("❌ 交易失败:");
    console.error(error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
