import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/users';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.WATCHTOWER_ADMIN_EMAIL;
  const adminPass = process.env.WATCHTOWER_ADMIN_PASS;

  if (!adminEmail || !adminPass) {
    console.error('Set WATCHTOWER_ADMIN_EMAIL and WATCHTOWER_ADMIN_PASS env vars');
    process.exit(1);
  }

  console.log('Seeding database...');

  // Create the platform org (global tenant)
  const platformOrg = await prisma.organization.upsert({
    where: { slug: 'platform' },
    update: {},
    create: {
      name: 'Watchtower Platform',
      slug: 'platform',
      tier: 'MSSP',
      maxSeats: 999,
      maxTools: 999,
      maxAlerts: 999999,
      brandName: 'Watchtower',
      brandTagline: 'AI-Powered SOC Platform',
    },
  });
  console.log(`  ✓ Organization: ${platformOrg.name} (${platformOrg.id})`);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email_organizationId: { email: adminEmail, organizationId: platformOrg.id } },
    update: {},
    create: {
      email: adminEmail,
      name: 'Platform Admin',
      hashedPassword: hashPassword(adminPass),
      role: 'OWNER',
      status: 'ACTIVE',
      organizationId: platformOrg.id,
    },
  });
  console.log(`  ✓ Admin user: ${admin.email} (${admin.id})`);

  // Create demo client org (for testing portal)
  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'acme-financial' },
    update: {},
    create: {
      name: 'Acme Financial Services',
      slug: 'acme-financial',
      tier: 'BUSINESS',
      maxSeats: 15,
      maxTools: 999,
      maxAlerts: 999999,
      parentOrgId: platformOrg.id,
      brandName: 'Acme Financial',
      brandTagline: 'Managed Security Portal',
      brandPrimaryColor: '#2563EB',
    },
  });
  console.log(`  ✓ Demo client: ${demoOrg.name} (${demoOrg.slug})`);

  // Create demo client user
  const clientUser = await prisma.user.upsert({
    where: { email_organizationId: { email: 'analyst@acme-financial.com', organizationId: demoOrg.id } },
    update: {},
    create: {
      email: 'analyst@acme-financial.com',
      name: 'Jane Smith',
      hashedPassword: hashPassword('AcmeDemo2026!'),
      role: 'ANALYST',
      status: 'ACTIVE',
      organizationId: demoOrg.id,
    },
  });
  console.log(`  ✓ Demo analyst: ${clientUser.email}`);

  console.log('\nSeed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
