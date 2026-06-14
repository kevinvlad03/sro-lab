import type { Transition, Variants } from "motion/react";

export const easeOutSlow = [0.16, 1, 0.3, 1] as const;
export const easeInOutSoft = [0.4, 0, 0.2, 1] as const;

export const transitions = {
  smooth: { duration: 0.5, ease: easeOutSlow } satisfies Transition,
  slow: { duration: 0.8, ease: easeOutSlow } satisfies Transition,
  spring: { type: "spring", stiffness: 120, damping: 20 } satisfies Transition,
} as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: transitions.smooth },
};

export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
