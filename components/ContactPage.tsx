import React from 'react';
import { PrivateConciergePage } from './PrivateConciergePage';

interface ContactPageProps {
  onClose: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onClose }) => {
  return <PrivateConciergePage onClose={onClose} />;
};

export default ContactPage;
