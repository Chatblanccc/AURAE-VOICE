export type ScenarioLevel = 'beginner' | 'intermediate' | 'advanced';

export type ScenarioCategory =
  | 'daily-life'
  | 'travel'
  | 'workplace'
  | 'academic'
  | 'social'
  | 'services'
  | 'healthcare'
  | 'emergency';

export interface ScenarioBriefInput {
  scenarioId: string;
  category: ScenarioCategory;
  level: ScenarioLevel;
  userGoal: string;
  businessConstraints: string[];
}

export interface ScenarioBrief {
  scenarioId: string;
  category: ScenarioCategory;
  level: ScenarioLevel;
  learnerGoal: string;
  personaRole: string;
  successCriteria: string[];
  bannedBehaviors: string[];
}

export interface DialogueTurn {
  speaker: 'ai' | 'user';
  text: string;
  intent: string;
}

export interface DialogueVariant {
  variantId: string;
  label: string;
  turns: DialogueTurn[];
}

export interface DialogueDraft {
  scenarioId: string;
  openingLine: string;
  mainDialogue: DialogueTurn[];
  variants: DialogueVariant[];
}

export interface CoachingRule {
  category: 'grammar' | 'pronunciation' | 'fluency' | 'interaction';
  trigger: string;
  coachReplyTemplate: string;
}

export interface FeedbackPack {
  scenarioId: string;
  correctionRules: CoachingRule[];
  encouragementTemplates: string[];
  escalationSuggestion: string;
}

export interface LocalizedScenarioCopy {
  scenarioId: string;
  title: { en: string; zh: string };
  summary: { en: string; zh: string };
  tags: string[];
}

export interface QualityReport {
  scenarioId: string;
  duplicateRisk: 'low' | 'medium' | 'high';
  levelMatch: 'pass' | 'needs-review';
  terminologyConsistency: 'pass' | 'needs-review';
  issues: string[];
}

export interface FinalScenarioCard {
  scenarioId: string;
  category: ScenarioCategory;
  level: ScenarioLevel;
  personaRole: string;
  userGoal: string;
  successCriteria: string[];
  openingLine: string;
  dialogueVariants: DialogueVariant[];
  feedbackRules: CoachingRule[];
  copy: LocalizedScenarioCopy;
  quality: QualityReport;
}

export interface AgentSpec<TIn, TOut> {
  name: string;
  description: string;
  inputSchema: string[];
  outputSchema: string[];
  runbook: string[];
  handoffTo: string;
}

export const AGENT_PIPELINE_SPECS: readonly AgentSpec<any, any>[] = [
  {
    name: 'AgentA_ScenarioPlanner',
    description: 'Create scenario brief from category, level, and business constraints.',
    inputSchema: ['scenarioId', 'category', 'level', 'userGoal', 'businessConstraints'],
    outputSchema: ['scenarioId', 'category', 'level', 'learnerGoal', 'personaRole', 'successCriteria', 'bannedBehaviors'],
    runbook: [
      'Map user goal to one concrete speaking objective.',
      'Choose one AI persona role that matches real-world context.',
      'Set 3-5 success criteria that can be observed in dialogue.',
      'List safety boundaries and avoid overpromising unsupported feedback.',
    ],
    handoffTo: 'AgentB_DialogueWriter',
  },
  {
    name: 'AgentB_DialogueWriter',
    description: 'Generate main dialogue and 2-3 branch variants.',
    inputSchema: ['ScenarioBrief'],
    outputSchema: ['scenarioId', 'openingLine', 'mainDialogue', 'variants'],
    runbook: [
      'Produce 8-12 turns main dialogue with realistic pacing.',
      'Create at least two variants: common mistake path and confidence path.',
      'Keep user turns beginner-friendly for lower levels.',
      'Tag each turn with intent for downstream coaching.',
    ],
    handoffTo: 'AgentC_CoachingDesigner',
  },
  {
    name: 'AgentC_CoachingDesigner',
    description: 'Build grammar/pronunciation/fluency/interaction coaching rules.',
    inputSchema: ['DialogueDraft'],
    outputSchema: ['scenarioId', 'correctionRules', 'encouragementTemplates', 'escalationSuggestion'],
    runbook: [
      'Define concise correction templates with positive tone.',
      'Add pronunciation hints only when text-level signal is clear.',
      'Limit each rule to one actionable correction point.',
      'Add one escalation suggestion for next-day training plan.',
    ],
    handoffTo: 'AgentD_QALocalizer',
  },
  {
    name: 'AgentD_QALocalizer',
    description: 'Run bilingual localization and quality checks.',
    inputSchema: ['ScenarioBrief', 'DialogueDraft', 'FeedbackPack'],
    outputSchema: ['LocalizedScenarioCopy', 'QualityReport'],
    runbook: [
      'Generate aligned EN/ZH titles and summaries.',
      'Check level vocabulary against scenario level target.',
      'Flag repeated structures across existing scenario corpus.',
      'Normalize terms with product glossary.',
    ],
    handoffTo: 'AgentE_Packager',
  },
  {
    name: 'AgentE_Packager',
    description: 'Assemble final scenario card for publishing.',
    inputSchema: ['ScenarioBrief', 'DialogueDraft', 'FeedbackPack', 'LocalizedScenarioCopy', 'QualityReport'],
    outputSchema: ['FinalScenarioCard'],
    runbook: [
      'Merge all artifacts into one schema-stable object.',
      'Reject cards with high duplicate risk or failed level match.',
      'Ensure required fields are complete for app rendering.',
      'Write card to JSON/Markdown/CMS payload format.',
    ],
    handoffTo: 'PublishingQueue',
  },
] as const;
