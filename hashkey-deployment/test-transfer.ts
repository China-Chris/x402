import { createPublicClient, createWalletClient, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as fs from 'fs';

// HashKey Chain Testnet
const hashkeyTestnet = {
  id: 133,
  name: 'HashKey Chain Testnet',
  network: 'hashkey-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HSK',
    symbol: 'HSK',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.hsk.xyz'],
    },
  },
};

const deployment = JSON.parse(fs.readFileSync('deployment.json', 'utf-8'));
const usdcAddress = deployment.contractAddress as `0x${string}`;
const privateKey = '0x8ad5b3c82c433bb80dda9510959e94a695b1ff5d8ae01da4fac55b05494aa0f5';

const account = privateKeyToAccount(privateKey as `0x${string}`);

const publicClient = createPublicClient({
  chain: hashkeyTestnet,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain: hashkeyTestnet,
  transport: http(),
});

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 测试简单转账');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 USDC 合约: ${usdcAddress}`);
  console.log(`👤 账户: ${account.address}`);
  console.log('');

  // 尝试简单转账（不使用 EIP-3009）
  console.log('📤 尝试转账 1 USDC 到测试地址...');
  try {
    const hash = await walletClient.writeContract({
      address: usdcAddress,
      abi: [{
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
      }],
      functionName: 'transfer',
      args: ['0x0000000000000000000000000000000000000001', parseUnits('1', 6)],
    });
    console.log(`✅ 转账交易提交: ${hash}`);
    console.log(`🔗 查看: https://testnet.hashkeyscan.io/tx/${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`✅ 转账确认: ${receipt.status === 'success' ? '成功' : '失败'}`);
  } catch (error: any) {
    console.error(`❌ 转账失败: ${error.message}`);
  }
}

main().catch(console.error);
