import React, { useState, useMemo } from 'react';
import { CrewMember, Vessel, RankPosition, Document, Contract } from '../types';
import { VESSELS, RANKS, getDocumentStatus } from '../data';
import { Search, Plus, Eye, FileText, AlertTriangle, CheckCircle, Clock, X, ChevronLeft, ChevronRight, User } from 'lucide-react';

interface DashboardViewProps {
  crew: CrewMember[];
  documents: Document[];
  contracts: Contract[];
  onAddCrew: (newCrew: CrewMember) => void;
  onSelectCrewItem: (crewId: string) => void;
  onNavigateToContractBuilder: (crewId?: string) => void;
  onViewContract: (contract: Contract) => void;
}

export default function DashboardView({
  crew,
  documents,
  contracts,
  onAddCrew,
  onSelectCrewItem,
  onNavigateToContractBuilder,
  onViewContract
}: DashboardViewProps) {
  // Filters state
  const [selectedVesselFilter, setSelectedVesselFilter] = useState<string>('all');
  const [selectedRankFilter, setSelectedRankFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Interactive scorecard filter
  // Can be null, or '<30', '30-60', '60-90'
  const [scorecardFilter, setScorecardFilter] = useState<string | null>(null);

  // Add Crew Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCrewName, setNewCrewName] = useState('');
  const [newCrewEmail, setNewCrewEmail] = useState('');
  const [newCrewRank, setNewCrewRank] = useState(RANKS[0]?.id || '');
  const [newCrewVessel, setNewCrewVessel] = useState(VESSELS[0]?.id || '');
  const [newCrewBank, setNewCrewBank] = useState('');
  const [newCrewNok, setNewCrewNok] = useState('');
  const [newCrewSeaService, setNewCrewSeaService] = useState('1 Year');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Compute document status for all crew members
  const crewStatusMap = useMemo(() => {
    const map: { [crewId: string]: { worstStatus: string; worstDocLabel: string; worstDaysLeft: number; counts: { c30: number; c30_60: number; c60_90: number } } } = {};
    
    crew.forEach(c => {
      const crewDocs = documents.filter(doc => doc.crewId === c.id);
      let worstLabel: 'VALID' | 'WARNING (<90 days)' | 'CRITICAL (<30 days)' | 'EXPIRED' = 'VALID';
      let worstDocName = '';
      let worstDays = Infinity;
      
      let c30 = 0;
      let c30_60 = 0;
      let c60_90 = 0;

      crewDocs.forEach(d => {
        const { label, daysLeft } = getDocumentStatus(d.expiryDate);
        
        if (label === 'EXPIRED') {
          c30++; // expired is in critical/danger
          if (worstLabel !== 'EXPIRED') {
            worstLabel = 'EXPIRED';
            worstDocName = d.name;
            worstDays = daysLeft;
          }
        } else if (label === 'CRITICAL (<30 days)') {
          c30++;
          if (worstLabel !== 'EXPIRED' && worstLabel !== 'CRITICAL (<30 days)') {
            worstLabel = 'CRITICAL (<30 days)';
            worstDocName = d.name;
            worstDays = daysLeft;
          }
        } else if (label === 'WARNING (<90 days)') {
          // Check if it is 30-60 or 60-90
          if (daysLeft <= 60) {
            c30_60++;
            if (worstLabel === 'VALID' || worstLabel === 'WARNING (<90 days)') {
              worstLabel = 'WARNING (<90 days)';
              worstDocName = d.name;
              worstDays = daysLeft;
            }
          } else {
            c60_90++;
            if (worstLabel === 'VALID' || (worstLabel === 'WARNING (<90 days)' && worstDays > daysLeft)) {
              worstLabel = 'WARNING (<90 days)';
              worstDocName = d.name;
              worstDays = daysLeft;
            }
          }
        }
      });

      map[c.id] = {
        worstStatus: worstLabel,
        worstDocLabel: worstDocName,
        worstDaysLeft: worstDays,
        counts: { c30, c30_60, c60_90 }
      };
    });

    return map;
  }, [crew, documents]);

  // Expiry Alert scorecard counts (overall across all documents)
  const scorecardCounts = useMemo(() => {
    let c30 = 0;
    let c30_60 = 0;
    let c60_90 = 0;

    documents.forEach(doc => {
      const { label, daysLeft } = getDocumentStatus(doc.expiryDate);
      if (label === 'EXPIRED' || label === 'CRITICAL (<30 days)') {
        c30++;
      } else if (label === 'WARNING (<90 days)' && daysLeft <= 60) {
        c30_60++;
      } else if (label === 'WARNING (<90 days)' && daysLeft > 60 && daysLeft <= 90) {
        c60_90++;
      }
    });

    return { c30, c30_60, c60_90 };
  }, [documents]);

  // Handle Scorecard Clicking (Interactive Filters)
  const handleScorecardClick = (filterType: string) => {
    if (scorecardFilter === filterType) {
      setScorecardFilter(null); // toggle off
    } else {
      setScorecardFilter(filterType);
      // clear other filters that might conflict
      setSelectedStatusFilter('all');
    }
    setCurrentPage(1);
  };

  // Filter & Search Crew List
  const filteredCrew = useMemo(() => {
    return crew.filter(member => {
      // 1. Vessel filter
      if (selectedVesselFilter !== 'all' && member.vesselId !== selectedVesselFilter) {
        return false;
      }
      
      // 2. Rank filter
      if (selectedRankFilter !== 'all' && member.rankId !== selectedRankFilter) {
        return false;
      }

      const crewStatus = crewStatusMap[member.id];

      // 3. Document status filter (Global Filter)
      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'Expired' && crewStatus?.worstStatus !== 'EXPIRED') {
          return false;
        }
        if (selectedStatusFilter === 'Expiring Soon' && crewStatus?.worstStatus !== 'CRITICAL (<30 days)' && crewStatus?.worstStatus !== 'WARNING (<90 days)') {
          return false;
        }
        if (selectedStatusFilter === 'Valid' && crewStatus?.worstStatus !== 'VALID') {
          return false;
        }
      }

      // 4. Interactive scorecard filter
      if (scorecardFilter) {
        const crewDocs = documents.filter(d => d.crewId === member.id);
        const hasMatchingDoc = crewDocs.some(d => {
          const { label, daysLeft } = getDocumentStatus(d.expiryDate);
          if (scorecardFilter === '<30') {
            return label === 'EXPIRED' || label === 'CRITICAL (<30 days)';
          }
          if (scorecardFilter === '30-60') {
            return label === 'WARNING (<90 days)' && daysLeft <= 60;
          }
          if (scorecardFilter === '60-90') {
            return label === 'WARNING (<90 days)' && daysLeft > 60 && daysLeft <= 90;
          }
          return false;
        });
        if (!hasMatchingDoc) return false;
      }

      // 5. Search Text Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        
        // Match name
        const matchesName = member.name.toLowerCase().includes(query);
        
        // Match document number
        const crewDocs = documents.filter(d => d.crewId === member.id);
        const matchesDocNo = crewDocs.some(d => d.number.toLowerCase().includes(query));

        if (!matchesName && !matchesDocNo) {
          return false;
        }
      }

      return true;
    });
  }, [crew, selectedVesselFilter, selectedRankFilter, selectedStatusFilter, scorecardFilter, searchQuery, crewStatusMap, documents]);

  // Paginated Crew list
  const totalItems = filteredCrew.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedCrew = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCrew.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCrew, currentPage]);

  const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  // Form submit handler
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrewName || !newCrewEmail) return;

    const generatedId = `CR-098${Math.floor(10 + Math.random() * 90)}`;
    const newMember: CrewMember = {
      id: generatedId,
      name: newCrewName,
      email: newCrewEmail,
      rankId: newCrewRank,
      vesselId: newCrewVessel,
      bankAccount: newCrewBank || '****xxxx (Not Configured)',
      nextOfKin: newCrewNok || 'Not Specified',
      seaServiceHistory: newCrewSeaService || '1 Year',
      medicalClearanceStatus: 'Valid',
      status: 'Active',
      activeContractId: null
    };

    onAddCrew(newMember);

    // Reset fields
    setNewCrewName('');
    setNewCrewEmail('');
    setNewCrewBank('');
    setNewCrewNok('');
    setNewCrewSeaService('1 Year');
    setIsAddModalOpen(false);
  };

  return (
    <div id="dashboard-view" className="space-y-8 animate-in fade-in duration-150">
      {/* Filters Strip */}
      <div className="bg-[#0f0f12] rounded-xl border border-white/10 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-3 bg-indigo-500 rounded-xs"></span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#e0e0e6]/45 font-mono">filter_channel:</span>
          </div>
          
          <div className="relative">
            <select
              id="filter-vessel"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs rounded-lg px-3 py-2 pr-8 font-semibold focus:outline-indigo-500 focus:outline-1 appearance-none cursor-pointer transition-colors"
              value={selectedVesselFilter}
              onChange={(e) => { setSelectedVesselFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all" className="bg-[#0f0f12] text-white">Select Vessel (All)</option>
              {VESSELS.map(v => (
                <option key={v.id} value={v.id} className="bg-[#0f0f12] text-white">{v.name}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-[9px] font-mono">▼</div>
          </div>

          <div className="relative">
            <select
              id="filter-rank"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs rounded-lg px-3 py-2 pr-8 font-semibold focus:outline-indigo-500 focus:outline-1 appearance-none cursor-pointer transition-colors"
              value={selectedRankFilter}
              onChange={(e) => { setSelectedRankFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all" className="bg-[#0f0f12] text-white">Select Rank (All)</option>
              {RANKS.map(r => (
                <option key={r.id} value={r.id} className="bg-[#0f0f12] text-white">{r.name}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-[9px] font-mono">▼</div>
          </div>

          <div className="relative">
            <select
              id="filter-status"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs rounded-lg px-3 py-2 pr-8 font-semibold focus:outline-indigo-500 focus:outline-1 appearance-none cursor-pointer transition-colors"
              value={selectedStatusFilter}
              onChange={(e) => { setSelectedStatusFilter(e.target.value); setScorecardFilter(null); setCurrentPage(1); }}
            >
              <option value="all" className="bg-[#0f0f12] text-white">Document Status (All)</option>
              <option value="Expired" className="bg-[#0f0f12] text-rose-400 font-bold">🔴 EXPIRED ONLY</option>
              <option value="Expiring Soon" className="bg-[#0f0f12] text-amber-400 font-bold">🟡 EXPIRING SOON OR CRITICAL</option>
              <option value="Valid" className="bg-[#0f0f12] text-emerald-400 font-bold">🟢 FULLY COMPLIANT</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-[9px] font-mono">▼</div>
          </div>
        </div>

        {/* Clear filters badge */}
        {(selectedVesselFilter !== 'all' || selectedRankFilter !== 'all' || selectedStatusFilter !== 'all' || scorecardFilter) && (
          <button
            onClick={() => {
              setSelectedVesselFilter('all');
              setSelectedRankFilter('all');
              setSelectedStatusFilter('all');
              setScorecardFilter(null);
              setCurrentPage(1);
            }}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors underline decoration-indigo-400/30 flex items-center gap-1 font-mono cursor-pointer"
          >
            // CLEAR ACTIVE FILTERS
          </button>
        )}
      </div>

      {/* Critical Document Expiry Alerts widgets */}
      <div className="space-y-3.5">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#e0e0e6]/45 flex items-center gap-2 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          CRITICAL DOCUMENT EXPIRY ALERTS <span className="text-[9px] bg-white/5 text-indigo-300 border border-white/5 px-2 py-0.5 rounded font-mono font-bold">OPERATIONAL DIRECT</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Expiring in < 30 Days */}
          <button
            onClick={() => handleScorecardClick('<30')}
            className={`cursor-pointer text-left transition-all duration-200 rounded-xl p-5 border relative overflow-hidden ${
              scorecardFilter === '<30' 
                ? 'bg-rose-500/15 border-rose-500/75 shadow-[0_0_20px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/50' 
                : 'bg-[#181014] hover:bg-[#201217] border-rose-500/20 hover:border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-rose-300 text-xs font-mono uppercase tracking-wider">EXPIRING IN &lt; 30 DAYS</p>
                <p className="text-[11px] text-rose-400/70 font-sans mt-1 font-semibold">Immediate renewal action required</p>
              </div>
              <div className="p-1 px-3.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold font-mono text-xl shadow-xs">
                {scorecardCounts.c30}
              </div>
            </div>
            {scorecardFilter === '<30' && (
              <div className="mt-3 text-[9px] font-mono font-bold text-rose-300 flex items-center gap-1.5 bg-rose-500/20 p-1 px-2.5 rounded w-fit border border-rose-500/30">
                ACTIVE FILTER // click to clear
              </div>
            )}
          </button>

          {/* Card 2: Expiring in 30-60 Days */}
          <button
            onClick={() => handleScorecardClick('30-60')}
            className={`cursor-pointer text-left transition-all duration-200 rounded-xl p-5 border relative overflow-hidden ${
              scorecardFilter === '30-60' 
                ? 'bg-amber-500/15 border-amber-500/75 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50' 
                : 'bg-[#181410] hover:bg-[#221a12] border-amber-500/20 hover:border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-amber-300 text-xs font-mono uppercase tracking-wider">EXPIRING IN 30-60 DAYS</p>
                <p className="text-[11px] text-amber-400/70 font-sans mt-1 font-semibold">Queue standard renewal process</p>
              </div>
              <div className="p-1 px-3.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold font-mono text-xl shadow-xs">
                {scorecardCounts.c30_60}
              </div>
            </div>
            {scorecardFilter === '30-60' && (
              <div className="mt-3 text-[9px] font-mono font-bold text-amber-300 flex items-center gap-1.5 bg-amber-500/20 p-1 px-2.5 rounded w-fit border border-amber-500/30">
                ACTIVE FILTER // click to clear
              </div>
            )}
          </button>

          {/* Card 3: Expiring in 60-90 Days */}
          <button
            onClick={() => handleScorecardClick('60-90')}
            className={`cursor-pointer text-left transition-all duration-200 rounded-xl p-5 border relative overflow-hidden ${
              scorecardFilter === '60-90' 
                ? 'bg-yellow-500/15 border-yellow-500/75 shadow-[0_0_20px_rgba(234,179,8,0.15)] ring-1 ring-yellow-500/50' 
                : 'bg-[#181810] hover:bg-[#222212] border-yellow-500/20 hover:border-yellow-500/40 text-yellow-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-yellow-300 text-xs font-mono uppercase tracking-wider">EXPIRING IN 60-90 DAYS</p>
                <p className="text-[11px] text-yellow-600 font-medium mt-1">Action: Track Expiries Pipeline</p>
              </div>
              <div className="p-1 px-2.5 rounded bg-yellow-101 text-yellow-800 font-bold font-mono text-xl">
                {scorecardCounts.c60_90}
              </div>
            </div>
            {scorecardFilter === '60-90' && (
              <div className="mt-3 text-[10px] font-semibold text-yellow-800 flex items-center gap-1 bg-white/75 p-1 px-2 rounded w-fit">
                Active Filter <span className="font-mono text-yellow-900 border-l border-yellow-300 pl-1 flex items-center">click to clear</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Crew Compliance Directory Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-[#e0e0e6]/45 font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-505 animate-pulse"></span>
            CREW COMPLIANCE DIRECTORY
          </h3>
        </div>

        {/* Directory Controls & Search */}
        <div className="bg-[#0f0f12] rounded-xl border border-white/10 overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
          <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c0c0e]">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 focus:bg-white/15 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white text-xs rounded-lg placeholder-zinc-500 transition-all font-mono"
                placeholder="Find active crew profiles..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <button
              id="btn-add-crew"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_20px_rgba(99,102,241,0.45)] cursor-pointer font-mono tracking-widest uppercase text-[10px]"
            >
              <Plus size={14} /> REGISTER_CREW_MEMBER
            </button>
          </div>

          {/* Directory Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-[9px] font-black uppercase tracking-widest text-[#e0e0e6]/45 border-b border-white/10 font-mono">
                  <th className="py-3 px-4">crew name</th>
                  <th className="py-3 px-4">duty_post_rank</th>
                  <th className="py-3 px-4">assigned_vessel</th>
                  <th className="py-3 px-4">compliance_credential_status</th>
                  <th className="py-3 px-4">contract_usd</th>
                  <th className="py-3 px-4 text-right">vault_link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-mono text-zinc-300">
                {paginatedCrew.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500 font-sans font-medium">
                      NO DEPLOYED PROFILES MATCHED ACTIVE METADATA SEARCH.
                    </td>
                  </tr>
                ) : (
                  paginatedCrew.map(member => {
                    const rowVessel = VESSELS.find(v => v.id === member.vesselId);
                    const rowRank = RANKS.find(r => r.id === member.rankId);
                    const docStatus = crewStatusMap[member.id];
                    const activeCon = contracts.find(c => c.id === member.activeContractId);

                    return (
                      <tr 
                        key={member.id} 
                        className="hover:bg-white/5 transition-colors align-middle"
                      >
                        <td className="py-4 px-4">
                          <button
                            onClick={() => onSelectCrewItem(member.id)}
                            className="hover:text-indigo-400 font-sans font-black text-white text-xs text-left cursor-pointer underline decoration-dotted underline-offset-4"
                          >
                            {member.name}
                          </button>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: 0x{member.id}</div>
                        </td>
                        <td className="py-4 px-4 font-bold text-zinc-200">
                          {rowRank?.name || member.rankId}
                        </td>
                        <td className="py-4 px-4 text-zinc-400">
                          {rowVessel ? `${rowVessel.name} (${rowVessel.flag})` : member.vesselId}
                        </td>
                        <td className="py-4 px-4">
                          {docStatus?.worstStatus === 'EXPIRED' && (
                            <span className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-405 border border-rose-500/25 rounded px-2.5 py-0.5 font-bold text-[9px] tracking-wide">
                              CRITICAL: EXPIRED ({docStatus.worstDocLabel})
                            </span>
                          )}
                          {docStatus?.worstStatus === 'CRITICAL (<30 days)' && (
                            <span className="inline-flex items-center gap-1 bg-[#181115] text-rose-400 border border-rose-500/20 rounded px-2.5 py-0.5 font-bold text-[9px] tracking-wide">
                              CRITICAL: {Math.abs(docStatus.worstDaysLeft)} DAYS ({docStatus.worstDocLabel})
                            </span>
                          )}
                          {docStatus?.worstStatus === 'WARNING (<90 days)' && (
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded px-2.5 py-0.5 font-bold text-[9px] tracking-wide">
                              WARN: {Math.abs(docStatus.worstDaysLeft)} DAYS ({docStatus.worstDocLabel})
                            </span>
                          )}
                          {docStatus?.worstStatus === 'VALID' && (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-2.5 py-0.5 font-bold text-[9px] tracking-wide">
                              COMPLIANT
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {activeCon ? (
                            <button
                              onClick={() => onViewContract(activeCon)}
                              className="text-indigo-400 hover:text-indigo-300 font-sans font-bold underline flex items-center gap-1 cursor-pointer text-xs"
                            >
                              <FileText size={12} /> YES (PREVIEW)
                            </button>
                          ) : (
                            <button
                              onClick={() => onNavigateToContractBuilder(member.id)}
                              className="text-rose-400 hover:text-rose-300 font-sans font-bold underline flex items-center gap-1 cursor-pointer text-xs"
                            >
                              GENERATE_CONTRACT
                            </button>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center gap-2 justify-end w-full">
                            <button
                              onClick={() => onSelectCrewItem(member.id)}
                              className="bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-zinc-300 px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 tracking-wider uppercase transition-colors cursor-pointer"
                              title="Go to Crew Vault"
                            >
                              <Eye size={12} /> DOSSIER
                            </button>
                            {!activeCon && (
                              <button
                                onClick={() => onNavigateToContractBuilder(member.id)}
                                className="bg-rose-500/10 border border-rose-500/15 hover:bg-rose-500/20 text-rose-300 px-3 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer"
                              >
                                CREATE
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{startIdx}</span> to <span className="font-semibold text-slate-800">{endIdx}</span> of <span className="font-semibold text-slate-800">{totalItems}</span> Crew Members
            </div>
            
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1 px-2 border border-slate-200 rounded bg-white hover:bg-slate-100 disabled:opacity-45 disabled:pointer-events-none transition-colors duration-150 inline-flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1 px-3 border border-white/10 rounded bg-white/5 text-zinc-300 hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-all duration-150 inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase cursor-pointer"
              >
                NEXT <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Crew Modal Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#050507]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0a0c] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#e0e0e6]">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0f0f12]">
              <h2 className="font-extrabold text-[#e0e0e6] text-xs uppercase tracking-widest flex items-center gap-2 font-mono text-indigo-400">
                <User size={16} /> REGISTER NEW MARITIME DEED
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">
                    Crew Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Liam Sterling"
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-505 text-white font-mono"
                    value={newCrewName}
                    onChange={(e) => setNewCrewName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. l.sterling@maritime.com"
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-505 text-white font-mono"
                    value={newCrewEmail}
                    onChange={(e) => setNewCrewEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">
                    Intended Vessel
                  </label>
                  <select
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-505 text-white font-mono"
                    value={newCrewVessel}
                    onChange={(e) => setNewCrewVessel(e.target.value)}
                  >
                    {VESSELS.map(v => (
                      <option key={v.id} value={v.id} className="bg-[#0f0f12] text-white">{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">
                    Assigned Position / Rank
                  </label>
                  <select
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-505 text-white font-mono"
                    value={newCrewRank}
                    onChange={(e) => setNewCrewRank(e.target.value)}
                  >
                    {RANKS.map(r => (
                      <option key={r.id} value={r.id} className="bg-[#0f0f12] text-white">{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">
                    Bank Account Details
                  </label>
                  <input
                    type="text"
                    placeholder="****1234 (Primary Bank)"
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-505 text-white font-mono"
                    value={newCrewBank}
                    onChange={(e) => setNewCrewBank(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">
                    Next of Kin
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jane Sterling (Spouse)"
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-505 text-white font-mono"
                    value={newCrewNok}
                    onChange={(e) => setNewCrewNok(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">
                  Sea Service History
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5 Years"
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-505 text-white font-mono"
                  value={newCrewSeaService}
                  onChange={(e) => setNewCrewSeaService(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white font-bold px-4 py-2 rounded-lg cursor-pointer font-mono tracking-wider uppercase text-[10px]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4.5 py-2 rounded-lg cursor-pointer font-mono tracking-wider uppercase text-[10px] shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
                >
                  DEPLOY_CREW_DOSSIER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
