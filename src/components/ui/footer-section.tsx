
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
    <footer className="relative border-t bg-[#0A1931] text-white transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Newsletter Section */}
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
            <img src="/logo.svg" alt="klamAI Logo" className="h-8" />

              <h2 className="text-2xl font-bold tracking-tight text-white">KlamAI</h2>
            </div>
            <p className="mb-6 text-[#F0F0F0]">
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
              <a href="/" className="block transition-colors hover:text-[#007BFF] text-[#F0F0F0]">
                Inicio
              </a>
              <a href="/areas-de-practica" className="block transition-colors hover:text-[#007BFF] text-[#F0F0F0]">
                Áreas de Práctica
              </a>
              <a href="/mercantil" className="block transition-colors hover:text-[#007BFF] text-[#F0F0F0]">
                Derecho Mercantil
              </a>
              <a href="/contacto" className="block transition-colors hover:text-[#007BFF] text-[#F0F0F0]">
                Contacto
              </a>
              <a href="/chat" className="block transition-colors hover:text-[#007BFF] text-[#F0F0F0]">
                Consultar con VitorIA
              </a>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Contacto</h3>
            <address className="space-y-3 text-sm not-italic">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#007BFF]" />
                <span className="text-[#F0F0F0]">Valencia, España</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#007BFF]" />
                <span className="text-[#F0F0F0]"></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#007BFF]" />
                <span className="text-[#F0F0F0]">gestiones@klamai.com</span>
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
                    <Button variant="outline" size="icon" className="rounded-full bg-white/20 border-white/30 text-white hover:bg-[#007BFF]/30 hover:border-[#007BFF]/50 transition-all duration-200">
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
                    <Button variant="outline" size="icon" className="rounded-full bg-white/20 border-white/30 text-white hover:bg-[#007BFF]/30 hover:border-[#007BFF]/50 transition-all duration-200">
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
                    <Button variant="outline" size="icon" className="rounded-full bg-white/20 border-white/30 text-white hover:bg-[#007BFF]/30 hover:border-[#007BFF]/50 transition-all duration-200">
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
                    <Button variant="outline" size="icon" className="rounded-full bg-white/20 border-white/30 text-white hover:bg-[#007BFF]/30 hover:border-[#007BFF]/50 transition-all duration-200">
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
                <Sun className="h-4 w-4 text-[#007BFF]" />
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={onDarkModeToggle}
                  className="data-[state=checked]:bg-[#007BFF]/50 data-[state=unchecked]:bg-white/20"
                />
                <Moon className="h-4 w-4 text-[#007BFF]" />
                <Label htmlFor="dark-mode" className="sr-only">
                  Alternar modo oscuro
                </Label>
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/30 pt-8 text-center md:flex-row">
          <p className="text-sm text-[#F0F0F0]">
            © 2025 KlamAI. Todos los derechos reservados. | Asesoramiento jurídico con IA en España
          </p>
          <nav className="flex gap-4 text-sm">
            <a href="/politicas-privacidad" className="transition-colors hover:text-[#007BFF] text-[#F0F0F0]">
              Política de Privacidad
            </a>
            <a href="/aviso-legal" className="transition-colors hover:text-[#007BFF] text-[#F0F0F0]">
              Aviso Legal
            </a>
            <a href="#" className="transition-colors hover:text-[#007BFF] text-[#F0F0F0]">
              Cookies
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export { FooterSection }
