import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const PaymentMethods = () => {
  const { t } = useTranslation();

  const [providers, setProviders] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await axios.get('/api/admin/settings/public');
        const list = Array.isArray(res?.data?.data?.paymentProviders)
          ? res.data.data.paymentProviders
          : [];
        if (mounted) setProviders(list);
      } catch (_) {
        if (mounted) setProviders([]);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const payments = (Array.isArray(providers) && providers.length)
    ? providers.map((p) => ({
        name: p.name,
        src: p.imageUrl,
        fallback: 'https://via.placeholder.com/200x100/4F46E5/white?text=Payment'
      }))
    : [];

  if (!payments.length) return null;

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t('paymentMethodsTitle')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('choosePreferredPaymentMethod')}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {payments.map((method, index) => (
            <motion.div
              key={method.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03, y: -3 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col items-center group"
              aria-label={`Payment method: ${method.name}`}
            >
              <div className="w-full h-32 mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-inner">
                <img
                  src={method.src}
                  alt={method.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (e.currentTarget.dataset.fallbackApplied) return;
                    e.currentTarget.src = method.fallback;
                    e.currentTarget.dataset.fallbackApplied = 'true';
                  }}
                />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                {method.name}
              </h3>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default PaymentMethods;
