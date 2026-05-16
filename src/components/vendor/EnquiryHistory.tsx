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
        <Button variant="outline" className="border-white/10 text-gray-400 hover:text-white gap-2 h-10">
          <History className="w-4 h-4" />
          History {enquiries.length > 0 && (
            <Badge variant="secondary" className="ml-1 bg-purple-500/20 text-purple-400 border-none">
              {enquiries.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-[#0a0a0a] border-white/10 text-white w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            Recent Enquiries
          </SheetTitle>
          <SheetDescription className="text-gray-500">
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
              <p className="text-gray-500 text-sm">No past enquiries found.</p>
            </div>
          ) : (
            enquiries.map((enq) => (
              <div
                key={enq.id}
                className="group relative bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="capitalize text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20"
                    >
                      {enq.enquiry_type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`capitalize text-[10px] ${
                        enq.status === "sent"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {enq.status}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {new Date(enq.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-200 truncate pr-8">
                  {enq.payload.destination}
                </h4>
                <p className="text-xs text-gray-500 truncate mb-3">
                  {enq.subject || "No subject"}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white border-none flex-1"
                    onClick={() => onLoad(enq)}
                  >
                    Resume
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 border-white/10 text-gray-500 hover:text-red-400 hover:bg-red-400/10"
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

