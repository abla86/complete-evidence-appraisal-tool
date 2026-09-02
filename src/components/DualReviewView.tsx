import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { ArticleAppraisal, AssessmentStatus, DualReviewComparison } from '../types';
import { JBI_QUESTIONS, DUAL_REVIEW_SAMPLE } from '../data/jbiData';
import { JbiQualitativeValidationService } from '../services/jbiValidationService';
import { StatusBadge } from './StatusBadge';
import { useToast } from './Toast';
import { 
  GitCompare, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  ShieldCheck, 
  MessageSquare, 
  Copy, 
  Sparkles, 
  FileText, 
  Layers, 
  BrainCircuit, 
  ExternalLink, 
  ChevronRight, 
  Scale,
  Download,
  Table,
  Check,
  Plus,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
  Code
} from 'lucide-react';

interface DualReviewViewProps {
  articles: ArticleAppraisal[];
  onSelectArticleId?: (id: string) => void;
  onGoToEvaluation?: (article: ArticleAppraisal) => void;
}

export const DualReviewView: React.FC<DualReviewViewProps> = ({
  articles,
  onSelectArticleId,
  onGoToEvaluation
}) => {
  const { showToast } = useToast();
  const [activeSubMode, setActiveSubMode] = useState<'multi_matrix' | 'side_by_side' | 'dual_review'>('multi_matrix');

  // Multi-study comparison state
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>(() => {
    return articles.map(a => a.id);
  });
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Side-by-side article selectors
  const [selectedArticleId1, setSelectedArticleId1] = useState<string>(articles[0]?.id || '');
  const [selectedArticleId2, setSelectedArticleId2] = useState<string>(articles[1]?.id || articles[0]?.id || '');

  // Dual review study selector
  const [selectedStudyForDual, setSelectedStudyForDual] = useState<string>(articles[0]?.id || '');

  const article1 = articles.find(a => a.id === selectedArticleId1) || articles[0];
  const article2 = articles.find(a => a.id === selectedArticleId2) || articles[1] || articles[0];
  const dualArticle = articles.find(a => a.id === selectedStudyForDual) || articles[0];

  // Dynamic consensus draft state
  const [consensusDraft, setConsensusDraft] = useState<Record<number, { status: AssessmentStatus; rationale: string }>>(() => {
    const draft: Record<number, { status: AssessmentStatus; rationale: string }> = {};
    if (dualArticle && dualArticle.items) {
      dualArticle.items.forEach(item => {
        draft[item.questionId] = {
          status: item.status,
          rationale: item.justification
        };
      });
    }
    return draft;
  });

  // Reviewer 2 items (calibrated independent dual review protocol)
  // Reviewer 2 must be an independent data source. Never copy Reviewer 1 answers.
  const [reviewer2Draft, setReviewer2Draft] = useState<Record<number, AssessmentStatus>>({});

  const reviewer2Items = useMemo(() => {
    if (!dualArticle?.items) return [];
    return dualArticle.items.map(it => ({
      ...it,
      status: reviewer2Draft[it.questionId] || 'Uklart',
      justification: reviewer2Draft[it.questionId]
        ? 'Reviewer 2: uavhengig vurdering registrert.'
        : 'Reviewer 2: ikke vurdert ennå.'
    }));
  }, [dualArticle, reviewer2Draft]);

  const handleReviewer2StatusChange = (qId: number, status: AssessmentStatus) => {
    setReviewer2Draft(prev => ({ ...prev, [qId]: JbiQualitativeValidationService.normalizeStatus(status) }));
  };

  const reviewer2Complete = !!dualArticle?.items?.length &&
    dualArticle.items.every(item => Boolean(reviewer2Draft[item.questionId]));

  // Inter-Rater Reliability
  const agreement = useMemo(() => {
    if (!dualArticle?.items) return null;
    return JbiQualitativeValidationService.calculateInterRaterAgreement(dualArticle.items, reviewer2Items);
  }, [dualArticle, reviewer2Items]);

  const handleStatusChange = (qId: number, status: AssessmentStatus) => {
    setConsensusDraft(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        status: JbiQualitativeValidationService.normalizeStatus(status)
      }
    }));
  };

  const handleRationaleChange = (qId: number, rationale: string) => {
    setConsensusDraft(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        rationale
      }
    }));
  };

  // Keep the remaining component implementation unchanged from the repository version.
