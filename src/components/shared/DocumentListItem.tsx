import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Eye, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface DocumentProfile {
  nombre: string;
  apellido: string;
}

interface Documento {
  id: string;
  nombre_archivo: string;
  tipo_documento: string;
  descripcion: string | null;
  fecha_subida: string;
  profiles: DocumentProfile | null; // Perfil del abogado que subió (para doc. cliente)
  abogado_id?: string; // ID del abogado que subió (para doc. abogado)
  abogado?: DocumentProfile; // Perfil del abogado que subió (para doc. abogado)
}

interface DocumentListItemProps {
  doc: Documento;
  variant: 'cliente' | 'abogado';
  onView: (doc: Documento) => void;
  onDownload: (doc: Documento) => void;
  onDelete: (id: string) => void;
  showDelete: boolean;
}

const DocumentListItem: React.FC<DocumentListItemProps> = ({
  doc,
  variant,
  onView,
  onDownload,
  onDelete,
  showDelete,
}) => {
  const uploaderName =
    doc.profiles?.nombre && doc.profiles?.apellido
      ? `${doc.profiles.nombre} ${doc.profiles.apellido}`
      : doc.abogado?.nombre && doc.abogado?.apellido
      ? `${doc.abogado.nombre} ${doc.abogado.apellido}`
      : 'el cliente';
  
  const isUploadedByClient = uploaderName === 'el cliente';

  const baseClasses = "flex items-start gap-3 p-3 rounded-lg border";
  const variantClasses = {
    cliente: "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20",
    abogado: "bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20",
  };
  const iconClasses = {
    cliente: "text-blue-600",
    abogado: "text-green-600",
  };
  const titleClasses = {
    cliente: "text-blue-900 dark:text-blue-100",
    abogado: "text-green-900 dark:text-green-100",
  };
  const descriptionClasses = {
    cliente: "text-blue-700 dark:text-blue-300",
    abogado: "text-green-700 dark:text-green-300",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      <FileText className={`h-5 w-5 mt-1 flex-shrink-0 ${iconClasses[variant]}`} />
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold break-all ${titleClasses[variant]}`} title={doc.nombre_archivo}>
          {doc.nombre_archivo}
        </p>
        
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge variant={variant === 'cliente' ? 'default' : 'success'} className="capitalize text-xs">
            {doc.tipo_documento.replace(/_/g, ' ')}
          </Badge>
        </div>
        
        {doc.descripcion && (
          <p className={`text-xs mt-2 italic ${descriptionClasses[variant]}`}>
            "{doc.descripcion}"
          </p>
        )}
        
        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-dashed">
          Subido el {format(new Date(doc.fecha_subida), 'dd/MM/yyyy', { locale: es })} 
          por {uploaderName}
        </p>
      </div>

      <div className="flex flex-col items-center justify-start gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView(doc)}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDownload(doc)}>
          <Download className="h-4 w-4" />
        </Button>
        {showDelete && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => onDelete(doc.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default DocumentListItem;
