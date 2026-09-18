-- =====================================================================
-- CosmicUs — Create Users
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

DO $$
DECLARE
  husband_id UUID;
  wife_id    UUID;
BEGIN

  -- ── JEEVA (husband) ────────────────────────────────────────────────

  -- Check if already exists
  SELECT id INTO husband_id
  FROM auth.users
  WHERE email = 'husband@cosmicus.app';

  IF husband_id IS NULL THEN
    -- Create fresh
    husband_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, role, aud,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      husband_id,
      '00000000-0000-0000-0000-000000000000',
      'husband@cosmicus.app',
      crypt('JEEVASULOGANENTHARA@1031', gen_salt('bf')),
      NOW(), 'authenticated', 'authenticated',
      NOW(), NOW(),
      '{"provider":"email","providers":["email"]}', '{}',
      FALSE, '', '', '', ''
    );
    RAISE NOTICE 'Created husband auth user: %', husband_id;
  ELSE
    -- Already exists — just reset password
    UPDATE auth.users
    SET encrypted_password = crypt('JEEVASULOGANENTHARA@1031', gen_salt('bf')),
        email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = husband_id;
    RAISE NOTICE 'Updated husband auth user: %', husband_id;
  END IF;

  -- Identity row (required for email login)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at, provider_id
  ) VALUES (
    gen_random_uuid(),
    husband_id,
    json_build_object('sub', husband_id::text, 'email', 'husband@cosmicus.app'),
    'email',
    NOW(), NOW(), NOW(),
    'husband@cosmicus.app'
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

  -- Profile row
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (husband_id, 'husband', 'JEEVA')
  ON CONFLICT (id) DO UPDATE SET username = 'husband', display_name = 'JEEVA';


  -- ── VAISHNEVI (wife) ───────────────────────────────────────────────

  SELECT id INTO wife_id
  FROM auth.users
  WHERE email = 'wife@cosmicus.app';

  IF wife_id IS NULL THEN
    wife_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, role, aud,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      wife_id,
      '00000000-0000-0000-0000-000000000000',
      'wife@cosmicus.app',
      crypt('JEEVASULOGANENTHARA@1031', gen_salt('bf')),
      NOW(), 'authenticated', 'authenticated',
      NOW(), NOW(),
      '{"provider":"email","providers":["email"]}', '{}',
      FALSE, '', '', '', ''
    ) ;
    RAISE NOTICE 'Created wife auth user: %', wife_id;
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('JEEVASULOGANENTHARA@1031', gen_salt('bf')),
        email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = wife_id;
    RAISE NOTICE 'Updated wife auth user: %', wife_id;
  END IF;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at, provider_id
  ) VALUES (
    gen_random_uuid(),
    wife_id,
    json_build_object('sub', wife_id::text, 'email', 'wife@cosmicus.app'),
    'email',
    NOW(), NOW(), NOW(),
    'wife@cosmicus.app'
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (wife_id, 'wife', 'VAISHNEVI')
  ON CONFLICT (id) DO UPDATE SET username = 'wife', display_name = 'VAISHNEVI';


END $$;

-- ── Verify — should show 2 rows ────────────────────────────────────
SELECT
  u.email,
  p.username,
  p.display_name,
  u.email_confirmed_at IS NOT NULL AS email_confirmed
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email IN ('husband@cosmicus.app', 'wife@cosmicus.app');
