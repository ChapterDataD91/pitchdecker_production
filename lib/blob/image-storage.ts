// ---------------------------------------------------------------------------
// Azure Blob Storage client for image uploads.
// Container: pitchdecker-uploads (private — read access via per-blob SAS).
// Pattern mirrors cicero_mcp/src/storage/blob.ts — singleton + lazy init.
// ---------------------------------------------------------------------------

import {
  BlobServiceClient,
  BlobSASPermissions,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  type ContainerClient,
} from '@azure/storage-blob'
import crypto from 'crypto'

const CONTAINER_NAME = 'pitchdecker-uploads'
const SAS_EXPIRY_DAYS = 365 // 1 year

let serviceClient: BlobServiceClient | null = null
let containerClient: ContainerClient | null = null
let containerEnsured = false
let sharedKeyCredential: StorageSharedKeyCredential | null = null

function getConnectionString(): string {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is required')
  }
  return connectionString
}

function getSharedKeyCredential(): StorageSharedKeyCredential {
  if (!sharedKeyCredential) {
    const connectionString = getConnectionString()
    const accountName = connectionString.match(/AccountName=([^;]+)/)?.[1]
    const accountKey = connectionString.match(/AccountKey=([^;]+)/)?.[1]
    if (!accountName || !accountKey) {
      throw new Error('Could not parse account name/key from connection string')
    }
    sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
  }
  return sharedKeyCredential
}

function getServiceClient(): BlobServiceClient {
  if (!serviceClient) {
    serviceClient = BlobServiceClient.fromConnectionString(getConnectionString())
  }
  return serviceClient
}

function getContainerClient(): ContainerClient {
  if (!containerClient) {
    containerClient = getServiceClient().getContainerClient(CONTAINER_NAME)
  }
  return containerClient
}

async function ensureContainer(): Promise<void> {
  if (containerEnsured) return
  await getContainerClient().createIfNotExists() // private (default)
  containerEnsured = true
}

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/**
 * Upload an image to blob storage and return a read-only SAS URL.
 *
 * Blob path: `{deckId}/{field}-{hash}.{ext}`
 * Same content → same hash → same path (idempotent).
 * SAS: read-only, single-blob scope, 1-year expiry.
 */
export async function uploadImage(
  deckId: string,
  field: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  await ensureContainer()

  const ext = EXT_MAP[contentType]
  if (!ext) throw new Error(`Unsupported content type: ${contentType}`)

  const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 8)
  const blobPath = `${deckId}/${field}-${hash}.${ext}`

  const blockBlob = getContainerClient().getBlockBlobClient(blobPath)
  await blockBlob.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  })

  // Generate a read-only SAS scoped to this single blob
  const expiresOn = new Date()
  expiresOn.setDate(expiresOn.getDate() + SAS_EXPIRY_DAYS)

  const sasParams = generateBlobSASQueryParameters(
    {
      containerName: CONTAINER_NAME,
      blobName: blobPath,
      permissions: BlobSASPermissions.parse('r'),
      expiresOn,
      protocol: SASProtocol.Https,
    },
    getSharedKeyCredential(),
  )

  return `${blockBlob.url}?${sasParams.toString()}`
}
