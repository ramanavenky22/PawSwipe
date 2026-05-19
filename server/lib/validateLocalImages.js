const fs = require('fs');
const path = require('path');

const PETS_JSON = path.join(__dirname, '..', 'data', 'pets.json');

function resolvePublicPath(imageUrl, projectRoot) {
  if (!imageUrl || !imageUrl.startsWith('/')) {
    return null;
  }
  return path.join(projectRoot, 'client', 'public', imageUrl);
}

function validateLocalPetImages(pets, projectRoot) {
  const failures = [];

  for (const pet of pets) {
    if (!pet.imageUrl?.trim()) {
      failures.push({ id: pet.id, species: pet.species, imageUrl: pet.imageUrl, reason: 'empty imageUrl' });
      continue;
    }

    if (pet.imageUrl.startsWith('http://') || pet.imageUrl.startsWith('https://')) {
      failures.push({
        id: pet.id,
        species: pet.species,
        imageUrl: pet.imageUrl,
        reason: 'external URL not allowed',
      });
      continue;
    }

    const filePath = resolvePublicPath(pet.imageUrl, projectRoot);
    if (!filePath) {
      failures.push({
        id: pet.id,
        species: pet.species,
        imageUrl: pet.imageUrl,
        reason: 'imageUrl must start with /',
      });
      continue;
    }

    if (!fs.existsSync(filePath)) {
      failures.push({
        id: pet.id,
        species: pet.species,
        imageUrl: pet.imageUrl,
        reason: `file not found: ${filePath}`,
      });
    }
  }

  return failures;
}

function loadPetsJson() {
  if (!fs.existsSync(PETS_JSON)) {
    throw new Error(`Missing ${PETS_JSON}`);
  }
  const pets = JSON.parse(fs.readFileSync(PETS_JSON, 'utf8'));
  if (!Array.isArray(pets) || pets.length < 100) {
    throw new Error('pets.json must contain at least 100 items');
  }
  return pets;
}

module.exports = {
  loadPetsJson,
  validateLocalPetImages,
  resolvePublicPath,
  PETS_JSON,
};
