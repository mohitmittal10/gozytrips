import React from "react";
import { CheckCircle2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface TheLabInclusionsProps {
  inclusions: string;
  setInclusions: (val: string) => void;
  exclusions: string;
  setExclusions: (val: string) => void;
}

export function TheLabInclusions({
  inclusions,
  setInclusions,
  exclusions,
  setExclusions,
}: TheLabInclusionsProps) {
  return (
    <div className="flex flex-col gap-8 pb-10 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <div className="p-2 bg-emerald-500/10 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Trip Inclusions</h2>
            <p className="text-sm text-gray-400">Specify what is included in this itinerary.</p>
          </div>
        </div>

        <Textarea
          value={inclusions}
          onChange={(e) => setInclusions(e.target.value)}
          placeholder="e.g. Daily breakfast, airport transfers, 24/7 support..."
          className="min-h-[250px] bg-black/40 border-white/10 text-white placeholder:text-gray-500 rounded-xl resize-y text-base p-4 focus-visible:ring-emerald-500/50"
        />
      </div>

      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <div className="p-2 bg-rose-500/10 rounded-xl">
            <X className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Trip Exclusions</h2>
            <p className="text-sm text-gray-400">Specify what is not included in this itinerary.</p>
          </div>
        </div>

        <Textarea
          value={exclusions}
          onChange={(e) => setExclusions(e.target.value)}
          placeholder="e.g. International flights, visa fees, personal expenses..."
          className="min-h-[250px] bg-black/40 border-white/10 text-white placeholder:text-gray-500 rounded-xl resize-y text-base p-4 focus-visible:ring-rose-500/50"
        />
      </div>
    </div>
  );
}
