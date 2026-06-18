import React, { useState, useEffect } from 'react';
import { CrewMember, Document, Contract, RoleType } from './types';
import { INITIAL_CREW, INITIAL_DOCUMENTS, INITIAL_CONTRACTS, VESSELS, RANKS } from './data';
import DashboardView from './components/DashboardView';
import ProfileVaultView from './components/ProfileVaultView';
import ContractGeneratorView from './components/ContractGeneratorView';
import { AnimatePresence, motion } from 'motion/react';
import { Anchor, ShieldAlert, Award, FileSpreadsheet, Lock, Sparkles, LogOut, CheckCircle, Clock, X } from 'lucide-react';
import { formatUSD, formatDate } from './utils';

export default function App() {
  // Global Role state: Crewer / Administrator vs Crewing Manager / Approver
  const [currentRole, setCurrentRole] = useState<RoleType>('Administrator');

  // Roster active view context
  // 'dashboard' = Screen 1 list & alerts Looker spec
  // 'vault' = Screen 2 deep dive & document upload
  // 'generator' = Screen 3 smart contract builder USD
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vault' | 'generator'>('dashboard');
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>('CR-09822');

  // Database lists backed by localStorage
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  // Contract Modal Reader Overlay
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);

  // Initialize and load from local storage
  useEffect(() => {
    const storedCrew = localStorage.getItem('cms_crew');
    const storedDocs = localStorage.getItem('cms_documents');
    const storedCons = localStorage.getItem('cms_contracts');

    if (storedCrew) {
      setCrew(JSON.parse(storedCrew));
    } else {
      setCrew(INITIAL_CREW);
      localStorage.setItem('cms_crew', JSON.stringify(INITIAL_CREW));
    }

    if (storedDocs) {
      setDocuments(JSON.parse(storedDocs));
    } else {
      setDocuments(INITIAL_DOCUMENTS);
      localStorage.setItem('cms_documents', JSON.stringify(INITIAL_DOCUMENTS));
    }

    if (storedCons) {
      setContracts(JSON.parse(storedCons));
    } else {
      setContracts(INITIAL_CONTRACTS);
      localStorage.setItem('cms_contracts', JSON.stringify(INITIAL_CONTRACTS));
    }
  }, []);

  // Sync state helpers to update localStorage
  const syncCrew = (updatedCrew: CrewMember[]) => {
    setCrew(updatedCrew);
    localStorage.setItem('cms_crew', JSON.stringify(updatedCrew));
  };

  const syncDocuments = (updatedDocs: Document[]) => {
    setDocuments(updatedDocs);
    localStorage.setItem('cms_documents', JSON.stringify(updatedDocs));
  };

  const syncContracts = (updatedCons: Contract[]) => {
    setContracts(updatedCons);
    localStorage.setItem('cms_contracts', JSON.stringify(updatedCons));
  };

  // Add a new crew seaman
  const handleAddCrew = (newMember: CrewMember) => {
    const updated = [newMember, ...crew];
    syncCrew(updated);
  };

  // Add document to seaman's vault
  const handleAddDocument = (newDoc: Document) => {
    const updated = [newDoc, ...documents];
    syncDocuments(updated);
  };

  // Update inline edited document
  const handleUpdateDocument = (updatedDoc: Document) => {
    const updated = documents.map(d => d.id === updatedDoc.id ? updatedDoc : d);
    syncDocuments(updated);
  };

  // Delete document from vault
  const handleDeleteDocument = (docId: string) => {
    const updated = documents.filter(d => d.id !== docId);
    syncDocuments(updated);
  };

  // Generate / Download dynamic contract
  const handleGenerateContract = (newContract: Contract) => {
    // 1. Add contract to database
    const contractExists = contracts.some(c => c.id === newContract.id);
    let updatedCons = [];
    if (contractExists) {
      updatedCons = contracts.map(c => c.id === newContract.id ? newContract : c);
    } else {
      updatedCons = [newContract, ...contracts];
    }
    syncContracts(updatedCons);

    // 2. Link seaman to contract
    const updatedCrew = crew.map(c => {
      if (c.id === newContract.crewId) {
        return {
          ...c,
          vesselId: newContract.vesselId,
          rankId: newContract.rankId,
          activeContractId: newContract.id
        };
      }
      return c;
    });
    syncCrew(updatedCrew);
  };

  // Switch status of crew seaman
  const handleUpdateMemberStatus = (memberId: string, status: 'Active' | 'Inactive') => {
    const updated = crew.map(c => c.id === memberId ? { ...c, status } : c);
    syncCrew(updated);
  };

  // Handler for deep linking
  const handleSelectCrewItem = (crewId: string) => {
    setSelectedCrewId(crewId);
    setActiveTab('vault');
  };

  const handleNavigateToContractBuilder = (crewId?: string) => {
    if (crewId) {
      setSelectedCrewId(crewId);
    }
    setActiveTab('generator');
  };

  // Selected crew member object
  const selectedMember = crew.find(c => c.id === selectedCrewId) || crew[0];

  return (
    <div className="min-h-screen bg-[#050507] text-[#e0e0e6] flex flex-col font-sans select-none antialiased relative overflow-x-hidden">
      {/* Radial Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.06),transparent_80%)] pointer-events-none"></div>

      {/* CMS Corporate Header */}
      <header className="h-16 border-b border-white/10 bg-[#0a0a0c] sticky top-0 z-40 shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Anchor size={16} />
            </span>
            <div>
              <h1 className="text-white font-extrabold font-display text-sm leading-tight tracking-tight uppercase italic">CMS.OS // CREW MANAGER</h1>
              <p className="text-[9px] text-white/45 font-mono uppercase tracking-widest mt-0.5">Maritime back-office port terminal</p>
            </div>
          </div>

          {/* Tab navigation switchers */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium h-full">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`h-16 px-1 transition-all duration-150 relative cursor-pointer flex items-center ${
                activeTab === 'dashboard' 
                  ? 'text-indigo-400 border-b-2 border-indigo-400 font-bold' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              📊 Executive Dashboard
            </button>
            <button
              onClick={() => {
                if (selectedMember) {
                  setActiveTab('vault');
                } else if (crew[0]) {
                  setSelectedCrewId(crew[0].id);
                  setActiveTab('vault');
                }
              }}
              className={`h-16 px-1 transition-all duration-150 relative cursor-pointer flex items-center ${
                activeTab === 'vault' 
                  ? 'text-indigo-400 border-b-2 border-indigo-400 font-bold' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              👤 Profiles & Vault
            </button>
            <button
              onClick={() => {
                if (selectedMember) {
                  setActiveTab('generator');
                } else if (crew[0]) {
                  setSelectedCrewId(crew[0].id);
                  setActiveTab('generator');
                }
              }}
              className={`h-16 px-1 transition-all duration-150 relative cursor-pointer flex items-center ${
                activeTab === 'generator' 
                  ? 'text-indigo-400 border-b-2 border-indigo-400 font-bold' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              📜 Smart Contract
            </button>
          </nav>

          {/* User Profile / Role switch trigger */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 text-xs text-left">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-white/70 font-mono italic">
                {currentRole === 'Administrator' ? 'system:admin_write' : 'system:review_read'}
              </span>
            </div>

            <button
              onClick={() => setCurrentRole(prev => prev === 'Administrator' ? 'Manager' : 'Administrator')}
              className={`cursor-pointer px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all duration-150 shadow-[0_0_15px_rgba(99,102,241,0.15)] flex items-center gap-1.5 ${
                currentRole === 'Administrator'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/50'
                  : 'bg-[#121216] text-white/70 border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              <Lock size={11} />
              ROLE_AUTH
            </button>
          </div>
        </div>
      </header>

      {/* Sub-Header view tabs for smaller viewports */}
      <div className="bg-[#0a0a0c] text-white/55 md:hidden flex justify-around border-b border-white/10 text-[11px] font-bold">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-3.5 flex-1 text-center border-b-2 transition-colors ${
            activeTab === 'dashboard' ? 'border-indigo-400 text-indigo-400 font-black' : 'border-transparent'
          }`}
        >
          Roster
        </button>
        <button
          onClick={() => {
            if (crew[0] && !selectedCrewId) setSelectedCrewId(crew[0].id);
            setActiveTab('vault');
          }}
          className={`py-3.5 flex-1 text-center border-b-2 transition-colors ${
            activeTab === 'vault' ? 'border-indigo-400 text-indigo-400 font-black' : 'border-transparent'
          }`}
        >
          Vault
        </button>
        <button
          onClick={() => setActiveTab('generator')}
          className={`py-3.5 flex-1 text-center border-b-2 transition-colors ${
            activeTab === 'generator' ? 'border-indigo-400 text-indigo-400 font-black' : 'border-transparent'
          }`}
        >
          Generator
        </button>
      </div>

      {/* Corporate Notification Banner if Manager mode */}
      {currentRole === 'Manager' && (
        <div className="bg-amber-500/10 text-amber-300 border-b border-amber-500/20 py-2.5 px-4 text-xs font-semibold flex items-center gap-2 justify-center backdrop-blur-xs">
          <ShieldAlert size={14} className="shrink-0 text-amber-400" />
          <span className="font-mono text-[11px] tracking-tight">READ_ONLY: Switch role to system:admin_write for full modification privileges on documents and contract generation.</span>
        </div>
      )}

      {/* Main Container Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <DashboardView
                crew={crew}
                documents={documents}
                contracts={contracts}
                onAddCrew={handleAddCrew}
                onSelectCrewItem={handleSelectCrewItem}
                onNavigateToContractBuilder={handleNavigateToContractBuilder}
                onViewContract={(c) => setViewingContract(c)}
              />
            </motion.div>
          ) : activeTab === 'vault' && selectedMember ? (
            <motion.div
              key="vault"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <ProfileVaultView
                member={selectedMember}
                documents={documents}
                contracts={contracts}
                onBack={() => setActiveTab('dashboard')}
                onAddDocument={(doc) => {
                  if (currentRole === 'Manager') {
                    alert('Denied: Switching to Administrator role is required to modify seaman artifacts.');
                    return;
                  }
                  handleAddDocument(doc);
                }}
                onUpdateDocument={(doc) => {
                  if (currentRole === 'Manager') {
                    alert('Denied: Switching to Administrator role is required to modify doc attributes.');
                    return;
                  }
                  handleUpdateDocument(doc);
                }}
                onDeleteDocument={(id) => {
                  if (currentRole === 'Manager') {
                    alert('Denied: Switching to Administrator role is required to modify records.');
                    return;
                  }
                  handleDeleteDocument(id);
                }}
                onUpdateMemberStatus={(id, status) => {
                  if (currentRole === 'Manager') {
                    alert('Denied: Switching to Administrator role is required to modify active flags.');
                    return;
                  }
                  handleUpdateMemberStatus(id, status);
                }}
              />
            </motion.div>
          ) : activeTab === 'generator' ? (
            <motion.div
              key="generator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <ContractGeneratorView
                crew={crew}
                contracts={contracts}
                initialSelectedCrewId={selectedCrewId}
                onGenerateContract={(contract) => {
                  if (currentRole === 'Manager') {
                    alert('Denied: Switch to Administrator role to lock contract values.');
                    return;
                  }
                  handleGenerateContract(contract);
                }}
                onBack={() => setActiveTab('dashboard')}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Global Contract Preview PDF Modal Overlay */}
      {viewingContract && (
        <div className="fixed inset-0 z-50 bg-[#050507]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f0f12] rounded-xl shadow-[0_0_50px_rgba(99,102,241,0.15)] border border-white/10 w-full max-w-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="p-4 bg-[#0a0a0c] text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-indigo-400 animate-pulse" />
                <h2 className="font-extrabold text-xs uppercase tracking-widest font-mono text-indigo-300">
                  SECURE COMPLIANCE REPOSITORY // DISPATCH_VIEW
                </h2>
              </div>
              <button 
                onClick={() => setViewingContract(null)} 
                className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 bg-[#050507]/60 flex flex-col items-center overflow-y-auto max-h-[75vh]">
              {/* Paper render of maritime contract dispatch */}
              <div className="w-full bg-white shadow-2xl border border-slate-300 rounded-lg p-8 font-mono text-[9px] text-slate-800 leading-relaxed text-left relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.035] -rotate-12">
                  <span className="text-5xl font-black tracking-widest text-[#0a0a0c] uppercase">VALID CONTRACT RECORD</span>
                </div>

                <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center">
                  <h4 className="text-xs font-bold tracking-widest text-slate-900 uppercase">MARITIME EMPLOYMENT CONTRACT DISPATCH</h4>
                  <p className="text-[7px] text-slate-400 mt-1">APPROVED SECURE CONTRACT FILE ID: {viewingContract.id.toUpperCase()}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4">
                  <div>
                    <span className="block text-[8px] text-slate-450 uppercase font-bold">Employer Representative</span>
                    <span className="text-slate-900 font-semibold text-[10px]">CMS SHIPPING LINE CO.</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-450 uppercase font-bold">Assigned Seaman</span>
                    <span className="text-slate-900 font-semibold text-[10px]">{crew.find(c => c.id === viewingContract.crewId)?.name || 'Crew Member'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-450 uppercase font-bold">Vessel Assigned</span>
                    <span className="text-slate-900 font-semibold text-[10px]">{VESSELS.find(v => v.id === viewingContract.vesselId)?.name || 'Vessel'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-450 uppercase font-bold">Rank Assigned</span>
                    <span className="text-slate-900 font-semibold text-[10px]">{RANKS.find(r => r.id === viewingContract.rankId)?.name || 'Rank'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-450 uppercase font-bold">Start Date</span>
                    <span className="text-slate-700 font-mono font-bold text-[10px]">{viewingContract.startDate}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-450 uppercase font-bold">End Date</span>
                    <span className="text-slate-700 font-mono font-bold text-[10px]">{viewingContract.endDate}</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 mb-6 space-y-2 text-[10px]">
                  <h5 className="font-bold text-slate-900 text-[8px] uppercase">WAGES CALCULATIONS (USD)</h5>
                  <p>In accordance with maritime compliance standards, the seaman is assigned with standard pay rates:</p>
                  <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-600 font-bold">
                    <li>Base wages: <strong>{formatUSD(viewingContract.baseWage)} / month</strong></li>
                    <li>Surcharge/allows risk allowances: <strong>{formatUSD(viewingContract.riskAllowance)}</strong></li>
                    <li>Loyalty seniority allowance: <strong>{formatUSD(viewingContract.loyaltyAllowance)}</strong></li>
                    <li className="text-slate-900 font-extrabold text-[11px] mt-1 pt-1 border-t border-slate-100">
                      Total earnings Monthly (locked rate): {formatUSD(viewingContract.totalMonthly)}
                    </li>
                  </ul>
                </div>

                <div className="border-t border-slate-150 pt-5 mt-6 flex justify-between items-center text-[8px] text-slate-400">
                  <span>SYSTEM AUTH KEY: MLC-SEC-{viewingContract.id.toUpperCase()}</span>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-250 font-bold mb-1 font-sans">
                    ✓ ACTIVE AND CONTRACT SIGNED
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/5 bg-[#0a0a0c] flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setViewingContract(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2 rounded-lg cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.35)] transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cyber Diagnostics StatusBar Footer */}
      <footer className="h-8 border-t border-white/10 bg-[#0a0a0c] flex items-center justify-between px-6 text-[9px] font-mono text-[#e0e0e6]/40 select-none shrink-0 relative mt-auto">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>CMS NODE: secure_active_channel_v2.6.1</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="px-1 py-0.2 rounded bg-white/5 text-[8px] border border-white/10">SSL</span>
            <span>ENCRYPTED DATABASE</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>CURRENCY: USD BASE ONLY</span>
          <span className="text-indigo-400 font-bold">TypeScript (Vite // React)</span>
          <span className="hidden md:inline">Line 445, Class CMS</span>
        </div>
      </footer>
    </div>
  );
}
