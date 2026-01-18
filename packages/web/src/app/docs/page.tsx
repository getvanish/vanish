import Link from 'next/link'

export default function DocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link href="/" className="text-sm text-white/50 hover:text-white transition-colors mb-8 inline-block">
        &larr; Back
      </Link>

      <h1 className="text-4xl font-bold mb-12 text-white">Documentation</h1>

      {/* Installation */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-white">Installation</h2>
        <div className="code-block p-4">
          <code className="text-white/80">npm install -g @vanish/cli</code>
        </div>
      </section>

      {/* Getting Started */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-white">Getting Started</h2>
        <div className="space-y-8">
          <div>
            <h3 className="font-medium mb-3 text-white">1. Authenticate</h3>
            <p className="text-white/60 text-sm mb-3">
              Connect your Solana wallet or generate a new keypair:
            </p>
            <div className="code-block p-4">
              <code className="text-white/80">vanish auth</code>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3 text-white">2. Initialize</h3>
            <p className="text-white/60 text-sm mb-3">
              Navigate to your git repository:
            </p>
            <div className="code-block p-4 space-y-1">
              <div><code className="text-white/80">cd your-project</code></div>
              <div><code className="text-white/80">vanish init</code></div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3 text-white">3. Push</h3>
            <p className="text-white/60 text-sm mb-3">
              Upload to IPFS and record on Solana:
            </p>
            <div className="code-block p-4">
              <code className="text-white/80">vanish push</code>
            </div>
          </div>
        </div>
      </section>

      {/* Commands */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-white">Commands</h2>
        <div className="space-y-6">
          <Command
            name="vanish init"
            description="Initialize Vanish in current directory"
            flags={[
              ['-n, --name', 'Repository name'],
              ['-d, --description', 'Description'],
              ['-p, --private', 'Make private'],
            ]}
          />
          <Command
            name="vanish auth"
            description="Authenticate with Solana wallet"
            flags={[
              ['-k, --keypair', 'Path to keypair file'],
              ['--generate', 'Generate new keypair'],
            ]}
          />
          <Command
            name="vanish push"
            description="Push repository to Vanish"
            flags={[
              ['-f, --force', 'Force push'],
            ]}
          />
          <Command
            name="vanish clone"
            description="Clone a repository"
            flags={[
              ['<owner> <repo>', 'Owner pubkey and repo name'],
              ['-o, --output', 'Output directory'],
            ]}
          />
          <Command
            name="vanish list"
            description="List repositories"
            flags={[
              ['-u, --user', 'List for specific user'],
            ]}
          />
          <Command
            name="vanish config"
            description="Manage configuration"
            flags={[
              ['--network', 'Set network (mainnet/devnet)'],
            ]}
          />
        </div>
      </section>

      {/* SDK */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-white">SDK</h2>
        <div className="code-block p-4 mb-4">
          <code className="text-white/80">npm install @vanish/sdk</code>
        </div>
        <div className="code-block p-4 overflow-x-auto">
          <pre className="text-sm text-white/80">{`import { VanishClient } from '@vanish/sdk'

const client = new VanishClient({ network: 'devnet' })
client.setKeypair(keypair)

await client.createRepository('my-repo', 'Description', false)
const result = await client.pushRepository('./path', 'my-repo')`}</pre>
        </div>
      </section>

      {/* Architecture */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-white">How It Works</h2>
        <div className="space-y-4 text-sm text-white/60">
          <p>
            <strong className="text-white">1.</strong> Your code is bundled locally using Git
          </p>
          <p>
            <strong className="text-white">2.</strong> Bundle is uploaded to IPFS (optionally encrypted)
          </p>
          <p>
            <strong className="text-white">3.</strong> IPFS CID and metadata are recorded on Solana
          </p>
          <p>
            <strong className="text-white">4.</strong> Anyone can verify ownership via blockchain
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-white/10 text-sm text-white/40">
        <a
          href="https://github.com/getvanish/vanish"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
        >
          View on GitHub &rarr;
        </a>
      </footer>
    </div>
  )
}

function Command({
  name,
  description,
  flags,
}: {
  name: string
  description: string
  flags: [string, string][]
}) {
  return (
    <div className="border border-white/10 rounded-lg p-4 bg-black/20 backdrop-blur-sm">
      <div className="font-mono text-sm font-medium mb-1 text-white">{name}</div>
      <div className="text-sm text-white/60 mb-3">{description}</div>
      {flags.length > 0 && (
        <div className="space-y-1">
          {flags.map(([flag, desc]) => (
            <div key={flag} className="flex text-xs">
              <code className="text-white/70 w-36 flex-shrink-0">{flag}</code>
              <span className="text-white/40">{desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
