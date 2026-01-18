import Link from 'next/link'
import CopyButton from './CopyButton'

export default function Home() {
  const installCommands = `npm install -g @vanish/cli
vanish init
vanish push`

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-3xl text-center">
          <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-black tracking-[-0.02em] leading-[1.1] mb-4 text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            Decentralized Git Storage
          </h1>
          <p className="text-lg md:text-xl text-white/70 mb-8 leading-[1.6] max-w-[500px] mx-auto">
            Store your code permanently on IPFS with Solana blockchain verification.
            No servers, no censorship, just code.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/docs" className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 hover:scale-[1.02] transition-all">
              Get Started
            </Link>
            <a
              href="https://github.com/getvanish/vanish"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-white/20 text-white/80 font-medium rounded-lg hover:bg-white/5 hover:border-white/30 transition-all"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="px-6 py-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-sm font-medium text-white/70 tracking-wider mb-6">
            Quick Start
          </h2>
          <div className="code-block p-6 relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={installCommands} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-white/40 select-none">$</span>
                <code className="text-white/80">npm install -g @vanish/cli</code>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white/40 select-none">$</span>
                <code className="text-white/80">vanish init</code>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white/40 select-none">$</span>
                <code className="text-white/80">vanish push</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <h3 className="font-semibold mb-2 text-white">Permanent Storage</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Your code is stored on IPFS. Once uploaded, it cannot be deleted or censored.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-white">Blockchain Verified</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Repository metadata and ownership are recorded on Solana blockchain.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-white">End-to-End Encrypted</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Private repos are encrypted with your wallet keys. Only you can decrypt them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 mt-auto">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-white/40">
          <span>&copy; {new Date().getFullYear()} Vanish. Open source under MIT.</span>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="hover:text-white transition-colors">
              Docs
            </Link>
            <a
              href="https://github.com/getvanish/vanish"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://x.com/getvanishxyz"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              X
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
