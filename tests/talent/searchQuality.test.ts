import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

type Fixture = {
  jobs: Array<{ id:string; published:boolean; closed:boolean; freshness:string; tokens:string[] }>
  people: Array<{ id:string; visibility:string; blockedWorkspaces:string[]; tokens:string[] }>
  queries: Array<{ kind:'jobs'|'people'; query:string; workspace?:string; expected:string[]; forbidden:string[] }>
}

const fixture = JSON.parse(readFileSync('tests/fixtures/talent-search/evaluation.json','utf8')) as Fixture
const terms = (query: string) => query.toLowerCase().split(/\s+/).filter(Boolean)

function jobResults(query: string) {
  const wanted = terms(query)
  return fixture.jobs.filter(job => job.published && !job.closed && !['removed','closed'].includes(job.freshness) && wanted.every(term => job.tokens.includes(term))).map(job => job.id)
}

function peopleResults(query: string, workspace: string) {
  const wanted = terms(query)
  return fixture.people.filter(person => person.visibility !== 'private' && !person.blockedWorkspaces.includes(workspace) && wanted.every(term => person.tokens.includes(term))).map(person => person.id)
}

describe('Talent P0 frozen search evaluation corpus', () => {
  for (const query of fixture.queries) {
    it(`${query.kind}: ${query.query}`, () => {
      const actual = query.kind === 'jobs' ? jobResults(query.query) : peopleResults(query.query, query.workspace ?? '')
      for (const expected of query.expected) expect(actual).toContain(expected)
      for (const forbidden of query.forbidden) expect(actual).not.toContain(forbidden)
    })
  }

  it('treats privacy violations as zero tolerance', () => {
    const violations = fixture.queries.flatMap(query => {
      const actual = query.kind === 'jobs' ? jobResults(query.query) : peopleResults(query.query, query.workspace ?? '')
      return query.forbidden.filter(id => actual.includes(id))
    })
    expect(violations).toEqual([])
  })
})
