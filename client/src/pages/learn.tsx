import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { BitcoinTopic } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronLeft, Book } from "lucide-react";

export default function LearnPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const { t } = useTranslation();

  const { data: topic, isLoading, error } = useQuery<BitcoinTopic>({
    queryKey: [`/api/bitcoin/topics/${topicId}`],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-destructive">{t('error.failedToLoad')}</p>
          <Link href="/">
            <Button variant="outline" className="mt-4">
              {t('common.back')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getTopicContent = (topicName: string) => {
    const content: Record<string, { title: string; content: string }[]> = {
      "Wallet Security": [
        {
          title: "Types of Bitcoin Wallets",
          content: `Bitcoin wallets come in several forms, each with its own security implications:

Key Concepts:
- Hot Wallets: Connected to the internet, convenient but less secure
- Cold Storage: Offline wallets for maximum security
- Hardware Wallets: Physical devices that secure private keys
- Paper Wallets: Physical documents containing keys

Security Considerations:
- Private Key Management
- Backup Procedures
- Two-Factor Authentication
- Physical Security Measures`
        },
        {
          title: "Best Practices for Wallet Security",
          content: `Essential security measures for protecting your Bitcoin:

Key Practices:
- Regular Backups: Store seed phrases securely
- Multiple Signatures: Require multiple keys for transactions
- Hardware Security: Use dedicated security devices
- Access Controls: Implement strong authentication

Advanced Security:
- Multi-location Backups
- Emergency Recovery Plans
- Regular Security Audits
- Update Management`
        }
      ],
      "Transaction Fundamentals": [
        {
          title: "Understanding Bitcoin Transactions",
          content: `Bitcoin transactions are the foundation of the network:

Key Components:
- Inputs: Previously received Bitcoin
- Outputs: Addresses receiving Bitcoin
- Transaction Fees: Priority payments to miners
- Digital Signatures: Proof of ownership

Transaction Process:
- Creation and Signing
- Network Broadcast
- Miner Verification
- Block Confirmation`
        },
        {
          title: "Advanced Transaction Concepts",
          content: `Deep dive into complex transaction features:

Advanced Features:
- Replace-By-Fee (RBF)
- Child-Pays-For-Parent (CPFP)
- Time-Locked Transactions
- Multi-signature Transactions

Best Practices:
- Fee Estimation
- Confirmation Monitoring
- Change Management
- Transaction Privacy`
        }
      ],
      "Cold Storage": [
        {
          title: "Introduction to Cold Storage",
          content: `Cold storage is the safest way to store Bitcoin:

Core Concepts:
- Air-gapped Systems
- Hardware Wallets
- Paper Wallets
- Multi-signature Setups

Implementation:
- Key Generation
- Backup Creation
- Verification Process
- Recovery Testing`
        },
        {
          title: "Advanced Cold Storage Techniques",
          content: `Professional-grade Bitcoin security:

Security Measures:
- Geographic Distribution
- Physical Security
- Inheritance Planning
- Regular Verification

Best Practices:
- Multiple Backups
- Environmental Protection
- Access Controls
- Periodic Testing`
        }
      ],
      "UTXO Management": [
        {
          title: "Understanding UTXOs",
          content: `Unspent Transaction Outputs (UTXOs) are fundamental to Bitcoin:

Basic Concepts:
- UTXO Set
- Transaction Inputs
- Output Creation
- Change Management

UTXO Lifecycle:
- Creation
- Spending
- Confirmation
- Chain State`
        },
        {
          title: "Advanced UTXO Strategies",
          content: `Optimize your Bitcoin transactions:

Management Techniques:
- Coin Selection
- Fee Optimization
- Privacy Enhancement
- Dust Management

Best Practices:
- UTXO Consolidation
- Input/Output Planning
- Transaction Batching
- Change Handling`
        }
      ]
    };

    return content[topicName] || [{
      title: topicName,
      content: topic.description
    }];
  };

  const articles = getTopicContent(topic.name);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{topic.name}</h1>
            <p className="text-muted-foreground">{topic.description}</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              {t('common.back')}
            </Button>
          </Link>
        </div>

        {/* Articles */}
        <div className="space-y-6">
          {articles.map((article, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="w-5 h-5" />
                  {article.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {article.content.split('\n\n').map((section, i) => {
                    if (!section.trim()) return null;

                    if (section.includes('\n-')) {
                      const [title, ...points] = section.split('\n');
                      return (
                        <div key={i} className="mb-4">
                          {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
                          <ul className="space-y-1">
                            {points.map((point, j) => (
                              <li key={j} className="flex items-start gap-2">
                                <span className="select-none">•</span>
                                <span>{point.replace('-', '').trim()}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }

                    return (
                      <p key={i} className="mb-4">
                        {section}
                      </p>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}