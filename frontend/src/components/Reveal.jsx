import { motion } from "framer-motion";

export const Reveal = ({ children, delay = 0, y = 32, className = "" }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export const ChapterTag = ({ number, label }) => (
  <div className="flex items-center gap-4 mb-6">
    <span className="font-mono2 text-xs text-neon tracking-[0.3em]">{number}</span>
    <span className="h-px w-12 bg-gradient-to-r from-neon/60 to-transparent" />
    <span className="font-mono2 text-xs uppercase tracking-[0.3em] text-dim">{label}</span>
  </div>
);
