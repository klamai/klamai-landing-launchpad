
import React, { memo } from 'react';

const NuevaConsultaSection = memo(() => {
  const NuevaConsulta = React.lazy(() => import("@/components/NuevaConsulta"));
  
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <NuevaConsulta />
    </React.Suspense>
  );
});

NuevaConsultaSection.displayName = 'NuevaConsultaSection';

export default NuevaConsultaSection;
