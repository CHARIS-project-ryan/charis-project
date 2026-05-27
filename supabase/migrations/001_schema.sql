-- CHARIS VDMS schema

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'org_admin',
  'volunteer',
  'donor'
);

CREATE TYPE org_role AS ENUM ('admin', 'staff', 'member');

CREATE TYPE gender AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

CREATE TYPE tshirt_size AS ENUM ('xs', 's', 'm', 'l', 'xl', 'xxl');

CREATE TYPE payment_method AS ENUM (
  'paynow',
  'credit_card',
  'bank_transfer',
  'cheque',
  'cash'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded'
);

CREATE TYPE recurring_frequency AS ENUM (
  'weekly',
  'monthly',
  'quarterly',
  'yearly'
);

CREATE TYPE tax_receipt_preference AS ENUM ('email', 'post', 'none');

CREATE TYPE audit_action AS ENUM (
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'export'
);

CREATE TYPE assignment_status AS ENUM (
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TABLE organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  contact_email text,
  contact_phone text,
  website_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users (id),
  updated_by uuid REFERENCES auth.users (id)
);

CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone_number text,
  profile_image_url text,
  role user_role NOT NULL DEFAULT 'volunteer',
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  pdpa_consent_given boolean NOT NULL DEFAULT false,
  pdpa_consent_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  role_in_org org_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (user_id, organisation_id)
);

CREATE TABLE volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  date_of_birth date,
  gender gender,
  address_line1 text,
  address_line2 text,
  postal_code text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  skills text[] DEFAULT '{}',
  availability jsonb DEFAULT '{}',
  dietary_restrictions text,
  medical_conditions text,
  t_shirt_size tshirt_size,
  preferred_language text DEFAULT 'en',
  volunteer_since date DEFAULT CURRENT_DATE,
  total_hours_served numeric(10, 2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  donor_since date DEFAULT CURRENT_DATE,
  total_donated numeric(12, 2) NOT NULL DEFAULT 0,
  donation_count integer NOT NULL DEFAULT 0,
  preferred_payment_method payment_method,
  tax_receipt_preference tax_receipt_preference DEFAULT 'email',
  mailing_address_line1 text,
  mailing_address_line2 text,
  mailing_postal_code text,
  is_recurring_donor boolean NOT NULL DEFAULT false,
  communication_preferences jsonb DEFAULT '{}',
  is_anonymous boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  short_description text,
  goal_amount numeric(12, 2) NOT NULL CHECK (goal_amount > 0),
  current_amount numeric(12, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SGD',
  start_date date,
  end_date date,
  image_url text,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, slug)
);

CREATE TABLE donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES donors (id) ON DELETE RESTRICT,
  campaign_id uuid REFERENCES campaigns (id) ON DELETE SET NULL,
  organisation_id uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'SGD',
  payment_method payment_method NOT NULL,
  payment_reference text,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  is_recurring boolean NOT NULL DEFAULT false,
  recurring_frequency recurring_frequency,
  parent_donation_id uuid REFERENCES donations (id) ON DELETE SET NULL,
  is_anonymous boolean NOT NULL DEFAULT false,
  message text,
  tax_receipt_issued boolean NOT NULL DEFAULT false,
  tax_receipt_number text,
  tax_receipt_issued_at timestamptz,
  donated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE volunteer_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  short_description text,
  location text,
  location_address text,
  start_date date,
  end_date date,
  start_time time,
  end_time time,
  slots_total integer NOT NULL DEFAULT 1,
  slots_filled integer NOT NULL DEFAULT 0,
  required_skills text[] DEFAULT '{}',
  preferred_skills text[] DEFAULT '{}',
  is_recurring boolean NOT NULL DEFAULT false,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, slug)
);

CREATE TABLE volunteer_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id uuid NOT NULL REFERENCES volunteers (id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES volunteer_opportunities (id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  status assignment_status NOT NULL DEFAULT 'pending',
  applied_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  completed_at timestamptz,
  hours_served numeric(6, 2),
  attendance_notes text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (volunteer_id, opportunity_id)
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  changes jsonb,
  ip_address inet,
  user_agent text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  organisation_id uuid REFERENCES organisations (id) ON DELETE SET NULL
);

CREATE INDEX users_email_lower_idx ON users (lower(email));
CREATE INDEX donations_donor_id_idx ON donations (donor_id);
CREATE INDEX donations_campaign_id_idx ON donations (campaign_id);
CREATE INDEX donations_organisation_id_idx ON donations (organisation_id);
CREATE INDEX donations_donated_at_idx ON donations (donated_at);
CREATE INDEX volunteer_assignments_volunteer_id_idx ON volunteer_assignments (volunteer_id);
CREATE INDEX volunteer_assignments_opportunity_id_idx ON volunteer_assignments (opportunity_id);
CREATE INDEX volunteer_assignments_organisation_id_idx ON volunteer_assignments (organisation_id);
CREATE INDEX volunteer_assignments_status_idx ON volunteer_assignments (status);
CREATE INDEX audit_logs_user_id_idx ON audit_logs (user_id);
CREATE INDEX audit_logs_table_record_idx ON audit_logs (table_name, record_id);
CREATE INDEX audit_logs_timestamp_idx ON audit_logs (timestamp);
