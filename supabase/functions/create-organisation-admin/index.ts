import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl =
      Deno.env.get('SUPABASE_URL');

    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Supabase server configuration is missing.'
      );
    }

    const authHeader =
      req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'Authentication required.',
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type':
              'application/json',
          },
        }
      );
    }

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey
      );

    const token =
      authHeader.replace(
        'Bearer ',
        ''
      );

    const {
      data: {
        user: requestingUser,
      },
      error: userError,
    } =
      await supabaseAdmin.auth.getUser(
        token
      );

    if (
      userError ||
      !requestingUser
    ) {
      return new Response(
        JSON.stringify({
          error:
            'Invalid authentication session.',
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type':
              'application/json',
          },
        }
      );
    }

    /*
     * Verify that the person making
     * the request is an active DSAC Admin.
     */
    const {
      data: adminProfile,
      error: adminError,
    } =
      await supabaseAdmin
        .from('user_profiles')
        .select(
          'id, role, is_active'
        )
        .eq(
          'id',
          requestingUser.id
        )
        .single();

    if (
      adminError ||
      !adminProfile ||
      adminProfile.role !==
        'DSAC_ADMIN' ||
      !adminProfile.is_active
    ) {
      return new Response(
        JSON.stringify({
          error:
            'Only an active DSAC administrator can create an organisation administrator.',
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type':
              'application/json',
          },
        }
      );
    }

    const body =
      await req.json();

    const {
      organisationId,
      fullName,
      email,
      password,
    } = body;

    if (
      !organisationId ||
      !fullName ||
      !email ||
      !password
    ) {
      return new Response(
        JSON.stringify({
          error:
            'Organisation ID, full name, email and password are required.',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type':
              'application/json',
          },
        }
      );
    }

    if (
      password.length < 8
    ) {
      return new Response(
        JSON.stringify({
          error:
            'Password must contain at least 8 characters.',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type':
              'application/json',
          },
        }
      );
    }

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    /*
     * Verify that the organisation exists.
     */
    const {
      data: organisation,
      error: organisationError,
    } =
      await supabaseAdmin
        .from('organisations')
        .select('id, name')
        .eq(
          'id',
          organisationId
        )
        .single();

    if (
      organisationError ||
      !organisation
    ) {
      return new Response(
        JSON.stringify({
          error:
            'Organisation could not be found.',
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type':
              'application/json',
          },
        }
      );
    }

    /*
     * Create the Supabase Auth account.
     */
    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser(
        {
          email: cleanEmail,
          password,
          email_confirm: true,
          user_metadata: {
            full_name:
              fullName.trim(),
          },
        }
      );

    if (authError) {
      return new Response(
        JSON.stringify({
          error:
            authError.message,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type':
              'application/json',
          },
        }
      );
    }

    const newUser =
      authData.user;

    if (!newUser) {
      throw new Error(
        'The user account could not be created.'
      );
    }

    /*
     * The handle_new_user trigger should already
     * have created user_profiles.
     *
     * We explicitly configure the profile
     * as an ORG_ADMIN.
     */
    const {
      error: profileError,
    } =
      await supabaseAdmin
        .from('user_profiles')
        .update({
          full_name:
            fullName.trim(),
          email: cleanEmail,
          role: 'ORG_ADMIN',
          is_active: true,
        })
        .eq(
          'id',
          newUser.id
        );

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(
        newUser.id
      );

      throw profileError;
    }

    /*
     * Create the organisation membership.
     */
    const {
      error: membershipError,
    } =
      await supabaseAdmin
        .from('organisation_memberships')
        .insert({
          organisation_id:
            organisationId,
          user_id:
            newUser.id,
          membership_role:
            'ORG_ADMIN',
          status:
            'ACTIVE',
          created_by:
            requestingUser.id,
        });

    if (membershipError) {
      await supabaseAdmin.auth.admin.deleteUser(
        newUser.id
      );

      throw membershipError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.id,
          email: cleanEmail,
          full_name:
            fullName.trim(),
        },
        organisation: {
          id: organisation.id,
          name: organisation.name,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type':
            'application/json',
        },
      }
    );
  } catch (error) {
    console.error(
      'Create organisation admin error:',
      error
    );

    return new Response(
      JSON.stringify({
        error:
          error?.message ||
          'Unable to create organisation administrator.',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type':
            'application/json',
        },
      }
    );
  }
});