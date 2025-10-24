/**
 * DEPRECATED - Use BookingAdminNew2 instead
 */
import React from 'react';
import BookingAdminNew2 from './BookingAdminNew2';
import type { BookingAdminProps } from '../types';

const BookingAdmin: React.FC<BookingAdminProps> = (props) => {
  console.warn('BookingAdmin is deprecated. Use BookingAdminNew2 instead.');
  return <BookingAdminNew2 {...props} />;
};

export default BookingAdmin;
