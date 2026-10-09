export type GuidedDemoStep =
  | 'welcome'
  | 'input'
  | 'story'
  | 'source'
  | 'evidence'
  | 'task'
  | 'filters'
  | 'tools'
  | 'finish';

export const GUIDED_DEMO_SEEN_KEY = 'missed.guided-demo.seen.v1';
