import { verifyMessage, arrayify } from "ethers/lib/utils";
import canonicalize from "canonicalize";
import { useCallback, useEffect, useState } from "react";
import { ConnectKitButton } from "connectkit";
import { createClient } from "@supabase/supabase-js";

import {
  createUser,
  updateUser,
  upsertLichessInfo,
} from "../utils/prismaCalls";

import { useStore } from "./../store";
import "@farcaster/auth-kit/styles.css";

import { SignInButton, useProfile, useSignIn } from "@farcaster/auth-kit";
import supabase from "@/db";

export function Profile() {
  const { isAuthenticated, profile } = useProfile();
  const user = useStore((state: any) => state.user);

  const setUser = useStore((state) => state.setUser);

  // Call this function when you want to update the user state in the store
  const updateStoreUser = async (newUserData: any) => {
    setUser(newUserData);
  };
  return (
    <div>
      {isAuthenticated || user ? (
        <button
          onClick={() => {}}
          className=" w-full rounded-full border-2 border-slate-100 px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-offset-2 focus:ring-indigo-500"
        >
          @
          {profile && profile.username
            ? profile.username
            : user
            ? user.username
            : null}
        </button>
      ) : (
        <SignInButton
          onSuccess={async ({ fid, username, bio, displayName, pfpUrl }) => {
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
      )}
    </div>
  );
}
