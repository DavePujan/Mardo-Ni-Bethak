import { useState, lazy, Suspense, useMemo, useCallback } from "react";
import { templates } from "../utils/templates";
import { submitCode } from "../utils/api";
import debounce from "lodash.debounce";

// Lazy load editor to reduce initial bundle size
const CodeEditor = lazy(() => import("../components/CodeEditor"));

const FORBIDDEN = [
    "main(", "Scanner", "fs.", "System.exit", "process", "require("
];

function validateCode(code) {
    return !FORBIDDEN.some(k => code.includes(k));
}

export default function Problem() {
    const [language, setLanguage] = useState("js");
    const [code, setCode] = useState(templates.js);
    const [result, setResult] = useState(null);

    async function handleSubmit() {
        if (!validateCode(code)) {
            alert("Security Violation: You cannot use main(), fs, Scanner, or process exit.");
            return;
        }

        try {
            const res = await submitCode({
                questionId: "add-two",
                language,
                code
            });
            setResult(res.data);
        } catch (error) {
            console.error(error);
            setResult({ verdict: "Error submitting code" });
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", padding: "10px" }}>
            <div style={{ marginBottom: "10px" }}>
                <select onChange={e => {
                    setLanguage(e.target.value);
                    setCode(templates[e.target.value]);
                }} value={language} style={{ padding: "5px" }}>
                    <option value="js">JavaScript</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                </select>
                <button onClick={handleSubmit} style={{ marginLeft: "10px", padding: "5px 15px" }}>Submit</button>
            </div>

            <CodeEditor
                language={language}
                code={code}
                setCode={setCode}
                template={templates[language]}
            />

            {result && (
                <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc", background: "#f9f9f9" }}>
                    <h3>Verdict: <span style={{ color: result.verdict === "Accepted" ? "green" : "red" }}>{result.verdict}</span></h3>

                    {result.stats && (
                        <div>
                            <p><strong>Runtime:</strong> {result.stats.runtime}s</p>
                            <p><strong>Memory:</strong> {Math.round(result.stats.memory / 1024)} KB</p>
                        </div>
                    )}

                    {result.debug && (
                        <div style={{ background: "#eee", padding: "10px", marginTop: "10px" }}>
                            <p><strong>Input:</strong> {result.debug.input}</p>
                            <p><strong>Output:</strong> {result.debug.output}</p>
                            <p><strong>Expected:</strong> {result.debug.expected}</p>
                            {result.debug.error && <pre style={{ color: "red" }}>{result.debug.error}</pre>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

