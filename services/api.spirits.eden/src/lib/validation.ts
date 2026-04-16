import { z } from 'zod';
import { isAddress } from 'viem';

const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;

export const MintSchema = z.object({
  to: z.string().regex(ethereumAddressRegex, 'Invalid Ethereum address'),
  agentId: z.string().min(1, 'Agent ID cannot be empty'),
  metadataURI: z.string().url('Invalid metadata URI'),
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required'),
  signer: z.string().regex(ethereumAddressRegex, 'Invalid signer address'),
});

export const BurnSchema = z.object({
  tokenId: z.string().regex(/^\d+$/, 'Token ID must be a valid number'),
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required'),
  signer: z.string().regex(ethereumAddressRegex, 'Invalid signer address'),
});

export const SetTreasurySchema = z.object({
  newTreasury: z.string().regex(ethereumAddressRegex, 'Invalid treasury address'),
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required'),
  signer: z.string().regex(ethereumAddressRegex, 'Invalid signer address'),
});

export const SetTokenURISchema = z.object({
  tokenId: z.string().regex(/^\d+$/, 'Token ID must be a valid number'),
  uri: z.string().url('Invalid URI'),
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required'),
  signer: z.string().regex(ethereumAddressRegex, 'Invalid signer address'),
});

export const AgentIdSchema = z.object({
  id: z.string().min(1, 'Agent ID cannot be empty'),
});


// Legacy exhibition and social schemas (keeping for backward compatibility)
export const exhibitionSchema = z.object({
  name: z.string().min(1, 'Exhibition name is required'),
  date: z.string().min(1, 'Exhibition date is required'),
  description: z.string().min(1, 'Exhibition description is required'),
  links: z.array(z.string().url('Invalid exhibition link')).default([])
});

export const socialSchema = z.object({
  name: z.string().min(1, 'Social platform name is required'),
  link: z.string().url('Invalid social link')
});

// Genesis Registry application schema
export const createApplicationSchema = z.object({
  // Identity Section
  name: z.string().min(1, 'Name is required'),
  handle: z.string().min(1, 'Handle is required'),
  role: z.enum(['Creator', 'Curator', 'Researcher', 'Educator', 'Community Organizer', 'Prediction Maker', 'Governance'], {
    errorMap: () => ({ message: 'Please select a valid role' })
  }),
  tagline: z.string().optional(),

  // Persona Section  
  public_persona: z.string().min(1, 'Public persona is required'),
  system_instructions: z.string().optional(),
  memory_context: z.string().optional(),

  // Daily Practice Section
  schedule: z.enum(['Hourly', 'Daily', 'Weekly']).optional(),
  medium: z.string().optional(),
  daily_goal: z.string().optional(),
  practice_actions: z.array(z.string()).default([]),

  // Technical Section (flexible for future expansion)
  technical_details: z.record(z.any()).optional(),

  // Social & Revenue Section (flexible for future expansion)
  social_revenue: z.record(z.any()).optional(),

  // Lore & Origin Section (flexible for future expansion)  
  lore_origin: z.record(z.any()).optional(),

  // Legacy fields (keeping for backward compatibility)
  agent_name: z.string().optional(),
  profile_picture: z.string().url('Invalid profile picture URL').optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  launch_date: z.string().optional(),
  artist: z.string().optional(),
  links: z.array(z.string().url('Invalid link')).default([]),
  exhibitions: z.array(exhibitionSchema).default([]),
  socials: z.array(socialSchema).default([]),

  // Contact Information
  submitter_info: z.object({
    email: z.string().email().optional(),
    contact: z.string().optional(),
  }).optional(),

  // Additional flexible fields for any extra form data
  additional_fields: z.record(z.any()).optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['PENDING_REVIEW', 'UNDER_REVIEW', 'REJECTED', 'ACCEPTED']),
});

// Registry Parameter Validation Functions

export interface SpiritRegistryParams {
  agentId: string;
  recipient: string;
  applicationStatus: string;
  metadataURI?: string;
}

export interface TrainerRegistryParams {
  recipient: string;
  applicationStatus: string;
  metadataURI?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  params?: any;
}

/**
 * Validates parameters for SpiritRegistry register function
 * register(string agentId, address recipient, string applicationStatus, string metadataURI)
 */
export function validateSpiritRegistryParams(body: any): ValidationResult {
  // Check required agentId parameter
  if (!body.agent_id && !body.agentId && !body.id) {
    return {
      valid: false,
      error: 'Missing agentId parameter: SpiritRegistry requires agentId for registration'
    };
  }

  // Ensure agentId is set
  let agentId = body.agent_id || body.agentId || body.id;
  if (!agentId && body.name && body.handle) {
    agentId = `${body.handle}_${Date.now()}`;
  }

  // Check recipient address
  if (!body.artist_wallet) {
    return {
      valid: false,
      error: 'Missing recipient address: artist_wallet is required for NFT minting'
    };
  }

  if (!isAddress(body.artist_wallet)) {
    return {
      valid: false,
      error: `Invalid artist wallet address: ${body.artist_wallet}`
    };
  }

  // Set default application status
  const applicationStatus = body.application_status || body.applicationStatus || 'PENDING_REVIEW';

  return {
    valid: true,
    params: {
      agentId,
      recipient: body.artist_wallet,
      applicationStatus,
      hasRequiredMetadata: !!(body.name && body.handle && body.role)
    }
  };
}

/**
 * Validates parameters for TrainerRegistry register function
 * register(address recipient, string applicationStatus, string metadataURI)
 */
export function validateTrainerRegistryParams(body: any): ValidationResult {
  // Check recipient address
  if (!body.artist_wallet) {
    return {
      valid: false,
      error: 'Missing recipient address: artist_wallet is required for NFT minting'
    };
  }

  if (!isAddress(body.artist_wallet)) {
    return {
      valid: false,
      error: `Invalid artist wallet address: ${body.artist_wallet}`
    };
  }

  // Set default application status
  const applicationStatus = body.application_status || body.applicationStatus || 'PENDING_REVIEW';

  return {
    valid: true,
    params: {
      recipient: body.artist_wallet,
      applicationStatus,
      hasRequiredMetadata: !!(body.name && body.handle && body.role)
    }
  };
}

/**
 * Validates basic application fields required by both registries
 */
export function validateApplicationFields(body: any): ValidationResult {
  const requiredFields = ['name', 'handle', 'role', 'public_persona', 'artist_wallet'];
  const missingFields = requiredFields.filter(field => !body[field]);

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`
    };
  }

  return { valid: true };
}