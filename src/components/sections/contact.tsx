"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Star, AlertCircle, CheckCircle2, MessageSquare, ArrowRight, LifeBuoy, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Contact = () => {
    const [activeTab, setActiveTab] = useState<"review" | "complaint">("review");
    const [rating, setRating] = useState<number>(5);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
    const [category, setCategory] = useState<string>("itinerary");
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        agency: "",
        message: ""
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate submitting to API
        setIsSubmitted(true);
    };

    const handleReset = () => {
        setIsSubmitted(false);
        setFormData({ name: "", email: "", agency: "", message: "" });
        setRating(5);
        setPriority("medium");
    };

    return (
        <section id="contact" className="py-24 bg-black relative overflow-hidden">
            {/* Background Decorative Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-600/[0.03] rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-indigo-600/[0.02] rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-6xl mx-auto px-6 md:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    
                    {/* Left Column: Heading & Tab Selection */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="space-y-4">
                            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-400">
                                Support &amp; Feedback
                            </span>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                                Agent <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">Feedback Hub</span>
                            </h2>
                            <p className="text-zinc-400 font-light leading-relaxed">
                                Your voice shapes the future of Wander Labs. Share a glowing review of your travel planning successes, or report a bug or complaint directly to our engineering team. We read and resolve every request.
                            </p>
                        </div>

                        {/* Interactive Tab Buttons */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
                            <button
                                onClick={() => { setActiveTab("review"); handleReset(); }}
                                className={`flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-300 ${
                                    activeTab === "review"
                                        ? "bg-white/[0.04] border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                                        : "bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.02] hover:border-white/[0.08]"
                                }`}
                            >
                                <div className={`p-3 rounded-xl ${
                                    activeTab === "review" ? "bg-purple-500/10 text-purple-400" : "bg-white/5 text-zinc-400"
                                }`}>
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-base">Share a Review</h4>
                                    <p className="text-zinc-500 text-xs mt-0.5 font-light">Tell us what you love or how we can improve.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => { setActiveTab("complaint"); handleReset(); }}
                                className={`flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-300 ${
                                    activeTab === "complaint"
                                        ? "bg-white/[0.04] border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                                        : "bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.02] hover:border-white/[0.08]"
                                }`}
                            >
                                <div className={`p-3 rounded-xl ${
                                    activeTab === "complaint" ? "bg-red-500/10 text-red-400" : "bg-white/5 text-zinc-400"
                                }`}>
                                    <LifeBuoy className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-base">Register Complaint / Bug</h4>
                                    <p className="text-zinc-500 text-xs mt-0.5 font-light">Report issues, speed lags, or billing bugs.</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Dynamic Interactive Form */}
                    <div className="lg:col-span-7">
                        <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/[0.01] border border-white/[0.06] backdrop-blur-xl relative overflow-hidden group min-h-[500px] flex flex-col justify-center">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] via-transparent to-transparent pointer-events-none" />
                            
                            <AnimatePresence mode="wait">
                                {!isSubmitted ? (
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Your Name</label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        required
                                                        placeholder="e.g. Sarah Jenkins"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 transition-colors duration-300"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                                        {activeTab === "review" ? "Agency (Optional)" : "Email Address"}
                                                    </label>
                                                    <input
                                                        type={activeTab === "review" ? "text" : "email"}
                                                        name={activeTab === "review" ? "agency" : "email"}
                                                        required={activeTab === "complaint"}
                                                        placeholder={activeTab === "review" ? "e.g. Apex Travel Group" : "sarah@apex.travel"}
                                                        value={activeTab === "review" ? formData.agency : formData.email}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 transition-colors duration-300"
                                                    />
                                                </div>
                                            </div>

                                            {/* Share a Review Fields */}
                                            {activeTab === "review" && (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Rating</label>
                                                        <div className="flex items-center gap-2">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <button
                                                                    key={star}
                                                                    type="button"
                                                                    onClick={() => setRating(star)}
                                                                    onMouseEnter={() => setHoverRating(star)}
                                                                    onMouseLeave={() => setHoverRating(0)}
                                                                    className="text-2xl transition-all duration-200 transform hover:scale-110"
                                                                >
                                                                    <Star
                                                                        className={`w-8 h-8 ${
                                                                            star <= (hoverRating || rating)
                                                                                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                                                                                : "text-zinc-600"
                                                                        }`}
                                                                    />
                                                                </button>
                                                            ))}
                                                            <span className="text-sm font-medium text-amber-400 ml-2">
                                                                {rating === 5 ? "Exceptional" : rating === 4 ? "Very Good" : rating === 3 ? "Average" : rating === 2 ? "Below Average" : "Needs Improvement"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Register Complaint Fields */}
                                            {activeTab === "complaint" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Category</label>
                                                        <select
                                                            name="category"
                                                            value={category}
                                                            onChange={(e) => setCategory(e.target.value)}
                                                            className="w-full bg-[#0d0d12] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/40 transition-colors duration-300"
                                                        >
                                                            <option value="itinerary">Itinerary Generation / AI Accuracy</option>
                                                            <option value="billing">Billing &amp; Subscription Issue</option>
                                                            <option value="crm">CRM Lead / Client Tool Bug</option>
                                                            <option value="pdf">PDF Export Layout / Templates</option>
                                                            <option value="speed">App Performance &amp; Lag</option>
                                                            <option value="other">Other Concern</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Severity Priority</label>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {(["low", "medium", "high", "urgent"] as const).map((p) => (
                                                                <button
                                                                    key={p}
                                                                    type="button"
                                                                    onClick={() => setPriority(p)}
                                                                    className={`py-2 px-1 text-xs font-semibold rounded-lg capitalize border transition-all duration-300 ${
                                                                        priority === p
                                                                            ? p === "urgent"
                                                                                ? "bg-red-500/20 border-red-500/50 text-red-400"
                                                                                : p === "high"
                                                                                ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                                                                                : "bg-indigo-500/20 border-indigo-500/50 text-indigo-400"
                                                                            : "bg-white/[0.02] border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.08]"
                                                                    }`}
                                                                >
                                                                    {p}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Textarea message */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                                    {activeTab === "review" ? "Your Message & Feedback" : "Complaint Description & Details"}
                                                </label>
                                                <textarea
                                                    name="message"
                                                    required
                                                    rows={4}
                                                    placeholder={
                                                        activeTab === "review"
                                                            ? "Describe your experience. What features did you love most about Wander Labs?"
                                                            : "Please share exactly what happened. Provide any error messages or details so our engineering team can audit and resolve this for you."
                                                    }
                                                    value={formData.message}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 transition-colors duration-300 resize-none font-light leading-relaxed"
                                                />
                                            </div>

                                            {/* Submit Button */}
                                            <Button
                                                type="submit"
                                                className={`w-full rounded-2xl h-12 font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                                                    activeTab === "review"
                                                        ? "bg-white text-black hover:bg-zinc-200"
                                                        : "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                                }`}
                                            >
                                                {activeTab === "review" ? "Submit Review & Rating" : "Register Complaint Ticket"}
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </form>
                                    </motion.div>
                                ) : (
                                    /* Success State Message */
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.3 }}
                                        className="text-center space-y-6"
                                    >
                                        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-bold text-white">
                                                {activeTab === "review" ? "Thank You!" : "Ticket Registered"}
                                            </h3>
                                            <p className="text-zinc-400 text-sm max-w-sm mx-auto font-light leading-relaxed">
                                                {activeTab === "review"
                                                    ? `Your rating of ${rating} stars was successfully registered. We highly appreciate your review!`
                                                    : `Your complaint about our ${category} system has been registered under ticket #WL-${Math.floor(1000 + Math.random() * 9000)}. Our support team will respond within 2 hours.`}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleReset}
                                            variant="outline"
                                            className="border-white/10 text-zinc-400 hover:text-white rounded-xl"
                                        >
                                            Submit Another Response
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
