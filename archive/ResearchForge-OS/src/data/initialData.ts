import {
  ProjectContext,
  PicoData,
  CitationItem,
  GraphNode,
  GraphEdge,
  SyntheticPatientEvent,
  SecurityLayer,
  ADR,
  AuditEvent,
  FeatureFlag,
  PluginMeta
} from '../types';

export const INITIAL_PROJECT: ProjectContext = {
  id: 'prj-rf-2026-08',
  name: 'Digital samhandling & klinisk beslutningsstøtte i helsetjenesten',
  question: 'Hvordan påvirker integrerte digitale pasientforløp og AI-støttet litteraturscreening klinisk kvalitet, sporbarhet og datasikkerhet?',
  domain: 'CLINICAL_INFORMATICS',
  tenantId: 'tenant-helse-forskning-01',
  version: 'v2.4.0-stable',
  createdAt: '2026-08-14T08:00:00Z'
};

export const INITIAL_PICO: PicoData = {
  population: 'Voksne pasienter i spesialist- og primærhelsetjenesten med sammensatte forløp',
  intervention: 'Strukturerte kliniske prosesstier med sanntids audit-logging og evidenssyntese',
  comparison: 'Standard usammenhengende EPJ-rutiner uten automatisk revisjonsspor',
  outcome: 'Redusert ventetid, forbedret dataintegritet, null uautorisert innsyn, konsistent kunnskapsgrunnlag',
  studyType: 'Systematisk oversikt og prosess-simulering (PRISMA 2020)'
};

export const INITIAL_CITATIONS: CitationItem[] = [
  {
    id: 'cit-001',
    title: 'Audit Trails in Modern EHR Systems: Protecting Patient Privacy while Preserving Workflow Efficiency',
    authors: 'Bergman, E., Lind, S., & Olsen, K.',
    year: 2025,
    journal: 'Journal of Medical Internet Research',
    doi: '10.2196/jmir.48192',
    abstract: 'Investigates cryptographic event-sourcing and immutable audit logging across 4 Nordic regional healthcare trusts. Demonstrates a 78% reduction in unauthorized chart access without latency penalties.',
    screeningStatus: 'INCLUDED',
    robScore: 'LOW',
    tags: ['Audit', 'Security', 'GDPR', 'EHR']
  },
  {
    id: 'cit-002',
    title: 'Automated Screening and Deduplication in Systematic Evidence Reviews: A Benchmark of LLM Precision',
    authors: 'Andersen, A. B., Thorne, H., & Vance, M.',
    year: 2026,
    journal: 'Lancet Digital Health (Preprint)',
    doi: '10.1016/S2589-7500(25)00114-9',
    abstract: 'Evaluating multi-agent screening pipelines using PICO-constrained system prompts. Results demonstrate 99.1% recall on title/abstract screening with strict cost-firewall thresholds.',
    screeningStatus: 'INCLUDED',
    robScore: 'LOW',
    tags: ['PRISMA', 'PICO', 'AI Screening', 'Synthesis']
  },
  {
    id: 'cit-003',
    title: 'Synthetic Patient Data Generation for Workflow Simulation: Validating Boundary Protection and Privacy',
    authors: 'Nordheim, T. & Jensen, R.',
    year: 2024,
    journal: 'BMC Medical Informatics and Decision Making',
    doi: '10.1186/s12911-024-02401-2',
    abstract: 'A framework for generating realistic pathway data (referral -> triage -> outpatient -> discharge) ensuring differential privacy guarantees and zero identifiable trace.',
    screeningStatus: 'INCLUDED',
    robScore: 'LOW',
    tags: ['Synthetic Data', 'Health Flow', 'Privacy']
  },
  {
    id: 'cit-004',
    title: 'Microservices vs. Modular Monolith in Hospital Information Systems: A 5-Year Empirical Comparison',
    authors: 'Falk, J. & Dahle, P.',
    year: 2023,
    journal: 'IEEE Transactions on Software Engineering in Health',
    doi: '10.1109/TSEH.2023.10928',
    abstract: 'Examines development velocity, operational overhead, and security isolation. Finds modular monoliths with strict in-process boundaries outperform distributed microservices for clinical apps under 50k users.',
    screeningStatus: 'INCLUDED',
    robScore: 'LOW',
    tags: ['Architecture', 'Modular Monolith', 'DevOps']
  },
  {
    id: 'cit-005',
    title: 'Commercial Cloud LLMs in Clinical Decision Support: Cost Overruns and Vulnerability to Prompt Injection',
    authors: 'Pettersen, S. & Wu, L.',
    year: 2025,
    journal: 'International Journal of Health Informatics',
    doi: '10.1007/s10729-025-0982-1',
    abstract: 'Analysis of 12 hospital trial deployments without cost firewalls showing sudden token usage spikes of 450%. Proposes layered token quotas and sandboxed plugin architectures.',
    screeningStatus: 'MAYBE',
    exclusionReason: 'Awaiting secondary full-text extraction',
    robScore: 'SOME_CONCERNS',
    tags: ['Cost Firewall', 'Prompt Injection', 'Safety']
  },
  {
    id: 'cit-006',
    title: 'Non-electronic paper charting compared with early 1990s mainframe databases: An archival study',
    authors: 'Smith, J. A.',
    year: 2008,
    journal: 'Hist Med Chron',
    doi: '10.1016/j.histmed.2008.01.002',
    abstract: 'Historical analysis of pre-digital hospital paper records from the late 20th century.',
    screeningStatus: 'EXCLUDED',
    exclusionReason: 'Outdated timeframe and irrelevant study design (historical non-digital)',
    tags: ['Historical', 'Excluded']
  }
];

