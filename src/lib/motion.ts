/**
 * SSR-safe Framer Motion presets.
 * `initial: false` avoids server/client opacity mismatch on hydration.
 */
const ease = [0.22, 1, 0.36, 1] as const;

export const fadeIn = {
  initial: false,
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease },
} as const;

export const fadeUp = {
  initial: false,
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-64px" },
  transition: { duration: 0.45, ease },
} as const;

export function fadeInDelay(delay: number) {
  return {
    ...fadeIn,
    transition: { ...fadeIn.transition, delay },
  };
}

export function fadeUpDelay(delay: number) {
  return {
    ...fadeUp,
    transition: { ...fadeUp.transition, delay },
  };
}

export const messageEnter = {
  initial: false,
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease },
} as const;
