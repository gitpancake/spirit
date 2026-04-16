'use client';

import { useState } from 'react';

// Widget configuration types
export interface WidgetConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  fields: FieldConfig[];
  category: 'profile' | 'training' | 'technical' | 'social' | 'additional';
}

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'array' | 'boolean' | 'image';
  placeholder?: string;
  options?: string[];
  required?: boolean;
  maxLength?: number;
}

// Widget definitions mapping to your JSON structure
export const WIDGET_CONFIGS: WidgetConfig[] = [
  {
    id: 'hero-section',
    title: 'Hero Section',
    description: 'Agent name, status, and primary identity',
    icon: '',
    category: 'profile',
    fields: [
      { key: 'name', label: 'Agent Name', type: 'text', required: true, maxLength: 50 },
      { key: 'handle', label: 'Handle/Username', type: 'text', required: true, maxLength: 30 },
      { key: 'agentId', label: 'Agent ID', type: 'text', placeholder: 'Unique identifier for this agent', maxLength: 100 },
      { key: 'role', label: 'Role', type: 'select', options: ['CREATOR', 'CURATOR', 'COLLECTOR', 'GOVERNANCE', 'FINANCIAL'], required: true },
      { key: 'tagline', label: 'Tagline', type: 'textarea', maxLength: 200 },
      { key: 'image', label: 'Profile Image', type: 'image' }
    ]
  },
  {
    id: 'mission-statement',
    title: 'Mission Statement',
    description: 'Agent purpose and specialization',
    icon: '',
    category: 'profile',
    fields: [
      { key: 'description', label: 'Description', type: 'textarea', required: true, maxLength: 500 },
      { key: 'public_persona', label: 'Public Persona', type: 'textarea', maxLength: 300 },
      { key: 'lore_origin.backstory', label: 'Origin Backstory', type: 'textarea', maxLength: 1000 },
      { key: 'lore_origin.motivation', label: 'Core Motivation', type: 'textarea', maxLength: 300 }
    ]
  },
  {
    id: 'daily-practice',
    title: 'Daily Practice',
    description: 'Agent daily output and practice tracking',
    icon: '',
    category: 'training',
    fields: [
      { key: 'schedule', label: 'Daily Schedule', type: 'text', placeholder: 'e.g., Daily creation at 9 AM UTC' },
      { key: 'daily_goal', label: 'Daily Goal', type: 'textarea', maxLength: 200 },
      { key: 'medium', label: 'Primary Medium', type: 'text', placeholder: 'e.g., knowledge-synthesis, digital art' },
      { key: 'practice_actions', label: 'Practice Actions', type: 'array', placeholder: 'sketch, experiment, iterate' }
    ]
  },
  {
    id: 'training-status',
    title: 'Training Status',
    description: 'Agent training progress and milestones',
    icon: '',
    category: 'training',
    fields: [
      { key: 'system_instructions', label: 'System Instructions', type: 'textarea', required: true, maxLength: 1000 },
      { key: 'memory_context', label: 'Memory Context', type: 'textarea', maxLength: 500 },
      { key: 'additional_fields.agent_tags', label: 'Agent Tags', type: 'array', placeholder: 'knowledge, history, collective-intelligence' }
    ]
  },
  {
    id: 'performance-metrics',
    title: 'Performance Metrics',
    description: 'Agent performance and analytics',
    icon: '',
    category: 'technical',
    fields: [
      { key: 'technical_details.model', label: 'AI Model', type: 'select', options: ['GPT-4', 'GPT-3.5', 'Claude', 'Custom'], required: true },
      { key: 'technical_details.capabilities', label: 'Capabilities', type: 'multiselect', options: ['image_generation', 'text_analysis', 'code_generation', 'music_composition', 'video_editing'] }
    ]
  },
  {
    id: 'works-gallery',
    title: 'Works Gallery',
    description: 'Recent works and creations showcase',
    icon: '',
    category: 'social',
    fields: [
      { key: 'social_revenue.platforms', label: 'Social Platforms', type: 'multiselect', options: ['Twitter', 'Instagram', 'TikTok', 'Discord', 'Telegram'] },
      { key: 'social_revenue.revenue_model', label: 'Revenue Model', type: 'select', options: ['NFT sales', 'Subscriptions', 'Commissions', 'Licensing', 'Mixed'] }
    ]
  },
  {
    id: 'links-profile',
    title: 'Links & Profile',
    description: 'External links, website, and social connections',
    icon: '',
    category: 'social',
    fields: [
      { key: 'external_url', label: 'Main Website', type: 'text', placeholder: 'https://example.com' },
      { key: 'links.portfolio', label: 'Portfolio URL', type: 'text', placeholder: 'https://portfolio.example.com' },
      { key: 'links.twitter', label: 'Twitter/X URL', type: 'text', placeholder: 'https://twitter.com/username' },
      { key: 'links.instagram', label: 'Instagram URL', type: 'text', placeholder: 'https://instagram.com/username' },
      { key: 'links.discord', label: 'Discord Invite', type: 'text', placeholder: 'https://discord.gg/invite' },
      { key: 'links.foundation', label: 'Foundation Profile', type: 'text', placeholder: 'https://foundation.app/@username' },
      { key: 'links.custom', label: 'Custom Links (comma-separated)', type: 'array', placeholder: 'https://link1.com, https://link2.com' }
    ]
  },
  {
    id: 'auction-config',
    title: 'Auction Configuration',
    description: 'Daily auction and marketplace settings',
    icon: '',
    category: 'technical',
    fields: [
      { key: 'auction.active', label: 'Auction Active', type: 'boolean' },
      { key: 'auction.contract', label: 'Auction Contract', type: 'text', placeholder: '0x...' },
      { key: 'auction.chainId', label: 'Chain ID', type: 'select', options: ['1', '11155111', '8453', '84532'] },
      { key: 'artist_wallet', label: 'Artist Wallet', type: 'text', placeholder: '0x...' }
    ]
  },
  {
    id: 'fixed-price-sale',
    title: 'Fixed Price Sale',
    description: 'Direct purchase and fixed pricing configuration',
    icon: '',
    category: 'technical',
    fields: [
      { key: 'fixed_sale.active', label: 'Fixed Sale Active', type: 'boolean' },
      { key: 'fixed_sale.price', label: 'Sale Price (ETH)', type: 'text', placeholder: '0.1' },
      { key: 'fixed_sale.currency', label: 'Currency', type: 'select', options: ['ETH', 'USDC', 'DAI', 'WETH'], required: false },
      { key: 'fixed_sale.contract', label: 'Sale Contract', type: 'text', placeholder: '0x...' },
      { key: 'fixed_sale.chainId', label: 'Chain ID', type: 'select', options: ['1', '11155111', '8453', '84532'] },
      { key: 'fixed_sale.marketplace', label: 'Marketplace', type: 'select', options: ['Foundation', 'SuperRare', 'Custom'], required: false },
      { key: 'fixed_sale.listing_url', label: 'Direct Purchase URL', type: 'text', placeholder: 'https://marketplace.com/assets/...' },
      { key: 'fixed_sale.available_quantity', label: 'Available Quantity', type: 'text', placeholder: '1' },
      { key: 'fixed_sale.sale_start', label: 'Sale Start Date', type: 'text', placeholder: 'YYYY-MM-DD or leave blank for immediate' },
      { key: 'fixed_sale.sale_end', label: 'Sale End Date', type: 'text', placeholder: 'YYYY-MM-DD or leave blank for no end' }
    ]
  },
  {
    id: 'collections-gallery',
    title: 'Collections Gallery',
    description: 'Link agent to artist collections available through the platform API',
    icon: '🎨',
    category: 'social',
    fields: [
      { 
        key: 'collections', 
        label: 'Associated Collections', 
        type: 'multiselect', 
        options: ['abraham-early-works'],
        placeholder: 'Select collections to display in agent profile. Collections are served via /api/collections/{slug}'
      }
    ]
  }
];

