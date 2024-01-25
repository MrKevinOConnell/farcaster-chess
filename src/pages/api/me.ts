import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  console.log(`reqbody: ${req.body.userHubKey}`);
  const userHubKey = req.body.userHubKey;
  console.log(req.body.payload);
try {
    const response = await fetch('https://api.farcaster.xyz/v2/me',
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userHubKey}`
      },
    }
  );

  const data = await response.json();
  console.log('data',data.result)
  if(data.result.user) {
    res.status(200).json({ username: data.result.user.username, fid: data.result.user.fid, displayName: data.result.user.displayName, pfp: data.result.user.pfp.url });
    return
  }
  res.status(500).json({error: "there was an issue getting the user"});
}
catch(e) {
    res.status(500).json({error: e});
}
 };