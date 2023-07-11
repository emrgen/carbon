import { useCallback, useState } from 'react';

export const useDisclosure = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const onClose = useCallback(() => setIsOpen(false), []);
  const onOpen = useCallback(() => setIsOpen(true), []);
  const onToggle = useCallback(() => setIsOpen((prevState) => !prevState), []);

  return {
    isOpen,
    onClose,
    onOpen,
    onToggle,
  }
}
