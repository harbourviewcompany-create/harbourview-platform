#!/usr/bin/env node
const APP_ROLES = ['admin', 'operator', 'analyst', 'viewer'];
const ADMIN_ALLOWED_ROLES = ['admin', 'operator'];

function isAdminAllowedRole(role) {
  return ADMIN_ALLOWED_ROLES.includes(role);
}

function hasAdminRole(roles) {
  if (!roles?.length) return false;
  return roles.some((role) => isAdminAllowedRole(role));
}

const cases = [
  ['anonymous', null, false],
  ['missing role', [], false],
  ['viewer', ['viewer'], false],
  ['analyst', ['analyst'], false],
  ['operator', ['operator'], true],
  ['admin', ['admin'], true],
  ['mixed denied roles', ['viewer', 'analyst'], false],
  ['mixed allowed role', ['viewer', 'operator'], true],
];

const failures = [];

for (const role of ['admin', 'operator', 'analyst', 'viewer']) {
  if (!APP_ROLES.includes(role)) failures.push(`role enum missing ${role}`);
}

for (const [label, roles, expected] of cases) {
  const actual = hasAdminRole(roles);
  if (actual !== expected) failures.push(`${label}: expected ${expected}, got ${actual}`);
}

if (failures.length) {
  console.error('Admin role logic test failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ok anonymous denied');
console.log('ok missing-role denied');
console.log('ok viewer denied');
console.log('ok analyst denied');
console.log('ok operator allowed');
console.log('ok admin allowed');
