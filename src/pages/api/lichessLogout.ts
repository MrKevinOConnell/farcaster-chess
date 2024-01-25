import type { NextApiRequest, NextApiResponse } from 'next'
type Data = {
    name: string
  }
export default function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
  ) {
    localStorage.clear();

    res.status(200).json({ name: 'John Doe' })
  }
  