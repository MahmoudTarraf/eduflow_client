import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, Book, MessageCircle, Mail, Phone, HelpCircle, Video, FileText, Users, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import { helpArticles, helpCategories as categories } from './HelpData';

const Help = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedArticle, setExpandedArticle] = useState(null);
  const [filteredArticles, setFilteredArticles] = useState(helpArticles);
  const [platformEmail, setPlatformEmail] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const loadPublicSettings = async () => {
      try {
        const res = await axios.get('/api/admin/settings/public');
        if (res.data?.success && res.data.data) {
          setPlatformEmail(res.data.data.platformEmail || '');
        }
      } catch (error) {
        console.error('Error loading public settings:', error);
      }
    };

    loadPublicSettings();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [searchTerm, selectedCategory]);

  const filterArticles = () => {
    let filtered = helpArticles;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(article =>
        article.question.toLowerCase().includes(search) ||
        article.answer.toLowerCase().includes(search) ||
        article.tags.some(tag => tag.toLowerCase().includes(search)) ||
        article.category.toLowerCase().includes(search)
      );
    }

    setFilteredArticles(filtered);
  };

  const toggleArticle = (id) => {
    setExpandedArticle(expandedArticle === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <HelpCircle className="w-16 h-16 text-white mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">
              {t('helpCenterTitle')}
            </h1>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
              {t('findAnswersToCommonQuestions')}
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('searchHelp')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 pl-14 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
                />
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {searchTerm && (
                <p className="mt-2 text-center text-white">
                  Found {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-lg transition ${
              selectedCategory === 'All'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t('all')} ({helpArticles.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-lg transition ${
                selectedCategory === cat.name
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Help Articles */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('noResultsFound')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('tryDifferentKeywords')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
              >
                <button
                  onClick={() => toggleArticle(article.id)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {article.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {article.question}
                    </h3>
                  </div>
                  {expandedArticle === article.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0 ml-4" />
                  )}
                </button>
                
                {expandedArticle === article.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 pb-6"
                  >
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                          {article.answer}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {article.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}


      </div>

      {/* Contact Support */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            {t('stillNeedHelp')}
          </h2>
          <p className="text-indigo-100 mb-6">
            {t('ourSupportTeamIsHere')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href={platformEmail ? `mailto:${platformEmail}` : 'mailto:support@example.com'}
              className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition"
            >
              <Mail className="w-5 h-5 mr-2" />
              {t('emailSupport')}
            </a>
            <a
              href="/messages"
              className="inline-flex items-center px-6 py-3 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {t('messageAdmin')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
