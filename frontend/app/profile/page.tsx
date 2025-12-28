"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
} from "@/components/retroui";
import { NFTGrid, NFTCard } from "@/components/nft";
import { useListings } from "@/hooks/useListings";
import { useNFTs } from "@/hooks/useNFTs";
import { truncateAddress, formatSol } from "@/lib/constants";
import {
  Wallet,
  Copy,
  Check,
  ExternalLink,
  Image as ImageIcon,
  Tag,
  RefreshCw,
} from "lucide-react";

export default function ProfilePage() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();
  
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("owned");

  // Fetch all listings and user's owned NFTs
  const { listings, loading: listingsLoading, refetch: refetchListings } = useListings();
  const { nfts, loading: nftsLoading, refetch: refetchNFTs } = useNFTs();

  // Filter listings to show only user's listings
  const myListings = useMemo(() => {
    if (!publicKey) return [];
    return listings.filter((l) => l.account.seller.equals(publicKey));
  }, [listings, publicKey]);

  // Filter owned NFTs to exclude those already listed
  const listedMints = useMemo(() => {
    return new Set(myListings.map((l) => l.account.nftMint.toString()));
  }, [myListings]);

  const ownedNotListed = useMemo(() => {
    return nfts.filter((n) => !listedMints.has(n.mint));
  }, [nfts, listedMints]);

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = () => {
    refetchListings();
    refetchNFTs();
  };

  // Not connected state
  if (!connected || !publicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-muted border-2 border-border flex items-center justify-center">
              <Wallet className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-head text-2xl font-bold mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-muted-foreground mb-6">
              Connect your Solana wallet to view your profile, owned NFTs, and
              active listings.
            </p>
            <div className="flex justify-center">
              <Button size="lg" onClick={() => setVisible(true)}>
                Connect Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loading = listingsLoading || nftsLoading;

  return (
    <div className="min-h-screen">
      {/* Profile Header */}
      <section className="border-b-2 border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary border-4 border-border flex items-center justify-center text-4xl">
              🎨
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-head text-2xl md:text-3xl font-bold">
                  {truncateAddress(publicKey.toString(), 6)}
                </h1>
                <button
                  onClick={copyAddress}
                  className="p-2 hover:bg-muted transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={`https://explorer.solana.com/account/${publicKey.toString()}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-muted transition-colors"
                  title="View on Explorer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-muted-foreground font-mono text-sm">
                {publicKey.toString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="ghost" onClick={disconnect}>
                Disconnect
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <StatCard
              label="Owned NFTs"
              value={nfts.length}
              icon={<ImageIcon className="w-5 h-5" />}
              loading={nftsLoading}
            />
            <StatCard
              label="Active Listings"
              value={myListings.length}
              icon={<Tag className="w-5 h-5" />}
              loading={listingsLoading}
            />
            <StatCard
              label="Total Value Listed"
              value={`${myListings.reduce((acc, l) => acc + l.account.price.toNumber() / 1e9, 0).toFixed(2)} SOL`}
              loading={listingsLoading}
            />
            <StatCard
              label="Available to List"
              value={ownedNotListed.length}
              loading={loading}
            />
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="owned" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Owned ({nfts.length})
            </TabsTrigger>
            <TabsTrigger value="listed" className="gap-2">
              <Tag className="w-4 h-4" />
              Listed ({myListings.length})
            </TabsTrigger>
          </TabsList>

          {/* Owned NFTs Tab */}
          <TabsContent value="owned">
            {nftsLoading ? (
              <NFTGrid loading={true} />
            ) : ownedNotListed.length === 0 ? (
              <EmptyState
                icon="🖼️"
                title="No NFTs to List"
                description={
                  nfts.length > 0
                    ? "All your NFTs are currently listed on the marketplace."
                    : "You don't own any NFTs yet. Buy some from the marketplace!"
                }
                action={
                  <Button onClick={() => router.push("/explore")}>
                    Explore NFTs
                  </Button>
                }
              />
            ) : (
              <NFTGrid>
                {ownedNotListed.map((nft) => (
                  <OwnedNFTCard
                    key={nft.mint}
                    nft={nft}
                    onList={() => router.push(`/list/${nft.mint}`)}
                  />
                ))}
              </NFTGrid>
            )}
          </TabsContent>

          {/* Listed NFTs Tab */}
          <TabsContent value="listed">
            {listingsLoading ? (
              <NFTGrid loading={true} />
            ) : myListings.length === 0 ? (
              <EmptyState
                icon="📦"
                title="No Active Listings"
                description="You haven't listed any NFTs for sale yet."
                action={
                  ownedNotListed.length > 0 ? (
                    <Button onClick={() => setActiveTab("owned")}>
                      List an NFT
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <NFTGrid>
                {myListings.map((listing) => (
                  <NFTCard
                    key={listing.publicKey.toString()}
                    listing={listing}
                    onBuy={() => router.push(`/nft/${listing.account.nftMint.toString()}`)}
                    showBuyButton={false}
                  />
                ))}
              </NFTGrid>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

// Helper Components

function StatCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="font-head text-2xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="text-center py-12">
        <div className="text-6xl mb-4">{icon}</div>
        <h3 className="font-head text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6">{description}</p>
        {action && <div className="flex justify-center">{action}</div>}
      </CardContent>
    </Card>
  );
}

function OwnedNFTCard({
  nft,
  onList,
}: {
  nft: {
    mint: string;
    name?: string;
    image?: string;
    description?: string;
    symbol?: string;
    attributes?: Array<{ trait_type: string; value: string }>;
    collection?: { name: string; family?: string };
  };
  onList: () => void;
}) {
  return (
    <Card className="overflow-hidden group hover:border-primary transition-colors">
      <div className="relative aspect-square bg-muted">
        {nft.image ? (
          <Image
            src={nft.image}
            alt={nft.name || "NFT"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl">🖼️</span>
          </div>
        )}
      </div>
      <CardContent className="pt-4 pb-4 space-y-3">
        {/* Name and Symbol */}
        <div>
          <h3 className="font-head font-bold truncate">
            {nft.name || "Unnamed NFT"}
          </h3>
          {nft.symbol && (
            <p className="text-xs text-muted-foreground">{nft.symbol}</p>
          )}
        </div>

        {/* Collection */}
        {nft.collection?.name && (
          <div>
            <p className="text-xs text-muted-foreground">Collection</p>
            <p className="text-sm font-medium">{nft.collection.name}</p>
            {nft.collection.family && (
              <p className="text-xs text-muted-foreground">{nft.collection.family}</p>
            )}
          </div>
        )}

        {/* Description */}
        {nft.description && (
          <div>
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="text-sm line-clamp-2">{nft.description}</p>
          </div>
        )}

        {/* Attributes */}
        {nft.attributes && nft.attributes.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Attributes</p>
            <div className="flex flex-wrap gap-1">
              {nft.attributes.slice(0, 4).map((attr, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {attr.trait_type}: {attr.value}
                </Badge>
              ))}
              {nft.attributes.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{nft.attributes.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t-2 border-border">
          <a
            href={`https://explorer.solana.com/address/${nft.mint}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full gap-2">
              <ExternalLink className="w-3 h-3" />
              Explorer
            </Button>
          </a>
          <Button size="sm" onClick={onList} className="flex-1">
            List for Sale
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
