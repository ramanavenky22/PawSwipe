const fs = require('fs');
const path = require('path');
const { getDb, initSchema, closeDb } = require('./db');
const { loadPetsJson, validateLocalPetImages, PETS_JSON } = require('./lib/validateLocalImages');
const { interleaveCatalog } = require('./lib/interleaveCatalog');

const projectRoot = path.join(__dirname, '..');

async function seed() {
  const raw = loadPetsJson();
  const pets = interleaveCatalog(raw);

  fs.writeFileSync(PETS_JSON, JSON.stringify(pets, null, 2));

  const failures = validateLocalPetImages(pets, projectRoot);
  if (failures.length > 0) {
    console.error(`\nSeed failed: ${failures.length} missing or invalid image(s):\n`);
    failures.slice(0, 10).forEach((f) => {
      console.error(`  ${f.id} [${f.species}]: ${f.reason}`);
    });
    if (failures.length > 10) console.error(`  …and ${failures.length - 10} more`);
    console.error('\nFix images under client/public/pet-images/ or run npm run add-pets');
    process.exit(1);
  }

  const dogs = pets.filter((p) => p.species === 'Dog').length;
  const cats = pets.filter((p) => p.species === 'Cat').length;
  console.log(`Seeding ${pets.length} pets (${dogs} dogs, ${cats} cats)…`);

  initSchema();
  const db = getDb();

  const insertItem = db.prepare(`
    INSERT INTO items (id, name, species, description, image_url)
    VALUES (@id, @name, @species, @description, @imageUrl)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      species = excluded.species,
      description = excluded.description,
      image_url = excluded.image_url
  `);

  const seedMany = db.transaction((rows) => {
    for (const pet of rows) {
      insertItem.run(pet);
    }
  });

  seedMany(pets);

  console.log(`Done. ${pets.length} items in SQLite (votes unchanged).`);
  closeDb();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message || err);
  process.exit(1);
});
