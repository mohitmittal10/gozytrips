import AiArchitect from "@/components/sections/ai-architect";

export default function AiArchitectPage() {
    return (
        <div className="font-body text-on-surface antialiased min-h-[100dvh] bg-[#05070a] bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,92,51,0.08),transparent_50%)]">
            <div className="pt-[56px] sm:pt-[64px] md:pt-[72px] pb-4 backdrop-blur-[2px]">
                <AiArchitect />
            </div>
        </div>
    );
}
