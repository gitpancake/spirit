import { NextRequest, NextResponse } from 'next/server';
import { getContract } from '@/lib/contract';
import { getMetadataFromPinata, updateMetadataStatus } from '@/lib/pinata';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const contract = getContract();
    
    console.log(`🔍 Fetching application for agent: ${agentId}`);
    
    // Since we don't have getTokenIdByAgentId anymore, we need to scan through tokens
    let foundTokenId: bigint | null = null;
    let applicationStatus = '';
    let metadataURI = '';
    
    const currentTokenId = Number(await contract.read.currentTokenId());
    
    // Search for the token with this agent ID
    for (let tokenId = 0; tokenId < currentTokenId; tokenId++) {
      try {
        const tokenAgentId = await contract.read.getAgentIdForToken([BigInt(tokenId)]);
        if (tokenAgentId && tokenAgentId.toLowerCase() === agentId.toLowerCase()) {
          foundTokenId = BigInt(tokenId);
          // Get application status and metadata URI
          [applicationStatus, metadataURI] = await Promise.all([
            contract.read.getApplicationStatusForToken([BigInt(tokenId)]) as Promise<string>,
            contract.read.tokenURI([BigInt(tokenId)]) as Promise<string>
          ]);
          break;
        }
      } catch (error) {
        continue; // Skip this token if there's an error
      }
    }
    
    if (foundTokenId === null) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    
    // Fetch metadata from IPFS
    const metadata = await getMetadataFromPinata(metadataURI);
    
    if (!metadata) {
      return NextResponse.json(
        { error: 'Application metadata not found' },
        { status: 404 }
      );
    }

    const application = {
      id: agentId,
      agentId: agentId,
      tokenId: foundTokenId.toString(),
      status: applicationStatus,
      metadataURI: metadataURI,
      ...metadata,
      // Map metadata fields to expected format
      agent_name: metadata.agent_name || metadata.name,
      created_at: metadata.application_date
    };

    return NextResponse.json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('❌ Error fetching application:', error);
    return NextResponse.json(
      { error: `Failed to fetch application: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const body = await request.json();
    
    // Simple validation - just check for status field
    if (!body.status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const { status } = body;

    // Validate status value
    if (!['PENDING_REVIEW', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    console.log(`📝 Updating status for agent ${agentId} to ${status}`);
    
    const contract = getWriteContract();
    
    // Find the token ID for this agent
    let foundTokenId: bigint | null = null;
    const currentTokenId = Number(await contract.read.currentTokenId());
    
    for (let tokenId = 0; tokenId < currentTokenId; tokenId++) {
      try {
        const tokenAgentId = await contract.read.getAgentIdForToken([BigInt(tokenId)]);
        if (tokenAgentId && tokenAgentId.toLowerCase() === agentId.toLowerCase()) {
          foundTokenId = BigInt(tokenId);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (foundTokenId === null) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Update the application status in contract using token ID
    const txHash = await contract.write.setApplicationStatus([foundTokenId, status]);
    console.log('✅ Status updated on contract. Transaction:', txHash);

    // Also update the metadata on IPFS (optional, for historical records)
    try {
      const metadataURI = await contract.read.tokenURI([foundTokenId]) as string;
      await updateMetadataStatus(metadataURI, status as any);
      console.log('✅ Metadata status updated on IPFS');
    } catch (metadataError) {
      console.warn('⚠️  Failed to update metadata status:', metadataError.message);
      // Don't fail the whole request if metadata update fails
    }

    // Return updated application data
    const updatedApplication = await GET(request, { params: Promise.resolve({ id: agentId }) });
    const applicationData = await updatedApplication.json();

    return NextResponse.json({
      success: true,
      data: {
        ...applicationData.data,
        transactionHash: txHash
      }
    });

  } catch (error) {
    console.error('❌ Error updating application status:', error);
    return NextResponse.json(
      { error: `Failed to update application status: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Direct contract writes are no longer supported. Please use the internal API service.' 
    },
    { status: 501 }
  );
}