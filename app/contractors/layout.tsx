/**
 * Contractors Layout - App Router Compatible
 * Includes sidebar navigation, header, and footer
 */

import { ContractorsLayoutClient } from './ContractorsLayoutClient';

export const metadata = {
  title: 'Contractors | FibreFlow',
  description: 'Contractor management system',
};

export default function ContractorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ContractorsLayoutClient>{children}</ContractorsLayoutClient>;
}
