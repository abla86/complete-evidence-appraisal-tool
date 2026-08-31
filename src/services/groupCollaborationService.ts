import { 
  ResearchGroupWorkspace, 
  ReviewerProfile, 
  PeerReviewSubmission, 
  PeerReviewComment, 
  StudyConsensusRecord, 
  ArticleAppraisal,
  AssessmentStatus,
  JBIEvaluationItem
} from '../types';
import { JBI_QUESTIONS } from '../data/jbiData';
import { generateArticleId } from './idGenerator';

const STORAGE_KEY = 'jbi_research_group_workspace_v1';

export const DEFAULT_MEMBERS: ReviewerProfile[] = [
  {
    id: 'rev-1',
    name: 'Anne-Beth K. (Hovedgransker)',
    email: 'anne-beth.k@forskning.no',
    role: 'Lead Reviewer / Hovedgransker',
    institution: 'Universitetet i Oslo (UiO)',
    avatarColor: 'teal',
    isCurrentUser: true
  },
  {
    id: 'rev-2',
    name: 'Lars Erik V. (Medgransker)',
    email: 'lars.erik.v@forskning.no',
    role: 'Co-Reviewer / Medgransker',
    institution: 'NTNU / St. Olavs Hospital',
    avatarColor: 'indigo',
    isCurrentUser: false
  },
  {
    id: 'rev-3',
    name: 'Prof. Dr. Marianne Solberg',
    email: 'marianne.solberg@uib.no',
    role: 'Arbiter / Tredjeperson',
    institution: 'Universitetet i Bergen (UiB)',
    avatarColor: 'rose',
    isCurrentUser: false
  },
  {
    id: 'rev-4',
    name: 'Dr. Henrik Dahl (Metodolog)',
    email: 'h.dahl@folkehelseinstituttet.no',
    role: 'Methodologist / Metodolog',
    institution: 'Folkehelseinstituttet (FHI)',
    avatarColor: 'amber',
    isCurrentUser: false
  }
];

export class GroupCollaborationService {
  private static workspaceCache: ResearchGroupWorkspace | null = null;

