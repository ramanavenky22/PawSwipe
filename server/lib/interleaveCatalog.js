/**
 * Interleave dogs and cats for a stable mixed deck order (same for every session).
 * Reassigns ids pet-001… in display order; each pet keeps its imageUrl.
 */
function interleaveCatalog(pets) {
  const dogs = pets.filter((p) => p.species === 'Dog');
  const cats = pets.filter((p) => p.species === 'Cat');
  const other = pets.filter((p) => p.species !== 'Dog' && p.species !== 'Cat');

  const mixed = [];
  const pairs = Math.max(dogs.length, cats.length);

  for (let i = 0; i < pairs; i += 1) {
    if (dogs[i]) mixed.push(dogs[i]);
    if (cats[i]) mixed.push(cats[i]);
  }

  mixed.push(...other);

  return mixed.map((pet, index) => ({
    ...pet,
    id: `pet-${String(index + 1).padStart(3, '0')}`,
  }));
}

module.exports = { interleaveCatalog };
