import { useEffect, useRef, useState, lazy } from "react";
import { templates } from "../utils/templates";
import { submitCodeAsync } from "../utils/api";
import { io } from "socket.io-client";

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
    const [currentJobId, setCurrentJobId] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const socketRef = useRef(null);
    const currentJobIdRef = useRef(null);
    const executionIdRef = useRef(0);

    const timelineSteps = [
        "Running...",
        "Executing public test cases...",
        "Executing hidden test cases...",
        "Accepted ✅"
    ];

    const getStepIndex = (status) => {
        if (!status) return -1;
        const normalized = String(status).toLowerCase();
        if (normalized.includes("accepted")) return 3;
        if (normalized.includes("hidden")) return 2;
        if (normalized.includes("public")) return 1;
        if (normalized.includes("running")) return 0;
        if (normalized.includes("public tests passed")) return 2;
        return -1;
    };

    const isTerminalStatus = (status) => {
        if (!status) return false;
        return (
            status.includes("Accepted") ||
            status.includes("Wrong Answer") ||
            status.includes("Runtime Error") ||
            status.includes("Compilation Error") ||
            status.includes("Time Limit") ||
            status.includes("Language not supported") ||
            status.includes("Question not found") ||
            status.includes("Public Tests Passed") ||
            status.includes("Failed") ||
            status.includes("Error")
        );
    };

    useEffect(() => {
        const socket = io("http://localhost:5000", {
            withCredentials: true
        });
        socketRef.current = socket;

        socket.on("status", (payload) => {
            if (!payload?.jobId || payload.jobId !== currentJobIdRef.current) return;
            if (payload?.executionId !== executionIdRef.current) return;

            setResult((prev) => ({
                ...(prev || {}),
                verdict: payload?.status || "Running...",
                ...(payload?.result || {})
            }));

            if (isTerminalStatus(payload?.status)) {
                setIsRunning(false);
            }
        });

        return () => {
            socket.off("status");
            socket.disconnect();
        };
    }, []);

    async function handleAsyncSubmit(mode) {
        if (!validateCode(code)) {
            alert("Security Violation: You cannot use main(), fs, Scanner, or process exit.");
            return;
        }

        try {
            executionIdRef.current += 1;
            const currentExecutionId = executionIdRef.current;

            setIsRunning(true);
            setResult({ verdict: "Running..." });

            const res = await submitCodeAsync({
                questionId: "add-two",
                language,
                code,
                executionId: currentExecutionId
            }, mode);

            const jobId = res?.data?.jobId;
            if (!jobId) {
                setResult({ verdict: "Failed to queue submission" });
                setIsRunning(false);
                return;
            }

            const normalizedJobId = String(jobId);
            setCurrentJobId(normalizedJobId);
            currentJobIdRef.current = normalizedJobId;
            socketRef.current?.emit("join-job", normalizedJobId);
        } catch (error) {
            console.error(error);
            setResult({ verdict: "Error submitting code" });
            setIsRunning(false);
        }
    }

    async function handleRun() {
        await handleAsyncSubmit("run");
    }

    async function handleSubmit() {
        await handleAsyncSubmit("submit");
    }

    const verdictColor =
        result?.verdict === "Accepted" || result?.verdict === "Accepted ✅" || result?.verdict === "Public Tests Passed"
            ? "green"
            : result?.verdict === "Running..." || result?.verdict?.includes("Executing")
                ? "orange"
                : "red";

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", padding: "10px" }}>
            <div style={{ marginBottom: "10px" }}>
                <select onChange={e => {
                    setLanguage(e.target.value);
                    setCode(templates[e.target.value]);
                }} value={language} style={{ padding: "5px" }} disabled={isRunning}>
                    <option value="js">JavaScript</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="php">PHP</option>
                </select>
                <button onClick={handleRun} style={{ marginLeft: "10px", padding: "5px 15px" }} disabled={isRunning}>Run</button>
                <button onClick={handleSubmit} style={{ marginLeft: "10px", padding: "5px 15px" }} disabled={isRunning}>Submit</button>
            </div>

            <CodeEditor
                language={language}
                code={code}
                setCode={setCode}
                template={templates[language]}
                readOnly={isRunning}
            />

            {result && (
                <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc", background: "#f9f9f9" }}>
                    <h3>Status: <span style={{ color: verdictColor }}>{result.verdict}</span></h3>

                    {currentJobId && (
                        <p><strong>Job ID:</strong> {currentJobId}</p>
                    )}

                    <div style={{ marginTop: 12 }}>
                        {timelineSteps.map((step, i) => {
                            const current = getStepIndex(result?.verdict);
                            const isActive = i <= current;

                            return (
                                <div
                                    key={step}
                                    style={{
                                        color: isActive ? "#00aa55" : "#999",
                                        marginBottom: 4,
                                        fontWeight: isActive ? 600 : 400
                                    }}
                                >
                                    {isActive ? "✔" : "•"} {step}
                                </div>
                            );
                        })}
                    </div>

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

