"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Lock, Globe, Scale } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#020205] text-white pt-32 pb-24 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/[0.03] rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/[0.03] rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <Link href="/">
          <Button variant="ghost" className="mb-8 gap-2 text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
            <Scale className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Terms of Service</h1>
            <p className="text-zinc-500 text-sm mt-1">Last updated: May 17, 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12 text-zinc-300 font-light leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">1. Agreement to Terms</h2>
            <p>
              These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity (&quot;you&quot;) and Wander Labs (&quot;we,&quot; &quot;us&quot; or &quot;our&quot;), concerning your access to and use of the website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto.
            </p>
            <p>
              You agree that by accessing the Site, you have read, understood, and agree to be bound by all of these Terms of Service. If you do not agree with all of these Terms of Service, then you are expressly prohibited from using the Site and you must discontinue use immediately.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">2. User Accounts</h2>
            <p>
              To access certain features of the Site, you may be required to register for an account. You agree to keep your password confidential and will be responsible for all use of your account and password.
            </p>
            <p>
              We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">3. Prohibited Activities</h2>
            <p>
              You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
            </p>
            <p>
              As a user of the Site, you agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Systematically retrieve data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
              <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
              <li>Circumvent, disable, or otherwise interfere with security-related features of the Site.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">4. Limitation of Liability</h2>
            <p>
              In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of the Site, even if we have been advised of the possibility of such damages.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">5. Governing Law</h2>
            <p>
              These Terms of Service and your use of the Site are governed by and construed in accordance with the laws of Delaware, without regard to its conflict of law principles.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
