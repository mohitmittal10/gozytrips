import TheLab from "@/components/sections/the-lab";

export default function TheLabPage() {
    return (
        <div className="font-body text-on-surface antialiased bg-[#EFECE5] dark:bg-black min-h-screen transition-colors duration-300">
            <div className="pt-[56px] sm:pt-[64px] md:pt-[72px] pb-4 backdrop-blur-[2px]">
                <TheLab />
            </div>
        </div>
    );
}


