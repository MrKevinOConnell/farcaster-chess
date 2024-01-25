import {
  useAccount,
  useConnect,
  useDisconnect,
  useEnsAvatar,
  useEnsName,
  useSignMessage,
} from "wagmi";
import { verifyMessage, arrayify } from "ethers/lib/utils";
import canonicalize from "canonicalize";
import { useCallback, useState } from "react";
import { ConnectKitButton } from "connectkit";
import { createClient } from "@supabase/supabase-js";
import ncrypt from "ncrypt-js";
import { useStore } from "./../store";
const SUPABASE_URL = "https://igimfimvljcmzdkivtob.supabase.co";
const READ_ONLY_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnaW1maW12bGpjbXpka2l2dG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzA5ODQ2NDAsImV4cCI6MTk4NjU2MDY0MH0.W1UpH8FMqBIUeP6DKejBkmrzHRjaEYz_sdQ_CAaYTQ8";
const supabase = createClient(SUPABASE_URL, READ_ONLY_SUPABASE_KEY);
import {
  Button,
  Group,
  UnstyledButton,
  Avatar,
  Text,
  Box,
} from "@mantine/core";

export function Profile() {
  const { user, setUser } = useStore((state) => state);
  const keyHash = "70d29a9c1ed39e8ceb1b4ccdbd3f19b5"; // md5 of "farcaster"
  const [userName, setUsername] = useState(null as any);
  const { disconnect } = useDisconnect();

  function internalBase64Encode(input: string) {
    return input.replaceAll("+", ".").replaceAll("/", "_").replaceAll("=", "-");
  }
  function internalBase64Decode(input: string) {
    return input
      .replaceAll(".", "+")
      .replaceAll("_", "/")
      .replaceAll("-", "=")
      .replace("MK=", "MK-");
  }

  const getFarcasterToken = async (variables: any, data: any) => {
    const crypt = new ncrypt("1234....");
    const address = verifyMessage(variables.message, data);
    const signedPayload = data;
    const signature = Buffer.from(arrayify(signedPayload)).toString("base64");
    const selfSignedToken = `eip191:${signature}`;
    console.log(selfSignedToken);

    const response = await fetch("/api/auth", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${selfSignedToken}`,
      },
      body: JSON.stringify({ payload: variables.message, selfSignedToken }),
    });

    if (!response.ok) {
      disconnect;
      return false;
    }

    const json = await response.json();

    const token = crypt.encrypt(json.secret);

    const { error } = await supabase
      .from("profiles")
      .update({ farcaster_token: token })
      .eq("address", address);
    await getUser(json.secret);
    return true;
  };

  const getUser = async (hash: string) => {
    const me = await fetch("/api/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${hash}`,
      },
      body: JSON.stringify({ userHubKey: hash }),
    });
    if (!me.ok) {
      disconnect;
    } else {
      const data = await me.json();
      console.log("data", data);
      let username = {
        userName: data.username,
        pfp: data.pfp,
        displayName: data.displayName,
      };
      setUser(username);
      setUsername(username);
    }
  };
  const { signMessage } = useSignMessage({
    onSuccess(newData, variables) {
      const id = getFarcasterToken(variables, newData);
    },
  });
  const { address, connector, isConnected } = useAccount({
    async onConnect({ address, connector, isReconnected }) {
      const crypt = new ncrypt("1234....");
      const { data, error } = await supabase
        .from("profiles")
        .select()
        .eq("address", address)
        .eq("deleted", false)
        .eq("hasSeen", false)
        .neq("farcaster_token", null)
        .order("published_at", { ascending: false })
        .limit(10000);
      if (data && data[0].farcaster_token) {
        const secret = crypt.decrypt(data[0].farcaster_token);
        getUser(secret);
      } else {
        const time = new Date().getTime();
        const payload = canonicalize({
          method: "generateToken",
          params: {
            timestamp: time,
          },
        });
        signMessage({ message: payload as any });
      }
    },
    onDisconnect() {
      setUsername(null as any);
    },
  });

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName }) => {
        return (
          <UnstyledButton onClick={show}>
            <Box>
              {!userName && <Text>Sign in</Text>}
              {userName && (
                <Avatar
                  size="lg"
                  alt={userName.displayName}
                  src={userName.pfp}
                />
              )}
            </Box>
          </UnstyledButton>
        );
      }}
    </ConnectKitButton.Custom>
  );
}
