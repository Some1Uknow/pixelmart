"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { NFTMetadata, getListingPDA, fetchNFTMetadataFromChain } from "@/lib/program";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";

export interface OwnedNFT {
  mint: PublicKey;
  tokenAccount: PublicKey;
  amount: number;
  metadata?: NFTMetadata;
  isListed: boolean;
}

// Fetch token accounts owned by wallet
export function useOwnedNFTs() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [nfts, setNfts] = useState<OwnedNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!publicKey) {
      setNfts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all token accounts for the wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      // Filter for NFTs (amount = 1, decimals = 0)
      const nftAccounts = tokenAccounts.value
        .filter((account) => {
          const parsed = account.account.data.parsed.info;
          return (
            parsed.tokenAmount.uiAmount === 1 &&
            parsed.tokenAmount.decimals === 0
          );
        })
        .map((account) => {
          const parsed = account.account.data.parsed.info;
          return {
            mint: new PublicKey(parsed.mint),
            tokenAccount: account.pubkey,
            amount: parsed.tokenAmount.uiAmount,
            isListed: false, // Will be updated
          };
        });

      // Check which NFTs are listed and fetch their metadata
      const nftsWithListingStatus = await Promise.all(
        nftAccounts.map(async (nft) => {
          try {
            const [listingPDA] = getListingPDA(nft.mint);
            const listingAccount = await connection.getAccountInfo(listingPDA);
            
            // Fetch real metadata from on-chain
            const metadata = await fetchNFTMetadataFromChain(connection, nft.mint);
            
            return {
              ...nft,
              isListed: listingAccount !== null,
              metadata,
            };
          } catch (err) {
            console.error(`Error fetching metadata for ${nft.mint.toString()}:`, err);
            return {
              ...nft,
              isListed: false,
              metadata: undefined,
            };
          }
        })
      );

      setNfts(nftsWithListingStatus);
    } catch (err) {
      console.error("Error fetching NFTs:", err);
      setError("Failed to fetch NFTs");
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { nfts, loading, error, refetch };
}

// Alias for useOwnedNFTs with simplified return type for pages
export function useNFTs() {
  const { nfts, loading, error, refetch } = useOwnedNFTs();
  
  // Transform to format for pages with full metadata
  const simplifiedNfts = nfts.map((nft) => ({
    mint: nft.mint.toString(),
    name: nft.metadata?.name || `NFT #${nft.mint.toString().slice(0, 4)}`,
    image: nft.metadata?.image || PLACEHOLDER_IMAGE,
    description: nft.metadata?.description,
    symbol: nft.metadata?.symbol,
    attributes: nft.metadata?.attributes,
    collection: nft.metadata?.collection,
    isListed: nft.isListed,
  }));
  
  return { nfts: simplifiedNfts, loading, error, refetch };
}

// Removed mock function - now using real on-chain metadata fetching
