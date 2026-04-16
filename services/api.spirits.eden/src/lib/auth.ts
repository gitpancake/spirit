import { verifyMessage } from 'viem';
import { getContract } from './contract';

export async function verifySignedMessage(
  message: string,
  signature: string,
  expectedSigner: string
): Promise<boolean> {
  try {
    const isValid = await verifyMessage({
      address: expectedSigner as `0x${string}`,
      message,
      signature: signature as `0x${string}`
    });
    return isValid;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

export async function checkAuthorization(
  address: string,
  action: 'mint' | 'burn' | 'setTreasury' | 'setTokenURI'
): Promise<boolean> {
  try {
    const contract = getContract();

    if (action === 'mint' || action === 'burn' || action === 'setTreasury') {
      const treasury = await contract.read.treasury();
      return address.toLowerCase() === treasury.toLowerCase();
    }

    if (action === 'setTokenURI') {
      const owner = await contract.read.owner();
      return address.toLowerCase() === owner.toLowerCase();
    }

    return false;
  } catch (error) {
    console.error('Authorization check failed:', error);
    return false;
  }
}

export function createTimestampedMessage(baseMessage: string): string {
  return `${baseMessage} | timestamp: ${Date.now()}`;
}

export function validateMessageTimestamp(message: string, maxAgeMs: number = 300000): boolean {
  const timestampMatch = message.match(/timestamp: (\d+)/);
  if (!timestampMatch) return false;
  
  const timestamp = parseInt(timestampMatch[1]);
  const now = Date.now();
  return (now - timestamp) <= maxAgeMs;
}