import { ArticleData } from '../types';

export const PRELOADED_ARTICLES: ArticleData[] = [
  {
    id: 'overhaug-2024',
    title: "'There’s a will, but not a way': Norwegian GPs' experiences of collaboration with child welfare services – a grounded theory study",
    authors: 'Oda Martine Steinsdatter Øverhaug, Johanna Laue, Svein Arild Vis & Mette Bech Risør',
    journal: 'BMC Primary Care',
    year: 2024,
    doi: '10.1186/s12875-024-02269-9',
    abstract: 'Background: Adverse childhood experiences can have immediate effects on a child’s wellbeing and health and may also result in disorders and illness in adult life. General practitioners are in a good position to identify and support vulnerable children and parents and to collaborate with other agencies such as child welfare services. The aim of this study is to explore GPs’ experiences of the collaboration process with child welfare services.',
    defaultClassification: 'Kvalitativ forskningsartikkel',
    methodology: 'Qualitative grounded theory study following Corbin and Strauss (2008), consisting of ten semi-structured interviews with general practitioners across Norway. Purposive sampling across urban and rural locations. Data analyzed through open, axial, and selective coding, constant comparative analysis, and theoretical integration leading to a core conceptual model.',
    keyFindings: [
      "Main concern: 'There’s a will, but not a way' – GPs have a strong professional will to collaborate and contribute patient knowledge, but feel there is no functional pathway or two-way channel.",
      "Stage I: Familiar territory – Extensive, long-term relationships with patients/families, practicing whole-person care (biopsychosocial approach).",
      "Stage II: Unfamiliar territory – Child welfare services (CWS) involvement creates a 'one-way window of information' and a 'closed door to dialogue' due to strict confidentiality interpretations and lack of electronic communication.",
      "Stage III: Fragmented territory – Resulting in lost opportunities to help, missing pieces in patient history, and difficulty triaging vulnerable patients.",
      "Proposed solution: Secure electronic two-way communication compatible with GP electronic patient record systems."
    ],
    fullText: `
Øverhaug et al. BMC Primary Care (2024) 25:36
Background: Adverse childhood experiences can have immediate effects on a child's wellbeing and health. General practitioners (GPs) are in a good position to identify and support vulnerable children. The aim of this study is to explore GPs' experiences of the collaboration process with child welfare services (CWS).
Method: Qualitative grounded theory study with ten semi-structured interviews with general practitioners across Norway. Analysis based on Corbin and Strauss.
Results: The doctors' main concern was: 'There's a will, but not a way'. Three subordinate stages: (I) Familiar territory with whole-person care; (II) Unfamiliar territory with a one-way window of information and closed door to dialogue; (III) Fragmented territory leading to lost opportunities to help and missing pieces in the patient's history.
Conclusion: GPs are willing to contribute, but collaboration is hampered by poor information flow, lack of dialogue opportunities, and limited knowledge of the partner. Electronic two-way communication meeting confidentiality standards is recommended to bridge sectors.
    `.trim()
  },
  {
    id: 'sahota-2026',
    title: 'Maternal nutrition practices and behaviours in the context of a Cash-Plus intervention: a qualitative study in Rajasthan, India',
    authors: 'Rupinder Sahota, Akash Porwal, Namita Wadhwa, Anshita Sharma, Raghwesh Ranjan, Divya Santhanam, Mahendra Soni, Ashash Bandhu, Christian Bottomley, Tanya Marchant & Arindam Das',
    journal: 'Global Health Action',
    year: 2026,
    doi: '10.1080/16549716.2026.2693447',
    abstract: 'Background: In low- and middle-income countries, breaking the intergenerational cycle of malnutrition requires the promotion of healthy nutrition practices and behaviours during pregnancy and early motherhood. Objective: This study aimed to explore nutrition practices and behaviours among pregnant women and mothers of children under 2 years who were exposed to the Cash-Plus intervention in tribal districts of Rajasthan, India.',
    defaultClassification: 'Kvalitativ forskningsartikkel',
    methodology: 'Qualitative study using in-depth interviews (IDIs) with 46 women (pregnant and mothers of young children), 36 husbands, 34 other family members, plus 7 focus group discussions (FGDs) with 23 frontline workers across four intervention districts in Rajasthan, India. Hybrid deductive-inductive thematic analysis using framework matrix.',
    keyFindings: [
      "Four pathways to behaviour change: (1) Knowledge acquisition and reinforcement through repeated counselling; (2) Economic enablement through cash transfers; (3) Shifts in intra-household dynamics, including greater involvement of husbands and mothers-in-law; (4) Normative influences including peer learning and community-level diffusion.",
      "Counselling primarily drove behavioral initiation while cash transfers acted as practical enablers for purchasing nutritious foods (fruits, milk, nuts).",
      "Contextual challenges: Traditional socio-cultural practices ('Nata Pratha'), migration of pregnant women to maternal homes across state boundaries causing eligibility barriers.",
      "Policy implications: Need for inclusive, family-centred, flexible delivery mechanisms to reach the most vulnerable populations."
    ],
    fullText: `
Sahota et al. Global Health Action (2026)
Background: Breaking the intergenerational cycle of malnutrition requires promoting healthy nutrition practices during pregnancy and early motherhood.
Objective: Explore nutrition practices and behaviours among pregnant women and mothers of children under 2 years exposed to a Cash-Plus intervention in Rajasthan, India.
Methods: In-depth interviews (IDIs) with 46 women, 36 husbands, 34 family members, and 7 FGDs with 23 frontline workers. Hybrid deductive-inductive thematic analysis.
Results: Four pathways to behavior change emerged: knowledge acquisition via counseling, economic enablement via cash transfers, intra-household dynamics (husbands/mothers-in-law support), and community-level diffusion. Counselling drove initiation while cash enabled purchasing.
Conclusion: Cash-Plus interventions addressing both knowledge and structural barriers through family-centred approaches can successfully improve maternal and child nutrition practices in vulnerable settings.
    `.trim()
  }
];
