
import React from "react";
import { motion } from "framer-motion";
import { Scale } from "lucide-react";

const NuevaConsulta = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full w-full flex items-center justify-center"
    >
      <div className="text-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="inline-block"
        >
          <Scale className="h-12 w-12 text-blue-600" />
        </motion.div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Iniciando consulta...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Estamos preparando tu asistente legal
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default NuevaConsulta;
