
import React, { memo } from 'react';
import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";

const FacturacionSection = memo(() => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Facturación</h1>
    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
      <CreditCard className="h-16 w-16 text-blue-500 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Información de facturación próximamente disponible</p>
    </div>
  </motion.div>
));

FacturacionSection.displayName = 'FacturacionSection';

export default FacturacionSection;
