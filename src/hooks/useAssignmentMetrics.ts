import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AssignmentMetrics {
  totalCases: number;
  assignedCases: number;
  unassignedCases: number;
  resolutionRate: number;
  averageResolutionTime: number;
  activeLawyers: number;
  overloadedLawyers: number;
  availableLawyers: number;
  weeklyAssignments: Array<{
    week: string;
    assignments: number;
  }>;
  topPerformingLawyers: Array<{
    id: string;
    name: string;
    resolvedCases: number;
    averageResolutionTime: number;
  }>;
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    count?: number;
  }>;
}

const fetchAssignmentMetrics = async (): Promise<AssignmentMetrics> => {
  try {
    // Get total cases
    const { data: totalCasesData, error: totalError } = await supabase
      .from('casos')
      .select('id, estado, created_at, fecha_cierre');

    if (totalError) throw totalError;

    const cases = (totalCasesData || []) as Array<{ id: string; estado: string; created_at: string; fecha_cierre?: string }>;
    const totalCases = cases.length;
    const assignedCases = cases.filter(c => c.estado === 'asignado').length;
    const unassignedCases = totalCases - assignedCases;

    // Calculate resolution rate
    const closedCases = cases.filter(c => c.estado === 'cerrado' && c.fecha_cierre).length;
    const resolutionRate = totalCases > 0 ? Math.round((closedCases / totalCases) * 100) : 0;

    // Calculate average resolution time (in days)
    const casesWithResolutionTime = cases.filter(c => c.fecha_cierre && c.created_at);
    const totalResolutionTime = casesWithResolutionTime.reduce((sum, caso) => {
      const created = new Date(caso.created_at);
      const closed = new Date(caso.fecha_cierre!);
      return sum + (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);
    const averageResolutionTime = casesWithResolutionTime.length > 0
      ? Math.round(totalResolutionTime / casesWithResolutionTime.length)
      : 0;

    // Get lawyer statistics
    const { data: lawyersData, error: lawyersError } = await supabase
      .from('profiles')
      .select('id, nombre, apellido, created_at')
      .eq('role', 'abogado');

    if (lawyersError) throw lawyersError;

    const lawyers = (lawyersData || []) as Array<{ id: string; nombre: string; apellido: string; created_at: string }>;
    const activeLawyers = lawyers.length;

    // Get assignment statistics
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('asignaciones_casos')
      .select('abogado_id, estado_asignacion, fecha_asignacion');

    if (assignmentsError) throw assignmentsError;

    const assignments = (assignmentsData || []) as Array<{ abogado_id: string; estado_asignacion: string; fecha_asignacion: string }>;

    // Calculate overloaded lawyers (more than 8 active cases)
    const lawyerWorkload = new Map<string, number>();
    assignments.forEach(assignment => {
      if (assignment.estado_asignacion === 'activa') {
        const current = lawyerWorkload.get(assignment.abogado_id) || 0;
        lawyerWorkload.set(assignment.abogado_id, current + 1);
      }
    });

    const overloadedLawyers = Array.from(lawyerWorkload.values()).filter(count => count > 8).length;
    const availableLawyers = activeLawyers - overloadedLawyers;

    // Weekly assignments (last 8 weeks)
    const weeklyAssignments = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekAssignments = assignments.filter(a => {
        const assignmentDate = new Date(a.fecha_asignacion);
        return assignmentDate >= weekStart && assignmentDate <= weekEnd;
      }).length;

      weeklyAssignments.push({
        week: `Semana ${8 - i}`,
        assignments: weekAssignments
      });
    }

    // Top performing lawyers (simplified - based on resolved cases)
    const lawyerPerformance = new Map<string, { resolved: number; totalTime: number; name: string }>();
    assignments.forEach(assignment => {
      const lawyer = lawyers.find(l => l.id === assignment.abogado_id);
      if (lawyer) {
        const current = lawyerPerformance.get(assignment.abogado_id) || {
          resolved: 0,
          totalTime: 0,
          name: `${lawyer.nombre} ${lawyer.apellido}`
        };
        // Simplified: assume all assignments are resolved for demo
        current.resolved += 1;
        lawyerPerformance.set(assignment.abogado_id, current);
      }
    });

    const topPerformingLawyers = Array.from(lawyerPerformance.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        resolvedCases: data.resolved,
        averageResolutionTime: data.totalTime > 0 ? Math.round(data.totalTime / data.resolved) : 0
      }))
      .sort((a, b) => b.resolvedCases - a.resolvedCases)
      .slice(0, 5);

    // Generate alerts
    const alerts = [];
    if (unassignedCases > 10) {
      alerts.push({
        type: 'error' as const,
        message: `${unassignedCases} casos sin asignar`,
        count: unassignedCases
      });
    }
    if (overloadedLawyers > 0) {
      alerts.push({
        type: 'warning' as const,
        message: `${overloadedLawyers} abogados sobrecargados`,
        count: overloadedLawyers
      });
    }
    if (resolutionRate < 70) {
      alerts.push({
        type: 'warning' as const,
        message: `Tasa de resolución baja: ${resolutionRate}%`
      });
    }

    return {
      totalCases,
      assignedCases,
      unassignedCases,
      resolutionRate,
      averageResolutionTime,
      activeLawyers,
      overloadedLawyers,
      availableLawyers,
      weeklyAssignments,
      topPerformingLawyers,
      alerts
    };
  } catch (error) {
    console.error('Error fetching assignment metrics:', error);
    throw new Error('Error al cargar métricas de asignación');
  }
};

export const useAssignmentMetrics = () => {
  return useQuery({
    queryKey: ['assignmentMetrics'],
    queryFn: fetchAssignmentMetrics,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

export type { AssignmentMetrics };