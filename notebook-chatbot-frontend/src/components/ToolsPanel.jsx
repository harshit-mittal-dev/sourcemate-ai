const defaultStudyTools = [
  {
    id: "summary",
    title: "Generate Summary",
    description: "Create a short summary from your selected sources.",
    icon: "📝",
  },
  {
    id: "questions",
    title: "Important Questions",
    description: "Generate exam-style important questions.",
    icon: "❓",
  },
  {
    id: "flashcards",
    title: "Flashcards",
    description: "Turn source content into quick revision cards.",
    icon: "⚡",
  },
];

function ToolsPanel({
  savedNotes = [],
  studyTools = defaultStudyTools,
  handleToolAction = () => {},
}) {
  return (
    <aside className="toolsPanel">
      <div className="panelHeader">
        <div>
          <h2>Study Tools</h2>
          <p>Quick actions</p>
        </div>
      </div>

      <div className="toolList">
        {studyTools.map((tool) => (
          <button
            className="toolCard"
            key={tool.id}
            onClick={() => handleToolAction(tool.id)}
          >
            <div className="toolIcon">{tool.icon}</div>

            <div>
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="notesSection">
        <div className="notesHeader">
          <h2>Saved Notes</h2>
          <span>{savedNotes.length}</span>
        </div>

        {savedNotes.length === 0 ? (
          <div className="emptyNotes">
            <p>No saved notes yet.</p>
            <span>Save useful AI answers to see them here.</span>
          </div>
        ) : (
          <div className="savedNotesList">
            {savedNotes.map((note) => (
              <div className="savedNoteCard" key={note.id}>
                <p>{note.text}</p>
                <span>{note.createdAt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

export default ToolsPanel;