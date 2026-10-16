CREATE OR REPLACE FUNCTION save_lead_score(
    p_lead_id UUID,
    p_fit_score NUMERIC,
    p_engagement_score NUMERIC,
    p_total_score NUMERIC,
    p_scoring_reason TEXT
)
RETURNS TABLE (
    id UUID,
    lead_id UUID,
    fit_score NUMERIC,
    engagement_score NUMERIC,
    total_score NUMERIC,
    scoring_reason TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_history lead_score_history%ROWTYPE;
BEGIN
    IF p_fit_score < 0 OR p_fit_score > 100
       OR p_engagement_score < 0 OR p_engagement_score > 100
       OR p_total_score < 0 OR p_total_score > 100 THEN
        RAISE EXCEPTION 'Lead scores must be between 0 and 100'
            USING ERRCODE = '22023';
    END IF;

    UPDATE leads
    SET
        fit_score = p_fit_score,
        engagement_score = p_engagement_score,
        total_score = p_total_score,
        updated_at = NOW()
    WHERE leads.id = p_lead_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead not found'
            USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO lead_score_history (
        lead_id,
        fit_score,
        engagement_score,
        total_score,
        scoring_reason
    )
    VALUES (
        p_lead_id,
        p_fit_score,
        p_engagement_score,
        p_total_score,
        p_scoring_reason
    )
    RETURNING * INTO v_history;

    RETURN QUERY
    SELECT
        v_history.id,
        v_history.lead_id,
        v_history.fit_score::NUMERIC,
        v_history.engagement_score::NUMERIC,
        v_history.total_score::NUMERIC,
        v_history.scoring_reason,
        v_history.created_at;
END;
$$;
