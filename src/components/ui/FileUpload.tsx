import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, X, UploadCloud } from 'lucide-react';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange, maxFiles = 5 }) => {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
    setFiles(newFiles);
    onFilesChange(newFiles);
  }, [files, maxFiles, onFilesChange]);

  const removeFile = (fileToRemove: File) => {
    const newFiles = files.filter(file => file !== fileToRemove);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary-foreground' : 'border-border hover:border-primary/50'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-10 h-10 mb-2 text-muted-foreground" />
        {isDragActive ? (
          <p>Suelta los archivos aquí...</p>
        ) : (
          <p>Arrastra y suelta tus documentos aquí, o haz clic para seleccionar</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          PDF, JPG, PNG, DOC, DOCX (máx. {maxFiles} archivos)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
            <h4 className="font-medium text-sm">Archivos seleccionados:</h4>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2 text-sm rounded-md bg-muted"
              >
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>{file.name}</span>
                    <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(2)} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file)}
                  className="p-1 rounded-full hover:bg-destructive/20"
                >
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
