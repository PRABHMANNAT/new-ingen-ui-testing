import { NextResponse, type NextRequest } from "next/server"
import { getRepos, getUser, GitHubError, normalizeGitHubUsername } from "@/lib/github"

export async function GET(request: NextRequest) {
  const username = normalizeGitHubUsername(request.nextUrl.searchParams.get("username") ?? "")

  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 })
  }

  try {
    const [user, repos] = await Promise.all([getUser(username), getRepos(username)])
    const topRepos = repos
      .filter((repo) => !repo.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5)
      .map((repo) => ({
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        url: repo.html_url,
      }))

    const languages = Array.from(new Set(repos.map((repo) => repo.language).filter((language): language is string => Boolean(language)))).slice(0, 8)

    return NextResponse.json({
      username: user.login,
      name: user.name,
      bio: user.bio,
      followers: user.followers,
      publicRepos: user.public_repos,
      topRepos,
      languages,
      githubEvidenceSummary: `${user.login} has ${user.public_repos} public repos, ${user.followers} followers, and recent public work across ${languages.slice(0, 4).join(", ") || "multiple repositories"}.`,
      source: "github",
    })
  } catch (error) {
    const message = error instanceof GitHubError ? error.message : "GitHub lookup failed"
    return NextResponse.json({ error: message }, { status: 200 })
  }
}
