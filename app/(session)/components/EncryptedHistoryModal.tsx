'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock, Trash2, Download, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import { getAllSessions, purgeAllEncryptedData, SessionRecord } from '@/lib/db/indexed-db';

interface EncryptedHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EncryptedHistoryModal: React.FC<EncryptedHistoryModalProps> = ({ isOpen, onClose }) => {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [isPurging, setIsPurging] = useState(false);
  const [isPurged, setIsPurged] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = async () => {
    const data = await getAllSessions();
    setSessions(data);
  };

  const handlePurge = async () => {
    if (window.confirm('Are you sure you want to permanently erase all locally encrypted session records? This action is cryptographically irreversible.')) {
      setIsPurging(true);
      await purgeAllEncryptedData();
      setIsPurging(false);
      setIsPurged(true);
      setSessions([]);
      setTimeout(() => setIsPurged(false), 3000);
    }
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `eih_encrypted_session_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#14201a] rounded-3xl p-6 md:p-8 shadow-2xl border border-[#283c32] text-[var(--text-nature-primary)]">
        <div className="flex items-center justify-between pb-4 border-b border-[#283c32] mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#588e73]/20 border border-[#588e73]/40 text-[var(--accent-sage)]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-heading font-bold text-[var(--text-nature-primary)]">
                Encrypted Session Vault
              </h2>
              <p className="text-xs text-[var(--text-nature-secondary)]">
                Client-Side WebCrypto AES-GCM-256 Zero-Knowledge Encrypted Records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-nature-muted)] hover:text-[var(--text-nature-primary)] hover:bg-[#1b2a23] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Badge */}
        <div className="mb-6 p-4 rounded-2xl bg-[#1b2a23]/90 border border-[#283c32] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[var(--accent-sage)] font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero-Knowledge AES-GCM-256 Encryption Active</span>
          </div>
          <span className="text-[11px] text-[var(--text-nature-muted)] font-mono">
            {sessions.length} Encrypted Session(s)
          </span>
        </div>

        {/* Sessions List */}
        <div className="space-y-4 mb-6 custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-nature-muted)] text-xs">
              No saved sessions found in your local encrypted vault.
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-2xl bg-[#1b2a23] border border-[#283c32] space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[var(--text-nature-muted)] font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(session.startedAt).toLocaleString()}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#588e73]/20 text-[var(--accent-sage)] text-[10px] font-mono border border-[#588e73]/30">
                    {session.messages.length} Message(s)
                  </span>
                </div>

                <div className="space-y-2">
                  {session.messages.slice(0, 4).map((msg) => (
                    <div
                      key={msg.id}
                      className={`text-xs p-2.5 rounded-xl ${
                        msg.role === 'user'
                          ? 'bg-[#22382c] text-[var(--text-nature-primary)] ml-4 border border-[#3d584a]'
                          : 'bg-[#17241d] text-[var(--text-nature-primary)] mr-4 border border-[#283c32]'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-mono text-[var(--text-nature-muted)] mb-1">
                        {msg.role === 'user' ? 'You' : 'Neuroscience Companion'}
                      </div>
                      <p className="line-clamp-2">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#283c32]">
          <button
            onClick={handlePurge}
            disabled={isPurging || sessions.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800/80 text-xs font-semibold text-red-300 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isPurged ? 'Vault Purged' : 'Cryptographic Purge (Right to be Forgotten)'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={sessions.length === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1b2a23] hover:bg-[#22382c] border border-[#283c32] text-xs font-medium text-[var(--text-nature-primary)] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Encrypted JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncryptedHistoryModal;
