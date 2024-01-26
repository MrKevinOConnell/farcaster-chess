import { mnemonicToAccount } from "viem/accounts"; // Adjust the path if "viem/accounts" is a local file.

export async function generate_signature(public_key: any) {
  // get farcaster vars from env
  const requestFid = parseInt(process.env.app_fid as string, 10);
  const account = mnemonicToAccount(process.env.app_phrase as string); // Your app's mnemonic
  const deadline = Math.floor(Date.now() / 1000) + 31536000; // signature is valid for 1 year from now
  const key = public_key;

  // create the signature
  try {
    const signature = (await account.signTypedData({
      domain,
      types: { SignedKeyRequest },
      primaryType: "SignedKeyRequest",
      message: {
        requestFid: BigInt(requestFid),
        key,
        deadline: BigInt(deadline),
      },
    })) as any;

    return {
      signature,
      deadline,
      app_fid: requestFid,
    };
  } catch (err) {
    console.log(err);
    return null;
  }
}

const domain = {
  name: "Farcaster SignedKeyRequestValidator",
  version: "1",
  chainId: 10,
  verifyingContract: "0x00000000fc700472606ed4fa22623acf62c60553",
} as const;

const SignedKeyRequest = [
  { name: "requestFid", type: "uint256" },
  { name: "key", type: "bytes" },
  { name: "deadline", type: "uint256" },
] as const;
