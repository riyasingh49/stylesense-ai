export const leadExtractionResponseSchema = {
    type: "ARRAY",
    items: {
        type: "OBJECT",
        properties: {
            firstName: {
                type: "STRING",
            },
            lastName: {
                type: "STRING",
            },
            email: {
                type: "STRING",
                nullable: true,
            },
            jobTitle: {
                type: "STRING",
            },
            companyName: {
                type: "STRING",
            },
            companyIndustry: {
                type: "STRING",
                nullable: true,
            },
            companyWebsite: {
                type: "STRING",
                nullable: true,
            },
            linkedinUrl: {
                type: "STRING",
                nullable: true,
            },
            sourceUrl: {
                type: "STRING",
            },
            sourceEvidence: {
                type: "STRING",
            },
        },
        required: [
            "firstName",
            "lastName",
            "email",
            "jobTitle",
            "companyName",
            "companyIndustry",
            "companyWebsite",
            "linkedinUrl",
            "sourceUrl",
            "sourceEvidence",
        ],
    },
} as const;
