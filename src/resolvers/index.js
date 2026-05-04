import Resolver from '@forge/resolver';

// Resolver is required by jira:issueContext when declared in the manifest; keep definitions minimal.
const resolver = new Resolver();

export const handler = resolver.getDefinitions();
