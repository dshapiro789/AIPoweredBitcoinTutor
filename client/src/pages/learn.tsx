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
          <Link href="/dashboard">
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
      "Bitcoin Basics": [
        {
          title: "Historical Context",
          content: `- 2008 Financial Crisis: Global banking system near collapse
- Widespread distrust in traditional financial institutions
- Need for alternative to centralized monetary control
- Growing concerns about privacy and financial sovereignty

Key Events in Bitcoin's Creation:
- October 31, 2008: Satoshi Nakamoto publishes "Bitcoin: A Peer-to-Peer Electronic Cash System"
- January 3, 2009: Genesis block mined with Times headline about bank bailouts
- January 12, 2009: First transaction between Satoshi and Hal Finney
- May 22, 2010: First real-world transaction (Bitcoin Pizza Day - 10,000 BTC for two pizzas)
- 2011: Satoshi Nakamoto disappears, leaving Bitcoin truly decentralized

Satoshi Nakamoto's Vision:
- Create a truly peer-to-peer electronic cash system
- Eliminate dependency on financial intermediaries
- Solve the double-spending problem without central authority
- Enable borderless, permissionless financial transactions
- Establish a new paradigm of sound money`
        },
        {
          title: "Bitcoin's Revolutionary Monetary Policy",
          content: `Core Economic Principles:
- Fixed Supply Cap: Maximum of 21 million bitcoins
- Predictable Issuance: Mathematically controlled release schedule
- Halving Events: Block rewards reduce by 50% every 210,000 blocks (≈4 years)
- Deflationary Design: Increasing scarcity drives long-term value preservation

Comparison with Fiat Currency:
- Fiat Money:
  • Unlimited supply potential
  • Subject to political influence
  • Opaque monetary policy
  • Historical tendency toward debasement

- Bitcoin:
  • Mathematically limited supply
  • Immune to political manipulation
  • Transparent monetary policy
  • Programmatically enforced scarcity

Economic Impact:
- Store of Value: Digital gold for the information age
- Global Reserve Asset: Alternative to government-issued currencies
- Financial Inclusion: Banking the unbanked globally
- Monetary Revolution: First truly scarce digital asset`
        }
      ],
      "Wallet Security": [
        {
          title: "Comprehensive Guide to Bitcoin Wallets",
          content: `Wallet Categories:
- Hot Wallets (Online):
  • Software wallets on computers
  • Mobile wallet applications
  • Web-based wallet services
  • Exchange-provided wallets

- Cold Storage (Offline):
  • Hardware wallets (Ledger, Trezor)
  • Paper wallets
  • Air-gapped computers
  • Steel backup solutions

Security Considerations:
- Private Key Management:
  • Seed phrase generation
  • Backup procedures
  • Access control
  • Key rotation practices

- Physical Security:
  • Safe storage locations
  • Multiple copies
  • Fire and water protection
  • Tamper-evident seals

Common Threats:
- Malware and viruses
- Phishing attacks
- Social engineering
- Physical theft
- Hardware failures`
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
            <p className="text-muted-foreground">Learn about this fundamental aspect of Bitcoin and explore its role in the cryptocurrency ecosystem.</p>
          </div>
          <Link href="/dashboard">
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