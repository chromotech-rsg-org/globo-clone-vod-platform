import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planId } = await req.json();

    if (!planId) {
      return new Response(
        JSON.stringify({ success: false, message: 'planId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[plans-resolve-package-code] 🔎 Resolving package code for plan:', planId);

    // Create Supabase client with service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Get plan basic info
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('id, name, package_id')
      .eq('id', planId)
      .maybeSingle();

    console.log('[plans-resolve-package-code] 📋 Plan result:', { plan, planError });

    if (planError) {
      console.error('[plans-resolve-package-code] ❌ Error fetching plan:', planError);
      return new Response(
        JSON.stringify({ success: false, message: 'Erro ao buscar plano' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!plan) {
      console.error('[plans-resolve-package-code] ❌ Plan not found');
      return new Response(
        JSON.stringify({ success: false, message: 'Plano não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Try to get package via direct package_id column
    if (plan.package_id) {
      const { data: pkg, error: pkgError } = await supabaseAdmin
        .from('packages')
        .select('code, active, suspension_package')
        .eq('id', plan.package_id)
        .maybeSingle();

      console.log('[plans-resolve-package-code] 📦 Package via plan.package_id:', { pkg, pkgError });

      if (!pkgError && pkg?.code) {
        console.log('[plans-resolve-package-code] ✅ Package code found via direct relation:', pkg.code);
        return new Response(
          JSON.stringify({ success: true, packageCode: String(pkg.code) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Step 3: Fallback to plan_packages many-to-many relation
    const { data: planPackages, error: ppError } = await supabaseAdmin
      .from('plan_packages')
      .select('package_id')
      .eq('plan_id', planId);

    console.log('[plans-resolve-package-code] 🔗 plan_packages result:', { planPackages, ppError });

    if (ppError) {
      console.error('[plans-resolve-package-code] ❌ Error fetching plan_packages:', ppError);
      return new Response(
        JSON.stringify({ success: false, message: 'Erro ao buscar pacotes do plano' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!planPackages || planPackages.length === 0) {
      console.error('[plans-resolve-package-code] ❌ No packages found for plan');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Código do pacote não configurado. Por favor, configure o pacote no plano antes de continuar.' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get package details for all linked packages
    const packageIds = planPackages.map(pp => pp.package_id);
    const { data: packages, error: packagesError } = await supabaseAdmin
      .from('packages')
      .select('id, code, active, suspension_package')
      .in('id', packageIds);

    console.log('[plans-resolve-package-code] 📦 Packages details:', { packages, packagesError });

    if (packagesError) {
      console.error('[plans-resolve-package-code] ❌ Error fetching packages:', packagesError);
      return new Response(
        JSON.stringify({ success: false, message: 'Erro ao buscar detalhes dos pacotes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!packages || packages.length === 0) {
      console.error('[plans-resolve-package-code] ❌ No valid packages found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Nenhum pacote válido encontrado para o plano' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prefer active, non-suspension packages
    const preferred = packages.find(p => p.active === true && p.suspension_package !== true) || packages[0];

    if (!preferred?.code) {
      console.error('[plans-resolve-package-code] ❌ No package with code found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Código do pacote não configurado. Por favor, configure o código do pacote antes de continuar.' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[plans-resolve-package-code] ✅ Package code resolved:', preferred.code);
    return new Response(
      JSON.stringify({ success: true, packageCode: String(preferred.code) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[plans-resolve-package-code] ❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
