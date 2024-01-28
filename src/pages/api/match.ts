// @ts-ignore
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../prisma/client";

export const revalidate = 0;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const fid = req.body?.untrustedData?.fid;
      const { hash } = req.body?.untrustedData.castId;

      console.log({ fid, hash });

      if (!fid || !hash) {
        return res.status(400).send("Invalid message");
      }
      /*
    <meta name="fc:frame:button:1" content="Previous">
                <meta name="fc:frame:button:2" content="Next">
*/
      return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Test Event</title>
                <meta property="og:title" content="Chess Game">
                <meta property="og:image" content="${process.env.NEXT_PUBLIC_URL}/api/image">
                <meta name="fc:frame" content="vNext">
                <meta name="fc:frame:image" content="${process.env.NEXT_PUBLIC_URL}/api/image">
            
            </head>
            <body>
                <h1>Chess Game</h1>
              <img src="${process.env.NEXT_PUBLIC_URL}/api/image" />
            </html>
          `);
    } catch (e: unknown) {
      // @ts-expect-error
      return res.status(400).send(`Failed to validate message: ${e.message}`);
    }
  } else {
    return res.status(400).send("Invalid method");
  }
}