
import React from "react";
import { motion } from "framer-motion";

const NuevaConsulta = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full w-full flex items-center justify-center"
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Preparando tu consulta...</p>
      </div>
    </motion.div>
  );
};

export default NuevaConsulta;
