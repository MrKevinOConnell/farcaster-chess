import { Modal, Button } from "@mantine/core";

import { useStore } from "@/store";
import { use, useEffect, useState } from "react";
import {
  checkUserAndLichessAccount,
  createUser,
  getUserWithLichessInfo,
  updateUser,
  upsertLichessInfo,
} from "@/utils/prismaCalls";
import { useRouter } from "next/router";
import { SignInButton, useSignIn } from "@farcaster/auth-kit";
import supabase from "@/db";

const LichessModal = () => {
  const openModal = useStore((state) => state.openLichessModal);
  const setModal = useStore((state) => state.setLichessModal);
  const user = useStore((state) => state.user);
  const invitedUserId = useStore((state) => state.invitedUser);

  const [invitee, setInvitee] = useState<any>(null);
  const router = useRouter();

  const setUser = useStore((state) => state.setUser);
  // Call this function when you want to update the user state in the store
  const updateStoreUser = async (newUserData: any) => {
    setUser(newUserData);
  };
  const updateStoreModal = async (newModal: boolean) => {
    setModal(newModal);
  };

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

  useEffect(() => {
    const fetchInvitedUser = async () => {
      if (invitedUserId) {
        try {
          const fetchedUser = await getUserWithLichessInfo(invitedUserId);

          if (fetchedUser && fetchedUser.lichess_info) {
            setInvitee(fetchedUser);
          }
        } catch (error) {
          console.error("Error fetching invited user:", error);
        }
      }
    };

    fetchInvitedUser();
  }, [invitedUserId]);

  const challengeUser = async (username: string) => {
    try {
      const body = {
        rated: true,
        "clock.limit": 600,
        "clock.increment": 5,
        color: "random",
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

  return (
    <>
      <Modal
        opened={openModal}
        className="absolute top-1/3"
        onClose={async () => await updateStoreModal(false)}
      >
        {invitee && invitee.lichess_info && user && user.accessToken ? (
          <div>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={async () =>
                await challengeUser(invitee.lichess_info[0].username)
              }
            >
              Challenge ${invitee.username}
            </button>
          </div>
        ) : user && user.accessToken ? (
          <div>
            <p>Thank you for logging in!</p>
          </div>
        ) : user ? (
          <div>
            <p>Authenticate into Lichess!</p>
            <button
              onClick={async () => {
                const lichessProfile = await fetch("/api/lichessAuth", {
                  method: "GET",
                });
                const lichessProfileJson = await lichessProfile.json();
                if (lichessProfileJson.url) {
                  localStorage.setItem("verify", lichessProfileJson.verifier);
                  window.location.href = lichessProfileJson.url;
                }
              }}
            >
              <img className="w-12 h-12 rounded-full" src={"/lichess.png"} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center">
            <p>Sign in with Farcaster</p>
            <SignInButton
              onSuccess={async ({
                fid,
                username,
                bio,
                displayName,
                pfpUrl,
              }) => {
                const user = await supabase
                  .from("users")
                  .select("*")
                  .eq("fid", fid);

                if (!user || !user.data || user.data.length === 0) {
                  const newUser = await createUser({
                    fid,
                    username,
                    bio,
                    displayName,
                    pfpUrl,
                  });
                } else {
                  const updatedUser = await updateUser(fid, {
                    username,
                    bio,
                    displayName,
                    pfpUrl,
                  });
                }
                await updateStoreUser({
                  fid,
                  username,
                  bio,
                  displayName,
                  pfpUrl,
                });
              }}
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default LichessModal;
