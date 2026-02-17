import { createSupabaseServerClient } from "./supabaseServerClient";

export type ContactResult = {
  contactId: string;
  displayName: string | null;
  isNew: boolean;
};

/**
 * Finds an existing contact by channel + identifier within an account,
 * or creates a new one if not found.
 */
export async function findOrCreateContact(
  accountId: string,
  channel: string,
  channelIdentifier: string,
  displayName?: string
): Promise<ContactResult> {
  const supabase = createSupabaseServerClient();

  // Look up existing contact via contact_channels
  const { data: existing } = await supabase
    .from("contact_channels")
    .select("contact_id, contacts!inner(id, display_name)")
    .eq("account_id", accountId)
    .eq("channel", channel)
    .eq("channel_identifier", channelIdentifier)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const contact = existing.contacts as unknown as {
      id: string;
      display_name: string | null;
    };
    return {
      contactId: contact.id,
      displayName: contact.display_name,
      isNew: false,
    };
  }

  // Create new contact
  const { data: newContact, error: contactError } = await supabase
    .from("contacts")
    .insert({
      account_id: accountId,
      display_name: displayName || null,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    })
    .select("id, display_name")
    .single();

  if (contactError || !newContact) {
    throw new Error(
      `Failed to create contact: ${contactError?.message ?? "Unknown error"}`
    );
  }

  // Create channel entry
  const { error: channelError } = await supabase
    .from("contact_channels")
    .upsert(
      {
        contact_id: newContact.id,
        account_id: accountId,
        channel,
        channel_identifier: channelIdentifier,
      },
      {
        onConflict: "account_id,channel,channel_identifier",
        ignoreDuplicates: true,
      }
    );

  if (channelError) {
    throw new Error(
      `Failed to create contact channel: ${channelError.message}`
    );
  }

  const { data: resolved } = await supabase
    .from("contact_channels")
    .select("contact_id, contacts!inner(id, display_name)")
    .eq("account_id", accountId)
    .eq("channel", channel)
    .eq("channel_identifier", channelIdentifier)
    .limit(1)
    .maybeSingle();

  if (!resolved) {
    throw new Error("Failed to resolve contact channel after upsert");
  }

  const resolvedContact = resolved.contacts as unknown as {
    id: string;
    display_name: string | null;
  };

  if (resolvedContact.id !== newContact.id) {
    await supabase.from("contacts").delete().eq("id", newContact.id);
    return {
      contactId: resolvedContact.id,
      displayName: resolvedContact.display_name,
      isNew: false,
    };
  }

  return {
    contactId: newContact.id,
    displayName: newContact.display_name,
    isNew: true,
  };
}

/**
 * Updates a contact's display name if it was previously unknown.
 */
export async function updateContactDisplayName(
  contactId: string,
  displayName: string
): Promise<void> {
  const supabase = createSupabaseServerClient();
  await supabase
    .from("contacts")
    .update({
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contactId)
    .or("display_name.is.null,display_name.eq.,display_name.eq.Unbekannt");
}

/**
 * Updates last_seen_at on a contact.
 */
export async function touchContact(contactId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  await supabase
    .from("contacts")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", contactId);
}
