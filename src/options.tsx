import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Options from "./pages/Options";
import Popup from "./pages/Popup";
import Settings from "./pages/Settings";
import WhatIsNew from "./pages/WhatIsNew";
import './global.css';

import { AutofillProvider } from "./context/AutofillContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <AutofillProvider>
            <HashRouter>
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <Routes>
                    <Route path="/" element={<Options />} />
                    <Route path="/popup" element={<Popup />} />
                    <Route path="/onboarding" element={<WhatIsNew />} />
                    <Route path="/configuracoes" element={<Settings />} />
                    <Route path="/whats-new" element={<WhatIsNew />} />
                </Routes>
            </div>
        </HashRouter>
        </AutofillProvider>
    </React.StrictMode>
);
