import { Metadata } from "next";
import prisma from "./../../../prisma/client";
import Link from "next/link";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Eventcaster RSVP test",
    description: "Test event",
    openGraph: {
      title: "Chess Match",
      images: [`${process.env.NEXT_PUBLIC_URL}/api/image`],
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": `${process.env.NEXT_PUBLIC_URL}/api/image?gameId=KNevuQW1`,
      "fc:frame:button:1": "RSVP",
      //   "fc:frame:post_url": `${process.env.HOST}/api/match`,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? ""),
  };
}

export default async function Page({ params }: { params: { match: string } }) {
  console.log("params", params);
  const game = await prisma.lichessGame.findUnique({
    where: { id: params.match },
  });
  if (!game) {
    throw new Error("Game not found");
  }
  let fen = game.completedFen;
  // if (!fen) {
  //   try {
  //     const response = await fetch(
  //       `https://lichess.org/game/export/${params.match}`,
  //       {
  //         headers: { Accept: "application/json" },
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error("Failed to fetch game data");
  //     }

  //     const gameData = await response.json();
  //     const gameFen = gameData.moves
  //       .map((move: any) => move.san)
  //       .join(" ")
  //       .trim();
  //     await prisma.lichessGame.update({
  //       where: { id: params.match },
  //       data: { completedFen: gameFen },
  //     });
  //     fen = gameFen;
  //   } catch (error) {
  //     console.error(error);
  //   }
  //}
  return (
    <div className="col-fs-c w-full pt-20">
      <div
        className="col w-full border-2 border-slate-400 p-4"
        style={{ maxWidth: 540 }}
      >
        <h1
          className="text-xl font-bold text-slate-800"
          style={{ fontSize: 36 }}
        >
          The best chess match ever
        </h1>

        <div></div>
      </div>
    </div>
  );
}