  public static getInitialWorkspace(articles: ArticleAppraisal[]): ResearchGroupWorkspace {
    const defaultSubmissions: Record<string, PeerReviewSubmission[]> = {};
    const defaultConsensus: Record<string, StudyConsensusRecord> = {};

    // Seed realistic dual reviews for initial studies
    articles.forEach((art, index) => {
      const rev1Items: JBIEvaluationItem[] = art.items.map(item => ({ ...item }));
      
      // Introduce realistic minor variance for Reviewer 2 to demonstrate discrepancy resolution
      const rev2Items: JBIEvaluationItem[] = art.items.map(item => {
        const itemCopy = { ...item };
        // Vary question 6 (researcher reflexivity) or 7 (cultural context) on specific articles
        if (index === 0 && item.questionId === 6) {
          itemCopy.status = 'Uklart';
          itemCopy.justification = 'Reviewer 2 bemerker: Forfatterne oppgir stilling, men diskuterer ikke eksplisitt forforståelsens innvirkning på dataanalysen.';
        } else if (index === 0 && item.questionId === 7) {
          itemCopy.status = 'Ja';
          itemCopy.justification = 'Reviewer 2 vurderer: Kulturell setting er tilstrekkelig beskrevet i innledningskapittelet.';
        } else if (index === 1 && item.questionId === 8) {
          itemCopy.status = 'Uklart';
          itemCopy.justification = 'Reviewer 2 notat: Sitater er fyldige, men informantkoder mangler på 2 av 8 nøkkelutsagn.';
        }
        return itemCopy;
      });

      defaultSubmissions[art.id] = [
        {
          id: `sub-${art.id}-rev-1`,
          studyId: art.id,
          reviewerId: 'rev-1',
          reviewerName: 'Anne-Beth K. (Hovedgransker)',
          reviewerRole: 'Lead Reviewer / Hovedgransker',
          status: 'COMPLETED',
          startedAt: '2026-03-01T09:00:00Z',
          completedAt: '2026-03-01T10:30:00Z',
          items: rev1Items,
          overallVerdict: art.overallVerdict,
          verdictRationale: art.verdictNote || 'Metodisk solid kvalitativ studie med god forankring.',
          keyStrength: art.keyStrength,
          mainLimitation: art.mainLimitation
        },
        {
          id: `sub-${art.id}-rev-2`,
          studyId: art.id,
          reviewerId: 'rev-2',
          reviewerName: 'Lars Erik V. (Medgransker)',
          reviewerRole: 'Co-Reviewer / Medgransker',
          status: 'COMPLETED',
          startedAt: '2026-03-01T11:00:00Z',
          completedAt: '2026-03-01T12:15:00Z',
          items: rev2Items,
          overallVerdict: art.overallVerdict === 'Inkluder' ? 'Inkluder' : 'Vurder videre',
          verdictRationale: 'Uavhengig gjennomgang fullført. Mindre uklarheter ved forskerposisjonering (Q6) bør drøftes i konsensusmøte.',
          keyStrength: art.keyStrength,
          mainLimitation: art.mainLimitation
        }
      ];

      // Initial consensus
      const itemConsensus: Record<number, { status: AssessmentStatus; rationale: string; agreedBy: string[]; adoptedFromReviewerId?: string }> = {};
      JBI_QUESTIONS.forEach(q => {
        const item1 = rev1Items.find(i => i.questionId === q.id);
        itemConsensus[q.id] = {
          status: item1?.status || 'Ja',
          rationale: item1?.justification || 'Felles konsensus i forskergruppen.',
          agreedBy: ['rev-1', 'rev-2']
        };
      });

      defaultConsensus[art.id] = {
        studyId: art.id,
        meetingDate: '2026-03-02',
        status: index === 0 ? 'CONSENSUS_REACHED' : 'IN_DISCUSSIONS',
        assignedReviewerIds: ['rev-1', 'rev-2'],
        arbiterId: 'rev-3',
        itemConsensus,
        overallVerdict: art.overallVerdict,
        verdictRationale: 'Enstemmig konsensus oppnådd etter felles kalibrering og gjennomgang av primærkildens sitater.',
        consensusNotes: 'Konsensusmøte avholdt via digital samhandling. Ingen uoverkommelige metodiske avvik identifisert.',
        signedOffBy: ['rev-1', 'rev-2'],
        lockedAt: index === 0 ? '2026-03-02T14:00:00Z' : undefined
      };
    });

    const defaultComments: PeerReviewComment[] = [
      {
        id: 'com-1',
        studyId: articles[0]?.id || 'art-1',
        questionId: 6,
        authorId: 'rev-2',
        authorName: 'Lars Erik V.',
        authorRole: 'Co-Reviewer / Medgransker',
        category: 'METHODOLOGY_CONCERN',
        text: 'Vennligst sjekk s. 142 i artikkelen. Forfatteren nevner at hun har bakgrunn som intensivsykepleier, men reflekterer ikke over hvordan dette påvirket intervjuguiden.',
        createdAt: '2026-03-01T11:45:00Z',
        resolved: true,
        resolvedAt: '2026-03-02T13:30:00Z',
        resolvedBy: 'Anne-Beth K.'
      },
      {
        id: 'com-2',
        studyId: articles[0]?.id || 'art-1',
        questionId: 8,
        authorId: 'rev-1',
        authorName: 'Anne-Beth K.',
        authorRole: 'Lead Reviewer / Hovedgransker',
        category: 'STRENGTH_PRAISE',
        text: 'Eksepsjonelt fyldige og levende sitater i tabell 2 som gir direkte innsyn i deltakernes opplevelser.',
        createdAt: '2026-03-01T10:15:00Z',
        resolved: false
      }
    ];

    return {
      id: 'grp-proj-2026-01',
      projectName: 'Kvalitativ Evidenssyntese & Fagfellevurdering 2026',
      institutionOrCourse: 'Master-/PhD-prosjekt i helse- og samfunnsvitenskap',
      description: 'Systematisk uavhengig dobbeltgransking og konsensusprosess i henhold til JBI & PRISMA 2020 retningslinjer.',
      protocolPrismaTarget: 'PRISMA 2020 Item 6 & 7 / JBI Manual for Evidence Synthesis',
      createdAt: '2026-03-01T08:00:00Z',
      updatedAt: new Date().toISOString(),
      blindedMode: false,
      requireDualReview: true,
      members: DEFAULT_MEMBERS,
      activeReviewerId: 'rev-1',
      submissions: defaultSubmissions,
      comments: defaultComments,
      consensusRecords: defaultConsensus
    };
  }

