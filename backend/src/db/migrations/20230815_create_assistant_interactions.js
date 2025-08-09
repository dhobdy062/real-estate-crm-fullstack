exports.up = function(knex) {
  return knex.schema.createTable('assistant_interactions', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users');
    table.text('message').notNullable();
    table.text('response').nullable();
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    table.index('user_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('assistant_interactions');
};