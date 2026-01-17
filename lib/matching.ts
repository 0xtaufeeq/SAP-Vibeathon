
/**
 * Calculates the cosine similarity between two sets of tags/interests.
 * Returns a value between 0 and 1.
 */
export function calculateCosineSimilarity(tags1: string[], tags2: string[]): number {
  if (tags1.length === 0 || tags2.length === 0) return 0;

  const set1 = new Set(tags1.map(t => t.toLowerCase()));
  const set2 = new Set(tags2.map(t => t.toLowerCase()));

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  
  // Similarity = shared / sqrt(size1 * size2)
  const score = intersection.size / Math.sqrt(set1.size * set2.size);
  
  return score;
}

/**
 * Calculates a matching percentage (0-100) based on shared interests.
 * Includes a base score and boosts for common tags.
 * Minimum score of 10% is guaranteed for visibility.
 */
export function calculateMatchScore(userInterests: string[], participantInterests: string[]): number {
  const similarity = calculateCosineSimilarity(userInterests, participantInterests);
  
  // Start with a base confidence rating of 10% as requested
  let score = 10 + (similarity * 90);
  
  // If they have at least one shared interest, we give a significant boost
  if (similarity > 0) {
    score = Math.max(score, 25 + (similarity * 75));
  }
  
  // Round to integer and cap at 99
  return Math.min(Math.round(score), 99);
}
