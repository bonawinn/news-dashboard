import { createContext, useContext } from 'react'

interface NavigationContextType {
  navigateToCompany: (ticker: string) => void
  navigateBack: () => void
}

export const NavigationContext = createContext<NavigationContextType>({
  navigateToCompany: () => {},
  navigateBack: () => {},
})

export function useNavigation() {
  return useContext(NavigationContext)
}
