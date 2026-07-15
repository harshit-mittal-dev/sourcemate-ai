const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "/api" : "http://localhost:5000/api");

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  const contentType = response.headers.get("content-type") || "";

  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => "");
    data = {
      success: false,
      message: text || "API request failed.",
    };
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "API request failed.");
  }

  return data?.data;
}

export async function getSources() {
  return apiRequest("/sources");
}

export async function getSourceById(sourceId) {
  return apiRequest(`/sources/${sourceId}`);
}

export async function uploadSourceFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest("/uploads/file", {
    method: "POST",
    body: formData,
  });
}

export async function uploadTextSource(title, content) {
  return apiRequest("/uploads/text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      content,
    }),
  });
}

export async function uploadLinkSource(url) {
  return apiRequest("/uploads/link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
    }),
  });
}

export async function deleteSourceById(sourceId) {
  return apiRequest(`/sources/${sourceId}`, {
    method: "DELETE",
  });
}

export async function chatWithSources(question, sourceIds = []) {
  return apiRequest("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      sourceIds,
    }),
  });
}

export async function streamChatWithSources({
  question,
  sourceIds = [],
  onToken,
  onEnd,
}) {
  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      sourceIds,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "Streaming request failed.");
  }

  if (!response.body) {
    throw new Error("Streaming is not supported in this browser.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const eventBlock of events) {
      const dataLines = eventBlock
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace(/^data:\s*/, ""));

      for (const dataLine of dataLines) {
        if (!dataLine) continue;

        let payload;

        try {
          payload = JSON.parse(dataLine);
        } catch (error) {
          continue;
        }

        if (payload.type === "token") {
          onToken?.(payload.text || "");
        }

        if (payload.type === "end") {
          onEnd?.(payload);
        }

        if (payload.type === "error") {
          throw new Error(payload.message || "Streaming failed.");
        }
      }
    }
  }
}