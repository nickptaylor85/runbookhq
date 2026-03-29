import type { IntegrationAdapter } from './types';
import { crowdstrike } from './crowdstrike';
import { defender } from './defender';
import { sentinel } from './sentinel';
import { splunk } from './splunk';
import { sentinelone } from './sentinelone';
import { darktrace } from './darktrace';
import { qradar } from './qradar';
import {
  elastic, tenable, nessus, qualys, wiz,
  proofpoint, mimecast, okta, zscaler,
  carbonblack, taegis,
} from './adapters';
import {
  cortex, aws_security_hub, azure_defender, google_workspace,
  sophos, abnormal, m365_defender, barracuda,
  virustotal, recorded_future, alienvault, threatconnect, misp, mandiant,
  entra, duo, jumpcloud, cyberark, beyondtrust, sailpoint, active_directory,
  intune, tanium,
  fortigate, palo_ngfw, cisco_firepower, checkpoint,
  gcp_scc, vectra, rapid7, chronicle, exabeam, logrhythm,
  sumo_logic, datadog, panther, axonius,
  snyk, prisma_cloud, lacework, orca, aqua, github_advanced, checkmarx,
  huntress, claroty, nozomi, dragos,
  connectwise, halopsa, autotask,
  xsoar, swimlane, tines, torq,
  servicenow, pagerduty, jira, freshservice, zendesk,
  slack, teams,
} from './adapters2';

export const ADAPTERS: Record<string, IntegrationAdapter> = {
  // Original 18
  crowdstrike, defender, sentinel, splunk, sentinelone, darktrace, qradar,
  elastic, tenable, nessus, qualys, wiz, proofpoint, mimecast, okta, zscaler,
  carbonblack, taegis,
  // New 62
  cortex, aws_security_hub, azure_defender, google_workspace,
  sophos, abnormal, m365_defender, barracuda,
  virustotal, recorded_future, alienvault, threatconnect, misp, mandiant,
  entra, duo, jumpcloud, cyberark, beyondtrust, sailpoint, active_directory,
  intune, tanium,
  fortigate, palo_ngfw, cisco_firepower, checkpoint,
  gcp_scc, vectra, rapid7, chronicle, exabeam, logrhythm,
  sumo_logic, datadog, panther, axonius,
  snyk, prisma_cloud, lacework, orca, aqua, github_advanced, checkmarx,
  huntress, claroty, nozomi, dragos,
  connectwise, halopsa, autotask,
  xsoar, swimlane, tines, torq,
  servicenow, pagerduty, jira, freshservice, zendesk,
  slack, teams,
};

export type { IntegrationAdapter, NormalisedAlert, Credentials, ConnectionResult, SyncResult } from './types';
