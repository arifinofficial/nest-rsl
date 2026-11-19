import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const SCRIPT = resolve(__dirname, '../scripts/check-release.sh')

function git(cwd: string, ...args: string[]) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`)
  return result.stdout.trim()
}

function checkRelease(cwd: string, tag: string) {
  const result = spawnSync('bash', ['scripts/check-release.sh', tag], { cwd, encoding: 'utf8' })
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

describe('scripts/check-release.sh', () => {
  let root: string
  let repo: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'check-release-'))
    repo = join(root, 'repo')
    const remote = join(root, 'remote.git')
    mkdirSync(join(repo, 'scripts'), { recursive: true })
    copyFileSync(SCRIPT, join(repo, 'scripts/check-release.sh'))
    writeFileSync(join(repo, 'package.json'), JSON.stringify({ name: 'x', version: '0.2.0' }))
    git(repo, 'init', '-q', '-b', 'main')
    git(repo, 'config', 'user.email', 'test@example.com')
    git(repo, 'config', 'user.name', 'test')
    git(repo, 'add', '.')
    git(repo, 'commit', '-q', '-m', 'init')
    git(root, 'init', '-q', '--bare', remote)
    git(repo, 'remote', 'add', 'origin', remote)
    git(repo, 'push', '-q', 'origin', 'main')
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('passes for v0.2.0 on a commit in origin/main', () => {
    expect(checkRelease(repo, 'v0.2.0').status).toBe(0)
  })

  it('fails when the tag does not match package.json version (v0.2.1)', () => {
    const result = checkRelease(repo, 'v0.2.1')
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('does not match')
  })

  it('fails for a pre-release tag v0.3.0-beta.1', () => {
    expect(checkRelease(repo, 'v0.3.0-beta.1').status).not.toBe(0)
  })

  it('fails for malformed tags v0.2.0x and release-0.2.0', () => {
    expect(checkRelease(repo, 'v0.2.0x').status).not.toBe(0)
    expect(checkRelease(repo, 'release-0.2.0').status).not.toBe(0)
  })

  it('fails when HEAD is not on origin/main', () => {
    git(repo, 'switch', '-q', '-c', 'side')
    writeFileSync(join(repo, 'extra.txt'), 'x')
    git(repo, 'add', '.')
    git(repo, 'commit', '-q', '-m', 'side')
    const result = checkRelease(repo, 'v0.2.0')
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('origin/main')
  })

  it('fails when origin/main is missing', () => {
    git(repo, 'remote', 'remove', 'origin')
    const result = checkRelease(repo, 'v0.2.0')
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('origin/main')
  })
})
