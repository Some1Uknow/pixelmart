"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  TransactionModal,
} from "@/components/retroui";
import { useProgram } from "@/hooks/useProgram";
import { useListing } from "@/hooks/useListings";
import { buyNft, cancelListing } from "@/lib/program";
import { formatSol, truncateAddress } from "@/lib/constants";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Wallet,
  ShoppingCart,
  XCircle,
  User,
  Hash,
} from "lucide-react";

type TransactionState = "idle" | "pending" | "success" | "error";

export default function NFTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mintAddress = params.mintAddress as string;
  
  const { publicKey, connected } = useWallet();
  const program = useProgram();
  const { listing, loading, error, refetch } = useListing(mintAddress);

  const [txState, setTxState] = useState<TransactionState>("idle");
  const [txMessage, setTxMessage] = useState("");
  const [txSignature, setTxSignature] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const isOwner = listing && publicKey?.equals(listing.account.seller);
  const price = listing ? listing.account.price.toNumber() / 1e9 : 0;
  const feePercent = listing?.account.feePercent ?? 2; // Default 2%
  const sellerReceives = price * (1 - feePercent / 100);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleBuy = async () => {
    if (!program || !listing) return;

    setTxState("pending");
    setTxMessage("Processing purchase...");

    try {
      const signature = await buyNft(program, new PublicKey(mintAddress));
      setTxSignature(signature);
      setTxState("success");
      setTxMessage("NFT purchased successfully!");
      
      // Refresh listing after successful purchase
      setTimeout(() => {
        refetch();
      }, 2000);
    } catch (err: unknown) {
      console.error("Buy error:", err);
      setTxState("error");
      setTxMessage(
        err instanceof Error ? err.message : "Transaction failed"
      );
    }
  };

  const handleCancel = async () => {
    if (!program || !listing) return;

    setTxState("pending");
    setTxMessage("Cancelling listing...");

    try {
      const signature = await cancelListing(program, new PublicKey(mintAddress));
      setTxSignature(signature);
      setTxState("success");
      setTxMessage("Listing cancelled successfully!");
      
      // Redirect to profile after successful cancel
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (err: unknown) {
      console.error("Cancel error:", err);
      setTxState("error");
      setTxMessage(
        err instanceof Error ? err.message : "Transaction failed"
      );
    }
  };

  const closeModal = () => {
    setTxState("idle");
    setTxMessage("");
    setTxSignature("");
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen container mx-auto px-4 py-8">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explore
        </Link>

        <Card className="max-w-lg mx-auto border-destructive">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="font-head text-2xl font-bold mb-2">NFT Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || "This listing may have been sold or cancelled."}
            </p>
            <div className="flex justify-center">
              <Button onClick={() => router.push("/explore")}>
                Explore Other NFTs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <section className="border-b-2 border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Explore
          </Link>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Image */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="relative aspect-square bg-muted">
                {listing.metadata?.image ? (
                  <Image
                    src={listing.metadata.image}
                    alt={listing.metadata.name || "NFT"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-8xl mb-4">🖼️</div>
                      <p className="text-muted-foreground">No preview available</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Attributes */}
            {listing.metadata?.attributes && listing.metadata.attributes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Attributes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {listing.metadata.attributes.map((attr, i) => (
                      <div
                        key={i}
                        className="p-3 border-2 border-border bg-muted/50 text-center"
                      >
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          {attr.trait_type}
                        </p>
                        <p className="font-bold truncate">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Details */}
          <div className="space-y-6">
            {/* Title & Badge */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="font-head text-3xl md:text-4xl font-bold">
                  {listing.metadata?.name || "Unnamed NFT"}
                </h1>
                {isOwner && <Badge variant="secondary">Your Listing</Badge>}
              </div>
              {listing.metadata?.description && (
                <p className="text-muted-foreground">
                  {listing.metadata.description}
                </p>
              )}
            </div>

            {/* Price Card */}
            <Card className="border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Current Price</span>
                  <Badge variant="outline">Listed</Badge>
                </div>
                <div className="font-head text-4xl md:text-5xl font-bold mb-6">
                  {formatSol(listing.account.price)} SOL
                </div>

                {/* Action Buttons */}
                {!connected ? (
                  <Button className="w-full gap-2" size="lg" disabled>
                    <Wallet className="w-5 h-5" />
                    Connect Wallet to Buy
                  </Button>
                ) : isOwner ? (
                  <Button
                    variant="destructive"
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleCancel}
                  >
                    <XCircle className="w-5 h-5" />
                    Cancel Listing
                  </Button>
                ) : (
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleBuy}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Buy Now
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Fee Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Listing Price</span>
                  <span className="font-bold">{formatSol(listing.account.price)} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Marketplace Fee ({feePercent}%)
                  </span>
                  <span>{(price * feePercent / 100).toFixed(4)} SOL</span>
                </div>
                <div className="border-t-2 border-border pt-3 flex justify-between">
                  <span className="text-muted-foreground">Seller Receives</span>
                  <span className="font-bold text-green-600">
                    {sellerReceives.toFixed(4)} SOL
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailRow
                  icon={<Hash className="w-4 h-4" />}
                  label="Mint Address"
                  value={truncateAddress(mintAddress)}
                  fullValue={mintAddress}
                  copied={copied === "mint"}
                  onCopy={() => copyToClipboard(mintAddress, "mint")}
                />
                <DetailRow
                  icon={<User className="w-4 h-4" />}
                  label="Seller"
                  value={truncateAddress(listing.account.seller.toString())}
                  fullValue={listing.account.seller.toString()}
                  copied={copied === "seller"}
                  onCopy={() =>
                    copyToClipboard(listing.account.seller.toString(), "seller")
                  }
                />
                <DetailRow
                  icon={<ExternalLink className="w-4 h-4" />}
                  label="View on Explorer"
                  value="Open Explorer"
                  href={`https://explorer.solana.com/address/${mintAddress}?cluster=devnet`}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={txState !== "idle"}
        onClose={closeModal}
        state={txState === "idle" ? "pending" : txState}
        title={
          txState === "pending"
            ? "Processing..."
            : txState === "success"
            ? "Success!"
            : "Transaction Failed"
        }
        message={txMessage}
        signature={txSignature}
      />
    </div>
  );
}

// Helper Components

function DetailRow({
  icon,
  label,
  value,
  fullValue,
  copied,
  onCopy,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  fullValue?: string;
  copied?: boolean;
  onCopy?: () => void;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary hover:underline"
        >
          {value}
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <button
          onClick={onCopy}
          className="flex items-center gap-2 font-mono text-sm hover:text-primary transition-colors"
          title={fullValue}
        >
          {value}
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen">
      <section className="border-b-2 border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Skeleton className="h-6 w-32" />
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="space-y-6">
            <div>
              <Skeleton className="h-10 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </div>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </section>
    </div>
  );
}
