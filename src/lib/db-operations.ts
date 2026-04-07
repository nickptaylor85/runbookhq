import prisma from './db';
import { hashPassword, verifyPassword } from './users';
import { encrypt, decrypt } from './encrypt';
import type { OrgRole, AccountStatus, Tier, Prisma } from '@prisma/client';

// ═══ Organization Operations ═════════════════════════════════════════════════

export async function createOrganization(data: {
  name: string;
  slug: string;
  tier?: Tier;
  parentOrgId?: string;
}) {
  return prisma.organization.create({
    data: {
      name: data.name,
      slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      tier: data.tier || 'COMMUNITY',
      parentOrgId: data.parentOrgId,
      maxSeats: data.tier === 'MSSP' ? 999 : data.tier === 'BUSINESS' ? 15 : data.tier === 'TEAM' ? 999 : 1,
      maxTools: data.tier === 'COMMUNITY' ? 3 : 999,
      maxAlerts: data.tier === 'COMMUNITY' ? 250 : 999999,
    },
  });
}

export async function getOrganizationBySlug(slug: string) {
  return prisma.organization.findUnique({ where: { slug } });
}

export async function getOrganizationById(id: string) {
  return prisma.organization.findUnique({ where: { id } });
}

export async function getOrganizationWithUsers(id: string) {
  return prisma.organization.findUnique({
    where: { id },
    include: { users: { orderBy: { createdAt: 'desc' } } },
  });
}

export async function getChildOrganizations(parentOrgId: string) {
  return prisma.organization.findMany({
    where: { parentOrgId },
    include: { _count: { select: { users: true, alerts: true, incidents: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function updateOrganization(id: string, data: Prisma.OrganizationUpdateInput) {
  return prisma.organization.update({ where: { id }, data });
}

// ═══ User Operations ═════════════════════════════════════════════════════════

export async function createDbUser(data: {
  email: string;
  name?: string;
  password?: string;
  role?: OrgRole;
  organizationId: string;
  status?: AccountStatus;
}) {
  return prisma.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      name: data.name,
      hashedPassword: data.password ? hashPassword(data.password) : null,
      role: data.role || 'VIEWER',
      status: data.status || 'ACTIVE',
      organizationId: data.organizationId,
    },
  });
}

export async function getUserByEmail(email: string, organizationId?: string) {
  if (organizationId) {
    return prisma.user.findFirst({
      where: { email: email.toLowerCase(), organizationId },
      include: { organization: true },
    });
  }
  // Search across all orgs (for login where we don't know the org yet)
  return prisma.user.findFirst({
    where: { email: email.toLowerCase() },
    include: { organization: true },
    orderBy: { lastLoginAt: 'desc' }, // Prefer most recently active account
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { organization: true },
  });
}

export async function getOrgUsers(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, email: true, name: true, role: true, status: true,
      mfaEnabled: true, lastLoginAt: true, createdAt: true,
    },
  });
}

export async function updateDbUser(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({ where: { id }, data });
}

export async function deleteDbUser(id: string) {
  return prisma.user.delete({ where: { id } });
}

export async function verifyUserPassword(email: string, password: string): Promise<{
  ok: boolean;
  user?: Awaited<ReturnType<typeof getUserByEmail>>;
}> {
  const user = await getUserByEmail(email);
  if (!user || !user.hashedPassword) return { ok: false };
  if (user.status !== 'ACTIVE') return { ok: false };
  // Check lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) return { ok: false };
  const valid = verifyPassword(password, user.hashedPassword);
  if (!valid) {
    // Increment failed login count
    const newCount = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: newCount,
        lockedUntil: newCount >= 10 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      },
    });
    return { ok: false };
  }
  // Reset failed count on success
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });
  return { ok: true, user };
}

// ═══ Session Operations ══════════════════════════════════════════════════════

export async function createSession(data: {
  token: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}) {
  return prisma.session.create({ data });
}

