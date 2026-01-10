import AiArchitect from "@/components/sections/ai-architect";
import Header from "@/components/layout/header";

export default function AiArchitectPage() {
    return (
        <div className="ai-architect-page flex flex-col min-h-screen bg-[#1A1411]">
            <Header />
            <main className="flex-grow pt-24">
                <AiArchitect />
            </main>
        </div>
    );
}
