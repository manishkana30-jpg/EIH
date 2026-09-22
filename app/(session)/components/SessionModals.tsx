"use client";

import React from "react";
import dynamic from "next/dynamic";

const GitaContemplationModal = dynamic(
  () => import("./GitaContemplationModal").then((m) => (m.GitaContemplationModal ? { default: m.GitaContemplationModal } : m)),
  { ssr: false }
);
const CBTKnowledgeModal = dynamic(
  () => import("./CBTKnowledgeModal").then((m) => (m.CBTKnowledgeModal ? { default: m.CBTKnowledgeModal } : m)),
  { ssr: false }
);
const PranayamaGuide = dynamic(
  () => import("./PranayamaGuide").then((m) => (m.PranayamaGuide ? { default: m.PranayamaGuide } : m)),
  { ssr: false }
);
const EncryptedHistoryModal = dynamic(
  () => import("./EncryptedHistoryModal").then((m) => (m.EncryptedHistoryModal ? { default: m.EncryptedHistoryModal } : m)),
  { ssr: false }
);
const CrisisModal = dynamic(
  () => import("./CrisisModal").then((m) => (m.CrisisModal ? { default: m.CrisisModal } : m)),
  { ssr: false }
);

export interface SessionModalsProps {
  isGitaModalOpen: boolean;
  onCloseGitaModal: () => void;
  userLocale: string;
  isCBTModalOpen: boolean;
  onCloseCBTModal: () => void;
  isPranayamaOpen: boolean;
  onClosePranayama: () => void;
  isHistoryOpen: boolean;
  onCloseHistory: () => void;
  isCrisisModalOpen: boolean;
  onCloseCrisisModal: () => void;
  activeCrisisData: any;
}

export const SessionModals: React.FC<SessionModalsProps> = ({
  isGitaModalOpen,
  onCloseGitaModal,
  userLocale,
  isCBTModalOpen,
  onCloseCBTModal,
  isPranayamaOpen,
  onClosePranayama,
  isHistoryOpen,
  onCloseHistory,
  isCrisisModalOpen,
  onCloseCrisisModal,
  activeCrisisData,
}) => {
  return (
    <>
      <GitaContemplationModal
        isOpen={isGitaModalOpen}
        onClose={onCloseGitaModal}
        userLocale={userLocale}
      />

      <CBTKnowledgeModal
        isOpen={isCBTModalOpen}
        onClose={onCloseCBTModal}
      />

      <PranayamaGuide
        isOpen={isPranayamaOpen}
        onClose={onClosePranayama}
      />

      <EncryptedHistoryModal
        isOpen={isHistoryOpen}
        onClose={onCloseHistory}
      />

      <CrisisModal
        isOpen={isCrisisModalOpen}
        crisisData={activeCrisisData}
        onClose={onCloseCrisisModal}
      />
    </>
  );
};

export default SessionModals;
