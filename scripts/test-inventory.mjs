import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

const project = process.cwd()
const checks = []
const check = (name) => checks.push({ name, passed: true })
const hashes = await Promise.all(
  ['data/business-db.json', 'data/users.json'].map(async (path) =>
    readFile(resolve(project, path))
      .then((bytes) => createHash('sha256').update(bytes).digest('hex'))
      .catch((error) => {
        if (error.code === 'ENOENT') return null
        throw error
      }),
  ),
)
const fixture = resolve(project, '.verification', `runtime-${Date.now()}`)
await mkdir(resolve(fixture, 'data'), { recursive: true })
await writeFile(
  resolve(fixture, 'data/business-db.json'),
  JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    activeBusinessId: '',
    businesses: [],
  }),
)
await writeFile(
  resolve(fixture, 'data/users.json'),
  JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    users: [],
  }),
)
process.env.TERKASA_DATA_DIR = resolve(fixture, 'data')
process.env.USE_POSTGRES = '0'
process.env.AUTH_SECRET = 'terkasa-verification-only-secret-32-bytes'
for (const key of [
  'DATABASE_URL',
  'VERCEL',
  'AWS_LAMBDA_FUNCTION_NAME',
  'ALLOW_JWT_ONLY_SESSION',
])
  delete process.env[key]

const db = await import('../lib/server/db-file.ts')
const users = await import('../lib/server/users-file.ts')
const auth = await import('../lib/server/auth.ts')
const { normalizePlatformName } = await import('../lib/brand.ts')
const { buildFinancialReport, getReportSystemInstruction } = await import(
  '../lib/financial-report.ts'
)
const { supportSystemPrompt } = await import('../lib/support-faq.ts')
process.chdir(fixture)

