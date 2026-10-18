/**
 * Migration mở rộng bảng gallery_items và tributes cho đa phương tiện (Ảnh, Video, Âm thanh / Tin nhắn thoại)
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Mở rộng ràng buộc loại media trong gallery_items
  await knex.raw('ALTER TABLE gallery_items DROP CONSTRAINT IF EXISTS gallery_media_type_check;');
  await knex.raw(`
    ALTER TABLE gallery_items ADD CONSTRAINT gallery_media_type_check 
    CHECK (media_type IN ('IMAGE', 'DRAWING', 'VIDEO', 'AUDIO', 'DOCUMENT'));
  `);

  await knex.schema.alterTable('gallery_items', (table) => {
    table.string('media_source', 20).defaultTo('UPLOAD'); // UPLOAD hoặc EXTERNAL_URL (YouTube/Vimeo)
    table.integer('duration_seconds').nullable();
    table.string('thumbnail_url', 500).nullable();
    table.boolean('is_featured').defaultTo(false);
  });

  // 2. Mở rộng tributes hỗ trợ tin nhắn thoại / voice messages
  await knex.schema.alterTable('tributes', (table) => {
    table.string('audio_url', 500).nullable();
    table.integer('duration_seconds').nullable();
  });
};

/**
 * Rollback hạ cấp CSDL
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('tributes', (table) => {
    table.dropColumns('audio_url', 'duration_seconds');
  });

  await knex.schema.alterTable('gallery_items', (table) => {
    table.dropColumns('media_source', 'duration_seconds', 'thumbnail_url', 'is_featured');
  });

  await knex.raw('ALTER TABLE gallery_items DROP CONSTRAINT IF EXISTS gallery_media_type_check;');
  await knex.raw(`
    ALTER TABLE gallery_items ADD CONSTRAINT gallery_media_type_check 
    CHECK (media_type IN ('IMAGE', 'DRAWING', 'DOCUMENT'));
  `);
};
