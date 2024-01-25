import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  console.log(`reqbody: ${req.body.selfSignedToken}`);
  const selfSignedToken = req.body.selfSignedToken;
  console.log(req.body.payload);
  console.log(selfSignedToken);
try {


  const response = await fetch("https://api.farcaster.xyz/v2/auth", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${selfSignedToken}`,
    },
    body: req.body.payload,
  });
  
  const data = await response.json();
  console.log('data res',data)
  res.status(200).json({ delete: data.result });
}
catch(e) {
  console.log(e)
  res.status(500).json({ error: e });
}
};