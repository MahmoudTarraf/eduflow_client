import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { 
  GraduationCap, 
  Award, 
  Users, 
  TrendingUp, 
  Clock, 
  Globe,
  BookOpen,
  Target
} from 'lucide-react';

const AnimatedFeatures = ({ t }) => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const controls = useAnimation();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const features = [
    {
      icon: GraduationCap,
      title: t('expertInstructors'),
      description: t('learnFromIndustryExperts'),
      color: 'from-blue-500 to-cyan-500',
      delay: 0.1
    },
    {
      icon: Award,
      title: t('certificatesAwarded'),
      description: t('earnRecognizedCertificates'),
      color: 'from-purple-500 to-pink-500',
      delay: 0.2
    },
    {
      icon: Users,
      title: t('interactiveLearning'),
      description: t('engageWithPeers'),
      color: 'from-green-500 to-emerald-500',
      delay: 0.3
    },
    {
      icon: TrendingUp,
      title: t('careerGrowth'),
      description: t('advanceYourCareerPath'),
      color: 'from-orange-500 to-red-500',
      delay: 0.4
    },
    {
      icon: Clock,
      title: t('flexibleSchedule'),
      description: t('learnAtYourOwnPace'),
      color: 'from-indigo-500 to-blue-500',
      delay: 0.5
    },
    {
      icon: Globe,
      title: t('globalCommunity'),
      description: t('joinLearnersWorldwide'),
      color: 'from-teal-500 to-cyan-500',
      delay: 0.6
    },
    {
      icon: BookOpen,
      title: t('richContent'),
      description: t('accessComprehensiveMaterials'),
      color: 'from-yellow-500 to-orange-500',
      delay: 0.7
    },
    {
      icon: Target,
      title: t('goalOriented'),
      description: t('achieveYourLearningGoals'),
      color: 'from-rose-500 to-pink-500',
      delay: 0.8
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <section 
      ref={containerRef}
      className="relative py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.03, 0.05, 0.03]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.03, 0.05, 0.03]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500 to-cyan-500 rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            animate={floatingAnimation}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          
          <h2 className="font-fun text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t('whyChooseUs')}
          </h2>
          <p className="font-fun text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('discoverBenefits')}
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={controls}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredIndex === index;
            
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
                className="group relative"
              >
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative h-full p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  {/* Gradient Background on Hover */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: isHovered ? 0.1 : 0,
                      scale: isHovered ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color}`}
                  />

                  {/* Icon Container */}
                  <motion.div
                    animate={{
                      rotate: isHovered ? [0, -10, 10, -10, 0] : 0
                    }}
                    transition={{ duration: 0.5 }}
                    className="relative mb-4"
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-md`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </motion.div>

                  {/* Content */}
                  <div className="relative">
                    <h3 className="font-fun text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="font-fun text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Animated Accent Line */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isHovered ? '100%' : 0 }}
                    transition={{ duration: 0.3 }}
                    className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.color}`}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-center mt-16"
        >
          <motion.p
            animate={{
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="font-fun text-lg text-gray-700 dark:text-gray-300 font-medium"
          >
            ✨ {t('joinThousandsOfLearners')}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default AnimatedFeatures;