  public static loadWorkspace(articles: ArticleAppraisal[]): ResearchGroupWorkspace {
    if (this.workspaceCache) {
      return this.workspaceCache;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ResearchGroupWorkspace;
        this.workspaceCache = parsed;
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load group workspace from localStorage, creating fresh defaults', e);
    }

    const fresh = this.getInitialWorkspace(articles);
    this.saveWorkspace(fresh);
    return fresh;
  }

  public static saveWorkspace(workspace: ResearchGroupWorkspace): void {
    try {
      const updated = {
        ...workspace,
        updatedAt: new Date().toISOString()
      };
      this.workspaceCache = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save group workspace to localStorage', e);
    }
  }

  public static setActiveReviewer(workspace: ResearchGroupWorkspace, reviewerId: string): ResearchGroupWorkspace {
    const updated = {
      ...workspace,
      activeReviewerId: reviewerId
    };
    this.saveWorkspace(updated);
    return updated;
  }

  public static toggleBlindedMode(workspace: ResearchGroupWorkspace, enabled: boolean): ResearchGroupWorkspace {
    const updated = {
      ...workspace,
      blindedMode: enabled
    };
    this.saveWorkspace(updated);
    return updated;
  }

  public static addMember(workspace: ResearchGroupWorkspace, profile: Omit<ReviewerProfile, 'id'>): ResearchGroupWorkspace {
    const newMember: ReviewerProfile = {
      ...profile,
      id: generateArticleId('rev')
    };
    const updated = {
      ...workspace,
      members: [...workspace.members, newMember]
    };
    this.saveWorkspace(updated);
    return updated;
  }

  public static updateMember(workspace: ResearchGroupWorkspace, member: ReviewerProfile): ResearchGroupWorkspace {
    const updated = {
      ...workspace,
      members: workspace.members.map(m => m.id === member.id ? member : m)
    };
    this.saveWorkspace(updated);
    return updated;
  }

  public static removeMember(workspace: ResearchGroupWorkspace, memberId: string): ResearchGroupWorkspace {
    const updated = {
      ...workspace,
      members: workspace.members.filter(m => m.id !== memberId)
    };
    this.saveWorkspace(updated);
    return updated;
  }

  public static saveSubmission(
    workspace: ResearchGroupWorkspace, 
    studyId: string, 
    submission: PeerReviewSubmission
  ): ResearchGroupWorkspace {
    const studySubs = workspace.submissions[studyId] || [];
    const filtered = studySubs.filter(s => s.reviewerId !== submission.reviewerId);
    const newSubs = [...filtered, submission];

    const updated: ResearchGroupWorkspace = {
      ...workspace,
      submissions: {
        ...workspace.submissions,
        [studyId]: newSubs
      }
    };
    this.saveWorkspace(updated);
    return updated;
  }

