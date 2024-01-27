import { Modal, Button } from "@mantine/core";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { useStore } from "@/store";
import { useEffect, useState } from "react";
import { checkUserAndLichessAccount } from "@/utils/prismaCalls";

// make sure to set your NEYNAR_API_KEY .env
// don't have an API key yet? get one at neynar.com
const client = new NeynarAPIClient(
  process.env.NEXT_PUBLIC_NEYNAR_API_KEY as string
);

const ChallengeModal = () => {
  const openModal = useStore((state) => state.openChallengeModal);
  const setModal = useStore((state) => state.setChallengeModal);
  const user = useStore((state) => state.user);
  const updateStoreModal = async (newModal: boolean) => {
    setModal(newModal);
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

  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any>([]);

  const sendChallenge = async (farcasterInfo: any) => {
    //get lichess username from user

    const hasUsernameAndLichess = await checkUserAndLichessAccount(
      farcasterInfo,
      user
    );

    if (
      hasUsernameAndLichess &&
      hasUsernameAndLichess.lichessExists &&
      hasUsernameAndLichess.lichessInfo
    ) {
      const challenge = await challengeUser(
        hasUsernameAndLichess.lichessInfo.username
      );

      await updateStoreModal(false);
      return;
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await client.searchUser(searchTerm, 3);
        if (!data || !data.result || !data.result.users)
          return console.log("No users found");
        setUsers(data.result.users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (searchTerm.length > 0) {
      // to prevent searching with an empty string
      fetchUsers();
    }
  }, [searchTerm]);

  return (
    <>
      <Modal
        opened={openModal}
        onClose={async () => await updateStoreModal(false)}
        title="Challenge"
      >
        <div>
          <input
            type="text"
            placeholder="Search for users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ul>
            {users.map((user: any) => (
              <button
                key={user.fid}
                onClick={async () => await sendChallenge(user)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
              >
                {user.username} - {user.display_name}
              </button>
            ))}
          </ul>
        </div>
      </Modal>
    </>
  );
};

export default ChallengeModal;
