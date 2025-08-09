const bcrypt = require('bcrypt');

/**
 * Initial seed data for the database
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  await knex('roles').del();
  await knex('tags').del();
  await knex('lead_sources').del();
  await knex('pipeline_statuses').del();
  await knex('transaction_statuses').del();
  await knex('transaction_milestones').del();
  
  // Seed roles
  await knex('roles').insert([
    { id: 1, role_name: 'Admin', description: 'System administrator with full access' },
    { id: 2, role_name: 'Agent', description: 'Real estate agent with standard access' },
    { id: 3, role_name: 'Assistant', description: 'Assistant with limited access' },
    { id: 4, role_name: 'Manager', description: 'Manager with elevated access' }
  ]);
  
  // Seed admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  await knex('users').insert([
    {
      id: 1,
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@example.com',
      phone_number: '555-123-4567',
      password_hash: passwordHash,
      role_id: 1,
      is_active: true,
      license_number: 'ADMIN001'
    }
  ]);
  
  // Seed tags
  await knex('tags').insert([
    { id: 1, tag_name: 'Buyer', tag_color: '#4CAF50' },
    { id: 2, tag_name: 'Seller', tag_color: '#2196F3' },
    { id: 3, tag_name: 'Investor', tag_color: '#FFC107' },
    { id: 4, tag_name: 'Past Client', tag_color: '#9C27B0' },
    { id: 5, tag_name: 'Hot Lead', tag_color: '#F44336' },
    { id: 6, tag_name: 'Cold Lead', tag_color: '#607D8B' },
    { id: 7, tag_name: 'VIP', tag_color: '#E91E63' }
  ]);
  
  // Seed lead sources
  await knex('lead_sources').insert([
    { id: 1, source_name: 'Website Form', source_type: 'Online' },
    { id: 2, source_name: 'Zillow', source_type: 'Online' },
    { id: 3, source_name: 'Realtor.com', source_type: 'Online' },
    { id: 4, source_name: 'Referral', source_type: 'Referral' },
    { id: 5, source_name: 'Open House', source_type: 'Offline' },
    { id: 6, source_name: 'Social Media', source_type: 'Online' },
    { id: 7, source_name: 'Direct Mail', source_type: 'Offline' },
    { id: 8, source_name: 'Cold Call', source_type: 'Offline' }
  ]);
  
  // Seed pipeline statuses
  await knex('pipeline_statuses').insert([
    { id: 1, status_name: 'New Lead', stage_order: 1, status_category: 'New' },
    { id: 2, status_name: 'Contacted', stage_order: 2, status_category: 'Working' },
    { id: 3, status_name: 'Qualified', stage_order: 3, status_category: 'Working' },
    { id: 4, status_name: 'Appointment Set', stage_order: 4, status_category: 'Working' },
    { id: 5, status_name: 'Proposal Made', stage_order: 5, status_category: 'Working' },
    { id: 6, status_name: 'Negotiating', stage_order: 6, status_category: 'Working' },
    { id: 7, status_name: 'Converted', stage_order: 7, status_category: 'Won' },
    { id: 8, status_name: 'Lost', stage_order: 8, status_category: 'Lost' },
    { id: 9, status_name: 'Nurturing', stage_order: 9, status_category: 'Nurturing' }
  ]);
  
  // Seed transaction statuses
  await knex('transaction_statuses').insert([
    { id: 1, status_name: 'Prospecting', stage_order: 1 },
    { id: 2, status_name: 'Showing', stage_order: 2 },
    { id: 3, status_name: 'Offer Made', stage_order: 3 },
    { id: 4, status_name: 'Under Contract', stage_order: 4 },
    { id: 5, status_name: 'Inspection', stage_order: 5 },
    { id: 6, status_name: 'Appraisal', stage_order: 6 },
    { id: 7, status_name: 'Financing', stage_order: 7 },
    { id: 8, status_name: 'Closing', stage_order: 8 },
    { id: 9, status_name: 'Funded', stage_order: 9 },
    { id: 10, status_name: 'Completed', stage_order: 10 },
    { id: 11, status_name: 'Cancelled', stage_order: 11 }
  ]);
  
  // Seed transaction milestones
  await knex('transaction_milestones').insert([
    // Buy transaction milestones
    { id: 1, milestone_name: 'Initial Consultation', transaction_type: 'Buy', default_order: 1, description: 'Initial meeting with buyer to discuss needs and preferences' },
    { id: 2, milestone_name: 'Pre-Approval', transaction_type: 'Buy', default_order: 2, description: 'Buyer obtains pre-approval from lender' },
    { id: 3, milestone_name: 'Property Search', transaction_type: 'Buy', default_order: 3, description: 'Showing properties to buyer' },
    { id: 4, milestone_name: 'Offer Submission', transaction_type: 'Buy', default_order: 4, description: 'Prepare and submit offer' },
    { id: 5, milestone_name: 'Contract Acceptance', transaction_type: 'Buy', default_order: 5, description: 'Offer accepted and contract signed' },
    { id: 6, milestone_name: 'Earnest Money Deposit', transaction_type: 'Buy', default_order: 6, description: 'Buyer submits earnest money deposit' },
    { id: 7, milestone_name: 'Inspections', transaction_type: 'Buy', default_order: 7, description: 'Property inspections conducted' },
    { id: 8, milestone_name: 'Appraisal', transaction_type: 'Buy', default_order: 8, description: 'Lender orders appraisal' },
    { id: 9, milestone_name: 'Loan Approval', transaction_type: 'Buy', default_order: 9, description: 'Buyer receives final loan approval' },
    { id: 10, milestone_name: 'Closing', transaction_type: 'Buy', default_order: 10, description: 'Final paperwork signed and funds transferred' },
    
    // Sell transaction milestones
    { id: 11, milestone_name: 'Listing Agreement', transaction_type: 'Sell', default_order: 1, description: 'Listing agreement signed with seller' },
    { id: 12, milestone_name: 'Property Preparation', transaction_type: 'Sell', default_order: 2, description: 'Prepare property for market (staging, photos, etc.)' },
    { id: 13, milestone_name: 'Market Launch', transaction_type: 'Sell', default_order: 3, description: 'Property listed on MLS and marketing begins' },
    { id: 14, milestone_name: 'Showings', transaction_type: 'Sell', default_order: 4, description: 'Property shown to potential buyers' },
    { id: 15, milestone_name: 'Offer Review', transaction_type: 'Sell', default_order: 5, description: 'Review and negotiate offers' },
    { id: 16, milestone_name: 'Contract Acceptance', transaction_type: 'Sell', default_order: 6, description: 'Offer accepted and contract signed' },
    { id: 17, milestone_name: 'Inspections', transaction_type: 'Sell', default_order: 7, description: 'Buyer conducts inspections' },
    { id: 18, milestone_name: 'Appraisal', transaction_type: 'Sell', default_order: 8, description: 'Lender orders appraisal' },
    { id: 19, milestone_name: 'Contingency Removal', transaction_type: 'Sell', default_order: 9, description: 'Buyer removes contingencies' },
    { id: 20, milestone_name: 'Closing', transaction_type: 'Sell', default_order: 10, description: 'Final paperwork signed and funds transferred' }
  ]);
};
