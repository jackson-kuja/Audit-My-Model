/**
 * Formats a date string into a human-readable format
 * @param dateString - ISO date string or timestamp
 * @returns Formatted date string
 */
export const formatDate = (dateString: string | number | Date): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}; 