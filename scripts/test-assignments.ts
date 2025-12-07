import { createSecretSantaAssignments, validateAssignments, type Player } from '../lib/assignment';

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function testValidDraw() {
  const players: Player[] = [
    { name: '1', exclusions: [] },
    { name: '2', exclusions: [] },
    { name: '3', exclusions: [] },
  ];

  const assignments = createSecretSantaAssignments(players);
  expect(assignments !== null, 'Expected a valid assignment set for simple players');
  expect(validateAssignments(players, assignments!), 'Generated assignments should validate');
}

function testImpossibleBecauseOfExclusions() {
  const players: Player[] = [
    { name: '1', exclusions: ['2'] },
    { name: '2', exclusions: ['1'] },
  ];

  const assignments = createSecretSantaAssignments(players);
  expect(assignments === null, 'Mutual exclusions should make draw impossible');
}

function testValidateRejectsSelfOrExclusions() {
  const players: Player[] = [
    { name: '1', exclusions: ['2'] },
    { name: '2', exclusions: [] },
    { name: '3', exclusions: [] },
  ];

  const badAssignments = [
    { giver: '1', receiver: '1' }, // self-gift
    { giver: '2', receiver: '2' },
    { giver: '3', receiver: '3' },
  ];

  expect(!validateAssignments(players, badAssignments), 'Self-assignments should fail validation');

  const exclusionViolation = [
    { giver: '1', receiver: '2' }, // violates exclusion
    { giver: '2', receiver: '3' },
    { giver: '3', receiver: '1' },
  ];

  expect(!validateAssignments(players, exclusionViolation), 'Exclusion violations should fail validation');
}

function testValidateRejectsDuplicateReceivers() {
  const players: Player[] = [
    { name: '1', exclusions: [] },
    { name: '2', exclusions: [] },
    { name: '3', exclusions: [] },
  ];

  const duplicateReceiver = [
    { giver: '1', receiver: '2' },
    { giver: '2', receiver: '2' }, // duplicate receiver
    { giver: '3', receiver: '1' },
  ];

  expect(!validateAssignments(players, duplicateReceiver), 'Duplicate receivers should fail validation');
}

async function run() {
  testValidDraw();
  testImpossibleBecauseOfExclusions();
  testValidateRejectsSelfOrExclusions();
  testValidateRejectsDuplicateReceivers();
  console.log('Assignment tests passed');
}

run().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
