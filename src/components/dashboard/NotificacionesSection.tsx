
import React, { memo } from 'react';

const NotificacionesSection = memo(() => {
  const NotificationCenter = React.lazy(() => import("@/components/NotificationCenter"));
  
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <NotificationCenter />
    </React.Suspense>
  );
});

NotificacionesSection.displayName = 'NotificacionesSection';

export default NotificacionesSection;
