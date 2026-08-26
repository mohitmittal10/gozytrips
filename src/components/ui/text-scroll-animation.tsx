"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import ReactLenis from "lenis/react";
import React, { useRef } from "react";
import { cn } from "@/lib/utils";

type CharacterProps = {
  char: string;
  index: number;
  totalChars: number;
  centerIndex: number;
  scrollYProgress: any;
  isHighlighted?: boolean;
};

const CharacterV1 = ({
  char,
  index,
  totalChars,
  centerIndex,
  scrollYProgress,
  isHighlighted = false,
}: CharacterProps) => {
  const isSpace = char === " ";
  const distanceFromCenter = index - centerIndex;

  const x = useTransform(scrollYProgress, [0, 0.45], [distanceFromCenter * 35, 0]);
  const rotateX = useTransform(scrollYProgress, [0, 0.45], [distanceFromCenter * 35, 0]);

  // Smoothly interpolate hue from 18deg (Deep Orange) to 48deg (Bright Gold Yellow) across the word
  const progressRatio = totalChars > 1 ? index / (totalChars - 1) : 0;
  const hue = 18 + progressRatio * 30;
  const colorStyle = isHighlighted
    ? { color: `hsl(${hue}, 96%, 54%)` }
    : {};

  return (
    <motion.span
      className={cn(
        "inline-block font-black",
        isHighlighted
          ? "drop-shadow-[0_0_30px_rgba(249,115,22,0.55)]"
          : "text-white",
        isSpace && "w-3 sm:w-4"
      )}
      style={{ x, rotateX, ...colorStyle }}
    >
      {char}
    </motion.span>
  );
};

interface Skiper31Props {
  customText?: string;
  lines?: { text: string; isHighlighted?: boolean }[];
  useLenisRoot?: boolean;
  className?: string;
}

const Skiper31 = ({
  customText = "JUST ONE CLOSED CLIENT REPAYS\nWANDERLABS",
  lines,
  useLenisRoot = false,
  className,
}: Skiper31Props) => {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });

  const parsedLines = lines || (customText ? customText.split("\n").map((lineText, idx) => ({
    text: lineText,
    isHighlighted: idx > 0 || lineText.toUpperCase().includes("WANDERLABS"),
  })) : []);

  const content = (
    <div
      ref={targetRef}
      className={cn(
        "relative flex h-[45vh] min-h-[260px] w-full items-center justify-center overflow-hidden my-0 py-0",
        className
      )}
    >
      <div className="w-full max-w-6xl text-center px-4 flex flex-col items-center justify-center gap-1 sm:gap-3">
        {parsedLines.map((lineObj, lineIdx) => {
          const chars = lineObj.text.split("");
          const totalChars = chars.length;
          const centerIndex = Math.floor(totalChars / 2);
          return (
            <div
              key={lineIdx}
              className="font-geist w-full text-center text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter drop-shadow-2xl"
              style={{ perspective: "500px" }}
            >
              {chars.map((char, index) => (
                <CharacterV1
                  key={index}
                  char={char}
                  index={index}
                  totalChars={totalChars}
                  centerIndex={centerIndex}
                  scrollYProgress={scrollYProgress}
                  isHighlighted={lineObj.isHighlighted}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (useLenisRoot) {
    return <ReactLenis root>{content}</ReactLenis>;
  }

  return content;
};

export { CharacterV1, Skiper31 };
