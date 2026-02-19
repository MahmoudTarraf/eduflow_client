// Help Center Data - Questions and Answers
// Import i18n to access translation function
import i18n from '../../i18n';

// Helper function to get translations
const t = (key) => i18n.t(key);

export const helpArticles = [
  // Getting Started
  {
    id: 1,
    get category() { return t('gettingStarted'); },
    get question() { return t('helpQ1'); },
    get answer() { return t('helpA1'); },
    get tags() { return [t('account'), t('register'), t('signup'), t('gettingStarted')]; }
  },
  {
    id: 2,
    get category() { return t('gettingStarted'); },
    get question() { return t('helpQ2'); },
    get answer() { return t('helpA2'); },
    get tags() { return [t('enroll'), t('courses'), t('registration'), t('payment'), t('sections')]; }
  },
  {
    id: 3,
    get category() { return t('gettingStarted'); },
    get question() { return t('helpQ3'); },
    get answer() { return t('helpA3'); },
    get tags() { return [t('navigation'), t('dashboard'), t('menu'), t('browse')]; }
  },
  {
    id: 4,
    get category() { return t('gettingStarted'); },
    get question() { return t('helpQ4'); },
    get answer() { return t('helpA4'); },
    get tags() { return [t('profile'), t('settings'), t('avatar'), t('update'), t('photo')]; }
  },

  // Courses & Learning
  {
    id: 5,
    get category() { return t('coursesAndLearning'); },
    get question() { return t('helpQ5'); },
    get answer() { return t('helpA5'); },
    get tags() { return [t('content'), t('access'), t('videos'), t('lectures'), t('materials')]; }
  },
  {
    id: 6,
    get category() { return t('coursesAndLearning'); },
    get question() { return t('helpQ6'); },
    get answer() { return t('helpA6'); },
    get tags() { return [t('progress'), t('tracking'), t('completion'), t('grades'), t('status')]; }
  },
  {
    id: 7,
    get category() { return t('coursesAndLearning'); },
    get question() { return t('helpQ7'); },
    get answer() { return t('helpA7'); },
    get tags() { return [t('assignment'), t('submit'), t('upload'), 'rar', t('homework')]; }
  },
  {
    id: 8,
    get category() { return t('coursesAndLearning'); },
    get question() { return t('helpQ8'); },
    get answer() { return t('helpA8'); },
    get tags() { return [t('download'), t('materials'), t('files'), t('resources'), t('content')]; }
  },

  // Instructors
  {
    id: 9,
    get category() { return t('instructors'); },
    get question() { return t('helpQ9'); },
    get answer() { return t('helpA9'); },
    get tags() { return [t('instructor'), t('teacher'), t('apply'), t('become'), t('registration')]; }
  },
  {
    id: 10,
    get category() { return t('instructors'); },
    get question() { return t('helpQ10'); },
    get answer() { return t('helpA10'); },
    get tags() { return [t('create'), t('course'), t('instructor'), t('setup'), t('upload')]; }
  },
  {
    id: 11,
    get category() { return t('instructors'); },
    get question() { return t('helpQ11'); },
    get answer() { return t('helpA11'); },
    get tags() { return [t('students'), t('manage'), t('enrollment'), t('monitor'), t('communication')]; }
  },
  {
    id: 12,
    get category() { return t('instructors'); },
    get question() { return t('helpQ12'); },
    get answer() { return t('helpA12'); },
    get tags() { return [t('grading'), t('assignments'), t('evaluation'), t('feedback'), t('marks')]; }
  },

  // Payments & Billing
  {
    id: 13,
    get category() { return t('paymentsAndBilling'); },
    get question() { return t('helpQ13'); },
    get answer() { return t('helpA13'); },
    get tags() { return [t('payment'), t('method'), t('bank'), t('transfer'), t('receipt'), t('pay')]; }
  },
  {
    id: 14,
    get category() { return t('paymentsAndBilling'); },
    get question() { return t('helpQ14'); },
    get answer() { return t('helpA14'); },
    get tags() { return [t('refund'), t('moneyBack'), t('return'), t('policy'), t('cancellation')]; }
  },
  {
    id: 15,
    get category() { return t('paymentsAndBilling'); },
    get question() { return t('helpQ15'); },
    get answer() { return t('helpA15'); },
    get tags() { return [t('receipt'), t('verification'), t('approval'), t('payment'), t('proof')]; }
  },
  {
    id: 16,
    get category() { return t('paymentsAndBilling'); },
    get question() { return t('helpQ16'); },
    get answer() { return t('helpA16'); },
    get tags() { return [t('payment'), t('issues'), t('problems'), t('help'), t('stuck'), t('error')]; }
  }
];

export const helpCategories = [
  {
    get name() { return t('gettingStarted'); },
    count: 4,
    icon: 'Book'
  },
  {
    get name() { return t('coursesAndLearning'); },
    count: 4,
    icon: 'Video'
  },
  {
    get name() { return t('instructors'); },
    count: 4,
    icon: 'Users'
  },
  {
    get name() { return t('paymentsAndBilling'); },
    count: 4,
    icon: 'FileText'
  }
];
