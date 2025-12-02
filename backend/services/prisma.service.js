import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

export default prisma;

// Helper function to sync agents and campaigns to database
// Uses transaction for atomicity and handles duplicates efficiently
export async function syncAgentsCampaignsToDb(agentsData) {
    try {
        const stats = {
            agentsCreated: 0,
            agentsUpdated: 0,
            campaignsCreated: 0,
            campaignsUpdated: 0,
            relationsCreated: 0,
            errors: []
        };

        await prisma.$transaction(async (tx) => {
            // Process all agents
            for (const [agentUser, data] of Object.entries(agentsData)) {
                try {
                    // Upsert agent (create or update)
                    const agent = await tx.agent.upsert({
                        where: { user: String(agentUser) },
                        update: {
                            fullName: data.agent_name || null,
                            userGroup: data.user_group || null,
                            updatedAt: new Date()
                        },
                        create: {
                            user: String(agentUser),
                            fullName: data.agent_name || null,
                            userGroup: data.user_group || null
                        }
                    });

                    const isNew = agent.createdAt.getTime() === agent.updatedAt.getTime();
                    if (isNew) stats.agentsCreated++;
                    else stats.agentsUpdated++;

                    // Process campaigns for this agent
                    if (Array.isArray(data.campaigns)) {
                        for (const camp of data.campaigns) {
                            if (!camp.id) continue;

                            // Upsert campaign
                            const campaign = await tx.campaign.upsert({
                                where: { campaignId: String(camp.id) },
                                update: {
                                    campaignName: camp.name || null,
                                    updatedAt: new Date()
                                },
                                create: {
                                    campaignId: String(camp.id),
                                    campaignName: camp.name || null
                                }
                            });

                            const campIsNew = campaign.createdAt.getTime() === campaign.updatedAt.getTime();
                            if (campIsNew) stats.campaignsCreated++;

                            // Create agent-campaign relation if not exists
                            const existing = await tx.agentCampaign.findFirst({
                                where: {
                                    agentId: agent.id,
                                    campaignId: campaign.id
                                }
                            });

                            if (!existing) {
                                await tx.agentCampaign.create({
                                    data: {
                                        agentId: agent.id,
                                        campaignId: campaign.id
                                    }
                                });
                                stats.relationsCreated++;
                            }
                        }
                    }
                } catch (err) {
                    stats.errors.push({ agent: agentUser, error: err.message });
                }
            }
        });

        return { success: true, stats };
    } catch (err) {
        console.error('Error syncing to database:', err);
        return { success: false, error: err.message };
    }
}

// Get agents with campaigns (paginated)
export async function getAgentsWithCampaigns({ page = 1, perPage = 10, search = '' }) {
    const skip = (page - 1) * perPage;

    const where = search ? {
        OR: [
            { user: { contains: search } },
            { fullName: { contains: search } }
        ]
    } : {};

    const [agents, total] = await Promise.all([
        prisma.agent.findMany({
            where,
            include: {
                campaigns: {
                    include: {
                        campaign: true
                    }
                }
            },
            skip,
            take: perPage,
            orderBy: { user: 'asc' }
        }),
        prisma.agent.count({ where })
    ]);

    // Transform to frontend-friendly format
    const transformed = agents.map(agent => ({
        user: agent.user,
        fullName: agent.fullName,
        full_name: agent.fullName,
        userGroup: agent.userGroup,
        campaigns: agent.campaigns.map(ac => ({
            id: ac.campaign.campaignId,
            name: ac.campaign.campaignName || ac.campaign.campaignId
        }))
    }));

    return {
        data: transformed,
        pagination: {
            page,
            perPage,
            total,
            totalPages: Math.ceil(total / perPage)
        }
    };
}

// Get campaigns for a specific agent (paginated)
export async function getAgentCampaignsPaginated(agentUser, { page = 1, perPage = 8 }) {
    const skip = (page - 1) * perPage;

    const agent = await prisma.agent.findUnique({
        where: { user: String(agentUser) },
        include: {
            campaigns: {
                include: {
                    campaign: true
                },
                skip,
                take: perPage,
                orderBy: {
                    campaign: {
                        campaignName: 'asc'
                    }
                }
            },
            _count: {
                select: { campaigns: true }
            }
        }
    });

    if (!agent) return null;

    return {
        agent_user: agent.user,
        agent_name: agent.fullName,
        user_group: agent.userGroup,
        campaigns: agent.campaigns.map(ac => ({
            id: ac.campaign.campaignId,
            name: ac.campaign.campaignName || ac.campaign.campaignId
        })),
        pagination: {
            page,
            perPage,
            total: agent._count.campaigns,
            totalPages: Math.ceil(agent._count.campaigns / perPage)
        }
    };
}
