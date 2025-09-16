"use client";

import { useCharacterLimit } from "@/hooks/use-character-limit";
import { useImageUpload } from "@/hooks/use-image-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, ImagePlus, X, Eye, Edit, Loader2, Award, MapPin, Briefcase } from "lucide-react";
import { useId, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface LawyerProfile {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  avatar_url?: string;
  especialidades?: number[];
  creditos_disponibles: number;
  colegio_profesional?: string;
  numero_colegiado?: string;
  experiencia_anos?: number;
  cv_url?: string;
  carta_motivacion?: string;
  documentos_verificacion?: Record<string, unknown>[];
  ciudad?: string;
  direccion_fiscal?: string;
  nombre_gerente?: string;
  razon_social?: string;
  nif_cif?: string;
  tipo_perfil?: string;
}

interface LawyerProfileModalProps {
  lawyer: LawyerProfile | null;
  mode: 'view' | 'edit';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSave?: (updatedProfile: Partial<LawyerProfile>) => void;
}

function ProfileAvatar({
  currentImage,
  onThumbnailClick,
  onRemove,
  readOnly
}: {
  currentImage?: string;
  onThumbnailClick: () => void;
  onRemove: () => void;
  readOnly: boolean;
}) {
  return (
    <div className="flex justify-center">
      <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted shadow-sm shadow-black/10">
        {currentImage && (
          <img
            src={currentImage}
            className="h-full w-full object-cover"
            alt="Foto de perfil"
          />
        )}
        {!readOnly && (
          <button
            type="button"
            className="absolute flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-offset-2 transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
            onClick={onThumbnailClick}
            aria-label="Cambiar foto de perfil"
          >
            <ImagePlus size={16} strokeWidth={2} />
          </button>
        )}
        {currentImage && !readOnly && (
          <button
            type="button"
            className="absolute -top-2 -right-2 flex size-6 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white outline-offset-2 transition-colors hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
            onClick={onRemove}
            aria-label="Eliminar foto"
          >
            <X size={12} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}

function LawyerProfileModal({ lawyer, mode: initialMode, open, onOpenChange, trigger, onSave }: LawyerProfileModalProps) {
  const id = useId();
  const { toast } = useToast();
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<LawyerProfile>>({});
  const [specialtiesModalOpen, setSpecialtiesModalOpen] = useState(false);

  const maxLength = 500;
  const {
    value: bioValue,
    characterCount: bioCharacterCount,
    handleChange: handleBioChange,
    maxLength: bioLimit,
  } = useCharacterLimit({
    maxLength,
    initialValue: lawyer?.carta_motivacion || '',
  });

  const { previewUrl, fileInputRef, handleThumbnailClick, handleFileChange, handleRemove } = useImageUpload();

  // Inicializar formData cuando lawyer cambie
  useEffect(() => {
    if (lawyer) {
      console.log('🔍 Modal: Inicializando formData con abogado:', {
        id: lawyer.id,
        nombre: lawyer.nombre,
        telefono: lawyer.telefono,
        colegio_profesional: lawyer.colegio_profesional,
        numero_colegiado: lawyer.numero_colegiado,
        experiencia_anos: lawyer.experiencia_anos,
        carta_motivacion: lawyer.carta_motivacion?.substring(0, 50) + '...',
        ciudad: lawyer.ciudad,
        creditos_disponibles: lawyer.creditos_disponibles
      });

      setFormData({
        nombre: lawyer.nombre,
        apellido: lawyer.apellido,
        email: lawyer.email,
        telefono: lawyer.telefono,
        avatar_url: lawyer.avatar_url,
        especialidades: lawyer.especialidades,
        colegio_profesional: lawyer.colegio_profesional,
        numero_colegiado: lawyer.numero_colegiado,
        experiencia_anos: lawyer.experiencia_anos,
        cv_url: lawyer.cv_url,
        carta_motivacion: lawyer.carta_motivacion,
        ciudad: lawyer.ciudad,
        direccion_fiscal: lawyer.direccion_fiscal,
        nombre_gerente: lawyer.nombre_gerente,
        razon_social: lawyer.razon_social,
        nif_cif: lawyer.nif_cif,
        tipo_perfil: lawyer.tipo_perfil,
        creditos_disponibles: lawyer.creditos_disponibles,
      });
    }
  }, [lawyer]);

  // Resetear el modo interno cuando cambie initialMode o se abra el modal
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, open]);

  const handleInputChange = (field: keyof LawyerProfile, value: string | number | Record<string, unknown>[] | number[] | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!lawyer) return;

    setIsSaving(true);
    try {
      const updates: Record<string, any> = {
        ...formData,
        carta_motivacion: bioValue,
        avatar_url: previewUrl || formData.avatar_url,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates as any)
        .eq('id', lawyer.id);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Los cambios han sido guardados exitosamente.",
      });

      onSave?.(updates);
      setMode('view');
      onOpenChange?.(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!lawyer) return null;

  // Función para obtener la imagen de avatar disponible
  const getAvatarUrl = (lawyer: any) => {
    // Usar avatar_url de profiles si está disponible
    if (lawyer.avatar_url) {
      return lawyer.avatar_url;
    }

    // Si no hay imagen, devolver null para mostrar iniciales
    return null;
  };

  const currentAvatar = previewUrl || getAvatarUrl(lawyer);

  // Función para mapear IDs de especialidades a nombres
  const getSpecialtyName = (id: number): string => {
    const specialtyMap: Record<number, string> = {
      1: 'Derecho Civil',
      2: 'Derecho Penal',
      3: 'Derecho Laboral',
      4: 'Derecho Mercantil',
      5: 'Derecho Administrativo',
      6: 'Derecho Fiscal',
      7: 'Derecho Familiar',
      8: 'Derecho Inmobiliario',
      9: 'Derecho de Extranjería',
      10: 'Derecho de la Seguridad Social',
      11: 'Derecho Sanitario',
      12: 'Derecho de Seguros',
      13: 'Derecho Concursal',
      14: 'Derecho de Propiedad Intelectual',
      15: 'Derecho Ambiental',
      16: 'Consulta General'
    };
    return specialtyMap[id] || `Especialidad ${id}`;
  };

  // Función para renderizar especialidades
  const renderSpecialties = (especialidades: number[] | undefined) => {
    if (!especialidades || especialidades.length === 0) {
      return <span className="text-sm text-gray-500 italic">Sin especialidades definidas</span>;
    }

    if (especialidades.length <= 3) {
      // Mostrar todas las especialidades si son pocas
      return (
        <div className="flex flex-wrap gap-2">
          {especialidades.map((id) => (
            <Badge key={id} variant="secondary" className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
              {getSpecialtyName(id)}
            </Badge>
          ))}
        </div>
      );
    } else {
      // Mostrar las primeras 3 y un botón para ver todas
      return (
        <div className="flex flex-wrap gap-2 items-center">
          {especialidades.slice(0, 3).map((id) => (
            <Badge key={id} variant="secondary" className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
              {getSpecialtyName(id)}
            </Badge>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
            onClick={() => setSpecialtiesModalOpen(true)}
          >
            +{especialidades.length - 3} más
          </Button>
        </div>
      );
    }
  };

  return (
    <>
      {/* Modal de Especialidades */}
      <Dialog open={specialtiesModalOpen} onOpenChange={setSpecialtiesModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Especialidades de {lawyer.nombre} {lawyer.apellido}
            </DialogTitle>
            <DialogDescription>
              Lista completa de especialidades del abogado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {formData.especialidades && formData.especialidades.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.especialidades.map((id) => (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                  >
                    {getSpecialtyName(id)}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button type="button" onClick={() => setSpecialtiesModalOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex flex-col gap-0 overflow-y-visible p-0 sm:max-w-2xl max-h-[90vh]">
          <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="border-b border-border px-6 py-4 text-base flex items-center justify-between">
              <span>{mode === 'view' ? 'Ver Perfil' : 'Editar Perfil'}</span>
              {mode === 'view' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode('edit')}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">
            {mode === 'view' ? 'Ver detalles del perfil del abogado' : 'Editar información del perfil del abogado'}
          </DialogDescription>
        <div className="overflow-y-auto flex-1">
          {/* Avatar Section */}
          <div className="px-6 pt-4">
            <ProfileAvatar
              currentImage={currentAvatar}
              onThumbnailClick={handleThumbnailClick}
              onRemove={handleRemove}
              readOnly={mode === 'view'}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>

          {/* Form */}
          <div className="px-6 pb-6 pt-4">
            <form className="space-y-6">
              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información Personal</h3>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`${id}-first-name`}>Nombre</Label>
                    <Input
                      id={`${id}-first-name`}
                      value={formData.nombre || ''}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      readOnly={mode === 'view'}
                      className={mode === 'view' ? 'bg-gray-50' : ''}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`${id}-last-name`}>Apellido</Label>
                    <Input
                      id={`${id}-last-name`}
                      value={formData.apellido || ''}
                      onChange={(e) => handleInputChange('apellido', e.target.value)}
                      readOnly={mode === 'view'}
                      className={mode === 'view' ? 'bg-gray-50' : ''}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${id}-email`}>Email</Label>
                  <div className="relative">
                    <Input
                      id={`${id}-email`}
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      readOnly={mode === 'view'}
                      className={mode === 'view' ? 'bg-gray-50' : ''}
                    />
                    {mode === 'view' && (
                      <div className="absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80">
                        <Check size={16} strokeWidth={2} className="text-emerald-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${id}-telefono`}>Teléfono</Label>
                  <Input
                    id={`${id}-telefono`}
                    value={formData.telefono || ''}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    readOnly={mode === 'view'}
                    className={mode === 'view' ? 'bg-gray-50' : ''}
                  />
                </div>
              </div>

              {/* Información Profesional */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información Profesional</h3>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`${id}-colegio`}>Colegio Profesional</Label>
                    <Input
                      id={`${id}-colegio`}
                      value={formData.colegio_profesional || ''}
                      onChange={(e) => handleInputChange('colegio_profesional', e.target.value)}
                      readOnly={mode === 'view'}
                      className={mode === 'view' ? 'bg-gray-50' : ''}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`${id}-colegiado`}>Número Colegiado</Label>
                    <Input
                      id={`${id}-colegiado`}
                      value={formData.numero_colegiado || ''}
                      onChange={(e) => handleInputChange('numero_colegiado', e.target.value)}
                      readOnly={mode === 'view'}
                      className={mode === 'view' ? 'bg-gray-50' : ''}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${id}-experiencia`}>Años de Experiencia</Label>
                  <Input
                    id={`${id}-experiencia`}
                    type="number"
                    value={formData.experiencia_anos || ''}
                    onChange={(e) => handleInputChange('experiencia_anos', parseInt(e.target.value) || 0)}
                    readOnly={mode === 'view'}
                    className={mode === 'view' ? 'bg-gray-50' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${id}-cv`}>URL del CV</Label>
                  <Input
                    id={`${id}-cv`}
                    value={formData.cv_url || ''}
                    onChange={(e) => handleInputChange('cv_url', e.target.value)}
                    readOnly={mode === 'view'}
                    className={mode === 'view' ? 'bg-gray-50' : ''}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Especialidades */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Award className="w-5 h-5 mr-2 text-blue-600" />
                  Especialidades
                </h3>
                <div className="space-y-2">
                  <Label>Áreas de especialización</Label>
                  {mode === 'view' ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                      {renderSpecialties(formData.especialidades)}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { id: 1, name: 'Derecho Civil' },
                          { id: 2, name: 'Derecho Penal' },
                          { id: 3, name: 'Derecho Laboral' },
                          { id: 4, name: 'Derecho Mercantil' },
                          { id: 5, name: 'Derecho Administrativo' },
                          { id: 6, name: 'Derecho Fiscal' },
                          { id: 7, name: 'Derecho Familiar' },
                          { id: 8, name: 'Derecho Inmobiliario' },
                          { id: 9, name: 'Derecho de Extranjería' },
                          { id: 10, name: 'Derecho de la Seguridad Social' },
                          { id: 11, name: 'Derecho Sanitario' },
                          { id: 12, name: 'Derecho de Seguros' },
                          { id: 13, name: 'Derecho Concursal' },
                          { id: 14, name: 'Derecho de Propiedad Intelectual' },
                          { id: 15, name: 'Derecho Ambiental' },
                          { id: 16, name: 'Consulta General' }
                        ].map((specialty) => (
                          <div key={specialty.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`specialty-${specialty.id}`}
                              checked={formData.especialidades?.includes(specialty.id) || false}
                              onChange={(e) => {
                                const currentSpecialties = formData.especialidades || [];
                                if (e.target.checked) {
                                  handleInputChange('especialidades', [...currentSpecialties, specialty.id]);
                                } else {
                                  handleInputChange('especialidades', currentSpecialties.filter(id => id !== specialty.id));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <Label
                              htmlFor={`specialty-${specialty.id}`}
                              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                            >
                              {specialty.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {(!formData.especialidades || formData.especialidades.length === 0) && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 italic">
                          ⚠️ Selecciona al menos una especialidad
                        </p>
                      )}
                    </div>
                  )}
                  {mode === 'view' && (!formData.especialidades || formData.especialidades.length === 0) && (
                    <p className="text-sm text-gray-500 italic">Este abogado aún no ha definido sus especialidades</p>
                  )}
                </div>
              </div>

              {/* Carta de Presentación */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Carta de Presentación</h3>
                <div className="space-y-2">
                  <Textarea
                    id={`${id}-bio`}
                    placeholder="Escribe una carta de presentación..."
                    value={bioValue}
                    onChange={handleBioChange}
                    maxLength={maxLength}
                    readOnly={mode === 'view'}
                    className={mode === 'view' ? 'bg-gray-50' : ''}
                    rows={4}
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    <span className="tabular-nums">{bioLimit - bioCharacterCount}</span> caracteres restantes
                  </p>
                </div>
              </div>

              {/* Estadísticas Rápidas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Estadísticas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">¢</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Créditos</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formData.creditos_disponibles || lawyer.creditos_disponibles}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-2">
                      <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Experiencia</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formData.experiencia_anos || lawyer.experiencia_anos || 0} años
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información Adicional */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-gray-600" />
                  Información Adicional
                </h3>

                <div className="space-y-2">
                  <Label htmlFor={`${id}-ciudad`}>Ciudad</Label>
                  <Input
                    id={`${id}-ciudad`}
                    value={formData.ciudad || ''}
                    onChange={(e) => handleInputChange('ciudad', e.target.value)}
                    readOnly={mode === 'view'}
                    className={mode === 'view' ? 'bg-gray-50' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${id}-creditos`}>Créditos Disponibles</Label>
                  <Input
                    id={`${id}-creditos`}
                    type="number"
                    value={formData.creditos_disponibles || lawyer.creditos_disponibles}
                    onChange={(e) => handleInputChange('creditos_disponibles', parseInt(e.target.value) || 0)}
                    readOnly={mode === 'view'}
                    className={mode === 'view' ? 'bg-gray-50' : ''}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
        <DialogFooter className="border-t border-border px-6 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {mode === 'view' ? 'Cerrar' : 'Cancelar'}
            </Button>
          </DialogClose>
          {mode === 'edit' && (
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

export { LawyerProfileModal };