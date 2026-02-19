/**
 * Utility functions for text formatting and rendering
 */

/**
 * Convert text with URLs into clickable links and apply formatting
 * @param {string} text - The text to format
 * @param {string} className - Additional classes to apply
 * @returns {JSX.Element} Formatted text with clickable links
 */
export const renderFormattedText = (text, className = '') => {
  if (!text) return null;

  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Split text by URLs
  const parts = text.split(urlRegex);
  
  return (
    <div className={`formatted-text ${className}`}>
      {parts.map((part, index) => {
        // Check if this part is a URL
        if (urlRegex.test(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline break-all transition-colors"
            >
              {part}
            </a>
          );
        }
        // Regular text
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};

/**
 * Render content description with highlighting and clickable links
 * @param {string} description - The description text
 * @param {string} type - Content type (lecture, assignment, project, quiz)
 * @returns {JSX.Element} Formatted description
 */
export const renderContentDescription = (description, type = 'default') => {
  if (!description) return null;

  const typeColors = {
    lecture: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    assignment: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    project: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    quiz: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    default: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
  };

  const textColors = {
    lecture: 'text-blue-900 dark:text-blue-100',
    assignment: 'text-purple-900 dark:text-purple-100',
    project: 'text-green-900 dark:text-green-100',
    quiz: 'text-yellow-900 dark:text-yellow-100',
    default: 'text-indigo-900 dark:text-indigo-100'
  };

  const bgColor = typeColors[type] || typeColors.default;
  const textColor = textColors[type] || textColors.default;

  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = description.split(urlRegex);

  return (
    <div className={`p-4 rounded-lg border ${bgColor} ${textColor}`}>
      <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
        {parts.map((part, index) => {
          if (urlRegex.test(part)) {
            return (
              <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline break-all font-semibold transition-colors"
              >
                {part}
              </a>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    </div>
  );
};

/**
 * Convert plain text to formatted paragraphs
 * @param {string} text - The text to format
 * @returns {JSX.Element} Formatted paragraphs
 */
export const renderParagraphs = (text) => {
  if (!text) return null;

  const paragraphs = text.split('\n').filter(p => p.trim());
  
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="mb-2 last:mb-0">
          {renderFormattedText(paragraph)}
        </p>
      ))}
    </>
  );
};
