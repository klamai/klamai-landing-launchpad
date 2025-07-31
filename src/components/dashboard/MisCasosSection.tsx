
import React, { memo } from 'react';

const MisCasosSection = memo(() => {
  const MisCasos = React.lazy(() => import("@/components/client/MisCasos"));
  
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <MisCasos />
    </React.Suspense>
  );
});

MisCasosSection.displayName = 'MisCasosSection';

export default MisCasosSection;
