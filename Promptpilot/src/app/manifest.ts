
import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PromptPilot AI Orchestrator',
    short_name: 'PromptPilot',
    description: 'Autonomous AI Orchestrator for Engineering the Perfect Mission',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#020617',
    theme_color: '#3b82f6',
    icons: [
      {
        src: 'https://picsum.photos/seed/pilot-icon/192/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: 'https://picsum.photos/seed/pilot-icon/512/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
    ],
  }
}
