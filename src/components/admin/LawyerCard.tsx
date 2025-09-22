import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  MapPin,
  Briefcase,
  Award,
  Star,
  Target,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface LawyerCardProps {
  lawyer: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    especialidades: any[];
    experiencia_anos?: number;
    ciudad?: string;
    casos_activos: number;
    creditos_disponibles: number;
    tipo_abogado?: string;
  };
  matchScore?: number;
  matchLevel?: 'excellent' | 'good' | 'fair' | 'poor';
  matchReasons?: string[];
  isDragOverlay?: boolean;
}

const LawyerCard: React.FC<LawyerCardProps> = ({
  lawyer,
  matchScore,
  matchLevel = 'poor',
  matchReasons = [],
  isDragOverlay = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `lawyer-${lawyer.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getMatchLevelColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'border-green-300 bg-green-50';
      case 'good': return 'border-blue-300 bg-blue-50';
      case 'fair': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getMatchLevelIcon = (level: string) => {
    switch (level) {
      case 'excellent': return <Star className="w-4 h-4 text-green-600" />;
      case 'good': return <Target className="w-4 h-4 text-blue-600" />;
      case 'fair': return <TrendingUp className="w-4 h-4 text-yellow-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getWorkloadPercentage = (activeCases: number) => {
    const maxCases = 10; // Maximum recommended cases
    return Math.min((activeCases / maxCases) * 100, 100);
  };

  const getWorkloadColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const workloadPercentage = getWorkloadPercentage(lawyer.casos_activos);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-all duration-200 ${
        isDragging ? 'opacity-50' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <Card
        className={`${matchScore ? `border-2 ${getMatchLevelColor(matchLevel)}` : 'border border-gray-200'} ${
          isDragOverlay ? 'shadow-2xl rotate-2' : 'hover:shadow-md'
        }`}
      >
      <CardContent className="p-4">
        {/* Header with Avatar and Match Score */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-sm">
                {lawyer.nombre.charAt(0)}{lawyer.apellido.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-gray-900 truncate">
                {lawyer.nombre} {lawyer.apellido}
              </h4>
              <p className="text-sm text-gray-600 truncate">{lawyer.email}</p>
            </div>
          </div>

          {matchScore !== undefined && (
            <div className="flex items-center gap-2">
              {getMatchLevelIcon(matchLevel)}
              <Badge
                variant="outline"
                className={`text-xs font-semibold ${getMatchLevelColor(matchLevel).replace('bg-', 'text-').replace('border-', 'border-')}`}
              >
                {matchScore}%
              </Badge>
            </div>
          )}
        </div>

        {/* Specialties */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {lawyer.especialidades && Array.isArray(lawyer.especialidades) && lawyer.especialidades.slice(0, 2).map((esp, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                {typeof esp === 'object' ? esp.nombre : `Especialidad ${esp}`}
              </Badge>
            ))}
            {lawyer.especialidades && lawyer.especialidades.length > 2 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{lawyer.especialidades.length - 2}
              </Badge>
            )}
          </div>
        </div>

        {/* Location and Experience */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          {lawyer.ciudad && (
            <div className="flex items-center gap-1 text-gray-600">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{lawyer.ciudad}</span>
            </div>
          )}
          {lawyer.experiencia_anos && (
            <div className="flex items-center gap-1 text-gray-600">
              <Award className="w-3 h-3" />
              <span>{lawyer.experiencia_anos}años</span>
            </div>
          )}
        </div>

        {/* Workload */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600 flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              Casos activos
            </span>
            <span className={`font-medium ${
              workloadPercentage < 50 ? 'text-green-600' :
              workloadPercentage < 80 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {lawyer.casos_activos}/10
            </span>
          </div>
          <Progress
            value={workloadPercentage}
            className="h-2"
          />
        </div>

        {/* Credits */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Créditos disponibles</span>
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            {lawyer.creditos_disponibles}
          </Badge>
        </div>

        {/* Match Reasons */}
        {matchReasons && matchReasons.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              {matchReasons.slice(0, 2).map((reason, index) => (
                <div key={index} className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
};

export default LawyerCard;