import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Award, TrendingUp } from 'lucide-react';
import axios from 'axios';

const StatsSection = ({ t }) => {
  const [statsData, setStatsData] = useState({
    students: 120,
    courses: 15,
    instructors: 10,
    successRate: 92
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/stats');
        if (response.data.success) {
          setStatsData(response.data.stats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Keep default fallback values on error
      }
    };
    fetchStats();
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${Math.floor(num / 1000)}${num % 1000 === 0 ? ',000' : `,${num % 1000}`}+`;
    }
    return `${num}+`;
  };

  const stats = [
    {
      icon: Users,
      value: formatNumber(statsData.students),
      label: t('studentsCount'),
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900'
    },
    {
      icon: BookOpen,
      value: formatNumber(statsData.courses),
      label: t('coursesCount'),
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900'
    },
    {
      icon: Award,
      value: formatNumber(statsData.instructors),
      label: t('instructorsCount'),
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900'
    },
    {
      icon: TrendingUp,
      value: `${statsData.successRate}%`,
      label: t('successRate'),
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900'
    }
  ];

  return (
    <section className="py-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${stat.bgColor} mb-3`}>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
