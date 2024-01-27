import { chessChannel } from "@/constants";
import supabase from "@/db";
import { sendCast } from "@/util";

export async function createUser(userData) {
  const { data, error } = await supabase.from("users").insert([userData]);

  if (error) {
    throw error;
  }

  return data;
}

export async function updateUser(fid, updatedData) {
  const { data, error } = await supabase
    .from("users")
    .update(updatedData)
    .match({ fid: fid });

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertLichessInfo(fid, lichessData) {
  const { data, error: selectError } = await supabase
    .from("lichess_info")
    .select()
    .eq("userFid", fid)
    .single();

  if (selectError && selectError.code !== "PGRST116") {
    // 'PGRST116' code for no rows found
    throw selectError;
  }

  if (data) {
    const { error: updateError } = await supabase
      .from("lichess_info")
      .update(lichessData)
      .eq("userFid", fid);

    if (updateError) throw updateError;
    return { ...data, ...lichessData };
  } else {
    const { data: insertData, error: insertError } = await supabase
      .from("lichess_info")
      .insert([{ userFid: fid, ...lichessData }]);

    if (insertError) throw insertError;
    return insertData[0];
  }
}

export async function getUserWithLichessInfo(fid) {
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      *,
      lichess_info!userFid (
        *
      )
    `
    )
    .eq("fid", fid)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// In a services file or directly in your component file
// In a services file or directly in your component file

export async function checkUserAndLichessAccount(user, signedInUser) {
  try {
    // First, check if the user exists
    let { data: userData, error: userError } = await supabase
      .from("users")
      .select("fid, username")
      .eq("fid", user.fid)
      .single();

    if (!userData) {
      const add = await createUser({
        fid: user.fid,
        username: user.username,
        bio: user.profile.bio.text,
        pfpUrl: user.pfp_url,
        displayName: user.display_name,
      });

      const userExists = add != null;

      //send cast
      const message = `Hey @${user.username}! Come play chess against me at ${process.env.NEXT_PUBLIC_URL}?user=${signedInUser.fid}`;

      const cast = await sendCast(message, signedInUser.fid, chessChannel);

      return {
        userExists,
        lichessExists: false,
        lichessInfo: null,
        error: "Error creating user",
      };
    }
    const message = `Hey @${user.username}! Come play chess against me at ${process.env.NEXT_PUBLIC_URL}?user=${signedInUser.fid}`;

    const cast = await sendCast(message, signedInUser.fid, chessChannel);

    // If user exists, check for LichessInfo
    let { data: lichessData, error: lichessError } = await supabase
      .from("lichess_info")
      .select("username, accessToken") // Add other fields as needed
      .eq("userFid", user.fid)
      .single();

    if (lichessError) {
      throw lichessError;
    }

    return {
      userExists: true,
      lichessExists: lichessData != null,
      lichessInfo: lichessData || null,
    };
  } catch (error) {
    console.error("Error checking user and Lichess account", error.message);
    return { userExists: false, lichessExists: false, error: error.message };
  }
}
