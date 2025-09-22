import { useMemo } from 'react';
import { useAdminLawyers } from './queries/useAdminLawyers';

interface CaseData {
  id: string;
  especialidades?: { id: number; nombre: string }[];
  ciudad_borrador?: string;
  profiles?: { ciudad?: string };
  motivo_consulta: string;
  tipo_lead?: string;
}

interface LawyerData {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  especialidades: { id: number; nombre: string }[] | number[];
  experiencia_anos?: number;
  ciudad?: string;
  casos_activos: number;
  creditos_disponibles: number;
  tipo_abogado?: string;
}

interface MatchResult {
  lawyer: LawyerData;
  score: number;
  reasons: string[];
  matchLevel: 'excellent' | 'good' | 'fair' | 'poor';
}

// Mapa de especialidades relacionadas (basado en práctica jurídica real)
const specialtyRelations: Record<number, number[]> = {
  1: [2, 3, 4, 7, 8],     // Civil -> Penal, Laboral, Mercantil, Familiar, Inmobiliario
  2: [1, 3, 9],             // Penal -> Civil, Laboral, Extranjería
  3: [1, 2, 10],            // Laboral -> Civil, Penal, Seguridad Social
  4: [1, 13, 14, 15],       // Mercantil -> Civil, Concursal, Propiedad Intelectual, Ambiental
  5: [1, 6, 11],            // Administrativo -> Civil, Fiscal, Sanitario
  6: [5, 4, 13],            // Fiscal -> Administrativo, Mercantil, Concursal
  7: [1, 8],                // Familiar -> Civil, Inmobiliario
  8: [1, 7, 4],             // Inmobiliario -> Civil, Familiar, Mercantil
  9: [2, 1],                // Extranjería -> Penal, Civil
  10: [3, 5],               // Seguridad Social -> Laboral, Administrativo
  11: [5, 1],               // Sanitario -> Administrativo, Civil
  12: [1, 4],               // Seguros -> Civil, Mercantil
  13: [4, 6, 14],           // Concursal -> Mercantil, Fiscal, Propiedad Intelectual
  14: [4, 13],              // Propiedad Intelectual -> Mercantil, Concursal
  15: [4, 5],               // Ambiental -> Mercantil, Administrativo
  16: [1, 2, 3, 4, 5]       // Consulta General -> Todas las básicas
};

const calculateSpecialtyMatch = (caseSpecialties: { id: number; nombre: string }[], lawyerSpecialties: number[] | { id: number; nombre: string }[]): number => {
  if (!caseSpecialties?.length || !lawyerSpecialties?.length) return 0;

  const lawyerSpecialtyIds = Array.isArray(lawyerSpecialties)
    ? lawyerSpecialties.map(s => typeof s === 'number' ? s : s.id)
    : [];

  const caseSpecialtyIds = caseSpecialties.map(s => s.id);

  // 1. Coincidencia exacta (100 puntos)
  const exactMatches = caseSpecialtyIds.filter(id => lawyerSpecialtyIds.includes(id)).length;
  if (exactMatches > 0) return 100;

  // 2. Especialidades directamente relacionadas (80 puntos)
  const hasDirectRelation = caseSpecialtyIds.some(caseId =>
    lawyerSpecialtyIds.some(lawyerId =>
      specialtyRelations[caseId]?.includes(lawyerId) ||
      specialtyRelations[lawyerId]?.includes(caseId)
    )
  );
  if (hasDirectRelation) return 80;

  // 3. Especialidades indirectamente relacionadas (60 puntos)
  const hasIndirectRelation = caseSpecialtyIds.some(caseId => {
    const caseRelations = specialtyRelations[caseId] || [];
    return lawyerSpecialtyIds.some(lawyerId => {
      const lawyerRelations = specialtyRelations[lawyerId] || [];
      return caseRelations.some(relId => lawyerRelations.includes(relId));
    });
  });
  if (hasIndirectRelation) return 60;

  // 4. Al menos una especialidad en común (40 puntos)
  const hasAnyMatch = caseSpecialtyIds.some(id => lawyerSpecialtyIds.includes(id));
  if (hasAnyMatch) return 40;

  return 0;
};

