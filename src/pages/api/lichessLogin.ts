import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  json: any;
  token: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    const { code, verify } = JSON.parse(req.body);

    const postData = {
      grant_type: "authorization_code",
      code: code,
      code_verifier: verify,
      redirect_uri: `${process.env.NEXT_PUBLIC_URL}/`,
      client_id: "farcasterchess",
    };
    const loginRes = await fetch(`https://lichess.org/api/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    if (loginRes.ok) {
      const json = await loginRes.json();

      const accountRes = await fetch(`https://lichess.org/api/account`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${json.access_token}`,
        },
      });
      if (accountRes.ok) {
        const accountJson = await accountRes.json();
        res.status(200).json({ json: accountJson, token: json });
      }
    } else {
      res
        .status(500)
        .json({ json: { error: loginRes.statusText }, token: null });
    }
  } catch (e) {
    console.log("error", e);
    res.status(500).send(e as any);
  }
}
