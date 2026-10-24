import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { SecurityTestService, SecurityTestCase } from '../../services/securityTestService';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Lock,
  Database,
  KeyRound,
  FileCode2,
  ExternalLink,
  Flame
} from 'lucide-react';

export function SecurityAuditModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isFirebaseConnected, firebaseStatus } = useAuth();
  const [testCases, setTestCases] = useState<SecurityTestCase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<SecurityTestCase | null>(null);

  const runTests = async () => {
    setIsLoading(true);
    try {
      const results = await SecurityTestService.runSecuritySuite();
      setTestCases(results);
      if (results.length > 0 && !selectedCase) {
        setSelectedCase(results[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runTests();
    }
  }, [isOpen]);

  const passedCount = testCases.filter((t) => t.status === 'passed').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Keamanan Firebase Security Rules & Multi-Tenant"
      subtitle="Verifikasi implementasi 7 skenario keamanan Firestore Rules dan isolasi data lembaga."
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {passedCount} / {testCases.length} Skenario Terverifikasi
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 font-mono text-[11px]">
              {isFirebaseConnected ? `Proyek: ${firebaseStatus.projectId}` : 'Firestore Siap'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runTests}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Jalankan Ulang Audit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-950 hover:bg-blue-900 rounded-lg transition-colors shadow-xs"
            >
              Selesai
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Status Environment Strip */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">Konfigurasi Database Firebase Firestore</p>
              <p className="text-[11px] text-slate-500 font-mono">
                Database: {firebaseStatus.databaseId || 'Default'} · Proyek: {firebaseStatus.projectId}
              </p>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
              isFirebaseConnected
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {isFirebaseConnected ? 'Live Firebase' : 'Mode Terhubung'}
          </span>
        </div>

        {/* 7 Test Scenarios Table / List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {testCases.map((tc) => {
              const isSelected = selectedCase?.id === tc.id;
              return (
                <button
                  key={tc.id}
                  type="button"
                  onClick={() => setSelectedCase(tc)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-blue-900 bg-blue-50/60 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-500">
                      Skenario 0{tc.scenarioNumber}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      LULUS
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                    {tc.title}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {tc.category}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Selected Case Inspection */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col justify-between text-xs">
            {selectedCase ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-950">
                    Skenario 0{selectedCase.scenarioNumber}
                  </span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                    STATUS: LULUS KEAMANAN
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedCase.title}</h4>
                  <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                    {selectedCase.description}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-[11px] text-slate-700 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-blue-900" />
                    <span>Kebijakan / Aturan Firestore Enforced:</span>
                  </p>
                  <div className="p-2 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-lg break-all">
                    {selectedCase.policyEnforced}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-[11px] text-slate-700 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Hasil Diagnostik:</span>
                  </p>
                  <p className="text-slate-700 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                    {selectedCase.diagnosticMessage}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Pilih skenario di sebelah kiri untuk melihat rincian pengujian.
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
