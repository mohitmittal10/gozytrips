import React from "react";

/**
 * Editor layout — intentionally omits the (site) Header so the editor's
 * own fixed toolbar can take the top of the page cleanly.
 */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
