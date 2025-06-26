
"use client"

import * as React from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface TestimonialProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  role: string
  company?: string
  testimonial: string
  rating?: number
  image?: string
}

const Testimonial = React.forwardRef<HTMLDivElement, TestimonialProps>(
  ({ name, role, company, testimonial, rating = 5, image, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-blue-200/30 dark:border-blue-500/30 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-6 transition-all duration-300 md:p-8 md:hover:shadow-xl md:hover:-translate-y-2 active:scale-95 md:active:scale-100",
          className
        )}
        {...props}
      >
        <div className="absolute right-4 top-4 md:right-6 md:top-6 text-4xl md:text-6xl font-serif text-blue-600/20 dark:text-blue-400/20">
          "
        </div>

        <div className="flex flex-col gap-4 justify-between h-full">
          {rating > 0 && (
            <div className="flex gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  size={14}
                  className={cn(
                    "md:w-4 md:h-4",
                    index < rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600"
                  )}
                />
              ))}
            </div>
          )}

          <p className="text-pretty text-sm md:text-base text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
            {testimonial}
          </p>

          <div className="flex items-center gap-3 justify-start mt-4">
            {image && (
              <Avatar className="w-10 h-10 md:w-12 md:h-12">
                <AvatarImage src={image} alt={name} />
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-sm">
                  {name[0]}
                </AvatarFallback>
              </Avatar>
            )}

            <div className="flex flex-col">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{name}</h3>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                {role}
                {company && ` @ ${company}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
)
Testimonial.displayName = "Testimonial"

export { Testimonial }
