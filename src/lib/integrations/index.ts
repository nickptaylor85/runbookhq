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

export const ADAPTERS: Record<string, IntegrationAdapter> = {
  crowdstrike,
  defender,
  sentinel,
  splunk,
  sentinelone,
  darktrace,
  qradar,
  elastic,
  tenable,
  nessus,
  qualys,
  wiz,
  proofpoint,
  mimecast,
  okta,
  zscaler,
  carbonblack,
  taegis,
};

export type { IntegrationAdapter, NormalisedAlert, Credentials, ConnectionResult, SyncResult } from './types';
