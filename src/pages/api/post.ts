// pages/api/post.ts

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../prisma/client";
// Assuming a function that gets signer_uuid based on userId
// Replace this with your actual logic
async function getSignerUuidForUserId(user_id: string): Promise<string | null> {
  // Implement the logic to get signer_uuid for the given userId
  // For example, this might involve querying your database

  const existing_signer = await prisma.neynarInfo.findFirst({
    where: { user_id },
  });

  return existing_signer?.signer_uuid ?? null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { user_id, text, parent_url } = req.body;

    try {
      // Get signer_uuid for the given userId
      const signerUuid = await getSignerUuidForUserId(user_id.toString());

      if (!signerUuid) {
        throw new Error("Signer UUID not found for the given user ID.");
      }

      // Update request body with signer_uuid
      const requestBody = {
        signer_uuid: signerUuid,
        text: text,
        parent: parent_url,
        channel_id: "chess",
      };

      const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
        method: "POST",
        headers: {
          accept: "application/json",
          api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY,
          "content-type": "application/json",
        } as any,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      res.status(200).json(data);
    } catch (error) {
      console.log("error", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
