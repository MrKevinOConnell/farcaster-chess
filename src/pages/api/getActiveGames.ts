import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "../../../prisma/client";
// Define a type for your response data
type GameInfo = {
  username: string;
  currentGameId: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GameInfo[]>
) {
  try {
    // Fetch usernames and their active game IDs from the database
    const userInfos = await prisma.lichessInfo.findMany({
      select: {
        username: true,
      },
    });

    const userIds = userInfos.map((gameInfo) => gameInfo.username).join(",");

    const users = await fetch(
      `https://lichess.org/api/users/status?ids=${userIds}&withGameIds=true`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    const usersjson = await users.json();

    const usersPlaying = usersjson
      .filter((user: any) => user.playingId)
      .map((user: any) => {
        return {
          username: user.name,
          currentGameId: user.playingId,
        };
      });

    res.status(200).json(usersPlaying);
  } catch (error) {
    console.error("Request error", error);
    res.status(500).json([]);
  }
}
