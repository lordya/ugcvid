import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/supabase'

type ScriptAngle = Database['public']['Tables']['script_angles']['Row']
type VideoScriptInsert = Database['public']['Tables']['video_scripts']['Insert']

export interface SelectedAngle extends ScriptAngle {
  keywords_string: string
}

/**
 * Selects angles for script generation based on user input or random selection
 * @param manualAngleIds - Optional array of specific angle IDs to use
 * @returns Array of selected angles with keywords as string
 */
export async function selectAngles(manualAngleIds?: string[]): Promise<SelectedAngle[]> {
  const supabase = await createClient()

  if (manualAngleIds && manualAngleIds.length > 0) {
    // Fetch specific angles requested by user
    const { data: angles, error } = await supabase
      .from('script_angles')
      .select('*')
      .in('id', manualAngleIds)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching manual angles:', error)
      throw new Error('Failed to fetch requested script angles')
    }

    if (!angles || angles.length === 0) {
      throw new Error('No active angles found for the requested IDs')
    }

    return angles.map(angle => ({
      ...angle,
      keywords_string: angle.keywords.join(', ')
    }))
  } else {
    // Randomly select 3 distinct active angles with different types
    const { data: allAngles, error } = await supabase
      .from('script_angles')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching script angles:', error)
      throw new Error('Failed to fetch script angles')
    }

    if (!allAngles || allAngles.length === 0) {
      // Fallback to hardcoded general angle if DB is empty
      return [{
        id: 'general',
        label: 'General',
        description: 'General marketing approach',
        keywords: ['amazing', 'incredible', 'must-have'],
        prompt_template: 'Create engaging content that highlights the key benefits and features.',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        keywords_string: 'amazing, incredible, must-have'
      }]
    }

    // For now, just randomly select 3 angles
    // TODO: In the future, we could categorize angles by type (Logical, Emotional, Viral)
    // and ensure we get one from each category
    const shuffled = [...allAngles].sort(() => Math.random() - 0.5)
    const selectedAngles = shuffled.slice(0, Math.min(3, allAngles.length))

    return selectedAngles.map(angle => ({
      ...angle,
      keywords_string: angle.keywords.join(', ')
    }))
  }
}

/**
 * Saves generated scripts to the video_scripts table
 * @param scripts - Array of script objects with video_id, angle_id, and content
 * @returns Array of inserted script records
 */
export async function saveVideoScripts(
  scripts: { video_id: string; angle_id: string; content: string }[]
): Promise<Database['public']['Tables']['video_scripts']['Row'][]> {
  const supabase = await createClient()

  const inserts: VideoScriptInsert[] = scripts.map(script => ({
    video_id: script.video_id,
    angle_id: script.angle_id,
    content: script.content
  }))

  const { data, error } = await supabase
    .from('video_scripts')
    .insert(inserts)
    .select()

  if (error) {
    console.error('Error saving video scripts:', error)
    throw new Error('Failed to save generated scripts')
  }

  return data || []
}