export async function getSessionByToken(token: string) {
  return prisma.session.findUnique({
    where: { token },
    include: { user: { include: { organization: true } } },
  });
}

export async function revokeSession(token: string) {
  return prisma.session.update({
    where: { token },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserSessions(userId: string) {
  return prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function cleanExpiredSessions() {
  return prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}

// ═══ Audit Log ═══════════════════════════════════════════════════════════════

export async function logAuditEvent(data: {
  organizationId: string;
  actorId?: string;
  action: Prisma.AuditLogCreateInput['action'];
  target?: string;
  details?: object;
  ipAddress?: string;
}) {
  return prisma.auditLog.create({
    data: {
      organizationId: data.organizationId,
      actorId: data.actorId,
      action: data.action,
      target: data.target,
      details: data.details as Prisma.InputJsonValue,
      ipAddress: data.ipAddress,
    },
  });
}

// ═══ Invite Operations ═══════════════════════════════════════════════════════

export async function createInvite(data: {
  email: string;
  role: OrgRole;
  organizationId: string;
  invitedById: string;
  expiresInHours?: number;
}) {
  return prisma.invite.create({
    data: {
      email: data.email.toLowerCase(),
      role: data.role,
      organizationId: data.organizationId,
      invitedById: data.invitedById,
      expiresAt: new Date(Date.now() + (data.expiresInHours || 72) * 60 * 60 * 1000),
    },
  });
}

export async function getInviteByToken(token: string) {
  return prisma.invite.findUnique({
    where: { token },
    include: { organization: true },
  });
}

export async function acceptInvite(token: string) {
  return prisma.invite.update({
    where: { token },
    data: { acceptedAt: new Date() },
  });
}

// ═══ Integration Operations ══════════════════════════════════════════════════

export async function getOrgIntegrations(organizationId: string) {
  return prisma.integration.findMany({
    where: { organizationId },
    orderBy: { name: 'asc' },
  });
}

export async function upsertIntegration(organizationId: string, name: string, data: {
  type: string;
  config?: Record<string, string>;
  apiUrl?: string;
  enabled?: boolean;
}) {
  const encryptedConfig = data.config ? encrypt(JSON.stringify(data.config)) : null;
  return prisma.integration.upsert({
    where: { organizationId_name: { organizationId, name } },
    create: {
      organizationId,
      name,
      type: data.type,
      encryptedConfig,
      apiUrl: data.apiUrl,
      enabled: data.enabled ?? false,
    },
    update: {
      encryptedConfig,
      apiUrl: data.apiUrl,
      enabled: data.enabled,
      updatedAt: new Date(),
    },
  });
}

export async function getIntegrationCredentials(organizationId: string, name: string): Promise<Record<string, string> | null> {
  const integration = await prisma.integration.findUnique({
    where: { organizationId_name: { organizationId, name } },
  });
  if (!integration?.encryptedConfig) return null;
  try {
    return JSON.parse(decrypt(integration.encryptedConfig));
  } catch {
    return null;
  }
}

// ═══ Stats / Analytics ═══════════════════════════════════════════════════════

export async function getOrgStats(organizationId: string) {
  const [alertCounts, incidentCounts, userCount, integrationCount] = await Promise.all([
    prisma.alert.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true,
    }),
    prisma.incident.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true,
    }),
    prisma.user.count({ where: { organizationId, status: 'ACTIVE' } }),
    prisma.integration.count({ where: { organizationId, enabled: true } }),
  ]);
  return { alertCounts, incidentCounts, userCount, integrationCount };
}

export async function getPlatformStats() {
  const [orgCount, userCount, tierBreakdown, recentSignups] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.organization.groupBy({ by: ['tier'], _count: true }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { email: true, createdAt: true, organization: { select: { tier: true, name: true } } },
    }),
  ]);
  return { orgCount, userCount, tierBreakdown, recentSignups };
}
