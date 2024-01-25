import type { NextApiRequest, NextApiResponse } from "next";
import { sha256 } from "js-sha256";
import base64url from "base64url";
import { base64URLEncode } from "../../util";
import { ethers } from "ethers";
import { useCookies } from "react-cookie";
type Data = {
  json: any;
  token: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    const { code, verify } = req.query;

    console.log("code", code);
    console.log("verify", verify);
    const postData = {
      grant_type: "authorization_code",
      code: code,
      code_verifier: verify,
      redirect_uri: "http://localhost:3000/",
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
      console.log("json", json);
      const accountRes = await fetch(`https://lichess.org/api/account`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${json.access_token}`,
        },
      });
      if (accountRes.ok) {
        const accountJson = await accountRes.json();
        console.log("account json", accountJson);
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
