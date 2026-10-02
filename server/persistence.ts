import { randomBytes } from "node:crypto";
import { Pool, type PoolClient } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for Orbit persistence");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export type PersistedUser = {
  id: number;
  name: string;
  email: string | null;
  streak: number;
  orbs: number;
  shield_status: boolean;
  personal_note: string | null;
  free_since: string | null;
  created_at: Date;
};

export type DailyLogDetails = {
  mood: number | null;
  urge: number;
  triggers: string[];
  wins: string[];
  note: string | null;
  movementChallenge?: {
    pushups: number;
    plankSeconds: number;
  };
};

export type DailyLog = {
  id: number;
  user_id: number;
  log_date: string;
  status: "completed" | "slipped";
  details: DailyLogDetails;
  created_at: Date;
};

export type PartnerLink = {
  id: number;
  user_id: number;
  partner_email: string;
  partner_name: string | null;
  invite_code: string;
  status: "pending" | "active" | "revoked";
  share_notes: boolean;
  created_at: Date;
  linked_at: Date | null;
};

export type ApprovalRequest = {
  id: number;
  user_id: number;
  partner_link_id: number | null;
  action_type: "delete_account" | "disable_shield" | "remove_partner";
  status: "pending" | "approved" | "denied";
  created_at: Date;
  resolved_at: Date | null;
};

export type PartnerNotification = {
  id: number;
  partner_link_id: number;
  event_type: "streak_broken" | "approval_needed" | "milestone_hit";
  message: string | null;
  sent_at: Date;
  read: boolean;
};

const userColumns = `
  id, name, email, streak, orbs, shield_status, personal_note, free_since, created_at
`;

export async function ensureUser(
  userId: number,
  name = "Friend",
  email: string | null = null,
): Promise<PersistedUser> {
  const result = await pool.query(
    `INSERT INTO users (id, name, email)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE
       SET name = CASE WHEN users.name = 'Friend' THEN EXCLUDED.name ELSE users.name END,
           email = COALESCE(users.email, EXCLUDED.email)
     RETURNING ${userColumns}`,
    [userId, name.trim() || "Friend", email],
  );
  return result.rows[0] as PersistedUser;
}

export async function getUser(userId: number): Promise<PersistedUser> {
  const result = await pool.query(`SELECT ${userColumns} FROM users WHERE id = $1`, [userId]);
  if (result.rows[0]) return result.rows[0] as PersistedUser;
  return ensureUser(userId);
}

export async function updateUser(
  userId: number,
  updates: {
    name?: string;
    email?: string | null;
    personalNote?: string | null;
    shieldStatus?: boolean;
  },
): Promise<PersistedUser> {
  await ensureUser(userId, updates.name);
  const result = await pool.query(
    `UPDATE users
     SET name = COALESCE($2, name),
         email = COALESCE($3, email),
         personal_note = CASE WHEN $4::boolean THEN $5::text ELSE personal_note END,
         shield_status = COALESCE($6, shield_status)
     WHERE id = $1
     RETURNING ${userColumns}`,
    [
      userId,
      updates.name?.trim() || null,
      updates.email?.trim().toLowerCase() || null,
      updates.personalNote !== undefined,
      updates.personalNote ?? null,
      updates.shieldStatus ?? null,
    ],
  );
  return result.rows[0] as PersistedUser;
}

async function createStreakBrokenNotifications(client: PoolClient, userId: number) {
  await client.query(
    `INSERT INTO partner_notifications (partner_link_id, event_type, message)
     SELECT id, 'streak_broken', 'Your accountability partner logged a slip and may need support.'
     FROM partner_links
     WHERE user_id = $1 AND status = 'active'`,
    [userId],
  );
}

