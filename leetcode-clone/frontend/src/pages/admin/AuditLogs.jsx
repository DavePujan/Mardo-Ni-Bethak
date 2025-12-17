import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        async function fetchLogs() {
            const { data } = await supabase.from("audit_logs").select("*").order('created_at', { ascending: false });
            setLogs(data || []);
        }
        fetchLogs();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-xl font-semibold mb-4">Audit Logs</h1>

            <table className="w-full bg-white shadow rounded">
                <thead>
                    <tr>
                        <th>Action</th>
                        <th>User</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((l, i) => (
                        <tr key={i}>
                            <td>{l.action}</td>
                            <td>{l.user}</td>
                            <td>{l.time}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
