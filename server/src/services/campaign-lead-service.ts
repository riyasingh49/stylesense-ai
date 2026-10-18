import {
    assignLeadsToCampaign,
    listCampaignLeads,
    type CampaignLeadRecord,
} from "../repositories/campaign-lead-repository";
import {
    getCampaignById,
    type CampaignRecord,
} from "../repositories/campaign-repository";
import { getLeadById } from "../repositories/lead-repository";
import { isEmailSuppressed } from "../repositories/suppression-repository";

export class CampaignLeadServiceError extends Error {
    constructor(
        message: string,
        public readonly code:
            | "CAMPAIGN_NOT_FOUND"
            | "CAMPAIGN_NOT_EDITABLE"
            | "LEAD_NOT_FOUND",
    ) {
        super(message);
        this.name = "CampaignLeadServiceError";
    }
}

export interface AssignCampaignLeadsResult {
    campaign: CampaignRecord;
    assigned: CampaignLeadRecord[];
    skippedSuppressedLeadIds: string[];
}

const getEditableCampaign = async (
    campaignId: string,
): Promise<CampaignRecord> => {
    const campaign = await getCampaignById(campaignId);

    if (!campaign) {
        throw new CampaignLeadServiceError(
            "Campaign not found.",
            "CAMPAIGN_NOT_FOUND",
        );
    }

    if (campaign.status !== "draft") {
        throw new CampaignLeadServiceError(
            "Leads can only be assigned to draft campaigns.",
            "CAMPAIGN_NOT_EDITABLE",
        );
    }

    return campaign;
};

export const getCampaignLeads = async (
    campaignId: string,
): Promise<{
    campaign: CampaignRecord;
    leads: CampaignLeadRecord[];
}> => {
    const campaign = await getCampaignById(campaignId);

    if (!campaign) {
        throw new CampaignLeadServiceError(
            "Campaign not found.",
            "CAMPAIGN_NOT_FOUND",
        );
    }

    const leads = await listCampaignLeads(campaignId);

    return { campaign, leads };
};

export const assignCampaignLeads = async (
    campaignId: string,
    leadIds: string[],
): Promise<AssignCampaignLeadsResult> => {
    const campaign = await getEditableCampaign(campaignId);
    const uniqueLeadIds = [...new Set(leadIds)];

    const eligibleLeadIds: string[] = [];
    const skippedSuppressedLeadIds: string[] = [];

    // Validate all leads before writing any assignments.
    for (const leadId of uniqueLeadIds) {

        const lead = await getLeadById(leadId);

        if (!lead) {
            throw new CampaignLeadServiceError(
                `Lead not found: ${leadId}.`,
                "LEAD_NOT_FOUND",
            );
        }
        if (!lead.email?.trim()) {
            skippedSuppressedLeadIds.push(leadId);
            continue;
        }

        const suppressed = await isEmailSuppressed(lead.email);

        if (suppressed) {
            skippedSuppressedLeadIds.push(leadId);
            continue;
        }

        eligibleLeadIds.push(leadId);
    }

    const assigned =
        eligibleLeadIds.length > 0
            ? await assignLeadsToCampaign(campaignId, eligibleLeadIds)
            : [];

    return {
        campaign,
        assigned,
        skippedSuppressedLeadIds,
    };
};