"use client";

import { useShop } from "@/context/ShopContext";
import MenuImageModal from "@/components/common/MenuImageModal";

export default function MenuImageModalWrapper() {
  const { isMenuImageOpen, setIsMenuImageOpen } = useShop();
  return (
    <MenuImageModal
      isOpen={isMenuImageOpen}
      onClose={() => setIsMenuImageOpen(false)}
    />
  );
}
