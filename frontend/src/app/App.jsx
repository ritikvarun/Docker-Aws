import React, { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Editor } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import "./App.css";

const STORAGE_KEY = "collab_username";

// Random color for each user avatar
const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6",
];
const getColor = (name) =>
  COLORS[
    [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % COLORS.length
  ];

const App = () => {
  const [username, setUsername] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) || ""
  );
  const [joined, setJoined] = useState(
    () => !!sessionStorage.getItem(STORAGE_KEY)
  );
  // List of all currently online users from awareness
  const [onlineUsers, setOnlineUsers] = useState([]);

  const editorRef = useRef(null);
  const providerRef = useRef(null);
  const ydoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);

  // Listen to awareness changes and update online users list
  const setupAwarenessListener = useCallback((provider, myName) => {
    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values());
      const users = states
        .filter((s) => s.user && s.user.name)
        .map((s) => s.user.name);
      setOnlineUsers(users);
    };

    provider.awareness.on("change", updateUsers);
    // Set own state first, then trigger initial read
    provider.awareness.setLocalStateField("user", { name: myName });
    updateUsers();
  }, []);

  // Called when the Monaco editor mounts
  const handleMount = (editor) => {
    editorRef.current = editor;

    const provider = new SocketIOProvider(
      "http://localhost:3000",
      "monaco",
      ydoc,
      { autoConnect: true }
    );
    providerRef.current = provider;

    setupAwarenessListener(provider, username);

    new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness
    );
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const name = e.target.username.value.trim();
    if (name) {
      sessionStorage.setItem(STORAGE_KEY, name);
      setUsername(name);
      setJoined(true);
    }
  };

  const handleLogout = () => {
    if (providerRef.current) {
      providerRef.current.awareness.setLocalState(null); // remove self from awareness
      providerRef.current.disconnect();
      providerRef.current = null;
    }
    setOnlineUsers([]);
    sessionStorage.removeItem(STORAGE_KEY);
    setUsername("");
    setJoined(false);
  };

  // ─── Login Screen ───────────────────────────────────────────────────────────
  if (!joined) {
    return (
      <main className="h-screen w-full flex items-center justify-center bg-gray-950">
        <form
          onSubmit={handleJoin}
          className="flex flex-col gap-4 bg-gray-800 p-8 rounded-xl shadow-lg w-80"
        >
          <h1 className="text-white text-2xl font-bold text-center">
            Join Editor
          </h1>
          <input
            type="text"
            name="username"
            placeholder="Enter your username"
            className="p-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Join
          </button>
        </form>
      </main>
    );
  }

  // ─── Main Editor View ───────────────────────────────────────────────────────
  return (
    <main className="h-screen w-full flex gap-4 p-4 bg-gray-950">
      {/* Sidebar: online users */}
      <aside className="h-full w-1/4 bg-gray-900 border border-gray-700 rounded-xl flex flex-col p-4 gap-3">
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-1">
          Online · {onlineUsers.length}
        </h2>

        <ul className="flex flex-col gap-2 flex-1 overflow-y-auto">
          {onlineUsers.map((name, i) => (
            <li
              key={i}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800"
            >
              {/* Colored avatar circle */}
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: getColor(name) }}
              >
                {name[0].toUpperCase()}
              </span>
              <span className="text-white text-sm font-medium truncate">
                {name}
                {name === username && (
                  <span className="ml-1 text-gray-400 text-xs">(you)</span>
                )}
              </span>
              {/* Green online dot */}
              <span className="ml-auto w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            </li>
          ))}
        </ul>

        <button
          onClick={handleLogout}
          className="w-full p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
        >
          Logout
        </button>
      </aside>

      {/* Editor */}
      <section className="w-3/4 bg-neutral-800 rounded-xl overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          defaultValue="// Start collaborating..."
          theme="vs-dark"
          onMount={handleMount}
        />
      </section>
    </main>
  );
};

export default App;
