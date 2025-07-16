
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  CircleMinus,
  CirclePlus,
  Loader2,
  RotateCcw,
  RotateCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Settings,
  Eye,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs, Thumbnail } from "react-pdf";

// Configuración automática del worker para sincronizar versiones
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

const ZOOM_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4, 8];

function highlightPattern(text: string, pattern: string, itemIndex: number) {
  return text.replace(
    pattern,
    (value: string) => `<mark id="search-result-${itemIndex}" class="bg-primary/20 text-primary-foreground">${value}</mark>`
  );
}

interface PDFViewerProps {
  url: string;
  className?: string;
}

function PDFViewer({ url, className }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [enableTextLayer, setEnableTextLayer] = useState(false);
  const [enableSearch, setEnableSearch] = useState(false);
  const [renderingQuality, setRenderingQuality] = useState<'standard' | 'high'>('standard');
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const textRenderer = useCallback(
    (textItem: { str: string; itemIndex: number }) =>
      highlightPattern(textItem.str, searchQuery, textItem.itemIndex),
    [searchQuery]
  );

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoadingError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setLoadingError('Error al cargar el documento PDF');
  }

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= (numPages || 1)) {
      setCurrentPage(pageNumber);
      // Scroll to the specific page
      const pageElement = document.querySelector(`[data-page-number="${pageNumber}"]`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleTextLayerToggle = (enabled: boolean) => {
    setEnableTextLayer(enabled);
    if (!enabled) {
      setEnableSearch(false);
      setSearchQuery("");
    }
  };

  const handleSearchToggle = (enabled: boolean) => {
    setEnableSearch(enabled);
    if (enabled && !enableTextLayer) {
      setEnableTextLayer(true);
    }
  };

  useEffect(() => {
    if (!viewportRef.current) return;

    const options = {
      root: viewportRef.current,
      rootMargin: "0px",
      threshold: 0.5,
    };

    const callback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageElement = entry.target.closest("[data-page-number]");
          if (pageElement) {
            const pageNumber = parseInt(
              pageElement.getAttribute("data-page-number") || "1",
              10
            );
            setCurrentPage(pageNumber);
          }
        }
      });
    };

    const observer = new IntersectionObserver(callback, options);

    const mutationObserver = new MutationObserver(() => {
      const pages = viewportRef.current?.querySelectorAll(".react-pdf__Page");
      if (pages) {
        pages.forEach((page) => {
          observer.observe(page);
        });
      }
    });

    mutationObserver.observe(viewportRef.current, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [numPages]);

  if (loadingError) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full bg-background", className)}>
        <div className="text-center p-8">
          <p className="text-lg font-medium text-destructive mb-2">Error al cargar el PDF</p>
          <p className="text-sm text-muted-foreground mb-4">{loadingError}</p>
          <Button 
            variant="outline" 
            onClick={() => window.open(url, '_blank')}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Abrir en nueva ventana
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full w-full bg-background", className)}>
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        className="w-full h-full flex"
        options={{
          // Configuración básica optimizada para compatibilidad
          verbosity: 0,
          disableAutoFetch: false,
          disableStream: false,
          disableRange: false,
        }}
        loading={
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Cargando PDF...</p>
          </div>
        }
        error={
          <div className="flex flex-col items-center justify-center h-full text-destructive">
            <p className="text-lg font-medium">Error al cargar el PDF</p>
            <p className="text-sm text-muted-foreground">No se pudo cargar el documento</p>
          </div>
        }
      >
        <div className="flex h-full w-full">
          {/* Sidebar con thumbnails */}
          {showThumbnails && (
            <div className="w-64 border-r bg-muted/30 flex flex-col">
              <div className="p-4 border-b bg-background">
                <h3 className="font-medium text-sm">Páginas</h3>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {Array.from(new Array(numPages), (el, index) => (
                    <div
                      key={`thumbnail_${index + 1}`}
                      className={cn(
                        "cursor-pointer border rounded-lg p-2 transition-colors hover:bg-accent",
                        index + 1 === currentPage && "bg-accent border-primary"
                      )}
                      onClick={() => goToPage(index + 1)}
                    >
                      <Thumbnail
                        pageNumber={index + 1}
                        className="border rounded shadow-sm w-full"
                        width={170}
                        height={120}
                        rotate={rotation}
                      />
                      <div className="text-center mt-2">
                        <span className="text-xs text-muted-foreground">
                          Página {index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b bg-background">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  className="h-8"
                >
                  {showThumbnails ? "Ocultar" : "Mostrar"} páginas
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {currentPage} de {numPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage >= (numPages || 1)}
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setRotation(rotation - 90)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setRotation(rotation + 90)}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={zoom <= ZOOM_OPTIONS[0]}
                  onClick={() => setZoom(Math.max(ZOOM_OPTIONS[0], zoom - 0.25))}
                >
                  <CircleMinus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={zoom >= ZOOM_OPTIONS[ZOOM_OPTIONS.length - 1]}
                  onClick={() => setZoom(Math.min(ZOOM_OPTIONS[ZOOM_OPTIONS.length - 1], zoom + 0.25))}
                >
                  <CirclePlus className="h-4 w-4" />
                </Button>

                <Select
                  value={zoom.toString()}
                  onValueChange={(value) => setZoom(Number(value))}
                >
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue>
                      {`${Math.round(zoom * 100)}%`}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="end">
                    {ZOOM_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option.toString()}>
                        {`${Math.round(option * 100)}%`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Separator orientation="vertical" className="h-6" />
                
                {/* Popover de búsqueda mejorado */}
                {enableSearch && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Search className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Buscar en el documento</label>
                        <Input
                          placeholder="Ingresa texto a buscar..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {/* Configuraciones de renderizado */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Opciones de visualización</Label>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="text-layer" className="text-sm">
                            Capa de texto (para búsqueda)
                          </Label>
                          <Switch
                            id="text-layer"
                            checked={enableTextLayer}
                            onCheckedChange={handleTextLayerToggle}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="search-enabled" className="text-sm">
                            Habilitar búsqueda
                          </Label>
                          <Switch
                            id="search-enabled"
                            checked={enableSearch}
                            onCheckedChange={handleSearchToggle}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Calidad de renderizado</Label>
                          <Select
                            value={renderingQuality}
                            onValueChange={(value: 'standard' | 'high') => setRenderingQuality(value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">Estándar (recomendado)</SelectItem>
                              <SelectItem value="high">Alta calidad</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* PDF Content */}
            <ScrollArea className="flex-1 w-full" ref={viewportRef}>
              <ScrollBar orientation="horizontal" />
              <div className="flex flex-col items-center p-8 space-y-6">
                {Array.from(new Array(numPages), (el, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    className="border shadow-sm rounded-lg"
                    data-page-number={index + 1}
                    renderAnnotationLayer={false}
                    renderTextLayer={enableTextLayer}
                    scale={zoom * (renderingQuality === 'high' ? 1.5 : 1)}
                    rotate={rotation}
                    loading={
                      <div className="flex items-center justify-center h-96 border rounded-lg bg-muted/20">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    }
                    customTextRenderer={enableSearch && searchQuery ? textRenderer : undefined}
                    canvasBackground="white"
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </Document>
    </div>
  );
}

export { PDFViewer };