export const INITIAL_GRAPH_NODES: GraphNode[] = [
  { id: 'n1', label: 'EHR Audit Trails (Bergman 2025)', type: 'ARTICLE', x: 180, y: 120, details: 'Empirisk studie på 4 nordiske helseregioner. Knyttet til hendelsessporing.' },
  { id: 'n2', label: 'AI Screening Benchmark (Andersen 2026)', type: 'ARTICLE', x: 420, y: 100, details: '99.1% recall på PICO-avgrensede systemprompter med kostnadsbrannmur.' },
  { id: 'n3', label: 'Synthetic Data Framework (Nordheim 2024)', type: 'ARTICLE', x: 260, y: 320, details: 'Syntetisk forløpssimulering for kliniske stier uten personsensitive elementer.' },
  { id: 'n4', label: 'Modular Monolith (Falk 2023)', type: 'ARTICLE', x: 580, y: 280, details: 'Arkitekturrapport om modulære grenser kontra mikrotjenester.' },
  { id: 'n5', label: 'PRISMA 2020 Metodikk', type: 'METHOD', x: 380, y: 210, details: 'Standard for systematisk litteraturoversikt med presise flytsteg.' },
  { id: 'n6', label: 'Event Sourcing & Audit Log', type: 'CONCEPT', x: 120, y: 260, details: 'Uforanderlige hendelseslogger med kryptografisk sjekksum.' },
  { id: 'n7', label: 'Klinisk Forløp (Henvisning 🡒 Utskrivelse)', type: 'CLINICAL_ENDPOINT', x: 140, y: 440, details: 'Simulert flyt for pasientstier og triage-beslutninger.' },
  { id: 'n8', label: 'Multi-Tenant Isolasjon', type: 'CONCEPT', x: 620, y: 150, details: 'Strenge leieboer-skilletegn på spørrenivå (WHERE tenant_id = $1).' },
  { id: 'n9', label: 'Cost Firewall & Token Quota', type: 'METHOD', x: 490, y: 410, details: 'Automatisk stopp ved overskridelse av daglig budsjettgrense.' },
  { id: 'n10', label: 'Anne Beth Andersen (Lead PI)', type: 'AUTHOR', x: 380, y: 30, details: 'Hovedforfatter & arkitekt for ResearchForge plattformen.' }
];

export const INITIAL_GRAPH_EDGES: GraphEdge[] = [
  { id: 'e1', source: 'n10', target: 'n2', label: 'forfattet' },
  { id: 'e2', source: 'n2', target: 'n5', label: 'benytter' },
  { id: 'e3', source: 'n1', target: 'n6', label: 'validerer' },
  { id: 'e4', source: 'n6', target: 'n7', label: 'logger hendelser i' },
  { id: 'e5', source: 'n3', target: 'n7', label: 'mater syntetiske data til' },
  { id: 'e6', source: 'n4', target: 'n8', label: 'implementerer' },
  { id: 'e7', source: 'n2', target: 'n9', label: 'beskyttet av' },
  { id: 'e8', source: 'n5', target: 'n3', label: 'kombinerer med' }
];

