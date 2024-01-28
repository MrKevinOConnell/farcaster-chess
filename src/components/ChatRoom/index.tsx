// ChatRoom.tsx
import { fetcher, neynarFetcher, sendGameCast } from "@/util";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useSWR from "swr";
import "@farcaster/auth-kit/styles.css";
import QRCode from "react-qr-code";

import { SignInButton, useProfile, useSignIn } from "@farcaster/auth-kit";
import { getRelativeTime } from "@/utils/timeUtils";
import { encode } from "punycode";
import { useStore } from "@/store";
import { chessChannel } from "@/constants";
import supabase from "@/db";

// Define a type for the message object
type Message = {
  user: string;
  text: string;
};

// Define a type for the component's props
type ChatRoomProps = {
  gameId: string | null;
  gameState: string;
};

const ChatRoom: React.FC<ChatRoomProps> = ({ gameId, gameState }) => {
  const { isAuthenticated, profile } = useProfile();
  const [newMessage, setNewMessage] = useState("");
  const [parentURL, setParentURL] = useState(chessChannel);
  const user = useStore((state: any) => state.user);

  async function getFarcasterThreadHash(gameId: string | null) {
    if (!gameId) {
      return chessChannel;
    }
    try {
      const { data, error } = await supabase
        .from("lichess_games")
        .select("farcasterThreadHash")
        .eq("id", gameId)
        .single();

      const hash = data ? data.farcasterThreadHash ?? chessChannel : null;

      return hash;
    } catch (err) {
      console.log(err);
      return chessChannel;
    }
  }

  useEffect(() => {
    // Function to set up the channel
    async function setupChannel() {
      const hash = await getFarcasterThreadHash(gameId);
      setParentURL(hash);

      // Subscribe to the channel
      const channel = supabase
        .channel("schema-db-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "lichess_games",
            // filter: `id = ${gameId}`,
          },
          (payload) => {
            console.log("Change received!", payload);
            setParentURL(payload.new.farcasterThreadHash);
          }
        )
        .subscribe((event) => console.log("Received event!", event));

      return channel;
    }

    // Set up the channel and get the unsubscribe function
    let channelA: any;
    setupChannel().then((channel) => {
      channelA = channel;
    });

    // Cleanup function for unsubscription
    return () => {
      if (channelA) {
        supabase.removeChannel(channelA);
      }
    };
  }, [gameId]);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const newContent = mutation.addedNodes[0];
        if (newContent && newContent instanceof Element) {
          newContent.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    if (chatContainer) {
      observer.observe(chatContainer, { childList: true });
    }

    return () => observer.disconnect();
  }, []);

  const { data, error } = useSWR(
    !parentURL || parentURL === chessChannel
      ? `https://api.neynar.com/v2/farcaster/feed?feed_type=filter&filter_type=parent_url&parent_url=${encodeURIComponent(
          parentURL
        )}&with_recasts=false&with_replies=true&limit=25`
      : `https://api.neynar.com/v1/farcaster/all-casts-in-thread?thread_hash=${encodeURIComponent(
          parentURL
        )}`,
    async (url: any) =>
      await neynarFetcher(url, {
        accept: "application/json",
        api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY,
      }),
    {
      refreshInterval: 2500,
    }
  );

  const { data: signerData, error: signerError } = useSWR(
    "/api/signer",
    async () => await fetchSigner(),
    {
      refreshInterval: 2500,
    }
  );

  async function fetchSigner(): Promise<any | null> {
    try {
      if (!user || !user.fid) return null;
      const endpoint = `/api/signer?user_id=${user.fid}`;
      const response = await fetcher(endpoint, {
        headers: { "Content-Type": "application/json" },
      });
      return response;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  /**
   * Save the FID to SecureStore and route the user to the next screen.
   * Runs when the user approves the Farcaster connection.
   */
  async function saveKey() {
    if (!user.fid) return;
    // save the FID to SecureStore
    try {
      // send fid and status to database
      const endpoint = `/api/signer?user_id=${user.fid}`;
      const options = {
        method: "POST",
        body: JSON.stringify({
          fid: user.fid,
          status: "approved",
        }),
      };

      const fetch = await fetcher(endpoint, options);
    } catch (err) {}
  }

  useEffect(() => {
    if (signerData?.status === "approved" && user.fid) {
      saveKey();
    }
  }, [signerData]);

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;
  const messages = data.casts
    ? data.casts
    : data.results && data.results.casts
    ? data.results.casts
    : [];

  const sendMessage = async () => {
    if (newMessage.trim() !== "") {
      const fid = user.fid.toString();
      await sendGameCast(newMessage, fid, gameId, gameState);
      setNewMessage(""); // Reset input after sending
    }
  };

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      await sendMessage();
    }
  };

  return (
    <div className="flex flex-col w-full">
      {signerData &&
      signerData.signer_approval_url &&
      signerData.status !== "approved" ? (
        <div className="  p-2 items-center justify-center w-full ">
          {" "}
          {/* Center the QR Code */}
          <QRCode size={256} value={signerData.signer_approval_url} />
        </div>
      ) : null}
      <div
        ref={chatContainerRef}
        className="flex-grow overflow-y-auto p-4 border-b border-gray-300 h-64 flex flex-col-reverse"
      >
        {messages.map((message: any, index: number) => (
          <div key={index} className="mb-4 break-words">
            <div className="flex">
              <img
                className="w-8 h-8 rounded-full"
                src={message.author.pfp_url}
              />
              <strong className="font-semibold">
                <span className="font-medium opacity-50">
                  @{message.author.username} • 
                  {getRelativeTime(message.timestamp ?? 0)}
                </span>
              </strong>
            </div>
            <span>{message.text}</span>
          </div>
        ))}
      </div>

      <div className="p-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border border-gray-300 p-2 w-full"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
