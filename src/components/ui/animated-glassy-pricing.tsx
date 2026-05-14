import React, { useRef, useEffect, useState } from 'react';
import { RippleButton } from "@/components/ui/multi-type-ripple-buttons";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// --- Internal Helper Components (Not exported) --- //

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="3"
    strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const ShaderCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glProgramRef = useRef<WebGLProgram | null>(null);
  const glBgColorLocationRef = useRef<WebGLUniformLocation | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const [backgroundColor, setBackgroundColor] = useState([1.0, 1.0, 1.0]);

  useEffect(() => {
    const root = document.documentElement;
    const updateColor = () => {
      const isDark = root.classList.contains('dark');
      setBackgroundColor(isDark ? [0.05, 0.05, 0.1] : [1.0, 1.0, 1.0]); // Adjusted dark color for better blending
    };
    updateColor();
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateColor();
        }
      }
    });
    observer.observe(root, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const gl = glRef.current;
    const program = glProgramRef.current;
    const location = glBgColorLocationRef.current;
    if (gl && program && location) {
      gl.useProgram(program);
      gl.uniform3fv(location, new Float32Array(backgroundColor));
    }
  }, [backgroundColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) { console.error("WebGL not supported"); return; }
    glRef.current = gl;

    const vertexShaderSource = `attribute vec2 aPosition; void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;
    const fragmentShaderSource = `
      precision highp float;
      uniform float iTime;
      uniform vec2 iResolution;
      uniform vec3 uBackgroundColor;
      mat2 rotate2d(float angle){ float c=cos(angle),s=sin(angle); return mat2(c,-s,s,c); }
      float variation(vec2 v1,vec2 v2,float strength,float speed){ return sin(dot(normalize(v1),normalize(v2))*strength+iTime*speed)/100.0; }
      vec3 paintCircle(vec2 uv,vec2 center,float rad,float width){
        vec2 diff = center-uv;
        float len = length(diff);
        len += variation(diff,vec2(0.,1.),5.,2.);
        len -= variation(diff,vec2(1.,0.),5.,2.);
        float circle = smoothstep(rad-width,rad,len)-smoothstep(rad,rad+width,len);
        return vec3(circle);
      }
      void main(){
        vec2 uv = gl_FragCoord.xy/iResolution.xy;
        uv.x *= 1.5; uv.x -= 0.25;
        float mask = 0.0;
        float radius = .35;
        vec2 center = vec2(.5);
        mask += paintCircle(uv,center,radius,.035).r;
        mask += paintCircle(uv,center,radius-.018,.01).r;
        mask += paintCircle(uv,center,radius+.018,.005).r;
        vec2 v=rotate2d(iTime)*uv;
        vec3 foregroundColor=vec3(v.x,v.y,.7-v.y*v.x);
        vec3 color=mix(uBackgroundColor,foregroundColor,mask);
        color=mix(color,vec3(1.),paintCircle(uv,center,radius,.003).r);
        gl_FragColor=vec4(color,1.);
      }`;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Could not create shader");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation error");
      }
      return shader;
    };

    const program = gl.createProgram();
    if (!program) throw new Error("Could not create program");
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    glProgramRef.current = program;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const iTimeLoc = gl.getUniformLocation(program, 'iTime');
    const iResLoc = gl.getUniformLocation(program, 'iResolution');
    glBgColorLocationRef.current = gl.getUniformLocation(program, 'uBackgroundColor');
    gl.uniform3fv(glBgColorLocationRef.current, new Float32Array(backgroundColor));

    let animationFrameId: number;
    const render = (time: number) => {
      gl.uniform1f(iTimeLoc, time * 0.001);
      gl.uniform2f(iResLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    animationFrameId = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <motion.canvas 
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.5 }}
      transition={{ duration: 2 }}
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full block z-0 bg-background" 
    />
  );
};


// --- EXPORTED Building Blocks --- //

/**
 * We export the Props interface so you can easily type the data for your plans.
 */
export interface PricingCardProps {
  planName: string;
  description: string;
  price: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  buttonVariant?: 'primary' | 'secondary';
  onClick?: () => void;
  isLoading?: boolean;
  isCurrent?: boolean;
}

/**
 * We export the PricingCard component itself in case you want to use it elsewhere.
 */
export const PricingCard = ({
  planName, description, price, features, buttonText, isPopular = false, buttonVariant = 'primary', onClick, isLoading, isCurrent
}: PricingCardProps) => {
  const cardClasses = cn(
    "backdrop-blur-[14px] bg-gradient-to-br rounded-2xl shadow-xl flex-1 max-w-xs px-7 py-8 flex flex-col transition-all duration-300",
    "from-black/5 to-black/0 border border-black/10",
    "dark:from-white/10 dark:to-white/5 dark:border-white/10 dark:backdrop-brightness-[0.91]",
    isPopular ? 'scale-105 relative ring-2 ring-cyan-400/20 dark:from-white/20 dark:to-white/10 dark:border-cyan-400/30 shadow-2xl' : ''
  );
  
  const buttonClasses = cn(
    "mt-auto w-full py-2.5 rounded-xl font-semibold text-[14px] transition font-sans",
    buttonVariant === 'primary' 
      ? 'bg-cyan-400 hover:bg-cyan-300 text-black' 
      : 'bg-black/10 hover:bg-black/20 text-foreground border border-black/20 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/20',
    isCurrent && "bg-white/10 text-white cursor-default opacity-80"
  );

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className={cardClasses}
    >
      {isPopular && (
        <div className="absolute -top-4 right-4 px-3 py-1 text-[12px] font-semibold rounded-full bg-cyan-400 text-black">
          Most Popular
        </div>
      )}
      <div className="mb-3">
        <h2 className="text-[32px] font-bold tracking-tight text-foreground">{planName}</h2>
        <p className="text-[14px] text-foreground/70 mt-1 font-sans h-10">{description}</p>
      </div>
      <div className="my-6 flex items-baseline gap-2">
        <span className="text-[42px] font-bold text-foreground font-display">{price}</span>
        {price !== 'Free' && <span className="text-[14px] text-foreground/70 font-sans">/mo</span>}
      </div>
      <div className="card-divider w-full mb-5 h-px bg-[linear-gradient(90deg,transparent,rgba(0,0,0,0.1)_50%,transparent)] dark:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.09)_20%,rgba(255,255,255,0.22)_50%,rgba(255,255,255,0.09)_80%,transparent)]"></div>
      <ul className="flex flex-col gap-3 text-[14px] text-foreground/90 mb-8 font-sans flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <CheckIcon className="text-cyan-400 w-4 h-4 mt-0.5 shrink-0" /> 
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <RippleButton 
        className={buttonClasses} 
        onClick={onClick}
        disabled={isLoading || isCurrent}
      >
        {isLoading ? 'Processing...' : isCurrent ? 'Current Plan' : buttonText}
      </RippleButton>
    </motion.div>
  );
};


// --- EXPORTED Customizable Page Component --- //

interface ModernPricingPageProps {
  /** The main title. Can be a string or a ReactNode for more complex content. */
  title: React.ReactNode;
  /** The subtitle text appearing below the main title. */
  subtitle: React.ReactNode;
  /** An array of plan objects that conform to PricingCardProps. */
  plans: PricingCardProps[];
  /** Whether to show the animated WebGL background. Defaults to true. */
  showAnimatedBackground?: boolean;
}

export const ModernPricingPage = ({
  title,
  subtitle,
  plans,
  showAnimatedBackground = true,
}: ModernPricingPageProps) => {
  return (
    <div className="bg-background text-foreground min-h-screen w-full overflow-x-hidden pt-20">
      {showAnimatedBackground && <ShaderCanvas />}
      <main className="relative w-full min-h-screen flex flex-col items-center justify-start px-4 py-8 z-10">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, y: -20 },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: {
                staggerChildren: 0.1,
                duration: 0.8,
                ease: "easeOut"
              }
            }
          }}
          className="w-full max-w-5xl mx-auto text-center mb-14"
        >
          <motion.h1 
            variants={{
              hidden: { opacity: 0, y: -20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="text-[48px] md:text-[64px] font-bold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-cyan-500 to-blue-600 dark:from-white dark:via-cyan-300 dark:to-blue-400"
          >
            {title}
          </motion.h1>
          <motion.p 
            variants={{
              hidden: { opacity: 0, y: -20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="mt-3 text-[16px] md:text-[18px] text-foreground/80 max-w-2xl mx-auto font-sans"
          >
            {subtitle}
          </motion.p>
        </motion.div>

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { 
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
                delayChildren: 0.4
              }
            }
          }}
          className="flex flex-col md:flex-row gap-8 md:gap-6 justify-center items-stretch w-full max-w-6xl mb-20"
        >
          {plans.map((plan) => <PricingCard key={plan.planName} {...plan} />)}
        </motion.div>
      </main>
    </div>
  );
};
