function Topbar({
  darkMode,
  setDarkMode,
  activeNotebook,
  handleBackToDashboard,
  handleExportNotes,
  handleShareProject,
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brandLogo">S</div>

        <div>
          <h1>SourceMate AI</h1>
          <p>
            {activeNotebook
              ? activeNotebook.name
              : "Chat with your notes and documents"}
          </p>
        </div>
      </div>

      <div className="topActions">
        {activeNotebook && (
          <button className="ghostButton" onClick={handleBackToDashboard}>
            Dashboard
          </button>
        )}

        <button className="ghostButton" onClick={handleExportNotes}>
          Export
        </button>

        <button className="ghostButton" onClick={handleShareProject}>
          Share
        </button>

        <button
          className="themeButton"
          onClick={() => setDarkMode((prev) => !prev)}
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>
    </header>
  );
}

export default Topbar;