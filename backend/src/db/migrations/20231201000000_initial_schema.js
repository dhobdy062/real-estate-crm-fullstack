/**
 * Initial database schema migration
 */
exports.up = function(knex) {
  return knex.schema
    // Roles table
    .createTable('roles', (table) => {
      table.increments('id').primary();
      table.string('role_name', 50).notNullable().unique();
      table.text('description');
    })
    
    // Users table
    .createTable('users', (table) => {
      table.bigIncrements('id').primary();
      table.string('first_name', 100).notNullable();
      table.string('last_name', 100).notNullable();
      table.string('email', 255).notNullable().unique();
      table.string('phone_number', 30);
      table.string('password_hash', 255).notNullable();
      table.integer('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('RESTRICT');
      table.boolean('is_active').defaultTo(true);
      table.string('license_number', 100);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index('email', 'idx_users_email');
      table.index('role_id', 'idx_users_role_id');
    })
    
    // Tags table
    .createTable('tags', (table) => {
      table.increments('id').primary();
      table.string('tag_name', 50).notNullable().unique();
      table.string('tag_color', 7); // Hex color code
      
      // Indexes
      table.index('tag_name', 'idx_tags_tag_name');
    })
    
    // Contacts table
    .createTable('contacts', (table) => {
      table.bigIncrements('id').primary();
      table.string('first_name', 100);
      table.string('last_name', 100);
      table.string('email', 255).unique();
      table.string('phone_primary', 30);
      table.string('phone_secondary', 30);
      table.string('address_street', 255);
      table.string('address_city', 100);
      table.string('address_state', 50);
      table.string('address_zip', 20);
      table.string('address_country', 50);
      table.string('preferred_contact_method', 50);
      table.text('relationship_notes');
      table.bigInteger('owner_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index('email', 'idx_contacts_email');
      table.index('phone_primary', 'idx_contacts_phone_primary');
      table.index('owner_user_id', 'idx_contacts_owner_user_id');
      table.index(['last_name', 'first_name'], 'idx_contacts_last_name_first_name');
    })
    
    // Contact Tags junction table
    .createTable('contact_tags', (table) => {
      table.bigInteger('contact_id').unsigned().notNullable().references('id').inTable('contacts').onDelete('CASCADE');
      table.integer('tag_id').unsigned().notNullable().references('id').inTable('tags').onDelete('CASCADE');
      table.primary(['contact_id', 'tag_id']);
    })
    
    // Lead Sources table
    .createTable('lead_sources', (table) => {
      table.increments('id').primary();
      table.string('source_name', 100).notNullable().unique();
      table.string('source_type', 50);
      
      // Indexes
      table.index('source_name', 'idx_lead_sources_source_name');
    })
    
    // Pipeline Statuses table
    .createTable('pipeline_statuses', (table) => {
      table.increments('id').primary();
      table.string('status_name', 50).notNullable().unique();
      table.integer('stage_order').notNullable().defaultTo(0);
      table.string('status_category', 50);
      
      // Indexes
      table.index('status_name', 'idx_pipeline_statuses_name');
      table.index('stage_order', 'idx_pipeline_statuses_order');
    })
    
    // Leads table
    .createTable('leads', (table) => {
      table.bigIncrements('id').primary();
      table.string('first_name', 100);
      table.string('last_name', 100);
      table.string('email', 255);
      table.string('phone_number', 30);
      table.integer('lead_source_id').unsigned().references('id').inTable('lead_sources').onDelete('RESTRICT');
      table.integer('pipeline_status_id').unsigned().references('id').inTable('pipeline_statuses').onDelete('RESTRICT');
      table.text('inquiry_details');
      table.integer('lead_score');
      table.bigInteger('assigned_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.bigInteger('converted_contact_id').unsigned().unique().references('id').inTable('contacts').onDelete('SET NULL');
      table.timestamp('converted_at');
      table.string('external_lead_id', 100);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index('email', 'idx_leads_email');
      table.index('phone_number', 'idx_leads_phone_number');
      table.index('lead_source_id', 'idx_leads_lead_source_id');
      table.index('pipeline_status_id', 'idx_leads_pipeline_status_id');
      table.index('assigned_user_id', 'idx_leads_assigned_user_id');
      table.index('converted_contact_id', 'idx_leads_converted_contact_id');
    })
    
    // Lead Tags junction table
    .createTable('lead_tags', (table) => {
      table.bigInteger('lead_id').unsigned().notNullable().references('id').inTable('leads').onDelete('CASCADE');
      table.integer('tag_id').unsigned().notNullable().references('id').inTable('tags').onDelete('CASCADE');
      table.primary(['lead_id', 'tag_id']);
    })
    
    // Communication Templates table
    .createTable('communication_templates', (table) => {
      table.bigIncrements('id').primary();
      table.string('template_name', 150).notNullable();
      table.string('template_type', 20).notNullable();
      table.string('subject', 255);
      table.text('body_content').notNullable();
      table.boolean('is_active').defaultTo(true);
      table.bigInteger('created_by_user_id').unsigned().references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['template_type', 'template_name'], 'idx_comm_templates_type_name');
    })
    
    // Communications table
    .createTable('communications', (table) => {
      table.bigIncrements('id').primary();
      table.string('communication_type', 20).notNullable();
      table.string('direction', 20).notNullable();
      table.string('status', 20).notNullable();
      table.string('subject', 255);
      table.text('message_content');
      table.timestamp('timestamp').defaultTo(knex.fn.now());
      table.bigInteger('lead_id').unsigned().references('id').inTable('leads').onDelete('CASCADE');
      table.bigInteger('contact_id').unsigned().references('id').inTable('contacts').onDelete('CASCADE');
      table.bigInteger('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.bigInteger('template_id').unsigned().references('id').inTable('communication_templates').onDelete('SET NULL');
      table.bigInteger('campaign_step_id').unsigned(); // Will be linked later
      table.string('external_message_id', 100);
      table.timestamp('scheduled_time');
      
      // Indexes
      table.index('lead_id', 'idx_communications_lead_id');
      table.index('contact_id', 'idx_communications_contact_id');
      table.index('user_id', 'idx_communications_user_id');
      table.index('timestamp', 'idx_communications_timestamp');
      table.index('status', 'idx_communications_status');
      
      // Check constraint to ensure either lead_id or contact_id is not null
      table.raw('CHECK (lead_id IS NOT NULL OR contact_id IS NOT NULL)');
    })
    
    // Email Campaigns table
    .createTable('email_campaigns', (table) => {
      table.bigIncrements('id').primary();
      table.string('campaign_name', 150).notNullable();
      table.text('description');
      table.boolean('is_active').defaultTo(true);
      table.string('trigger_condition', 255);
      table.bigInteger('created_by_user_id').unsigned().references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index('campaign_name', 'idx_email_campaigns_name');
    })
    
    // Campaign Steps table
    .createTable('campaign_steps', (table) => {
      table.bigIncrements('id').primary();
      table.bigInteger('email_campaign_id').unsigned().notNullable().references('id').inTable('email_campaigns').onDelete('CASCADE');
      table.integer('step_order').notNullable();
      table.integer('delay_days').defaultTo(0);
      table.integer('delay_hours').defaultTo(0);
      table.bigInteger('communication_template_id').unsigned().notNullable().references('id').inTable('communication_templates');
      table.string('step_name', 100);
      
      // Indexes
      table.index(['email_campaign_id', 'step_order'], 'idx_campaign_steps_campaign_order');
    })
    
    // Update communications table to reference campaign_steps
    .raw('ALTER TABLE communications ADD CONSTRAINT fk_communications_campaign_step FOREIGN KEY (campaign_step_id) REFERENCES campaign_steps(id) ON DELETE SET NULL')
    
    // Campaign Subscriptions table
    .createTable('campaign_subscriptions', (table) => {
      table.bigIncrements('id').primary();
      table.bigInteger('email_campaign_id').unsigned().notNullable().references('id').inTable('email_campaigns').onDelete('CASCADE');
      table.bigInteger('lead_id').unsigned().references('id').inTable('leads').onDelete('CASCADE');
      table.bigInteger('contact_id').unsigned().references('id').inTable('contacts').onDelete('CASCADE');
      table.string('status', 20).notNullable();
      table.bigInteger('current_step_id').unsigned().references('id').inTable('campaign_steps').onDelete('SET NULL');
      table.timestamp('next_step_due_time');
      table.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('completed_at');
      
      // Indexes
      table.index('lead_id', 'idx_campaign_sub_lead_id');
      table.index('contact_id', 'idx_campaign_sub_contact_id');
      table.index('email_campaign_id', 'idx_campaign_sub_campaign_id');
      table.index(['status', 'next_step_due_time'], 'idx_campaign_sub_status_due_time');
      
      // Check constraint to ensure either lead_id or contact_id is not null
      table.raw('CHECK (lead_id IS NOT NULL OR contact_id IS NOT NULL)');
    })
    
    // Properties table
    .createTable('properties', (table) => {
      table.bigIncrements('id').primary();
      table.string('address_street', 255).notNullable();
      table.string('address_city', 100).notNullable();
      table.string('address_state', 50).notNullable();
      table.string('address_zip', 20).notNullable();
      table.string('address_country', 50).defaultTo('USA');
      table.string('property_type', 50);
      table.integer('bedrooms');
      table.decimal('bathrooms', 3, 1);
      table.integer('square_footage');
      table.integer('year_built');
      table.decimal('lot_size', 10, 2);
      table.string('lot_units', 10);
      table.string('mls_number', 50).unique();
      table.string('listing_status', 50);
      table.text('notes');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['address_street', 'address_city', 'address_state', 'address_zip'], 'idx_properties_address');
      table.index('mls_number', 'idx_properties_mls_number');
    })
    
    // Transaction Statuses table
    .createTable('transaction_statuses', (table) => {
      table.increments('id').primary();
      table.string('status_name', 50).notNullable().unique();
      table.integer('stage_order').notNullable();
      
      // Indexes
      table.index('status_name', 'idx_transaction_statuses_name');
      table.index('stage_order', 'idx_transaction_statuses_order');
    })
    
    // Transactions table
    .createTable('transactions', (table) => {
      table.bigIncrements('id').primary();
      table.string('transaction_name', 255);
      table.bigInteger('property_id').unsigned().notNullable().references('id').inTable('properties');
      table.string('transaction_type', 20).notNullable();
      table.integer('transaction_status_id').unsigned().notNullable().references('id').inTable('transaction_statuses');
      table.date('estimated_close_date');
      table.date('actual_close_date');
      table.decimal('price', 15, 2);
      table.decimal('commission_percentage', 5, 2);
      table.decimal('commission_amount', 15, 2);
      table.bigInteger('agent_user_id').unsigned().notNullable().references('id').inTable('users');
      table.text('notes');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index('property_id', 'idx_transactions_property_id');
      table.index('transaction_status_id', 'idx_transactions_status_id');
      table.index('agent_user_id', 'idx_transactions_agent_user_id');
      table.index(['estimated_close_date', 'actual_close_date'], 'idx_transactions_dates');
    })
    
    // Transaction Contacts junction table
    .createTable('transaction_contacts', (table) => {
      table.bigIncrements('id').primary();
      table.bigInteger('transaction_id').unsigned().notNullable().references('id').inTable('transactions').onDelete('CASCADE');
      table.bigInteger('contact_id').unsigned().notNullable().references('id').inTable('contacts');
      table.string('role', 50).notNullable();
      table.text('notes');
      
      // Indexes
      table.index(['transaction_id', 'contact_id'], 'idx_transaction_contacts_trans_contact');
      table.index('role', 'idx_transaction_contacts_role');
    })
    
    // Transaction Milestones table
    .createTable('transaction_milestones', (table) => {
      table.bigIncrements('id').primary();
      table.string('milestone_name', 100).notNullable();
      table.string('transaction_type', 20).notNullable();
      table.integer('default_order').notNullable();
      table.text('description');
      
      // Indexes
      table.index(['transaction_type', 'default_order'], 'idx_transaction_milestones_type_order');
    })
    
    // Transaction Checklist Items table
    .createTable('transaction_checklist_items', (table) => {
      table.bigIncrements('id').primary();
      table.bigInteger('transaction_id').unsigned().notNullable().references('id').inTable('transactions').onDelete('CASCADE');
      table.bigInteger('milestone_id').unsigned().references('id').inTable('transaction_milestones');
      table.string('item_description', 255).notNullable();
      table.date('due_date');
      table.timestamp('completed_date');
      table.boolean('is_completed').defaultTo(false);
      table.bigInteger('assigned_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.text('notes');
      
      // Indexes
      table.index('transaction_id', 'idx_transaction_checklist_transaction_id');
      table.index('milestone_id', 'idx_transaction_checklist_milestone_id');
      table.index('due_date', 'idx_transaction_checklist_due_date');
      table.index('is_completed', 'idx_transaction_checklist_is_completed');
    })
    
    // Workflows table
    .createTable('workflows', (table) => {
      table.bigIncrements('id').primary();
      table.string('workflow_name', 150).notNullable();
      table.string('trigger_entity', 20).notNullable();
      table.text('trigger_condition').notNullable();
      table.text('description');
      table.boolean('is_active').defaultTo(true);
      table.bigInteger('created_by_user_id').unsigned().references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index('workflow_name', 'idx_workflows_name');
      table.index('trigger_entity', 'idx_workflows_trigger_entity');
    })
    
    // Workflow Steps table
    .createTable('workflow_steps', (table) => {
      table.bigIncrements('id').primary();
      table.bigInteger('workflow_id').unsigned().notNullable().references('id').inTable('workflows').onDelete('CASCADE');
      table.integer('step_order').notNullable();
      table.string('action_type', 50).notNullable();
      table.jsonb('action_details');
      table.integer('delay_days').defaultTo(0);
      table.integer('delay_hours').defaultTo(0);
      table.string('step_name', 100);
      
      // Indexes
      table.index(['workflow_id', 'step_order'], 'idx_workflow_steps_workflow_order');
    })
    
    // Tasks table
    .createTable('tasks', (table) => {
      table.bigIncrements('id').primary();
      table.string('task_title', 255).notNullable();
      table.text('description');
      table.timestamp('due_date');
      table.string('status', 20).notNullable().defaultTo('Pending');
      table.string('priority', 20).defaultTo('Normal');
      table.bigInteger('assigned_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.bigInteger('created_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('completed_at');
      table.bigInteger('related_lead_id').unsigned().references('id').inTable('leads').onDelete('CASCADE');
      table.bigInteger('related_contact_id').unsigned().references('id').inTable('contacts').onDelete('CASCADE');
      table.bigInteger('related_transaction_id').unsigned().references('id').inTable('transactions').onDelete('CASCADE');
      table.bigInteger('workflow_step_id').unsigned().references('id').inTable('workflow_steps').onDelete('SET NULL');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index('assigned_user_id', 'idx_tasks_assigned_user_id');
      table.index('status', 'idx_tasks_status');
      table.index('due_date', 'idx_tasks_due_date');
      table.index('related_lead_id', 'idx_tasks_related_lead_id');
      table.index('related_contact_id', 'idx_tasks_related_contact_id');
      table.index('related_transaction_id', 'idx_tasks_related_transaction_id');
    })
    
    // Marketing Campaigns table
    .createTable('marketing_campaigns', (table) => {
      table.bigIncrements('id').primary();
      table.string('campaign_name', 150).notNullable();
      table.text('description');
      table.date('start_date');
      table.date('end_date');
      table.string('status', 20).notNullable();
      table.decimal('budget', 10, 2);
      table.decimal('cost_to_date', 10, 2);
      table.bigInteger('created_by_user_id').unsigned().references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index('campaign_name', 'idx_marketing_campaigns_name');
      table.index('status', 'idx_marketing_campaigns_status');
      table.index(['start_date', 'end_date'], 'idx_marketing_campaigns_dates');
    })
    
    // Segments table
    .createTable('segments', (table) => {
      table.bigIncrements('id').primary();
      table.string('segment_name', 150).notNullable();
      table.text('description');
      table.jsonb('criteria_definition');
      table.string('entity_type', 20).notNullable();
      table.bigInteger('created_by_user_id').unsigned().references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index('segment_name', 'idx_segments_name');
      table.index('entity_type', 'idx_segments_entity_type');
    })
    
    // Marketing Materials table
    .createTable('marketing_materials', (table) => {
      table.bigIncrements('id').primary();
      table.string('material_name', 150).notNullable();
      table.string('material_type', 50).notNullable();
      table.string('file_path_or_url', 500).notNullable();
      table.text('description');
      table.string('tags', 255);
      table.bigInteger('uploaded_by_user_id').unsigned().references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['material_name', 'material_type'], 'idx_mkt_materials_name_type');
    })
    
    // User Devices table
    .createTable('user_devices', (table) => {
      table.bigIncrements('id').primary();
      table.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('device_type', 20).notNullable();
      table.string('device_token', 500).notNullable().unique();
      table.timestamp('last_login');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index('user_id', 'idx_user_devices_user_id');
      table.index('device_token', 'idx_user_devices_token');
    })
    
    // Notifications table
    .createTable('notifications', (table) => {
      table.bigIncrements('id').primary();
      table.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.text('message').notNullable();
      table.string('notification_type', 50).notNullable();
      table.boolean('is_read').defaultTo(false);
      table.timestamp('read_at');
      table.string('related_entity_type', 50);
      table.bigInteger('related_entity_id');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index('user_id', 'idx_notifications_user_id');
      table.index('is_read', 'idx_notifications_is_read');
      table.index(['related_entity_type', 'related_entity_id'], 'idx_notifications_related_entity');
    })
    
    // Integrations table
    .createTable('integrations', (table) => {
      table.increments('id').primary();
      table.string('service_name', 100).notNullable().unique();
      table.text('api_key');
      table.text('api_secret');
      table.text('oauth_token');
      table.text('refresh_token');
      table.timestamp('token_expiry');
      table.string('account_identifier', 255);
      table.boolean('is_enabled').defaultTo(false);
      table.timestamp('last_sync_time');
      table.string('sync_status', 50);
      table.jsonb('configuration_details');
      
      // Indexes
      table.index('service_name', 'idx_integrations_service_name');
      table.index('is_enabled', 'idx_integrations_is_enabled');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('integrations')
    .dropTableIfExists('notifications')
    .dropTableIfExists('user_devices')
    .dropTableIfExists('marketing_materials')
    .dropTableIfExists('segments')
    .dropTableIfExists('marketing_campaigns')
    .dropTableIfExists('tasks')
    .dropTableIfExists('workflow_steps')
    .dropTableIfExists('workflows')
    .dropTableIfExists('transaction_checklist_items')
    .dropTableIfExists('transaction_milestones')
    .dropTableIfExists('transaction_contacts')
    .dropTableIfExists('transactions')
    .dropTableIfExists('transaction_statuses')
    .dropTableIfExists('properties')
    .dropTableIfExists('campaign_subscriptions')
    .raw('ALTER TABLE communications DROP CONSTRAINT IF EXISTS fk_communications_campaign_step')
    .dropTableIfExists('campaign_steps')
    .dropTableIfExists('email_campaigns')
    .dropTableIfExists('communications')
    .dropTableIfExists('communication_templates')
    .dropTableIfExists('lead_tags')
    .dropTableIfExists('leads')
    .dropTableIfExists('pipeline_statuses')
    .dropTableIfExists('lead_sources')
    .dropTableIfExists('contact_tags')
    .dropTableIfExists('contacts')
    .dropTableIfExists('tags')
    .dropTableIfExists('users')
    .dropTableIfExists('roles');
};
