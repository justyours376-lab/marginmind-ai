import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AgentBubble({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 items-start">
      <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4 text-gold" /></div>
      <div className="flex-1 min-w-0 space-y-2">{children}</div>
    </motion.div>
  );
}