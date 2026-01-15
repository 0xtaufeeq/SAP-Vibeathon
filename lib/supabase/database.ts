import { createClient } from '@/lib/supabase/server'

/**
 * Database helper utilities for Supabase
 */

/**
 * Get all records from a table
 */
export async function getAll<T>(table: string): Promise<T[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from(table).select('*')
  
  if (error) throw error
  return data as T[]
}

/**
 * Get a single record by ID
 */
export async function getById<T>(table: string, id: string): Promise<T | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as T
}

/**
 * Get a full user profile with all details (Backend abstraction)
 */
export async function getUserProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profile_view')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Create a new connection between two users
 */
export async function connectUsers(followerId: string, followedId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_connections')
    .insert({
      follower_id: followerId,
      followed_id: followedId,
      status: 'PENDING'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Register for an event
 */
export async function registerForEvent(userId: string, eventId: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('event_registrations')
    .insert({
      user_id: userId,
      event_id: eventId
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Create a new record
 */
export async function create<T>(table: string, record: Partial<T>): Promise<T> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(table)
    .insert(record)
    .select()
    .single()
  
  if (error) throw error
  return data as T
}

/**
 * Update a record by ID
 */
export async function update<T>(
  table: string,
  id: string,
  updates: Partial<T>
): Promise<T> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as T
}

/**
 * Delete a record by ID
 */
export async function deleteById(table: string, id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from(table).delete().eq('id', id)
  
  if (error) throw error
}

/**
 * Query with filters
 */
export async function query<T>(
  table: string,
  filters: Record<string, any>
): Promise<T[]> {
  const supabase = createClient()
  let query = supabase.from(table).select('*')
  
  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value)
  })
  
  const { data, error } = await query
  
  if (error) throw error
  return data as T[]
}

/**
 * Upload file to storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  })
  
  if (error) throw error
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path)
  
  return publicUrl
}

/**
 * Delete file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  
  if (error) throw error
}

/**
 * Get file public URL
 */
export async function getFileUrl(bucket: string, path: string): Promise<string> {
  const supabase = createClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
