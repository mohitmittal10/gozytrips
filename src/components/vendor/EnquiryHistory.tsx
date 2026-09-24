import React from "react";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Trash2 } from "lucide-react";
import { VendorEnquiry } from "@/types/vendor-enquiry";
import UniqueLoading from "../ui/morph-loading";

interface EnquiryHistoryProps {
  enquiries: VendorEnquiry[];
  isLoading: boolean;
  onLoad: (enq: VendorEnquiry) => void;
  onDelete: (enqId: string) => Promise<void>;
}

export function EnquiryHistory({ enquiries, isLoading, onLoad, onDelete }: EnquiryHistoryProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="border-white/10 text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 gap-2 h-10 rounded-xl font-semibold transition-all">
          <History className="w-4 h-4 text-primary" />
          History {enquiries.length > 0 && (
            <Badge variant="secondary" className="ml-1 bg-primary/20 text-primary border-none">
              {enquiries.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-[#0c0c0e]/95 backdrop-blur-2xl border-white/10 text-white w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2 font-bold text-lg">
            <History className="w-5 h-5 text-primary" />
            Recent Enquiries
          </SheetTitle>
          <SheetDescription className="text-slate-600 dark:text-zinc-400 text-xs">
            Audit and resume your past vendor outreach.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)] pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <UniqueLoading variant="morph" size="sm" />
            </div>
          ) : enquiries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-zinc-400 text-sm font-medium">No past enquiries found.</p>
            </div>
          ) : (
            enquiries.map((enq) => (
              <div
                key={enq.id}
                className="group relative bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-primary/40 transition-all duration-200 shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="capitalize text-[10px] bg-primary/10 text-primary border-primary/20 font-semibold"
                    >
                      {enq.enquiry_type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`capitalize text-[10px] font-semibold ${
                        enq.status === "sent"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {enq.status}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-medium">
                    {new Date(enq.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-zinc-100 truncate pr-8">
                  {enq.payload.destination}
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 truncate mb-3">
                  {enq.subject || "No subject"}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-8 text-xs aurora-gradient text-white border-none flex-1 font-bold rounded-lg shadow-sm"
                    onClick={() => onLoad(enq)}
                  >
                    Resume
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 border-white/10 text-slate-600 dark:text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    onClick={() => onDelete(enq.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

