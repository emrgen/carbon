import {useEffect, useMemo} from "react";
import {useLocation} from "react-router-dom";
import {keys} from "lodash";
import {useSidebarStore} from "@/pages/store.ts";

// map Routes to keys
export const Routes = {
  "/": "home",
  '/payment': 'payment',
  '/task': 'task',
  '/contact': 'contact',
  '/customer': 'customer',
  "/post": "post",
  '/account': 'account',
  '/cart': 'cart',
  '/category': 'category',
  '/brand': 'brand',
  '/compare': 'compare',
  '/dashboard': 'dashboard',
  '/estimate': 'estimate',
  '/history': 'history',
  '/inventory': 'inventory',
  '/location': 'location',
  '/member': 'member',
  '/order': 'order',
  '/product': 'product',
  '/purchase': 'purchase',
  '/purchase-order': 'purchase-order',
  '/purchase-price': 'purchase-price',
  '/purchase-price-list': 'purchase-price-list',
  '/selling-price-list': 'selling-price-list',
  '/missing': 'missing',
  '/selling-price': 'selling-price',
  '/short': 'short',
  '/stats': 'stats',
  '/warehouse': 'warehouse',
  '/unit': 'unit',
  '/variation': 'variation',
  '/vendor': 'vendor',
  '/settings': 'settings',
  '/inventory-product': 'inventory-product',
  '/transfer': 'transfer',
  '/transfer-order': 'transfer-order',
  '/store': 'store',
  '/dispatch': 'dispatch',
  '/drive': 'drive',
}


export const useSidebarActiveKey = () => {
  const location = useLocation();
  const setActiveKey = useSidebarStore((state) => state.setActiveKey);

  const activeKey = useMemo(() => {
    const {pathname} = location
    return keys(Routes).sort((a, b) => b.length - a.length).find((route) => pathname.startsWith(route)) ?? '/'
  }, [location]);

  useEffect(() => {
    setActiveKey(activeKey)
  }, [activeKey]);

  return activeKey;
};
