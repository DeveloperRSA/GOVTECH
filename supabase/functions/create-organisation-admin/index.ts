// supabase/functions/create-organisation-admin/index.ts
//
// Called from app/dsac/organisations.jsx after a DSAC admin registers a new
// organisation, to create that organisation's first administrator account.
//
// This needs the Supabase service role key (to create an auth user and
// bypass RLS for the profile/membership inserts), so it can only run here,
// server-side — never in the app bundle.
//
// Request body: { organisationId, fullName, email, password }
// Caller must be signed in as DSAC_ADMIN — enforced below using the
// caller's own JWT, independently of Supabase's gateway-level JWT check
// (config.toml sets verify_jwt = false so we can return a clean JSON error
// instead of a bare 401 when the caller isn't authorised).

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const callerJwt = authHeader.replace(/^Bearer\s+/i, "");

  if (!callerJwt) {
    return json({ error: "Missing Authorization header." }, 401);
  }

  // Client scoped to the caller's own JWT, used only to check who is
  // calling — RLS still applies to this client, so it can't be used to
  // read/write things the caller isn't already allowed to.
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${callerJwt}` } },
  });

  const {
    data: { user: callerUser },
    error: callerError,
  } = await callerClient.auth.getUser();

  if (callerError || !callerUser) {
    return json({ error: "Invalid or expired session." }, 401);
  }

  const { data: callerProfile, error: callerProfileError } =
    await callerClient
      .from("user_profiles")
      .select("role, is_active")
      .eq("id", callerUser.id)
      .single();

  if (callerProfileError || !callerProfile) {
    return json({ error: "Caller profile could not be verified." }, 403);
  }

  if (!callerProfile.is_active || callerProfile.role !== "DSAC_ADMIN") {
    return json(
      { error: "Only an active DSAC administrator can create organisation administrators." },
      403
    );
  }

  const { organisationId, fullName, email, password } = await req.json();

  if (!organisationId || !fullName || !email || !password) {
    return json(
      { error: "organisationId, fullName, email and password are all required." },
      400
    );
  }

  if (String(password).length < 8) {
    return json({ error: "Password must be at least 8 characters." }, 400);
  }

  // Privileged client — bypasses RLS, only used from here on.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: organisation, error: organisationError } = await admin
    .from("organisations")
    .select("id, name")
    .eq("id", organisationId)
    .maybeSingle();

  if (organisationError || !organisation) {
    return json({ error: "Organisation not found." }, 404);
  }

  // 1. Create the auth user.
  const { data: created, error: createUserError } =
    await admin.auth.admin.createUser({
      email: String(email).toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (createUserError || !created?.user) {
    return json(
      { error: createUserError?.message || "Could not create the administrator account." },
      400
    );
  }

  const newUserId = created.user.id;

  // 2. Create their profile.
  const { error: profileError } = await admin.from("user_profiles").insert({
    id: newUserId,
    full_name: fullName,
    email: String(email).toLowerCase(),
    role: "ORG_ADMIN",
    is_active: true,
  });

  if (profileError) {
    // Roll back the auth user so we don't leave an orphaned account with
    // no profile — such a user could sign in but every screen would fail
    // to load their role.
    await admin.auth.admin.deleteUser(newUserId);
    return json({ error: profileError.message }, 400);
  }

  // 3. Link them to the organisation as its first admin.
  const { error: membershipError } = await admin
    .from("organisation_memberships")
    .insert({
      organisation_id: organisationId,
      user_id: newUserId,
      membership_role: "ORG_ADMIN",
      status: "ACTIVE",
    });

  if (membershipError) {
    await admin.from("user_profiles").delete().eq("id", newUserId);
    await admin.auth.admin.deleteUser(newUserId);
    return json({ error: membershipError.message }, 400);
  }

  return json({
    userId: newUserId,
    organisationId,
    message: `${fullName} has been created as the administrator for ${organisation.name}.`,
  });
});
