import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { users, projects, outputs } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getCurrentUser()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's creation date
    const [user] = await db
      .select({ createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, session.userId))

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's project IDs
    const userProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.userId, session.userId))

    const projectIds = userProjects.map((p) => p.id)

    let totalOutputs = 0
    const byTool: Record<string, number> = {}

    if (projectIds.length > 0) {
      // Get output counts by tool type for all user's projects
      const outputStats = await db
        .select({
          toolType: outputs.toolType,
          count: sql<number>`count(*)::int`,
        })
        .from(outputs)
        .where(sql`${outputs.projectId} = ANY(${projectIds})`)
        .groupBy(outputs.toolType)

      for (const stat of outputStats) {
        byTool[stat.toolType] = stat.count
        totalOutputs += stat.count
      }
    }

    return NextResponse.json({
      totalOutputs,
      byTool,
      memberSince: user.createdAt?.toISOString() || new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching usage stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch usage stats" },
      { status: 500 }
    )
  }
}