  public static addComment(
    workspace: ResearchGroupWorkspace,
    comment: Omit<PeerReviewComment, 'id' | 'createdAt' | 'resolved'>
  ): ResearchGroupWorkspace {
    const newComment: PeerReviewComment = {
      ...comment,
      id: generateArticleId('com'),
      createdAt: new Date().toISOString(),
      resolved: false
    };

    const updated = {
      ...workspace,
      comments: [newComment, ...workspace.comments]
    };
    this.saveWorkspace(updated);
    return updated;
  }

  public static toggleCommentResolved(
    workspace: ResearchGroupWorkspace,
    commentId: string,
    resolvedByName: string
  ): ResearchGroupWorkspace {
    const updated = {
      ...workspace,
      comments: workspace.comments.map(c => {
        if (c.id === commentId) {
          const nextResolved = !c.resolved;
          return {
            ...c,
            resolved: nextResolved,
            resolvedAt: nextResolved ? new Date().toISOString() : undefined,
            resolvedBy: nextResolved ? resolvedByName : undefined
          };
        }
        return c;
      })
    };
    this.saveWorkspace(updated);
    return updated;
  }

  public static deleteComment(workspace: ResearchGroupWorkspace, commentId: string): ResearchGroupWorkspace {
    const updated = {
      ...workspace,
      comments: workspace.comments.filter(c => c.id !== commentId)
    };
    this.saveWorkspace(updated);
    return updated;
  }

  public static saveConsensus(
    workspace: ResearchGroupWorkspace,
    studyId: string,
    record: StudyConsensusRecord
  ): ResearchGroupWorkspace {
    const updated = {
      ...workspace,
      consensusRecords: {
        ...workspace.consensusRecords,
        [studyId]: record
      }
    };
    this.saveWorkspace(updated);
    return updated;
  }

  /**
   * Statistical Inter-Rater Reliability (IRR) Calculator
   * Cohen's Kappa, Fleiss' Kappa approximation, raw percent agreement, discrepancy detection
   */
  public static calculateAgreement(submissions: PeerReviewSubmission[]) {
    if (!submissions || submissions.length < 2) {
      return null;
    }

    const sub1 = submissions[0];
    const sub2 = submissions[1];

    let agreed = 0;
    let total = 0;
    const discrepancies: {
      questionId: number;
      questionTitle: string;
      r1Status: AssessmentStatus;
      r2Status: AssessmentStatus;
      r1Rationale?: string;
      r2Rationale?: string;
    }[] = [];

    // Contingency matrix for 3 categories: Yes, Unclear, No
    const categories: AssessmentStatus[] = ['Ja', 'Uklart', 'Nei'];
    const matrix: Record<string, Record<string, number>> = {
      'Ja': { 'Ja': 0, 'Uklart': 0, 'Nei': 0 },
      'Uklart': { 'Ja': 0, 'Uklart': 0, 'Nei': 0 },
      'Nei': { 'Ja': 0, 'Uklart': 0, 'Nei': 0 }
    };

    JBI_QUESTIONS.forEach(q => {
      const item1 = sub1.items.find(i => i.questionId === q.id);
      const item2 = sub2.items.find(i => i.questionId === q.id);

      if (item1 && item2) {
        total++;
        const s1 = (item1.status === 'Yes' ? 'Ja' : item1.status === 'No' ? 'Nei' : item1.status === 'Unclear' ? 'Uklart' : item1.status) as AssessmentStatus;
        const s2 = (item2.status === 'Yes' ? 'Ja' : item2.status === 'No' ? 'Nei' : item2.status === 'Unclear' ? 'Uklart' : item2.status) as AssessmentStatus;

        if (s1 === s2) {
          agreed++;
        } else {
          discrepancies.push({
            questionId: q.id,
            questionTitle: q.shortTitle,
            r1Status: s1,
            r2Status: s2,
            r1Rationale: item1.justification,
            r2Rationale: item2.justification
          });
        }

        if (matrix[s1] && matrix[s1][s2] !== undefined) {
          matrix[s1][s2]++;
        }
      }
    });

    const percentAgreement = total > 0 ? Math.round((agreed / total) * 100) : 0;
    const po = total > 0 ? agreed / total : 0;

    // Expected agreement (Pe)
    let pe = 0;
    if (total > 0) {
      categories.forEach(cat => {
        const rowTotal = (matrix[cat]['Ja'] || 0) + (matrix[cat]['Uklart'] || 0) + (matrix[cat]['Nei'] || 0);
        const colTotal = (matrix['Ja'][cat] || 0) + (matrix['Uklart'][cat] || 0) + (matrix['Nei'][cat] || 0);
        pe += (rowTotal / total) * (colTotal / total);
      });
    }

    let cohensKappa = 1.0;
    if (pe < 1 && (1 - pe) > 0) {
      cohensKappa = Math.max(-1, Math.min(1, (po - pe) / (1 - pe)));
    }

    let interpretation = 'Svært god samstemthet (Almost Perfect)';
    if (cohensKappa < 0.20) interpretation = 'Dårlig samstemthet (Poor / Slight)';
    else if (cohensKappa < 0.40) interpretation = 'Middels samstemthet (Fair)';
    else if (cohensKappa < 0.60) interpretation = 'Moderat samstemthet (Moderate)';
    else if (cohensKappa < 0.80) interpretation = 'Betydelig samstemthet (Substantial)';

    return {
      totalItems: total,
      agreedCount: agreed,
      disagreedCount: total - agreed,
      percentAgreement,
      cohensKappa: Math.round(cohensKappa * 100) / 100,
      interpretation,
      discrepancies,
      reviewer1Name: sub1.reviewerName,
      reviewer2Name: sub2.reviewerName
    };
  }

