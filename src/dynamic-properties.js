import api, { route } from '@forge/api';

/**
 * Build the issue-context status (lozenge) from a Jira priority name.
 * Highest/Critical → removed (red) "High Risk"
 * High → moved (purple) "Medium Risk"
 * Medium/Low/Lowest (and unknown) → success (green) "Low Risk"
 */
function buildStatusFromPriorityName(priorityName) {
  const name = (priorityName || '').toLowerCase().trim();
  if (name === 'highest' || name === 'critical') {
    return {
      type: 'lozenge',
      value: { label: 'High Risk', type: 'removed' },
    };
  }
  if (name === 'high') {
    return {
      type: 'lozenge',
      value: { label: 'Medium Risk', type: 'moved' },
    };
  }
  return {
    type: 'lozenge',
    value: { label: 'Low Risk', type: 'success' },
  };
}

const DEFAULT_STATUS = {
  type: 'lozenge',
  value: { label: 'Low Risk', type: 'success' },
};

/**
 * Forge dynamicProperties handler for jira:issueContext.
 * Reads payload.extension.issue.key and loads priority via Jira REST.
 */
export async function handler(payload) {
  const issueKey = payload?.extension?.issue?.key;
  if (!issueKey) {
    return { status: DEFAULT_STATUS };
  }

  try {
    const res = await api.asUser().requestJira(
      route`/rest/api/3/issue/${issueKey}?fields=priority`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) {
      return { status: DEFAULT_STATUS };
    }
    const body = await res.json();
    const priorityName = body.fields?.priority?.name;
    return { status: buildStatusFromPriorityName(priorityName) };
  } catch (err) {
    console.error('dynamicProperties: failed to load issue priority', err);
    return { status: DEFAULT_STATUS };
  }
}
