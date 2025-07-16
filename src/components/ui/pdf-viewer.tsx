
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
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Document, Page, pdfjs, Thumbnail } from "react-pdf";
import { useDebounce } from "@/hooks/useDebounce";
import { useThrottle } from "@/hooks/useThrottle";

// Configuración automática del worker para sincronizar versiones
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

const ZOOM_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4, 8];
const MAX_CONCURRENT_PAGES = 5; // Limitar páginas renderizadas simultáneamente
const SCROLL_THROTTLE = 100; // ms
const ZOOM_DEBOUNCE = 300; // ms

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
  const [isRendering, setIsRendering] = useState(false);
  const [needsRecovery, setNeedsRecovery] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const renderingPagesRef = useRef<Set<number>>(new Set());

  // Debounced functions para prevenir re-renders excesivos
  const debouncedZoomChange = useDebounce((newZoom: number) => {
    setZoom(newZoom);
    setIsRendering(true);
  }, ZOOM_DEBOUNCE);

  const debouncedRotationChange = useDebounce((newRotation: number) => {
    setRotation(newRotation);
    setIsRendering(true);
  }, ZOOM_DEBOUNCE);

  // Throttled scroll handler
  const throttledPageChange = useThrottle((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, SCROLL_THROTTLE);

  const textRenderer = useCallback(
    (textItem: { str: string; itemIndex: number }) =>
      highlightPattern(textItem.str, searchQuery, textItem.itemIndex),
    [searchQuery]
  );

  // Memoized document options para evitar re-renders
  const documentOptions = useMemo(() => ({
    verbosity: 0,
    disableAutoFetch: false,
    disableStream: false,
    disableRange: false,
    // Configuración optimizada para evitar problemas de memoria
    maxImageSize: renderingQuality === 'high' ? -1 : 1024 * 1024, // 1MB limit for standard
    isEvalSupported: false,
    useSystemFonts: true,
  }), [renderingQuality]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoadingError(null);
    setNeedsRecovery(false);
    setIsRendering(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setLoadingError('Error al cargar el documento PDF');
    setNeedsRecovery(true);
    setIsRendering(false);
  }

  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= (numPages || 1)) {
      setCurrentPage(pageNumber);
      // Scroll suave a la página específica
      const pageElement = document.querySelector(`[data-page-number="${pageNumber}"]`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [numPages]);

  const handleZoomChange = useCallback((newZoom: number) => {
    // Limitar zoom según el tamaño del documento para evitar problemas de memoria
    const maxZoom = numPages && numPages > 50 ? 2 : 8;
    const clampedZoom = Math.min(newZoom, maxZoom);
    debouncedZoomChange(clampedZoom);
  }, [numPages, debouncedZoomChange]);

  const handleRotationChange = useCallback((rotationDelta: number) => {
    debouncedRotationChange((rotation + rotationDelta) % 360);
  }, [rotation, debouncedRotationChange]);

  const handleTextLayerToggle = useCallback((enabled: boolean) => {
    setEnableTextLayer(enabled);
    if (!enabled) {
      setEnableSearch(false);
      setSearchQuery("");
    }
  }, []);

  const handleSearchToggle = useCallback((enabled: boolean) => {
    setEnableSearch(enabled);
    if (enabled && !enableTextLayer) {
      setEnableTextLayer(true);
    }
  }, [enableTextLayer]);

  const handleRecovery = useCallback(() => {
    setLoadingError(null);
    setNeedsRecovery(false);
    setIsRendering(true);
    // Limpiar cache de páginas renderizadas
    renderingPagesRef.current.clear();
    // Forzar re-render del documento
    window.location.reload();
  }, []);

  // Cleanup de observer al desmontar
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Intersection Observer optimizado con throttling
  useEffect(() => {
    if (!viewportRef.current || !numPages) return;

    // Limpiar observer previo
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const options = {
      root: viewportRef.current,
      rootMargin: "0px",
      threshold: 0.5,
    };

    const callback = throttledPageChange as any;
    
    const wrappedCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageElement = entry.target.closest("[data-page-number]");
          if (pageElement) {
            const pageNumber = parseInt(
              pageElement.getAttribute("data-page-number") || "1",
              10
            );
            callback(pageNumber);
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(wrappedCallback, options);

    // Observer las páginas existentes
    const pages = viewportRef.current.querySelectorAll(".react-pdf__Page");
    pages.forEach((page) => {
      observerRef.current?.observe(page);
    });

    // MutationObserver para nuevas páginas
    const mutationObserver = new MutationObserver(() => {
      const newPages = viewportRef.current?.querySelectorAll(".react-pdf__Page");
      if (newPages && observerRef.current) {
        newPages.forEach((page) => {
          observerRef.current?.observe(page);
        });
      }
    });

    mutationObserver.observe(viewportRef.current, {
      childList: true,
      subtree: true,
    });

    return () => {
      observerRef.current?.disconnect();
      mutationObserver.disconnect();
    };
  }, [numPages, throttledPageChange]);

  // Función para determinar si una página debe renderizarse (virtualización)
  const shouldRenderPage = useCallback((pageNumber: number) => {
    if (!numPages) return true;
    
    // Si hay pocas páginas, renderizar todas
    if (numPages <= 10) return true;
    
    // Renderizar solo páginas cerca de la actual
    const range = 3; // Renderizar 3 páginas antes y después
    return Math.abs(pageNumber - currentPage) <= range;
  }, [numPages, currentPage]);

  const handlePageRenderSuccess = useCallback((pageNumber: number) => {
    renderingPagesRef.current.delete(pageNumber);
    if (renderingPagesRef.current.size === 0) {
      setIsRendering(false);
    }
  }, []);

  const handlePageRenderError = useCallback((pageNumber: number) => {
    renderingPagesRef.current.delete(pageNumber);
    console.error(`Error rendering page ${pageNumber}`);
    if (renderingPagesRef.current.size === 0) {
      setIsRendering(false);
    }
  }, []);

  if (loadingError && needsRecovery) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full bg-background", className)}>
        <div className="text-center p-8">
          <p className="text-lg font-medium text-destructive mb-2">Error al cargar el PDF</p>
          <p className="text-sm text-muted-foreground mb-4">{loadingError}</p>
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              onClick={handleRecovery}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Intentar de nuevo
            </Button>
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
        options={documentOptions}
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
                  disabled={isRendering}
                >
                  {showThumbnails ? "Ocultar" : "Mostrar"} páginas
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage <= 1 || isRendering}
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
                    disabled={currentPage >= (numPages || 1) || isRendering}
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                {isRendering && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Procesando...
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRotationChange(-90)}
                  disabled={isRendering}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRotationChange(90)}
                  disabled={isRendering}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={zoom <= ZOOM_OPTIONS[0] || isRendering}
                  onClick={() => handleZoomChange(Math.max(ZOOM_OPTIONS[0], zoom - 0.25))}
                >
                  <CircleMinus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={zoom >= ZOOM_OPTIONS[ZOOM_OPTIONS.length - 1] || isRendering}
                  onClick={() => handleZoomChange(Math.min(ZOOM_OPTIONS[ZOOM_OPTIONS.length - 1], zoom + 0.25))}
                >
                  <CirclePlus className="h-4 w-4" />
                </Button>

                <Select
                  value={zoom.toString()}
                  onValueChange={(value) => handleZoomChange(Number(value))}
                  disabled={isRendering}
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
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isRendering}>
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
                            disabled={isRendering}
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
                            disabled={isRendering}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Calidad de renderizado</Label>
                          <Select
                            value={renderingQuality}
                            onValueChange={(value: 'standard' | 'high') => setRenderingQuality(value)}
                            disabled={isRendering}
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
                {Array.from(new Array(numPages), (el, index) => {
                  const pageNumber = index + 1;
                  const shouldRender = shouldRenderPage(pageNumber);
                  
                  if (!shouldRender) {
                    // Placeholder para páginas no renderizadas (virtualización)
                    return (
                      <div
                        key={`page_placeholder_${pageNumber}`}
                        className="flex items-center justify-center h-96 border rounded-lg bg-muted/20"
                        data-page-number={pageNumber}
                        style={{ minHeight: '800px' }}
                      >
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Página {pageNumber}</p>
                          <p className="text-xs text-muted-foreground">Scroll para cargar</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Page
                      key={`page_${pageNumber}`}
                      pageNumber={pageNumber}
                      className="border shadow-sm rounded-lg"
                      data-page-number={pageNumber}
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
                      onRenderSuccess={() => handlePageRenderSuccess(pageNumber)}
                      onRenderError={() => handlePageRenderError(pageNumber)}
                    />
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </Document>
    </div>
  );
}

export { PDFViewer };
