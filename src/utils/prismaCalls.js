import supabase from "@/db";

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
