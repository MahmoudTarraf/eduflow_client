import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Search } from 'lucide-react';

const FAQ = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqCategories = [
    {
      category: t('general'),
      questions: [
        { question: t('faqQ1'), answer: t('faqA1') },
        { question: t('faqQ2'), answer: t('faqA2') },
        { question: t('faqQ3'), answer: t('faqA3') }
      ]
    },
    {
      category: t('coursesAndLearning'),
      questions: [
        { question: t('faqQ4'), answer: t('faqA4') },
        { question: t('faqQ5'), answer: t('faqA5') },
        { question: t('faqQ6'), answer: t('faqA6') },
        { question: t('faqQ7'), answer: t('faqA7') }
      ]
    },
    {
      category: t('paymentsAndRefunds'),
      questions: [
        { question: t('faqQ8'), answer: t('faqA8') },
        { question: t('faqQ9'), answer: t('faqA9') },
        { question: t('faqQ10'), answer: t('faqA10') },
        { question: t('faqQ11'), answer: t('faqA11') }
      ]
    },
    {
      category: t('forInstructors'),
      questions: [
        { question: t('faqQ12'), answer: t('faqA12') },
        { question: t('faqQ13'), answer: t('faqA13') },
        { question: t('faqQ14'), answer: t('faqA14') },
        { question: t('faqQ15'), answer: t('faqA15') }
      ]
    },
    {
      category: t('technicalSupport'),
      questions: [
        { question: t('faqQ16'), answer: t('faqA16') },
        { question: t('faqQ17'), answer: t('faqA17') },
        { question: t('faqQ18'), answer: t('faqA18') },
        { question: t('faqQ19'), answer: t('faqA19') }
      ]
    }
  ];

  const toggleQuestion = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              {t('frequentlyAskedQuestions')}
            </h1>
            <p className="text-xl text-indigo-100 mb-8">
              {t('findAnswersToCommonQuestions')}
            </p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder={t('searchQuestions')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 pl-14 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
              />
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">{t('noQuestionsFound')}</p>
          </div>
        ) : (
          filteredCategories.map((category, categoryIndex) => (
            <div key={category.category} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((faq, questionIndex) => {
                  const index = `${categoryIndex}-${questionIndex}`;
                  const isOpen = openIndex === index;

                  return (
                    <motion.div
                      key={questionIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: questionIndex * 0.05 }}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                    >
                      <button
                        onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <span className="font-semibold text-gray-900 dark:text-white pr-8">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform ${
                            isOpen ? 'transform rotate-180' : ''
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Contact Support */}
        <div className="mt-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('didntFindLookingFor')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('contactSupportTeam')}
          </p>
          <a
            href="/help"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            {t('contactSupport')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