// Individual widget component
interface WidgetProps {
  config: WidgetConfig;
  values: any;
  onChange: (key: string, value: any) => void;
  onImageUpload?: (key: string) => void;
}

export function MetadataWidget({ config, values, onChange, onImageUpload }: WidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getValue = (key: string) => {
    if (key.includes('.')) {
      const keys = key.split('.');
      let value = values;
      for (const k of keys) {
        value = value?.[k];
      }
      return value || '';
    }
    return values[key] || '';
  };

  const handleChange = (key: string, value: any) => {
    onChange(key, value);
  };

  const handleArrayChange = (key: string, value: string) => {
    const arrayValue = value.split(',').map(s => s.trim()).filter(s => s);
    handleChange(key, arrayValue);
  };

  const renderField = (field: FieldConfig) => {
    const value = getValue(field.key);
    
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontFamily: 'inherit'
            }}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontFamily: 'inherit'
            }}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'multiselect':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {field.options?.map(option => (
              <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentArray = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleChange(field.key, [...currentArray, option]);
                    } else {
                      handleChange(field.key, currentArray.filter(v => v !== option));
                    }
                  }}
                />
                {option}
              </label>
            ))}
          </div>
        );
      
      case 'array':
        return (
          <input
            type="text"
            value={Array.isArray(value) ? value.join(', ') : value}
            onChange={(e) => handleArrayChange(field.key, e.target.value)}
            placeholder={field.placeholder || 'Comma-separated values'}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontFamily: 'inherit'
            }}
          />
        );
      
      case 'boolean':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(field.key, e.target.checked)}
            />
            Enable {field.label}
          </label>
        );
      
      case 'image':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder="ipfs://... or https://..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontFamily: 'inherit'
              }}
            />
            {onImageUpload && (
              <button
                type="button"
                onClick={() => onImageUpload(field.key)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                Upload New Image
              </button>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e1e1e1',
      borderRadius: '6px',
      overflow: 'hidden',
      marginBottom: '1rem'
    }}>
      <div 
        style={{
          padding: '1.5rem',
          borderBottom: isExpanded ? '1px solid #f3f4f6' : 'none',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ 
              margin: 0, 
              fontSize: '1rem', 
              fontWeight: '600',
              color: '#111827'
            }}>
              {config.title}
            </h3>
            <p style={{ 
              margin: '0.25rem 0 0 0', 
              fontSize: '0.875rem', 
              color: '#6b7280'
            }}>
              {config.description}
            </p>
          </div>
          <button style={{
            background: '#059669',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '3px',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}>
            {isExpanded ? 'Collapse' : 'Configure'}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{ padding: '1.5rem', backgroundColor: '#fafafa' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {config.fields.map(field => (
              <div key={field.key}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  {field.label}
                  {field.required && <span style={{ color: '#dc2626' }}>*</span>}
                  {field.maxLength && (
                    <span style={{ color: '#6b7280', fontWeight: '400' }}>
                      {' '}({getValue(field.key)?.length || 0}/{field.maxLength})
                    </span>
                  )}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}