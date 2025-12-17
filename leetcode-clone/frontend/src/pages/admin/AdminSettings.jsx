import React, { useState } from "react";
import { updateSettings } from "../../utils/api";

export default function AdminSettings() {
    const [settings, setSettings] = useState({
        allowRegistrations: true,
        allowTeachers: true,
        maintenanceMode: false
    });

    const updateSettingsFn = async () => {
        await updateSettings(settings);
        alert("Settings Updated");
    };

    return (
        <div className="p-6 max-w-2xl">
            <h1 className="text-xl font-semibold mb-4">Platform Settings</h1>

            <label className="block mb-3">
                <input
                    type="checkbox"
                    checked={settings.allowRegistrations}
                    onChange={e =>
                        setSettings({ ...settings, allowRegistrations: e.target.checked })
                    }
                /> Allow New Registrations
            </label>

            <label className="block mb-3">
                <input
                    type="checkbox"
                    checked={settings.allowTeachers}
                    onChange={e =>
                        setSettings({ ...settings, allowTeachers: e.target.checked })
                    }
                /> Allow Teacher Role
            </label>

            <label className="block mb-3">
                <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={e =>
                        setSettings({ ...settings, maintenanceMode: e.target.checked })
                    }
                /> Maintenance Mode
            </label>

            <button className="btn-primary mt-4" onClick={updateSettingsFn}>
                Save Settings
            </button>
        </div>
    );
}
