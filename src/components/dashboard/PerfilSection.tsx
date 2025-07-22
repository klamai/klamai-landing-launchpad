
import React, { memo } from 'react';
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const PerfilSection = memo(() => {
  const { user } = useAuth();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
      <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
            {(user?.user_metadata?.nombre || user?.email || "U")[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user?.user_metadata?.nombre || "Usuario"}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{user?.email}</p>
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-400">Funcionalidad de edición de perfil próximamente disponible</p>
      </div>
    </motion.div>
  );
});

PerfilSection.displayName = 'PerfilSection';

export default PerfilSection;
