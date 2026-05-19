/**
 * Merge new pets from server/data/add-pets.json into server/data/pets.json.
 * No app code changes needed — edit add-pets.json, drop images in client/public/pet-images/, then npm run add-pets && npm run seed
 *
 * add-pets.json entry shape:
 * {
 *   "name": "Spot",
 *   "species": "Dog",
 *   "description": "Friendly and calm.",
 *   "imageFile": "pet-121.jpg"
 * }
 */
const fs = require('fs');
const path = require('path');

const { interleaveCatalog } = require('../server/lib/interleaveCatalog');

const ROOT = path.join(__dirname, '..');
const PETS_JSON = path.join(ROOT, 'server', 'data', 'pets.json');
const ADD_JSON = path.join(ROOT, 'server', 'data', 'add-pets.json');
const IMAGE_DIR = path.join(ROOT, 'client', 'public', 'pet-images');

function nextPetId(existing) {
  let max = 0;
  for (const pet of existing) {
    const n = parseInt(String(pet.id).replace(/\D/g, ''), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `pet-${String(max + 1).padStart(3, '0')}`;
}

function main() {
  if (!fs.existsSync(PETS_JSON)) {
    console.error('Missing', PETS_JSON);
    process.exit(1);
  }

  const pets = JSON.parse(fs.readFileSync(PETS_JSON, 'utf8'));
  const additions = fs.existsSync(ADD_JSON)
    ? JSON.parse(fs.readFileSync(ADD_JSON, 'utf8'))
  : [];

  if (!Array.isArray(additions) || additions.length === 0) {
    console.log('No entries in add-pets.json — nothing to add.');
    return;
  }

  const ids = new Set(pets.map((p) => p.id));
  let added = 0;

  for (const entry of additions) {
    const { name, species, description, imageFile } = entry;
    if (!name || !species || !description || !imageFile) {
      console.error('Each entry needs name, species, description, imageFile:', entry);
      process.exit(1);
    }

    const imagePath = path.join(IMAGE_DIR, imageFile);
    if (!fs.existsSync(imagePath)) {
      console.error('Image not found:', imagePath);
      console.error('Copy the file to client/public/pet-images/ first.');
      process.exit(1);
    }

    const id = entry.id && !ids.has(entry.id) ? entry.id : nextPetId(pets);
    if (ids.has(id)) {
      console.warn(`Skipping duplicate id ${id}`);
      continue;
    }

    pets.push({
      id,
      name,
      species,
      description,
      imageUrl: `/pet-images/${imageFile}`,
    });
    ids.add(id);
    added += 1;
  }

  const interleaved = interleaveCatalog(pets);
  fs.writeFileSync(PETS_JSON, JSON.stringify(interleaved, null, 2));
  fs.writeFileSync(ADD_JSON, '[]\n');

  console.log(`Added ${added} pet(s). Total: ${interleaved.length} (dog/cat interleaved). Cleared add-pets.json.`);
  console.log('Run: npm run seed');
}

main();
