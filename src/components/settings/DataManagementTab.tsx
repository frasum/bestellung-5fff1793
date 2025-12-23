import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileSpreadsheet, Users, Package } from 'lucide-react';
import { ExportMenu } from '@/components/ExportMenu';
import { CsvImportDialog } from '@/components/CsvImportDialog';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useArticles } from '@/hooks/useArticles';
import { useImportSuppliers, useImportArticles } from '@/hooks/useImport';
import { SUPPLIER_IMPORT_FIELDS, ARTICLE_IMPORT_FIELDS } from '@/components/suppliers/constants';
import { Separator } from '@/components/ui/separator';

export const DataManagementTab = () => {
  const { t } = useTranslation();
  const [isSupplierImportOpen, setIsSupplierImportOpen] = useState(false);
  const [isArticleImportOpen, setIsArticleImportOpen] = useState(false);

  const { data: suppliers } = useSuppliers();
  const { data: articles } = useArticles();
  const importSuppliers = useImportSuppliers();
  const importArticles = useImportArticles();

  return (
    <div className="space-y-6">
      {/* Suppliers Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Lieferanten</CardTitle>
          </div>
          <CardDescription>
            Exportiere oder importiere deine Lieferantendaten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <ExportMenu
              filename="suppliers"
              title="Lieferanten"
              headers={['Name', 'Email', 'Telefon', 'Adresse', 'Ansprechpartner', 'Kundennummer', 'Status']}
              getData={() =>
                suppliers?.map((s) => [
                  s.name,
                  s.email,
                  s.phone || '',
                  s.address || '',
                  s.contact_person || '',
                  s.customer_number || '',
                  s.is_active ? 'Aktiv' : 'Inaktiv',
                ]) || []
              }
              disabled={!suppliers?.length}
            />
            <Button variant="outline" onClick={() => setIsSupplierImportOpen(true)}>
              <Download className="w-4 h-4 mr-2" />
              Lieferanten importieren
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {suppliers?.length || 0} Lieferanten vorhanden
          </p>
        </CardContent>
      </Card>

      {/* Articles Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Artikel</CardTitle>
          </div>
          <CardDescription>
            Exportiere oder importiere deine Artikeldaten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <ExportMenu
              filename="articles"
              title="Artikel"
              headers={[
                'Artikelname',
                'SKU',
                'Beschreibung',
                'Lieferant',
                'Kategorie',
                'Oberkategorie',
                'Einheit',
                'VPE',
                'Einkaufspreis',
                'Verkaufspreis',
                'Ref.-Preis',
                'Ref.-Einheit',
                'Herkunftsland',
                'Rebsorte',
                'Geschmacksprofil',
                'Speiseempfehlung',
                'Status',
              ]}
              getData={() =>
                articles?.map((a) => {
                  const supplier = suppliers?.find((s) => s.id === a.supplier_id);
                  return [
                    a.name,
                    a.sku || '',
                    a.description || '',
                    supplier?.name || '',
                    a.category || '',
                    a.top_category || '',
                    a.unit,
                    a.packaging_unit?.toString() || '',
                    a.price.toFixed(2).replace('.', ','),
                    a.selling_price?.toFixed(2).replace('.', ',') || '',
                    a.reference_price?.toFixed(2).replace('.', ',') || '',
                    a.reference_unit || '',
                    a.origin_country || '',
                    a.grape_variety || '',
                    a.flavor_profile || '',
                    a.food_pairings || '',
                    a.is_active ? 'Aktiv' : 'Inaktiv',
                  ];
                }) || []
              }
              disabled={!articles?.length}
            />
            <Button variant="outline" onClick={() => setIsArticleImportOpen(true)}>
              <Download className="w-4 h-4 mr-2" />
              Artikel importieren
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {articles?.length || 0} Artikel vorhanden
          </p>
        </CardContent>
      </Card>

      {/* Import Dialogs */}
      <CsvImportDialog
        open={isSupplierImportOpen}
        onOpenChange={setIsSupplierImportOpen}
        title="Lieferanten importieren"
        fields={SUPPLIER_IMPORT_FIELDS}
        onImport={async (data) => {
          await importSuppliers.mutateAsync(data);
        }}
        templateFileName="suppliers_template.csv"
      />

      <CsvImportDialog
        open={isArticleImportOpen}
        onOpenChange={setIsArticleImportOpen}
        title="Artikel importieren"
        fields={ARTICLE_IMPORT_FIELDS}
        onImport={async (data) => {
          await importArticles.mutateAsync({
            articles: data,
            defaultSupplierId: suppliers?.[0]?.id || '',
          });
        }}
        templateFileName="articles_template.csv"
      />
    </div>
  );
};
