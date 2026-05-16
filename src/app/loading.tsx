import UniqueLoading from "@/components/ui/morph-loading";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#050505] z-[100]">
      <div className="relative group">
        <div className="absolute -inset-8 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
        <UniqueLoading variant="morph" size="lg" className="relative z-10" />
      </div>
    </div>
  );
}