// Mapa de ciudades por comunidades autónomas (España)
const cityRegions: Record<string, string> = {
  // Comunidad de Madrid
  'madrid': 'madrid',
  // Cataluña
  'barcelona': 'cataluña', 'girona': 'cataluña', 'tarragona': 'cataluña', 'lleida': 'cataluña',
  // Comunidad Valenciana
  'valencia': 'valencia', 'alicante': 'valencia', 'castellón': 'valencia',
  // Andalucía
  'sevilla': 'andalucía', 'málaga': 'andalucía', 'granada': 'andalucía', 'córdoba': 'andalucía',
  'jaén': 'andalucía', 'huelva': 'andalucía', 'cádiz': 'andalucía', 'almería': 'andalucía',
  // Castilla-La Mancha
  'toledo': 'castilla-la-mancha', 'ciudad real': 'castilla-la-mancha', 'albacete': 'castilla-la-mancha',
  'guadalajara': 'castilla-la-mancha', 'cuenca': 'castilla-la-mancha',
  // Castilla y León
  'burgos': 'castilla-y-león', 'león': 'castilla-y-león', 'palencia': 'castilla-y-león',
  'salamanca': 'castilla-y-león', 'segovia': 'castilla-y-león', 'soria': 'castilla-y-león',
  'valladolid': 'castilla-y-león', 'zamora': 'castilla-y-león', 'ávila': 'castilla-y-león',
  // Galicia
  'coruña': 'galicia', 'lugo': 'galicia', 'ourense': 'galicia', 'pontevedra': 'galicia',
  // País Vasco
  'bilbao': 'país-vasco', 'san sebastián': 'país-vasco', 'vitoria': 'país-vasco',
  // Aragón
  'zaragoza': 'aragón', 'huesca': 'aragón', 'teruel': 'aragón',
  // Murcia
  'murcia': 'murcia', 'cartagena': 'murcia',
  // Canarias
  'santa cruz de tenerife': 'canarias', 'las palmas': 'canarias',
  // Baleares
  'palma': 'baleares',
  // Navarra
  'pamplona': 'navarra',
  // La Rioja
  'logroño': 'la-rioja',
  // Cantabria
  'santander': 'cantabria',
  // Extremadura
  'mérida': 'extremadura', 'badajoz': 'extremadura', 'cáceres': 'extremadura'
};

const calculateLocationMatch = (caseCity: string, lawyerCity?: string): number => {
  if (!caseCity || !lawyerCity) return 50; // Neutral score when location unknown

  const caseCityLower = caseCity.toLowerCase().trim();
  const lawyerCityLower = lawyerCity.toLowerCase().trim();

  // 1. Misma ciudad exacta (100 puntos)
  if (caseCityLower === lawyerCityLower) return 100;

  // 2. Obtener regiones
  const caseRegion = cityRegions[caseCityLower];
  const lawyerRegion = cityRegions[lawyerCityLower];

  // 3. Misma comunidad autónoma (85 puntos)
  if (caseRegion && lawyerRegion && caseRegion === lawyerRegion) return 85;

  // 4. Comunidades limítrofes (70 puntos)
  const neighboringRegions: Record<string, string[]> = {
    'madrid': ['castilla-la-mancha', 'castilla-y-león'],
    'cataluña': ['aragón', 'valencia', 'baleares'],
    'valencia': ['cataluña', 'murcia', 'castilla-la-mancha', 'aragón'],
    'andalucía': ['extremadura', 'castilla-la-mancha', 'murcia'],
    'castilla-la-mancha': ['madrid', 'castilla-y-león', 'andalucía', 'valencia', 'murcia', 'extremadura'],
    'castilla-y-león': ['madrid', 'castilla-la-mancha', 'galicia', 'cantabria', 'país-vasco'],
    'galicia': ['castilla-y-león', 'asturias', 'cantabria'],
    'país-vasco': ['navarra', 'la-rioja', 'cantabria', 'castilla-y-león'],
    'aragón': ['cataluña', 'valencia', 'castilla-la-mancha', 'navarra'],
    'murcia': ['valencia', 'andalucía', 'castilla-la-mancha'],
    'extremadura': ['andalucía', 'castilla-la-mancha', 'castilla-y-león']
  };

  if (caseRegion && lawyerRegion && neighboringRegions[caseRegion]?.includes(lawyerRegion)) {
    return 70;
  }

  // 5. Ciudades importantes o centros económicos (60 puntos)
  const majorCities = ['madrid', 'barcelona', 'valencia', 'sevilla', 'bilbao', 'zaragoza'];
  if (majorCities.includes(caseCityLower) || majorCities.includes(lawyerCityLower)) {
    return 60;
  }

  // 6. Ciudades diferentes en España (40 puntos)
  return 40;
};

