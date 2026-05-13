"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Calendar as CalendarIcon, Check, ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const LabelClass = "text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1.5 block";
const InputClass = "flex h-10 sm:h-11 w-full text-sm border border-white/10 bg-white/5 backdrop-blur rounded-xl px-3 py-2 text-white placeholder-zinc-500 transition-all outline-none";
const InputActiveClass = "border-primary/50 ring-1 ring-primary/20";
const TextareaClass = "flex min-h-[80px] w-full border border-white/10 bg-white/5 backdrop-blur rounded-xl p-3 resize-none text-xs text-white placeholder-zinc-500 transition-all outline-none";

export default function Step1Animation() {
    const [step, setStep] = useState(0); // 0, 1, 2
    const [visibleFields, setVisibleFields] = useState<string[]>([]);
    const [btnVisible, setBtnVisible] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    // Form 1 State
    const [startLocation, setStartLocation] = useState("");
    const [destinations, setDestinations] = useState("");
    const [endLocation, setEndLocation] = useState("");
    const [activeInput, setActiveInput] = useState<string | null>(null);

    // Form 2 State
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Form 3 State
    const [budget, setBudget] = useState("");
    const [timingPref, setTimingPref] = useState("Preference");
    const [mustInclude, setMustInclude] = useState("");
    const [avoid, setAvoid] = useState("");
    const [leisureTime, setLeisureTime] = useState(false);
    const [leisureDay, setLeisureDay] = useState("");

    const typeInto = async (setter: (val: string) => void, text: string, delay = 50) => {
        let current = "";
        for (const char of text) {
            current += char;
            setter(current);
            await sleep(delay + Math.random() * 30);
        }
    };

    const runAnimation = async () => {
        // Reset everything
        setStep(0);
        setVisibleFields([]);
        setBtnVisible(false);
        setIsComplete(false);
        setStartLocation("");
        setDestinations("");
        setEndLocation("");
        setStartDate("");
        setEndDate("");
        setBudget("");
        setTimingPref("Preference");
        setMustInclude("");
        setAvoid("");
        setLeisureTime(false);
        setLeisureDay("");
        setActiveInput(null);

        await sleep(800);

        // --- FORM 1: Destinations ---
        setVisibleFields(["f1_1", "f1_2", "f1_3"]);
        await sleep(500);

        setActiveInput("f1_1");
        await typeInto(setStartLocation, "New Delhi, India");
        setActiveInput(null);
        await sleep(300);

        setActiveInput("f1_2");
        await typeInto(setDestinations, "Paris, Rome, Florence");
        setActiveInput(null);
        await sleep(300);

        setActiveInput("f1_3");
        await typeInto(setEndLocation, "New Delhi, India");
        setActiveInput(null);
        await sleep(500);

        setBtnVisible(true);
        await sleep(800);
        
        // Transition to Form 2
        setBtnVisible(false);
        setStep(1);
        setVisibleFields([]);
        await sleep(400);

        // --- FORM 2: Dates ---
        setVisibleFields(["f2_1", "f2_2"]);
        await sleep(500);

        setActiveInput("f2_1");
        await sleep(300);
        await typeInto(setStartDate, "Jun 15, 2025", 60);
        setActiveInput(null);
        await sleep(300);

        setActiveInput("f2_2");
        await sleep(300);
        await typeInto(setEndDate, "Jun 22, 2025", 60);
        setActiveInput(null);
        await sleep(500);

        setBtnVisible(true);
        await sleep(800);

        // Transition to Form 3
        setBtnVisible(false);
        setStep(2);
        setVisibleFields([]);
        await sleep(400);

        // --- FORM 3: Preferences ---
        setVisibleFields(["f3_1", "f3_2", "f3_3", "f3_4", "f3_5", "f3_6"]);
        await sleep(500);

        setActiveInput("f3_1");
        await typeInto(setBudget, "45000", 80);
        setActiveInput(null);
        await sleep(300);

        setActiveInput("f3_2");
        await sleep(300);
        setTimingPref("Morning");
        setActiveInput(null);
        await sleep(300);

        setActiveInput("f3_3");
        await typeInto(setMustInclude, "Eiffel Tower, local cafes");
        setActiveInput(null);
        await sleep(300);

        setActiveInput("f3_4");
        await typeInto(setAvoid, "Long queues, crowded spots");
        setActiveInput(null);
        await sleep(300);

        setActiveInput("f3_5");
        await sleep(300);
        setLeisureTime(true);
        setActiveInput(null);
        await sleep(300);

        setActiveInput("f3_6");
        await typeInto(setLeisureDay, "2", 100);
        setActiveInput(null);
        await sleep(500);

        setBtnVisible(true);
        await sleep(1000);

        // Complete
        setIsComplete(true);
        await sleep(4000); // Wait before restart
        runAnimation();
    };

    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-20%" });
    const hasStarted = useRef(false);

    useEffect(() => {
        if (isInView && !hasStarted.current) {
            hasStarted.current = true;
            runAnimation();
        }
    }, [isInView]);

    const theLabSteps = [{ id: 1 }, { id: 2 }, { id: 3 }];

    return (
        <div ref={ref} className="relative w-full max-w-[380px] md:ml-0 mx-auto perspective-1000">
            <style jsx>{`
                @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
                .typing-cursor {
                    display: inline-block;
                    width: 2px; height: 14px;
                    background: #a78bfa;
                    vertical-align: middle;
                    margin-left: 1px;
                    animation: blink 0.9s infinite;
                }
            `}</style>

            <motion.div 
                className="bg-zinc-950/40 backdrop-blur-md rounded-3xl p-6 relative overflow-hidden border border-white/5 shadow-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Progress Indicators */}
                <div className="mb-6 flex flex-col items-center">
                        <div className="flex items-center justify-center gap-2">
                            {theLabSteps.map((s, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div
                                        className={cn(
                                            "flex h-6 w-6 items-center justify-center rounded-full transition-all duration-700 ease-out text-xs",
                                            index < step && "bg-white/10 text-white/60",
                                            index === step && "bg-white text-black shadow-lg",
                                            index > step && "bg-zinc-800/50 text-zinc-500",
                                        )}
                                    >
                                        {index < step ? <Check className="h-3 w-3" strokeWidth={2.5} /> : <span className="font-bold tabular-nums">{s.id}</span>}
                                    </div>
                                    {index < theLabSteps.length - 1 && (
                                        <div className="relative h-[1px] w-6">
                                            <div className="absolute inset-0 bg-white/10" />
                                            <div className="absolute inset-0 bg-white/30 transition-all duration-700 ease-out origin-left" style={{ transform: `scaleX(${index < step ? 1 : 0})` }} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 w-full overflow-hidden rounded-full bg-white/5 h-[1px]">
                            <div className="h-full bg-white/60 transition-all duration-1000 ease-out" style={{ width: `${((step + 1) / theLabSteps.length) * 100}%` }} />
                        </div>
                    </div>

                <div className="h-[310px] w-full">
                    <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div
                            key="form1"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-4"
                        >
                            <AnimatedField label="Starting Location" visible={visibleFields.includes("f1_1")}>
                                <div className={cn(InputClass, activeInput === "f1_1" && InputActiveClass)}>
                                    <span className={!startLocation && activeInput !== "f1_1" ? "text-zinc-500" : "text-white"}>
                                        {startLocation || (activeInput === "f1_1" ? "" : "e.g., New Delhi, India")}
                                    </span>
                                    {activeInput === "f1_1" && <span className="typing-cursor" />}
                                </div>
                            </AnimatedField>

                            <AnimatedField label="Destinations to Visit" visible={visibleFields.includes("f1_2")}>
                                <div className={cn(InputClass, activeInput === "f1_2" && InputActiveClass)}>
                                    <span className={!destinations && activeInput !== "f1_2" ? "text-zinc-500" : "text-white"}>
                                        {destinations || (activeInput === "f1_2" ? "" : "e.g., Paris, Rome, Florence")}
                                    </span>
                                    {activeInput === "f1_2" && <span className="typing-cursor" />}
                                </div>
                            </AnimatedField>

                            <AnimatedField label="Ending Location (Optional)" visible={visibleFields.includes("f1_3")}>
                                <div className={cn(InputClass, activeInput === "f1_3" && InputActiveClass)}>
                                    <span className={!endLocation && activeInput !== "f1_3" ? "text-zinc-500" : "text-white"}>
                                        {endLocation || (activeInput === "f1_3" ? "" : "Return location")}
                                    </span>
                                    {activeInput === "f1_3" && <span className="typing-cursor" />}
                                </div>
                            </AnimatedField>
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div
                            key="form2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-2 gap-3"
                        >
                            <AnimatedField label="Start Date" visible={visibleFields.includes("f2_1")}>
                                <div className={cn(InputClass, "items-center px-3", activeInput === "f2_1" && InputActiveClass)}>
                                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0 text-white/40" />
                                    <span className={!startDate && activeInput !== "f2_1" ? "text-zinc-500" : "text-white font-medium"}>
                                        {startDate || (activeInput === "f2_1" ? "" : "Select date")}
                                    </span>
                                    {activeInput === "f2_1" && <span className="typing-cursor" />}
                                </div>
                            </AnimatedField>

                            <AnimatedField label="End Date" visible={visibleFields.includes("f2_2")}>
                                <div className={cn(InputClass, "items-center px-3", activeInput === "f2_2" && InputActiveClass)}>
                                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0 text-white/40" />
                                    <span className={!endDate && activeInput !== "f2_2" ? "text-zinc-500" : "text-white font-medium"}>
                                        {endDate || (activeInput === "f2_2" ? "" : "Select date")}
                                    </span>
                                    {activeInput === "f2_2" && <span className="typing-cursor" />}
                                </div>
                            </AnimatedField>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="form3"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <AnimatedField label="Budget (₹)" visible={visibleFields.includes("f3_1")}>
                                    <div className={cn(InputClass, activeInput === "f3_1" && InputActiveClass)}>
                                        <span className={!budget && activeInput !== "f3_1" ? "text-zinc-500" : "text-white"}>
                                            {budget || (activeInput === "f3_1" ? "" : "Total budget")}
                                        </span>
                                        {activeInput === "f3_1" && <span className="typing-cursor" />}
                                    </div>
                                </AnimatedField>
                                <AnimatedField label="Timing Preference" visible={visibleFields.includes("f3_2")}>
                                    <div className={cn(InputClass, "items-center justify-between", activeInput === "f3_2" && InputActiveClass)}>
                                        <span className={timingPref === "Preference" ? "text-zinc-500" : "text-white"}>
                                            {timingPref}
                                        </span>
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </div>
                                </AnimatedField>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <AnimatedField label="Must-Include" visible={visibleFields.includes("f3_3")}>
                                    <div className={cn(TextareaClass, activeInput === "f3_3" && InputActiveClass)}>
                                        <span className={!mustInclude && activeInput !== "f3_3" ? "text-zinc-500" : "text-white"}>
                                            {mustInclude || (activeInput === "f3_3" ? "" : "e.g., Eiffel Tower")}
                                        </span>
                                        {activeInput === "f3_3" && <span className="typing-cursor" />}
                                    </div>
                                </AnimatedField>
                                <AnimatedField label="Things to Avoid" visible={visibleFields.includes("f3_4")}>
                                    <div className={cn(TextareaClass, activeInput === "f3_4" && InputActiveClass)}>
                                        <span className={!avoid && activeInput !== "f3_4" ? "text-zinc-500" : "text-white"}>
                                            {avoid || (activeInput === "f3_4" ? "" : "e.g., Long queues")}
                                        </span>
                                        {activeInput === "f3_4" && <span className="typing-cursor" />}
                                    </div>
                                </AnimatedField>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <AnimatedField label="Leisure Time" visible={visibleFields.includes("f3_5")} noLabelMargin>
                                    <div className={cn("flex flex-row items-center justify-between rounded-xl border border-white/10 bg-white/5 backdrop-blur px-3 py-2", activeInput === "f3_5" && InputActiveClass)}>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500 m-0">Leisure Time</span>
                                        <div className={cn("w-9 h-5 rounded-full transition-colors relative", leisureTime ? "bg-primary" : "bg-zinc-700")}>
                                            <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform", leisureTime ? "translate-x-4" : "")} />
                                        </div>
                                    </div>
                                </AnimatedField>
                                <div className={cn("transition-opacity duration-300", !leisureTime ? "opacity-30" : "opacity-100")}>
                                    <AnimatedField label="" visible={visibleFields.includes("f3_6")}>
                                        <div className={cn("h-9 flex items-center text-[11px] border border-white/10 bg-white/5 backdrop-blur rounded-xl px-3 mt-1", activeInput === "f3_6" && InputActiveClass)}>
                                            <span className={!leisureDay && activeInput !== "f3_6" ? "text-zinc-500" : "text-white"}>
                                                {leisureDay || (activeInput === "f3_6" ? "" : "Day Preference")}
                                            </span>
                                            {activeInput === "f3_6" && <span className="typing-cursor" />}
                                        </div>
                                    </AnimatedField>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-4 mt-2 border-t border-white/5">
                        <motion.button
                            className="w-full h-10 group transition-all duration-300 hover:shadow-lg bg-primary text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-80"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: btnVisible ? 1 : 0, y: btnVisible ? 0 : 5 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {step < 2 ? (
                                <>Continue <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 duration-300" strokeWidth={2} /></>
                            ) : (
                                <>Generate Optimized Trip</>
                            )}
                        </motion.button>
                        {step > 0 && (
                            <div className="w-full text-center text-[11px] font-bold uppercase tracking-widest text-zinc-600">
                                Go back
                            </div>
                        )}
                    </div>

                {/* Complete Overlay */}
                <AnimatePresence>
                    {isComplete && (
                        <motion.div 
                            className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 z-50 rounded-3xl"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div 
                                className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4"
                                initial={{ scale: 0.5 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 12 }}
                            >
                                <Check className="w-8 h-8 text-emerald-400" />
                            </motion.div>
                            <h4 className="text-lg font-bold text-white mb-2">Generating Trip...</h4>
                            <div className="w-40 h-1 bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-primary"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 2, ease: "easeInOut" }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

function AnimatedField({ label, children, visible, noLabelMargin = false }: { label: string; children: React.ReactNode; visible: boolean; noLabelMargin?: boolean }) {
    return (
        <div className={`transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
            {label && <label className={cn(LabelClass, noLabelMargin && "mb-0")}>{label}</label>}
            {children}
        </div>
    );
}

