export interface Collection {
  id: string;
  artist: {
    name: string;
    username?: string;
    website?: string;
    futureUrl?: string; // Where this will migrate to
  };
  metadata: {
    title: string;
    description: string;
    totalWorks: number;
    dateRange: string;
    tags: string[];
    status: 'active' | 'archived' | 'migrating';
    source: 'ipfs' | 'arweave' | 'custom';
  };
  display: {
    thumbnailSize: number;
    defaultLimit: number;
    maxLimit: number;
    sortOrder: 'chronological' | 'reverse-chronological' | 'archive-number';
    showDates: boolean;
    showArchiveNumbers: boolean;
  };
  data: {
    type: 'embedded' | 'external' | 'database';
    source: string; // file path, URL, or table name
    cacheTimestamp?: string;
    lastUpdated: string;
  };
  migration: {
    targetDomain?: string;
    targetDate?: string;
    redirectAfter?: boolean;
    contactInfo?: string;
  };
}

export interface StandardWork {
  id: string;
  title: string;
  description?: string;
  createdDate: string;
  archiveNumber?: number;
  originalFilename?: string;
  media: {
    primary: {
      url: string;
      thumbnailUrl: string;
      format: string;
      width?: number;
      height?: number;
      ipfsHash?: string;
      arweaveId?: string;
    };
    additional?: Array<{
      url: string;
      type: 'video' | 'audio' | 'document';
      format: string;
    }>;
  };
  metadata: {
    source: 'ipfs' | 'arweave' | 'custom';
    collection: string;
    artist: string;
    tags: string[];
    edition?: number;
    totalEditions?: number;
    rarity?: string;
    [key: string]: any; // Allow custom metadata
  };
}