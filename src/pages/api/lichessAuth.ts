
import type { NextApiRequest, NextApiResponse } from 'next'
import pkceChallenge from 'pkce-challenge'
type Data = {
  url: any
  verifier: string
}



export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
    try {
      const challenge = pkceChallenge(128);
      if(challenge) {
        console.log('challenge',challenge)
        const loginRes = await fetch(`https://lichess.org/oauth?response_type=code&client_id=farcasterchess&redirect_uri=http://localhost:3000/&code_challenge_method=S256&code_challenge=${challenge.code_challenge}&scope=challenge%3Awrite%20challenge%3Aread%20board%3Aplay%20racer%3Awrite`)
        const url = await loginRes.url
        res.status(200).json({url,verifier: challenge.code_verifier})
        return
      }
        throw new Error("Error generating challenge");
  
    }
    catch(e) {
        console.log("error",e)
        res.status(500).send(e as any)
    }
}