const calculateExperienceMatch = (caseComplexity: string, lawyerExperience?: number, caseType?: string): number => {
  if (!lawyerExperience) return 30; // Low score for unknown experience

  // Análisis más sofisticado de complejidad
  const complexityAnalysis = analyzeCaseComplexity(caseComplexity, caseType);

  // Factores de complejidad con pesos
  const complexityFactors = {
    // Keywords de alta complejidad (peso 5)
    urgente: 5, emergencia: 5, inmediato: 5, 'última hora': 5,
    complejo: 5, complicado: 5, intrincado: 5, sofisticado: 5,
    internacional: 5, extranjero: 5, multinacional: 5, transfronterizo: 5,
    'alto riesgo': 5, 'gran impacto': 5, estratégico: 5,

    // Keywords de complejidad alta (peso 4)
    corporativo: 4, empresarial: 4, societario: 4, fusión: 4, adquisición: 4,
    mercantil: 4, concursal: 4, insolvencia: 4, bancarrota: 4,
    penal: 4, delito: 4, judicial: 4, proceso: 4, demanda: 4,
    fiscal: 4, tributario: 4, hacienda: 4, inspección: 4,
    propiedad: 4, 'intelectual': 4, patente: 4, marca: 4,
    ambiental: 4, contaminación: 4, licencia: 4,

    // Keywords de complejidad media (peso 3)
    laboral: 3, despido: 3, contrato: 3, negociación: 3,
    civil: 3, indemnización: 3, responsabilidad: 3,
    administrativo: 3, permiso: 3, autorización: 3, expediente: 3,

    // Keywords de complejidad baja (peso 2)
    familiar: 2, divorcio: 2, custodia: 2, herencia: 2,
    inmobiliario: 2, compraventa: 2, alquiler: 2,
    extranjería: 2, residencia: 2, visado: 2,
    sanitario: 2, médico: 2, hospital: 2,

    // Keywords de complejidad muy baja (peso 1)
    consulta: 1, asesoramiento: 1, información: 1, duda: 1
  };

  let totalComplexityScore = 0;
  let keywordMatches = 0;
  const lowerMotivo = caseComplexity.toLowerCase();

  // Calcular complejidad basada en keywords encontrados
  for (const [keyword, complexity] of Object.entries(complexityFactors)) {
    if (lowerMotivo.includes(keyword)) {
      totalComplexityScore += complexity;
      keywordMatches++;
    }
  }

  // Ajustar por tipo de caso
  if (caseType === 'empresa') {
    totalComplexityScore += 1; // Casos empresariales tienden a ser más complejos
  }

  // Calcular complejidad final (1-5 escala)
  let estimatedComplexity = 3; // Default medium
  if (keywordMatches > 0) {
    estimatedComplexity = Math.min(5, Math.max(1, Math.round(totalComplexityScore / keywordMatches)));
  }

  // Considerar longitud del texto como indicador de complejidad
  if (caseComplexity.length > 500) estimatedComplexity += 0.5;
  if (caseComplexity.length > 1000) estimatedComplexity += 0.5;

  estimatedComplexity = Math.min(5, Math.max(1, estimatedComplexity));

  // Optimal experience ranges for complexity levels (más precisos)
  const optimalRanges = {
    1: [0, 3],    // Very simple cases
    2: [1, 5],    // Simple cases
    3: [2, 8],    // Medium cases
    4: [5, 15],   // Complex cases
    5: [8, 50]    // Very complex cases
  };

  const [min, max] = optimalRanges[estimatedComplexity as keyof typeof optimalRanges] || [2, 8];

  // Scoring más preciso
  if (lawyerExperience >= min && lawyerExperience <= max) return 100;
  if (lawyerExperience < min) {
    // Penalización por falta de experiencia
    const experienceGap = min - lawyerExperience;
    const penalty = Math.min(80, experienceGap * 20);
    return Math.max(10, 100 - penalty);
  }

  // Bonificación por experiencia extra (pero con límite)
  const extraExperience = lawyerExperience - max;
  if (extraExperience <= 5) return 95; // Ligeramente mejor
  if (extraExperience <= 10) return 90; // Aún bueno
  return Math.max(70, 100 - (extraExperience - 10) * 2); // Se degrada gradualmente
};

