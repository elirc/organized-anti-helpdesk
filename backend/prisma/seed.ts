import { PrismaClient, Role, TicketPriority, TicketStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp'
    }
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  // Create Owner
  const owner = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'owner@acmecorp.com',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Owner',
      role: Role.OWNER
    }
  });

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'admin@acmecorp.com',
      passwordHash,
      firstName: 'Bob',
      lastName: 'Admin',
      role: Role.ADMIN
    }
  });

  // Create Agent
  const agent = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'agent@acmecorp.com',
      passwordHash,
      firstName: 'Charlie',
      lastName: 'Agent',
      role: Role.AGENT
    }
  });

  // Create Requester
  const requester = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'customer@client.com',
      passwordHash,
      firstName: 'Dave',
      lastName: 'Customer',
      role: Role.REQUESTER
    }
  });

  // Create a Ticket
  const ticket = await prisma.ticket.create({
    data: {
      organizationId: org.id,
      title: 'Cannot access my account',
      description: 'I keep getting a 403 error when trying to log in.',
      status: TicketStatus.OPEN,
      priority: TicketPriority.HIGH,
      createdById: requester.id
    }
  });

  // Create a Comment
  await prisma.ticketComment.create({
    data: {
      organizationId: org.id,
      ticketId: ticket.id,
      authorId: requester.id,
      body: 'Please help, this is urgent.',
      isInternal: false
    }
  });

  // Create an Activity Event
  await prisma.ticketActivity.create({
    data: {
      organizationId: org.id,
      ticketId: ticket.id,
      actorId: requester.id,
      action: 'CREATED'
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
