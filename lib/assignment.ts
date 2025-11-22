interface Player {
  name: string;
  exclusions: string[]; // Names of players they cannot give to
}

interface Assignment {
  giver: string;
  receiver: string;
}

/**
 * Creates Secret Santa assignments ensuring no one gives to themselves
 * or to anyone in their exclusion list.
 * 
 * @param players - Array of players with their exclusions
 * @returns Array of assignments or null if no valid configuration exists
 */
function createSecretSantaAssignments(players: Player[]): Assignment[] | null {
  const n = players.length;
  
  // Validate input
  if (n < 2) {
    return null; // Need at least 2 players
  }
  
  // Build adjacency list - who can give to whom
  const canGiveTo = new Map<string, Set<string>>();
  
  for (const player of players) {
    const validReceivers = new Set<string>();
    
    for (const otherPlayer of players) {
      // Can't give to self or anyone in exclusion list
      if (player.name !== otherPlayer.name && 
          !player.exclusions.includes(otherPlayer.name)) {
        validReceivers.add(otherPlayer.name);
      }
    }
    
    canGiveTo.set(player.name, validReceivers);
  }
  
  // Check if configuration is even possible using maximum matching
  // Each player must be able to give to at least one person
  // Each player must be able to receive from at least one person
  for (const player of players) {
    if (canGiveTo.get(player.name)!.size === 0) {
      return null; // This player has no valid receivers
    }
    
    // Check if this player can be a receiver from anyone
    let canReceive = false;
    for (const otherPlayer of players) {
      if (otherPlayer.name !== player.name && 
          canGiveTo.get(otherPlayer.name)!.has(player.name)) {
        canReceive = true;
        break;
      }
    }
    if (!canReceive) {
      return null; // No one can give to this player
    }
  }
  
  // Try to find a valid assignment using backtracking
  const assignments: Assignment[] = [];
  const receivers = new Set<string>();
  
  function backtrack(giverIndex: number): boolean {
    if (giverIndex === n) {
      // All players have been assigned
      return true;
    }
    
    const giver = players[giverIndex];
    const possibleReceivers = Array.from(canGiveTo.get(giver.name)!);
    
    // Shuffle to randomize assignments
    shuffle(possibleReceivers);
    
    for (const receiver of possibleReceivers) {
      if (!receivers.has(receiver)) {
        // Try this assignment
        assignments.push({ giver: giver.name, receiver });
        receivers.add(receiver);
        
        if (backtrack(giverIndex + 1)) {
          return true;
        }
        
        // Backtrack
        assignments.pop();
        receivers.delete(receiver);
      }
    }
    
    return false;
  }
  
  const success = backtrack(0);
  return success ? assignments : null;
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Validates that an assignment is valid
 */
function validateAssignments(players: Player[], assignments: Assignment[]): boolean {
  if (assignments.length !== players.length) {
    return false;
  }
  
  const receivers = new Set<string>();
  const givers = new Set<string>();
  
  for (const assignment of assignments) {
    const giver = players.find(p => p.name === assignment.giver);
    
    if (!giver) {
      return false;
    }
    
    // Check no self-assignment
    if (assignment.giver === assignment.receiver) {
      return false;
    }
    
    // Check exclusions are respected
    if (giver.exclusions.includes(assignment.receiver)) {
      return false;
    }
    
    // Check no duplicate givers or receivers
    if (givers.has(assignment.giver) || receivers.has(assignment.receiver)) {
      return false;
    }
    
    givers.add(assignment.giver);
    receivers.add(assignment.receiver);
  }
  
  // Ensure everyone gives and receives exactly once
  return givers.size === players.length && receivers.size === players.length;
}

export type { Player, Assignment };
export { createSecretSantaAssignments, validateAssignments };