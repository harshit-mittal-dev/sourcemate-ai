import { useEffect, useState } from "react";
import "./App.css";

import Topbar from "./components/Topbar";
import Dashboard from "./components/Dashboard";
import SourcesPanel from "./components/SourcesPanel";
import ChatPanel from "./components/ChatPanel";
import ToolsPanel from "./components/ToolsPanel";
import UploadModal from "./components/UploadModal";
import SourcePreviewModal from "./components/SourcePreviewModal";

import {
  getSources,
  getSourceById,
  uploadSourceFile,
  uploadTextSource,
  uploadLinkSource,
  deleteSourceById,
  streamChatWithSources,
} from "./services/api";

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function formatSourceStatus(source) {
  if (source.processingStatus === "completed") return "Processed";
  if (source.processingStatus === "failed") return "Failed";
  if (source.processingStatus === "pending_extraction") return "Pending";
  return source.status || "Uploaded";
}

function mapBackendSourceToUi(source, selected = true) {
  return {
    id: source.id,
    name: source.name,
    type: source.type,
    pages: source.pages || 1,
    status: formatSourceStatus(source),
    processingStatus: source.processingStatus,
    selected,
    sizeReadable: source.sizeReadable,
    totalCharacters: source.totalCharacters || 0,
    totalChunks: source.totalChunks || 0,
    textPreview: source.textPreview || "",
    url: source.url || null,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

const initialNotebooks = [
  {
    id: "notebook_1",
    name: "SourceMate Workspace",
    type: "AI Research Notebook",
    sources: 0,
    updated: "Today",
  },
];

const suggestedPrompts = [
  "Summarize my selected sources",
  "Explain this in simple words",
  "Make short exam notes",
  "Create important questions",
];

const welcomeMessage = {
  id: "welcome_message",
  role: "assistant",
  text: "Upload a source, paste notes, or add a link. Then ask me anything from it. I will stream the backend response progressively and return citations from your uploaded chunks.",
  citations: [],
};

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [notebooks, setNotebooks] = useState(initialNotebooks);
  const [activeNotebook, setActiveNotebook] = useState(null);

  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState("");
  const [savedNotes, setSavedNotes] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const selectedSources = sources.filter((source) => source.selected);

  async function loadSourcesFromBackend() {
    try {
      const data = await getSources();

      const previousSelectionMap = new Map(
        sources.map((source) => [source.id, source.selected])
      );

      const backendSources = (data.sources || []).map((source) =>
        mapBackendSourceToUi(
          source,
          previousSelectionMap.has(source.id)
            ? previousSelectionMap.get(source.id)
            : true
        )
      );

      setSources(backendSources);

      setNotebooks((prev) =>
        prev.map((notebook) => {
          if (activeNotebook && notebook.id === activeNotebook.id) {
            return {
              ...notebook,
              sources: backendSources.length,
              updated: "Just now",
            };
          }

          return notebook;
        })
      );
    } catch (error) {
      alert(`Could not load sources: ${error.message}`);
    }
  }

  useEffect(() => {
    if (activeNotebook) {
      loadSourcesFromBackend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNotebook]);

  function handleOpenNotebook(notebook) {
    setActiveNotebook(notebook);
    setMessages([welcomeMessage]);
  }

  function handleCreateNotebook(notebookData) {
    const newNotebook = {
      id: createId("notebook"),
      name: notebookData.name,
      type: notebookData.type,
      sources: 0,
      updated: "Just now",
    };

    setNotebooks((prev) => [newNotebook, ...prev]);
    setActiveNotebook(newNotebook);
    setMessages([welcomeMessage]);
  }

  function handleBackToDashboard() {
    setActiveNotebook(null);
  }

  function toggleSource(sourceId) {
    setSources((prev) =>
      prev.map((source) =>
        source.id === sourceId
          ? {
              ...source,
              selected: !source.selected,
            }
          : source
      )
    );
  }

  async function handleFilesSelected(files) {
    if (!files || files.length === 0) return;

    setIsLoading(true);

    try {
      for (const file of files) {
        await uploadSourceFile(file);
      }

      await loadSourcesFromBackend();

      setMessages((prev) => [
        ...prev,
        {
          id: createId("assistant"),
          role: "assistant",
          text: `${files.length} file source${
            files.length === 1 ? "" : "s"
          } uploaded and processed by backend.`,
          citations: [],
        },
      ]);
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddTextSource(title, content) {
    setIsLoading(true);

    try {
      await uploadTextSource(title, content);
      await loadSourcesFromBackend();

      setMessages((prev) => [
        ...prev,
        {
          id: createId("assistant"),
          role: "assistant",
          text: "Text source added and processed by backend.",
          citations: [],
        },
      ]);
    } catch (error) {
      alert(`Text source failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddLinkSource(url) {
    setIsLoading(true);

    try {
      await uploadLinkSource(url);
      await loadSourcesFromBackend();

      setMessages((prev) => [
        ...prev,
        {
          id: createId("assistant"),
          role: "assistant",
          text: "Link source added and processed by backend.",
          citations: [],
        },
      ]);
    } catch (error) {
      alert(`Link source failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleViewSource(source) {
    try {
      const data = await getSourceById(source.id);

      setSelectedSource({
        ...source,
        chunks: data.chunks || [],
      });
    } catch (error) {
      alert(`Could not open source: ${error.message}`);
    }
  }

  async function handleDeleteSource(sourceId) {
    const confirmDelete = window.confirm(
      "Delete this source from backend storage?"
    );

    if (!confirmDelete) return;

    try {
      await deleteSourceById(sourceId);
      setSources((prev) => prev.filter((source) => source.id !== sourceId));

      setMessages((prev) => [
        ...prev,
        {
          id: createId("assistant"),
          role: "assistant",
          text: "Source deleted from backend.",
          citations: [],
        },
      ]);
    } catch (error) {
      alert(`Delete failed: ${error.message}`);
    }
  }

  async function handleSend(customPrompt) {
    const question =
      typeof customPrompt === "string" ? customPrompt.trim() : input.trim();

    if (!question || isLoading) return;

    const userMessage = {
      id: createId("user"),
      role: "user",
      text: question,
      citations: [],
    };

    const assistantMessageId = createId("assistant_streaming");

    const assistantMessage = {
      id: assistantMessageId,
      role: "assistant",
      text: "",
      citations: [],
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsLoading(true);

    let streamedAnswer = "";

    try {
      const selectedSourceIds = selectedSources.map((source) => source.id);

      await streamChatWithSources({
        question,
        sourceIds: selectedSourceIds,

        onToken: (token) => {
          streamedAnswer += token;

          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    text: streamedAnswer,
                  }
                : message
            )
          );
        },

        onEnd: (payload) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    text:
                      streamedAnswer.trim() ||
                      "No response was generated from backend.",
                    citations: (payload.citations || []).map((citation) => ({
                      title: citation.sourceName || "Uploaded Source",
                      page: citation.page || 1,
                    })),
                  }
                : message
            )
          );
        },
      });
    } catch (error) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                text: `Backend streaming error: ${error.message}`,
                citations: [],
              }
            : message
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleToolAction(toolId) {
    const prompts = {
      summary: "Summarize my selected sources in clear bullet points.",
      questions:
        "Create important exam-style questions and answers from my selected sources.",
      flashcards:
        "Create flashcards from my selected sources with question on front and answer on back.",
    };

    const prompt = prompts[toolId];

    if (prompt) {
      handleSend(prompt);
    }
  }

  async function handleShareProject() {
    const shareData = {
      title: "SourceMate AI",
      text: activeNotebook
        ? `Check my SourceMate AI notebook: ${activeNotebook.name}`
        : "Check my SourceMate AI project",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      alert("App link copied to clipboard.");
    } catch (error) {
      if (error.name !== "AbortError") {
        alert("Share failed. Link could not be copied.");
      }
    }
  }

  function handleSaveNote(text) {
    const note = {
      id: createId("note"),
      text,
      createdAt: new Date().toLocaleString(),
    };

    setSavedNotes((prev) => [note, ...prev]);
  }

  function handleClearChat() {
    setMessages([welcomeMessage]);
  }

  function handleExportNotes() {
    const selectedSourceNames = selectedSources
      .map((source) => `- ${source.name}`)
      .join("\n");

    const notesText = savedNotes
      .map((note, index) => {
        return `Note ${index + 1}
Created: ${note.createdAt}
${note.text}`;
      })
      .join("\n\n");

    const chatText = messages
      .map((message) => {
        return `${message.role.toUpperCase()}:
${message.text}`;
      })
      .join("\n\n");

    const exportText = `SourceMate AI Export

Notebook:
${activeNotebook ? activeNotebook.name : "Dashboard"}

Selected Sources:
${selectedSourceNames || "No selected sources"}

Saved Notes:
${notesText || "No saved notes"}

Chat History:
${chatText || "No chat messages"}
`;

    const blob = new Blob([exportText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "sourcemate-ai-export.txt";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <Topbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activeNotebook={activeNotebook}
        handleBackToDashboard={handleBackToDashboard}
        handleExportNotes={handleExportNotes}
        handleShareProject={handleShareProject}
      />

      {!activeNotebook ? (
        <Dashboard
          notebooks={notebooks}
          handleOpenNotebook={handleOpenNotebook}
          handleCreateNotebook={handleCreateNotebook}
        />
      ) : (
        <main className="workspace">
          <SourcesPanel
            sources={sources}
            toggleSource={toggleSource}
            handleViewSource={handleViewSource}
            handleDeleteSource={handleDeleteSource}
            openUploadModal={() => setIsUploadOpen(true)}
          />

          <ChatPanel
            selectedSources={selectedSources}
            suggestedPrompts={suggestedPrompts}
            messages={messages}
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            handleSaveNote={handleSaveNote}
            handleClearChat={handleClearChat}
            openUploadModal={() => setIsUploadOpen(true)}
            isLoading={isLoading}
          />

          <ToolsPanel
            savedNotes={savedNotes}
            handleToolAction={handleToolAction}
          />
        </main>
      )}

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        handleFilesSelected={handleFilesSelected}
        handleAddTextSource={handleAddTextSource}
        handleAddLinkSource={handleAddLinkSource}
      />

      {selectedSource && (
        <SourcePreviewModal
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
        />
      )}
    </div>
  );
}

export default App;