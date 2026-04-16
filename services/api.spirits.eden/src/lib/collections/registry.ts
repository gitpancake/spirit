import { Collection } from './types';

// Collection Registry
export const COLLECTIONS: Record<string, Collection> = {
  'abraham-early-works': {
    id: 'abraham-early-works',
    artist: {
      name: 'Abraham',
      username: 'abraham',
      futureUrl: 'https://abraham.ai'
    },
    metadata: {
      title: 'Abraham Early Works',
      description: 'Early generative artworks from 2021',
      totalWorks: 2652,
      dateRange: '2021',
      tags: ['generative', 'early-works', '2021'],
      status: 'active',
      source: 'ipfs'
    },
    display: {
      thumbnailSize: 400,
      defaultLimit: 25,
      maxLimit: 25,
      sortOrder: 'archive-number',
      showDates: true,
      showArchiveNumbers: true
    },
    data: {
      type: 'embedded',
      source: '@/app/api/abraham/early-works/abraham-works-data.json',
      lastUpdated: '2024-08-31'
    },
    migration: {
      targetDomain: 'abraham.ai',
      contactInfo: 'admin@abraham.ai'
    }
  }
};

// Helper functions to access collections
export function getCollection(id: string): Collection | null {
  return COLLECTIONS[id] || null;
}

export function getAllCollections(): Collection[] {
  return Object.values(COLLECTIONS);
}

export function getActiveCollections(): Collection[] {
  return Object.values(COLLECTIONS).filter(c => c.metadata.status === 'active');
}