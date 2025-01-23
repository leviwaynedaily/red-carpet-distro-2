import { Tables } from "@/integrations/supabase/types";
import Papa from 'papaparse';

type Product = Tables<"products">;

export const exportProducts = (products: Product[]) => {
  const csv = Papa.unparse(products);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'products.csv';
  link.click();
};

export const downloadTemplate = () => {
  const template = [
    {
      name: '',
      description: '',
      strain: '',
      stock: '',
      regular_price: '',
      shipping_price: '',
    }
  ];
  const csv = Papa.unparse(template);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'products_template.csv';
  link.click();
};

export const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};