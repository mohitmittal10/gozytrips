"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

type FloatingActionMenuProps = {
    options: {
        label: string;
        onClick: () => void;
        Icon?: React.ReactNode;
    }[];
    className?: string;
};

const FloatingActionMenu = ({
    options,
    className,
}: FloatingActionMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={cn("fixed bottom-8 right-8 z-50", className)}>
            <Button
                onClick={toggleMenu}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-background/90 to-muted/90 hover:from-accent hover:to-accent/90 shadow-lg border border-border/50 backdrop-blur-md flex items-center justify-center p-0"
            >
                <motion.div
                    animate={{ scale: isOpen ? 0.9 : 1 }}
                    transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                    }}
                >
                    <User className="w-8 h-8" strokeWidth={1.5} />
                </motion.div>
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 10, y: 10, filter: "blur(10px)" }}
                        animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: 10, y: 10, filter: "blur(10px)" }}
                        transition={{
                            duration: 0.6,
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                            delay: 0.1,
                        }}
                        className="absolute bottom-16 right-0 mb-4"
                    >
                        <div className="flex flex-col items-end gap-2">
                            {options.map((option, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: index * 0.05,
                                    }}
                                >
                                    <Button
                                        onClick={option.onClick}
                                        size="sm"
                                        className="flex justify-between items-center gap-3 bg-gradient-to-br from-background/90 to-muted/90 hover:from-accent hover:to-accent/90 shadow-lg border border-border/50 rounded-xl backdrop-blur-md px-4 py-5"
                                    >
                                        {option.Icon}
                                        <span className="font-medium">{option.label}</span>
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FloatingActionMenu;

