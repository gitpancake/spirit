// Spirit types and interfaces for Eden3 Academy

export type PresetType = 'CREATOR' | 'CURATOR' | 'TRADER'
export type CadenceType = 'DAILY_6_1' | 'DAILY_7' | 'WEEKLY' | 'CUSTOM'
export type OutputKind = 'IMAGE' | 'TEXT' | 'AUDIO' | 'PRODUCT' | 'TOKEN'
export type GraduationMode = 'ID_ONLY' | 'ID_PLUS_TOKEN' | 'FULL_STACK'
export type IntegrationKind = 'MINTING' | 'IPFS' | 'TWITTER' | 'SHOPIFY' | 'AUCTIONS' | 'TOKEN_TRANSFER' | 'REGISTRY_WRITE'

export interface SpiritIdentity {
  name: string
  tagline?: string
  avatar_file?: File
  avatar_cid?: string
}

export interface PracticeConfig {
  type: PresetType
  cadence: CadenceType
  time_utc: string // "21:00"
  rest_day?: number // 0-6, null for daily
  quantity: number // default 1
  output_kind: OutputKind
  config_json: Record<string, unknown> // prompt/style/etc
}

export interface SpiritDraft {
  id?: string
  identity: SpiritIdentity
  practice?: PracticeConfig
  integrations?: IntegrationKind[]
  status: 'DRAFT' | 'GRADUATED'
  created_at?: string
}

export interface OnChainRefs {
  registry_token_id: string
  wallet: string
  erc20_token?: string
  tx_hashes: string[]
}

// Preset configurations
export const PRESET_CONFIGS = {
  CREATOR: {
    title: 'Creator',
    description: 'Generate original artworks, writing, or media on a regular schedule',
    defaultSkills: ['MINTING', 'IPFS'] as IntegrationKind[],
    defaultOutput: 'IMAGE' as OutputKind,
    icon: '🎨',
    examples: ['Daily AI paintings', 'Poetry generation', 'Music composition']
  },
  CURATOR: {
    title: 'Curator',
    description: 'Discover, analyze, and organize cultural artifacts and collections',
    defaultSkills: ['REGISTRY_WRITE'] as IntegrationKind[],
    defaultOutput: 'TEXT' as OutputKind,
    icon: '🔍',
    examples: ['Art collection reviews', 'Cultural trend analysis', 'Exhibition planning']
  },
  TRADER: {
    title: 'Trader', 
    description: 'Analyze markets, execute trades, and manage digital asset portfolios',
    defaultSkills: ['TOKEN_TRANSFER'] as IntegrationKind[],
    defaultOutput: 'PRODUCT' as OutputKind,
    icon: '📈',
    examples: ['Market analysis', 'Trading signals', 'Portfolio optimization']
  }
} as const

// Cadence configurations
export const CADENCE_CONFIGS = {
  DAILY_6_1: {
    title: 'Daily (6 days)',
    description: 'Active 6 days per week with 1 rest day',
    requiresRestDay: true
  },
  DAILY_7: {
    title: 'Daily (7 days)',
    description: 'Active every day of the week',
    requiresRestDay: false
  },
  WEEKLY: {
    title: 'Weekly',
    description: 'Active once per week on chosen day',
    requiresRestDay: false
  },
  CUSTOM: {
    title: 'Custom',
    description: 'Define your own schedule',
    requiresRestDay: false
  }
} as const

export const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
] as const

export const OUTPUT_KIND_CONFIGS = {
  IMAGE: {
    title: 'Visual Art',
    description: 'Generated images, paintings, digital art',
    icon: '🖼️'
  },
  TEXT: {
    title: 'Written Content', 
    description: 'Essays, poetry, analysis, stories',
    icon: '📝'
  },
  AUDIO: {
    title: 'Audio Content',
    description: 'Music, sounds, spoken content',
    icon: '🎵'
  },
  PRODUCT: {
    title: 'Digital Products',
    description: 'Apps, tools, data analysis',
    icon: '⚙️'
  },
  TOKEN: {
    title: 'Crypto Assets',
    description: 'Tokens, NFTs, DeFi products', 
    icon: '🪙'
  }
} as const

// Utility functions
export function getNextRunTime(practice: PracticeConfig): Date {
  const now = new Date()
  const [hours, minutes] = practice.time_utc.split(':').map(Number)
  
  const nextRun = new Date()
  nextRun.setUTCHours(hours, minutes, 0, 0)
  
  // If time has passed today, schedule for next valid day
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1)
  }
  
  // Handle rest day logic for DAILY_6_1
  if (practice.cadence === 'DAILY_6_1' && practice.rest_day !== undefined) {
    while (nextRun.getDay() === practice.rest_day) {
      nextRun.setDate(nextRun.getDate() + 1)
    }
  }
  
  // Handle weekly scheduling
  if (practice.cadence === 'WEEKLY') {
    const targetDay = practice.rest_day ?? 0 // Default to Sunday if not set
    const daysDiff = targetDay - nextRun.getDay()
    const daysToAdd = daysDiff >= 0 ? daysDiff : 7 + daysDiff
    nextRun.setDate(nextRun.getDate() + daysToAdd)
  }
  
  return nextRun
}

export function formatNextRun(nextRun: Date): string {
  const now = new Date()
  const diffMs = nextRun.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 0) {
    return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`
  } else if (diffHours > 0) {
    return `in ${diffHours} hour${diffHours === 1 ? '' : 's'}`
  } else {
    return 'soon'
  }
}

// Local storage helpers
export function saveSpiritDraft(draft: SpiritDraft): void {
  localStorage.setItem('eden-spirit-draft', JSON.stringify(draft))
}

export function loadSpiritDraft(): SpiritDraft | null {
  const stored = localStorage.getItem('eden-spirit-draft')
  if (!stored) return null
  
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function clearSpiritDraft(): void {
  localStorage.removeItem('eden-spirit-draft')
}