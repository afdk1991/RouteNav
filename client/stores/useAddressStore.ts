import { create } from 'zustand'

export interface Address {
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  isStart?: boolean
  isEnd?: boolean
  order?: number
  createdAt: string
}

interface AddressState {
  addresses: Address[]
  selectedIds: number[]
  isLoading: boolean
  setAddresses: (addresses: Address[]) => void
  setSelectedIds: (ids: number[]) => void
  toggleSelected: (id: number) => void
  selectAll: () => void
  clearSelection: () => void
  addAddress: (address: Address) => void
  updateAddress: (id: number, data: Partial<Address>) => void
  removeAddress: (id: number) => void
}

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  selectedIds: [],
  isLoading: false,

  setAddresses: (addresses) => set({ addresses }),

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  toggleSelected: (id) => {
    const { selectedIds } = get()
    if (selectedIds.includes(id)) {
      set({ selectedIds: selectedIds.filter(i => i !== id) })
    } else {
      set({ selectedIds: [...selectedIds, id] })
    }
  },

  selectAll: () => {
    const { addresses } = get()
    set({ selectedIds: addresses.map(a => a.id) })
  },

  clearSelection: () => set({ selectedIds: [] }),

  addAddress: (address) => set(state => ({
    addresses: [...state.addresses, address]
  })),

  updateAddress: (id, data) => set(state => ({
    addresses: state.addresses.map(a => 
      a.id === id ? { ...a, ...data } : a
    )
  })),

  removeAddress: (id) => set(state => ({
    addresses: state.addresses.filter(a => a.id !== id),
    selectedIds: state.selectedIds.filter(i => i !== id)
  }))
}))