// Función auxiliar para analizar complejidad
const analyzeCaseComplexity = (motivoConsulta: string, caseType?: string) => {
  const analysis = {
    complexity: 3,
    hasUrgency: false,
    hasInternational: false,
    hasCorporate: false,
    wordCount: motivoConsulta.split(' ').length,
    hasTechnicalTerms: false
  };

  const lowerText = motivoConsulta.toLowerCase();

  // Detectar urgencia
  analysis.hasUrgency = /\b(urgente|inmediato|emergencia|última hora|antes de|deadline)\b/i.test(lowerText);

  // Detectar elementos internacionales
  analysis.hasInternational = /\b(internacional|extranjero|multinacional|europea|ue|comunidad europea)\b/i.test(lowerText);

  // Detectar elementos corporativos
  analysis.hasCorporate = /\b(empresa|sociedad|corporativo|mercantil|s.a.|s.l.|sl|sa)\b/i.test(lowerText) || caseType === 'empresa';

  // Detectar términos técnicos
  const technicalTerms = ['concursal', 'insolvencia', 'quiebra', 'bancarrota', 'fusiones', 'adquisiciones', 'm&a', 'tributario', 'hacienda', 'patente', 'marca', 'propiedad industrial'];
  analysis.hasTechnicalTerms = technicalTerms.some(term => lowerText.includes(term));

  return analysis;
};

const calculateWorkloadMatch = (activeCases: number): number => {
  const maxOptimalCases = 8; // Optimal workload threshold

  if (activeCases === 0) return 100; // No cases = fully available
  if (activeCases <= maxOptimalCases) return 100 - (activeCases / maxOptimalCases) * 30;
  return Math.max(10, 70 - ((activeCases - maxOptimalCases) / 2) * 10);
};

const calculateHistoricalMatch = (lawyerId: string, caseType?: string): number => {
  // This would typically query historical success rates
  // For now, return a neutral score
  return 50;
};

const getMatchLevel = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
};

const calculateDynamicWeights = (caseData: CaseData) => {
  // Pesos base
  const baseWeights = {
    specialty: 0.4,
    location: 0.2,
    experience: 0.15,
    workload: 0.15,
    historical: 0.1
  };

  const lowerMotivo = caseData.motivo_consulta.toLowerCase();

  // Ajustes según características del caso
  if (/\b(urgente|inmediato|emergencia)\b/i.test(lowerMotivo)) {
    // Casos urgentes: priorizar disponibilidad sobre especialidad
    return {
      specialty: 0.25,
      location: 0.15,
      experience: 0.2,
      workload: 0.3,  // Mucho más peso a la disponibilidad
      historical: 0.1
    };
  }

  if (caseData.tipo_lead === 'empresa') {
    // Casos empresariales: más peso a especialidad y experiencia
    return {
      specialty: 0.45,
      location: 0.15,
      experience: 0.2,
      workload: 0.1,
      historical: 0.1
    };
  }

  if (/\b(internacional|extranjero|europea)\b/i.test(lowerMotivo)) {
    // Casos internacionales: menos peso a ubicación local
    return {
      specialty: 0.4,
      location: 0.1,
      experience: 0.2,
      workload: 0.15,
      historical: 0.15
    };
  }

  if (/\b(complejo|sofisticado|técnico)\b/i.test(lowerMotivo)) {
    // Casos técnicos complejos: más peso a experiencia
    return {
      specialty: 0.35,
      location: 0.15,
      experience: 0.25,
      workload: 0.15,
      historical: 0.1
    };
  }

  // Casos estándar: usar pesos base
  return baseWeights;
};

