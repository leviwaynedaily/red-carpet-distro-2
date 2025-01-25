import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HeaderProps {
  isSticky: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string[];
  onCategoryChange: (value: string[]) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  onLogoClick: () => void;
}

export const Header = ({
  isSticky,
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  sortBy,
  onSortChange,
  onLogoClick,
}: HeaderProps) => {
  const [tempSearchTerm, setTempSearchTerm] = useState(searchTerm);
  const [headerColor, setHeaderColor] = useState('#FFFFFF');
  const [headerOpacity, setHeaderOpacity] = useState(1);
  const [toolbarColor, setToolbarColor] = useState('#FFFFFF');
  const [toolbarOpacity, setToolbarOpacity] = useState(1);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUrlWebp, setLogoUrlWebp] = useState('');
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchHeaderSettings = async () => {
      try {
        const { data: settings, error } = await supabase
          .from('site_settings')
          .select('header_color, header_opacity, logo_url, logo_url_webp, toolbar_color, toolbar_opacity')
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching header settings:', error);
          return;
        }
        
        if (settings) {
          console.log('Header: Fetched settings:', settings);
          setHeaderColor(settings.header_color || '#FFFFFF');
          setHeaderOpacity(settings.header_opacity || 1);
          setToolbarColor(settings.toolbar_color || '#FFFFFF');
          setToolbarOpacity(settings.toolbar_opacity || 1);
          setLogoUrl(settings.logo_url || '');
          setLogoUrlWebp(settings.logo_url_webp || '');
        }
      } catch (error) {
        console.error('Error in fetchHeaderSettings:', error);
      }
    };

    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');

        if (error) {
          console.error('Error fetching categories:', error);
          return;
        }

        if (data) {
          console.log('Header: Fetched categories:', data);
          const formattedCategories = data.map(category => ({
            value: category.name.toLowerCase(),
            label: category.name
          }));
          setCategories(formattedCategories);
        }
      } catch (error) {
        console.error('Error in fetchCategories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchHeaderSettings();
    fetchCategories();
  }, []);

  useEffect(() => {
    setTempSearchTerm(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearchChange(tempSearchTerm);
      console.log('Searching for:', tempSearchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [tempSearchTerm, onSearchChange]);

  const headerStyle = {
    backgroundColor: headerColor ? `${headerColor}${Math.round(headerOpacity * 255).toString(16).padStart(2, '0')}` : '#FFFFFF',
  };

  const toolbarStyle = {
    backgroundColor: toolbarColor ? `${toolbarColor}${Math.round(toolbarOpacity * 255).toString(16).padStart(2, '0')}` : '#FFFFFF',
  };

  const FilterControls = () => (
    <>
      {!isLoadingCategories && categories.length > 0 && (
        <MultiSelect
          options={categories}
          value={categoryFilter}
          onChange={onCategoryChange}
          placeholder="Select categories"
        />
      )}
      <Select value={sortBy} onValueChange={(value) => {
        onSortChange(value);
        if (isMobile) setIsSheetOpen(false);
      }}>
        <SelectTrigger className="w-full md:w-[150px] bg-white/80">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name-asc">Name (A-Z)</SelectItem>
          <SelectItem value="name-desc">Name (Z-A)</SelectItem>
          <SelectItem value="strain-asc">Strain (A-Z)</SelectItem>
          <SelectItem value="strain-desc">Strain (Z-A)</SelectItem>
          <SelectItem value="price-asc">Price (Low to High)</SelectItem>
          <SelectItem value="price-desc">Price (High to Low)</SelectItem>
          <SelectItem value="date-desc">Newest First</SelectItem>
          <SelectItem value="date-asc">Oldest First</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 w-full shadow-sm pt-[env(safe-area-inset-top)]" 
      style={headerStyle}
    >
      <div className="w-full">
        <div className="flex items-center justify-center px-4 md:px-6 py-2 md:py-3 backdrop-blur-sm bg-white/10">
          <picture>
            {logoUrlWebp && (
              <source 
                srcSet={logoUrlWebp} 
                type="image/webp" 
                onError={(e) => {
                  console.log('WebP logo failed to load, falling back to PNG');
                }}
              />
            )}
            <img
              src={logoUrl}
              alt="Palmtree Smokes"
              className="h-10 md:h-14 cursor-pointer transition-transform duration-200 hover:scale-105"
              onClick={onLogoClick}
              onError={(e) => {
                console.error('Failed to load logo:', e);
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </picture>
        </div>
        <div className="border-t border-gray-200/30 backdrop-blur-sm" style={toolbarStyle}>
          <div className="container mx-auto px-4 py-1.5">
            <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
              <div className="flex-1">
                <Input
                  placeholder="Search products..."
                  value={tempSearchTerm}
                  onChange={(e) => setTempSearchTerm(e.target.value)}
                  className="w-full bg-white/80"
                />
              </div>
              {isMobile ? (
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[300px]">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 mt-4">
                      <FilterControls />
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <div className="hidden md:flex gap-4">
                  <FilterControls />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};