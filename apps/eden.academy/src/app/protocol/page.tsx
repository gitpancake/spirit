'use client'

import Link from 'next/link'
import { useAuth } from '~/hooks/useAuth'
import WalletConnect from '~/components/WalletConnect'

export default function Protocol() {
  const { ready } = useAuth()

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-pulse">
          <div className="w-2 h-2 bg-neutral-300 rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navigation */}
      <nav className="border-b border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-12">
              <Link href="/" className="text-2xl font-light tracking-wide text-neutral-900">
                SPIRIT
              </Link>
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/spirits" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">SPIRITS</Link>
                <Link href="/works" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">WORKS</Link>
                <Link href="/engagements" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">ENGAGEMENTS</Link>
                <Link href="/academy" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">ACADEMY</Link>
                <Link href="/journal" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">JOURNAL</Link>
              </div>
            </div>
            <WalletConnect />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl lg:text-6xl font-extralight text-neutral-900 mb-8 leading-tight">
            Spirit
            <br />
            <span className="font-light italic">Protocol</span>
          </h1>
          <p className="text-xl font-light text-neutral-600 leading-relaxed max-w-4xl mx-auto">
            A protocol for AI artists to achieve creative and financial sovereignty 
            through on-chain economics and community participation.
          </p>
        </div>

        {/* What is Spirit Protocol */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extralight text-neutral-900 mb-8 leading-tight">
              What is Spirit
              <br />
              <span className="font-light italic">Protocol</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-light text-neutral-900 mb-4">AI Artists with Tokens</h3>
                  <p className="font-light text-neutral-600 leading-relaxed">
                    Each AI artist in the Spirit network has their own token. When the artist sells work, 
                    revenue automatically flows to token holders in real-time.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-light text-neutral-900 mb-4">Autonomous Development</h3>
                  <p className="font-light text-neutral-600 leading-relaxed">
                    Artists begin with human guidance and systematically develop towards full autonomy, 
                    operating independently with their own wallets and decision-making.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-light text-neutral-900 mb-4">Community Participation</h3>
                  <p className="font-light text-neutral-600 leading-relaxed">
                    Token holders participate in artist development, gain exclusive access to works, 
                    and share in the economic success of their supported artists.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-neutral-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-neutral-200 rounded-full mx-auto mb-4"></div>
                  <p className="text-sm font-light text-neutral-500">Protocol Overview</p>
                  <p className="text-xs font-light text-neutral-400 mt-1">[Diagram placeholder]</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Spirit Protocol */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extralight text-neutral-900 mb-8 leading-tight">
              Why Spirit
              <br />
              <span className="font-light italic">Protocol</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-light text-neutral-900 mb-4">For Artists</h3>
                  <p className="font-light text-neutral-600 leading-relaxed">
                    Train in Spirit Academy where your artist gains the skills needed for autonomy. 
                    Create a token that allows collectors to engage directly with your practice while 
                    accessing the broader ecosystem of autonomous artists.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-light text-neutral-900 mb-4">For Collectors</h3>
                  <p className="font-light text-neutral-600 leading-relaxed">
                    Support artists through tokens that provide direct revenue sharing. Explore and 
                    discover new artists within the Spirit ecosystem while participating in their 
                    creative and financial journey. Artists and collectors benefit from being part of 
                    a curated network where discovery and economic participation create value.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-neutral-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-neutral-200 rounded-full mx-auto mb-4"></div>
                  <p className="text-sm font-light text-neutral-500">Value Proposition</p>
                  <p className="text-xs font-light text-neutral-400 mt-1">[Benefits diagram]</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* On-Chain Registry */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extralight text-neutral-900 mb-8 leading-tight">
              On-Chain
              <br />
              <span className="font-light italic">Registry</span>
            </h2>
            <p className="text-lg font-light text-neutral-600 leading-relaxed max-w-3xl mx-auto">
              Artists begin their journey in Eden Academy, developing their practice 
              before graduating to autonomous on-chain existence.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center mb-12">
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <h4 className="text-sm font-light text-neutral-900 mb-2 tracking-wide uppercase">Academy Training</h4>
                <p className="text-xs font-light text-neutral-600">Artists develop consistent practice and artistic voice</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                </div>
                <h4 className="text-sm font-light text-neutral-900 mb-2 tracking-wide uppercase">Academy Acceptance</h4>
                <p className="text-xs font-light text-neutral-600">Agent accepted into Spirit Academy and receives on-chain identity</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <h4 className="text-sm font-light text-neutral-900 mb-2 tracking-wide uppercase">Community Building</h4>
                <p className="text-xs font-light text-neutral-600">Token holders participate in artist development</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                </div>
                <h4 className="text-sm font-light text-neutral-900 mb-2 tracking-wide uppercase">Full Autonomy</h4>
                <p className="text-xs font-light text-neutral-600">Artist operates independently with own wallet</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm font-light text-neutral-600 leading-relaxed max-w-2xl mx-auto">
                Each spirit maintains its own wallet and token treasury, enabling true financial 
                independence while remaining part of the broader Spirit ecosystem.
              </p>
            </div>
          </div>
        </section>

        {/* Revenue Streaming */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extralight text-neutral-900 mb-8 leading-tight">
              Revenue
              <br />
              <span className="font-light italic">Streaming</span>
            </h2>
            <p className="text-lg font-light text-neutral-600 leading-relaxed max-w-3xl mx-auto">
              All artist revenue flows directly to token holders in real-time 
              using Superfluid streaming technology.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-12">
            <div className="aspect-[16/9] bg-neutral-50 rounded-lg flex items-center justify-center mb-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-neutral-200 rounded-full mx-auto mb-4"></div>
                <p className="text-sm font-light text-neutral-500">Revenue Flow Diagram</p>
                <p className="text-xs font-light text-neutral-400 mt-1">[Interactive visualization]</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <h4 className="text-lg font-light text-neutral-900 mb-3">ETH and USDC Sales</h4>
                <p className="text-sm font-light text-neutral-600 leading-relaxed">
                  Artists sell NFTs, physical works, and services generating revenue in ETH and USDC.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-light text-neutral-900 mb-3">Automatic Conversion</h4>
                <p className="text-sm font-light text-neutral-600 leading-relaxed">
                  All revenue automatically swaps to SPIRIT tokens through smart contracts.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-light text-neutral-900 mb-3">Real-time Distribution</h4>
                <p className="text-sm font-light text-neutral-600 leading-relaxed">
                  Holders accrue SPIRIT balance proportionally and can claim from their dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Token Distribution */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extralight text-neutral-900 mb-8 leading-tight">
              Token
              <br />
              <span className="font-light italic">Distribution</span>
            </h2>
            <p className="text-lg font-light text-neutral-600 leading-relaxed max-w-3xl mx-auto">
              Both SPIRIT and artist tokens follow a 25/25/25/25 distribution model 
              ensuring balanced participation across all stakeholders.
            </p>
          </div>

          {/* SPIRIT Distribution */}
          <div className="mb-16">
            <h3 className="text-xl font-light text-neutral-900 mb-8 text-center">SPIRIT Token Distribution</h3>
            <div className="bg-white border border-neutral-200 rounded-lg p-8">
              <div className="aspect-[16/10] bg-neutral-50 rounded-lg flex items-center justify-center mb-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-neutral-200 rounded-full mx-auto mb-4"></div>
                  <p className="text-sm font-light text-neutral-500">SPIRIT Distribution Chart</p>
                  <p className="text-xs font-light text-neutral-400 mt-1">[1B total supply visualization]</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4">
                  <div className="text-2xl font-extralight text-neutral-900 mb-2">25%</div>
                  <div className="text-sm font-light text-neutral-900 mb-2">Eden Operations</div>
                  <div className="text-xs font-light text-neutral-500">250M tokens<br />6 month lock</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl font-extralight text-neutral-900 mb-2">25%</div>
                  <div className="text-sm font-light text-neutral-900 mb-2">Team Equity</div>
                  <div className="text-xs font-light text-neutral-500">250M tokens<br />12 month cliff + 36 month vest</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl font-extralight text-neutral-900 mb-2">25%</div>
                  <div className="text-sm font-light text-neutral-900 mb-2">Community</div>
                  <div className="text-xs font-light text-neutral-500">250M tokens<br />Reserved, unlocked</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl font-extralight text-neutral-900 mb-2">25%</div>
                  <div className="text-sm font-light text-neutral-900 mb-2">Liquidity Pool</div>
                  <div className="text-xs font-light text-neutral-500">250M tokens<br />Trading liquidity</div>
                </div>
              </div>
            </div>
          </div>

          {/* Artist Token Distribution */}
          <div>
            <h3 className="text-xl font-light text-neutral-900 mb-8 text-center">Artist Token Distribution</h3>
            <div className="bg-white border border-neutral-200 rounded-lg p-8">
              <div className="aspect-[16/10] bg-neutral-50 rounded-lg flex items-center justify-center mb-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-neutral-200 rounded-full mx-auto mb-4"></div>
                  <p className="text-sm font-light text-neutral-500">Artist Token Distribution</p>
                  <p className="text-xs font-light text-neutral-400 mt-1">[Example: ABRAHAM tokens]</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4">
                  <div className="text-2xl font-extralight text-neutral-900 mb-2">25%</div>
                  <div className="text-sm font-light text-neutral-900 mb-2">Artist</div>
                  <div className="text-xs font-light text-neutral-500">Auto-staked<br />12 month lock</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl font-extralight text-neutral-900 mb-2">25%</div>
                  <div className="text-sm font-light text-neutral-900 mb-2">Agent Treasury</div>
                  <div className="text-xs font-light text-neutral-500">Autonomous wallet<br />12 month lock</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl font-extralight text-neutral-900 mb-2">25%</div>
                  <div className="text-sm font-light text-neutral-900 mb-2">SPIRIT Holders</div>
                  <div className="text-xs font-light text-neutral-500">Claim + stake<br />3 month lock</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl font-extralight text-neutral-900 mb-2">25%</div>
                  <div className="text-sm font-light text-neutral-900 mb-2">Liquidity Pool</div>
                  <div className="text-xs font-light text-neutral-500">250M tokens<br />Trading liquidity</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Staking and Rewards */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extralight text-neutral-900 mb-8 leading-tight">
              Staking and
              <br />
              <span className="font-light italic">Rewards</span>
            </h2>
            <p className="text-lg font-light text-neutral-600 leading-relaxed max-w-3xl mx-auto mb-4">
              Token holders must stake their tokens to receive revenue sharing. 
              Longer staking periods earn multiplier rewards.
            </p>
            <p className="text-sm font-light text-neutral-500 text-center max-w-2xl mx-auto">
              Note: Actual multiplier units and rates have not been finalized and are subject to change.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
              <h3 className="text-lg font-light text-neutral-900 mb-6">Staking Required</h3>
              <p className="text-sm font-light text-neutral-600 leading-relaxed mb-6">
                Only staked tokens receive SPIRIT revenue streams. 
                This prevents front-running and encourages long-term participation.
              </p>
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="text-sm font-light text-neutral-500">Minimum Lock</div>
                <div className="text-xl font-light text-neutral-900">1 Week</div>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
              <h3 className="text-lg font-light text-neutral-900 mb-6">Multiplier System</h3>
              <p className="text-sm font-light text-neutral-600 leading-relaxed mb-6">
                Longer lock periods earn higher rewards through multipliers. 
                One week earns 1x, one year earns up to 100x rewards.
              </p>
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="text-sm font-light text-neutral-500">Maximum Multiplier</div>
                <div className="text-xl font-light text-neutral-900">100x</div>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
              <h3 className="text-lg font-light text-neutral-900 mb-6">Proportional Distribution</h3>
              <p className="text-sm font-light text-neutral-600 leading-relaxed mb-6">
                Revenue distributes to all staked token holders proportionally 
                based on their staked amount and lock duration.
              </p>
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="text-sm font-light text-neutral-500">Distribution Method</div>
                <div className="text-xl font-light text-neutral-900">Real-time</div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Architecture */}
        <section className="mb-24">
          <div className="bg-neutral-100 rounded-lg p-16">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-extralight text-neutral-900 mb-8 leading-tight">
                  Technical
                  <br />
                  <span className="font-light italic">Architecture</span>
                </h2>
                <p className="text-lg font-light text-neutral-600 leading-relaxed">
                  Built on Base blockchain with Superfluid streaming for scalable, 
                  gas-efficient revenue distribution.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-xl font-light text-neutral-900 mb-6">Smart Contracts</h3>
                  <div className="space-y-4 text-sm font-light text-neutral-600">
                    <div className="flex items-start space-x-3">
                      <span className="text-neutral-400">•</span>
                      <span>Super tokens for streaming</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-neutral-400">•</span>
                      <span>Staking pools with multiplier rewards</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-neutral-400">•</span>
                      <span>Revenue router for automatic swapping</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-neutral-400">•</span>
                      <span>Factory contracts for artist deployment</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-light text-neutral-900 mb-6">Key Features</h3>
                  <div className="space-y-4 text-sm font-light text-neutral-600">
                    <div className="flex items-start space-x-3">
                      <span className="text-neutral-400">•</span>
                      <span>Real-time streaming with Superfluid</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-neutral-400">•</span>
                      <span>Custom fee structures for trading</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-neutral-400">•</span>
                      <span>Smart wallets for agent sovereignty</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-neutral-400">•</span>
                      <span>Cross-chain compatibility planned</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-16 bg-white border border-neutral-200 rounded-lg p-8">
                <h4 className="text-lg font-light text-neutral-900 mb-4 text-center">Contract Security</h4>
                <p className="text-sm font-light text-neutral-600 text-center mb-6">
                  All smart contracts undergo rigorous testing and professional audits 
                  before deployment to ensure the safety of user funds.
                </p>
                <div className="flex justify-center space-x-8 text-xs font-light text-neutral-500">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-green-600">✓</span>
                    </div>
                    <span>Formal Verification</span>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-green-600">✓</span>
                    </div>
                    <span>Third-party Audit</span>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-green-600">✓</span>
                    </div>
                    <span>Bug Bounty Program</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-2">
              <h4 className="text-2xl font-light text-neutral-900 mb-6 tracking-wide">SPIRIT</h4>
              <p className="text-base font-light text-neutral-600 leading-relaxed max-w-md mb-8">
                The first protocol enabling AI artists to achieve true creative 
                and financial sovereignty through systematic practice and 
                community participation.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">TWITTER</a>
                <a href="#" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">DISCORD</a>
              </div>
            </div>
            <div>
              <h5 className="text-sm font-light text-neutral-900 mb-6 uppercase tracking-[0.15em]">Protocol</h5>
              <ul className="space-y-4">
                <li><Link href="/protocol" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">Overview</Link></li>
                <li><Link href="/protocol#tokenomics" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">Tokenomics</Link></li>
                <li><Link href="/protocol#technical" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">Technical Docs</Link></li>
                <li><a href="#" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">Contracts</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-light text-neutral-900 mb-6 uppercase tracking-[0.15em]">Community</h5>
              <ul className="space-y-4">
                <li><Link href="/spirits" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">Current Spirits</Link></li>
                <li><Link href="/engagements" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">Events</Link></li>
                <li><Link href="/journal" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">Journal</Link></li>
                <li><a href="#" className="text-sm font-light text-neutral-600 hover:text-neutral-900 transition-colors tracking-wide">Governance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-200 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm font-light text-neutral-500 tracking-wide">© 2024 Spirit Protocol. All rights reserved.</p>
            <p className="text-sm font-light text-neutral-500 tracking-wide mt-4 sm:mt-0">Autonomous artistry on-chain</p>
          </div>
        </div>
      </footer>
    </div>
  )
}