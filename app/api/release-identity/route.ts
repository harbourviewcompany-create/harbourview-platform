export const dynamic = 'force-dynamic'

export async function GET() {
  const deploymentUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null

  return Response.json(
    {
      gitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
      deploymentUrl,
      projectId: process.env.VERCEL_PROJECT_ID ?? null,
      environment: process.env.VERCEL_ENV ?? null,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    },
  )
}
