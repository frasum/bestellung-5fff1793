import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useArticles, useCreateArticle, useUpdateArticle, useDeleteArticle, Article, ArticleInput } from '@/hooks/useArticles';
import { useSuppliers } from '@/hooks/useSuppliers';
import { Plus, Pencil, Trash2, Search, ShoppingCart, Minus, Loader2, Package } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge } from '@/components/ui/badge';

const articleSchema = z.object({
  supplier_id: z.string().min(1, 'Please select a supplier'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  price: z.string().min(1, 'Price is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Price must be a positive number'),
  category: z.string().optional(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'box', 'bunch', 'pack'];
const CATEGORIES = ['Vegetables', 'Fruits', 'Dairy', 'Meat', 'Seafood', 'Bakery', 'Beverages', 'Oils', 'Herbs', 'Cheese', 'Other'];

const Articles = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { addItem, updateQuantity, items: cartItems, getItemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);

  const { data: articles, isLoading } = useArticles();
  const { data: suppliers } = useSuppliers();
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const deleteArticle = useDeleteArticle();

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: { supplier_id: '', name: '', description: '', sku: '', unit: 'pcs', price: '', category: '' },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (editingArticle) {
      form.reset({
        supplier_id: editingArticle.supplier_id,
        name: editingArticle.name,
        description: editingArticle.description || '',
        sku: editingArticle.sku || '',
        unit: editingArticle.unit,
        price: String(editingArticle.price),
        category: editingArticle.category || '',
      });
    } else {
      form.reset({ supplier_id: '', name: '', description: '', sku: '', unit: 'pcs', price: '', category: '' });
    }
  }, [editingArticle, form]);

  const handleSubmit = async (data: ArticleFormData) => {
    const input: ArticleInput = {
      supplier_id: data.supplier_id,
      name: data.name,
      description: data.description || undefined,
      sku: data.sku || undefined,
      unit: data.unit,
      price: Number(data.price),
      category: data.category || undefined,
    };

    if (editingArticle) {
      await updateArticle.mutateAsync({ id: editingArticle.id, ...input });
    } else {
      await createArticle.mutateAsync(input);
    }
    setIsDialogOpen(false);
    setEditingArticle(null);
    form.reset();
  };

  const handleDelete = async () => {
    if (deletingArticle) {
      await deleteArticle.mutateAsync(deletingArticle.id);
      setDeletingArticle(null);
    }
  };

  const getCartQuantity = (articleId: string) => {
    const item = cartItems.find((i) => i.article.id === articleId);
    return item?.quantity || 0;
  };

  const filteredArticles = articles?.filter((article) => {
    const matchesSearch = article.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSupplier = selectedSupplier === 'all' || article.supplier_id === selectedSupplier;
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesSupplier && matchesCategory;
  });

  const categories = [...new Set(articles?.map((a) => a.category).filter(Boolean) || [])];

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Articles</h1>
            <p className="text-muted-foreground mt-1">Browse and manage your product catalog</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/cart')} className="relative">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart
              {getItemCount() > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {getItemCount()}
                </Badge>
              )}
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingArticle(null);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Article
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingArticle ? 'Edit Article' : 'Add New Article'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Supplier *</Label>
                    <Controller
                      name="supplier_id"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="bg-card">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border border-border z-50">
                            {suppliers?.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.supplier_id && (
                      <p className="text-sm text-destructive">{form.formState.errors.supplier_id.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" {...form.register('name')} placeholder="San Marzano Tomatoes" />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" {...form.register('description')} placeholder="Premium Italian tomatoes" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (€) *</Label>
                      <Input id="price" type="number" step="0.01" {...form.register('price')} placeholder="4.50" />
                      {form.formState.errors.price && (
                        <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Unit *</Label>
                      <Controller
                        name="unit"
                        control={form.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="bg-card">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border border-border z-50">
                              {UNITS.map((unit) => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input id="sku" {...form.register('sku')} placeholder="TOM-001" />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Controller
                        name="category"
                        control={form.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <SelectTrigger className="bg-card">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border border-border z-50">
                              {CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => {
                      setIsDialogOpen(false);
                      setEditingArticle(null);
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={createArticle.isPending || updateArticle.isPending}>
                      {(createArticle.isPending || updateArticle.isPending) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : editingArticle ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger className="w-full sm:w-48 bg-card">
              <SelectValue placeholder="All Suppliers" />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border z-50">
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers?.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-40 bg-card">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border z-50">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredArticles?.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || selectedSupplier !== 'all' || selectedCategory !== 'all'
                ? 'No articles found matching your filters'
                : 'No articles yet. Add your first article to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredArticles?.map((article) => {
              const cartQty = getCartQuantity(article.id);
              return (
                <div
                  key={article.id}
                  className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{article.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {article.suppliers?.name}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingArticle(article);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeletingArticle(article)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {article.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{article.description}</p>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    {article.category && (
                      <Badge variant="secondary" className="text-xs">{article.category}</Badge>
                    )}
                    {article.sku && (
                      <span className="text-xs text-muted-foreground">SKU: {article.sku}</span>
                    )}
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-foreground">
                        €{Number(article.price).toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">/{article.unit}</span>
                    </div>

                    {cartQty > 0 ? (
                      <div className="flex items-center justify-between bg-muted rounded-lg p-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(article.id, cartQty - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-medium text-foreground">{cartQty}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => addItem(article, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button className="w-full" onClick={() => addItem(article, 1)}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingArticle} onOpenChange={() => setDeletingArticle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingArticle?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteArticle.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Articles;
