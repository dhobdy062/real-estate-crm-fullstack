const yup = require('yup');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Validate request data against a Yup schema
 * @param {Object} schema - Yup schema
 * @param {string} source - Request source ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const data = req[source];
      await schema.validate(data, { abortEarly: false });
      next();
    } catch (error) {
      const errors = error.inner.reduce((acc, err) => {
        acc[err.path] = err.message;
        return acc;
      }, {});
      
      next(new ApiError(400, 'Validation error', true, null, { errors }));
    }
  };
};

// Common validation schemas
const schemas = {
  // User schemas
  userCreate: yup.object({
    first_name: yup.string().required('First name is required').max(100),
    last_name: yup.string().required('Last name is required').max(100),
    email: yup.string().email('Invalid email').required('Email is required').max(255),
    phone_number: yup.string().max(30),
    password: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters'),
    role_id: yup.number().required('Role ID is required').positive().integer(),
    license_number: yup.string().max(100),
  }),
  
  userUpdate: yup.object({
    first_name: yup.string().max(100),
    last_name: yup.string().max(100),
    email: yup.string().email('Invalid email').max(255),
    phone_number: yup.string().max(30),
    role_id: yup.number().positive().integer(),
    is_active: yup.boolean(),
    license_number: yup.string().max(100),
  }),
  
  login: yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().required('Password is required'),
  }),
  
  // Contact schemas
  contactCreate: yup.object({
    first_name: yup.string().max(100),
    last_name: yup.string().max(100),
    email: yup.string().email('Invalid email').max(255),
    phone_primary: yup.string().max(30),
    phone_secondary: yup.string().max(30),
    address_street: yup.string().max(255),
    address_city: yup.string().max(100),
    address_state: yup.string().max(50),
    address_zip: yup.string().max(20),
    address_country: yup.string().max(50),
    preferred_contact_method: yup.string().max(50),
    relationship_notes: yup.string(),
    owner_user_id: yup.number().positive().integer(),
    tags: yup.array().of(yup.number().positive().integer()),
  }),
  
  contactUpdate: yup.object({
    first_name: yup.string().max(100),
    last_name: yup.string().max(100),
    email: yup.string().email('Invalid email').max(255),
    phone_primary: yup.string().max(30),
    phone_secondary: yup.string().max(30),
    address_street: yup.string().max(255),
    address_city: yup.string().max(100),
    address_state: yup.string().max(50),
    address_zip: yup.string().max(20),
    address_country: yup.string().max(50),
    preferred_contact_method: yup.string().max(50),
    relationship_notes: yup.string(),
    owner_user_id: yup.number().positive().integer(),
    tags: yup.array().of(yup.number().positive().integer()),
  }),
  
  // Lead schemas
  leadCreate: yup.object({
    first_name: yup.string().max(100),
    last_name: yup.string().max(100),
    email: yup.string().email('Invalid email').max(255),
    phone_number: yup.string().max(30),
    lead_source_id: yup.number().positive().integer(),
    pipeline_status_id: yup.number().positive().integer(),
    inquiry_details: yup.string(),
    lead_score: yup.number().integer(),
    assigned_user_id: yup.number().positive().integer(),
    external_lead_id: yup.string().max(100),
    tags: yup.array().of(yup.number().positive().integer()),
  }),
  
  leadUpdate: yup.object({
    first_name: yup.string().max(100),
    last_name: yup.string().max(100),
    email: yup.string().email('Invalid email').max(255),
    phone_number: yup.string().max(30),
    lead_source_id: yup.number().positive().integer(),
    pipeline_status_id: yup.number().positive().integer(),
    inquiry_details: yup.string(),
    lead_score: yup.number().integer(),
    assigned_user_id: yup.number().positive().integer(),
    external_lead_id: yup.string().max(100),
    tags: yup.array().of(yup.number().positive().integer()),
  }),
  
  leadConvert: yup.object({
    contact_id: yup.number().positive().integer(),
  }),
  
  // Property schemas
  propertyCreate: yup.object({
    address_street: yup.string().required('Street address is required').max(255),
    address_city: yup.string().required('City is required').max(100),
    address_state: yup.string().required('State is required').max(50),
    address_zip: yup.string().required('ZIP code is required').max(20),
    address_country: yup.string().max(50),
    property_type: yup.string().max(50),
    bedrooms: yup.number().integer(),
    bathrooms: yup.number(),
    square_footage: yup.number().integer(),
    year_built: yup.number().integer(),
    lot_size: yup.number(),
    lot_units: yup.string().max(10),
    mls_number: yup.string().max(50),
    listing_status: yup.string().max(50),
    notes: yup.string(),
  }),
  
  propertyUpdate: yup.object({
    address_street: yup.string().max(255),
    address_city: yup.string().max(100),
    address_state: yup.string().max(50),
    address_zip: yup.string().max(20),
    address_country: yup.string().max(50),
    property_type: yup.string().max(50),
    bedrooms: yup.number().integer(),
    bathrooms: yup.number(),
    square_footage: yup.number().integer(),
    year_built: yup.number().integer(),
    lot_size: yup.number(),
    lot_units: yup.string().max(10),
    mls_number: yup.string().max(50),
    listing_status: yup.string().max(50),
    notes: yup.string(),
  }),
  
  // Transaction schemas
  transactionCreate: yup.object({
    transaction_name: yup.string().max(255),
    property_id: yup.number().required('Property ID is required').positive().integer(),
    transaction_type: yup.string().required('Transaction type is required').max(20),
    transaction_status_id: yup.number().required('Transaction status ID is required').positive().integer(),
    estimated_close_date: yup.date(),
    actual_close_date: yup.date(),
    price: yup.number(),
    commission_percentage: yup.number(),
    commission_amount: yup.number(),
    agent_user_id: yup.number().required('Agent user ID is required').positive().integer(),
    notes: yup.string(),
    contacts: yup.array().of(
      yup.object({
        contact_id: yup.number().required('Contact ID is required').positive().integer(),
        role: yup.string().required('Contact role is required').max(50),
        notes: yup.string(),
      })
    ),
  }),
  
  transactionUpdate: yup.object({
    transaction_name: yup.string().max(255),
    property_id: yup.number().positive().integer(),
    transaction_type: yup.string().max(20),
    transaction_status_id: yup.number().positive().integer(),
    estimated_close_date: yup.date(),
    actual_close_date: yup.date(),
    price: yup.number(),
    commission_percentage: yup.number(),
    commission_amount: yup.number(),
    agent_user_id: yup.number().positive().integer(),
    notes: yup.string(),
  }),
  
  // Communication schemas
  communicationCreate: yup.object({
    communication_type: yup.string().required('Communication type is required').max(20),
    direction: yup.string().required('Direction is required').max(20),
    status: yup.string().required('Status is required').max(20),
    subject: yup.string().max(255),
    message_content: yup.string(),
    lead_id: yup.number().positive().integer(),
    contact_id: yup.number().positive().integer(),
    template_id: yup.number().positive().integer(),
    external_message_id: yup.string().max(100),
    scheduled_time: yup.date(),
  }).test(
    'lead-or-contact',
    'Either lead_id or contact_id is required',
    (value) => value.lead_id || value.contact_id
  ),
  
  communicationUpdate: yup.object({
    status: yup.string().max(20),
    subject: yup.string().max(255),
    message_content: yup.string(),
    scheduled_time: yup.date(),
  }),
  
  // Task schemas
  taskCreate: yup.object({
    task_title: yup.string().required('Task title is required').max(255),
    description: yup.string(),
    due_date: yup.date(),
    status: yup.string().max(20),
    priority: yup.string().max(20),
    assigned_user_id: yup.number().positive().integer(),
    related_lead_id: yup.number().positive().integer(),
    related_contact_id: yup.number().positive().integer(),
    related_transaction_id: yup.number().positive().integer(),
  }),
  
  taskUpdate: yup.object({
    task_title: yup.string().max(255),
    description: yup.string(),
    due_date: yup.date(),
    status: yup.string().max(20),
    priority: yup.string().max(20),
    assigned_user_id: yup.number().positive().integer(),
    completed_at: yup.date(),
  }),
  
  // Pagination and filtering
  pagination: yup.object({
    page: yup.number().integer().min(1).default(1),
    limit: yup.number().integer().min(1).max(100).default(20),
    sort_by: yup.string(),
    sort_dir: yup.string().oneOf(['asc', 'desc']),
    search: yup.string(),
  }),
};

module.exports = {
  validate,
  schemas,
};
