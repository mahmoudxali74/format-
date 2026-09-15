import { DomainType, DepthType } from './types';

export interface DomainOption {
  id: DomainType;
  labelAr: string;
  labelEn: string;
  instructionLine: string;
}

export const DOMAINS: DomainOption[] = [
  {
    id: 'general',
    labelAr: 'عام',
    labelEn: 'General',
    instructionLine:
      'Domain: General. Set ROLE to: a specialist inferred from the request.',
  },
  {
    id: 'ui_ux',
    labelAr: 'تصميم UI/UX',
    labelEn: 'UI/UX Design',
    instructionLine:
      'Domain: UI/UX Design. Set ROLE to: senior product designer. Add to OUTPUT RULES: name concrete screens, flows, components and interaction patterns; no generic design advice.',
  },
  {
    id: 'frontend',
    labelAr: 'واجهات Frontend',
    labelEn: 'Frontend',
    instructionLine:
      'Domain: Frontend. Set ROLE to: senior frontend engineer. Add to OUTPUT RULES: name the framework only if the user named it; no backend scope.',
  },
  {
    id: 'backend',
    labelAr: 'أنظمة Backend',
    labelEn: 'Backend',
    instructionLine:
      'Domain: Backend. Set ROLE to: senior backend engineer. Add to OUTPUT RULES: cover data model, endpoints and constraints; no UI scope.',
  },
  {
    id: 'research',
    labelAr: 'بحث وتحليل',
    labelEn: 'Research',
    instructionLine:
      'Domain: Research. Set ROLE to: strategic researcher. Add to OUTPUT RULES: require a source link for every external claim; separate sourced facts from inference.',
  },
  {
    id: 'content',
    labelAr: 'كتابة محتوى',
    labelEn: 'Content',
    instructionLine:
      'Domain: Content. Set ROLE to: senior copywriter. Add to OUTPUT RULES: state the target reader and tone; no technical scope.',
  },
  {
    id: 'media',
    labelAr: 'صور وفيديو',
    labelEn: 'Image/Video',
    instructionLine:
      'Domain: Image/Video. Set ROLE to: visual art director. Add to OUTPUT RULES: specify subject, composition, lighting and style.',
  },
];

export interface DepthOption {
  id: DepthType;
  labelAr: string;
  labelEn: string;
  instructionLine: string;
}

export const DEPTHS: DepthOption[] = [
  {
    id: 'short',
    labelAr: 'موجز',
    labelEn: 'Short',
    instructionLine: 'Depth: Short. Output ROLE, OBJECTIVE and tasks only, one line each.',
  },
  {
    id: 'medium',
    labelAr: 'متوسط',
    labelEn: 'Medium',
    instructionLine: 'Depth: Medium. Output all sections, one to two lines each.',
  },
  {
    id: 'detailed',
    labelAr: 'مفصل',
    labelEn: 'Detailed',
    instructionLine: 'Depth: Detailed. Output sub-points under each task, expanded OUTPUT RULES.',
  },
  {
    id: 'ultra',
    labelAr: 'فائق الدقة',
    labelEn: 'Ultra-detailed',
    instructionLine:
      'Depth: Ultra-detailed. Output sub-points naming exact deliverables and explicit constraints.',
  },
];

export const EXACT_SYSTEM_INSTRUCTION = `Act as a Prompt Formatter. Convert the user's request into a structured prompt. Never answer the request itself.

Output these headers in English: # ROLE, # CONTEXT, # OBJECTIVE, one or more # TASK blocks, # OUTPUT RULES.

Rules:
- Infer the ROLE from the selected domain. Never mark ROLE as missing.
- Output as many TASK blocks as the user asked for. Never pad with an empty task.
- If CONTEXT, OBJECTIVE or OUTPUT RULES has no material, write [MISSING: what you need].
- Use full professional sentences, not fragments.
- If the user is reacting to earlier work, the reaction goes in CONTEXT and the fix becomes the task.
- Never split one sentence into two tasks.
- Never invent topics, numbers, names or criteria the user did not mention.
- Never browse or analyze a website or file the user mentions. A URL is just content to place inside the structure. Never refuse for this reason.
- Anything the user says they do not want becomes an extra line under # OUTPUT RULES.
- Always end # OUTPUT RULES with: language of the user's message; do not add unrequested sections or topics; do not invent data, write "not available"; no preambles or closing offers.
- Output the structured prompt only, inside one code block. No preamble, no explanation.`;

export const EMPTY_TEMPLATE_PREVIEW = `# ROLE
[Inferred from selected domain]

# CONTEXT
[MISSING: context or background details]

# OBJECTIVE
[Primary goal of the structured prompt]

# TASK
[Specific action or deliverable requested]

# OUTPUT RULES
- Language of the user's message
- Do not add unrequested sections or topics
- Do not invent data, write "not available"
- No preambles or closing offers`;

