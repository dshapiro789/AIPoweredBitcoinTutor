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
      "Bitcoin Basics": [
        {
          title: "The Birth of Bitcoin",
          content: `Bitcoin emerged during one of the most significant financial crises in modern history. Understanding its creation is crucial to appreciating its importance:

Historical Context:
- 2008 Financial Crisis: Global banking system near collapse
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
          content: `Bitcoin's monetary policy represents a fundamental shift from traditional fiat currency systems:

Core Economic Principles:
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
        },
        {
          title: "Bitcoin as Protection Against Monetary Instability",
          content: `Bitcoin serves as a powerful hedge against various forms of monetary instability:

Protection Mechanisms:
- Currency Debasement Defense:
  • Fixed supply prevents artificial inflation
  • Immune to government printing
  • Value proposition increases with fiat devaluation
  • Natural shield against monetary expansion

- Political & Economic Safeguards:
  • Resistance to confiscation
  • Protection from capital controls
  • Hedge against bank failures
  • Insurance against monetary policy mistakes

Historical Examples:
- Venezuela (2018-Present):
  • Hyperinflation exceeded 1,000,000%
  • Bitcoin provided escape from worthless bolivar
  • Enabled continued commerce despite currency collapse

- Lebanon (2019-Present):
  • Banking system collapse
  • Capital controls imposed
  • Bitcoin enabled wealth preservation
  • Facilitated international transactions

- Turkey (2021-Present):
  • Severe currency devaluation
  • High inflation rates
  • Bitcoin adoption increased
  • Served as alternative store of value

Modern Monetary Risks:
- Unprecedented Global Debt Levels
- Negative Interest Rate Policies
- Modern Monetary Theory Experiments
- Currency Wars and Devaluation Races`
        },
        {
          title: "Technical Architecture and Innovation",
          content: `Bitcoin's technical foundation represents a breakthrough in computer science and cryptography:

Core Components:
- Blockchain Technology:
  • Distributed ledger architecture
  • Cryptographic linking of blocks
  • Immutable transaction history
  • Transparent public record

- Consensus Mechanism:
  • Proof of Work (PoW) mining
  • Network synchronization
  • Double-spend prevention
  • Decentralized agreement

- Cryptographic Security:
  • Public key cryptography
  • Digital signatures
  • Hash functions
  • Merkle trees

Innovation and Evolution:
- Layer 1 Improvements:
  • SegWit for transaction efficiency
  • Taproot for privacy and smart contracts
  • Schnorr signatures for scalability
  • MAST for complex scripts

- Layer 2 Solutions:
  • Lightning Network for instant payments
  • Sidechains for extended functionality
  • State channels for scalability
  • Cross-chain atomic swaps

Future Developments:
- Privacy Enhancements
- Smart Contract Capabilities
- Scaling Solutions
- Network Resilience Improvements`
        }
      ],
      "Wallet Security": [
        {
          title: "Comprehensive Guide to Bitcoin Wallets",
          content: `Understanding the different types of Bitcoin wallets and their security implications is crucial for protecting your assets:

Wallet Categories:
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
        },
        {
          title: "Advanced Wallet Security Implementation",
          content: `Implementing robust security measures for your Bitcoin wallet:

Essential Security Protocols:
- Multi-Signature Setup:
  • 2-of-3 multisig configuration
  • Key holder distribution
  • Recovery procedures
  • Quorum requirements

- Backup Strategies:
  • Geographic distribution
  • Multiple formats
  • Regular verification
  • Recovery testing

- Access Control:
  • Two-factor authentication
  • Time-locks
  • Spending limits
  • Whitelisted addresses

Emergency Procedures:
- Inheritance Planning:
  • Dead man's switch
  • Key distribution
  • Legal documentation
  • Beneficiary access

- Compromise Response:
  • Emergency fund movement
  • Key revocation
  • New wallet creation
  • Access revocation

Best Practices:
- Regular security audits
- Software updates
- Test transactions
- Security model review`
        }
      ],
      "Transaction Fundamentals": [
        {
          title: "Understanding Bitcoin Transactions",
          content: `A deep dive into how Bitcoin transactions work and their fundamental components:

Transaction Structure:
- Inputs (Previous Transactions):
  • Reference to previous outputs
  • Unlocking scripts
  • Signature verification
  • Amount validation

- Outputs (New Recipients):
  • Destination addresses
  • Amount specifications
  • Locking scripts
  • Change management

Transaction Process:
- Creation Phase:
  • Input selection
  • Output specification
  • Fee calculation
  • Script construction

- Verification:
  • Signature validation
  • Script execution
  • Double-spend check
  • Network propagation

Network Aspects:
- Mempool management
- Block inclusion
- Confirmation process
- Transaction finality`
        },
        {
          title: "Advanced Transaction Features and Strategies",
          content: `Understanding and utilizing Bitcoin's advanced transaction capabilities:

Transaction Types:
- Standard Transactions:
  • P2PKH (Pay to Public Key Hash)
  • P2SH (Pay to Script Hash)
  • P2WPKH (Native SegWit)
  • P2TR (Taproot)

- Advanced Features:
  • Replace-By-Fee (RBF):
    - Fee bumping strategy
    - Transaction replacement
    - Confirmation priority
    - Merchant considerations

  • Child-Pays-For-Parent (CPFP):
    - Fee acceleration
    - Stuck transaction resolution
    - Mining incentives
    - Wallet implementation

Privacy Considerations:
- Chain Analysis Prevention:
  • Coin selection strategies
  • Address reuse avoidance
  • Transaction batching
  • Amount obscuring

- Advanced Techniques:
  • CoinJoin participation
  • PayJoin integration
  • Lightning Network usage
  • Submarine swaps`
        }
      ],
      "UTXO Management": [
        {
          title: "UTXO Model Deep Dive",
          content: `Understanding the Unspent Transaction Output (UTXO) model and its implications:

UTXO Fundamentals:
- Basic Concepts:
  • UTXO creation and destruction
  • State transitions
  • Transaction atomicity
  • Balance calculation

- UTXO Set:
  • Global state representation
  • Mempool integration
  • Chain reorganizations
  • Validation requirements

Implementation Details:
- Chain State:
  • UTXO database
  • State updates
  • Pruning considerations
  • Memory pool management

- Script Verification:
  • Input validation
  • Output creation
  • Script execution
  • Signature checks`
        },
        {
          title: "Advanced UTXO Management Strategies",
          content: `Optimizing UTXO handling for efficient Bitcoin usage:

Optimization Techniques:
- Coin Selection:
  • Branch and bound algorithm
  • Fee optimization
  • Change output minimization
  • UTXO consolidation

- Privacy Enhancement:
  • Input mixing
  • Output splitting
  • Change address management
  • Coin control

Economic Considerations:
- Fee Management:
  • UTXO cost calculation
  • Dust threshold handling
  • Consolidation timing
  • Batching strategies

- Advanced Concepts:
  • Package relay
  • Ancestor/descendant limits
  • Mempool interaction
  • Mining prioritization`
        }
      ],
      "Cold Storage": [
        {
          title: "Cold Storage Systems and Implementation",
          content: `Comprehensive guide to implementing secure cold storage solutions:

Cold Storage Architecture:
- System Components:
  • Air-gapped computers
  • Hardware security modules
  • Paper wallet generators
  • Steel backup solutions

- Security Layers:
  • Physical security
  • Digital protection
  • Access controls
  • Redundancy systems

Implementation Methods:
- Key Generation:
  • Entropy sources
  • Deterministic generation
  • Verification procedures
  • Backup creation

- Storage Solutions:
  • Hardware wallets
  • Paper backups
  • Metal plates
  • Distributed copies`
        },
        {
          title: "Professional Cold Storage Operations",
          content: `Enterprise-grade cold storage security measures and procedures:

Security Infrastructure:
- Physical Security:
  • Vault systems
  • Access controls
  • Environmental protection
  • Surveillance systems

- Operational Security:
  • Multi-signature schemes
  • Geographic distribution
  • Backup verification
  • Regular audits

Emergency Procedures:
- Disaster Recovery:
  • Fire protection
  • Flood mitigation
  • Theft prevention
  • Hardware failure

- Access Management:
  • Role-based controls
  • Time-lock mechanisms
  • Duress protocols
  • Inheritance planning`
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