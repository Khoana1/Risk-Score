import React, { useEffect, useMemo, useState } from 'react';
import ForgeReconciler, { Stack, Strong, Text, useProductContext } from '@forge/react';
import { requestJira } from '@forge/bridge';

function formatCreated(iso) {
  if (!iso) {
    return '—';
  }
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

/**
 * useProductContext() is undefined on first paint; view.getContext() resolves async.
 * Do not treat missing extension as an error until context has loaded.
 */
function resolveIssueRef(context) {
  if (!context?.extension) {
    return undefined;
  }
  const ext = context.extension;
  const key = ext.issue?.key ?? ext.issueKey;
  if (key) {
    return key;
  }
  const id = ext.issue?.id;
  if (id != null && id !== '') {
    return String(id);
  }
  return undefined;
}

const App = () => {
  const context = useProductContext();
  const [issue, setIssue] = useState(null);
  const [error, setError] = useState(null);

  const issueRef = useMemo(() => (context ? resolveIssueRef(context) : undefined), [context]);

  useEffect(() => {
    // Context still loading from bridge — wait; do not set "Missing issue context" yet.
    if (context === undefined) {
      return undefined;
    }

    if (!issueRef) {
      setIssue(null);
      setError('Missing issue context.');
      return undefined;
    }

    setError(null);
    let cancelled = false;
    (async () => {
      try {
        const res = await requestJira(
          `/rest/api/3/issue/${encodeURIComponent(issueRef)}?fields=priority,issuetype,assignee,created`,
          { headers: { Accept: 'application/json' } }
        );
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }
        const data = await res.json();
        if (!cancelled) {
          setIssue(data);
        }
      } catch (e) {
        if (!cancelled) {
          setIssue(null);
          setError(e?.message || 'Could not load issue details.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [context, issueRef]);

  if (context === undefined) {
    return <Text>Loading...</Text>;
  }
  if (error) {
    return <Text>{error}</Text>;
  }
  if (!issue) {
    return <Text>Loading...</Text>;
  }

  const f = issue.fields || {};
  const priority = f.priority?.name ?? '—';
  const issueType = f.issuetype?.name ?? '—';
  const assignee = f.assignee?.displayName ?? 'Unassigned';
  const created = formatCreated(f.created);

  return (
    <Stack space="space.100">
      <Text>
        <Strong>Priority:</Strong> {priority}
      </Text>
      <Text>
        <Strong>Issue type:</Strong> {issueType}
      </Text>
      <Text>
        <Strong>Assignee:</Strong> {assignee}
      </Text>
      <Text>
        <Strong>Ngày tạo:</Strong> {created}
      </Text>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
