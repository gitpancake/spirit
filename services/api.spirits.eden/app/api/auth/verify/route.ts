import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifySignedMessage, validateMessageTimestamp } from '@/lib/auth';
import { ApiResponse } from '@/lib/types';

const VerifySchema = z.object({
  message: z.string().min(1, 'Message is required'),
  signature: z.string().min(1, 'Signature is required'),
  signer: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid signer address'),
});

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = VerifySchema.parse(body);
    const { message, signature, signer } = validatedData;

    // Validate message timestamp
    const isTimestampValid = validateMessageTimestamp(message);
    
    // Verify signature
    const isSignatureValid = await verifySignedMessage(message, signature, signer);

    const response: ApiResponse = {
      success: isSignatureValid && isTimestampValid,
      data: {
        signatureValid: isSignatureValid,
        timestampValid: isTimestampValid,
        message,
        signer,
        verified: isSignatureValid && isTimestampValid
      }
    };

    return Response.json(response);

  } catch (error: any) {
    console.error('Verify error:', error);
    
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error.name === 'ZodError') {
      errorMessage = `Validation error: ${error.errors.map((e: any) => e.message).join(', ')}`;
      statusCode = 400;
    }

    const response: ApiResponse = { 
      success: false, 
      error: errorMessage 
    };

    return Response.json(response, { status: statusCode });
  }
}