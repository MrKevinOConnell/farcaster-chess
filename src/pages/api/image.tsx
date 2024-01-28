// @ts-ignore
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";
import satori from "satori";
import { join } from "path";
import * as fs from "fs";
import { Chessboard } from "react-chessboard";
import prisma from "./../../../prisma/client";

const fontPath = join(process.cwd(), "Roboto-Regular.ttf");
const fontData = fs.readFileSync(fontPath);

export const revalidate = 0;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { gameId } = req.query;
    console.log("gameId", gameId);
    if (!gameId) {
      throw new Error("Game ID not provided");
    }
    const game = await prisma.lichessGame.findUnique({
      where: { id: gameId as string },
    });

    if (!game) {
      throw new Error("Game not found");
    }
    let fen = game.completedFen;
    if (typeof fen === "undefined" || !fen) {
      try {
        const { gameId } = req.query; // Or however you obtain the game ID
        const url = `https://lichess1.org/game/export/gif/white/${gameId}.gif?theme=brown&piece=cburnett`;

        try {
          const response = await fetch(url, { responseType: "arraybuffer" });
          const gifBuffer = Buffer.from(response.data);

          // Process the GIF with ImageMagick or similar
          // Example: exec(`convert -some-options ${gifBuffer} output.gif`, ...);

          // After processing, you can send the GIF back or save it and send a URL
        } catch (error) {
          console.error(error);
          res.status(500).send("Error fetching or processing the GIF");
        }

        const gameData = await response.json();
        console.log(gameData);
        const gameFen = gameData.moves
          .map((move: any) => move.san)
          .join(" ")
          .trim();
        await prisma.lichessGame.update({
          where: { id: gameId as string },
          data: { completedFen: gameFen },
        });
        fen = gameFen;
      } catch (error) {
        console.error(error);
      }
    }

    const svg = await satori(
      <div
        style={{
          justifyContent: "flex-start",
          alignItems: "center",
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "f4f4f4",
          padding: 50,
          lineHeight: 1.2,
          fontSize: 24,
        }}
      >
        <Chessboard position={fen as string} />
      </div>,
      {
        width: 600,
        height: 400,
        fonts: [
          {
            data: fontData,
            name: "Roboto",
            style: "normal",
            weight: 400,
          },
        ],
      }
    );

    // Convert SVG to PNG using Sharp
    const pngBuffer = await sharp(Buffer.from(svg)).toFormat("png").toBuffer();

    // Set the content type to PNG and send the response
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "max-age=10");
    res.send(pngBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating image");
  }
}
