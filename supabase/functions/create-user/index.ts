import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Server-side validation
interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'E-Mail ist erforderlich' };
  }
  const trimmed = email.trim();
  if (trimmed.length > 255) {
    return { valid: false, error: 'E-Mail darf maximal 255 Zeichen haben' };
  }
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Ungültige E-Mail-Adresse' };
  }
  return { valid: true };
}

function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Passwort ist erforderlich' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Passwort muss mindestens 8 Zeichen haben' };
  }
  if (password.length > 72) {
    return { valid: false, error: 'Passwort darf maximal 72 Zeichen haben' };
  }
  return { valid: true };
}

function validateName(name: string, field: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${field} ist erforderlich` };
  }
  const trimmed = name.trim();
  if (trimmed.length < 1) {
    return { valid: false, error: `${field} ist erforderlich` };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: `${field} darf maximal 100 Zeichen haben` };
  }
  // Allow German characters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-ZäöüÄÖÜß\s\-']+$/;
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: `${field} enthält ungültige Zeichen` };
  }
  return { valid: true };
}

function validateRole(role: string | undefined): ValidationResult {
  if (role === undefined) {
    return { valid: true }; // Optional, defaults to employee
  }
  if (role !== 'admin' && role !== 'employee') {
    return { valid: false, error: 'Ungültige Rolle' };
  }
  return { valid: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify requesting user is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: "Nicht autorisiert" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const token = authHeader.replace("Bearer ", "");
    
    const { data: { user: requestingUser }, error: authError } = await createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(token);

    if (authError || !requestingUser) {
      console.error("Auth error:", authError?.message);
      return new Response(JSON.stringify({ error: "Nicht autorisiert" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if requesting user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    if (roleData?.role !== "admin") {
      console.error("Non-admin user attempted to create user:", requestingUser.id);
      return new Response(JSON.stringify({ error: "Nur Admins können Benutzer erstellen" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Ungültige Anfrage" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, first_name, last_name, role } = body;

    // Server-side validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return new Response(JSON.stringify({ error: emailValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return new Response(JSON.stringify({ error: passwordValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstNameValidation = validateName(first_name, "Vorname");
    if (!firstNameValidation.valid) {
      return new Response(JSON.stringify({ error: firstNameValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastNameValidation = validateName(last_name, "Nachname");
    if (!lastNameValidation.valid) {
      return new Response(JSON.stringify({ error: lastNameValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const roleValidation = validateRole(role);
    if (!roleValidation.valid) {
      return new Response(JSON.stringify({ error: roleValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedFirstName = first_name.trim();
    const sanitizedLastName = last_name.trim();
    const sanitizedRole = role || "employee";

    console.log("Creating user:", { email: sanitizedEmail, first_name: sanitizedFirstName, last_name: sanitizedLastName, role: sanitizedRole });

    // Create user with admin client
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizedEmail,
      password,
      email_confirm: true,
      user_metadata: { first_name: sanitizedFirstName, last_name: sanitizedLastName },
    });

    if (createError || !authData.user) {
      console.error("Create user error:", createError?.message);
      return new Response(JSON.stringify({ error: createError?.message || "Fehler beim Erstellen" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      user_id: authData.user.id,
      email: sanitizedEmail,
      first_name: sanitizedFirstName,
      last_name: sanitizedLastName,
    });

    if (profileError) {
      console.error("Create profile error:", profileError.message);
    }

    // Create role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: authData.user.id,
      role: sanitizedRole,
    });

    if (roleError) {
      console.error("Create role error:", roleError.message);
    }

    console.log("User created successfully:", authData.user.id);

    return new Response(JSON.stringify({ success: true, user_id: authData.user.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error("Unexpected error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