  /**
   * Export Complete Research Group Bundle (.jbi-team.json)
   */
  public static exportTeamBundle(workspace: ResearchGroupWorkspace, articles: ArticleAppraisal[]) {
    const bundle = {
      exportVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportType: 'JBI_RESEARCH_GROUP_WORKSPACE',
      workspace,
      articlesCount: articles.length,
      articlesSummary: articles.map(a => ({
        id: a.id,
        title: a.title,
        authors: a.authors,
        year: a.year,
        doi: a.doi,
        verdict: a.overallVerdict
      }))
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `jbi_forskningsgruppe_${workspace.projectName.replace(/\s+/g, '_')}_${Date.now()}.jbi-team.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Generates formal Peer Review Protocol for Master Thesis / Journal submission in Markdown
   */
  public static generateProtocolMarkdown(workspace: ResearchGroupWorkspace, articles: ArticleAppraisal[]): string {
    let md = `# Fagfellevurderings- og Konsensusprotokoll\n\n`;
    md += `**Prosjekt:** ${workspace.projectName}\n`;
    md += `**Institusjon / Fagmiljø:** ${workspace.institutionOrCourse || 'Helsevitenskapelig fakultet'}\n`;
    md += `**Standard:** ${workspace.protocolPrismaTarget || 'PRISMA 2020 / JBI Critical Appraisal Guidelines'}\n`;
    md += `**Generert dato:** ${new Date().toLocaleDateString('no-NO')} ${new Date().toLocaleTimeString('no-NO')}\n\n`;

    md += `## 1. Forskningsteam & Granskere\n\n`;
    md += `| Gransker | Rolle | Institusjon | E-post |\n`;
    md += `|---|---|---|---|\n`;
    workspace.members.forEach(m => {
      md += `| **${m.name}** | ${m.role} | ${m.institution || '-'} | ${m.email || '-'} |\n`;
    });

    md += `\n## 2. Metodisk Gjennomføring & Blindingsprotokoll\n\n`;
    md += `- **Uavhengig dobbeltgransking:** ${workspace.requireDualReview ? 'Ja (Minst to uavhengige granskere per artikkel)' : 'Nei'}\n`;
    md += `- **Blindingsstatus:** ${workspace.blindedMode ? 'Aktiv (Granskere ser ikke hverandres skår før innsending)' : 'Åpen / Kalibrert'}\n`;
    md += `- **Konsensusprosedyre:** Ved uenighet gjennomføres strukturert konsensusmøte. Uløste tvister avgjøres av tredjeperson (Arbiter).\n\n`;

    md += `## 3. Studie-for-studie Samstemthet og Konsensusvedtak\n\n`;

    articles.forEach((art, idx) => {
      const subs = workspace.submissions[art.id] || [];
      const consensus = workspace.consensusRecords[art.id];
      const agreement = this.calculateAgreement(subs);

      md += `### 3.${idx + 1} ${art.shortCitation} – ${art.title}\n\n`;
      md += `* **Forfattere & År:** ${art.authors} (${art.year})\n`;
      md += `* **Tidsskrift & DOI:** *${art.journal}* | DOI: ${art.doi || 'N/A'}\n`;
      md += `* **Innsendte vurderinger:** ${subs.length} granskere (${subs.map(s => s.reviewerName).join(', ') || 'Ingen'})\n`;
      
      if (agreement) {
        md += `* **Inter-rater Agreement:** ${agreement.percentAgreement}% samstemthet | Cohen's κ = **${agreement.cohensKappa}** (${agreement.interpretation})\n`;
      }

      if (consensus) {
        md += `* **Endelig Konsensusvedtak:** \`${consensus.overallVerdict}\`\n`;
        md += `* **Konsensusbegrunnelse:** ${consensus.verdictRationale}\n`;
        md += `* **Konsensusmøte:** ${consensus.meetingDate || 'Gjennomført'} | Signert av: ${consensus.signedOffBy.join(', ')}\n\n`;

        md += `#### Kriterie-for-kriterie Konsensus (JBI Q1–Q10):\n\n`;
        md += `| # | JBI Kriterium | Konsensus Status | Begrunnelse |\n`;
        md += `|---|---|---|---|\n`;
        JBI_QUESTIONS.forEach(q => {
          const itemCons = consensus.itemConsensus[q.id];
          md += `| ${q.id} | ${q.shortTitle} | **${itemCons?.status || '-'}** | ${itemCons?.rationale || '-'} |\n`;
        });
      } else {
        md += `* **Konsensusstatus:** Avventer endelig konsensusmøte.\n`;
      }

      md += `\n---\n\n`;
    });

    md += `## 4. Signaturer & Kvalitetssikring\n\n`;
    md += `Undertegnede bekrefter at kvalitetsvurderingen og konsensusprosessen er utført i henhold til gjeldende metodologiske standarder og god forskningsetikk:\n\n`;
    workspace.members.forEach(m => {
      md += `- _____________________________________\n  **${m.name}** (${m.role})\n\n`;
    });

    return md;
  }

  /**
   * Generates formal Peer Review Protocol for MS Word (.doc/html format)
   */
  public static generateProtocolWordHtml(workspace: ResearchGroupWorkspace, articles: ArticleAppraisal[]): string {
    let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>`;
    html += `<head><meta charset='utf-8'><title>Fagfellevurderingsprotokoll</title><style>`;
    html += `body { font-family: 'Times New Roman', Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #111827; }`;
    html += `h1 { font-size: 18pt; color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 6px; }`;
    html += `h2 { font-size: 14pt; color: #1e293b; margin-top: 20px; border-bottom: 1px solid #cbd5e1; }`;
    html += `h3 { font-size: 12pt; color: #334155; margin-top: 14px; }`;
    html += `table { border-collapse: collapse; width: 100%; margin: 12px 0 20px 0; }`;
    html += `th, td { border: 1px solid #94a3b8; padding: 8px; text-align: left; font-size: 10pt; }`;
    html += `th { background-color: #0f766e; color: #ffffff; }`;
    html += `tr:nth-child(even) { background-color: #f8fafc; }`;
    html += `.badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9pt; }`;
    html += `.badge-yes { background-color: #d1fae5; color: #065f46; }`;
    html += `.badge-unclear { background-color: #fef3c7; color: #92400e; }`;
    html += `.badge-no { background-color: #fee2e2; color: #991b1b; }`;
    html += `</style></head><body>`;

    html += `<h1>Fagfellevurderings- og Konsensusprotokoll</h1>`;
    html += `<p><strong>Prosjekt:</strong> ${workspace.projectName}<br>`;
    html += `<strong>Institusjon / Fagmiljø:</strong> ${workspace.institutionOrCourse || 'Helsevitenskapelig fakultet'}<br>`;
    html += `<strong>Dato:</strong> ${new Date().toLocaleDateString('no-NO')} | <strong>Standard:</strong> ${workspace.protocolPrismaTarget || 'PRISMA 2020'}</p>`;

    html += `<h2>1. Granskere & Forskningsteam</h2>`;
    html += `<table><tr><th>Gransker</th><th>Rolle</th><th>Institusjon</th><th>E-post</th></tr>`;
    workspace.members.forEach(m => {
      html += `<tr><td><strong>${m.name}</strong></td><td>${m.role}</td><td>${m.institution || '-'}</td><td>${m.email || '-'}</td></tr>`;
    });
    html += `</table>`;

    html += `<h2>2. Studie-for-studie Samstemthet og Konsensusvedtak</h2>`;

    articles.forEach((art, idx) => {
      const subs = workspace.submissions[art.id] || [];
      const consensus = workspace.consensusRecords[art.id];
      const agreement = this.calculateAgreement(subs);

      html += `<h3>${idx + 1}. ${art.shortCitation} – ${art.title}</h3>`;
      html += `<p><strong>Forfattere:</strong> ${art.authors} (${art.year}) | <strong>Tidsskrift:</strong> <em>${art.journal}</em> | <strong>DOI:</strong> ${art.doi || 'N/A'}</p>`;
      
      if (agreement) {
        html += `<p><strong>Inter-Rater Samstemthet:</strong> ${agreement.percentAgreement}% rå samstemthet | Cohen's &kappa; = <strong>${agreement.cohensKappa}</strong> (${agreement.interpretation})</p>`;
      }

      if (consensus) {
        html += `<p><strong>Endelig Konsensusvedtak:</strong> <strong>${consensus.overallVerdict}</strong> | <em>${consensus.verdictRationale}</em></p>`;
        html += `<table><tr><th>#</th><th>JBI Kriterium</th><th>Konsensus Status</th><th>Begrunnelse & Sitatreferanse</th></tr>`;
        JBI_QUESTIONS.forEach(q => {
          const itemCons = consensus.itemConsensus[q.id];
          const st = itemCons?.status || '-';
          const badgeClass = st === 'Ja' ? 'badge-yes' : st === 'Nei' ? 'badge-no' : 'badge-unclear';
          html += `<tr><td>${q.id}</td><td>${q.shortTitle}</td><td><span class='badge ${badgeClass}'>${st}</span></td><td>${itemCons?.rationale || '-'}</td></tr>`;
        });
        html += `</table>`;
      }
    });

    html += `<h2>3. Formelle Signaturer</h2>`;
    html += `<p>Protokollen er gjennomgått og godkjent av samtlige granskere:</p>`;
    html += `<table style='border: none;'>`;
    workspace.members.forEach(m => {
      html += `<tr style='border: none;'><td style='border: none; padding: 20px 0 5px 0;'>________________________________________________<br><strong>${m.name}</strong> (${m.role})</td></tr>`;
    });
    html += `</table>`;

    html += `</body></html>`;
    return html;
  }
}