const getMatchReasons = (score: number, specialtyScore: number, locationScore: number, experienceScore: number, workloadScore: number, caseData?: CaseData): string[] => {
  const reasons: string[] = [];

  // Razones de especialidad más detalladas
  if (specialtyScore >= 100) reasons.push('Especialidad exacta');
  else if (specialtyScore >= 80) reasons.push('Especialidad directamente relacionada');
  else if (specialtyScore >= 60) reasons.push('Especialidad indirectamente relacionada');
  else if (specialtyScore >= 40) reasons.push('Especialidad compatible');

  // Razones de ubicación más específicas
  if (locationScore >= 100) reasons.push('Misma ciudad');
  else if (locationScore >= 85) reasons.push('Misma comunidad autónoma');
  else if (locationScore >= 70) reasons.push('Comunidad limítrofe');
  else if (locationScore >= 60) reasons.push('Ciudad importante cercana');

  // Razones de experiencia contextuales
  if (experienceScore >= 100) reasons.push('Experiencia ideal para este caso');
  else if (experienceScore >= 90) reasons.push('Excelente experiencia');
  else if (experienceScore >= 70) reasons.push('Buena experiencia');
  else if (experienceScore >= 50) reasons.push('Experiencia adecuada');

  // Razones de disponibilidad
  if (workloadScore >= 90) reasons.push('Muy disponible');
  else if (workloadScore >= 80) reasons.push('Disponibilidad alta');
  else if (workloadScore >= 60) reasons.push('Disponibilidad moderada');
  else if (workloadScore >= 40) reasons.push('Carga de trabajo elevada');

  // Razones específicas del caso
  if (caseData) {
    const lowerMotivo = caseData.motivo_consulta.toLowerCase();

    if (/\b(urgente|inmediato)\b/i.test(lowerMotivo) && workloadScore >= 70) {
      reasons.push('Adecuado para caso urgente');
    }

    if (caseData.tipo_lead === 'empresa' && experienceScore >= 80) {
      reasons.push('Experiencia en casos empresariales');
    }

    if (/\b(internacional|extranjero)\b/i.test(lowerMotivo) && locationScore >= 60) {
      reasons.push('Experiencia en asuntos internacionales');
    }
  }

  // Limitar a 3 razones más relevantes
  return reasons.slice(0, 3);
};

export const useLawyerMatching = (caseData: CaseData | null) => {
  const { data: lawyers = [], isLoading } = useAdminLawyers();

  const matches = useMemo(() => {
    if (!caseData || !lawyers.length) return [];

    const caseCity = caseData.ciudad_borrador || caseData.profiles?.ciudad || '';
    const caseSpecialties = caseData.especialidades || [];

    const matchesWithScores: MatchResult[] = lawyers.map(lawyer => {
      const specialtyScore = calculateSpecialtyMatch(caseSpecialties, lawyer.especialidades);
      const locationScore = calculateLocationMatch(caseCity, lawyer.ciudad);
      const experienceScore = calculateExperienceMatch(caseData.motivo_consulta, lawyer.experiencia_anos);
      const workloadScore = calculateWorkloadMatch(lawyer.casos_activos);
      const historicalScore = calculateHistoricalMatch(lawyer.id, caseData.tipo_lead);

      // Pesos dinámicos según el tipo de caso
      const weights = calculateDynamicWeights(caseData);

      // Weighted calculation con pesos dinámicos
      const totalScore = (
        specialtyScore * weights.specialty +
        locationScore * weights.location +
        experienceScore * weights.experience +
        workloadScore * weights.workload +
        historicalScore * weights.historical
      );

      const reasons = getMatchReasons(totalScore, specialtyScore, locationScore, experienceScore, workloadScore, caseData);

      return {
        lawyer,
        score: Math.round(totalScore),
        reasons,
        matchLevel: getMatchLevel(totalScore)
      };
    });

    // Sort by score descending
    return matchesWithScores.sort((a, b) => b.score - a.score);
  }, [caseData, lawyers]);

  return {
    matches,
    isLoading,
    topMatches: matches.slice(0, 5), // Top 5 recommendations
    excellentMatches: matches.filter(m => m.matchLevel === 'excellent'),
    goodMatches: matches.filter(m => m.matchLevel === 'good')
  };
};

export type { MatchResult, CaseData, LawyerData };