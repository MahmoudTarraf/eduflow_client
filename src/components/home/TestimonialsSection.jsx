import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const TestimonialsSection = ({ ratings, t }) => {
  const visibleRatings = useMemo(() => {
    if (!Array.isArray(ratings)) return [];
    return ratings;
  }, [ratings]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

  useEffect(() => {
    if (visibleRatings.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % visibleRatings.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [visibleRatings.length]);

  const goToPrevious = () => {
    if (visibleRatings.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + visibleRatings.length) % visibleRatings.length);
  };

  const goToNext = () => {
    if (visibleRatings.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % visibleRatings.length);
  };

  if (!visibleRatings || visibleRatings.length === 0) return null;

  const dir = document?.documentElement?.dir || 'ltr';
  const isRTL = dir === 'rtl';

  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const endX = (e.changedTouches && e.changedTouches[0]?.clientX) || touchStartX;
    const deltaX = endX - touchStartX;
    const threshold = 40;

    if (Math.abs(deltaX) > threshold) {
      if (isRTL) {
        if (deltaX > 0) {
          goToNext();
        } else {
          goToPrevious();
        }
      } else {
        if (deltaX < 0) {
          goToNext();
        } else {
          goToPrevious();
        }
      }
    }

    setTouchStartX(null);
  };

  return (
    <section className="py-16 bg-neutral-100 dark:bg-gray-800" dir={dir}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-700 dark:text-white mb-4">
            {t('whatOurStudentsSay')}
          </h2>
          <p className="text-lg text-neutral-500 dark:text-gray-400 max-w-2xl mx-auto">
            {t('testimonialDescription')}
          </p>
        </motion.div>

        <div
          className="relative max-w-4xl mx-auto"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {visibleRatings.length > 1 && (
            <>
              <button
                type="button"
                onClick={isRTL ? goToNext : goToPrevious}
                className={`hidden sm:flex items-center justify-center w-9 h-9 rounded-full shadow-md bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 absolute top-1/2 -translate-y-1/2 ${
                  isRTL ? 'right-0 -mr-4' : 'left-0 -ml-4'
                }`}
                aria-label={isRTL ? t('nextTestimonial') || 'Next testimonial' : t('previousTestimonial') || 'Previous testimonial'}
              >
                {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={isRTL ? goToPrevious : goToNext}
                className={`hidden sm:flex items-center justify-center w-9 h-9 rounded-full shadow-md bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 absolute top-1/2 -translate-y-1/2 ${
                  isRTL ? 'left-0 -ml-4' : 'right-0 -mr-4'
                }`}
                aria-label={isRTL ? t('previousTestimonial') || 'Previous testimonial' : t('nextTestimonial') || 'Next testimonial'}
              >
                {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </>
          )}

          <AnimatePresence initial={false} custom={activeIndex}>
            {visibleRatings.map((rating, index) =>
              index === activeIndex ? (
                <motion.div
                  key={rating._id}
                  custom={activeIndex}
                  initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRTL ? -40 : 40 }}
                  transition={{ duration: 0.4 }}
                  className={`card relative ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  <Quote className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} w-8 h-8 text-primary-200 dark:text-primary-900 opacity-50`} />

                  <div className={`flex items-center gap-1 mb-3 ${isRTL ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < rating.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-neutral-600 dark:text-gray-300 mb-4 italic">
                    "{rating.review}"
                  </p>

                 <div className={`flex items-center gap-3 ${isRTL ? 'text-right' : 'text-left'}`}>

                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
                      {rating.student?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="font-semibold text-neutral-700 dark:text-white">
                        {rating.student?.name}
                      </p>
                      {rating.course?.name && (
                        <p className="text-sm text-neutral-500 dark:text-gray-400">
                          {rating.course.name}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>

          {visibleRatings.length > 1 && (
            <div className={`mt-6 flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {visibleRatings.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    index === activeIndex
                      ? 'bg-primary-600 dark:bg-primary-400'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
