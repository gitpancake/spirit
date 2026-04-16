import { PinataSDK } from 'pinata';
import { getCachedMetadata, setCachedMetadata, extractIPFSHash } from './redis';

// Initialize Pinata SDK
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT
});

export interface GenesisRegistryMetadata {
  // Standard NFT metadata
  name: string;
  description: string;
  image?: string;
  external_url?: string;
  
  // Genesis Registry Core Fields
  agent_id: string;
  handle: string;
  role: 'Creator' | 'Curator' | 'Researcher' | 'Educator' | 'Community Organizer' | 'Prediction Maker' | 'Governance';
  tagline?: string;
  public_persona: string;
  system_instructions?: string;
  memory_context?: string;
  
  // Artist & Safe Information
  artist_wallet: string;
  safe_address?: string;
  safe_deployment_tx?: string;
  
  // Daily Practice
  schedule?: 'Hourly' | 'Daily' | 'Weekly';
  medium?: string;
  daily_goal?: string;
  practice_actions?: string[];
  
  // Technical Details (flexible JSONB)
  technical_details?: Record<string, any>;
  
  // Social & Revenue (flexible JSONB)
  social_revenue?: Record<string, any>;
  
  // Lore & Origin (flexible JSONB)
  lore_origin?: Record<string, any>;
  
  // Legacy fields for backward compatibility
  agent_name?: string;
  profile_picture?: string;
  instructions?: string;
  launch_date?: string;
  artist?: string;
  links?: string[];
  exhibitions?: Array<{
    name: string;
    date: string;
    description: string;
    links: string[];
  }>;
  socials?: Array<{
    name: string;
    link: string;
  }>;
  
  // Application metadata
  submitter_info?: {
    email?: string;
    contact?: string;
  };
  application_date: string;
  application_status: 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'REJECTED' | 'ACCEPTED';
  
  // Additional flexible fields
  additional_fields?: Record<string, any>;
}

export async function uploadMetadataToPinata(
  agentId: string,
  applicationData: any,
  safeInfo?: { address: string; deploymentTx: string }
): Promise<string> {
  try {
    // Create standardized metadata structure
    const metadata: GenesisRegistryMetadata = {
      // Standard NFT fields
      name: applicationData.name || applicationData.agent_name,
      description: applicationData.public_persona || applicationData.description,
      image: applicationData.profile_picture,
      external_url: applicationData.links?.[0],
      
      // Genesis Registry core fields
      agent_id: agentId,
      handle: applicationData.handle,
      role: applicationData.role,
      tagline: applicationData.tagline,
      public_persona: applicationData.public_persona,
      system_instructions: applicationData.system_instructions,
      memory_context: applicationData.memory_context,
      
      // Artist & Safe information
      artist_wallet: applicationData.artist_wallet,
      safe_address: safeInfo?.address,
      safe_deployment_tx: safeInfo?.deploymentTx,
      
      // Daily Practice
      schedule: applicationData.schedule,
      medium: applicationData.medium,
      daily_goal: applicationData.daily_goal,
      practice_actions: applicationData.practice_actions,
      
      // Flexible JSONB fields
      technical_details: applicationData.technical_details || {},
      social_revenue: applicationData.social_revenue || {},
      lore_origin: applicationData.lore_origin || {},
      
      // Legacy fields
      agent_name: applicationData.agent_name,
      profile_picture: applicationData.profile_picture,
      instructions: applicationData.instructions,
      launch_date: applicationData.launch_date,
      artist: applicationData.artist,
      links: applicationData.links || [],
      exhibitions: applicationData.exhibitions || [],
      socials: applicationData.socials || [],
      
      // Application metadata
      submitter_info: applicationData.submitter_info,
      application_date: new Date().toISOString(),
      application_status: 'PENDING_REVIEW',
      additional_fields: applicationData.additional_fields || {}
    };
    
    // Upload to Pinata
    console.log('📦 Uploading metadata to Pinata...');
    
    const result = await pinata.upload(metadata, {
      metadata: {
        name: `Genesis Registry Agent: ${metadata.name}`,
        keyValues: {
          agent_id: agentId,
          handle: metadata.handle,
          role: metadata.role,
          artist_wallet: metadata.artist_wallet,
          type: 'genesis_registry_agent'
        }
      }
    });
    
    console.log('✅ Metadata uploaded to Pinata successfully!');
    
    console.log(`✅ Metadata uploaded to IPFS: ${result.IpfsHash}`);
    
    // Return the IPFS URI
    return `ipfs://${result.IpfsHash}`;
    
  } catch (error) {
    console.error('❌ Failed to upload metadata to Pinata:', error);
    throw new Error(`Failed to upload metadata: ${error.message}`);
  }
}

export async function getMetadataFromPinata(ipfsUrl: string): Promise<GenesisRegistryMetadata | null> {
  try {
    // Extract the IPFS hash from various URL formats
    const hash = extractIPFSHash(ipfsUrl);
    if (!hash) {
      console.error(`❌ Invalid IPFS URL format: ${ipfsUrl}`);
      return null;
    }
    
    // Try Redis cache first
    const cachedMetadata = await getCachedMetadata(hash);
    if (cachedMetadata) {
      return cachedMetadata as GenesisRegistryMetadata;
    }
    
    console.log(`📡 Fetching metadata from Pinata gateway: ${hash}`);
    
    // Fetch from dedicated Pinata gateway
    const response = await fetch(`https://fuchsia-rich-lungfish-648.mypinata.cloud/ipfs/${hash}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const metadata = await response.json();
    
    // Cache the result in Redis for 1 hour (3600 seconds)
    await setCachedMetadata(hash, metadata, 3600);
    
    return metadata as GenesisRegistryMetadata;
    
  } catch (error) {
    console.error(`❌ Failed to fetch metadata from IPFS (${ipfsUrl}):`, error);
    return null;
  }
}

export async function updateMetadataStatus(
  ipfsHash: string, 
  newStatus: GenesisRegistryMetadata['application_status']
): Promise<string> {
  try {
    // Fetch existing metadata
    const existingMetadata = await getMetadataFromPinata(ipfsHash);
    
    if (!existingMetadata) {
      throw new Error('Could not fetch existing metadata');
    }
    
    // Update status
    const updatedMetadata: GenesisRegistryMetadata = {
      ...existingMetadata,
      application_status: newStatus,
      // Add update timestamp
      last_updated: new Date().toISOString()
    };
    
    // Upload updated metadata
    const result = await pinata.upload(updatedMetadata, {
      metadata: {
        name: `Genesis Registry Agent: ${updatedMetadata.name} (${newStatus})`,
        keyValues: {
          agent_id: updatedMetadata.agent_id,
          handle: updatedMetadata.handle,
          role: updatedMetadata.role,
          status: newStatus,
          type: 'genesis_registry_agent'
        }
      }
    });
    
    console.log(`✅ Updated metadata uploaded to IPFS: ${result.IpfsHash}`);
    return `ipfs://${result.IpfsHash}`;
    
  } catch (error) {
    console.error('❌ Failed to update metadata status:', error);
    throw new Error(`Failed to update metadata: ${error.message}`);
  }
}