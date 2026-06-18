import React, { useState, useEffect, useMemo } from 'react';
import { CrewMember, Vessel, RankPosition, Contract } from '../types';
import { VESSELS, RANKS } from '../data';
import { formatUSD, formatDate } from '../utils';
import { FileDown, Upload, Info, AlertCircle, Sparkles, Check, X, ArrowRight, Printer } from 'lucide-react';

interface ContractGeneratorViewProps {
  crew: CrewMember[];
  contracts: Contract[];
  initialSelectedCrewId?: string | null;
  onGenerateContract: (newContract: Contract) => void;
  onBack: () => void;
}

export default function ContractGeneratorView({
  crew,
  contracts,
  initialSelectedCrewId,
  onGenerateContract,
  onBack
}: ContractGeneratorViewProps) {
  // Navigation & Pre-fills
  const [selectedCrewId, setSelectedCrewId] = useState(initialSelectedCrewId || (crew[0]?.id || ''));
  const [selectedVesselId, setSelectedVesselId] = useState(VESSELS[0]?.id || '');
  const [selectedRankId, setSelectedRankId] = useState(RANKS[0]?.id || '');

  // Term dates defaults (Starts tomorrow, ends in 1 year)
  const defaultStartDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const defaultEndDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(defaultStartDate());
  const [endDate, setEndDate] = useState(defaultEndDate());

  // Post-generation state
  const [isGenerated, setIsGenerated] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<Contract | null>(null);

  // Archive physical contract drag zone state
  const [dragActive, setDragActive] = useState(false);
  const [archivedFileName, setArchivedFileName] = useState('');

  // Update dropdown fields if initialSelectedCrewId is provided
  useEffect(() => {
    if (initialSelectedCrewId) {
      setSelectedCrewId(initialSelectedCrewId);
      const member = crew.find(c => c.id === initialSelectedCrewId);
      if (member) {
        setSelectedVesselId(member.vesselId);
        setSelectedRankId(member.rankId);
      }
    }
  }, [initialSelectedCrewId, crew]);

  // Handle selected crew change
  const handleCrewChange = (crewId: string) => {
    setSelectedCrewId(crewId);
    const member = crew.find(c => c.id === crewId);
    if (member) {
      setSelectedVesselId(member.vesselId);
      setSelectedRankId(member.rankId);
    }
  };

  // Find referenced resources
  const selectedCrew = useMemo(() => crew.find(c => c.id === selectedCrewId), [crew, selectedCrewId]);
  const selectedVessel = useMemo(() => VESSELS.find(v => v.id === selectedVesselId), [selectedVesselId]);
  const selectedRank = useMemo(() => RANKS.find(r => r.id === selectedRankId), [selectedRankId]);

  // Determine if contract already exists
  const alreadyHasContract = useMemo(() => {
    if (!selectedCrew) return false;
    return !!selectedCrew.activeContractId;
  }, [selectedCrew]);

  // Dynamic Locked Financial Calculations based on Vessel + Rank position
  const financialBreakdown = useMemo(() => {
    if (!selectedRank || !selectedVessel) {
      return { base: 0, tankerRisk: 0, loyalty: 0, total: 0 };
    }
    
    // Mapped matrix: Base wage is rank-specific
    const base = selectedRank.baseWage;
    
    // Tanker Risk Premium is vessel-specific (applicable if Vessel Type is "Tanker", otherwise Cargo/Research is lower or custom)
    const risk = selectedVessel.riskAllowance;
    
    // Seniority Loyalty allowance is rank-specific
    const loyalty = selectedRank.loyaltyAllowance;
    
    const total = base + risk + loyalty;

    return { base, risk, loyalty, total };
  }, [selectedRank, selectedVessel]);

  // Submit Generation
  const triggerGeneration = () => {
    if (!selectedCrewId || !selectedVesselId || !selectedRankId) return;

    const contractId = `con-${selectedCrewId.toLowerCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newContract: Contract = {
      id: contractId,
      crewId: selectedCrewId,
      vesselId: selectedVesselId,
      rankId: selectedRankId,
      startDate,
      endDate,
      baseWage: financialBreakdown.base,
      riskAllowance: financialBreakdown.risk,
      loyaltyAllowance: financialBreakdown.loyalty,
      totalMonthly: financialBreakdown.total,
      generatedAt: new Date().toISOString()
    };

    setGeneratedContract(newContract);
    setIsGenerated(true);
    
    // Save to global state
    onGenerateContract(newContract);
  };

  // Drag and Drop scanned contract
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setArchivedFileName(file.name);
      
      // Update the contract in global state if we have a generated one
      if (generatedContract) {
        const updated = {
          ...generatedContract,
          signedDocUrl: '#',
          signedDocName: file.name
        };
        setGeneratedContract(updated);
        onGenerateContract(updated);
      }
    }
  };

  // Mock Printing browser PDF
  const triggerPrintContract = () => {
    window.print();
  };

  return (
    <div id="contract-generator-view" className="space-y-6">
      {/* Top action header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-xs border border-slate-100">
        <button
          onClick={onBack}
          className="text-slate-600 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          &larr; Back to Dashboard
        </button>
        
        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-150 p-1 px-2 rounded-md font-bold text-center">
          LOCK COMPLIANCE STANDARD
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-slate-100 overflow-hidden">
        {/* Step-by-step Panel */}
        <div className="p-5 border-b border-rose-100 bg-rose-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm tracking-tight">AUTOMATED SMART CONTRACT GENERATOR</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Strict Financial Controls & Display-Only Calculation Engine matched to the Vessel-Rank base matrix in USD.</p>
          </div>
          <p className="text-[10px] font-bold text-rose-700 font-mono">STEP-BY-STEP WORKFLOW</p>
        </div>

        <div className="p-6 space-y-6 text-xs">
          {/* STEP 1: RECIPIENT & ROUTING */}
          <div className="space-y-3.5">
            <h3 className="text-slate-900 font-bold text-[11px] uppercase tracking-wider flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white font-bold font-mono text-[10px]">1</span>
              STEP 1: RECIPIENT & ROUTING
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Select Crew Member dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1">Select Crew Member *</label>
                <select
                  value={selectedCrewId}
                  onChange={(e) => handleCrewChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-600 text-slate-800 cursor-pointer"
                  disabled={isGenerated}
                >
                  <option value="" disabled>-- Choose Seaman --</option>
                  {crew.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (#{c.id})</option>
                  ))}
                </select>

                {alreadyHasContract && !isGenerated && (
                  <p className="text-rose-600 font-semibold text-[10px] mt-1.5 flex items-center gap-1">
                    <AlertCircle size={10} /> Active contract already exists. Initiating template will overwrite draft.
                  </p>
                )}
              </div>

              {/* Assigned Vessel */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1">Assigned Vessel *</label>
                <select
                  value={selectedVesselId}
                  onChange={(e) => setSelectedVesselId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-600 text-slate-800 cursor-pointer"
                  disabled={isGenerated}
                >
                  {VESSELS.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.type})</option>
                  ))}
                </select>

                {selectedVessel && (
                  <p className="text-[10px] text-slate-400 font-medium font-mono mt-1.5 pl-1">
                    Flag: {selectedVessel.flag} / Type: {selectedVessel.type}
                  </p>
                )}
              </div>

              {/* Assigned Position / Rank */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1">Assigned Rank / Post *</label>
                <select
                  value={selectedRankId}
                  onChange={(e) => setSelectedRankId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-600 text-slate-800 cursor-pointer"
                  disabled={isGenerated}
                >
                  {RANKS.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* STEP 2: TERM DATES */}
          <div className="space-y-3.5 pt-4 border-t border-slate-100">
            <h3 className="text-slate-900 font-bold text-[11px] uppercase tracking-wider flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white font-bold font-mono text-[10px]">2</span>
              STEP 2: TERM DATES
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1">Contract Start Date *</label>
                <input
                  type="date"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium cursor-pointer"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value) {
                      const start = new Date(e.target.value);
                      start.setFullYear(start.getFullYear() + 1);
                      setEndDate(start.toISOString().split('T')[0]);
                    }
                  }}
                  disabled={isGenerated}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1">Contract End Date *</label>
                <input
                  type="date"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium cursor-pointer"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isGenerated}
                />
              </div>
            </div>
          </div>

          {/* STEP 3: FINANCIAL BREAKDOWN (LOCKED - USD BASE MATRIX VALUE) */}
          <div className="space-y-3.5 pt-4 border-t border-slate-100">
            <h3 className="text-slate-900 font-bold text-[11px] uppercase tracking-wider flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white font-bold font-mono text-[10px]">3</span>
              STEP 3: FINANCIAL BREAKDOWN (LOCKED - USD BASE MATRIX VALUE)
            </h3>

            <div className="bg-slate-50 rounded-xl border border-slate-150 overflow-hidden">
              <div className="p-3 bg-slate-100 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[10px] grid grid-cols-3">
                <span>Description</span>
                <span>Rate (USD / Fixed)</span>
                <span>Calculation Interval</span>
              </div>

              <div className="divide-y divide-slate-150 text-xs font-semibold text-slate-700">
                {/* Row 1: Base Wages */}
                <div className="p-3 py-4 grid grid-cols-3 items-center">
                  <span className="text-slate-900 font-bold">Base Monthly Wages (Standard Position Rate)</span>
                  <span className="font-mono text-slate-800 font-bold">{formatUSD(financialBreakdown.base)}</span>
                  <span className="text-slate-500 font-sans">Calendar Month</span>
                </div>

                {/* Row 2: Tanker Risk Allowance */}
                <div className="p-3 py-4 grid grid-cols-3 items-center">
                  <div>
                    <span className="text-slate-900 font-bold block">Tanker Risk Allowance</span>
                    <span className="text-[9px] text-slate-400 font-medium font-sans">Vessel Type: {selectedVessel?.type || 'N/A'}</span>
                  </div>
                  <span className="font-mono text-slate-800 font-bold">{formatUSD(financialBreakdown.risk)}</span>
                  <span className="text-slate-500 font-sans">Calendar Month</span>
                </div>

                {/* Row 3: Seniority Loyalty Allowance */}
                <div className="p-3 py-4 grid grid-cols-3 items-center">
                  <div>
                    <span className="text-slate-900 font-bold block">Seniority Loyalty Allowance</span>
                    <span className="text-[9px] text-slate-400 font-medium font-sans">Rank Premium</span>
                  </div>
                  <span className="font-mono text-slate-800 font-bold">{formatUSD(financialBreakdown.loyalty)}</span>
                  <span className="text-slate-500 font-sans">Calendar Month</span>
                </div>

                {/* Row 4: Total CALCULATED MO EARNINGS */}
                <div className="p-3.5 py-4 bg-slate-100 font-black grid grid-cols-3 items-center text-rose-850">
                  <span className="text-sm">CALCULATED TOTAL MONTHLY EARNINGS</span>
                  <span className="font-mono text-base">{formatUSD(financialBreakdown.total)}</span>
                  <span className="text-xs font-sans text-slate-600 font-semibold">Guaranteed Fixed Pay</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg flex items-start gap-2 text-[10px] font-semibold">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>[!] Standard values are locked in USD. No manual overrides, overrides adjustments, or ad-hoc entries are allowed during generation due to strict maritime back-office compliance standards.</span>
            </div>
          </div>

          {/* STEP 4: CONTRACT GENERATION & ARCHIVAL */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-slate-900 font-bold text-[11px] uppercase tracking-wider flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white font-bold font-mono text-[10px]">4</span>
              STEP 4: CONTRACT GENERATION & ARCHIVAL
            </h3>

            {!isGenerated ? (
              <button
                type="button"
                id="btn-generate-contract"
                onClick={triggerGeneration}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold p-3.5 rounded-xl transition-all duration-150 inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer text-xs"
              >
                <Sparkles size={16} /> [ GENERATE & DOWNLOAD FINAL PDF ]
              </button>
            ) : (
              <div className="space-y-6">
                {/* Instant generation success dialog */}
                <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-250 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="p-0.5 bg-emerald-600 text-white rounded-full shrink-0" size={16} />
                    <div>
                      <p className="font-bold">Compliance Contract Formulated Successfully!</p>
                      <p className="text-[10px] text-emerald-600 mt-0.5">The draft PDF contract is ready for physical print and wet-ink signing.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={triggerPrintContract}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 px-3 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Printer size={12} /> Print Draft
                    </button>
                    <button
                      onClick={() => setIsGenerated(false)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-1.5 px-2.5 rounded text-[10px] font-bold"
                    >
                      Reset form
                    </button>
                  </div>
                </div>

                {/* Simulated Final PDF Document Layout */}
                <div id="contract-pdf-preview" className="border border-slate-300 rounded-xl bg-slate-50 p-6 flex flex-col items-center">
                  <div className="w-full max-w-2xl bg-white shadow-xl border border-slate-200 rounded-lg p-8 font-mono text-[9px] text-slate-800 leading-relaxed text-left relative">
                    <div className="border-b-2 border-slate-900 pb-5 mb-5 text-center">
                      <h4 className="text-sm font-black tracking-widest text-slate-900 uppercase">MARITIME CREW EMPLOYMENT CONTRACT</h4>
                      <p className="text-[8px] text-slate-400 mt-1">ISSUED IN ACCORDANCE WITH MARITIME LABOUR CONVENTION (MLC) 2006</p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6">
                      <div>
                        <span className="block font-bold text-slate-400 text-[8px] uppercase">Employer Unit</span>
                        <span className="text-slate-900 font-semibold text-[10px]">CMS SHIPPING LINE CO.</span>
                      </div>
                      <div>
                        <span className="block font-bold text-slate-400 text-[8px] uppercase">Seaman Recipient</span>
                        <span className="text-slate-900 font-semibold text-[10px]">{selectedCrew?.name || '---'}</span>
                      </div>
                      <div>
                        <span className="block font-bold text-slate-400 text-[8px] uppercase">Assigned Vessel</span>
                        <span className="text-slate-900 font-semibold text-[10px]">{selectedVessel?.name || '---'}</span>
                      </div>
                      <div>
                        <span className="block font-bold text-slate-400 text-[8px] uppercase">Assigned Rank</span>
                        <span className="text-slate-900 font-semibold text-[10px]">{selectedRank?.name || '---'}</span>
                      </div>
                      <div>
                        <span className="block font-bold text-slate-400 text-[8px] uppercase">Contract Commencement</span>
                        <span className="text-slate-900 font-semibold text-[10px]">{startDate}</span>
                      </div>
                      <div>
                        <span className="block font-bold text-slate-400 text-[8px] uppercase">Contract Termination</span>
                        <span className="text-slate-900 font-semibold text-[10px]">{endDate}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-3 mb-6 space-y-2">
                      <h5 className="font-bold text-slate-900 text-[8px] uppercase tracking-wide">ARTICLE III: FINANCIAL COMPENSATIONS (USD FIXED)</h5>
                      <p>The Seaman shall receive a fixed base monthly salary of <strong>{formatUSD(financialBreakdown.base)}</strong> plus of <strong>{formatUSD(financialBreakdown.risk)}</strong> risk premium representing risk factors elements with <strong>{formatUSD(financialBreakdown.loyalty)}</strong> seniority loyalty allowances.</p>
                      <p>The combined wages resulting in a locked guaranteed pay rate of <strong>{formatUSD(financialBreakdown.total)}</strong> per calendar month. This wage represents contract binding agreements.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-100 mt-12 text-slate-400">
                      <div className="border-t border-dashed border-slate-350 pt-1 text-center">
                        <span>Representative of the Employer</span>
                        <span className="block mt-4 text-[10px] text-slate-800 font-bold font-sans">MIRA QUINONES</span>
                        <span className="block text-[7px] text-slate-400 font-medium">CMS CREWING MANAGER</span>
                      </div>
                      <div className="border-t border-dashed border-slate-350 pt-1 text-center">
                        <span>Seaman Recipient Signature</span>
                        <span className="block mt-8 text-[7px] text-slate-450 italic">WET INK SIGNATURE REQUIRED</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wet Ink Signature Archiving Upload Slot */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                    Physical Archiving (Post Wet-Ink Signing)
                  </label>
                  
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                      dragActive 
                        ? 'border-emerald-600 bg-emerald-50/20' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <Upload className="mx-auto text-slate-400 mb-2" size={20} />
                    {archivedFileName ? (
                      <div>
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-250 text-[10px]">
                          ✓ ARCHIVED SUCCESSFUL: {archivedFileName}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">Wet-ink signed PDF has been matched and archived in the seaman's profile vault.</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-slate-700">Drag and Drop Scanned Wet-Ink Contract Here</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Simulate scanning by dropping any sample PDF or PNG file (or click file browser)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
