import { useEffect, useRef, useState } from "react";

function ChatPanel({
  selectedSources = [],
  suggestedPrompts = [],
  messages = [],
  input = "",
  setInput,
  handleSend,
  handleSaveNote,
  handleClearChat,
  openUploadModal,
  isLoading = false,
}) {
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading]);

  async function handleCopy(text, messageId) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);

      setTimeout(() => {
        setCopiedMessageId(null);
      }, 1200);
    } catch (error) {
      alert("Copy failed. Please try again.");
    }
  }

  function handleExplainEasier(text) {
    handleSend(`Explain this in simpler words: ${text}`);
  }

  return (
    <section className="chatPanel">
      <div className="chatHeader">
        <div>
          <h2>AI Chat Workspace</h2>
          <p>
            Asking from{" "}
            <strong>
              {selectedSources.length} selected source
              {selectedSources.length === 1 ? "" : "s"}
            </strong>
          </p>
        </div>

        <div className="chatHeaderActions">
          <button className="clearChatButton" onClick={handleClearChat}>
            Clear Chat
          </button>

          <div className="confidenceBadge">Source-based answers</div>
        </div>
      </div>

      <div className="suggestedRow">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            disabled={isLoading}
            onClick={() => handleSend(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="chatMessages">
        {messages.map((message) => {
          const citations = message.citations || [];

          return (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "message userMessage"
                  : "message aiMessage"
              }
            >
              <div className="messageAvatar">
                {message.role === "user" ? "You" : "AI"}
              </div>

              <div className="messageBody">
                <p>{message.text}</p>

                {citations.length > 0 && (
                  <div className="citationArea">
                    <span>Sources:</span>

                    {citations.map((citation, index) => (
                      <button key={index} className="citationChip">
                        {citation.title} · Page {citation.page}
                      </button>
                    ))}
                  </div>
                )}

                {message.role === "assistant" && (
                  <div className="messageActions">
                    <button onClick={() => handleSaveNote(message.text)}>
                      Save as Note
                    </button>

                    <button onClick={() => handleCopy(message.text, message.id)}>
                      {copiedMessageId === message.id ? "Copied!" : "Copy"}
                    </button>

                    <button onClick={() => handleExplainEasier(message.text)}>
                      Explain Easier
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="message aiMessage">
            <div className="messageAvatar">AI</div>

            <div className="messageBody typingBubble">
              <div className="typingDots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef}></div>
      </div>

      <div className="inputArea">
        <button
          className="attachButton"
          disabled={isLoading}
          onClick={openUploadModal}
          title="Add source"
        >
          ＋
        </button>

        <input
          value={input}
          disabled={isLoading}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSend();
            }
          }}
          placeholder={
            isLoading
              ? "AI is thinking..."
              : "Ask anything from your selected sources..."
          }
        />

        <button
          className="sendButton"
          disabled={isLoading}
          onClick={() => handleSend()}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>
    </section>
  );
}

export default ChatPanel;