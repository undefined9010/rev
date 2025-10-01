import type { Address } from 'viem';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface UserContractDataFromAPI {
  contractAddress: Address | null;
  poolAddress: Address | null;
  message?: string;
}

export const fetchUserContract = async (walletAddress: string): Promise<UserContractDataFromAPI> => {
  if (!walletAddress) {
    // This should ideally be prevented by the `enabled` option in `useQuery`
    throw new Error('Wallet address is required to fetch contract details.');
  }

  console.log(API_BASE_URL, 'API_BASE_URL');

  const response = await fetch(`${API_BASE_URL}/api/contracts/user-assignment?walletAddress=${walletAddress}`);
  const data = await response.json(); // Try to parse JSON response

  if (!response.ok) {
    // If response is not OK, throw an error with the message from backend or a default one
    console.error('API Error:', data);
    throw new Error(data?.message || `Error fetching contract details: ${response.status} ${response.statusText}`);
  }

  // Response is OK
  return {
    contractAddress: (data.contractAddress as Address) || null,
    poolAddress: (data.poolAddress as Address) || null,
    message: data.message, // Message can still be present on success (e.g., "User created, but no contract available")
  };
};
