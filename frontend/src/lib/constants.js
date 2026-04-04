export const PERSONA_COLOURS = {
  end_user:              '#4A8FD4',
  skeptic:               '#E94560',
  devils_advocate:       '#D97706',
  power_user:            '#16A34A',
  builder:               '#00BCD4',
  support_rep:           '#FF7043',
  investor:              '#8B5CF6',
  competitor:            '#EF5350',
  market_analyst:        '#0F9D8A',
  evangelist:            '#2F9E44',
  reluctant_adopter:     '#FFA726',
  regulator:             '#78909C',
  timing_critic:         '#C2410C',
  executive_stakeholder: '#5C6BC0',
  newcomer:              '#8D6E63',
  user:                  '#1C1C1E',
}

export const NAME_TO_ID = {
  'The End User':              'end_user',
  'The Skeptic':               'skeptic',
  "The Devil's Advocate":      'devils_advocate',
  'The Power User':            'power_user',
  'The Builder':               'builder',
  'The Support Rep':           'support_rep',
  'The Investor':              'investor',
  'The Competitor':            'competitor',
  'The Market Analyst':        'market_analyst',
  'The Evangelist':            'evangelist',
  'The Reluctant Adopter':     'reluctant_adopter',
  'The Regulator':             'regulator',
  'The Timing Critic':         'timing_critic',
  'The Executive Stakeholder': 'executive_stakeholder',
  'The Newcomer':              'newcomer',
  'You':                       'user',
}

export const CORE_PERSONA_IDS = new Set(['end_user', 'skeptic', 'devils_advocate'])

export const INTENT_OPTIONS = [
  { id: 'feature_decision', label: 'Feature', shortLabel: 'Feature decision' },
  { id: 'strategic_decision', label: 'Strategy', shortLabel: 'Strategic decision' },
  { id: 'launch_announcement', label: 'Launch', shortLabel: 'Launch announcement' },
  { id: 'timing_strategy', label: 'Timing', shortLabel: 'Timing strategy' },
]

export const INTENT_LABELS = Object.fromEntries(
  INTENT_OPTIONS.map((option) => [option.id, option.shortLabel]),
)
