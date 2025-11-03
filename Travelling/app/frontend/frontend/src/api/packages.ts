import axios from 'axios'
import api, { Destination } from '../lib/api'

export interface TravelPackage {
  packageId: number
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
  createdAt: string
  destinations: Destination[]
}

export interface CreateTravelPackageRequest {
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
  destinationIds: number[]
}

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const responseMessage = (error.response?.data as { message?: string } | undefined)?.message
    if (responseMessage && responseMessage.trim().length > 0) {
      return responseMessage
    }
    if (error.message) {
      return error.message
    }
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

export const getPackages = async (): Promise<TravelPackage[]> => {
  try {
    const response = await api.get<TravelPackage[]>('/api/packages')
    return response.data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch travel packages.'))
  }
}

export const getPackageById = async (id: number): Promise<TravelPackage> => {
  try {
    const response = await api.get<TravelPackage>(`/api/packages/${id}`)
    return response.data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch the travel package.'))
  }
}

export const createPackage = async (data: CreateTravelPackageRequest): Promise<TravelPackage> => {
  try {
    const response = await api.post<TravelPackage>('/api/packages', data)
    return response.data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create the travel package.'))
  }
}
