
import * as React from "react"
import { cn } from "@/lib/utils"

interface PromptInputContextProps {
  value: string
  onValueChange: (value: string) => void
  isLoading: boolean
  onSubmit: () => void
}

const PromptInputContext = React.createContext<PromptInputContextProps | undefined>(undefined)

export interface PromptInputProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  onValueChange: (value: string) => void
  isLoading: boolean
  onSubmit: () => void
}

const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  ({ className, value, onValueChange, isLoading, onSubmit, children, ...props }, ref) => {
    return (
      <PromptInputContext.Provider value={{ value, onValueChange, isLoading, onSubmit }}>
        <div
          ref={ref}
          className={cn(
            "relative rounded-xl border border-input bg-background shadow-sm focus-within:border-ring focus-within:ring-1 focus-within:ring-ring",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </PromptInputContext.Provider>
    )
  }
)
PromptInput.displayName = "PromptInput"

const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  const context = React.useContext(PromptInputContext)
  if (!context) {
    throw new Error("PromptInputTextarea must be used within a PromptInput")
  }

  const { value, onValueChange } = context

  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full resize-none rounded-xl border-0 bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      {...props}
    />
  )
})
PromptInputTextarea.displayName = "PromptInputTextarea"

const PromptInputActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center px-4 pb-3", className)}
    {...props}
  />
))
PromptInputActions.displayName = "PromptInputActions"

const PromptInputAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { tooltip?: string }
>(({ className, tooltip, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("", className)}
    title={tooltip}
    {...props}
  >
    {children}
  </div>
))
PromptInputAction.displayName = "PromptInputAction"

export { PromptInput, PromptInputTextarea, PromptInputActions, PromptInputAction }