assert.equal(normalizePlatformName('UMKMan'), 'TERKASA')
assert.equal(normalizePlatformName('Custom Platform'), 'Custom Platform')
check('legacy platform normalization and custom identity preservation')
const accountA = await users.registerWithPassword({
  email: 'a@terkasa.test',
  password: 'local-test-1234',
  name: 'Tester A',
})
const accountB = await users.registerWithPassword({
  email: 'b@terkasa.test',
  password: 'local-test-1234',
  name: 'Tester B',
})
assert.equal(
  (await users.loginWithPassword('a@terkasa.test', 'local-test-1234')).user.id,
  accountA.user.id,
)
await assert.rejects(
  users.loginWithPassword('a@terkasa.test', 'wrong-password'),
)
check('registration and password login, including invalid password rejection')
const a = await db.createBusiness(accountA.user.id, {
  brand: 'Kopi Pengguna A',
  owner: 'Tester A',
})
const b = await db.createBusiness(accountB.user.id, {
  brand: 'Usaha Pengguna B',
  owner: 'Tester B',
})
assert.equal(a.profile.appName, 'TERKASA')
assert.equal((await db.listBusinesses(accountA.user.id)).length, 1)
check('new business identity and account-specific business listing')
assert.equal((await db.setActiveBusiness(accountA.user.id, b.id)).id, a.id)
await db.updateProfile(accountA.user.id, { city: 'Kota Uji A' }, b.id)
assert.equal(
  (await db.getSnapshot(b.id, accountB.user.id)).profile.brand,
  'Usaha Pengguna B',
)
assert.notEqual(
  (await db.getSnapshot(b.id, accountB.user.id)).profile.city,
  'Kota Uji A',
)
check(
  'foreign business IDs stay within the current account; legacy fallback preserved',
)
let file = JSON.parse(
  await readFile(resolve(fixture, 'data/business-db.json'), 'utf8'),
)
file.businesses.find((x) => x.id === a.id).profile.appName = 'UMKMan'
await writeFile(resolve(fixture, 'data/business-db.json'), JSON.stringify(file))
let snap = await db.getSnapshot(a.id, accountA.user.id)
assert.equal(snap.profile.appName, 'TERKASA')
assert.equal(snap.profile.brand, 'Kopi Pengguna A')
check('recovered profile uses TERKASA while keeping business name unchanged')
const product = await db.createCatalogProduct(
  accountA.user.id,
  {
    name: 'Kopi Uji',
    shortName: 'Kopi',
    variant: '250g',
    image: '/placeholder.svg',
    unitPrice: 25000,
    description: 'Test',
    stock: 10,
    lowStockAt: 2,
    sku: 'TEST-001',
    keywords: ['kopi'],
  },
  a.id,
)
const sale = await db.createTransaction(accountA.user.id, {
  businessId: a.id,
  productId: product.id,
  qty: 2,
})
assert.equal(sale.transaction.total, 50000)
assert.equal(sale.catalog[0].stock, 8)
assert.equal(sale.catalog[0].sold, 2)
check('catalog creation, sale total, stock reduction and sold counter')
const pending = await db.createTransaction(accountA.user.id, {
  businessId: a.id,
  productId: product.id,
  qty: 3,
  status: 'Perlu Verifikasi',
})
assert.equal(pending.catalog[0].stock, 8)
const verified = await db.updateTransactionStatus(
  accountA.user.id,
  pending.transaction.id,
  'Tersimpan',
  a.id,
)
assert.equal(verified.catalog[0].stock, 5)
assert.equal(
  (
    await db.updateTransactionStatus(
      accountA.user.id,
      pending.transaction.id,
      'Tersimpan',
      a.id,
    )
  ).catalog[0].stock,
  5,
)
check('pending transactions defer stock changes; verification is idempotent')
const cancelled = await db.updateTransactionStatus(
  accountA.user.id,
  pending.transaction.id,
  'Dibatalkan',
  a.id,
)
assert.equal(cancelled.catalog[0].stock, 8)
assert.equal(cancelled.catalog[0].sold, 2)
check('cancellation restores stock and sold counter')
await assert.rejects(
  db.createTransaction(accountA.user.id, {
    businessId: a.id,
    productId: product.id,
    qty: 999,
  }),
)
await assert.rejects(
  db.createTransaction(accountB.user.id, {
    businessId: a.id,
    productId: product.id,
    qty: 1,
  }),
)
check('insufficient stock and cross-account transactions denied')
snap = await db.getSnapshot(a.id, accountA.user.id)
const report = buildFinancialReport({
  businessId: a.id,
  profile: snap.profile,
  catalog: snap.catalog,
  transactions: snap.transactions,
  period: 'all',
})
assert.equal(report.summary.omzet, 50000)
assert.equal(report.summary.modalHpp, 32500)
assert.equal(report.summary.labaKotor, 17500)
assert.ok(getReportSystemInstruction(report).includes('TERKASA'))
assert.ok(supportSystemPrompt().includes('TERKASA'))
check(
  'financial report retains revenue, estimated cost, profit and TERKASA identity',
)
const { inventorySummary, normalizeLivestock } = await import(
  '../lib/livestock.ts'
)
const createAnimal = (name, species, stock, unitPrice) =>
  db.createCatalogProduct(
    accountA.user.id,
    {
      name,
      shortName: name,
      variant: species,
      image: '/placeholder.svg',
      unitPrice,
      description: '',
      stock,
      lowStockAt: 2,
      sku: `TEST-${species}`,
      keywords: [species],
      livestock: {
        species,
        breed: species === 'sapi' ? 'Limousin' : '',
        pen: 'Kandang A',
      },
    },
    a.id,
  )