export async function recordDailyLog(
  userId: number,
  logDate: string,
  status: "completed" | "slipped",
  details?: DailyLogDetails,
): Promise<{ log: DailyLog; user: PersistedUser }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO users (id, name) VALUES ($1, 'Friend') ON CONFLICT (id) DO NOTHING`,
      [userId],
    );
    const userResult = await client.query(
      `SELECT ${userColumns} FROM users WHERE id = $1 FOR UPDATE`,
      [userId],
    );
    const user = userResult.rows[0] as PersistedUser;
    const previousResult = await client.query(
      `SELECT status FROM daily_logs WHERE user_id = $1 AND log_date = $2`,
      [userId, logDate],
    );
    const previousStatus = previousResult.rows[0]?.status as
      | "completed"
      | "slipped"
      | undefined;

    const logResult = await client.query(
      `INSERT INTO daily_logs (user_id, log_date, status, details)
       VALUES ($1, $2, $3, COALESCE($4::jsonb, '{}'::jsonb))
       ON CONFLICT (user_id, log_date)
       DO UPDATE SET
         status = EXCLUDED.status,
         details = CASE
           WHEN $4::jsonb IS NULL THEN daily_logs.details
           ELSE EXCLUDED.details
         END,
         created_at = NOW()
       RETURNING id, user_id, log_date, status, details, created_at`,
      [userId, logDate, status, details ? JSON.stringify(details) : null],
    );

    let streak = user.streak;
    let orbs = user.orbs;
    if (previousStatus !== status) {
      if (status === "slipped") {
        streak = 0;
        orbs = Math.max(0, orbs - 5);
        if (previousStatus !== "slipped") {
          await createStreakBrokenNotifications(client, userId);
        }
      } else {
        streak += 1;
        orbs += 5;
      }
    }

    const userUpdate = await client.query(
      `UPDATE users
       SET streak = $2,
           orbs = $3,
           free_since = CASE WHEN $4 = 'slipped' THEN $5::date ELSE COALESCE(free_since, $5::date) END
       WHERE id = $1
       RETURNING ${userColumns}`,
      [userId, streak, orbs, status, logDate],
    );
    await client.query("COMMIT");
    return {
      log: logResult.rows[0] as DailyLog,
      user: userUpdate.rows[0] as PersistedUser,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getDailyLogs(userId: number): Promise<DailyLog[]> {
  const result = await pool.query(
    `SELECT id, user_id, log_date::text AS log_date, status, details, created_at
     FROM daily_logs WHERE user_id = $1 ORDER BY log_date DESC`,
    [userId],
  );
  return result.rows as DailyLog[];
}

function createInviteCode() {
  return randomBytes(16).toString("hex").toUpperCase();
}

export type PartnerPortalProfile = {
  partner_email: string;
  partner_name: string | null;
  status: "pending" | "active" | "revoked";
  share_notes: boolean;
  owner_name: string;
  personal_note: string | null;
};

export async function getPartnerPortalProfile(
  inviteCode: string,
): Promise<PartnerPortalProfile | undefined> {
  const result = await pool.query(
    `SELECT p.partner_email, p.partner_name, p.status, p.share_notes,
            u.name AS owner_name,
            CASE WHEN p.share_notes THEN u.personal_note ELSE NULL END AS personal_note
     FROM partner_links p
     JOIN users u ON u.id = p.user_id
     WHERE p.invite_code = $1`,
    [inviteCode],
  );
  return result.rows[0] as PartnerPortalProfile | undefined;
}

export async function acceptPartnerInvite(
  inviteCode: string,
): Promise<PartnerPortalProfile | undefined> {
  await pool.query(
    `UPDATE partner_links SET status = 'active', linked_at = NOW()
     WHERE invite_code = $1 AND status = 'pending'`,
    [inviteCode],
  );
  const partner = await getPartnerPortalProfile(inviteCode);
  return partner?.status === "active" ? partner : undefined;
}

export async function getPartners(userId: number): Promise<PartnerLink[]> {
  const result = await pool.query(
    `SELECT id, user_id, partner_email, partner_name, invite_code, status,
            share_notes, created_at, linked_at
     FROM partner_links WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows as PartnerLink[];
}

export async function createPartner(
  userId: number,
  partnerEmail: string,
  partnerName: string | null,
  shareNotes: boolean,
): Promise<PartnerLink> {
  await ensureUser(userId);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await pool.query(
        `INSERT INTO partner_links
          (user_id, partner_email, partner_name, invite_code, share_notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, user_id, partner_email, partner_name, invite_code, status,
                   share_notes, created_at, linked_at`,
        [
          userId,
          partnerEmail.trim().toLowerCase(),
          partnerName?.trim() || null,
          createInviteCode(),
          shareNotes,
        ],
      );
      return result.rows[0] as PartnerLink;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  throw new Error("Could not create partner invite");
}

