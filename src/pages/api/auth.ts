import type { NextApiRequest, NextApiResponse } from "next";
export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const selfSignedToken = req.body.selfSignedToken;

    const response = await fetch("https://api.farcaster.xyz/v2/auth", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${selfSignedToken}`,
      },
      body: req.body.payload,
    });
    const data = await response.json();

    res.status(200).json({ secret: data.result.token.secret });
  } catch (e) {
    res.status(500).json({ error: e });
  }
};
