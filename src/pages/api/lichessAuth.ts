import type { NextApiRequest, NextApiResponse } from "next";
import pkceChallenge from "pkce-challenge";
type Data = {
  url: any;
  verifier: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    const challenge = pkceChallenge(128);

    if (challenge) {
      const scope = "challenge:write challenge:read tournament:write board:play"
        .replace(":", "%3A")
        .replace(" ", "%20");

      const url = `https://lichess.org/oauth?response_type=code&client_id=farcasterchess&redirect_uri=${process.env.NEXT_PUBLIC_URL}/&code_challenge_method=S256&code_challenge=${challenge.code_challenge}&scope=${scope}`;

      res.status(200).json({ url, verifier: challenge.code_verifier });
      return;
    }
    throw new Error("Error generating challenge");
  } catch (e) {
    console.log("error", e);
    res.status(500).send(e as any);
  }
}
