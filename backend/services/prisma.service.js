import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();

export default prisma;

export async function syncAgentsCampaignsToDb(agentsData) {
    const stats = {
        agentsCreated: 0,
        agentsUpdated: 0,
        campaignsCreated: 0,
        campaignsUpdated: 0,
        relationsCreated: 0,
        relationsRemoved: 0,
        errors: []
    };

    try {
        for (const [agentUser, data] of Object.entries(agentsData)) {
            try {
                const agentUserStr = String(agentUser);

                // -------------------------
                // 1. UPSERT AGENT
                // -------------------------
                const agentBefore = await prisma.agent.findUnique({
                    where: { user: agentUserStr }
                });

                const agent = await prisma.agent.upsert({
                    where: { user: agentUserStr },
                    update: {
                        fullName: data.agent_name || null,
                        userGroup: data.user_group || null
                    },
                    create: {
                        user: agentUserStr,
                        fullName: data.agent_name || null,
                        userGroup: data.user_group || null
                    }
                });

                if (!agentBefore) stats.agentsCreated++;
                else stats.agentsUpdated++;

                // -------------------------
                // 2. UPSERT CAMPAIGNS
                // -------------------------
                const newCampaignIds = [];

                if (Array.isArray(data.campaigns)) {
                    for (const camp of data.campaigns) {
                        if (!camp.id) continue;

                        const campId = String(camp.id);
                        newCampaignIds.push(campId);

                        const existing = await prisma.campaign.findUnique({
                            where: { campaignId: campId }
                        });

                        await prisma.campaign.upsert({
                            where: { campaignId: campId },
                            update: { campaignName: camp.name || existing?.campaignName || campId },
                            create: {
                                campaignId: campId,
                                campaignName: camp.name || campId
                            }
                        });

                        if (!existing) stats.campaignsCreated++;
                        else stats.campaignsUpdated++;
                    }
                }

                // -------------------------
                // 3. MANAGE RELATIONS CLEANLY
                // -------------------------
                const existingRelations = await prisma.agentCampaign.findMany({
                    where: { agentId: agent.id },
                    include: { campaign: true }
                });

                const existingIds = existingRelations.map(r => r.campaign.campaignId);

                // ADD NEW RELATIONS
                for (const newCid of newCampaignIds) {
                    if (!existingIds.includes(newCid)) {
                        const camp = await prisma.campaign.findUnique({
                            where: { campaignId: newCid }
                        });

                        if (camp) {
                            await prisma.agentCampaign.create({
                                data: {
                                    agentId: agent.id,
                                    campaignId: camp.id
                                }
                            });
                            stats.relationsCreated++;
                        }
                    }
                }

                // REMOVE OLD RELATIONS  
                for (const existingCid of existingIds) {
                    if (!newCampaignIds.includes(existingCid)) {
                        await prisma.agentCampaign.deleteMany({
                            where: {
                                agentId: agent.id,
                                campaign: {
                                    campaignId: existingCid
                                }
                            }
                        });
                        stats.relationsRemoved++;
                    }
                }

            } catch (err) {
                stats.errors.push({ agent: agentUser, error: err.message });
            }
        }

        return { success: true, stats };

    } catch (err) {
        console.error("❌ Error syncing to database:", err);
        return { success: false, error: err.message };
    }
}


// -------------------------------
// GET AGENTS WITH CAMPAIGNS
// -------------------------------
export async function getAgentsWithCampaigns({
    page = 1,
    perPage = 10,
    search = "",
    activeAgents = []
}) {
    const skip = (page - 1) * perPage;

    const where = search
        ? {
              OR: [
                  { user: { contains: search } },
                  { fullName: { contains: search } }
              ]
          }
        : {};

    const [agents, total] = await Promise.all([
        prisma.agent.findMany({
            where,
            include: {
                campaigns: {
                    include: { campaign: true }
                }
            },
            skip,
            take: perPage,
            orderBy: { user: "asc" }
        }),
        prisma.agent.count({ where })
    ]);

    return {
        data: agents.map(agent => ({
            user: agent.user,
            fullName: agent.fullName,
            full_name: agent.fullName,
            userGroup: agent.userGroup,
            isActive: activeAgents.includes(agent.user),
            campaigns: agent.campaigns.map(ac => ({
                id: ac.campaign.campaignId,
                name: ac.campaign.campaignName || ac.campaign.campaignId
            }))
        })),
        pagination: {
            page,
            perPage,
            total,
            totalPages: Math.ceil(total / perPage)
        }
    };
}


// -------------------------------
// GET AGENT CAMPAIGNS PAGINATED
// -------------------------------
export async function getAgentCampaignsPaginated(agentUser, { page = 1, perPage = 8 }) {
    const skip = (page - 1) * perPage;

    const agent = await prisma.agent.findUnique({
        where: { user: String(agentUser) },
        include: {
            campaigns: {
                include: { campaign: true },
                skip,
                take: perPage,
                orderBy: { campaign: { campaignName: "asc" } }
            },
            _count: { select: { campaigns: true } }
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
