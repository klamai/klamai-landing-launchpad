
import React from "react";
import { motion } from "framer-motion";
import { AnimatedAIChat } from "@/components/ui/animated-ai-chat";

const NuevaConsulta = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full w-full"
    >
      <AnimatedAIChat />
    </motion.div>
  );
};

export default NuevaConsulta;
