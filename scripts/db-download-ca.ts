import { databaseCaPath, databaseCaFingerprint } from './database-ca'
console.log(`Official database CA: ${await databaseCaPath()}; SHA256 ${databaseCaFingerprint}`)
