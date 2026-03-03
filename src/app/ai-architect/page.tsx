import AiArchitect from "@/components/sections/ai-architect";
import Header from "@/components/layout/header";

// Extend Vercel serverless function timeout for AI generation
export const maxDuration = 60;

export default function AiArchitectPage() {
    return (
        <div className="ai-architect-page flex flex-col min-h-screen bg-black">
            <Header />
            <main className="flex-grow pt-24">
                <AiArchitect />
            </main>
        </div>
    );
}
