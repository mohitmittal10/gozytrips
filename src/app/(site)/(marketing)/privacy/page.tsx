"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";

export default function PrivacyPage() {
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
            <Shield className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
            <p className="text-zinc-500 text-sm mt-1">Last updated: May 17, 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12 text-zinc-300 font-light leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">1. Introduction</h2>
            <p>
              Wander Labs (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, services, and AI-powered travel planning tools.
            </p>
            <p>
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or use our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">2. Information We Collect</h2>
            <p>
              We may collect information about you in a variety of ways. The information we may collect on the Site includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, that you voluntarily give to us when you register with the Site or when you choose to participate in various activities.
              </li>
              <li>
                <strong className="text-white">Client Data:</strong> Details about itineraries, locations, dates, guest counts, and client contact cards that you provide to build proposals.
              </li>
              <li>
                <strong className="text-white">Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.
              </li>
            </ul>
          </section>

          <section id="cookie" className="space-y-4 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white tracking-tight">3. Use of Cookies &amp; Tracking</h2>
            <p>
              We may use cookies, web beacons, tracking pixels, and other tracking technologies on the Site to help customize the Site and improve your experience.
            </p>
            <p>
              Most browsers are set to accept cookies by default. You can remove or reject cookies, but be aware that such action could affect the availability and functionality of the Site.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">4. Security of Your Information</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal info you provide, please be aware that despite our efforts, no security measures are perfect or impenetrable.
            </p>
            <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.06] backdrop-blur-md flex items-start gap-4 my-6">
              <Lock className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-bold mb-1">Our Security Guarantee</h4>
                <p className="text-sm text-zinc-400">
                  Your data and client profiles are isolated in a private digital vault protected by Row Level Security and standard TLS 1.3 encryption protocols.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">5. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at:
            </p>
            <p className="text-white font-medium">
              Wander Labs Support<br />
              Email: security@wanderlabs.travel
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
