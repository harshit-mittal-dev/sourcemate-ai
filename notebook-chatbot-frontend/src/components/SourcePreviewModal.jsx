function SourcePreviewModal({ source, onClose }) {
  if (!source) return null;

  const chunks = source.chunks || [];

  return (
    <div className="modalOverlay">
      <div className="uploadModal">
        <div className="modalHeader">
          <div>
            <h2>{source.name}</h2>
            <p>
              {source.type} • {source.pages || 1} page
              {(source.pages || 1) === 1 ? "" : "s"} •{" "}
              {source.totalChunks || chunks.length || 0} chunks
            </p>
          </div>

          <button className="closeButton" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modalNote">
          <strong>Status:</strong> {source.status}
        </div>

        {source.textPreview && (
          <div className="manualSourceBox">
            <label>Text Preview</label>
            <p>{source.textPreview}</p>
          </div>
        )}

        {chunks.length > 0 && (
          <div className="manualSourceBox">
            <label>Backend Chunks</label>

            {chunks.slice(0, 5).map((chunk) => (
              <div className="sourceTip" key={chunk.id}>
                <strong>
                  Chunk {chunk.chunkIndex + 1} • Page {chunk.pageNumber}
                </strong>
                <p>{chunk.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SourcePreviewModal;