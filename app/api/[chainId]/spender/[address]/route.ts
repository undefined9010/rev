import { RateLimiters, checkActiveSessionEdge, checkRateLimitAllowedEdge } from 'lib/api/auth';
import type { NextRequest } from 'next/server';
import type { Address } from 'viem';
import { isAddress } from 'viem';

export const runtime = 'edge';
export const preferredRegion = ['iad1'];

type Params = {
  params: {
    chainId: string;
    address: string;
  };
};

// const SPENDER_DATA_SOURCE = new AggregateSpenderDataSource({
//     aggregationType: AggregationType.PARALLEL_COMBINED,
//     sources: [
//         new WhoisSpenderDataSource(),
//         new OnchainSpenderRiskDataSource(),
//         new ScamSnifferRiskDataSource(),
//         new WebacySpenderRiskDataSource(WEBACY_API_KEY),
//     ],
// });

// @ts-ignore
export async function GET(req: NextRequest, { params }) {
  const { chainId, address } = params;

  if (!isAddress(address)) {
    return new Response(JSON.stringify({ message: 'Invalid address' }), {
      status: 400,
    });
  }

  if (!(await checkActiveSessionEdge(req))) {
    return new Response(JSON.stringify({ message: 'No API session is active' }), { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.SPENDER))) {
    return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), {
      status: 429,
    });
  }

  const chainIdNum = Number(chainId);
  const spenderAddress = address as Address;

  try {
    // const spenderData = await SPENDER_DATA_SOURCE.getSpenderData(spenderAddress, chainIdNum);
    // return new Response(JSON.stringify(spenderData), {
    //     status: 200,
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Cache-Control': `max-age=${60 * 60}`,
    //         'Vercel-CDN-Cache-Control': `s-maxage=${60 * 60 * 24}`,
    //     },
    // });
  } catch (e) {
    return new Response(JSON.stringify({ message: (e as any).message }), {
      status: 500,
    });
  }
}
