// defaults.js — Config templates and color maps

export function getStatusLineConfig() {
  return {
    type: 'command',
    command: 'npx -y ccstatusline@latest',
    padding: 0
  };
}

export function getWidgetDefinitions(readerPath) {
  return [{
    id: 'bmad-line-0',
    type: 'custom-command',
    commandPath: `node "${readerPath}" line 0`,
    preserveColors: true
  }];
}

export function getHookConfig(hookPath) {
  return {
    hooks: {
      UserPromptSubmit: [
        { matcher: '(?:bmad|gds|wds)-', hooks: [{ type: 'command', command: `node "${hookPath}"` }] }
      ],
      PostToolUse: [
        { matcher: 'Read', hooks: [{ type: 'command', command: `node "${hookPath}"` }] },
        { matcher: 'Write', hooks: [{ type: 'command', command: `node "${hookPath}"` }] },
        { matcher: 'Edit', hooks: [{ type: 'command', command: `node "${hookPath}"` }] }
      ],
      SessionStart: [
        { matcher: 'resume', hooks: [{ type: 'command', command: `node "${hookPath}"` }] }
      ]
    }
  };
}

export const AGENT_COLORS = {
  'Amelia': '\x1b[36m',       // cyan — dev
  'Bob': '\x1b[32m',          // green — scrum master
  'John': '\x1b[33m',         // yellow — PM
  'Quinn': '\x1b[31m',        // red — QA
  'Winston': '\x1b[35m',      // magenta — architect
  'Mary': '\x1b[34m',         // blue — analyst
  'Sally': '\x1b[95m',        // brightMagenta — UX
  'Paige': '\x1b[37m',        // white — tech writer
  'Barry': '\x1b[96m',        // brightCyan — quick flow
  'Carson': '\x1b[93m',       // brightYellow — brainstorming
  'Murat': '\x1b[91m',        // brightRed — test architect
  'Maya': '\x1b[92m',         // brightGreen — design thinking
  'Victor': '\x1b[94m',       // brightBlue — innovation
  'Sophia': '\x1b[95m',       // brightMagenta — storyteller
  'Dr. Quinn': '\x1b[97m',    // brightWhite — problem solver
  'Caravaggio': '\x1b[33m',   // yellow — presentation
};

export const WORKFLOW_COLORS = {
  // Dev (cyan)
  'dev-story': '\x1b[36m',
  'quick-dev': '\x1b[36m',
  // Review (brightRed)
  'code-review': '\x1b[91m',
  // Planning (green)
  'sprint-planning': '\x1b[32m',
  'sprint-status': '\x1b[32m',
  'create-story': '\x1b[32m',
  'create-epics': '\x1b[32m',
  // Product (yellow)
  'create-prd': '\x1b[33m',
  'edit-prd': '\x1b[33m',
  'validate-prd': '\x1b[33m',
  // Architecture (magenta)
  'create-architecture': '\x1b[35m',
  'create-ux-design': '\x1b[35m',
  // Research (blue)
  'domain-research': '\x1b[34m',
  'technical-research': '\x1b[34m',
  'market-research': '\x1b[34m',
  // Creative (brightYellow)
  'brainstorming': '\x1b[93m',
  'party-mode': '\x1b[93m',
  'retrospective': '\x1b[93m',
  // Documentation (brightGreen)
  'document-project': '\x1b[92m',
  'generate-project-context': '\x1b[92m',
};

export const WORKFLOW_PREFIX_COLORS = [
  { prefix: 'testarch-', color: '\x1b[31m' },       // Quality (red)
  { prefix: 'qa-generate-', color: '\x1b[31m' },     // Quality (red)
  { prefix: 'wds-', color: '\x1b[94m' },             // WDS (brightBlue)
];
