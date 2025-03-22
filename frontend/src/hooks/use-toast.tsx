import React, { useEffect, useState } from 'react';
import { ToastProvider } from 'react-hot-toast';

const useToast = () => {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 1500);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [toast]);

  const showToast = (message: string) => {
    setToast(message);
  };

  return (
    <ToastProvider
      duration={1500}
      swipeDirection="right"
      position="top-center"
    >
      {toast && (
        <div className="fixed top-0 left-0 right-0 p-4">
          <div className="bg-white rounded-lg shadow-lg p-4">
            {toast}
          </div>
        </div>
      )}
    </ToastProvider>
  );
};

export default useToast; 