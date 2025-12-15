import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { storage } from "@/lib/db/storage"
import type { InsertProject } from "@/lib/db/schema"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, description } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      )
    }

    if (!["personal", "partner", "client"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid project type" },
        { status: 400 }
      )
    }

    const projectData: InsertProject = {
      userId: user.userId,
      name,
      type,
      description: description || null,
      isActive: false,
    }

    const project = await storage.createProject(projectData)

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await storage.getProjects(user.userId)
    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}
