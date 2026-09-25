import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Lock, 
  Unlock, 
  Calendar, 
  Award, 
  SlidersHorizontal,
  ChevronRight,
  UserPlus,
  RefreshCw,
  Search,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { 
  ArticleAppraisal, 
  ResearchGroupWorkspace, 
  ReviewerProfile, 
  ReviewerRole, 
  PeerReviewSubmission, 
  PeerReviewComment, 
  StudyConsensusRecord, 
  AssessmentStatus, 
  JBIEvaluationItem, 
  CommentCategory 
} from '../types';
import { GroupCollaborationService, DEFAULT_MEMBERS } from '../services/groupCollaborationService';
import { JBI_QUESTIONS } from '../data/jbiData';
import { useToast } from './Toast';
import { StatusBadge } from './StatusBadge';

interface PeerReviewStudioViewProps {
  articles: ArticleAppraisal[];
  onUpdateArticles?: (articles: ArticleAppraisal[]) => void;
  onNavigateToStudy?: (studyId: string) => void;
}

export const PeerReviewStudioView: React.FC<PeerReviewStudioViewProps> = ({
  articles,
  onUpdateArticles,
  onNavigateToStudy
}) => {
  const { showToast } = useToast();

  const [workspace, setWorkspace] = useState<ResearchGroupWorkspace>(() => 
    GroupCollaborationService.loadWorkspace(articles)
  );

  const [activeTab, setActiveTab] = useState<'matrix' | 'evaluate' | 'irr' | 'consensus' | 'comments' | 'protocol'>('matrix');
  const [selectedStudyId, setSelectedStudyId] = useState<string>(() => articles[0]?.id || 'art-1');
  const [copiedProtocol, setCopiedProtocol] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<ReviewerRole>('Co-Reviewer / Medgransker');
  const [newMemberInstitution, setNewMemberInstitution] = useState('');

  // Comment filter state
  const [commentFilterStudy, setCommentFilterStudy] = useState<string>('ALL');
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentCategory, setNewCommentCategory] = useState<CommentCategory>('METHODOLOGY_CONCERN');
  const [newCommentQuestionId, setNewCommentQuestionId] = useState<number | undefined>(undefined);

  // Active Reviewer
  const activeReviewer = useMemo(() => {
    return workspace.members.find(m => m.id === workspace.activeReviewerId) || workspace.members[0];
  }, [workspace]);

  // Selected Article
  const selectedArticle = useMemo(() => {
    return articles.find(a => a.id === selectedStudyId) || articles[0];
  }, [articles, selectedStudyId]);

  // Submissions for current study
  const currentSubmissions = useMemo(() => {
    return workspace.submissions[selectedStudyId] || [];
  }, [workspace.submissions, selectedStudyId]);

  // Current active reviewer submission for this study
  const mySubmission = useMemo(() => {
    return currentSubmissions.find(s => s.reviewerId === workspace.activeReviewerId);
  }, [currentSubmissions, workspace.activeReviewerId]);

  // Form state for evaluating current study
  const [evalFormItems, setEvalFormItems] = useState<Record<number, { status: AssessmentStatus; justification: string }>>({});
  const [evalOverallVerdict, setEvalOverallVerdict] = useState<NonNullable<PeerReviewSubmission['overallVerdict']>>('Inkluder');
  const [evalVerdictRationale, setEvalVerdictRationale] = useState('');

  // Sync form state when active reviewer or selected study changes
  React.useEffect(() => {
    if (mySubmission) {
      const itemsMap: Record<number, { status: AssessmentStatus; justification: string }> = {};
      mySubmission.items.forEach(it => {
        itemsMap[it.questionId] = { status: it.status, justification: it.justification || '' };
      });
      setEvalFormItems(itemsMap);
      setEvalOverallVerdict(mySubmission.overallVerdict);
      setEvalVerdictRationale(mySubmission.verdictRationale || '');
    } else {
      // Initialize from base article or clean defaults
      const itemsMap: Record<number, { status: AssessmentStatus; justification: string }> = {};
      selectedArticle?.items.forEach(it => {
        itemsMap[it.questionId] = { status: it.status, justification: it.justification || '' };
      });
      setEvalFormItems(itemsMap);
      setEvalOverallVerdict(selectedArticle?.overallVerdict === 'Ekskluder' || selectedArticle?.overallVerdict === 'Vurder videre' || selectedArticle?.overallVerdict === 'Søk mer informasjon' || selectedArticle?.overallVerdict === 'Ufullstendig' ? selectedArticle.overallVerdict : 'Inkluder');
      setEvalVerdictRationale(selectedArticle?.verdictNote || '');
    }
  }, [selectedStudyId, workspace.activeReviewerId, mySubmission, selectedArticle]);

  // Inter-Rater Reliability (IRR) data
  const irrAgreement = useMemo(() => {
    return GroupCollaborationService.calculateAgreement(currentSubmissions);
  }, [currentSubmissions]);

  // Consensus Record for selected study
  const currentConsensus = useMemo(() => {
    return workspace.consensusRecords[selectedStudyId] || null;
  }, [workspace.consensusRecords, selectedStudyId]);

  // Consensus drafting state
  const [consensusDraft, setConsensusDraft] = useState<{
    itemConsensus: Record<number, { status: AssessmentStatus; rationale: string }>;
    overallVerdict: 'Inkluder' | 'Ekskluder' | 'Vurder videre' | 'Søk mer informasjon';
    verdictRationale: string;
    consensusNotes: string;
  }>({
    itemConsensus: {},
    overallVerdict: 'Inkluder',
    verdictRationale: '',
    consensusNotes: ''
  });

  // Initialize consensus drafting
  React.useEffect(() => {
    if (currentConsensus) {
      const itemMap: Record<number, { status: AssessmentStatus; rationale: string }> = {};
      Object.entries(currentConsensus.itemConsensus).forEach(([qId, val]) => {
        const itemVal = val as { status: AssessmentStatus; rationale: string };
        itemMap[Number(qId)] = { status: itemVal.status, rationale: itemVal.rationale };
      });
      setConsensusDraft({
        itemConsensus: itemMap,
        overallVerdict: (['Inkluder', 'Ekskluder', 'Vurder videre', 'Søk mer informasjon'].includes(currentConsensus.overallVerdict ?? '') ? currentConsensus.overallVerdict : 'Inkluder') as 'Inkluder' | 'Ekskluder' | 'Vurder videre' | 'Søk mer informasjon',
        verdictRationale: currentConsensus.verdictRationale,
        consensusNotes: currentConsensus.consensusNotes
      });
    } else {
      // Default from submissions or article
      const itemMap: Record<number, { status: AssessmentStatus; rationale: string }> = {};
      JBI_QUESTIONS.forEach(q => {
        const item1 = currentSubmissions[0]?.items.find(i => i.questionId === q.id);
        itemMap[q.id] = {
          status: item1?.status || 'Ja',
          rationale: item1?.justification || ''
        };
      });
      setConsensusDraft({
        itemConsensus: itemMap,
        overallVerdict: (selectedArticle?.overallVerdict === 'Ekskluder' || selectedArticle?.overallVerdict === 'Vurder videre' || selectedArticle?.overallVerdict === 'Søk mer informasjon' ? selectedArticle.overallVerdict : 'Inkluder'),
        verdictRationale: selectedArticle?.verdictNote || '',
        consensusNotes: ''
      });
    }
  }, [currentConsensus, selectedStudyId, currentSubmissions, selectedArticle]);

  // HANDLERS
  const handleSwitchActiveReviewer = (reviewerId: string) => {
    const updated = GroupCollaborationService.setActiveReviewer(workspace, reviewerId);
    setWorkspace(updated);
    const rev = updated.members.find(m => m.id === reviewerId);
    showToast(`Aktiv gransker endret til: ${rev?.name || reviewerId}`, 'info');
  };

  const handleToggleBlindMode = () => {
    const nextState = !workspace.blindedMode;
    const updated = GroupCollaborationService.toggleBlindedMode(workspace, nextState);
    setWorkspace(updated);
    showToast(
      nextState 
        ? 'Blindet modus AKTIVERT: Granskere kan ikke se hverandres vurderinger fÃ¸r innsending.' 
        : 'Blindet modus DEAKTIVERT: Full innsyn pÃ¥ tvers av granskere.', 
      'success'
    );
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const colors = ['teal', 'indigo', 'rose', 'amber', 'emerald', 'cyan', 'purple'];
    const randomColor = colors[workspace.members.length % colors.length];

    const updated = GroupCollaborationService.addMember(workspace, {
      name: newMemberName.trim(),
      email: newMemberEmail.trim() || undefined,
      role: newMemberRole,
      institution: newMemberInstitution.trim() || undefined,
      avatarColor: randomColor
    });

    setWorkspace(updated);
    setIsAddMemberModalOpen(false);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberInstitution('');
    showToast(`Nytt teammedlem "${newMemberName}" ble lagt til forskningsgruppen!`, 'success');
  };

  const handleSaveEvaluation = () => {
    if (!selectedArticle || !activeReviewer) return;

    const items: JBIEvaluationItem[] = JBI_QUESTIONS.map(q => {
      const draft = evalFormItems[q.id] || { status: 'Ja', justification: '' };
      return {
        questionId: q.id,
        status: draft.status,
        justification: draft.justification,
        candidateEvidenceVerified: true
      };
    });

    const submission: PeerReviewSubmission = {
      id: `sub-${selectedArticle.id}-${activeReviewer.id}`,
      studyId: selectedArticle.id,
      reviewerId: activeReviewer.id,
      reviewerName: activeReviewer.name,
      reviewerRole: activeReviewer.role,
      status: 'COMPLETED',
      startedAt: mySubmission?.startedAt || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      items,
      overallVerdict: evalOverallVerdict,
      verdictRationale: evalVerdictRationale,
      keyStrength: selectedArticle.keyStrength,
      mainLimitation: selectedArticle.mainLimitation
    };

    const updated = GroupCollaborationService.saveSubmission(workspace, selectedArticle.id, submission);
    setWorkspace(updated);
    showToast(`Din vurdering som ${activeReviewer.name} for "${selectedArticle.shortCitation}" ble lagret!`, 'success');
  };

  const handleSaveConsensus = () => {
    if (!selectedArticle) return;

    const itemConsensusObj: Record<number, { status: AssessmentStatus; rationale: string; agreedBy: string[] }> = {};
    JBI_QUESTIONS.forEach(q => {
      const draft = consensusDraft.itemConsensus[q.id] || { status: 'Ja', rationale: '' };
      itemConsensusObj[q.id] = {
        status: draft.status,
        rationale: draft.rationale,
        agreedBy: workspace.members.map(m => m.id)
      };
    });

    const consensusRecord: StudyConsensusRecord = {
      id: generateUniqueId('consensus'),
      reviewerIds: workspace.members.slice(0, 2).map(m => m.id),
      consensusStatus: 'CONSENSUS_REACHED',
      rationale: consensusDraft.verdictRationale,
      studyId: selectedArticle.id,
      meetingDate: new Date().toISOString().split('T')[0],
      status: 'CONSENSUS_REACHED',
      assignedReviewerIds: workspace.members.slice(0, 2).map(m => m.id),
      arbiterId: workspace.members[2]?.id,
      itemConsensus: itemConsensusObj,
      overallVerdict: consensusDraft.overallVerdict,
      verdictRationale: consensusDraft.verdictRationale,
      consensusNotes: consensusDraft.consensusNotes || 'Felles konsensusmÃ¸te avholdt og godkjent.',
      signedOffBy: workspace.members.slice(0, 2).map(m => m.name),
      lockedAt: new Date().toISOString()
    };

    const updatedWorkspace = GroupCollaborationService.saveConsensus(workspace, selectedArticle.id, consensusRecord);
    setWorkspace(updatedWorkspace);

    // Also update main article appraisal state if handler provided
    if (onUpdateArticles) {
      const updatedArticles = articles.map(a => {
        if (a.id === selectedArticle.id) {
          return {
            ...a,
            overallVerdict: consensusDraft.overallVerdict,
            verdictNote: consensusDraft.verdictRationale,
            items: JBI_QUESTIONS.map(q => {
              const draft = consensusDraft.itemConsensus[q.id];
              return {
                questionId: q.id,
                status: draft?.status || 'Ja',
                justification: draft?.rationale || '',
                candidateEvidenceVerified: true
              };
            })
          };
        }
        return a;
      });
      onUpdateArticles(updatedArticles);
    }

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // fallback
    }

    showToast(`Konsensusvedtak for "${selectedArticle.shortCitation}" ble lagret og lÃ¥st!`, 'success');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeReviewer) return;

    const updated = GroupCollaborationService.addComment(workspace, {
      studyId: commentFilterStudy === 'ALL' ? (selectedArticle?.id || 'art-1') : commentFilterStudy,
      questionId: newCommentQuestionId,
      authorId: activeReviewer.id,
      authorName: activeReviewer.name,
      authorRole: activeReviewer.role,
      category: newCommentCategory,
      text: newCommentText.trim()
    });

    setWorkspace(updated);
    setNewCommentText('');
    showToast('Fagfelletilbakemelding ble registrert!', 'success');
  };

  const handleToggleResolveComment = (commentId: string) => {
    if (!activeReviewer) return;
    const updated = GroupCollaborationService.toggleCommentResolved(workspace, commentId, activeReviewer.name);
    setWorkspace(updated);
    showToast('Kommentarstatus oppdatert!', 'info');
  };

  const handleDeleteComment = (commentId: string) => {
    const updated = GroupCollaborationService.deleteComment(workspace, commentId);
    setWorkspace(updated);
    showToast('Kommentar slettet.', 'info');
  };

  const handleExportProtocolWord = () => {
    const html = GroupCollaborationService.generateProtocolWordHtml(workspace, articles);
    const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fagfellevurderingsprotokoll_${workspace.projectName.replace(/\s+/g, '_')}_${Date.now()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Fagfellevurderingsprotokoll lastet ned som Word (.doc)!', 'success');
  };

  const handleCopyProtocolMarkdown = () => {
    const md = GroupCollaborationService.generateProtocolMarkdown(workspace, articles);
    navigator.clipboard.writeText(md);
    setCopiedProtocol(true);
    setTimeout(() => setCopiedProtocol(false), 2500);
    showToast('Fagfellevurderingsprotokoll kopiert til utklippstavlen som Markdown!', 'success');
  };

  const handleExportTeamBundle = () => {
    GroupCollaborationService.exportTeamBundle(workspace, articles);
    showToast('Komplett team-pakke (.jbi-team.json) eksportert!', 'success');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* TOP HERO & WORKSPACE CONTROL BAR */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-teal-100 text-teal-900 text-[11px] font-extrabold uppercase tracking-wider rounded-md flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-700" />
                Gruppesamarbeid & Fagfellevurdering Studio
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
                PRISMA 2020 & JBI Standard
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 font-serif">
              {workspace.projectName}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {workspace.institutionOrCourse} â€¢ {workspace.members.length} granskere i forskningsteamet â€¢ {articles.length} inkluderte artikler
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Active Identity Switcher */}
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-600 mr-2 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                Gransker:
              </span>
              <select
                value={workspace.activeReviewerId}
                onChange={(e) => handleSwitchActiveReviewer(e.target.value)}
                className="bg-transparent text-xs font-extrabold text-teal-950 focus:outline-hidden cursor-pointer"
              >
                {workspace.members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role.split('/')[0].trim()})
                  </option>
                ))}
              </select>
            </div>

            {/* Blind Mode Toggle */}
            <button
              type="button"
              onClick={handleToggleBlindMode}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                workspace.blindedMode
                  ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs hover:bg-amber-100'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title="Blindet modus skjuler andre granskeres skÃ¥r fÃ¸r du selv har sendt inn"
            >
              {workspace.blindedMode ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                  <span>Blindet Modus: PÃ…</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Blindet Modus: AV</span>
                </>
              )}
            </button>

            {/* Export Menu */}
            <button
              type="button"
              onClick={handleExportTeamBundle}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-teal-700" />
              <span>Eksporter Teampakke</span>
            </button>
          </div>
        </div>

        {/* SUB-NAV TABS */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'border-teal-700 text-teal-900 font-extrabold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>1. Studietildeling & Gruppeoversikt</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('evaluate')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'evaluate'
                ? 'border-teal-700 text-teal-900 font-extrabold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>2. Individuell Gransking ({activeReviewer?.name.split(' ')[0]})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('irr')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'irr'
                ? 'border-teal-700 text-teal-900 font-extrabold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. Inter-Rater Samstemthet (Îº) & Avvik</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('consensus')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'consensus'
                ? 'border-teal-700 text-teal-900 font-extrabold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>4. KonsensusmÃ¸te & Adjudisering</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'comments'
                ? 'border-teal-700 text-teal-900 font-extrabold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>5. Fagfellekommentarer ({workspace.comments.filter(c => !c.resolved).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('protocol')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'protocol'
                ? 'border-teal-700 text-teal-900 font-extrabold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>6. Fagfellevurderingsprotokoll (Word/PDF)</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: STUDY ASSIGNMENT & GROUP MATRIX */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* TEAM MEMBERS ROSTER */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Forskningsteam & Granskerprofiler
                </h3>
                <p className="text-xs text-slate-600">
                  Definer hvem som er hovedgransker, medgransker og uavhengig tredjeperson (arbiter/metodolog).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMemberModalOpen(true)}
                className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Legg til gransker</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {workspace.members.map(m => (
                <div 
                  key={m.id} 
                  className={`p-4 rounded-xl border transition-all ${
                    m.id === workspace.activeReviewerId
                      ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-600/30'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-extrabold text-xs flex items-center justify-center shadow-2xs">
                      {m.name.slice(0, 2).toUpperCase()}
                    </span>
                    {m.id === workspace.activeReviewerId && (
                      <span className="px-2 py-0.5 bg-teal-800 text-white text-[10px] font-extrabold rounded-md">
                        AKTIV DU
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">{m.name}</h4>
                  <p className="text-[11px] font-semibold text-teal-800 mt-0.5">{m.role}</p>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">{m.institution || 'Institusjon ikke oppgitt'}</p>
                  
                  <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">FullfÃ¸rte studier:</span>
                    <span className="font-extrabold text-slate-900">
                      {(Object.values(workspace.submissions) as PeerReviewSubmission[][]).filter(subs => subs.some(s => s.reviewerId === m.id)).length} / {articles.length}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STUDY ALLOCATION & STATUS MATRIX */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Studiefordeling & Fremdrift
                </h3>
                <p className="text-xs text-slate-600">
                  Oversikt over uavhengige vurderinger og konsensusstatus for hver inkluderte studie.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900">
                    <th className="p-3 font-bold border-b border-slate-200">Studie / Sitat</th>
                    <th className="p-3 font-bold border-b border-slate-200">Tittel & Design</th>
                    <th className="p-3 font-bold border-b border-slate-200">Granskere (Innsendt)</th>
                    <th className="p-3 font-bold border-b border-slate-200">Samstemthet (IRR)</th>
                    <th className="p-3 font-bold border-b border-slate-200">Konsensusstatus</th>
                    <th className="p-3 font-bold border-b border-slate-200 text-right">Handlinger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {articles.map((art) => {
                    const subs = workspace.submissions[art.id] || [];
                    const consensus = workspace.consensusRecords[art.id];
                    const agreement = GroupCollaborationService.calculateAgreement(subs);

                    const isFullyReviewed = subs.length >= 2;
                    const isConsensusReached = consensus?.status === 'CONSENSUS_REACHED';

                    return (
                      <tr 
                        key={art.id} 
                        className={`hover:bg-slate-50 transition-colors ${
                          art.id === selectedStudyId ? 'bg-teal-50/40' : ''
                        }`}
                      >
                        <td className="p-3 font-bold text-slate-900 align-top">
                          <button
                            type="button"
                            onClick={() => setSelectedStudyId(art.id)}
                            className="text-left font-serif hover:text-teal-800 transition-colors"
                          >
                            {art.shortCitation}
                          </button>
                          <span className="block text-[10px] font-normal text-slate-500 mt-0.5">{art.year} â€¢ {art.journal}</span>
                        </td>
                        <td className="p-3 text-slate-800 align-top max-w-xs">
                          <span className="font-semibold line-clamp-1">{art.title}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{art.methodology || art.design}</span>
                        </td>
                        <td className="p-3 align-top">
                          <div className="flex flex-col gap-1">
                            {subs.map(s => (
                              <span key={s.id} className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-900 bg-teal-100/70 px-2 py-0.5 rounded">
                                <Check className="w-3 h-3 text-teal-700" />
                                {s.reviewerName.split(' ')[0]} ({s.overallVerdict})
                              </span>
                            ))}
                            {subs.length < 2 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Venter pÃ¥ {2 - subs.length} gransker(e)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 align-top">
                          {agreement ? (
                            <div>
                              <span className="font-extrabold text-slate-900 font-mono text-xs block">
                                Îº = {agreement.cohensKappa.toFixed(2)} ({agreement.percentAgreement}%)
                              </span>
                              <span className="text-[10px] text-slate-600">
                                {agreement.discrepancies.length === 0 ? 'Full enighet' : `${agreement.discrepancies.length} avvik`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Krever â‰¥2 vurderinger</span>
                          )}
                        </td>
                        <td className="p-3 align-top">
                          {isConsensusReached ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 font-extrabold text-[11px] border border-emerald-300">
                              <Lock className="w-3 h-3" />
                              LÃ¥st Konsensus ({consensus?.overallVerdict})
                            </span>
                          ) : isFullyReviewed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                              <AlertTriangle className="w-3 h-3" />
                              Klar for konsensusmÃ¸te
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-medium">
                              Under uavhengig vurdering
                            </span>
                          )}
                        </td>
                        <td className="p-3 align-top text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudyId(art.id);
                              setActiveTab('evaluate');
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-300 shadow-2xs"
                          >
                            Vurder
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudyId(art.id);
                              setActiveTab('consensus');
                            }}
                            className="px-2.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-[11px] font-bold rounded-lg shadow-2xs"
                          >
                            Konsensus
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: INDEPENDENT REVIEW WORKSPACE */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'evaluate' && (
        <div className="space-y-6">
          {/* Study Selector Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 block">
                Uavhengig Dobbeltgransking som: {activeReviewer?.name} ({activeReviewer?.role})
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                {selectedArticle?.shortCitation} â€“ {selectedArticle?.title}
              </h2>
              <p className="text-xs text-slate-600">
                Design: {selectedArticle?.design} â€¢ Utvalg: {selectedArticle?.participants}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-600">Bytt studie:</label>
              <select
                value={selectedStudyId}
                onChange={(e) => setSelectedStudyId(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600"
              >
                {articles.map(a => (
                  <option key={a.id} value={a.id}>{a.shortCitation} ({a.year})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Blind Mode Notice */}
          {workspace.blindedMode && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3 text-xs text-amber-900">
              <EyeOff className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <strong>Blindet protokoll aktiv:</strong> Du kan ikke se vurderingene til de andre granskerne fÃ¸r du har fullfÃ¸rt og lagret din egen uavhengige gjennomgang. Dette eliminerer bias og sikrer metodisk stringens.
              </div>
            </div>
          )}

          {/* Granular JBI Evaluation Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-serif">
                JBI Kriterievurdering (Q1â€“Q10) for {selectedArticle?.shortCitation}
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Svar pÃ¥ samtlige 10 punkter med begrunnelse
              </span>
            </div>

            <div className="space-y-4">
              {JBI_QUESTIONS.map(q => {
                const currentDraft = evalFormItems[q.id] || { status: 'Ja', justification: '' };

                return (
                  <div key={q.id} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 mr-2">
                          {q.id}. {q.shortTitle}
                        </span>
                        <span className="text-[11px] text-slate-600 block mt-0.5">
                          {q.officialQuestion}
                        </span>
                      </div>

                      {/* Status Selection Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(['Ja', 'Nei', 'Uklart', 'Ikke relevant'] as AssessmentStatus[]).map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setEvalFormItems(prev => ({
                              ...prev,
                              [q.id]: { ...currentDraft, status: st }
                            }))}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              currentDraft.status === st
                                ? st === 'Ja'
                                  ? 'bg-emerald-700 text-white shadow-2xs'
                                  : st === 'Nei'
                                    ? 'bg-rose-700 text-white shadow-2xs'
                                    : 'bg-amber-700 text-white shadow-2xs'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Justification input */}
                    <div>
                      <textarea
                        rows={2}
                        value={currentDraft.justification}
                        onChange={(e) => setEvalFormItems(prev => ({
                          ...prev,
                          [q.id]: { ...currentDraft, justification: e.target.value }
                        }))}
                        placeholder={`Din faglige begrunnelse og referanse til side/avsnitt i ${selectedArticle?.shortCitation}...`}
                        className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall Verdict and Submission */}
            <div className="p-5 bg-teal-50/60 rounded-xl border border-teal-200 space-y-4">
              <h4 className="text-sm font-bold text-teal-950 font-serif">
                Overordnet metodisk konklusjon for {activeReviewer?.name}:
              </h4>

              <div className="flex flex-wrap items-center gap-3">
                {(['Inkluder', 'Vurder videre', 'Søk mer informasjon', 'Ekskluder'] as const).map(verdict => (
                  <button
                    key={verdict}
                    type="button"
                    onClick={() => setEvalOverallVerdict(verdict)}
                    className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                      evalOverallVerdict === verdict
                        ? 'bg-teal-900 text-white shadow-xs ring-2 ring-teal-600/50'
                        : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {verdict}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-teal-950 block mb-1">
                  Metodisk helhetsvurdering & kommentar til konsensusmÃ¸tet:
                </label>
                <textarea
                  rows={2}
                  value={evalVerdictRationale}
                  onChange={(e) => setEvalVerdictRationale(e.target.value)}
                  placeholder="Oppsummer studiens styrker, svakheter og eventuelle uklarheter som krever felles drÃ¸fting..."
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveEvaluation}
                  className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Send inn og lagre vurdering som {activeReviewer?.name.split(' ')[0]}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: INTER-RATER RELIABILITY & DISCREPANCY DETECTOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'irr' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Inter-Rater Reliability (IRR) & Cohen's Kappa (&kappa;)
                </h3>
                <p className="text-xs text-slate-600">
                  Statistisk analyse av samstemthet mellom uavhengige granskere i henhold til Landis & Koch (1977).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600">Studie:</label>
                <select
                  value={selectedStudyId}
                  onChange={(e) => setSelectedStudyId(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                >
                  {articles.map(a => (
                    <option key={a.id} value={a.id}>{a.shortCitation}</option>
                  ))}
                </select>
              </div>
            </div>

            {irrAgreement ? (
              <div className="space-y-6">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 text-center">
                    <span className="text-[10px] font-extrabold uppercase text-teal-800 block">
                      Cohen's Kappa (&kappa;)
                    </span>
                    <span className="text-3xl font-extrabold text-teal-950 font-mono">
                      {irrAgreement.cohensKappa.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-teal-900 block mt-1">
                      {irrAgreement.interpretation}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-extrabold uppercase text-slate-600 block">
                      RÃ¥ Prosent Samstemthet
                    </span>
                    <span className="text-3xl font-extrabold text-slate-900 font-mono">
                      {irrAgreement.percentAgreement}%
                    </span>
                    <span className="text-xs text-slate-600 block mt-1">
                      {irrAgreement.agreedCount} av {irrAgreement.totalItems} kriterier like
                    </span>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
                    <span className="text-[10px] font-extrabold uppercase text-amber-800 block">
                      Identifiserte Avvik
                    </span>
                    <span className="text-3xl font-extrabold text-amber-950 font-mono">
                      {irrAgreement.discrepancies.length}
                    </span>
                    <span className="text-xs text-amber-900 block mt-1">
                      Krever konsensusdrÃ¸fting
                    </span>
                  </div>
                </div>

                {/* Discrepancy Breakdown Table */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 font-serif">
                    Kriterier med uoverensstemmelser mellom granskerne:
                  </h4>

                  {irrAgreement.discrepancies.length === 0 ? (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                      <span>Perfekt samstemthet! Begge granskere har vurdert alle 10 kriteriene identisk.</span>
                    </div>
                  ) : (
                    irrAgreement.discrepancies.map(disc => (
                      <div key={disc.questionId} className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 text-xs">
                            {disc.questionId}. {disc.questionTitle}
                          </strong>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold rounded text-[10px]">
                            Avvik oppdaget
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">{irrAgreement.reviewer1Name}:</span>
                              <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-slate-100 text-slate-800">
                                {disc.r1Status}
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px]">{disc.r1Rationale || 'Ingen begrunnelse oppgitt.'}</p>
                          </div>

                          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">{irrAgreement.reviewer2Name}:</span>
                              <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-slate-100 text-slate-800">
                                {disc.r2Status}
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px]">{disc.r2Rationale || 'Ingen begrunnelse oppgitt.'}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
                <p className="font-bold text-slate-800">Krever minst to uavhengige granskervurderinger</p>
                <p>Bytt aktiv gransker Ã¸verst til hÃ¸yre for Ã¥ fylle inn vurdering for Reviewer 2.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: CONSENSUS MEETING & ADJUDICATION */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'consensus' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-teal-100 text-teal-900 text-[10px] font-extrabold rounded-md uppercase">
                    KonsensusmÃ¸te & Adjudisering
                  </span>
                  {currentConsensus?.status === 'CONSENSUS_REACHED' && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      LÃ…ST VEDTAK
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 font-serif mt-1">
                  Konsensusvedtak for {selectedArticle?.shortCitation}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600">Studie:</label>
                <select
                  value={selectedStudyId}
                  onChange={(e) => setSelectedStudyId(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                >
                  {articles.map(a => (
                    <option key={a.id} value={a.id}>{a.shortCitation}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Item-by-item Consensus Decision Matrix */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 font-serif">
                Strukturert enighet per JBI-kriterium (1â€“10):
              </h4>

              {JBI_QUESTIONS.map(q => {
                const sub1Item = currentSubmissions[0]?.items.find(i => i.questionId === q.id);
                const sub2Item = currentSubmissions[1]?.items.find(i => i.questionId === q.id);
                const draft = consensusDraft.itemConsensus[q.id] || { status: 'Ja', rationale: '' };

                const isAgreedInitially = sub1Item?.status === sub2Item?.status;

                return (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          {q.id}. {q.shortTitle}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {q.officialQuestion}
                        </span>
                      </div>

                      {/* Quick adoption buttons if differing */}
                      <div className="flex items-center gap-2 shrink-0">
                        {sub1Item && (
                          <button
                            type="button"
                            onClick={() => setConsensusDraft(prev => ({
                              ...prev,
                              itemConsensus: {
                                ...prev.itemConsensus,
                                [q.id]: { status: sub1Item.status, rationale: sub1Item.justification || '' }
                              }
                            }))}
                            className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[10px] font-bold text-slate-700"
                            title="Bruk Reviewer 1 sitt svar"
                          >
                            Bruk R1 ({sub1Item.status})
                          </button>
                        )}
                        {sub2Item && (
                          <button
                            type="button"
                            onClick={() => setConsensusDraft(prev => ({
                              ...prev,
                              itemConsensus: {
                                ...prev.itemConsensus,
                                [q.id]: { status: sub2Item.status, rationale: sub2Item.justification || '' }
                              }
                            }))}
                            className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[10px] font-bold text-slate-700"
                            title="Bruk Reviewer 2 sitt svar"
                          >
                            Bruk R2 ({sub2Item.status})
                          </button>
                        )}

                        <div className="flex items-center gap-1 ml-2">
                          {(['Ja', 'Nei', 'Uklart', 'Ikke relevant'] as AssessmentStatus[]).map(st => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setConsensusDraft(prev => ({
                                ...prev,
                                itemConsensus: {
                                  ...prev.itemConsensus,
                                  [q.id]: { ...draft, status: st }
                                }
                              }))}
                              className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all ${
                                draft.status === st
                                  ? 'bg-teal-900 text-white shadow-2xs'
                                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <textarea
                        rows={2}
                        value={draft.rationale}
                        onChange={(e) => setConsensusDraft(prev => ({
                          ...prev,
                          itemConsensus: {
                            ...prev.itemConsensus,
                            [q.id]: { ...draft, rationale: e.target.value }
                          }
                        }))}
                        placeholder="Felles konsensusbegrunnelse vedtatt av granskerne..."
                        className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall Verdict & Meeting Notes */}
            <div className="p-5 bg-teal-50/60 rounded-xl border border-teal-200 space-y-4">
              <h4 className="text-sm font-bold text-teal-950 font-serif">
                Endelig Felles Konsensusvedtak for Studien:
              </h4>

              <div className="flex flex-wrap items-center gap-3">
                {(['Inkluder', 'Vurder videre', 'Søk mer informasjon', 'Ekskluder'] as const).map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setConsensusDraft(prev => ({ ...prev, overallVerdict: v }))}
                    className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                      consensusDraft.overallVerdict === v
                        ? 'bg-teal-900 text-white shadow-xs ring-2 ring-teal-600/50'
                        : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-teal-950 block mb-1">
                  Konsensusbegrunnelse for masteroppgave / artikkelmetode:
                </label>
                <textarea
                  rows={2}
                  value={consensusDraft.verdictRationale}
                  onChange={(e) => setConsensusDraft(prev => ({ ...prev, verdictRationale: e.target.value }))}
                  placeholder="Formuler felles begrunnelse for inklusjon/eksklusjon..."
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveConsensus}
                  className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Godkjenn & LÃ¥s Konsensusprotokoll</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: PEER REVIEW COMMENTS & INLINE FEEDBACK */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'comments' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Fagfelletilbakemeldinger & Metodisk Samhandling
                </h3>
                <p className="text-xs text-slate-600">
                  DrÃ¸ft metodiske usikkerheter, sitater og kvalitetspunkter direkte i granskerteamet.
                </p>
              </div>

              {/* Study filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600">Filter:</label>
                <select
                  value={commentFilterStudy}
                  onChange={(e) => setCommentFilterStudy(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                >
                  <option value="ALL">Alle studier ({workspace.comments.length})</option>
                  {articles.map(a => (
                    <option key={a.id} value={a.id}>{a.shortCitation}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* New Comment Input */}
            <form onSubmit={handleAddComment} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                Skriv ny kommentar som {activeReviewer?.name}:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Kategori:</label>
                  <select
                    value={newCommentCategory}
                    onChange={(e) => setNewCommentCategory(e.target.value as CommentCategory)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="METHODOLOGY_CONCERN">âš ï¸ Metodisk bekymring / Usikkerhet</option>
                    <option value="CLARIFICATION_NEEDED">â“ Behov for oppklaring</option>
                    <option value="STRENGTH_PRAISE">ðŸŒŸ Metodisk styrke / Ros</option>
                    <option value="CONSENSUS_NOTE">ðŸ“ Konsensusnotat</option>
                    <option value="GENERAL_FEEDBACK">ðŸ’¬ Generell tilbakemelding</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">JBI Kriterium (Valgfritt):</label>
                  <select
                    value={newCommentQuestionId || ''}
                    onChange={(e) => setNewCommentQuestionId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="">Hele studien generelt</option>
                    {JBI_QUESTIONS.map(q => (
                      <option key={q.id} value={q.id}>{q.id}. {q.shortTitle}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  required
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Skriv kommentar til forskningsteamet (f.eks. henvisning til side i fulltekst, spÃ¸rsmÃ¥l til medgransker)..."
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Publiser kommentar</span>
                </button>
              </div>
            </form>

            {/* Comment Stream */}
            <div className="space-y-3">
              {workspace.comments
                .filter(c => commentFilterStudy === 'ALL' || c.studyId === commentFilterStudy)
                .map(c => {
                  const study = articles.find(a => a.id === c.studyId);
                  return (
                    <div 
                      key={c.id} 
                      className={`p-4 rounded-xl border transition-all space-y-2 text-xs ${
                        c.resolved 
                          ? 'bg-slate-50/60 border-slate-200 opacity-75' 
                          : 'bg-white border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-teal-700 text-white text-[10px] font-extrabold flex items-center justify-center">
                            {c.authorName.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900">{c.authorName}</span>
                            <span className="text-[10px] text-slate-500 ml-1.5">({c.authorRole})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                            {study?.shortCitation} {c.questionId ? `â€¢ Q${c.questionId}` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleResolveComment(c.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                              c.resolved 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                            }`}
                          >
                            {c.resolved ? 'âœ“ Avklart' : 'Marker som avklart'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Slett kommentar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-800 text-xs pl-8 leading-relaxed">
                        {c.text}
                      </p>

                      {c.resolved && c.resolvedBy && (
                        <p className="text-[10px] text-emerald-800 pl-8 font-medium">
                          Avklart i konsensus av {c.resolvedBy} {c.resolvedAt ? `(${new Date(c.resolvedAt).toLocaleDateString('no-NO')})` : ''}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: PRISMA & PUBLICATION PROTOCOL CERTIFICATE */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'protocol' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Offisiell Fagfellevurderings- og Konsensusprotokoll
                </h3>
                <p className="text-xs text-slate-600">
                  Fullverdig rapport for publisering og masteroppgavevedlegg i henhold til PRISMA 2020.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportProtocolWord}
                  className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Last ned Word (.doc)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyProtocolMarkdown}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center gap-1.5"
                >
                  {copiedProtocol ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedProtocol ? 'Kopiert!' : 'Kopier Markdown'}</span>
                </button>
              </div>
            </div>

            {/* Protocol Display Document */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 font-serif text-xs text-slate-900 space-y-6 max-h-[600px] overflow-y-auto">
              <div className="border-b border-slate-300 pb-4">
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-teal-800 block">
                  SYSTEMATIC REVIEW PEER REVIEW CERTIFICATE
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  Fagfellevurderingsprotokoll: {workspace.projectName}
                </h2>
                <p className="text-[11px] font-sans text-slate-600 mt-1">
                  Institusjon: {workspace.institutionOrCourse} â€¢ Standard: {workspace.protocolPrismaTarget} â€¢ Dato: {new Date().toLocaleDateString('no-NO')}
                </p>
              </div>

              <div>
                <h4 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
                  1. Granskere & Forskningsteam
                </h4>
                <div className="grid grid-cols-2 gap-2 font-sans text-xs">
                  {workspace.members.map(m => (
                    <div key={m.id} className="p-2.5 bg-white rounded border border-slate-200">
                      <strong>{m.name}</strong> ({m.role})<br />
                      <span className="text-[10px] text-slate-500">{m.institution || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
                  2. Studie-for-studie Samstemthet og Konsensusvedtak
                </h4>
                <div className="space-y-4">
                  {articles.map((art, idx) => {
                    const subs = workspace.submissions[art.id] || [];
                    const consensus = workspace.consensusRecords[art.id];
                    const agreement = GroupCollaborationService.calculateAgreement(subs);

                    return (
                      <div key={art.id} className="p-4 bg-white rounded-lg border border-slate-200 space-y-2 font-sans">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 font-serif text-sm">
                            {idx + 1}. {art.shortCitation} â€“ {art.title}
                          </strong>
                          <span className="px-2 py-0.5 bg-teal-100 text-teal-900 font-bold rounded text-[11px]">
                            Konsensus: {consensus?.overallVerdict || 'Avventer'}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs">
                          {art.authors} ({art.year}) â€¢ <em>{art.journal}</em> â€¢ DOI: {art.doi || 'N/A'}
                        </p>
                        {agreement && (
                          <p className="text-teal-950 text-xs font-semibold">
                            Inter-Rater Samstemthet: {agreement.percentAgreement}% â€¢ Cohen's &kappa; = {agreement.cohensKappa} ({agreement.interpretation})
                          </p>
                        )}
                        {consensus && (
                          <p className="text-slate-700 text-xs italic bg-slate-50 p-2.5 rounded border border-slate-200">
                            <strong>Konsensusbegrunnelse:</strong> {consensus.verdictRationale}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-300 font-sans">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">
                  3. Formell Bekreftelse & Signaturer
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {workspace.members.map(m => (
                    <div key={m.id} className="pt-6 border-t border-slate-400 text-xs">
                      <strong>{m.name}</strong><br />
                      <span className="text-[10px] text-slate-500">{m.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD RESEARCHER / MEMBER */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Legg til nytt medlem i forskningsgruppen
            </h3>

            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Fullt navn *</label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="f.eks. Dr. Jonas Berg"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Rolle i prosjektet *</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as ReviewerRole)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="Lead Reviewer / Hovedgransker">Lead Reviewer / Hovedgransker</option>
                  <option value="Co-Reviewer / Medgransker">Co-Reviewer / Medgransker</option>
                  <option value="Arbiter / Tredjeperson">Arbiter / Tredjeperson (Uavhengig)</option>
                  <option value="Methodologist / Metodolog">Methodologist / Metodolog</option>
                  <option value="Supervisor / Veileder">Supervisor / Veileder / Sensor</option>
                  <option value="External Peer Reviewer / Fagfellegransker">External Peer Reviewer / Fagfellegransker</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Institusjon / Universitet</label>
                <input
                  type="text"
                  value={newMemberInstitution}
                  onChange={(e) => setNewMemberInstitution(e.target.value)}
                  placeholder="f.eks. Universitetet i Oslo (UiO) / OUS"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">E-post (Valgfritt)</label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="jonas.berg@uio.no"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold shadow-2xs"
                >
                  Legg til
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


