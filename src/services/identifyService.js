const prisma = require("../database/prisma");

/**
 * Core identity reconciliation logic.
 *
 * Rules:
 * 1. If no existing contact matches the incoming email/phone → create a new "primary" contact.
 * 2. If matches exist and all belong to the same primary → create a new "secondary" if the exact (email, phone) pair is new.
 * 3. If matches span two different primaries → the older primary stays primary; the newer primary (and its secondaries) become secondary under the older one.
 * 4. Return consolidated contact information.
 */
async function identifyContact({ email, phoneNumber }) {
  // ── 1. Find all existing contacts matching email OR phoneNumber ──
  const whereConditions = [];
  if (email) whereConditions.push({ email });
  if (phoneNumber) whereConditions.push({ phoneNumber });

  const matchingContacts = await prisma.contact.findMany({
    where: {
      OR: whereConditions,
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
  });

  // ── 2. No match → create a brand-new primary contact ──
  if (matchingContacts.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkPrecedence: "primary",
      },
    });

    return formatResponse(newContact.id, [newContact]);
  }

  // ── 3. Collect all unique primary IDs ──
  const primaryIds = new Set();
  for (const contact of matchingContacts) {
    primaryIds.add(
      contact.linkPrecedence === "primary" ? contact.id : contact.linkedId
    );
  }

  // ── 4. Fetch the full cluster (primaries + all their secondaries) ──
  const allContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: { in: [...primaryIds] } },
        { linkedId: { in: [...primaryIds] } },
      ],
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
  });

  // ── 5. Determine the single primary (oldest) ──
  const primaries = allContacts
    .filter((c) => c.linkPrecedence === "primary")
    .sort((a, b) => a.createdAt - b.createdAt);

  const primaryContact = primaries[0];

  // ── 6. If two different primaries found → turn the newer one(s) into secondary ──
  if (primaries.length > 1) {
    const idsToUpdate = [];
    for (let i = 1; i < primaries.length; i++) {
      idsToUpdate.push(primaries[i].id);
    }

    // Turn newer primaries into secondaries
    await prisma.contact.updateMany({
      where: { id: { in: idsToUpdate } },
      data: {
        linkedId: primaryContact.id,
        linkPrecedence: "secondary",
      },
    });

    // Re-point any secondaries that were linked to the now-demoted primaries
    await prisma.contact.updateMany({
      where: {
        linkedId: { in: idsToUpdate },
        id: { not: primaryContact.id },
      },
      data: {
        linkedId: primaryContact.id,
      },
    });
  }

  // ── 7. Check if this exact (email, phone) pair already exists ──
  const exactMatch = allContacts.some(
    (c) =>
      c.email === (email || null) && c.phoneNumber === (phoneNumber || null)
  );

  // If the pair is new (new info), create a secondary contact
  if (!exactMatch && (email || phoneNumber)) {
    await prisma.contact.create({
      data: {
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkedId: primaryContact.id,
        linkPrecedence: "secondary",
      },
    });
  }

  // ── 8. Re-fetch the full updated cluster for a clean response ──
  const finalContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: primaryContact.id },
        { linkedId: primaryContact.id },
      ],
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
  });

  return formatResponse(primaryContact.id, finalContacts);
}

/**
 * Build the response payload.
 */
function formatResponse(primaryContactId, contacts) {
  const emails = [];
  const phoneNumbers = [];
  const secondaryContactIds = [];

  for (const contact of contacts) {
    if (contact.email && !emails.includes(contact.email)) {
      emails.push(contact.email);
    }
    if (contact.phoneNumber && !phoneNumbers.includes(contact.phoneNumber)) {
      phoneNumbers.push(contact.phoneNumber);
    }
    if (contact.id !== primaryContactId) {
      secondaryContactIds.push(contact.id);
    }
  }

  return {
    contact: {
      primaryContactId,
      emails,
      phoneNumbers,
      secondaryContactIds,
    },
  };
}

module.exports = { identifyContact };
