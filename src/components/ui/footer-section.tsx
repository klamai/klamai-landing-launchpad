
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
    <footer className="relative border-t bg-gradient-to-r from-blue-600 to-cyan-600 text-white transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Newsletter Section */}
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="h-8 w-8 text-white" />
              <h2 className="text-2xl font-bold tracking-tight text-white">klamAI</h2>
            </div>
            <p className="mb-6 text-blue-100">
              Recibe las últimas noticias sobre tecnología legal y consejos de VitorIA directamente en tu email.
            </p>
            <form className="relative">
              <Input
                type="email"
                placeholder="Tu email aquí"
                className="pr-12 backdrop-blur-sm bg-white/20 border-white/30 text-white placeholder:text-blue-100 focus:bg-white/30 focus:border-white/50"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8 rounded-full bg-white text-blue-600 hover:bg-blue-50 transition-transform hover:scale-105"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Suscribirse</span>
              </Button>
            </form>
            <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Enlaces Rápidos</h3>
            <nav className="space-y-2 text-sm">
              <a href="/" className="block transition-colors hover:text-blue-200 text-blue-100">
                Inicio
              </a>
              <a href="/chat" className="block transition-colors hover:text-blue-200 text-blue-100">
                Consultar con VitorIA
              </a>
              <a href="#features" className="block transition-colors hover:text-blue-200 text-blue-100">
                Características
              </a>
              <a href="#testimonials" className="block transition-colors hover:text-blue-200 text-blue-100">
                Testimonios
              </a>
              <a href="#contact" className="block transition-colors hover:text-blue-200 text-blue-100">
                Contacto
              </a>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Contacto</h3>
            <address className="space-y-3 text-sm not-italic">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-200" />
                <span className="text-blue-100">Valencia, España</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-cyan-200" />
                <span className="text-blue-100">684 74 33 32</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-cyan-200" />
                <span className="text-blue-100">gestiones@klamai.com</span>
              </div>
            </address>
          </div>

          {/* Social Media & Theme Toggle */}
          <div className="relative">
            <h3 className="mb-4 text-lg font-semibold text-white">Síguenos</h3>
            <div className="mb-6 flex space-x-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full bg-white/20 border-white/30 text-white hover:bg-cyan-500/30 hover:border-cyan-300/50 transition-all duration-200">
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
                    <Button variant="outline" size="icon" className="rounded-full bg-white/20 border-white/30 text-white hover:bg-cyan-500/30 hover:border-cyan-300/50 transition-all duration-200">
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
                    <Button variant="outline" size="icon" className="rounded-full bg-white/20 border-white/30 text-white hover:bg-cyan-500/30 hover:border-cyan-300/50 transition-all duration-200">
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
                    <Button variant="outline" size="icon" className="rounded-full bg-white/20 border-white/30 text-white hover:bg-cyan-500/30 hover:border-cyan-300/50 transition-all duration-200">
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
                <Sun className="h-4 w-4 text-cyan-200" />
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={onDarkModeToggle}
                  className="data-[state=checked]:bg-cyan-500/50 data-[state=unchecked]:bg-white/20"
                />
                <Moon className="h-4 w-4 text-cyan-200" />
                <Label htmlFor="dark-mode" className="sr-only">
                  Alternar modo oscuro
                </Label>
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/30 pt-8 text-center md:flex-row">
          <p className="text-sm text-blue-100">
            © 2025 KlamAI. Todos los derechos reservados. | Asesoramiento jurídico con IA en España
          </p>
          <nav className="flex gap-4 text-sm">
            <a href="/politicas-privacidad" className="transition-colors hover:text-cyan-200 text-blue-100">
              Política de Privacidad
            </a>
            <a href="/aviso-legal" className="transition-colors hover:text-cyan-200 text-blue-100">
              Aviso Legal
            </a>
            <a href="#" className="transition-colors hover:text-cyan-200 text-blue-100">
              Cookies
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export { FooterSection }