export async function updatePartnerStatus(
  userId: number,
  partnerId: number,
  status: "active" | "revoked",
): Promise<PartnerLink | undefined> {
  const result = await pool.query(
    `UPDATE partner_links
     SET status = $3, linked_at = CASE WHEN $3 = 'active' THEN NOW() ELSE linked_at END
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, partner_email, partner_name, invite_code, status,
               share_notes, created_at, linked_at`,
    [partnerId, userId, status],
  );
  return result.rows[0] as PartnerLink | undefined;
}

export async function createApprovalRequest(
  userId: number,
  partnerLinkId: number | null,
  actionType: ApprovalRequest["action_type"],
): Promise<ApprovalRequest> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (partnerLinkId !== null) {
      const partner = await client.query(
        `SELECT id FROM partner_links
         WHERE id = $1 AND user_id = $2 AND status = 'active'`,
        [partnerLinkId, userId],
      );
      if (!partner.rows[0]) throw new Error("An active partner is required");
    }
    const result = await client.query(
      `INSERT INTO approval_requests (user_id, partner_link_id, action_type)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, partner_link_id, action_type, status, created_at, resolved_at`,
      [userId, partnerLinkId, actionType],
    );
    if (partnerLinkId !== null) {
      await client.query(
        `INSERT INTO partner_notifications (partner_link_id, event_type, message)
         VALUES ($1, 'approval_needed', $2)`,
        [partnerLinkId, `Approval needed for: ${actionType.replaceAll("_", " ")}`],
      );
    }
    await client.query("COMMIT");
    return result.rows[0] as ApprovalRequest;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getApprovalRequests(userId: number): Promise<ApprovalRequest[]> {
  const result = await pool.query(
    `SELECT id, user_id, partner_link_id, action_type, status, created_at, resolved_at
     FROM approval_requests WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows as ApprovalRequest[];
}

export async function getPartnerPortalApprovals(
  inviteCode: string,
): Promise<ApprovalRequest[]> {
  const result = await pool.query(
    `SELECT a.id, a.user_id, a.partner_link_id, a.action_type,
            a.status, a.created_at, a.resolved_at
     FROM approval_requests a
     JOIN partner_links p ON p.id = a.partner_link_id
     WHERE p.invite_code = $1 AND p.status = 'active'
     ORDER BY a.created_at DESC`,
    [inviteCode],
  );
  return result.rows as ApprovalRequest[];
}

export async function resolvePartnerPortalApproval(
  inviteCode: string,
  requestId: number,
  status: "approved" | "denied",
): Promise<ApprovalRequest | undefined> {
  const result = await pool.query(
    `UPDATE approval_requests a
     SET status = $3, resolved_at = NOW()
     FROM partner_links p
     WHERE a.id = $1 AND a.partner_link_id = p.id
       AND p.invite_code = $2 AND p.status = 'active'
       AND a.status = 'pending'
     RETURNING a.id, a.user_id, a.partner_link_id, a.action_type,
               a.status, a.created_at, a.resolved_at`,
    [requestId, inviteCode, status],
  );
  return result.rows[0] as ApprovalRequest | undefined;
}

export async function getPartnerPortalNotifications(
  inviteCode: string,
): Promise<PartnerNotification[]> {
  const result = await pool.query(
    `SELECT n.id, n.partner_link_id, n.event_type, n.message, n.sent_at, n.read
     FROM partner_notifications n
     JOIN partner_links p ON p.id = n.partner_link_id
     WHERE p.invite_code = $1 AND p.status = 'active'
     ORDER BY n.sent_at DESC`,
    [inviteCode],
  );
  return result.rows as PartnerNotification[];
}

export async function markPartnerPortalNotificationRead(
  inviteCode: string,
  notificationId: number,
): Promise<void> {
  await pool.query(
    `UPDATE partner_notifications n
     SET read = TRUE
     FROM partner_links p
     WHERE n.id = $1 AND n.partner_link_id = p.id
       AND p.invite_code = $2 AND p.status = 'active'`,
    [notificationId, inviteCode],
  );
}

export async function getPartnerNotifications(userId: number): Promise<PartnerNotification[]> {
  const result = await pool.query(
    `SELECT n.id, n.partner_link_id, n.event_type, n.message, n.sent_at, n.read
     FROM partner_notifications n
     JOIN partner_links p ON p.id = n.partner_link_id
     WHERE p.user_id = $1 ORDER BY n.sent_at DESC`,
    [userId],
  );
  return result.rows as PartnerNotification[];
}
