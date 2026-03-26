/* eslint-disable import/no-unresolved */
import React from "react";
import ReactDOM from "react-dom/client";
import Popup from "./pages/Popup";
import './global.css';

import { AutofillProvider } from "./context/AutofillContext";

ReactDOM.createRoot(document.body).render(
    <React.StrictMode>
        <AutofillProvider>
            <Popup />
        </AutofillProvider>
    </React.StrictMode>
);
