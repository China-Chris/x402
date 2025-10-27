import { privateKeyToAccount } from 'viem/accounts';

const privateKey = '0x517197a0cd7d51ade08b4c79476071b6c5f885f5fa6a80d7515416fab3acbbdf';
const account = privateKeyToAccount(privateKey as `0x${string}`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('👤 新客户端账户');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('地址:', account.address);
console.log('私钥:', privateKey);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
