import React, { useRef, useMemo, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import "./App.css";

const App = () => {
  // ✅ All hooks at the top level of the component
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const editorRef = useRef(null);
  const providerRef = useRef(null);
  const ydoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);

  // Called when the Monaco editor mounts
  const handleMount = (editor) => {
    editorRef.current = editor;

    const provider = new SocketIOProvider(
      "http://localhost:3000",
      "monaco",
      ydoc
    );
    providerRef.current = provider;

    // Set the user's awareness (name visible to collaborators)
    provider.awareness.setLocalStateField("user", { name: username });

    new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness
    );
  };

  // Called when the join form is submitted
  const handleJoin = (e) => {
    e.preventDefault();
    const name = e.target.username.value.trim();
    if (name) {
      setUsername(name);
      setJoined(true);
    }
  };

  // Show login screen until user enters a username
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

  // Main editor view
  return (
    <main className="h-screen w-full flex gap-4 p-4 bg-gray-950">
      <aside className="h-full w-1/4 bg-amber-50 rounded-lg flex items-start p-4">
        <p className="text-gray-800 font-semibold">👤 {username}</p>
      </aside>
      <section className="w-3/4 bg-neutral-800 rounded-lg">
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
