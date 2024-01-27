export const base64URLEncode = (str) => {
  return str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
    .trim();
};

export const readStream = (processLine) => (response) => {
  const stream = response.body.getReader();
  const matcher = /\r?\n/;
  const decoder = new TextDecoder();
  let buf = "";

  const loop = () =>
    stream.read().then(({ done, value }) => {
      if (done) {
        if (buf.length > 0) processLine(JSON.parse(buf));
      } else {
        const chunk = decoder.decode(value, {
          stream: true,
        });
        buf += chunk;

        const parts = buf.split(matcher);
        buf = parts.pop();
        for (const i of parts.filter((p) => p)) processLine(JSON.parse(i));
        return loop();
      }
    });

  return loop();
};

export const neynarFetcher = (url, headers) =>
  fetch(url, { headers }).then((res) => res.json());

export const fetcher = async (url, options) =>
  fetch(url, options).then((r) => r.json());

export async function readNeynarStream(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export const sendCast = async (text, user_id, parent_url) => {
  try {
    const res = await fetch("/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        user_id,
        parent_url,
        // Your request body here
      }),
    });

    if (!res.ok) {
      throw new Error(`Error: ${res.status}`);
    }

    const data = await res.json();
  } catch (err) {}
};
