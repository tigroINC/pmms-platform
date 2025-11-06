"use client";

import { useSession } from "next-auth/react";
import HelpModal from "./HelpModal";
import { getCommunicationHelpSections } from "@/lib/help/communicationHelp";
import { getCustomerCommunicationHelpSections } from "@/lib/help/customerCommunicationHelp";

interface CommunicationHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommunicationHelpModal({ isOpen, onClose }: CommunicationHelpModalProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isCustomer = user?.role === "CUSTOMER_ADMIN" || user?.role === "CUSTOMER_USER";

  const sections = isCustomer 
    ? getCustomerCommunicationHelpSections() 
    : getCommunicationHelpSections();

  const title = isCustomer 
    ? "문의/요청 도움말" 
    : "커뮤니케이션 도움말";

  return (
    <HelpModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      sections={sections}
    />
  );
}
