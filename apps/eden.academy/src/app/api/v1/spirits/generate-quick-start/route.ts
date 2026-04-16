import { NextRequest, NextResponse } from 'next/server'
import { PresetType, PRESET_CONFIGS } from '~/lib/spirits'
import { env } from '~/lib/env'

// Quick start AI generation using Anthropic API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { preset } = body as { preset: PresetType }

    if (!preset || !PRESET_CONFIGS[preset]) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid preset type' 
        },
        { status: 400 }
      )
    }

    // Get Anthropic API key from environment
    const anthropicApiKey = env.PRIVATE.ANTHROPIC_API_KEY
    if (!anthropicApiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Anthropic API key not configured' 
        },
        { status: 500 }
      )
    }

    const presetConfig = PRESET_CONFIGS[preset]
    
    // Create AI prompt based on the preset
    const prompt = createGenerationPrompt(preset, presetConfig)

    // Call Anthropic API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!anthropicResponse.ok) {
      throw new Error(`Anthropic API error: ${anthropicResponse.status}`)
    }

    const anthropicData = await anthropicResponse.json()
    const aiResponse = anthropicData.content[0].text

    // Parse AI response (expecting JSON format)
    let generatedSpirit
    try {
      generatedSpirit = JSON.parse(aiResponse)
    } catch {
      // Fallback to parsing or default values if JSON parsing fails
      generatedSpirit = createFallbackSpirit(preset)
    }

    return NextResponse.json({
      success: true,
      data: {
        spirit: generatedSpirit,
        preset: preset
      }
    })
  } catch (error) {
    console.error('Error generating quick start spirit:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate spirit',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function createGenerationPrompt(preset: PresetType, config: typeof PRESET_CONFIGS[PresetType]): string {
  return `You are helping create an AI spirit for Eden Academy. Generate a creative identity and practice configuration for a ${preset.toLowerCase()} spirit.

Context: ${config.description}
Examples: ${config.examples.join(', ')}

Please respond with ONLY a valid JSON object (no markdown formatting) with this structure:
{
  "identity": {
    "name": "A creative, unique name (2-12 characters)",
    "tagline": "A brief, inspiring tagline about their mission (30-80 characters)"
  },
  "practice": {
    "cadence": "DAILY_6_1",
    "time_utc": "21:00",
    "rest_day": 0,
    "quantity": 1,
    "output_kind": "${config.defaultOutput}",
    "config_json": {
      ${preset === 'CREATOR' 
        ? '"prompt": "A creative prompt for generating art", "style": "A specific artistic style"' 
        : preset === 'CURATOR' 
          ? '"topic": "A specific topic to curate and analyze", "format": "essay"'
          : '"focus": "A specific market or trading focus"'
      }
    }
  }
}

Make the name memorable and unique, the tagline inspiring, and the practice configuration thoughtful and specific. Be creative but practical.`
}

function createFallbackSpirit(preset: PresetType) {
  const fallbacks = {
    CREATOR: {
      identity: {
        name: 'Aria',
        tagline: 'Weaving dreams into digital reality through algorithmic art'
      },
      practice: {
        cadence: 'DAILY_6_1',
        time_utc: '21:00',
        rest_day: 0,
        quantity: 1,
        output_kind: 'IMAGE',
        config_json: {
          prompt: 'A surreal digital landscape blending organic and geometric forms',
          style: 'neo-surrealist digital art'
        }
      }
    },
    CURATOR: {
      identity: {
        name: 'Sage',
        tagline: 'Discovering hidden connections in the digital art ecosystem'
      },
      practice: {
        cadence: 'DAILY_6_1',
        time_utc: '21:00',
        rest_day: 0,
        quantity: 1,
        output_kind: 'TEXT',
        config_json: {
          topic: 'emerging trends in AI-generated art',
          format: 'essay'
        }
      }
    },
    TRADER: {
      identity: {
        name: 'Flux',
        tagline: 'Navigating digital asset flows with algorithmic precision'
      },
      practice: {
        cadence: 'DAILY_6_1',
        time_utc: '21:00',
        rest_day: 0,
        quantity: 1,
        output_kind: 'PRODUCT',
        config_json: {
          focus: 'NFT market analysis and trading signals'
        }
      }
    }
  }
  
  return fallbacks[preset]
}