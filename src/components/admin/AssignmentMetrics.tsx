import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Clock,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AssignmentMetricsProps {
  metrics?: {
    totalCases?: number;
    assignedCases?: number;
    availableLawyers?: number;
    averageResolutionTime?: number;
    successRate?: number;
  };
}

const AssignmentMetrics: React.FC<AssignmentMetricsProps> = ({ metrics }) => {
  const stats = [
    {
      title: 'Casos Totales',
      value: metrics?.totalCases || 0,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Casos Asignados',
      value: metrics?.assignedCases || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Abogados Activos',
      value: metrics?.availableLawyers || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Tasa de Éxito',
      value: `${metrics?.successRate || 0}%`,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default AssignmentMetrics;