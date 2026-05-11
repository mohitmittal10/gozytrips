"use client";

import React from "react";
import { CrmProvider } from "./context/CrmContext";
import { CrmApp } from "./components/CrmApp";
import "./crm-responsive.css";

export default function CRMLitePage() {
    return (
        <CrmProvider>
            <CrmApp />
        </CrmProvider>
    );
}

