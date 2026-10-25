"use client";

// Animation building blocks. Everything respects the visitor's "reduce motion" setting.

import { animate, motion, MotionConfig, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const; // smooth "out-expo"-like curve

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Fades and lifts its content into place the first time it scrolls into view. */
export function Reveal({ children, delay = 0, y = 18, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** A grid/list whose children appear one after another. Wrap each child in <StaggerItem>. */
export function Stagger({ children, className, gap = 0.07 }: { children: ReactNode; className?: string; gap?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: 16, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } } }}
    >
      {children}
    </motion.div>
  );
}

/** Re-plays a short enter animation whenever the route changes. */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const path = usePathname();
  return (
    <motion.div key={path} className={className} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
      {children}
    </motion.div>
  );
}

/** Counts up to `value` when it first appears (and animates between later values). */
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString("en-US") }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const text = useTransform(mv, (n) => format(n));
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 1.1, ease: EASE });
    return () => controls.stop();
  }, [inView, value, reduce, mv]);
  return <motion.span ref={ref}>{text}</motion.span>;
}

/** Gentle floating loop for hero artwork. */
export function Float({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
      {children}
    </motion.div>
  );
}

export { motion };