const cow = await createAnimal('Sapi Limousin', 'sapi', 12, 25000000)
await createAnimal('Domba Garut', 'domba', 18, 3500000)
await createAnimal('Kambing Etawa', 'kambing', 35, 3000000)
let animals = inventorySummary(
  (await db.getSnapshot(a.id, accountA.user.id)).catalog,
)
assert.equal(animals.total, 65)
assert.equal(animals.animals.length, 3)
assert.equal(animals.species.find((x) => x.id === 'sapi').stock, 12)
assert.equal(animals.value, 468000000)
check(
  'cattle, sheep and goats persist with species, pen, breed and total of 65 heads',
)
await db.adjustCatalogStock(accountA.user.id, cow.id, 3, a.id)
assert.equal(
  (await db.getSnapshot(a.id, accountA.user.id)).catalog.find(
    (x) => x.id === cow.id,
  ).stock,
  15,
)
await db.adjustCatalogStock(accountA.user.id, cow.id, -2, a.id)
assert.equal(
  (await db.getSnapshot(a.id, accountA.user.id)).catalog.find(
    (x) => x.id === cow.id,
  ).stock,
  13,
)
check('livestock count can increase and decrease in heads')
await Promise.all(
  Array.from({ length: 8 }, () =>
    db.adjustCatalogStock(accountA.user.id, cow.id, 1, a.id),
  ),
)
assert.equal(
  (await db.getSnapshot(a.id, accountA.user.id)).catalog.find(
    (x) => x.id === cow.id,
  ).stock,
  21,
)
check('concurrent stock increments are not lost in the file write queue')
await assert.rejects(db.adjustCatalogStock(accountA.user.id, cow.id, -22, a.id))
await assert.rejects(db.adjustCatalogStock(accountA.user.id, cow.id, 0.5, a.id))
await assert.rejects(db.adjustCatalogStock(accountB.user.id, cow.id, 1, a.id))
await assert.rejects(createAnimal('Ternak invalid', 'sapi', -1, 10))
assert.throws(() => normalizeLivestock({ species: 'invalid' }))
check(
  'negative stock, fractional heads, invalid species and foreign-business changes rejected',
)
await db.updateCatalogProduct(
  accountA.user.id,
  cow.id,
  { livestock: { species: 'sapi', breed: 'Limousin', pen: 'Kandang B' } },
  a.id,
)
assert.equal(
  (await db.getSnapshot(a.id, accountA.user.id)).catalog.find(
    (x) => x.id === cow.id,
  ).livestock.pen,
  'Kandang B',
)
const animalSale = await db.createTransaction(accountA.user.id, {
  businessId: a.id,
  productId: cow.id,
  qty: 2,
})
assert.equal(animalSale.transaction.total, 50000000)
assert.equal(animalSale.catalog.find((x) => x.id === cow.id).stock, 19)
check(
  'livestock edits persist and sales use the same inventory and revenue calculation',
)
const { getSystemInstruction } = await import('../lib/ai-prompts.ts')
assert.ok(
  getSystemInstruction(await db.getSnapshot(a.id, accountA.user.id)).includes(
    '19 ekor',
  ),
)
check('AI receives live livestock species, pen and counts in heads')

await assert.rejects(
  db.createTransaction(accountA.user.id, {
    businessId: a.id,
    productId: cow.id,
    qty: 1.5,
  }),
)
await assert.rejects(
  db.updateCatalogProduct(accountA.user.id, cow.id, { unitPrice: -1 }, a.id),
)
check('livestock sales reject fractional quantities and negative price updates')

const token = await auth.createSessionToken(accountA.user, 0)
assert.equal((await auth.verifySessionToken(token))?.id, accountA.user.id)
await users.changePassword(
  accountA.user.id,
  'local-test-1234',
  'new-local-test-1234',
)
assert.equal(await auth.verifySessionToken(token), null)
check('JWT compatibility and password change revokes old session')
const afterHashes = await Promise.all(
  ['data/business-db.json', 'data/users.json'].map(async (path) =>
    readFile(resolve(project, path))
      .then((bytes) => createHash('sha256').update(bytes).digest('hex'))
      .catch((error) => {
        if (error.code === 'ENOENT') return null
        throw error
      }),
  ),
)
assert.deepEqual(afterHashes, hashes)
check('recovered account and business files remain byte-for-byte unchanged')
process.chdir(project)
await writeFile(
  resolve(project, '.verification/results.json'),
  JSON.stringify(
    { checks, passed: checks.length, externalRequests: 0 },
    null,
    2,
  ),
)
console.log(
  JSON.stringify(
    {
      passed: checks.length,
      checks: checks.map((x) => x.name),
      externalRequests: 0,
    },
    null,
    2,
  ),
)
