import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { ArrowRight, Award, Zap } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const HeroSlider = ({ onScrollToCourses, user, t }) => {
  const slides = [
    {
      id: 1,
      title: t('welcomeTitle'),
      subtitle: t('welcomeSubtitle'),
      image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1920&auto=format&fit=crop',
      fallbackGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      buttons: 'primary'
    },
    {
      id: 2,
      icon: Award,
      title: t('learnFromExperts'),
      subtitle: t('masterNewSkillsWithIndustryLeading'),
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1920&auto=format&fit=crop',
      fallbackGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      buttons: 'explore'
    },
    {
      id: 3,
      icon: Zap,
      title: t('advanceYourCareer'),
      subtitle: t('gainInDemandSkillsAndCertificates'),
      image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1920&auto=format&fit=crop',
      fallbackGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      buttons: user ? 'explore' : 'register'
    }
  ];

  return (
    <section className="relative h-[600px] md:h-[700px] overflow-hidden">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        effect="fade"
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop
        className="h-full w-full"
      >
        {slides.map((slide, index) => {
          const SlideIcon = slide.icon;
          const animationProps = index === 0 
            ? { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1, delay: 0.2 } }
            : index === 1
            ? { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 1 } }
            : { initial: { opacity: 0, x: -30 }, animate: { opacity: 1, x: 0 }, transition: { duration: 1 } };

          return (
            <SwiperSlide key={slide.id}>
              <div className="relative h-full w-full">
                {/* Background Image with Fallback */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ 
                    backgroundImage: `url('${slide.image}'), ${slide.fallbackGradient}` 
                  }}
                  onError={(e) => {
                    e.target.style.backgroundImage = slide.fallbackGradient;
                  }}
                />
                
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/40" />
                
                {/* Content */}
                <div className="relative h-full flex items-center justify-center">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div {...animationProps}>
                      {SlideIcon && <SlideIcon className="w-20 h-20 mx-auto mb-6 text-white" />}
                      
                      <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                        {slide.title}
                      </h1>
                      <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
                        {slide.subtitle}
                      </p>
                      
                      {/* Buttons */}
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {slide.buttons === 'primary' && user ? (
                          <Link
                            to={user.role === 'admin' ? '/admin' : user.role === 'instructor' ? '/instructor' : '/student'}
                            className="btn-primary bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all inline-flex items-center justify-center gap-2"
                          >
                            {t('dashboard')}
                          </Link>
                        ) : slide.buttons === 'primary' && !user ? (
                          <>
                            <Link
                              to="/register"
                              className="btn-primary bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all inline-flex items-center justify-center gap-2"
                            >
                              {t('getStarted')}
                            </Link>
                            <button
                              onClick={onScrollToCourses}
                              className="btn-outline border-2 border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-4 backdrop-blur-sm cursor-pointer inline-flex items-center justify-center gap-2"
                            >
                              {t('exploreCourses')}
                            </button>
                          </>
                        ) : slide.buttons === 'explore' ? (
                          <button
                            onClick={onScrollToCourses}
                            className="btn-primary bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-4 shadow-xl inline-flex items-center gap-2 cursor-pointer"
                          >
                            <span>{slide.id === 2 ? t('viewCourses') : t('exploreCourses')}</span>
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        ) : slide.buttons === 'register' ? (
                          <Link
                            to="/register"
                            className="btn-primary bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4 shadow-xl inline-flex items-center gap-2"
                          >
                            <span>{t('startLearningToday')}</span>
                            <ArrowRight className="w-5 h-5" />
                          </Link>
                        ) : null}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
};

export default HeroSlider;
