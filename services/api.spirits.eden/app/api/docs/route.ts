import { NextRequest } from 'next/server';
import { openApiSpec } from '@/lib/openapi-spec';

export async function GET(request: NextRequest) {
  return Response.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}