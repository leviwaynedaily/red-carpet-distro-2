import { useState, useEffect } from "react";
import { ProductGrid } from "@/components/ProductGrid";
import { AgeVerification } from "@/components/AgeVerification";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "@/components/Header";

const Index = () => {
  console.log('Index: Rendering Index component');
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("name-asc");
  const [isVerified, setIsVerified] = useState(() => {
    return localStorage.getItem('isAgeVerified') === 'true';
  });
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isVerified) {
      console.log('Index: Resetting scroll position after verification');
      window.scrollTo(0, 0);
    }
  }, [isVerified]);

  const handleVerification = () => {
    console.log('Index: Age verification successful');
    setIsVerified(true);
  };

  const handleSearchChange = (value: string) => {
    console.log('Index: Search term changed:', value);
    setSearchTerm(value);
  };

  const handleCategoryChange = (values: string[]) => {
    console.log('Index: Category filter changed:', values);
    setCategoryFilter(values);
  };

  const handleSortChange = (value: string) => {
    console.log('Index: Sort order changed:', value);
    setSortBy(value);
  };

  const handleLogoClick = () => {
    console.log('Index: Logo clicked, clearing verification and refreshing');
    localStorage.removeItem('isAgeVerified');
    setIsVerified(false);
  };

  if (!isVerified) {
    console.log('Index: User not age verified, showing verification prompt');
    return <AgeVerification onVerified={handleVerification} />;
  }

  console.log('Index: Rendering main content');
  return (
    <div className="min-h-screen bg-background">
      <Header
        isSticky={true}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        categoryFilter={categoryFilter}
        onCategoryChange={handleCategoryChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onLogoClick={handleLogoClick}
      />
      <main className="container mx-auto px-4 pt-[calc(theme(spacing.24)+theme(spacing.4))] md:pt-[calc(theme(spacing.32)+theme(spacing.4))]">
        <ProductGrid
          searchTerm={searchTerm}
          categoryFilter={categoryFilter}
          sortBy={sortBy}
        />
      </main>
    </div>
  );
};

export default Index;