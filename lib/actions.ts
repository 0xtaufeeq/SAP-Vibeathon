'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Professional Event Management: Create a new event
 */
export async function createEvent(eventData: {
  title: string
  description?: string
  venue?: string
  start_time: string
  end_time: string
  timezone?: string
  parent_event_id?: number
  is_invite_only?: boolean
  is_volunteer_open?: boolean
}) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Not authenticated" }

    // Verify user is PROFESSIONAL
    const { data: profile } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .maybeSingle()

    const userType = profile?.user_type || user.user_metadata?.user_type || user.user_metadata?.attendee_category
    const isProfessional = userType?.toString().toUpperCase() === 'PROFESSIONAL'

    if (!isProfessional) {
      return { error: "Only professionals can create events. Please update your profile." }
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return { error: `Failed to create event: ${error.message}` }
    }

    revalidatePath('/dashboard')
    revalidatePath('/explore')
    return { success: true, data }
  } catch (err: any) {
    console.error("Critical error in createEvent:", err)
    return { error: "An unexpected error occurred while creating the event." }
  }
}

/**
 * Professional Event Management: Add an organizer to an event by email
 */
export async function addOrganizer(
  event_id: number, 
  email: string,
  permissions?: { can_manage_team?: boolean, can_scan_qr?: boolean, can_manage_tasks?: boolean }
) {
  try {
    const supabase = createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) return { error: "Not authenticated" }

    // Check if current user is owner or an organizer with team management permissions
    const { data: permCheck } = await supabase
      .from('event_team')
      .select('role, can_manage_team')
      .eq('event_id', event_id)
      .eq('user_id', currentUser.id)
      .maybeSingle()

    const { data: eventOwner } = await supabase
      .from('events')
      .select('owner_id')
      .eq('id', event_id)
      .maybeSingle()

    const isOwner = eventOwner?.owner_id === currentUser.id
    const canManageTeam = permCheck?.can_manage_team === true

    if (!isOwner && !canManageTeam) {
      return { error: "You don't have permission to add organizers to this event." }
    }

    // Find user by email
    const { data: targetUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (!targetUser) {
      return { error: `User with email "${email}" not found. Please ensure they have signed up first.` }
    }

    // Check if target user is already in the team
    const { data: existingTeam } = await supabase
      .from('event_team')
      .select('id')
      .eq('event_id', event_id)
      .eq('user_id', targetUser.id)
      .maybeSingle()

    if (existingTeam) {
      return { error: "This user is already an organizer or has a pending invitation." }
    }

    // Add to team as PENDING invitation
    const { data, error } = await supabase
      .from('event_team')
      .insert({
        event_id,
        user_id: targetUser.id,
        role: 'ORGANIZER',
        status: 'PENDING', // Changed from APPROVED to PENDING as per requirement
        can_manage_team: permissions?.can_manage_team ?? true,
        can_scan_qr: permissions?.can_scan_qr ?? true,
        can_manage_tasks: permissions?.can_manage_tasks ?? true,
        assigned_by: currentUser.id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return { error: "This user already has a pending invite or is already an organizer." }
      return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/events/manage/${event_id}`)
    return { success: true, data }
  } catch (err: any) {
    console.error("Critical error in addOrganizer:", err)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

/**
 * Team Management: Remove a member from the team
 */
export async function removeTeamMember(event_id: number, user_id: string) {
  try {
    const supabase = createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) return { error: "Not authenticated" }

    // Check the event and the member being removed
    const { data: event } = await supabase
      .from('events')
      .select('owner_id')
      .eq('id', event_id)
      .single()

    const { data: targetMember } = await supabase
      .from('event_team')
      .select('role')
      .eq('event_id', event_id)
      .eq('user_id', user_id)
      .maybeSingle()

    const isOwner = event?.owner_id === currentUser.id

    // User requirement: Only the event creator can remove ORGANIZERS
    if (targetMember?.role === 'ORGANIZER' && !isOwner) {
      return { error: "Security: Only the event creator can manage organizer roles." }
    }

    // Checking if the user trying to remove is authorized (Owner or Manager)
    const { data: permCheck } = await supabase
      .from('event_team')
      .select('can_manage_team')
      .eq('event_id', event_id)
      .eq('user_id', currentUser.id)
      .maybeSingle()

    if (!isOwner && !permCheck?.can_manage_team) {
      return { error: "Unauthorized: You don't have permission to manage the team." }
    }

    if (user_id === event?.owner_id) {
      return { error: "The event owner cannot be removed." }
    }

    const { error } = await supabase
      .from('event_team')
      .delete()
      .eq('event_id', event_id)
      .eq('user_id', user_id)

    if (error) return { error: error.message }
    
    revalidatePath(`/events/manage/${event_id}`)
    return { success: true }
  } catch (err: any) {
    return { error: "An unexpected error occurred during removal." }
  }
}

/**
 * Event Management: Update basic event details
 */
export async function updateEventDetails(event_id: number, updates: any) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  // Check ownership
  const { data: event } = await supabase
    .from('events')
    .select('owner_id')
    .eq('id', event_id)
    .single()

  if (event?.owner_id !== user.id) {
    throw new Error("Only owners can update event details")
  }

  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', event_id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/explore')
  revalidatePath('/dashboard')
  revalidatePath(`/events/manage/${event_id}`)
  return data
}

/**
 * Registration: Attendee registration for an event
 */
export async function registerForEvent(event_id: number) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Not authenticated" }

    // Check if event exists and is invite only
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('is_invite_only')
      .eq('id', event_id)
      .maybeSingle()

    if (!event) return { error: "Event not found" }

    // For most events, we want registrations to be PENDING by default so organizers can review
    const status = event.is_invite_only ? 'PENDING' : 'PENDING' // Defaulting to PENDING for both for now based on feedback

    const { data, error } = await supabase
      .from('event_registrations')
      .insert({
        user_id: user.id,
        event_id: event_id,
        status: status
      })
      .select()
      .maybeSingle()

    if (error) {
      if (error.code === '23505') return { error: "You already have a request or registration for this event" }
      return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/explore')
    revalidatePath('/profile')
    return { success: true, data }
  } catch (err: any) {
    return { error: "Failed to register for event" }
  }
}

/**
 * Registration Management: Review registration requests
 */
export async function updateRegistrationStatus(
  reg_id: number,
  status: 'APPROVED' | 'REJECTED'
) {
  const supabase = createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) throw new Error("Not authenticated")

  // Check permissions (Owner or Team manager)
  const { data: regData } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('reg_id', reg_id)
    .single()

  if (!regData) throw new Error("Registration not found")

  const { data: event } = await supabase
    .from('events')
    .select('owner_id')
    .eq('id', regData.event_id)
    .single()

  const { data: teamMember } = await supabase
    .from('event_team')
    .select('role, can_manage_team')
    .eq('event_id', regData.event_id)
    .eq('user_id', currentUser.id)
    .single()

  if (event?.owner_id !== currentUser.id && !teamMember?.can_manage_team) {
    throw new Error("Unauthorized to manage registrations")
  }

  const { error } = await supabase
    .from('event_registrations')
    .update({ status })
    .eq('reg_id', reg_id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath(`/events/manage/${regData.event_id}`)
}

/**
 * Volunteer Management: Apply to volunteer for an event
 */
export async function applyToVolunteer(event_id: number) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Not authenticated" }

    // Check if event is open for volunteers
    const { data: event } = await supabase
      .from('events')
      .select('is_volunteer_open')
      .eq('id', event_id)
      .maybeSingle()

    if (!event?.is_volunteer_open) {
      return { error: "This event is not accepting volunteers at this time." }
    }

    // Check if user is already in the team to prevent duplicates
    const { data: existingTeam } = await supabase
      .from('event_team')
      .select('id')
      .eq('event_id', event_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingTeam) {
      return { error: "You are already a member of this event team or have a pending application." }
    }

    const { data, error } = await supabase
      .from('event_team')
      .insert({
        event_id,
        user_id: user.id,
        role: 'VOLUNTEER',
        status: 'PENDING'
      })
      .select()
      .maybeSingle()

    if (error) {
      if (error.code === '23505') return { error: "You have already applied to volunteer for this event." }
      return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err: any) {
    return { error: "Failed to submit volunteer application." }
  }
}

/**
 * Invitation Management: Respond to an organizer invite
 */
export async function respondToOrganizerInvite(
  invite_id: number,
  status: 'APPROVED' | 'REJECTED'
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Not authenticated" }

    // Update the invite status
    const { error } = await supabase
      .from('event_team')
      .update({ status })
      .eq('id', invite_id)
      .eq('user_id', user.id) // Ensure security

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

/**
 * Volunteer Management: Update volunteer application status
 */
export async function updateVolunteerStatus(
  application_id: number,
  new_status: 'APPROVED' | 'REJECTED',
  permissions?: { can_scan_qr?: boolean, can_manage_tasks?: boolean }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  // Check if user is owner of the event OR an organizer with team permissions
  const { data: application, error: appError } = await supabase
    .from('event_team')
    .select('event_id, events!inner(owner_id)')
    .eq('id', application_id)
    .single()

  if (appError || !application) {
    throw new Error("Application not found or unauthorized")
  }

  const { data: permCheck } = await supabase
    .from('event_team')
    .select('role, can_manage_team')
    .eq('event_id', application.event_id)
    .eq('user_id', user.id)
    .single()

  // @ts-ignore
  const isOwner = application.events.owner_id === user.id
  const canManageTeam = permCheck?.can_manage_team === true

  if (!isOwner && !canManageTeam) {
    throw new Error("Only event owners or authorized organizers can update volunteer status")
  }

  const updateData: any = { status: new_status }
  if (new_status === 'APPROVED' && permissions) {
    updateData.can_scan_qr = permissions.can_scan_qr
    updateData.can_manage_tasks = permissions.can_manage_tasks
  }

  const { data, error } = await supabase
    .from('event_team')
    .update(updateData)
    .eq('id', application_id)
    .select()
    .single()

  if (error) {
    console.error('Error updating volunteer status:', error)
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/volunteers')
  return data
}

/**
 * Secure QR Check-in: Process check-in via ticket hash
 */
export async function processCheckIn(ticket_hash: string) {
  const supabase = createClient()
  const { data: { user: scanner } } = await supabase.auth.getUser()

  if (!scanner) throw new Error("Not authenticated")

  // 1. Identify registration and event
  const { data: registration, error: regError } = await supabase
    .from('event_registrations')
    .select('reg_id, event_id, is_checked_in')
    .eq('ticket_hash', ticket_hash)
    .single()

  if (regError || !registration) {
    throw new Error("Invalid ticket hash")
  }

  if (registration.is_checked_in) {
    throw new Error("User is already checked in")
  }

  // 2. Verify scanner permissions
  const { data: teamMember, error: teamError } = await supabase
    .from('event_team')
    .select('id')
    .eq('event_id', registration.event_id)
    .eq('user_id', scanner.id)
    .eq('can_scan_qr', true)
    .single()

  if (teamError || !teamMember) {
    throw new Error("You do not have permission to scan QR codes for this event")
  }

  // 3. Process check-in
  const { data, error } = await supabase
    .from('event_registrations')
    .update({
      is_checked_in: true,
      checked_in_at: new Date().toISOString(),
      checked_in_by: scanner.id
    })
    .eq('reg_id', registration.reg_id)
    .select()
    .single()

  if (error) {
    console.error('Error processing check-in:', error)
    throw new Error(error.message)
  }

  return { success: true, data }
}

/**
 * Dynamic Agenda: Get personalized agenda for a user
 */
export async function getPersonalAgenda(user_id: string) {
  const supabase = createClient()

  // Get event IDs the user is registered for
  const { data: registrations, error: regError } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('user_id', user_id)

  if (regError) {
    console.error('Error fetching registrations:', regError)
    throw new Error(regError.message)
  }

  const eventIds = registrations.map(r => r.event_id)

  if (eventIds.length === 0) return []

  // Query agenda_view and filter by registered event IDs
  // Since agenda_view 'id' is text (cast in SQL), we match against strings
  const { data, error } = await supabase
    .from('agenda_view')
    .select('*')
    .in('id', eventIds.map(id => id.toString()))

  if (error) {
    console.error('Error fetching agenda:', error)
    throw new Error(error.message)
  }

  return data
}
