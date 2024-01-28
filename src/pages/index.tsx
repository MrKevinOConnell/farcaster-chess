import { Chessboard } from "react-chessboard";
import { Button, Flex, Stack } from "@mantine/core";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { Chess, Piece, Square } from "chess.js";

import ChatRoom from "@/components/ChatRoom";
import { useStore } from "@/store";
import { BoardOrientation } from "react-chessboard/dist/chessboard/types";
import { readStream } from "@/util";

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
  const setModal = useStore((state) => state.setChallengeModal);
  const setLichessModal = useStore((state) => state.setLichessModal);
  const setInvitedUser = useStore((state) => state.setInvitedUser);
  const [challenges, setChallenges] = useState<any>([]);
  const updateStoreModal = async (newModal: boolean) => {
    setModal(newModal);
  };

  const updateLichessModal = async (newModal: boolean) => {
    setLichessModal(newModal);
  };

  const [gameStatus, setGameStatus] = useState("ended"); // initial status is 'active'
  const user = useStore((state: any) => state.user);
  const [boardOrientation, setBoardOrientation] =
    useState<BoardOrientation>("white");

  const [whiteTime, setWhiteTime] = useState<null | number>(null); // 5 minutes in seconds
  const [blackTime, setBlackTime] = useState<null | number>(null); // 5 minutes in seconds

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
    if (!user || !user.accessToken) return;
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
        console.log("The stream has completed!");
      };
      stream.then(readStream(onMessage)).then(onComplete);
    } catch (error) {
      console.error("Error in streaming game data:", error);
      setGameStatus("ended");
    }
  };

  const accountListening = async () => {
    if (!user || !user.accessToken) return;
    const streamUrl = "https://lichess.org/api/stream/event";

    try {
      const stream = fetch(streamUrl, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });

      const onMessage = (obj: any) => {
        if (obj.type === "gameStart") {
          setChallenges((prev: any) => {
            return prev.filter((challenge: any) => {
              return challenge.gameId !== obj.game.id;
            });
          });
          setCurrentGameId(obj.id);
          updateStoreModal && updateStoreModal(false);
          updateLichessModal(false);
        } else if (obj.status === "gameFinish") {
          setGameStatus("ended");
          //check if user won
          if (obj.winner === user.lichessName) {
            //user won
            const win = new Audio("/win.mp3");
            win.play();
          } else if (obj.winner === "draw") {
            //draw
            const win = new Audio("/win.mp3");
            win.play();
          } else {
            const lose = new Audio("/loss.mp3");
            lose.play();
            //user lost
          }
        } else if (obj.type === "challenge") {
          //CHALLENGE ADDED
          setChallenges((prev: any) => [
            ...prev,
            {
              gameId: obj.challenge.id,
              challenger: obj.challenge.challenger.id,
            },
          ]);
          setupGame(obj.moves);
          setWhiteTime(obj.wtime); // Convert milliseconds to seconds
          setBlackTime(obj.btime); // Convert milliseconds to seconds
        } else if (obj.type === "challengeCanceled") {
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
    accountListening();
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

    // Get the last move details
    const history = chess.history({ verbose: true });
    const lastMove = history[history.length - 1];

    // Check if the last move was a capture
    if (lastMove && lastMove.captured) {
      const capturedPiece = new Audio("/capture.mp3");
      capturedPiece.play();
    } else {
      const normalMove = new Audio("/move.mp3");
      normalMove.play();
    }
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

  const getUpdatedUser = async () => {
    if (router.query.user) {
      const invitedUser = router.query.user;
      await setInvitedUser(invitedUser as string);
    }
    if (!user) {
      await setLichessModal(true);
    } else if (user && router.query.code) {
      await setLichessModal(true);
    } else {
      await setLichessModal(false);
    }
  };

  useEffect(() => {
    getUpdatedUser();
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
        {challenges.map((challenge: any) => (
          <div key={challenge.gameId}>
            <p>Challenge {challenge.challenger}</p>
            <button
              onClick={async () => await acceptChallenge(challenge.gameId)}
            >
              Accept
            </button>
          </div>
        ))}
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
            <p className="text-2xl font-mono">{formatTime(whiteTime as any)}</p>
          </div>

          <div className="flex flex-col items-center bg-gray-800 text-white p-4 rounded-lg shadow">
            <p className="text-lg font-semibold">Black</p>
            <p className="text-2xl font-mono">{formatTime(blackTime as any)}</p>
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
            onClick={async () => await updateStoreModal(true)}
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
