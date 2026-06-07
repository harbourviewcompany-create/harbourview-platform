/**
 * Tests for lib/hf/repos.ts
 * Verifies: all repos are private-named, org prefix is correct,
 * guards reject unapproved repos, approved list is complete.
 */

import { describe, it, expect } from 'vitest';
import {
  HF_ORG,
  HF_DATASET_REPOS,
  HF_MODEL_REPOS,
  ALL_APPROVED_REPOS,
  assertApprovedRepo,
  assertHarbourviewOrg,
} from '../repos';
import { HfError } from '../errors';

describe('HF_ORG', () => {
  it('is Harbourview (not harbourview-ai or any other slug)', () => {
    expect(HF_ORG).toBe('Harbourview');
  });
});

describe('HF_DATASET_REPOS', () => {
  it('all dataset repos start with Harbourview/', () => {
    for (const [key, id] of Object.entries(HF_DATASET_REPOS)) {
      expect(id, `${key} must start with Harbourview/`).toMatch(/^Harbourview\//);
    }
  });

  it('all dataset repos contain "private" in the name', () => {
    for (const [key, id] of Object.entries(HF_DATASET_REPOS)) {
      expect(id, `${key} must contain "private"`).toContain('private');
    }
  });

  it('has all eight required dataset repos', () => {
    const required = [
      'sourceCorpus',
      'entityCandidates',
      'reviewedFacts',
      'releaseCandidates',
      'marketplaceEnrichment',
      'educationCorpus',
      'evalSets',
      'rejectedSignals',
    ];
    for (const key of required) {
      expect(HF_DATASET_REPOS).toHaveProperty(key);
    }
  });

  it('uses hv-release-candidates-private (not hv-public-safe-facts)', () => {
    expect(HF_DATASET_REPOS.releaseCandidates).toBe(
      'Harbourview/hv-release-candidates-private',
    );
    expect(Object.values(HF_DATASET_REPOS).join(',')).not.toContain('public-safe-facts');
  });
});

describe('HF_MODEL_REPOS', () => {
  it('all model repos start with Harbourview/', () => {
    for (const [key, id] of Object.entries(HF_MODEL_REPOS)) {
      expect(id, `${key} must start with Harbourview/`).toMatch(/^Harbourview\//);
    }
  });

  it('has all four required model repos', () => {
    const required = [
      'extractionPrompts',
      'classifiers',
      'rerankerEvals',
      'embeddingEvals',
    ];
    for (const key of required) {
      expect(HF_MODEL_REPOS).toHaveProperty(key);
    }
  });
});

describe('ALL_APPROVED_REPOS', () => {
  it('contains all dataset and model repos', () => {
    for (const id of Object.values(HF_DATASET_REPOS)) {
      expect(ALL_APPROVED_REPOS).toContain(id);
    }
    for (const id of Object.values(HF_MODEL_REPOS)) {
      expect(ALL_APPROVED_REPOS).toContain(id);
    }
  });

  it('has exactly 12 repos (8 dataset + 4 model)', () => {
    expect(ALL_APPROVED_REPOS).toHaveLength(12);
  });

  it('contains no public repo names', () => {
    for (const id of ALL_APPROVED_REPOS) {
      expect(id, `${id} must not be a public-facing name`).not.toMatch(
        /public-safe-facts|public-release|harbourview-ai\//,
      );
    }
  });
});

describe('assertApprovedRepo', () => {
  it('does not throw for approved dataset repos', () => {
    for (const id of Object.values(HF_DATASET_REPOS)) {
      expect(() => assertApprovedRepo(id)).not.toThrow();
    }
  });

  it('does not throw for approved model repos', () => {
    for (const id of Object.values(HF_MODEL_REPOS)) {
      expect(() => assertApprovedRepo(id)).not.toThrow();
    }
  });

  it('throws HfError with HF_FORBIDDEN for unapproved repos', () => {
    expect(() => assertApprovedRepo('Harbourview/some-random-repo')).toThrow(HfError);
    try {
      assertApprovedRepo('Harbourview/some-random-repo');
    } catch (e) {
      expect((e as HfError).code).toBe('HF_FORBIDDEN');
    }
  });

  it('throws for harbourview-ai/ prefix (old wrong slug)', () => {
    expect(() =>
      assertApprovedRepo('harbourview-ai/hv-source-corpus-private'),
    ).toThrow(HfError);
  });

  it('throws for empty string', () => {
    expect(() => assertApprovedRepo('')).toThrow(HfError);
  });
});

describe('assertHarbourviewOrg', () => {
  it('does not throw for Harbourview/ prefix', () => {
    expect(() => assertHarbourviewOrg('Harbourview/anything')).not.toThrow();
  });

  it('throws for harbourview-ai/ prefix', () => {
    expect(() => assertHarbourviewOrg('harbourview-ai/anything')).toThrow(HfError);
  });

  it('throws for no org prefix', () => {
    expect(() => assertHarbourviewOrg('hv-source-corpus-private')).toThrow(HfError);
  });
});