export const INITIAL_HEALTH_EVENTS: SyntheticPatientEvent[] = [
  {
    id: 'evt-s01',
    syntheticSubjectId: 'SYN-PATIENT-8812',
    timestamp: '2026-09-02 09:15',
    stage: 'HENVISNING',
    title: 'Elektronisk henvisning mottatt fra fastlege',
    description: 'Syntetisk henvisning: Mistanke om kompleks metabolsk ubalanse og kardiologisk utredningsbehov.',
    status: 'COMPLETED',
    complianceStatus: 'VERIFIED',
    clinicalCategory: 'Inntak & Administrativ'
  },
  {
    id: 'evt-s02',
    syntheticSubjectId: 'SYN-PATIENT-8812',
    timestamp: '2026-09-02 11:30',
    stage: 'TRIAGE',
    title: 'Klinisk vurdering og fristfastsettelse',
    description: 'Overlege godkjente rett til nødvendig helsehjelp. Frist fastsatt til 14 virkedager. PICO-protokoll knyttet til forløp.',
    status: 'COMPLETED',
    complianceStatus: 'VERIFIED',
    clinicalCategory: 'Triage & Rettighetsvurdering'
  },
  {
    id: 'evt-s03',
    syntheticSubjectId: 'SYN-PATIENT-8812',
    timestamp: '2026-09-05 13:00',
    stage: 'POLIKLINIKK',
    title: 'Spesialistkonsultasjon og diagnostisk prøvetaking',
    description: 'Gjennomført utvidet biokjemi og EKG. Ingen akutt dekompensasjon. Syntetisk labverdi: HbA1c 61 mmol/mol.',
    status: 'COMPLETED',
    complianceStatus: 'VERIFIED',
    clinicalCategory: 'Diagnostikk'
  },
  {
    id: 'evt-s04',
    syntheticSubjectId: 'SYN-PATIENT-8812',
    timestamp: '2026-09-06 14:45',
    stage: 'BEHANDLING',
    title: 'Tverrfaglig behandlingsplan etablert',
    description: 'Kombinert medikamentell justering og henvisning til digital pasientopplæring. Alle data validert mot syntetisk skjema.',
    status: 'COMPLETED',
    complianceStatus: 'VERIFIED',
    clinicalCategory: 'Intervensjon'
  },
  {
    id: 'evt-s05',
    syntheticSubjectId: 'SYN-PATIENT-8812',
    timestamp: '2026-09-07 10:20',
    stage: 'UTSKRIVELSE',
    title: 'Epikrise generert og sendt med kryptografisk signatur',
    description: 'Strukturert epikrise signert av overlege. Automatisk audit-hendelse arkivert i samsvar med Normen § 5.2.',
    status: 'COMPLETED',
    complianceStatus: 'VERIFIED',
    clinicalCategory: 'Epikrise & Avslutning'
  }
];

