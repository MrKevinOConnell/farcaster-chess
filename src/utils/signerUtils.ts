import { fetcher } from "@/util";
import prisma from "../../prisma/client";
import { generate_signature } from "./neynarSigner";

export const headers = {
  api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY,
  "Content-Type": "application/json",
};

export const getUserByVerification = async (address: string) => {
  const endpoint = `https://api.neynar.com/v1/farcaster/user-by-verification?api_key=${process.env.NEYNAR_KEY}&address=${address}`;
  try {
    const data = await fetcher(endpoint);
    return data?.result?.user;
  } catch (error) {
    console.error({ error });
    return null;
  }
};

export const getUserByFid = async (fid: number) => {
  const endpoint = `https://api.neynar.com/v1/farcaster/user?api_key=${process.env.NEYNAR_KEY}&fid=${fid}`;
  try {
    const data = await fetcher(endpoint);
    return data?.result?.user;
  } catch (error) {
    console.error({ error });
    return null;
  }
};

/**
 * This function creates and then registers a farcaster signer from neynar's API
 */
export async function createSigner() {
  try {
    const endpoint = "https://api.neynar.com/v2/farcaster/signer";
    const options = { method: "POST", headers };
    // create the signer from neynar's API
    const { signer_uuid, public_key } = await fetcher(endpoint, options);
    if (!public_key) throw new Error("No public key");
    // generate a signature
    const { signature, deadline, app_fid } = (await generate_signature(
      public_key
    )) as any;
    // now we register that signer with neynar
    const register_endpoint =
      "https://api.neynar.com/v2/farcaster/signer/signed_key";
    const body = JSON.stringify({ signer_uuid, signature, app_fid, deadline });
    const register_options = { ...options, body };
    const registered_signer = await fetcher(
      register_endpoint,
      register_options
    );
    // return the registered signer.
    return { ...registered_signer, public_key: undefined, deadline };
  } catch (err) {
    console.log(err);
    return null;
  }
}

/**
 * Saves a signer to the database
 */
export function saveSigner(props: any) {
  const { user_id } = props;
  try {
    return prisma.neynarInfo.upsert({
      where: { user_id },
      create: props,
      update: props,
    });
  } catch (err) {
    console.error("Error in saveSigner:", err);
    throw new Error("Error saving signer information");
  }
}
