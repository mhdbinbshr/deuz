import React from 'react';

/**
 * Security codes and 2FA/recovery credentials must never be displayed on the website UI.
 * All password recovery and verification links are dispatched strictly to the user's email inbox via Firebase Authentication.
 */
export const SecurityNotificationBanner: React.FC = () => {
  return null;
};
