/* eslint-disable import/named */
/* eslint-disable import/no-unresolved */
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HowToUse from "./pages/HowToUse";
import Options from "./pages/Options";
import Popup from "./pages/Popup";
import Settings from "./pages/Settings";
import './global.css';

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <HashRouter>
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <Routes>
                    <Route path="/" element={<Options />} />
                    <Route path="/popup" element={<Popup />} />
                    <Route path="/como-usar" element={<HowToUse />} />
                    <Route path="/configuracoes" element={<Settings />} />
                </Routes>
            </div>
        </HashRouter>
    </React.StrictMode>
);
