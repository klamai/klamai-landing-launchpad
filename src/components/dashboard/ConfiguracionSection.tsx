
import React, { memo } from 'react';
import { motion } from "framer-motion";
import { Settings } from "lucide-react";

const ConfiguracionSection = memo(() => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
      <Settings className="h-16 w-16 text-blue-500 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Panel de configuración próximamente disponible</p>
    </div>
  </motion.div>
));

ConfiguracionSection.displayName = 'ConfiguracionSection';

export default ConfiguracionSection;
