
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Facebook, Instagram, Linkedin, Moon, Send, Sun, Twitter, Scale, Mail, Phone, MapPin } from "lucide-react"

interface FooterSectionProps {
  darkMode?: boolean;
  onDarkModeToggle?: () => void;
}

function FooterSection({ darkMode = false, onDarkModeToggle }: FooterSectionProps) {
  return (
    <footer className="relative border-t bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Newsletter Section */}
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold tracking-tight">klamAI</h2>
            </div>
            <p className="mb-6 text-muted-foreground">
              Recibe las últimas noticias sobre tecnología legal y consejos de VitorIA directamente en tu email.
            </p>
            <form className="relative">
              <Input
                type="email"
                placeholder="Tu email aquí"
                className="pr-12 backdrop-blur-sm"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white transition-transform hover:scale-105"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Suscribirse</span>
              </Button>
            </form>
            <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Enlaces Rápidos</h3>
            <nav className="space-y-2 text-sm">
              <a href="/" className="block transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                Inicio
              </a>
              <a href="/chat" className="block transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                Consultar con VitorIA
              </a>
              <a href="#features" className="block transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                Características
              </a>
              <a href="#testimonials" className="block transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                Testimonios
              </a>
              <a href="#contact" className="block transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                Contacto
              </a>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Contacto</h3>
            <address className="space-y-3 text-sm not-italic">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Valencia, España</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>632 018 899</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>contacto@klamai.com</span>
              </div>
            </address>
          </div>

          {/* Social Media & Theme Toggle */}
          <div className="relative">
            <h3 className="mb-4 text-lg font-semibold">Síguenos</h3>
            <div className="mb-6 flex space-x-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <Facebook className="h-4 w-4" />
                      <span className="sr-only">Facebook</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Síguenos en Facebook</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <Twitter className="h-4 w-4" />
                      <span className="sr-only">Twitter</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Síguenos en Twitter</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <Instagram className="h-4 w-4" />
                      <span className="sr-only">Instagram</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Síguenos en Instagram</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <Linkedin className="h-4 w-4" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Conéctate en LinkedIn</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {onDarkModeToggle && (
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4" />
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={onDarkModeToggle}
                />
                <Moon className="h-4 w-4" />
                <Label htmlFor="dark-mode" className="sr-only">
                  Alternar modo oscuro
                </Label>
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-center md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2024 klamAI. Todos los derechos reservados. | Asesoramiento jurídico con IA en España
          </p>
          <nav className="flex gap-4 text-sm">
            <a href="#" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
              Política de Privacidad
            </a>
            <a href="#" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
              Términos de Servicio
            </a>
            <a href="#" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
              Cookies
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export { FooterSection }
