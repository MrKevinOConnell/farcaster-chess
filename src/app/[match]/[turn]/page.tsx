import { Metadata } from "next";
import prisma from "../../../../prisma/client";
import Link from "next/link";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { match: string; turn: string };
}) {
  return {
    title: "Chess Match",
    description: "Chess is great",
    openGraph: {
      title: "Chess Match",
      images: [
        `${process.env.NEXT_PUBLIC_URL}/api/image?gameId=${params.match}&turn=${params.turn}`,
      ],
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": `${process.env.NEXT_PUBLIC_URL}/api/image?gameId=${params.match}&turn=${params.turn}`,
      "fc:frame:button:1": "NEXT",
      "fc:frame:post_url": `${process.env.NEXT_PUBLIC_URL}/api/match?gameId=${params.match}&turn=${params.turn}&next=true`,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? ""),
  };
}

export default async function Page({
  params,
}: {
  params: { match: string; turn: string };
}) {
  return (
    <div className="col-fs-c w-full pt-20">
      <div
        className="col w-full border-2 border-slate-400 p-4"
        style={{ maxWidth: 540 }}
      >
        {/* <Chessboard position={fen as string} /> */}
        <img
          className="w-full"
          src={`${process.env.NEXT_PUBLIC_URL}/api/image?gameId=${params.match}&turn=${params.turn}`}
        />

        <div></div>
      </div>
    </div>
  );
}
