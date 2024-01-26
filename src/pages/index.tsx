import { Chessboard } from "react-chessboard";
import { Button, Flex, Stack } from "@mantine/core";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { Chess, Piece, Square } from "chess.js";

import ChatRoom from "@/components/ChatRoom";
import { useStore } from "@/store";
import { BoardOrientation } from "react-chessboard/dist/chessboard/types";
import { readStream } from "@/util";
import { upsertLichessInfo } from "@/utils/prismaCalls";

function formatTime(milliseconds: number) {
  if (milliseconds <= 0) {
    return "0:00.0";
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  const tenths = Math.floor((milliseconds % 1000) / 100);

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}.${tenths}`;
}

export default function Home() {
  const [gameStatus, setGameStatus] = useState("ended"); // initial status is 'active'
  const user = useStore((state: any) => state.user);
  const [boardOrientation, setBoardOrientation] =
    useState<BoardOrientation>("white");

  const setUser = useStore((state) => state.setUser);
  const [whiteTime, setWhiteTime] = useState<null | number>(null); // 5 minutes in seconds
  const [blackTime, setBlackTime] = useState<null | number>(null); // 5 minutes in seconds

  // Call this function when you want to update the user state in the store
  const updateStoreUser = async (newUserData: any) => {
    setUser(newUserData);
  };
  const [currentGameData, setCurrentGameData] = useState<any>(null); // [gameId, isUserPlaying
  const [games, setGames] = useState<any>([]);
  const [currentGameId, setCurrentGameId] = useState<null | string>(null);
  const [currentGame, setCurrentGame] = useState(new Chess());

  useEffect(() => {
    let timer: any;
    if (gameStatus === "active" && whiteTime && blackTime) {
      timer = setInterval(() => {
        if (currentGame.turn() === "w") {
          setWhiteTime((prev) => (prev && prev > 0 ? prev - 100 : 0)); // Subtract 100 milliseconds
        } else {
          setBlackTime((prev) => (prev && prev > 0 ? prev - 100 : 0)); // Subtract 100 milliseconds
        }
      }, 100); // Update every tenth of a second
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentGame, gameStatus]); // Include gameStatus in the dependency array

  const fetchChallenges = async () => {
    try {
      const response = await fetch("https://lichess.org/api/challenge", {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch challenges");
      }

      const challenges = await response.json();

      // Process and display challenges
    } catch (error) {
      console.error("Error fetching challenges:", error);
    }
  };

  const challengeUser = async (username: string) => {
    try {
      const body = {
        rated: true,
        "clock.limit": 600,
        "clock.increment": 0,
        color: "white",
        variant: "standard",
        keepAliveStream: true,
      };

      const response = await fetch(
        `https://lichess.org/api/challenge/${username}`, // Lichess API endpoint to challenge a user
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.accessToken}`, // User's access token
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to challenge user ${username}`);
      }

      const challengeInfo = await response.json();

      // Once the challenge is sent, start listening for updates
    } catch (error) {
      console.error("Error challenging user:", error);
    }
  };

  const acceptChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(
        `https://lichess.org/api/challenge/${challengeId}/accept`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to accept challenge ${challengeId}`);
      }

      const result = await response.json();

      // Process the result (e.g., redirect to game or show confirmation)
    } catch (error) {
      console.error(`Error accepting challenge ${challengeId}:`, error);
    }
  };

  const handleResign = async () => {
    // Implement the logic to send the resignation to the server
    try {
      const response = await fetch(
        `https://lichess.org/api/board/game/${currentGameId}/resign`, // Example API endpoint
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.accessToken}`, // Use the appropriate authentication method
          },
        }
      );

      if (response.ok) {
        setGameStatus("resigned"); // Update game status to 'resigned'
        // Additional logic for after successfully resigning
      } else {
        console.error("Failed to resign from the game");
      }
    } catch (error) {
      console.error("Error resigning from the game:", error);
    }
  };

  const switchGame = async (gameId: string) => {
    setCurrentGameId(gameId);
    // Fetch the game data from Lichess API
    try {
      const response = await fetch(
        `https://lichess.org/game/export/${gameId}`,
        {
          headers: { Accept: "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch game data");
      }

      const gameData = await response.json();

      setCurrentGameData(gameData);

      // Check if the user is playing in this game
      const isUserPlaying =
        gameData.players.white.user.id === user.lichessName ||
        gameData.players.black.user.id === user.lichessName;

      if (isUserPlaying) {
        // User is playing in this game, use the board API to allow moves
        // Setup the game for play
        setupGameForPlay(gameData);
      } else {
        // User is just viewing this game, set up the game for viewing
        setupGameForView(gameData);
      }
      await startStreaming(gameId, isUserPlaying);
    } catch (error) {
      console.error("Error fetching game data:", error);
    }
  };

  const startStreaming = async (gameId: string, isPlaying: boolean) => {
    const streamUrl = isPlaying
      ? `https://lichess.org/api/board/game/stream/${gameId}`
      : `https://lichess.org/api/stream/game/${gameId}`;

    try {
      const stream = fetch(streamUrl, {
        headers: isPlaying
          ? { Authorization: `Bearer ${user.accessToken}` }
          : undefined,
      });

      const onMessage = (obj: any) => {
        if (obj.type === "gameFull") {
          if (
            gameStatus !== "active" &&
            obj.state.moves &&
            obj.state.moves !== ""
          ) {
            setGameStatus("active");
          }
          setupGame(obj.state.moves);
          setWhiteTime(obj.state.wtime); // Convert milliseconds to seconds
          setBlackTime(obj.state.btime); // Convert milliseconds to seconds
        } else if (obj.status === "resign" || obj.status === "checkmate") {
          setGameStatus("ended");
        } else {
          if (gameStatus !== "active") {
            setGameStatus("active");
          }
          setupGame(obj.moves);
          setWhiteTime(obj.wtime); // Convert milliseconds to seconds
          setBlackTime(obj.btime); // Convert milliseconds to seconds
        }
      };
      const onComplete = () => {
        setGameStatus("ended");
        console.log("The stream has completed");
      };
      stream.then(readStream(onMessage)).then(onComplete);
    } catch (error) {
      console.error("Error in streaming game data:", error);
      setGameStatus("ended");
    }
  };

  const accountListening = async () => {
    const streamUrl = "https://lichess.org/api/stream/event";

    try {
      const stream = fetch(streamUrl, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });

      const onMessage = (obj: any) => {
        if (obj.type === "gameStarted") {
          setCurrentGameId(obj.id);
        } else if (obj.status === "gameEnded") {
          setGameStatus("ended");
        } else if (obj.type === "challenge") {
          //CHALLENGE ADDED
          setupGame(obj.moves);
          setWhiteTime(obj.wtime); // Convert milliseconds to seconds
          setBlackTime(obj.btime); // Convert milliseconds to seconds
        } else {
          //challenge declined or canceled
        }
      };
      const onComplete = () => {
        setGameStatus("ended");
        console.log("The stream has completed");
      };
      stream.then(readStream(onMessage)).then(onComplete);
    } catch (error) {
      console.error("Error in streaming game data:", error);
    }
  };

  useEffect(() => {
    if (user) {
      accountListening();
    }
  }, [user]);

  const setupGameForView = (data: any) => {
    // Initialize the game with the current position for viewing
    const chess = new Chess(data.fen);
    setCurrentGame(chess);

    // Set the board orientation to default (white at the bottom)
    setBoardOrientation("white");
  };

  const setupGameForPlay = async (gameData: any) => {
    // Initialize the game with the current position
    setupGame(gameData.moves);

    // Determine if the user is playing as black
    const isUserBlack = gameData.players.black.user.id === user.lichessName;

    // Set the board orientation based on the user's color
    setBoardOrientation(isUserBlack ? "black" : "white");
  };

  const fetchActiveGames = async () => {
    const response = await fetch("/api/getActiveGames"); // Replace with your actual API endpoint
    const data = await response.json();
    setGames(data);
    // Optionally, set the first game as the current game
    if (data.length > 0) {
      setCurrentGameId(data[0].currentGameId);
    }
  };

  const setupGame = (uciMoves: string) => {
    const chess = new Chess(); // Initialize a new game in the default position
    if (!uciMoves) return;
    // Split the UCI moves string into individual moves
    const moves = uciMoves.split(" ");

    // Apply each move to the game
    moves.forEach((move) => {
      chess.move(move);
    });

    // Update the game state
    setCurrentGame(chess);
  };

  useEffect(() => {
    fetchActiveGames();
  }, []);

  useEffect(() => {
    if (currentGameId) {
      switchGame(currentGameId);
    }
  }, [currentGameId, user]);

  const router = useRouter();

  const getUser = async () => {
    //WHEN DONE
    if (router.query.code && localStorage.getItem("verify")) {
      const code = router.query.code;
      const verify = localStorage.getItem("verify");

      if (code) {
        const res = await fetch("/api/lichessLogin", {
          method: "POST",
          body: JSON.stringify({ code, verify }),
        });
        const json = await res.json();

        const { username, id } = json.json;
        const { access_token, expires_in, token_type } = json.token;
        localStorage.setItem(
          "user",
          JSON.stringify({
            username,
            id,
            token: json.token,
          })
        );

        localStorage.removeItem("verify");

        if (user) {
          const updatedUser = await upsertLichessInfo(user.fid, {
            username,
            id,
            accessToken: access_token,
            expiresIn: expires_in,
            tokenType: token_type,
          });
          await updateStoreUser({
            fid: user.fid,
            username: user.username,
            lichessName: username,
            bio: user.bio,
            displayName: user.displayName,
            pfpUrl: user.pfpUrl,
            accessToken: access_token,
          });
        }
      }
    }
  };
  useEffect(() => {
    getUser();
  }, [router.query]);

  const handleMove = async (
    sourceSquare: Square,
    targetSquare: Square,
    piece: any
  ) => {
    // Create a move object
    const move = { from: sourceSquare, to: targetSquare, piece: piece };
    let uciMove = sourceSquare + targetSquare;

    // If pawn promotion, add the promotion piece (default to queen 'q')
    if (piece === "p" && (targetSquare[1] === "8" || targetSquare[1] === "1")) {
      uciMove += "q"; // Append 'q' for queen. Change as needed for other pieces.
    }

    // Clone the current game instance

    const gameInstance = new Chess(currentGame.fen());
    const isUserTurn =
      (gameInstance.turn() === "w" && boardOrientation === "white") ||
      (gameInstance.turn() === "b" && boardOrientation === "black");

    // Only proceed if it's the user's turn
    if (isUserTurn) {
      // Try to make the move

      let result = null;

      try {
        result = gameInstance.move(move);
      } catch (error) {
        console.error("Error making move:", error);
      }

      if (result) {
        // If the move is legal, update the game state with the new instance
        setCurrentGame(gameInstance);

        // Send the move to Lichess
        try {
          const response = await fetch(
            `https://lichess.org/api/board/game/${currentGameId}/move/${uciMove}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${user.accessToken}`, // Replace with your access token
              },
            }
          );

          if (response.ok) {
            return true; // Indicate that the move was successful
          } else {
            throw new Error("Failed to send move to Lichess");
          }
        } catch (error) {
          console.error("Error sending move to Lichess:", error);
          return false; // Indicate that the move failed
        }
      } else {
        console.error("Illegal move");
        return false; // Move was illegal
      }
    }
    console.error("Not your turn");
    return false;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full md:flex-row md:justify-around">
      <select
        onChange={(e) => setCurrentGameId(e.target.value)}
        className="mb-4 md:mb-0"
      >
        {games.map((game: any) => (
          <option key={game.currentGameId} value={game.currentGameId}>
            {game.username}
          </option>
        ))}
      </select>

      <div className="w-11/12 max-w-lg mb-4 md:mb-0 md:max-w-xl">
        <Chessboard
          position={currentGame.fen()}
          customBoardStyle={{ width: "100%", height: "100%" }}
          boardOrientation={boardOrientation}
          onPieceDrop={(source, target, piece) =>
            handleMove(source, target, piece) as any
          }
        />
        <div className="flex justify-around items-center my-4">
          <div className="flex flex-col items-center bg-gray-800 text-white p-4 rounded-lg shadow">
            <p className="text-lg font-semibold">White</p>
            <p className="text-2xl font-mono">{formatTime(whiteTime)}</p>
          </div>

          <div className="flex flex-col items-center bg-gray-800 text-white p-4 rounded-lg shadow">
            <p className="text-lg font-semibold">Black</p>
            <p className="text-2xl font-mono">{formatTime(blackTime)}</p>
          </div>
          {currentGameData && (
            <button
              className="bg-red-500 text-white font-bold py-2 px-4 rounded mt-2 hover:bg-red-700"
              onClick={handleResign}
            >
              Resign
            </button>
          )}

          <button
            className="bg-red-500 text-white font-bold py-2 px-4 rounded mt-2 hover:bg-red-700"
            onClick={async () => await challengeUser("kevofarcasterchess")}
          >
            Challenge
          </button>
        </div>
      </div>

      <div className="w-11/12 max-w-sm">
        <ChatRoom gameId={currentGameId} />
      </div>
    </div>
  );
}
