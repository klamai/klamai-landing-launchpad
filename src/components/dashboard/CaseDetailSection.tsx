
import React, { memo } from 'react';

const CaseDetailSection = memo(() => {
  const CaseDetail = React.lazy(() => import("@/components/shared/CaseDetailTabs"));
  
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CaseDetail />
    </React.Suspense>
  );
});

CaseDetailSection.displayName = 'CaseDetailSection';

export default CaseDetailSection;
