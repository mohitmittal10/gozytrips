import AiArchitect from "@/components/sections/ai-architect";
import Header from "@/components/layout/header";
import { ProtectedRoute } from "@/components/protected-route";

export default function AiArchitectPage() {
    return (
        <ProtectedRoute>
            <div className="ai-architect-page flex flex-col min-h-screen bg-black">
                <Header />
                <main className="flex-grow pt-24">
                    <AiArchitect />
                </main>
            </div>
        </ProtectedRoute>
    );
}
