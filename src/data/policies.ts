import type { PolicyDocument, SiteContent } from '../api/types'

export type PolicyKey = 'privacy' | 'terms' | 'returns'

export type PolicyPageDef = {
  key: PolicyKey
  path: string
  label: string
}

/** The three policy documents. Routes are structural; the words come from the CMS. */
export const POLICY_PAGES: PolicyPageDef[] = [
  { key: 'privacy', path: '/privacy', label: 'Privacy' },
  { key: 'terms', path: '/terms', label: 'Terms' },
  { key: 'returns', path: '/returns', label: 'Returns' },
]

const EMPTY_DOCUMENT: PolicyDocument = { title: '', lede: '', sections: [] }

/** A document the owner has blanked still renders a page rather than crashing. */
export function policyDocument(
  policies: SiteContent['policies'] | undefined,
  key: PolicyKey,
): PolicyDocument {
  const document = policies?.[key]
  if (!document || typeof document !== 'object') return EMPTY_DOCUMENT
  return {
    title: typeof document.title === 'string' ? document.title : '',
    lede: typeof document.lede === 'string' ? document.lede : '',
    sections: Array.isArray(document.sections) ? document.sections : [],
  }
}

/** Label for a policy link: the owner's heading if there is one, else the route label. */
export function policyLabel(
  policies: SiteContent['policies'] | undefined,
  page: PolicyPageDef,
): string {
  return policyDocument(policies, page.key).title || page.label
}
