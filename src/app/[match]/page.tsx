import { Metadata } from "next";
import prisma from "./../../../prisma/client";
import Link from "next/link";

import { Chessboard } from "react-chessboard";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Chess Match",
    description: "Chess is great",
    openGraph: {
      title: "Chess Match",
      images: [`${process.env.NEXT_PUBLIC_URL}/api/image`],
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": `${process.env.NEXT_PUBLIC_URL}/api/image?gameId=KNevuQW1`,
      "fc:frame:button:1": "RSVP",
      "fc:frame:post_url": `${process.env.HOST}/api/match`,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? ""),
  };
}

export default async function Page({ params }: { params: { match: string } }) {
  const game = (await prisma.lichessGame.findUnique({
    where: { id: params.match },
  })) as any;
  if (!game) {
    throw new Error("Game not found");
  }

  return (
    <div className="col-fs-c w-full pt-20">
      <div
        className="col w-full border-2 border-slate-400 p-4"
        style={{ maxWidth: 540 }}
      >
        {/* <Chessboard position={fen as string} /> */}

        <div></div>
      </div>
    </div>
  );
}
