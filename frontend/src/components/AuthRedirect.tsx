import React from 'react';

/**
 * AuthRedirect previously handled auto-redirect if user was authenticated,
 * but we now rely solely on PrivateRoute and the AuthContext for redirection.
 */
export const AuthRedirect: React.FC = () => {
  return null; // No-op
};
