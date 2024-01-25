import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";
import styles from "@/styles/Home.module.css";
import LoginOAuth2 from "@okteto/react-oauth2-login";
import { Chessboard } from "react-chessboard";
import { Button, Flex, Stack } from "@mantine/core";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import Link from "next/link";
import { Chess } from "chess.js";
import { readStream } from "@/util";
import { Profile } from "@/components/Profile";
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [cookies, setCookie, removeCookie] = useCookies([
    "verify",
    "access_token",
  ]);
  const [user, setUser] = useState<null | any>(null);

  const [game, setGame] = useState(new Chess());
  const streamGame = async () => {
    const start = await fetch(
      `https://lichess.org/api/user/${user.username}/current-game?pgnInJson=true`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${cookies.access_token.access_token}`,
        },
      }
    );

    const text = JSON.parse(await start.text());
    game.loadPgn(text.moves);
    console.log("text", text.id);
    const stream = fetch(
      `https://lichess.org/api/board/game/stream/${text.id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.access_token.access_token}`,
        },
      }
    );
    // or any other ND-JSON endpoint such as:
    // const stream = fetch('https://lichess.org/api/games/user/neio',{headers:{Accept:'application/x-ndjson'}});

    const onMessage = (obj: any) => {
      setupGame(obj.moves);
    };
    const onComplete = () => console.log("The stream has completed");
    stream.then(readStream(onMessage)).then(onComplete);
  };
  const setupGame = (uci: string) => {
    console.log("called");
    if (uci) {
      const moves = uci.split(" ");
      const chess = new Chess();
      moves.map((move) => {
        let orig = move.substring(0, 2);
        let dest = move.substring(2, 4);
        console.log("orig", orig);
        console.log("dest", dest);
        chess.move({ from: orig, to: dest, promotion: "q" });
      });
      setGame(chess);
    }
  };
  useEffect(() => {
    if (user) {
      streamGame();
    }
  }, [user]);

  const [challenge, setChallenge] = useState<null | any>(null);
  const router = useRouter();

  const getUser = async () => {
    if (cookies.access_token) {
      console.log("cookies", cookies.access_token);
      const accountRes = await fetch(`https://lichess.org/api/account`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.access_token.access_token}`,
        },
      });
      if (accountRes.ok) {
        const accountJson = await accountRes.json();
        setUser(accountJson);
      }
    } else {
      console.log("cookies", cookies.verify);
      if (router.query.code && cookies.verify) {
        const res = await fetch(
          `/api/login?code=${router.query.code}&verify=${cookies.verify}`
        );
        if (res.ok) {
          removeCookie("verify");
          const json = await res.json();
          setCookie("access_token", json.token);
          console.log("CLIENT RESPONSE", json);
        }
      }
    }
  };
  useEffect(() => {
    getUser();
  }, [router.query, cookies.verify]);
  return (
    <Stack align="center" justify="center">
      <Flex direction="row">
        <Profile />
      </Flex>
      {user && (
        <Button
          disabled={challenge}
          onClick={async () => {
            const res = await fetch(`https://lichess.org/api/racer`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${cookies.access_token.access_token}`,
              },
            });
            if (res.ok) {
              const json = await res.json();
              console.log("json", json);
              setChallenge(json);
            }
          }}
        >
          Generate Challenge
        </Button>
      )}
      {challenge && (
        <Link
          passHref
          href={challenge.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          Join challenge
        </Link>
      )}
      <Flex direction="row" align="center">
        <Chessboard position={game.fen()} boardWidth={400} id={"helloworld"} />
      </Flex>
    </Stack>
  );
}
