import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function CreateQuestion() {
    const [form, setForm] = useState({
        title: "",
        function_name: "",
        language: "javascript",
        input_format: "",
        output_format: "",
        quiz_type: "code",
        weightage: 10,
        testcases: [{ input: "", output: "" }]
    });

    const updateTestcase = (i, key, value) => {
        const t = [...form.testcases];
        t[i][key] = value;
        setForm({ ...form, testcases: t });
    };

    const addTestcase = () => {
        setForm({
            ...form,
            testcases: [...form.testcases, { input: "", output: "" }]
        });
    };

    const submit = async () => {
        const { data: question } = await supabase
            .from("questions")
            .insert({
                title: form.title,
                function_name: form.function_name,
                language: form.language,
                input_format: form.input_format,
                output_format: form.output_format,
                type: form.quiz_type,
                weightage: form.weightage
            })
            .select()
            .single();

        await supabase.from("testcases").insert(
            form.testcases.map(tc => ({
                question_id: question.id,
                input: tc.input,
                expected_output: tc.output
            }))
        );

        alert("Question Created");
    };

    return (
        <div className="p-6 max-w-3xl">
            <h2 className="text-xl font-semibold mb-4">Question Create Form</h2>

            <div className="bg-black text-green-400 p-4 rounded font-mono space-y-2">
                <p>Title: <input className="bg-black outline-none ml-2" onChange={e => setForm({ ...form, title: e.target.value })} /></p>
                <p>Function Name: <input className="bg-black outline-none ml-2" onChange={e => setForm({ ...form, function_name: e.target.value })} /></p>
                <p>
                    Language:
                    <select className="bg-black ml-2" onChange={e => setForm({ ...form, language: e.target.value })}>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                    </select>
                </p>
                <p>Input Format: <input className="bg-black ml-2" onChange={e => setForm({ ...form, input_format: e.target.value })} /></p>
                <p>Output Format: <input className="bg-black ml-2" onChange={e => setForm({ ...form, output_format: e.target.value })} /></p>

                <p>
                    Quiz Type:
                    <select className="bg-black ml-2" onChange={e => setForm({ ...form, quiz_type: e.target.value })}>
                        <option value="mcq">MCQ</option>
                        <option value="code">Code</option>
                        <option value="hybrid">MCQ + Code</option>
                    </select>
                </p>

                <p>Weightage: <input type="number" className="bg-black ml-2 w-16" onChange={e => setForm({ ...form, weightage: e.target.value })} /></p>

                <p>Testcases:</p>
                {form.testcases.map((tc, i) => (
                    <div key={i} className="ml-4">
                        <p>{i + 1}) input: <input className="bg-black ml-2" onChange={e => updateTestcase(i, "input", e.target.value)} /></p>
                        <p>   output: <input className="bg-black ml-2" onChange={e => updateTestcase(i, "output", e.target.value)} /></p>
                    </div>
                ))}

                <button onClick={addTestcase} className="text-blue-400 mt-2">+ Add testcase</button>
            </div>

            <button onClick={submit} className="btn-primary mt-4">Save Question</button>
        </div>
    );
}
