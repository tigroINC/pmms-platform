"use client";

import HelpModal from "./HelpModal";
import { getCustomerManagementHelpSections } from "@/lib/help/customerManagementHelp";

interface CustomerManagementHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerManagementHelpModal({ isOpen, onClose }: CustomerManagementHelpModalProps) {
  const sections = getCustomerManagementHelpSections();

  return (
    <HelpModal
      isOpen={isOpen}
      onClose={onClose}
      title="고객사 관리 도움말"
      sections={sections}
    />
  );
}
