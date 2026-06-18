import React, { useState, useMemo, useRef } from 'react';
import { CrewMember, Vessel, RankPosition, Document, Contract } from '../types';
import { VESSELS, RANKS, getDocumentStatus } from '../data';
import { formatUSD, formatDate } from '../utils';
import { ArrowLeft, Upload, FileText, Calendar, ShieldCheck, Trash, Edit, AlertCircle, Eye, X, Check, Save } from 'lucide-react';

interface ProfileVaultViewProps {
  member: CrewMember;
  documents: Document[];
  contracts: Contract[];
  onBack: () => void;
  onAddDocument: (newDoc: Document) => void;
  onUpdateDocument: (updatedDoc: Document) => void;
  onDeleteDocument: (docId: string) => void;
  onUpdateMemberStatus: (memberId: string, status: 'Active' | 'Inactive') => void;
}

export default function ProfileVaultView({
  member,
  documents,
  contracts,
  onBack,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  onUpdateMemberStatus
}: ProfileVaultViewProps) {
  // Find current vessel and rank
  const activeVessel = VESSELS.find(v => v.id === member.vesselId);
  const activeRank = RANKS.find(r => r.id === member.rankId);
  const activeContract = contracts.find(c => c.id === member.activeContractId);

  // Documents owned by this crew member
  const memberDocs = useMemo(() => {
    return documents.filter(doc => doc.crewId === member.id);
  }, [documents, member.id]);

  // Modal / Form States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  
  // New Document states
  const [docName, setDocName] = useState('Passport');
  const [customDocName, setCustomDocName] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [issuingAuth, setIssuingAuth] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing state
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editNum, setEditNum] = useState('');
  const [editIssue, setEditIssue] = useState('');
  const [editExpiry, setEditExpiry] = useState('');
  const [editAuth, setEditAuth] = useState('');

  // Drag and Drop State
  const [isDragActive, setIsDragActive] = useState(false);

  // Status Labels logic (CASE statement implementation)
  const getDocStatusBadge = (expiryStr: string) => {
    const { label } = getDocumentStatus(expiryStr);
    
    switch (label) {
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider">
            🚨 EXPIRED
          </span>
        );
      case 'CRITICAL (<30 days)':
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded px-2.5 py-1 text-[11px] font-mono font-extrabold uppercase tracking-wider">
            ⚠️ CRITICAL
          </span>
        );
      case 'WARNING (<90 days)':
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider">
            🟡 WARNING
          </span>
        );
      case 'VALID':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider">
            🛡️ VALID
          </span>
        );
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFileName(file.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFileName(e.target.files[0].name);
    }
  };

  // Upload Document Submit
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber || !issueDate || !expiryDate || !issuingAuth) return;

    const finalDocName = docName === 'Other' ? (customDocName || 'Custom Document') : docName;
    const newDoc: Document = {
      id: `doc-uploaded-${Math.floor(Math.random() * 10000)}`,
      crewId: member.id,
      name: finalDocName,
      number: docNumber,
      issueDate,
      expiryDate,
      issuingAuthority: issuingAuth,
      fileName: uploadedFileName || `Simulated_${finalDocName.replace(/\s+/g, '_')}.pdf`,
      fileType: uploadedFileName.endsWith('.png') ? 'PNG' : 'PDF',
      uploadedAt: new Date().toISOString()
    };

    onAddDocument(newDoc);
    
    // reset states
    setDocName('Passport');
    setCustomDocName('');
    setDocNumber('');
    setIssueDate('');
    setExpiryDate('');
    setIssuingAuth('');
    setUploadedFileName('');
    setIsUploadOpen(false);
  };

  // Inline edit handlers
  const startEditing = (doc: Document) => {
    setEditingDocId(doc.id);
    setEditNum(doc.number);
    setEditIssue(doc.issueDate);
    setEditExpiry(doc.expiryDate);
    setEditAuth(doc.issuingAuthority);
  };

  const saveEdit = (doc: Document) => {
    const updated: Document = {
      ...doc,
      number: editNum,
      issueDate: editIssue,
      expiryDate: editExpiry,
      issuingAuthority: editAuth
    };
    onUpdateDocument(updated);
    setEditingDocId(null);
  };

  const toggleMemberStatus = () => {
    const nextStatus = member.status === 'Active' ? 'Inactive' : 'Active';
    onUpdateMemberStatus(member.id, nextStatus);
  };

  return (
    <div id="profile-vault-view" className="space-y-6">
      {/* Top Banner & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f0f12] p-4 rounded-xl shadow-md border border-white/10">
        <button
          onClick={onBack}
          className="text-zinc-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 group cursor-pointer transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> 
          Back to Crew Compliance Directory
        </button>
        
        <div className="flex items-center gap-3">
          <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider font-mono">deployment_status:</span>
          <button
            onClick={toggleMemberStatus}
            className={`cursor-pointer px-3.5 py-1 rounded-full text-[10px] font-black tracking-widest font-mono transition-all ${
              member.status === 'Active' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
            }`}
          >
            {member.status.toUpperCase()} // TOGGLE
          </button>
        </div>
      </div>

      {/* Crew Profile Title Row */}
      <div className="bg-gradient-to-r from-indigo-950/20 via-[#0f0f12]/90 to-slate-950/40 text-white rounded-xl p-6 border border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.3)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-400 font-mono">Verified Maritime Dossier</span>
          <h2 className="text-xl font-black tracking-tight mt-1 flex items-center gap-2">
            Crew Member: {member.name}
          </h2>
          <p className="text-[11px] text-zinc-500 font-mono mt-1">Dossier Key: <span className="text-zinc-300">0x{member.id}</span></p>
        </div>
        
        {activeVessel && activeRank && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 px-4 text-xs font-mono">
            <span className="block text-[9px] text-[#e0e0e6]/45 font-black uppercase tracking-wider">Active Post Duty</span>
            <p className="font-bold text-white mt-1 text-[13px]">{activeRank.name}</p>
            <p className="text-indigo-300 font-medium text-[10px] mt-0.5">{activeVessel.name} ({activeVessel.flag})</p>
          </div>
        )}
      </div>

      {/* Split Grid Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PERSONAL & PROFILE METADATA */}
        <div className="bg-[#0f0f12] rounded-xl border border-white/10 p-5 space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-[#e0e0e6]/90 font-black text-xs uppercase tracking-widest font-mono flex items-center gap-2">
              <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
              PERSONAL & PROFILE METADATA
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Crew Full Name</span>
              <span className="text-white font-extrabold text-[13px]">{member.name}</span>
            </div>

            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Corporate Email</span>
              <span className="text-indigo-400 font-semibold">{member.email}</span>
            </div>

            <div className="bg-white/5 p-3 rounded-lg border border-white/5 font-mono">
              <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Primary Bank Account</span>
              <span className="text-zinc-350 font-medium">{member.bankAccount}</span>
            </div>

            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Next of Kin Details</span>
              <span className="text-zinc-300 font-semibold">{member.nextOfKin}</span>
            </div>

            <div className="bg-white/5 p-3 rounded-lg border border-white/5 font-mono">
              <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Sea Service History</span>
              <span className="text-indigo-300 font-bold">{member.seaServiceHistory}</span>
            </div>

            <div className="bg-white/5 p-3 rounded-lg border border-white/5 font-mono">
              <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Medical Clearance Status</span>
              <span className={`inline-flex items-center gap-1 font-bold mt-1 text-[11px] ${
                member.medicalClearanceStatus === 'Valid' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {member.medicalClearanceStatus === 'Valid' ? '✓ FULLY-CLEARED (VALID)' : '✗ EXPIRED'}
              </span>
            </div>
          </div>
        </div>

        {/* ACTIVE VESSEL ASSIGNMENT & CONTRACT SUMMARY */}
        <div className="bg-[#0f0f12] rounded-xl border border-white/10 p-5 space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-[#e0e0e6]/90 font-black text-xs uppercase tracking-widest font-mono flex items-center gap-2">
              <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
              ACTIVE CONTRACT SUMMARY
            </h3>
          </div>

          {activeContract ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Assigned Vessel</span>
                <span className="text-white font-extrabold text-[13px]">{activeVessel?.name || 'Unassigned'}</span>
                <span className="block text-[9px] text-[#e0e0e6]/30 font-medium font-mono mt-0.5">Flag: {activeVessel?.flag} | Type: {activeVessel?.type}</span>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Assigned Rate / Rank</span>
                <span className="text-white font-extrabold text-[13px]">{activeRank?.name || 'Unassigned'}</span>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/5 font-mono">
                <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Base Monthly Wages</span>
                <span className="text-emerald-400 font-extrabold text-[13px]">{formatUSD(activeContract.baseWage)}</span>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/5 font-mono">
                <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Fixed Allowances Matrix</span>
                <span className="text-indigo-300 font-bold">{formatUSD(activeContract.riskAllowance + activeContract.loyaltyAllowance)}</span>
                <span className="block text-[9px] text-zinc-500 font-medium mt-0.5">Risk: {formatUSD(activeContract.riskAllowance)} | Loyalty: {formatUSD(activeContract.loyaltyAllowance)}</span>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-indigo-500/20 shadow-[inset_0_0_12px_rgba(99,102,241,0.06)] font-mono">
                <span className="block text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1 font-sans">Total Guaranteed Value</span>
                <span className="text-indigo-300 font-black text-sm">{formatUSD(activeContract.totalMonthly)} / month</span>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/5 font-mono">
                <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Contract Term Dates</span>
                <span className="text-zinc-300 font-semibold block">{formatDate(activeContract.startDate)} - {formatDate(activeContract.endDate)}</span>
                <span className="block text-[9px] text-zinc-500 font-medium mt-0.5">Duration: 12 Months (Fixed)</span>
              </div>
            </div>
          ) : (
            <div className="h-[220px] bg-[#181115]/50 rounded-xl border border-dashed border-rose-500/25 flex flex-col items-center justify-center text-center p-6">
              <AlertCircle className="text-rose-450 mb-2" size={32} />
              <p className="text-xs font-bold text-rose-300">NO ACTIVE GENERAL CONTRACT DOCUMENTED</p>
              <p className="text-[11px] text-zinc-550 mt-1 max-w-sm">This crew member is active in directory services, but has no standard formatted employment contract archived.</p>
            </div>
          )}
        </div>
      </div>

      {/* THE SECURE DOCUMENT VAULT Document Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#e0e0e6]/45 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              THE SECURE DOCUMENT VAULT
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Verified credentials, certificates, and compliance papers associated with #{member.id}</p>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_20px_rgba(99,102,241,0.45)] cursor-pointer tracking-wider uppercase font-mono text-[10px]"
          >
            <Upload size={14} /> Upload New Document File
          </button>
        </div>

        {/* vault lists */}
        <div className="bg-[#0f0f12] rounded-xl border border-white/10 overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-[9px] font-black uppercase tracking-widest text-[#e0e0e6]/45 border-b border-white/10 font-mono">
                  <th className="py-3.5 px-4">document type</th>
                  <th className="py-3.5 px-4 font-mono">ref_number</th>
                  <th className="py-3.5 px-4">issue_date</th>
                  <th className="py-3.5 px-4">expiry_date</th>
                  <th className="py-3.5 px-4">compliance_state</th>
                  <th className="py-3.5 px-4 text-right">actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-zinc-300">
                {memberDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500 font-sans font-semibold">
                      NO DEPLOYED CREDENTIALS FOUND. Please upload authorization documents below.
                    </td>
                  </tr>
                ) : (
                  memberDocs.map(doc => {
                    const isEditing = editingDocId === doc.id;
                    return (
                      <tr key={doc.id} className="hover:bg-white/5 align-middle transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-indigo-400" />
                            <span className="font-extrabold text-white font-sans text-xs">{doc.name}</span>
                          </div>
                          <span className="block text-[9px] text-zinc-500 font-medium pl-5 mt-0.5">AUTH_REGISTRY: {isEditing ? 'TRANSITING_EDIT...' : doc.issuingAuthority}</span>
                        </td>
                        
                        <td className="py-4 px-4 font-bold text-zinc-200">
                          {isEditing ? (
                            <input
                              type="text"
                              className="bg-white/5 border border-white/15 rounded px-2 py-0.5 text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono w-28 uppercase"
                              value={editNum}
                              onChange={(e) => setEditNum(e.target.value)}
                            />
                          ) : (
                            doc.number
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-zinc-400 font-semibold">
                          {isEditing ? (
                            <input
                              type="date"
                              className="bg-white/5 border border-white/15 text-white rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
                              value={editIssue}
                              onChange={(e) => setEditIssue(e.target.value)}
                            />
                          ) : (
                            formatDate(doc.issueDate)
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-zinc-400 font-semibold">
                          {isEditing ? (
                            <input
                              type="date"
                              className="bg-white/5 border border-white/15 text-white rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
                              value={editExpiry}
                              onChange={(e) => setEditExpiry(e.target.value)}
                            />
                          ) : (
                            formatDate(doc.expiryDate)
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {getDocStatusBadge(doc.expiryDate)}
                        </td>

                        <td className="py-4 px-4 text-right font-sans">
                          <div className="inline-flex items-center gap-2 justify-end w-full">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => saveEdit(doc)}
                                  className="p-1 px-3.5 rounded bg-indigo-500/15 border border-indigo-500/35 text-indigo-300 hover:bg-indigo-500/25 transition-all font-bold text-[10px] cursor-pointer tracking-wider font-mono uppercase"
                                  title="Save Edits"
                                >
                                  SAVE
                                </button>
                                <button
                                  onClick={() => setEditingDocId(null)}
                                  className="p-1 px-2.5 rounded bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 transition-colors font-bold text-[10px] cursor-pointer tracking-wider font-mono uppercase"
                                >
                                  ESC
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => { setViewingDoc(doc); setIsViewerOpen(true); }}
                                  className="p-1 px-2.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-zinc-300 transition-all inline-flex items-center gap-1 font-semibold text-[10px] cursor-pointer"
                                >
                                  <Eye size={12} className="text-zinc-400" /> VIEW
                                </button>
                                <button
                                  onClick={() => startEditing(doc)}
                                  className="p-1 px-2.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-zinc-300 transition-all inline-flex items-center gap-1 font-semibold text-[10px] cursor-pointer"
                                  title="Edit Document Meta"
                                >
                                  <Edit size={12} className="text-zinc-400" /> EDIT
                                </button>
                                <button
                                  onClick={() => { if (confirm(`Are you sure you want to delete ${doc.name}?`)) onDeleteDocument(doc.id); }}
                                  className="p-1 px-2 rounded hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 hover:border hover:border-rose-500/20 transition-all cursor-pointer"
                                  title="Delete Document"
                                >
                                  <Trash size={12} />
                                </button>
                              </>
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
        </div>
      </div>

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-[#050507]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0a0c] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#e0e0e6]">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0f0f12]">
              <h2 className="font-extrabold text-white text-xs uppercase tracking-widest flex items-center gap-2 font-mono text-indigo-400">
                <Upload size={14} /> SECURE CREDENTIAL UPLOAD
              </h2>
              <button onClick={() => setIsUploadOpen(false)} className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">Document Identifier Type *</label>
                <select
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-white font-mono"
                >
                  <option value="Passport" className="bg-[#0f0f12]">Passport</option>
                  <option value="Master License" className="bg-[#0f0f12]">Master License / Captain Certificate</option>
                  <option value="Chief Engineer License" className="bg-[#0f0f12]">Chief Engineer License</option>
                  <option value="Medical Fitness Certificate" className="bg-[#0f0f12]">Medical Fitness Certificate</option>
                  <option value="US C1/D Visa" className="bg-[#0f0f12]">US C1/D Visa</option>
                  <option value="Basic Safety Training Certificate" className="bg-[#0f0f12]">Basic Safety Training Certificate</option>
                  <option value="STCW Security Endorsement" className="bg-[#0f0f12]">STCW Security Endorsement</option>
                  <option value="Signed Wet-Ink Contract" className="bg-[#0f0f12]">Signed Wet-Ink Contract Archive</option>
                  <option value="Other" className="bg-[#0f0f12]">Other / Custom Upload</option>
                </select>
              </div>

              {docName === 'Other' && (
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">Custom Document Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Panama Endorsement"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-white font-bold"
                    value={customDocName}
                    onChange={(e) => setCustomDocName(e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">Doc / Ref Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ref ID"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">Issuing Authority *</label>
                  <input
                    type="text"
                    required
                    placeholder="Authority Label"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={issuingAuth}
                    onChange={(e) => setIssuingAuth(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">Issue Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
                    value={issueDate}
                    onChange={(e) => {
                      setIssueDate(e.target.value);
                      if (e.target.value && !expiryDate) {
                        const date = new Date(e.target.value);
                        date.setFullYear(date.getFullYear() + 5);
                        setExpiryDate(date.toISOString().split('T')[0]);
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div>
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">Upload Digital Scan (PDF / PNG) *</label>
                
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    isDragActive 
                      ? 'border-indigo-500 bg-indigo-500/10' 
                      : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Upload className="text-zinc-500 mb-2" size={20} />
                  {uploadedFileName ? (
                    <div className="space-y-1">
                      <p className="text-emerald-400 font-extrabold truncate max-w-[260px] font-mono">{uploadedFileName}</p>
                      <p className="text-[9px] text-zinc-500 font-mono">CR_ARTIFACT_STAGE_COMPLETED. Click to replace.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-zinc-300">Drag and drop scan file here, or click to browse</p>
                      <p className="text-[9px] text-zinc-550 mt-1 font-mono">SUPPORTS: PDF / PNG SCANS (MAX 10MB)</p>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white font-bold px-4 py-2 rounded-lg cursor-pointer font-mono tracking-wider uppercase text-[10px]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-[#18px] py-2 rounded-lg cursor-pointer font-mono tracking-wider uppercase text-[10px] shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
                >
                  VERIFY & DEPLOY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {isViewerOpen && viewingDoc && (
        <div className="fixed inset-0 z-50 bg-[#050507]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0a0c] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-white/10 w-full max-w-2xl overflow-hidden animate-in fade-in duration-150 text-[#e0e0e6]">
            <div className="p-4.5 border-b border-white/10 flex items-center justify-between bg-[#0f0f12]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <h2 className="font-extrabold text-xs uppercase tracking-widest font-mono text-indigo-400">
                  SECURE DOCUMENT DEED ANALYZER
                </h2>
              </div>
              <button onClick={() => { setIsViewerOpen(false); setViewingDoc(null); }} className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Simulated Document Scan graphic */}
            <div className="p-6 bg-[#050507] flex flex-col items-center justify-center border-b border-white/5">
              <div className="bg-[#0f0f12] shadow-2xl border border-white/10 rounded-xl max-w-lg w-full overflow-hidden font-mono text-[11px] text-zinc-300 p-6 relative">
                {/* Floating watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.02] -rotate-12">
                  <span className="text-4xl font-black tracking-widest text-[#e0e0e6]/10 uppercase">SECURE DIGITAL ARCHIVE</span>
                </div>

                <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white font-sans">{viewingDoc.name.toUpperCase()}</h4>
                    <p className="text-[9px] text-[#e0e0e6]/40 mt-0.5">ISSUING AGENCY AUTHORITY: {viewingDoc.issuingAuthority}</p>
                  </div>
                  <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 p-1 text-center rounded font-bold text-[9px] px-2.5">
                    SECURED DEED
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4">
                  <div>
                    <span className="block text-[8px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">DOCUMENT REFERENCE</span>
                    <span className="text-white font-bold text-xs">{viewingDoc.number}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">DOCS_OWNER_ID</span>
                    <span className="text-white font-bold text-xs">0x{viewingDoc.crewId}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">REGISTRATION DATE</span>
                    <span className="text-zinc-400 font-semibold">{viewingDoc.issueDate}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">COMPLIANCE EXP DATE</span>
                    <span className="text-zinc-400 font-semibold">{viewingDoc.expiryDate}</span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                  <span>DEED SIGN_HASH: SHA-256 (0x{viewingDoc.id.replace(/\D/g, '') || '9a13bf7e2'})</span>
                  <span className="font-semibold">{getDocStatusBadge(viewingDoc.expiryDate)}</span>
                </div>
              </div>
            </div>

            <div className="p-4.5 bg-[#0f0f12] flex items-center justify-between text-xs font-medium">
              <span className="text-zinc-500 font-mono">Digital Signature: <strong className="text-zinc-300 font-semibold">{viewingDoc.fileName || 'credential_attachment.pdf'}</strong></span>
              <button
                onClick={() => { setIsViewerOpen(false); setViewingDoc(null); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4.5 py-2 rounded-lg cursor-pointer font-mono tracking-wider text-[10px] uppercase shadow-[0_0_15px_rgba(99,102,241,0.25)] transition-all"
              >
                CLOSE ANALYZER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
