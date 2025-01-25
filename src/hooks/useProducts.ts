import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      console.log('useProducts: Starting to fetch all products');
      
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select('*');

      if (productsError) {
        console.error('useProducts: Error fetching products:', productsError);
        throw productsError;
      }

      console.log('useProducts: Products data:', productsData);
      return productsData;
    },
  });
};