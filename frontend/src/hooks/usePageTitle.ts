import { useEffect } from 'react';

/**
 * Hook to set the page title in the format "Audit My File | [Page Name]"
 * @param pageTitle The specific page title to append after "Audit My File |"
 */
export const usePageTitle = (pageTitle: string): void => {
  useEffect(() => {
    // Set the document title
    const formattedTitle = pageTitle ? `Audit My File | ${pageTitle}` : 'Audit My File';
    document.title = formattedTitle;

    // Cleanup function to reset title when component unmounts (optional)
    return () => {
      document.title = 'Audit My File';
    };
  }, [pageTitle]); // Re-run effect if pageTitle changes
};
