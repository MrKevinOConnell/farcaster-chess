// @ts-ignore

import type { NextApiRequest, NextApiResponse } from "next";

export const revalidate = 0;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { match, turn, next } = req.query;
    console.log({ match, turn });

    try {
      const { buttonIndex } = req.body?.untrustedData;
      let newTurn = Number(turn);
      if (buttonIndex === 1 && newTurn !== 0) {
        newTurn = newTurn - 1;
      } else {
        newTurn = newTurn + 1;
      }
      console.log({ buttonIndex, newTurn });
      // console.log({ fid, hash });

      // if (!fid || !hash) {
      //   return res.status(400).send("Invalid message");
      // }
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
                <meta property="og:image" content="${
                  process.env.NEXT_PUBLIC_URL
                }/api/image?gameId=${match}&turn=${turn}">
                <meta name="fc:frame" content="vNext">
                <meta name="fc:frame:image" content="${
                  process.env.NEXT_PUBLIC_URL
                }/api/image?gameId=${match}&turn=${turn}">
                <meta name="fc:frame:button:1" content="${
                  newTurn !== 0 ? "PREVIOUS" : "NEXT"
                }">
               ${
                 newTurn !== 0
                   ? `<meta name="fc:frame:button:2" content="Next">`
                   : ""
               }
                <meta name="fc:frame:post_url" content="${
                  process.env.NEXT_PUBLIC_URL
                }/api/match?${match}&turn=${newTurn}&next=${
        buttonIndex === 2 && newTurn !== 0
      }">,
            </head>
            <body>
                <h1>Chess Game</h1>
              <img src="${
                process.env.NEXT_PUBLIC_URL
              }/api/image?gameId=${match}&turn=${turn}" />
            </html>
          `);
    } catch (e: unknown) {
      console.log(e);
      // @ts-expect-error

      return res.status(400).send(`Failed to validate message: ${e.message}`);
    }
  } else {
    return res.status(400).send("Invalid method");
  }
}
