import { NextRequest, NextResponse } from "next/server";

import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../prisma/client";
import { fetcher, readNeynarStream } from "@/util";
import { createSigner, headers, saveSigner } from "@/utils/signerUtils";

/**
 * This route handles both GET and POST requests for neynar signers.
 * GET: Checks if a user has a signer and returns it, or creates a new one if not.
 * POST: Updates signer information when approved in the Warpcast app.
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case "GET":
      return await handleGetRequest(req, res);
    case "POST":
      return await handlePostRequest(req, res);
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function handleGetRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { user_id } = req.query; // or req.body, depending on how user_id is sent
    // first, check if the user has a valid signer already
    const existing_signer = await prisma.neynarInfo.findUnique({
      where: { user_id: user_id as string },
    });
    // if there's a signer, we check neynar api for changes and return
    if (existing_signer) {
      const neynar_endpoint =
        "https://api.neynar.com/v2/farcaster/signer?signer_uuid=" +
        existing_signer.signer_uuid;
      const neynar_data = (await fetcher(neynar_endpoint, { headers })) ?? {};
      // return the combined data
      return res.json({ ...existing_signer, ...neynar_data });
    } else {
      // if no signer exists, we create one by calling the neynar API
      const new_signer = await createSigner();

      // make sure to save the signer to the database for future use.
      const saved_signer = await saveSigner({ ...new_signer, user_id });

      // return the saved signer
      return res.json(saved_signer);
    }
  } catch (err) {
    return res.json({ error: err });
  }
}

async function handlePostRequest(req: NextApiRequest, res: NextApiResponse) {
  const data = JSON.parse(req.body);

  const { user_id } = req.query;

  if (!data?.fid) return res.json({ error: "No FID included." });
  if (!data?.status) {
    return res.json({ error: 'Status must be "approved".' });
  }

  // update the neynar_info table
  const signer = await prisma.neynarInfo.update({
    where: { user_id: user_id as string },
    data,
  });
  return res.json(signer);
}

// Helper functions like mapVerifications can be placed here

export const revalidate = 0;
