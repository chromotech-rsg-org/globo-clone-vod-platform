-- Attach audit triggers to core domain tables and add helpful indexes
-- Avoid recursion: do NOT attach to audit_logs or profile_audit_log or integration_logs

-- Auctions and related
DROP TRIGGER IF EXISTS audit_auctions_changes ON public.auctions;
CREATE TRIGGER audit_auctions_changes
AFTER INSERT OR UPDATE OR DELETE ON public.auctions
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_auction_items_changes ON public.auction_items;
CREATE TRIGGER audit_auction_items_changes
AFTER INSERT OR UPDATE OR DELETE ON public.auction_items
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_bids_changes ON public.bids;
CREATE TRIGGER audit_bids_changes
AFTER INSERT OR UPDATE OR DELETE ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_auction_registrations_changes ON public.auction_registrations;
CREATE TRIGGER audit_auction_registrations_changes
AFTER INSERT OR UPDATE OR DELETE ON public.auction_registrations
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Users and limits
DROP TRIGGER IF EXISTS audit_profiles_changes ON public.profiles;
CREATE TRIGGER audit_profiles_changes
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_client_bid_limits_changes ON public.client_bid_limits;
CREATE TRIGGER audit_client_bid_limits_changes
AFTER INSERT OR UPDATE OR DELETE ON public.client_bid_limits
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_limit_increase_requests_changes ON public.limit_increase_requests;
CREATE TRIGGER audit_limit_increase_requests_changes
AFTER INSERT OR UPDATE OR DELETE ON public.limit_increase_requests
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Documents & notifications
DROP TRIGGER IF EXISTS audit_client_documents_changes ON public.client_documents;
CREATE TRIGGER audit_client_documents_changes
AFTER INSERT OR UPDATE OR DELETE ON public.client_documents
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_user_notification_reads_changes ON public.user_notification_reads;
CREATE TRIGGER audit_user_notification_reads_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_notification_reads
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Content & products
DROP TRIGGER IF EXISTS audit_content_sections_changes ON public.content_sections;
CREATE TRIGGER audit_content_sections_changes
AFTER INSERT OR UPDATE OR DELETE ON public.content_sections
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_content_items_changes ON public.content_items;
CREATE TRIGGER audit_content_items_changes
AFTER INSERT OR UPDATE OR DELETE ON public.content_items
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_coupons_changes ON public.coupons;
CREATE TRIGGER audit_coupons_changes
AFTER INSERT OR UPDATE OR DELETE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_packages_changes ON public.packages;
CREATE TRIGGER audit_packages_changes
AFTER INSERT OR UPDATE OR DELETE ON public.packages
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_plans_changes ON public.plans;
CREATE TRIGGER audit_plans_changes
AFTER INSERT OR UPDATE OR DELETE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_plan_packages_changes ON public.plan_packages;
CREATE TRIGGER audit_plan_packages_changes
AFTER INSERT OR UPDATE OR DELETE ON public.plan_packages
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_subscriptions_changes ON public.subscriptions;
CREATE TRIGGER audit_subscriptions_changes
AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Integrations
DROP TRIGGER IF EXISTS audit_integration_settings_changes ON public.integration_settings;
CREATE TRIGGER audit_integration_settings_changes
AFTER INSERT OR UPDATE OR DELETE ON public.integration_settings
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_integration_jobs_changes ON public.integration_jobs;
CREATE TRIGGER audit_integration_jobs_changes
AFTER INSERT OR UPDATE OR DELETE ON public.integration_jobs
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_motv_api_configs_changes ON public.motv_api_configs;
CREATE TRIGGER audit_motv_api_configs_changes
AFTER INSERT OR UPDATE OR DELETE ON public.motv_api_configs
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- System settings
DROP TRIGGER IF EXISTS audit_system_settings_changes ON public.system_settings;
CREATE TRIGGER audit_system_settings_changes
AFTER INSERT OR UPDATE OR DELETE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Optional: record API test results as well
DROP TRIGGER IF EXISTS audit_integration_test_results_changes ON public.integration_test_results;
CREATE TRIGGER audit_integration_test_results_changes
AFTER INSERT OR UPDATE OR DELETE ON public.integration_test_results
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Helpful indexes for fast filtering/sorting in the admin Auditoria page
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