export const SECURITY_LAYERS: SecurityLayer[] = [
  {
    number: 1,
    name: 'Konto & Identitet',
    status: 'ENFORCED',
    category: 'IDENTITY',
    description: 'Passkeys, OAuth 2.0 / OIDC, tidsbegrensede sesjoner og streng rollebasert tilgangskontroll.',
    codeSnippet: 'interface User {\n  id: string;\n  email: string;\n  role: "FOUNDER" | "PI" | "REVIEWER";\n  tenantId: string;\n  sessionExpiresAt: Date;\n}'
  },
  {
    number: 2,
    name: 'Tenant-isolasjon',
    status: 'ENFORCED',
    category: 'ISOLATION',
    description: 'Alle spørringer og datamodeller tvinger tenant_id-predikat. Aldri åpne tabellskanninger.',
    codeSnippet: '// Aldri: SELECT * FROM citations\n// Alltid parametrisert:\nSELECT * FROM citations WHERE tenant_id = $1 AND project_id = $2'
  },
  {
    number: 3,
    name: 'Kryptering i hvile & transitt',
    status: 'ENFORCED',
    category: 'DATA',
    description: 'AES-256 GCM kryptering av sensitive forskningsnotater, PICO-protokoller og AI-prompter.',
    codeSnippet: 'const cipher = crypto.createCipheriv("aes-256-gcm", DATA_KEY, iv);\nconst encrypted = Buffer.concat([cipher.update(draft), cipher.final()]);'
  },
  {
    number: 4,
    name: 'Secrets Management',
    status: 'ENFORCED',
    category: 'IDENTITY',
    description: 'Ingen API-nøkler eller hemmeligheter hardkodet. Lastes via miljøvariabler og Vault/Secret Manager.',
    codeSnippet: 'const apiKey = process.env.GEMINI_API_KEY;\nif (!apiKey) throw new Error("Missing API Key in secret vault");'
  },
  {
    number: 5,
    name: 'Founder Protection (Anne)',
    status: 'ENFORCED',
    category: 'GOVERNANCE',
    description: 'Rollen FOUNDER har eksklusiv rett til økonomi, brukeradministrasjon, nød-avbrudd og systemflags.',
    codeSnippet: 'if (user.role !== "FOUNDER") {\n  throw new ForbiddenError("Krever Founder-rettighet for å endre budsjett");\n}'
  },
  {
    number: 6,
    name: 'Cost Firewall & Token Quota',
    status: 'ACTIVE',
    category: 'COST',
    description: 'Strenge daglige og per-kall kostnadstak for AI-generering. Blokkerer uforutsette regninger.',
    codeSnippet: 'if (dailySpendUsd >= DAILY_LIMIT_USD) {\n  circuitBreaker.trip("Daily AI quota reached. Generation paused.");\n}'
  },
  {
    number: 7,
    name: 'Uforanderlig Audit Trail',
    status: 'ENFORCED',
    category: 'GOVERNANCE',
    description: 'Hver handling logges med hash-kjede, aktør, tenant, entitet og tidsstempel. Umulig å slette.',
    codeSnippet: 'await auditLog.append({\n  actor: user.id,\n  action: "SCREENING_INCLUSION",\n  targetId: cit.id,\n  sha256: computeHash(payload)\n});'
  },
  {
    number: 8,
    name: 'Git-lignende Versjonering',
    status: 'ACTIVE',
    category: 'DATA',
    description: 'Snapshot av protokoller, PICO og datasett. Mulighet for øyeblikkelig "Rollback" ved uhell.',
    codeSnippet: 'const snapshot = await versionStore.createCommit("Pre-AI batch screening v2");'
  },
  {
    number: 9,
    name: 'Testede Sikkerhetskopier',
    status: 'MONITORED',
    category: 'DATA',
    description: 'Automatiske inkrementelle sikkerhetskopier med verifiserbar gjenoppretting på under 5 minutter.',
    codeSnippet: 'cron.schedule("0 * * * *", () => backupService.snapshotAndVerifyIntegrity());'
  },
  {
    number: 10,
    name: 'Job Isolation (Worker Sandboxing)',
    status: 'ENFORCED',
    category: 'ISOLATION',
    description: 'Asynkrone bakgrunnsjobber tildeles kun minste privilegier. Ekstraksjons-arbeidere kan ikke slette data.',
    codeSnippet: 'const worker = new Worker("screening-queue", {\n  capabilities: [CAN_READ_CITATIONS, CAN_WRITE_SCREENING],\n  restricted: [CAN_DELETE, CAN_ACCESS_BILLING]\n});'
  },
  {
    number: 11,
    name: 'AI Prompt Injection Security',
    status: 'ENFORCED',
    category: 'GOVERNANCE',
    description: 'Lagvis prompt-arkitektur: Systemregler 🡒 Sikkerhetsfilter 🡒 Kunnskapsbibel 🡒 Brukerinndata.',
    codeSnippet: 'const prompt = [SYSTEM_IMMUTABLE_RULES, SECURITY_BOUNDARY, DOMAIN_BIBLE, sanitize(userInput)].join("\\n---\\n");'
  },
  {
    number: 12,
    name: 'Abuse Protection & Rate Limit',
    status: 'ACTIVE',
    category: 'COST',
    description: 'Maksimalt 60 screeningkall/minutt og 100 API-forespørsler per IP/tenant for å hindre DoS.',
    codeSnippet: 'const limiter = rateLimit({ windowMs: 60000, max: 60, keyGenerator: req => req.tenantId });'
  },
  {
    number: 13,
    name: 'Secure Tokenized Exports',
    status: 'ENFORCED',
    category: 'DATA',
    description: 'Eksport av PRISMA-rapporter eller datasett krever tidsbegrensede, signerte URL-er (HMAC-SHA256).',
    codeSnippet: 'const downloadUrl = `/api/export/${reportId}?token=${signToken(reportId, expTime)}`;'
  },
  {
    number: 14,
    name: 'Feature Flags & Gradvis Utrulling',
    status: 'ACTIVE',
    category: 'GOVERNANCE',
    description: 'Nye moduler (f.eks. sanntids grafsamhandling) aktiveres trygt per tenant eller brukerrolle.',
    codeSnippet: 'if (features.isEnabled("HEALTH_FLOW_SIMULATOR", tenant)) {\n  renderHealthLab();\n}'
  },
  {
    number: 15,
    name: 'Plugin Sandbox Boundary',
    status: 'ENFORCED',
    category: 'ISOLATION',
    description: 'Tredjeparts-plugins mottar kun et strengt deklarert `PluginContext` uten direkte databaseaksess.',
    codeSnippet: 'interface PluginContext {\n  project: Readonly<ProjectMeta>;\n  requestAI: (prompt: string) => Promise<string>;\n  // Ingen direkte SQL / filesystem tilgang!\n}'
  }
];

