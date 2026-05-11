"use client";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export const TypingText = ({ 
  texts, 
  className 
}: { 
  texts: string[];
  className?: string;
}) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const typeSpeed = isDeleting ? 50 : 100;
    const currentFullText = texts[currentTextIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting && currentText === currentFullText) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && currentText === "") {
        setIsDeleting(false);
        setCurrentTextIndex((prev) => (prev + 1) % texts.length);
      } else {
        setCurrentText(
          currentFullText.substring(0, currentText.length + (isDeleting ? -1 : 1))
        );
      }
    }, typeSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentTextIndex, texts]);

  return (
    <span className={cn("inline-block min-w-[20px] border-r-[4px] border-primary pr-2 animate-[pulse_1s_ease-in-out_infinite]", className)}>
      {currentText || "\u00A0"}
    </span>
  );
};

