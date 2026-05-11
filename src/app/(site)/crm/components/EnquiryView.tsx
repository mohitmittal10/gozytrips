import React from "react";
import dynamic from "next/dynamic";
const VendorEnquiry = dynamic(() => import("@/components/vendor-enquiry"), { ssr: false });

export const EnquiryView = () => {
    return (
        <div className="mt-4">
            <VendorEnquiry />
        </div>
    );
};

