CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Companies discovered through research.
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    website TEXT,
    domain TEXT,
    industry TEXT,
    description TEXT,
    location TEXT,
    employee_count INTEGER CHECK (employee_count IS NULL OR employee_count >= 0),
    source_url TEXT,
    source_evidence TEXT,
    discovery_method TEXT NOT NULL DEFAULT 'mock'
        CHECK (discovery_method IN ('mock', 'web_search', 'manual')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX companies_domain_unique
    ON companies (LOWER(domain))
    WHERE domain IS NOT NULL AND domain <> '';

-- 2. Individual leads and their company association.
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    email TEXT,
    job_title TEXT,
    linkedin_url TEXT,
    source_url TEXT,
    source_evidence TEXT,
    discovery_method TEXT NOT NULL DEFAULT 'mock'
        CHECK (discovery_method IN ('mock', 'web_search', 'manual')),
    fit_score NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (fit_score BETWEEN 0 AND 100),
    engagement_score NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (engagement_score BETWEEN 0 AND 100),
    total_score NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (total_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX leads_email_unique
    ON leads (LOWER(email))
    WHERE email IS NOT NULL AND email <> '';

CREATE INDEX leads_company_id_idx ON leads (company_id);
CREATE INDEX leads_total_score_idx ON leads (total_score DESC);

-- 3. Email campaign configuration.
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    email_body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'scheduled', 'sending', 'paused', 'completed', 'failed')),
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Many-to-many relationship between campaigns and leads.
CREATE TABLE campaign_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN (
            'pending', 'sent', 'delivered', 'opened', 'clicked',
            'replied', 'bounced', 'failed', 'unsubscribed', 'suppressed'
        )),
    provider_message_id TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (campaign_id, lead_id)
);

CREATE INDEX campaign_leads_lead_id_idx ON campaign_leads (lead_id);
CREATE INDEX campaign_leads_status_idx ON campaign_leads (status);

-- 5. Append-only record of email activity.
CREATE TABLE email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_lead_id UUID NOT NULL
        REFERENCES campaign_leads(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL
        CHECK (event_type IN (
            'queued', 'sent', 'delivered', 'opened', 'clicked',
            'replied', 'bounced', 'failed', 'unsubscribed'
        )),
    event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    provider_event_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX email_events_campaign_lead_idx
    ON email_events (campaign_lead_id, event_at DESC);

CREATE INDEX email_events_type_idx
    ON email_events (event_type, event_at DESC);

-- 6. Preserve score changes instead of overwriting score history.
CREATE TABLE lead_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    fit_score NUMERIC(5, 2) NOT NULL CHECK (fit_score BETWEEN 0 AND 100),
    engagement_score NUMERIC(5, 2) NOT NULL CHECK (engagement_score BETWEEN 0 AND 100),
    total_score NUMERIC(5, 2) NOT NULL CHECK (total_score BETWEEN 0 AND 100),
    scoring_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX lead_score_history_lead_idx
    ON lead_score_history (lead_id, created_at DESC);

-- 7. Contacts that must not receive marketing emails.
CREATE TABLE suppression_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    reason TEXT NOT NULL
        CHECK (reason IN ('unsubscribe', 'bounce', 'complaint', 'manual')),
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX suppression_email_unique
    ON suppression_list (LOWER(email));