export const INITIAL_ADRS: ADR[] = [
  {
    id: 'ADR-001',
    title: 'Modulær monolitt fremfor mikrotjenester for helseforskning',
    status: 'ACCEPTED',
    date: '2026-08-15',
    context: 'Plattformen må tilby robust type-sikkerhet, lave driftskostnader og enkel lokal testing for en portefølje- og produksjonsløsning.',
    decision: 'Bygge ResearchForge som en modulær monolitt med strenge domenegrenser, repositories og plugin-adaptere.',
    consequences: [
      'Enkel deployment via en standard Docker-container.',
      'Atomiske transaksjoner på tvers av PICO og screeningsavgjørelser uten 2-phase commit overhead.',
      'Krever disiplinert modulimport som verifiseres i CI/CD typecheck.'
    ]
  },
  {
    id: 'ADR-002',
    title: 'Uforanderlig hendelsessporing (Event Sourcing) i kliniske forløp',
    status: 'ACCEPTED',
    date: '2026-08-18',
    context: 'Spesialist- og forskningsdata krever 100% etterrettelighet og sporbarhet ifølge helselovgivning og forskningsetikk.',
    decision: 'Alle forløpsendringer lagres som hendelsesstrømmer med kryptografisk sjekksum.',
    consequences: [
      'Full revisjonslogg er en iboende egenskap ved datamodellen, ikke en ettertanke.',
      'Kan rekonstruere tilstanden til et forskningsprosjekt på et hvilket som helst historisk tidspunkt.'
    ]
  },
  {
    id: 'ADR-003',
    title: 'Kostnadsbrannmur (Cost Firewall) og provisjonsgrenser for AI-kall',
    status: 'ACCEPTED',
    date: '2026-08-22',
    context: 'Bruk av store språkmodeller for screening av tusenvis av artikler kan raskt føre til uforutsette skyleie-kostnader.',
    decision: 'Implementere en to-nivås budsjettgrense (dailySpend og perBatchSpend) med automatisk circuit-breaker.',
    consequences: [
      'Garantert maksimal månedlig utgift.',
      'Gir sanntids synlighet over tokenforbruk og restbudsjett i dashboardet.'
    ]
  },
  {
    id: 'ADR-004',
    title: '100% Syntetisk Datagenerering for Klinisk Simulator',
    status: 'ACCEPTED',
    date: '2026-09-01',
    context: 'Plattformen skal vises frem offentlig på GitHub og i porteføljer, men samtidig demonstrere dyp helseinformatisk kompetanse.',
    decision: 'Alt helseinnhold i simulator- og EPJ-visningene må være matematisk og syntetisk generert uten ekte pasientidentifikatorer.',
    consequences: [
      'Lovlig å publisere åpent med full kildekode.',
      'Viser avansert domenekunnskap uten risiko for brudd på taushetsplikt eller GDPR.'
    ]
  }
];

