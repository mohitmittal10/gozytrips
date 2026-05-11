"use client";

import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthRequired() {
    const router = useRouter();
    return (
        <div className="flex flex-col min-h-screen bg-[#05070a] bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,92,51,0.08),transparent_50%)]">
            <div className="flex-1 container mx-auto px-4 pt-32 pb-12 text-center">
                <div className="max-w-md mx-auto glass-main p-8 border-white/10 rounded-2xl">
                    <User className="w-16 h-16 mx-auto text-primary/40 mb-4" />
                    <h2 className="text-2xl font-bold mb-4 text-white">Sign In Required</h2>
                    <p className="text-gray-400 mb-8">Please sign in to manage your clients and track their journeys.</p>
                    <Button onClick={() => router.push('/auth/login')} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 rounded-xl">
                        Sign In to Continue
                    </Button>
                </div>
            </div>
        </div>
    );
}

