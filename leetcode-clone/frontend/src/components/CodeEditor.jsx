import Editor from "@monaco-editor/react";
import React, { useRef } from "react";

const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    automaticLayout: true,
    quickSuggestions: false,
    parameterHints: { enabled: false },
    hover: { enabled: false },
    suggestOnTriggerCharacters: false,
    wordBasedSuggestions: false,
    renderWhitespace: "none",
    scrollBeyondLastLine: false,
    smoothScrolling: false,
    renderLineHighlight: "none"
};

function CodeEditor({ language, code, setCode, template, width = "650px", height = "400px", lockFirstLine = false }) {
    const editorRef = useRef(null);

    function onMount(editor, monaco) {
        editorRef.current = editor;

        if (lockFirstLine) {
            // Hard Lock: Cursor Logic
            editor.onDidChangeCursorPosition(e => {
                if (e.position.lineNumber === 1) {
                    editor.setPosition({ lineNumber: 2, column: 1 });
                }
            });

            // Content Guard: Prevent modifying line 1 (Signature)
            if (!editor.__listenersAttached) {
                editor.onDidChangeModelContent(e => {
                    e.changes.forEach(change => {
                        if (change.range.startLineNumber === 1) {
                            editor.getModel().setValue(template);
                        }
                    });
                });
                editor.__listenersAttached = true;
            }
        }
    }

    function handleEditorChange(value) {
        if (setCode) setCode(value);
    }

    return (
        <Editor
            width={width}
            height={height}
            language={language === "js" ? "javascript" : language}
            value={code}
            theme="vs-dark"
            onChange={handleEditorChange}
            onMount={onMount}
            options={editorOptions}
        />
    );
}

// Memoize to prevent re-renders when parent state changes but props match
export default React.memo(CodeEditor);