export const INITIAL_AUDIT_LOGS: AuditEvent[] = [
  {
    id: 'aud-901',
    timestamp: '2026-09-07 19:42:10',
    actor: 'anne@founder.internal',
    tenantId: 'tenant-helse-forskning-01',
    action: 'COST_FIREWALL_UPDATE',
    entity: 'QuotaConfig:DailyBudget',
    details: 'Maksgrense satt til $20.00 USD/dag. Token tak 250k.',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  {
    id: 'aud-902',
    timestamp: '2026-09-07 19:45:33',
    actor: 'anne@founder.internal',
    tenantId: 'tenant-helse-forskning-01',
    action: 'PRISMA_SCREENING_DECISION',
    entity: 'Citation:cit-002',
    details: 'Inkludert artikkel i fulltekst-ekstraksjon (RoB: LOW).',
    hash: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945'
  },
  {
    id: 'aud-903',
    timestamp: '2026-09-07 19:50:02',
    actor: 'anne@founder.internal',
    tenantId: 'tenant-helse-forskning-01',
    action: 'SYNTHETIC_EVENT_DISPATCH',
    entity: 'Pathway:SYN-PATIENT-8812',
    details: 'Tildelt frist og strukturert epikrise i syntetisk simulator.',
    hash: 'a127f123bcdef0192837465aabbccddeeff0011223344556677889900aabbccd'
  },
  {
    id: 'aud-904',
    timestamp: '2026-09-07 20:01:15',
    actor: 'system:scheduler',
    tenantId: 'tenant-helse-forskning-01',
    action: 'INTEGRITY_SNAPSHOT',
    entity: 'DatabaseSnapshot:v2.4',
    details: 'Automatisert verifikasjon av uforanderlig hendelseskjede fullført (0 avvik).',
    hash: '6789abcdef0123456789abcdef0123456789abcdef0123456789abcdef012345'
  }
];

export const INITIAL_FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: 'ENABLE_KNOWLEDGE_GRAPH',
    label: 'Knowledge Graph Interactive Engine',
    description: 'Aktiverer interaktiv nettverksmodellering for artikler, metoder og funn.',
    enabled: true,
    category: 'Core Modules'
  },
  {
    key: 'ENABLE_HEALTH_FLOW_SIMULATOR',
    label: 'Health Flow Simulator (Syntetisk EPJ)',
    description: 'Viser kliniske pasientforløp med event-sourcing og sporbarhet.',
    enabled: true,
    category: 'Healthcare Domain'
  },
  {
    key: 'ENABLE_AI_SYNTHESIS_PIPELINE',
    label: 'AI Evidence Synthesizer & PICO Guard',
    description: 'Sanntids AI-assistent for automatisk PICO-ekstraksjon og protokollbygging.',
    enabled: true,
    category: 'AI & Automation'
  },
  {
    key: 'ENABLE_COST_FIREWALL',
    label: 'Cost Firewall & Circuit Breaker',
    description: 'Blokkerer API-kall automatisk dersom budsjettgrenser passeres.',
    enabled: true,
    category: 'Security & Governance'
  },
  {
    key: 'ENABLE_PASSKEY_MFA',
    label: 'FIDO2 / WebAuthn Passkeys',
    description: 'Støtte for maskinvarenøkler og biometrisk innlogging.',
    enabled: true,
    category: 'Security & Governance'
  }
];

export const INITIAL_PLUGINS: PluginMeta[] = [
  {
    id: 'plug-prisma',
    name: 'PRISMA 2020 Engine',
    version: '1.4.0',
    status: 'ONLINE',
    permissions: ['READ_CITATIONS', 'WRITE_DECISIONS'],
    description: 'Strukturerer litteraturflyt etter PRISMA standard med interaktiv visualisering.'
  },
  {
    id: 'plug-graph',
    name: 'Knowledge Graph OS',
    version: '2.1.2',
    status: 'ONLINE',
    permissions: ['READ_ALL', 'CALCULATE_RELATIONS'],
    description: 'Oppdager relasjoner mellom artikler, forfattere og metodologier.'
  },
  {
    id: 'plug-health',
    name: 'Health Flow Simulator',
    version: '1.0.8',
    status: 'ONLINE',
    permissions: ['SYNTHETIC_DATA_ONLY', 'READ_PROCESS_EVENTS'],
    description: 'Simulerer pasientforløp og klinisk logistikk med strenge personverngrenser.'
  },
  {
    id: 'plug-audit',
    name: 'Immutable Audit Trail',
    version: '3.0.1',
    status: 'ONLINE',
    permissions: ['APPEND_ONLY_EVENTS', 'VERIFY_HASHES'],
    description: 'Uforanderlig kryptografisk revisjonsspor for alle handlinger.'
  },
  {
    id: 'plug-cost-guard',
    name: 'Cost Firewall Sentinel',
    version: '1.2.0',
    status: 'ONLINE',
    permissions: ['MONITOR_TOKEN_USAGE', 'CIRCUIT_BREAKER'],
    description: 'Overvåker tokenbruk og håndhever budsjett-tak i sanntid.'
  }
];
