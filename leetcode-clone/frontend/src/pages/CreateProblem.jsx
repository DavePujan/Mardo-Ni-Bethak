import { useState } from "react";
import { createProblem } from "../utils/api";

export default function CreateProblem() {
    const [form, setForm] = useState({
        title: "",
        description: "",
        language: "javascript",
        inputFormat: "",
        outputFormat: ""
    });

    const [testCases, setTestCases] = useState([
        { input: "", output: "", isHidden: false }
    ]);

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleTestCaseChange = (index, field, value) => {
        const newCases = [...testCases];
        newCases[index][field] = value;
        setTestCases(newCases);
    };

    const addTestCase = () => {
        setTestCases([...testCases, { input: "", output: "", isHidden: false }]);
    };

    const toggleHidden = (index) => {
        const newCases = [...testCases];
        newCases[index].isHidden = !newCases[index].isHidden;
        setTestCases(newCases);
    };

    const removeTestCase = (index) => {
        setTestCases(testCases.filter((_, i) => i !== index));
    };

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            await createProblem({
                ...form,
                testCases: {
                    public: testCases.filter(tc => !tc.isHidden),
                    hidden: testCases.filter(tc => tc.isHidden)
                }
            });
            alert("Problem Created Successfully!");
        } catch (error) {
            alert("Error creating problem: " + (error.response?.data?.error || error.message));
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin / Teacher Panel: <br /> <span className="text-lg font-normal text-gray-600">Question Create Form</span></h1>

            <form onSubmit={handleSubmit} className="bg-[#1e1e1e] p-6 rounded-lg shadow-lg text-gray-300 font-mono">

                <div className="grid grid-cols-1 gap-4 mb-4">
                    <div>
                        <label className="block text-pink-400 mb-1">Title:</label>
                        <input name="title" value={form.title} onChange={handleChange} className="w-full bg-[#2d2d2d] border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none" placeholder="e.g. Add Two Numbers" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-pink-400 mb-1">Language:</label>
                            <select name="language" value={form.language} onChange={handleChange} className="w-full bg-[#2d2d2d] border border-gray-600 rounded p-2 text-white outline-none">
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-pink-400 mb-1">Description:</label>
                        <textarea name="description" value={form.description} onChange={handleChange} className="w-full bg-[#2d2d2d] border border-gray-600 rounded p-2 text-white h-24 outline-none" placeholder="Problem description..." required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-pink-400 mb-1">Input Format:</label>
                            <input name="inputFormat" value={form.inputFormat} onChange={handleChange} className="w-full bg-[#2d2d2d] border border-gray-600 rounded p-2 text-white outline-none" placeholder="e.g. a b" />
                        </div>
                        <div>
                            <label className="block text-pink-400 mb-1">Output Format:</label>
                            <input name="outputFormat" value={form.outputFormat} onChange={handleChange} className="w-full bg-[#2d2d2d] border border-gray-600 rounded p-2 text-white outline-none" placeholder="e.g. sum" />
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <label className="block text-pink-400 mb-2">Testcases:</label>
                    {testCases.map((tc, i) => (
                        <div key={i} className="flex gap-2 mb-2 items-center bg-[#252526] p-2 rounded">
                            <span className="text-gray-500 w-6">{i + 1})</span>
                            <input
                                placeholder="Input (e.g. 2 3)"
                                value={tc.input}
                                onChange={e => handleTestCaseChange(i, "input", e.target.value)}
                                className="flex-1 bg-[#2d2d2d] border border-gray-600 rounded p-1 text-green-400 text-sm outline-none"
                                required
                            />
                            <span className="text-gray-500">→</span>
                            <input
                                placeholder="Output (e.g. 5)"
                                value={tc.output}
                                onChange={e => handleTestCaseChange(i, "output", e.target.value)}
                                className="flex-1 bg-[#2d2d2d] border border-gray-600 rounded p-1 text-green-400 text-sm outline-none"
                                required
                            />
                            <button type="button" onClick={() => toggleHidden(i)} className={`px-2 py-1 text-xs rounded ${tc.isHidden ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                                {tc.isHidden ? "Hidden" : "Public"}
                            </button>
                            <button type="button" onClick={() => removeTestCase(i)} className="text-red-500 hover:text-red-400 px-2">
                                ✕
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={addTestCase} className="text-sm text-blue-400 hover:underline mt-1">
                        + Add Test Case
                    </button>
                </div>

                <div className="mt-8">
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition">
                        Create Problem
                    </button>
                </div>

            </form>
        </div>
    );
}
