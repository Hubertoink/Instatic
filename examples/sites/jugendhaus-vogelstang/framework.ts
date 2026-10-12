import { buildDefaultSpacingGroup, buildDefaultTypographyGroup } from '@core/framework'
import type { FrameworkColorToken, FrameworkSettings } from '@core/framework-schema'

export const brandColors = [
  ['jhv-primary', '#c5ff46'],
  ['jhv-secondary', '#ff3970'],
  ['jhv-paper', '#f3f3eb'],
  ['jhv-ink', '#171916'],
  ['jhv-muted', '#55584e'],
  ['jhv-line', '#c8cabc'],
] as const

export function configureJugendhausFramework(existing: FrameworkSettings = { colors: { tokens: [] } }): FrameworkSettings {
  const now = Date.now()
  const tokens = [...existing.colors?.tokens ?? []]
  for (const [slug, value] of brandColors) {
    // Preserve color choices made by the editor on subsequent installer runs.
    if (tokens.some((token) => token.slug === slug)) continue
    const token: FrameworkColorToken = {
      id: slug, category: 'Jugendhaus Vogelstang', slug,
      lightValue: value, darkValue: value, darkModeEnabled: false,
      generateUtilities: { text: true, background: true, border: true, fill: false },
      generateTransparent: false,
      generateShades: { enabled: false, count: 0 }, generateTints: { enabled: false, count: 0 },
      order: tokens.length, createdAt: now, updatedAt: now,
    }
    tokens.push(token)
  }
  const typographyGroups = [...existing.typography?.groups ?? []]
  if (!typographyGroups.some((group) => group.namingConvention === 'jhv-text')) {
    const group = buildDefaultTypographyGroup(typographyGroups.length)
    group.id = 'jhv-typography'
    group.name = 'Jugendhaus Schriftgrößen'
    group.namingConvention = 'jhv-text'
    group.mode = 'fluid_manual'
    group.steps = 's,m,l'
    group.baseScaleIndex = 1
    group.manualSizes = [
      { id: 'jhv-text-s', name: 'jhv-text-s', min: 14, max: 14 },
      { id: 'jhv-text-m', name: 'jhv-text-m', min: 16, max: 18 },
      { id: 'jhv-text-l', name: 'jhv-text-l', min: 22, max: 25 },
    ]
    typographyGroups.push(group)
  }
  const spacingGroups = [...existing.spacing?.groups ?? []]
  if (!spacingGroups.some((group) => group.namingConvention === 'jhv-space')) {
    const group = buildDefaultSpacingGroup(spacingGroups.length)
    group.id = 'jhv-spacing'
    group.name = 'Jugendhaus Abstände'
    group.namingConvention = 'jhv-space'
    group.mode = 'fluid_manual'
    group.steps = 'section'
    group.baseScaleIndex = 0
    group.manualSizes = [{ id: 'jhv-space-section', name: 'jhv-space-section', min: 60, max: 90 }]
    spacingGroups.push(group)
  }
  return {
    ...existing, colors: { tokens },
    typography: { ...existing.typography, groups: typographyGroups, classes: existing.typography?.classes ?? [] },
    spacing: { ...existing.spacing, groups: spacingGroups, classes: existing.spacing?.classes ?? [] },
    preferences: { rootFontSize: 16, minScreenWidth: 320, maxScreenWidth: 1440, isRem: true, treeShakeGeneratedFrameworkUtilities: true, ...existing.preferences },
  }
}
