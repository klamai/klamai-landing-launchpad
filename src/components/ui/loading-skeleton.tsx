
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "text" | "avatar" | "button" | "card";
}

export function LoadingSkeleton({ className, variant = "text" }: LoadingSkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded";
  
  const variantClasses = {
    text: "h-4 w-full",
    avatar: "h-12 w-12 rounded-full",
    button: "h-10 w-24",
    card: "h-32 w-full"
  };

  return (
    <div 
      className={cn(baseClasses, variantClasses[variant], className)}
      aria-label="Cargando..."
    />
  );
}

export function ContentSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <LoadingSkeleton variant="text" className="w-3/4" />
      <LoadingSkeleton variant="text" className="w-1/2" />
      <LoadingSkeleton variant="card" />
      <div className="flex space-x-4">
        <LoadingSkeleton variant="button" />
        <LoadingSkeleton variant="button" />
      </div>
    </div>
  );
}
