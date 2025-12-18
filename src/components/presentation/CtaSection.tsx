import { useEffect, useState } from 'react';
import { Rocket, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { generateSystemOverviewPdf } from '@/lib/systemOverviewPdf';

export const CtaSection = () => {
  const navigate = useNavigate();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    QRCode.toDataURL('https://bestellung.pro/onboarding/questions', {
      width: 200,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    })
      .then(setQrCodeUrl)
      .catch(console.error);
  }, []);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateSystemOverviewPdf();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <section id="cta" className="py-20 bg-gradient-to-br from-primary to-primary/80">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 flex items-center justify-center gap-3">
            <Rocket className="h-10 w-10" />
            Jetzt kostenlos testen
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-12">
            Überzeugen Sie sich selbst – 7 Tage gratis, keine Kreditkarte nötig
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-12">
            {/* QR Code */}
            <div className="bg-white p-4 rounded-xl shadow-lg">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
              ) : (
                <div className="w-40 h-40 bg-muted animate-pulse rounded" />
              )}
            </div>

            {/* Info */}
            <div className="text-left">
              <p className="text-primary-foreground/80 mb-4">
                Scannen oder besuchen Sie:
              </p>
              <p className="text-2xl font-bold text-primary-foreground mb-6">
                bestellung.pro/demo
              </p>

              <ul className="space-y-3">
                {[
                  '7 Tage kostenlos',
                  'Vorgefüllte Demo-Daten',
                  'Alle Funktionen verfügbar',
                  'Später in echtes Konto umwandeln',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-primary-foreground">
                    <Check className="h-5 w-5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-6"
              onClick={() => navigate('/onboarding/questions')}
            >
              <Rocket className="mr-2 h-5 w-5" />
              Demo starten
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
            >
              <Download className="mr-2 h-5 w-5" />
              {isGeneratingPdf ? 'Wird erstellt...' : 'PDF herunterladen'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
