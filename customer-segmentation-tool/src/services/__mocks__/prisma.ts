import { beforeEach } from '@jest/globals'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

import { PrismaClient } from '@prisma/client'

export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>

beforeEach(() => {
  mockReset(prismaMock)
})