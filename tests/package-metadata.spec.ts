import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'))

describe('package.json metadata', () => {
  // npm rejects a provenance publish (E422) unless repository.url matches the GitHub repo
  // that built the package.
  it('points repository.url at the GitHub repo that publishes it', () => {
    expect(pkg.repository).toEqual({
      type: 'git',
      url: 'git+https://github.com/arifinofficial/nest-rsl.git',
    })
  })
})
